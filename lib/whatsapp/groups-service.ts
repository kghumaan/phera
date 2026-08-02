/**
 * Wedding WhatsApp group service — operates on a COUPLE'S OWN paired channel.
 *
 * Flow:
 *   1. provisionChannel()  -> create a Whapi Partner channel for the wedding.
 *   2. couple scans the QR (getLoginQrForWedding) -> channel becomes AUTH.
 *   3. createWeddingGuestGroup() -> create the guest group as the couple, mint
 *      an invite link, persist it. We do NOT mass force-add guests (anti-spam +
 *      privacy settings); the agent broadcasts the invite link so guests self-join.
 *   4. teardownChannel() after the wedding -> delete the channel, stop billing.
 *
 * Server-only. The channel token (full WhatsApp access) lives in the
 * service-role-only `wedding_whatsapp_channels` table and never reaches the client.
 */

import { getOpsSupabaseAdmin } from '@/lib/ops/supabase-admin';
import { whapiManager } from '@/lib/whatsapp/whapi-manager';
import { whapiClientForToken } from '@/lib/vendors/whapi-client';

export type ChannelStatus = 'pending' | 'qr' | 'auth' | 'banned' | 'deleted';

export interface WeddingWhatsAppChannel {
  id: string;
  wedding_id: string;
  channel_id: string | null;
  channel_token: string | null;
  status: ChannelStatus;
  paired_phone: string | null;
  group_id: string | null;
  group_link: string | null;
}

/** Client-safe view of a channel — NEVER includes the token. */
export interface ChannelStatusView {
  status: ChannelStatus;
  pairedPhone: string | null;
  groupLink: string | null;
  hasGroup: boolean;
}

const TABLE = 'wedding_whatsapp_channels';

function admin() {
  return getOpsSupabaseAdmin();
}

/** Digits only, no leading '+', as Whapi expects. */
export function normalizePhone(phone: string): string {
  return (phone || '').replace(/\D/g, '');
}

/** Map a raw Whapi /health status text to our channel status enum. */
function mapHealthStatus(text: string | null): ChannelStatus {
  const t = (text || '').toUpperCase();
  if (t.includes('AUTH')) return 'auth';
  if (t.includes('QR')) return 'qr';
  if (t.includes('BAN')) return 'banned';
  return 'pending';
}

function toView(row: WeddingWhatsAppChannel | null): ChannelStatusView {
  if (!row) return { status: 'pending', pairedPhone: null, groupLink: null, hasGroup: false };
  return {
    status: row.status,
    pairedPhone: row.paired_phone,
    groupLink: row.group_link,
    hasGroup: Boolean(row.group_id),
  };
}

export async function getChannelRecord(weddingSlug: string): Promise<WeddingWhatsAppChannel | null> {
  const { data, error } = await admin()
    .from(TABLE)
    .select('*')
    .eq('wedding_id', weddingSlug)
    .maybeSingle();
  if (error) {
    console.error('getChannelRecord error:', error.message);
    return null;
  }
  return (data as WeddingWhatsAppChannel | null) ?? null;
}

/**
 * Provision (or reuse) a Whapi channel for this wedding. Idempotent: if a live
 * channel already exists we return its current status instead of creating a
 * second one. Requires the Whapi Partner API to be configured.
 */
export async function provisionChannel(
  weddingSlug: string,
  channelName: string,
): Promise<ChannelStatusView> {
  if (!whapiManager.configured) {
    throw new Error('Whapi Partner API not configured (WHAPI_PARTNER_TOKEN / WHAPI_PROJECT_ID).');
  }

  const existing = await getChannelRecord(weddingSlug);
  if (existing && existing.channel_token && existing.status !== 'deleted') {
    return refreshAndGetStatus(weddingSlug);
  }

  const { channelId, token } = await whapiManager.createChannel(channelName);
  if (!channelId || !token) {
    throw new Error('Whapi channel creation returned no id/token.');
  }

  const { error } = await admin()
    .from(TABLE)
    .upsert(
      {
        wedding_id: weddingSlug,
        channel_id: channelId,
        channel_token: token,
        status: 'pending',
        deleted_at: null,
      },
      { onConflict: 'wedding_id' },
    );
  if (error) throw new Error(`Persisting channel failed: ${error.message}`);

  return { status: 'pending', pairedPhone: null, groupLink: null, hasGroup: false };
}

/** Re-check the channel's pairing status with Whapi and persist it. */
export async function refreshAndGetStatus(weddingSlug: string): Promise<ChannelStatusView> {
  const row = await getChannelRecord(weddingSlug);
  if (!row || !row.channel_token || row.status === 'deleted') return toView(row);

  try {
    const { status: text } = await whapiClientForToken(row.channel_token).getHealth();
    const status = mapHealthStatus(text);
    if (status !== row.status) {
      await admin().from(TABLE).update({ status }).eq('wedding_id', weddingSlug);
      row.status = status;
    }
  } catch (err) {
    console.error('refreshAndGetStatus health error:', err instanceof Error ? err.message : err);
  }
  return toView(row);
}

