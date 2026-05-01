/**
 * Admin gate for inbound WhatsApp messages.
 *
 * Every inbound webhook calls `tryHandleAdminMessage()` first. If the
 * sender's phone matches a row in `wedding_bot_admins`, we route the
 * message to the admin handler (which can update the website, create
 * tasks, modify the knowledge bank, answer queries, etc.) and write a
 * `bot_admin_log` row tracking the action's status.
 *
 * Returns null when the sender isn't a registered admin — callers fall
 * back to the existing guest-concierge flow.
 *
 * Storage:
 *   wedding_bot_admins  — phone allowlist per wedding (slug-keyed)
 *   bot_admin_log       — append-only audit feed shown in the Admin tab
 */
/* eslint-disable @typescript-eslint/no-explicit-any -- new tables not in generated supabase types */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { handleAdminCommand, type AdminHandlerResult } from './admin-handler';

export const ADMIN_REPLY_PREFIX = '🛠️ *ADMIN BOT*\n\n';

interface BotAdminRow {
  id: string;
  wedding_id: string;
  name: string;
  phone: string;
}

/** Service-role client — RLS bypass so the gate can work outside any user session. */
function serviceClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

/**
 * Try matching a phone against several common formats. Webhook senders
 * arrive as bare digits (`13177302557`); admins may have been saved as
 * `+13177302557`. We also fall back to a last-10-digit ILIKE for
 * shorter local-format entries.
 */
async function findAdminByPhone(
  supabase: SupabaseClient,
  rawSenderPhone: string,
): Promise<BotAdminRow | null> {
  const digits = rawSenderPhone.replace(/\D/g, '');
  if (!digits) return null;

  const variants = Array.from(
    new Set([
      `+${digits}`,
      digits,
      `+${digits.slice(-10)}`,
      digits.slice(-10),
    ]),
  );

  const { data: exact } = await (supabase as any)
    .from('wedding_bot_admins')
    .select('id, wedding_id, name, phone')
    .in('phone', variants)
    .limit(1);
  if (exact && exact.length > 0) return exact[0] as BotAdminRow;

  const last10 = digits.slice(-10);
  if (last10.length === 10) {
    const { data: fuzzy } = await (supabase as any)
      .from('wedding_bot_admins')
      .select('id, wedding_id, name, phone')
      .ilike('phone', `%${last10}`)
      .limit(1);
    if (fuzzy && fuzzy.length > 0) return fuzzy[0] as BotAdminRow;
  }
  return null;
}

/**
 * Open a `bot_admin_log` row in `pending` so the activity feed shows the
 * inbound immediately, then return its id so the handler can promote it
 * to success/failed once execution completes.
 */
async function openLogEntry(
  supabase: SupabaseClient,
  args: {
    weddingSlug: string;
    admin: BotAdminRow;
    inboundText: string;
  },
): Promise<string | null> {
  const summary = args.inboundText.slice(0, 240) || '(empty message)';
  try {
    const { data, error } = await (supabase as any)
      .from('bot_admin_log')
      .insert({
        wedding_id: args.weddingSlug,
        admin_phone: args.admin.phone,
        admin_name: args.admin.name,
        action_type: 'inbound',
        summary,
        status: 'pending',
      })
      .select('id')
      .single();
    if (error) {
      console.error('[admin-router] openLogEntry failed:', error.message);
      return null;
    }
    return data?.id ?? null;
  } catch (err) {
    console.error('[admin-router] openLogEntry threw:', err);
    return null;
  }
}

async function closeLogEntry(
  supabase: SupabaseClient,
  logId: string | null,
  result: AdminHandlerResult,
) {
  if (!logId) return;
  try {
    await (supabase as any)
      .from('bot_admin_log')
      .update({
        action_type: result.actionType,
        summary: result.summary,
        status: result.status,
        error_message: result.errorMessage ?? null,
        details: result.details ?? null,
        completed_at: new Date().toISOString(),
      })
      .eq('id', logId);
  } catch (err) {
    console.error('[admin-router] closeLogEntry failed:', err);
  }
}

export interface AdminRouterResult {
  reply: string;
  weddingSlug: string;
  adminName: string;
  logId: string | null;
}

/**
 * Main entry: returns a prefixed reply if the sender is an admin, else
 * `null`. Callers should send the returned reply back over WhatsApp and
 * skip the guest pipeline.
 */
export async function tryHandleAdminMessage(args: {
  senderPhone: string;
  messageText: string;
  /** Optional Whapi-supplied profile name — used as a soft fallback when admin row name is empty. */
  senderProfileName?: string;
}): Promise<AdminRouterResult | null> {
  const supabase = serviceClient();
  const admin = await findAdminByPhone(supabase, args.senderPhone);
  if (!admin) return null;

  const weddingSlug = admin.wedding_id;
  const logId = await openLogEntry(supabase, {
    weddingSlug,
    admin,
    inboundText: args.messageText,
  });

  let result: AdminHandlerResult;
  try {
    result = await handleAdminCommand({
      weddingSlug,
      adminName: admin.name || args.senderProfileName || 'Admin',
      adminPhone: admin.phone,
      messageText: args.messageText,
      supabase,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    result = {
      replyText: `Something went wrong handling that — ${msg}`,
      summary: `Failed to handle inbound: ${msg}`,
      actionType: 'error',
      status: 'failed',
      errorMessage: msg,
    };
  }

  await closeLogEntry(supabase, logId, result);

  return {
    reply: `${ADMIN_REPLY_PREFIX}${result.replyText}`,
    weddingSlug,
    adminName: admin.name,
    logId,
  };
}

// Exported for tests so they can assert/override behaviour without spinning
// up a full webhook payload.
export const __testing = { findAdminByPhone, openLogEntry, closeLogEntry, serviceClient };