/** Base64 login QR for the couple to scan. Returns null if not pairable. */
export async function getLoginQrForWedding(weddingSlug: string): Promise<string | null> {
  const row = await getChannelRecord(weddingSlug);
  if (!row || !row.channel_token || row.status === 'auth' || row.status === 'deleted') return null;
  const { qrBase64 } = await whapiClientForToken(row.channel_token).getLoginQr();
  return qrBase64;
}

/**
 * Create the wedding guest group as the couple's own number. Seeds with one
 * participant (WhatsApp requires ≥1) — Phera's concierge number by default, set
 * via WHATSAPP_GROUP_SEED_PHONE (falls back to COORDINATOR_PHONE_NUMBER). The
 * couple (the paired account) is the group creator/admin. Returns the invite
 * link for the agent to broadcast — we do NOT mass-add guests here.
 */
export async function createWeddingGuestGroup(
  weddingSlug: string,
  opts: { subject: string; seedPhones?: string[] },
): Promise<{ groupId: string; inviteLink: string | null }> {
  const row = await getChannelRecord(weddingSlug);
  if (!row || !row.channel_token) throw new Error('No WhatsApp channel — connect first.');
  if (row.status !== 'auth') throw new Error('WhatsApp not connected yet — scan the QR first.');

  if (row.group_id) {
    // Idempotent: group already exists for this wedding.
    return { groupId: row.group_id, inviteLink: row.group_link };
  }

  const seedRaw =
    opts.seedPhones && opts.seedPhones.length
      ? opts.seedPhones
      : [process.env.WHATSAPP_GROUP_SEED_PHONE || process.env.COORDINATOR_PHONE_NUMBER || ''];
  const participants = seedRaw.map(normalizePhone).filter(Boolean);
  if (!participants.length) {
    throw new Error('No seed participant — set WHATSAPP_GROUP_SEED_PHONE.');
  }

  const client = whapiClientForToken(row.channel_token);
  const { groupId } = await client.createGroup(opts.subject, participants);
  if (!groupId) throw new Error('Group creation returned no id.');

  let inviteLink: string | null = null;
  try {
    inviteLink = await client.getInviteLink(groupId);
  } catch (err) {
    console.error('getInviteLink error:', err instanceof Error ? err.message : err);
  }

  await admin()
    .from(TABLE)
    .update({ group_id: groupId, group_link: inviteLink })
    .eq('wedding_id', weddingSlug);

  // Mirror the link onto wedding_settings so the existing concierge can share it.
  if (inviteLink) {
    const { error } = await admin()
      .from('wedding_settings')
      .update({ whatsapp_group_link: inviteLink })
      .eq('wedding_id', weddingSlug);
    if (error) console.error('mirror group link to wedding_settings failed:', error.message);
  }

  return { groupId, inviteLink };
}

/** Post a message into the wedding's guest group (as the couple). */
export async function postToWeddingGroup(
  weddingSlug: string,
  body: string,
): Promise<{ id: string | null }> {
  const row = await getChannelRecord(weddingSlug);
  if (!row || !row.channel_token) throw new Error('No WhatsApp channel — connect first.');
  if (row.status !== 'auth') throw new Error('WhatsApp not connected.');
  if (!row.group_id) throw new Error('No guest group yet — create it first.');
  const resp = await whapiClientForToken(row.channel_token).sendMessage(row.group_id, body);
  return { id: resp?.message?.id ?? null };
}

/** Tear down the channel after the wedding to stop billing. */
export async function teardownChannel(weddingSlug: string): Promise<void> {
  const row = await getChannelRecord(weddingSlug);
  if (!row) return;
  if (row.channel_id && whapiManager.configured) {
    try {
      await whapiManager.deleteChannel(row.channel_id);
    } catch (err) {
      console.error('deleteChannel error:', err instanceof Error ? err.message : err);
    }
  }
  await admin()
    .from(TABLE)
    .update({ status: 'deleted', channel_token: null, deleted_at: new Date().toISOString() })
    .eq('wedding_id', weddingSlug);
}

/**
 * Send a message 1:1 to each recipient FROM the couple's own paired number
 * (used to broadcast the group join link / personal notes). Sequential to stay
 * gentle on the couple's number — keep audiences sane. Returns counts.
 */
export async function sendDirectFromCouple(
  weddingSlug: string,
  phones: string[],
  message: string,
): Promise<{ sent: number; failed: number }> {
  const row = await getChannelRecord(weddingSlug);
  if (!row || !row.channel_token) throw new Error('No WhatsApp channel — connect first.');
  if (row.status !== 'auth') throw new Error('WhatsApp not connected.');
  const client = whapiClientForToken(row.channel_token);
  let sent = 0;
  let failed = 0;
  for (const phone of phones) {
    const digits = normalizePhone(phone);
    if (!digits) {
      failed++;
      continue;
    }
    try {
      await client.sendMessage(`${digits}@s.whatsapp.net`, message);
      sent++;
    } catch {
      failed++;
    }
  }
  return { sent, failed };
}

export { toView as channelStatusView };
