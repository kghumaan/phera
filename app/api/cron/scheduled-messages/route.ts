import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendWhapiText } from '@/lib/whatsapp/whapi-send';
import { guestMatchesTags } from '@/lib/utils/guest-tags';

/**
 * GET /api/cron/scheduled-messages — send due scheduled broadcasts.
 * Protected by CRON_SECRET. Triggered every ~10 minutes by the GitHub
 * Actions workflow .github/workflows/scheduled-messages-cron.yml (Vercel
 * Hobby is capped at 2 daily crons, both taken).
 *
 * Crash-safe by design:
 *  - Claiming is an atomic status flip (scheduled -> sending), so two
 *    overlapping invocations can't both send the same broadcast.
 *  - Recipient rows are inserted up-front as 'pending' and updated one by
 *    one; a timed-out run resumes from the pending rows on the next tick
 *    (stale 'sending' broadcasts are re-claimed after 10 minutes).
 */

export const maxDuration = 60;

const CLAIM_LIMIT = 3;
const STALE_SENDING_MS = 10 * 60 * 1000;

// Untyped client on purpose: the scheduling columns + audit table aren't in
// the generated database types yet (migration 20260805_scheduled_broadcasts).
function serviceClient(url: string, key: string) {
  return createClient(url, key, { auth: { persistSession: false } });
}
type ServiceClient = ReturnType<typeof serviceClient>;

interface DueBroadcast {
  id: string;
  wedding_id: string;
  message: string;
  target_type: 'all' | 'tags' | 'specific';
  target_tags: string[] | null;
  target_guest_ids: string[] | null;
  sent_count: number;
  failed_count: number;
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return NextResponse.json({ error: 'Service credentials not configured' }, { status: 500 });
  }
  const admin = serviceClient(url, key);

  const nowISO = new Date().toISOString();
  const results = { claimed: 0, resumed: 0, sent: 0, failed: 0, errors: [] as string[] };

  // Fresh due broadcasts.
  const { data: due, error: dueErr } = await admin
    .from('concierge_broadcasts')
    .select('id')
    .eq('status', 'scheduled')
    .eq('enabled', true)
    .lte('scheduled_at', nowISO)
    .order('scheduled_at', { ascending: true })
    .limit(CLAIM_LIMIT);
  if (dueErr) {
    return NextResponse.json({ error: dueErr.message }, { status: 500 });
  }

  // Stale 'sending' rows from a crashed/timed-out run — resume them.
  const staleBefore = new Date(Date.now() - STALE_SENDING_MS).toISOString();
  const { data: stale } = await admin
    .from('concierge_broadcasts')
    .select('id')
    .eq('status', 'sending')
    .not('claimed_at', 'is', null)
    .lt('claimed_at', staleBefore)
    .not('scheduled_at', 'is', null)
    .limit(CLAIM_LIMIT);

  for (const row of (due ?? []) as Array<{ id: string }>) {
    // Atomic claim: only one invocation wins the scheduled -> sending flip.
    const { data: claimed } = await admin
      .from('concierge_broadcasts')
      .update({ status: 'sending', claimed_at: nowISO })
      .eq('id', row.id)
      .eq('status', 'scheduled')
      .eq('enabled', true)
      .select('id, wedding_id, message, target_type, target_tags, target_guest_ids, sent_count, failed_count')
      .maybeSingle();
    if (!claimed) continue;
    results.claimed++;
    await processBroadcast(admin, claimed as unknown as DueBroadcast, results, false);
  }

  for (const row of (stale ?? []) as Array<{ id: string }>) {
    const { data: claimed } = await admin
      .from('concierge_broadcasts')
      .update({ claimed_at: nowISO })
      .eq('id', row.id)
      .eq('status', 'sending')
      .lt('claimed_at', staleBefore)
      .select('id, wedding_id, message, target_type, target_tags, target_guest_ids, sent_count, failed_count')
      .maybeSingle();
    if (!claimed) continue;
    results.resumed++;
    await processBroadcast(admin, claimed as unknown as DueBroadcast, results, true);
  }

  return NextResponse.json(results);
}

async function processBroadcast(
  admin: ServiceClient,
  broadcast: DueBroadcast,
  results: { sent: number; failed: number; errors: string[] },
  isResume: boolean,
) {
  try {
    let pending: Array<{ id: string; guest_id: string; phone: string }> = [];

    if (isResume) {
      // Recipient rows already exist; pick up the ones never attempted.
      const { data } = await admin
        .from('concierge_broadcast_recipients')
        .select('id, guest_id, guests(phone)')
        .eq('broadcast_id', broadcast.id)
        .eq('delivery_status', 'pending');
      pending = ((data ?? []) as unknown as Array<{ id: string; guest_id: string; guests: { phone: string | null } | null }>)
        .filter((r) => r.guests?.phone)
        .map((r) => ({ id: r.id, guest_id: r.guest_id, phone: r.guests!.phone! }));
    } else {
      // Resolve the audience NOW, not at scheduling time — the guest list
      // may have changed since the admin approved the message.
      const { data: guests, error: gErr } = await admin
        .from('guests')
        .select('id, phone, logistics_data')
        .eq('wedding_id', broadcast.wedding_id);
      if (gErr) throw new Error(gErr.message);

      let targets = ((guests ?? []) as Array<{ id: string; phone: string | null; logistics_data: unknown }>).filter(
        (g) => g.phone,
      );
      if (broadcast.target_type === 'tags') {
        targets = targets.filter((g) => guestMatchesTags(g.logistics_data, broadcast.target_tags ?? []));
      } else if (broadcast.target_type === 'specific') {
        const idSet = new Set(broadcast.target_guest_ids ?? []);
        targets = targets.filter((g) => idSet.has(g.id));
      }

      if (!targets.length) {
        await admin
          .from('concierge_broadcasts')
          .update({ status: 'failed', sent_at: new Date().toISOString() })
          .eq('id', broadcast.id);
        await auditSystem(admin, broadcast, 'send_failed', { reason: 'no matching recipients' });
        return;
      }

      const { data: inserted, error: rErr } = await admin
        .from('concierge_broadcast_recipients')
        .upsert(
          targets.map((g) => ({
            broadcast_id: broadcast.id,
            guest_id: g.id,
            wedding_id: broadcast.wedding_id,
            delivery_status: 'pending',
          })),
          { onConflict: 'broadcast_id,guest_id', ignoreDuplicates: true },
        )
        .select('id, guest_id');
      if (rErr) throw new Error(rErr.message);

      const phoneByGuest = new Map(targets.map((g) => [g.id, g.phone!]));
      pending = ((inserted ?? []) as Array<{ id: string; guest_id: string }>)
        .filter((r) => phoneByGuest.has(r.guest_id))
        .map((r) => ({ id: r.id, guest_id: r.guest_id, phone: phoneByGuest.get(r.guest_id)! }));
    }

    let sent = 0;
    let failed = 0;
    for (const r of pending) {
      const result = await sendWhapiText(r.phone, broadcast.message);
      if (result.id) {
        sent++;
        await admin
          .from('concierge_broadcast_recipients')
          .update({ delivery_status: 'sent', whatsapp_message_id: result.id })
          .eq('id', r.id);
      } else {
        failed++;
        await admin
          .from('concierge_broadcast_recipients')
          .update({ delivery_status: 'failed', error_message: result.error || 'Send failed' })
          .eq('id', r.id);
      }
    }

    const totalSent = (broadcast.sent_count ?? 0) + sent;
    const totalFailed = (broadcast.failed_count ?? 0) + failed;
    await admin
      .from('concierge_broadcasts')
      .update({
        status: totalFailed && !totalSent ? 'failed' : 'sent',
        sent_at: new Date().toISOString(),
        sent_count: totalSent,
        failed_count: totalFailed,
      })
      .eq('id', broadcast.id);

    await auditSystem(admin, broadcast, totalSent ? 'sent' : 'send_failed', {
      sent: totalSent,
      failed: totalFailed,
      resumed: isResume,
    });

    results.sent += sent;
    results.failed += failed;
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown error';
    results.errors.push(`${broadcast.id}: ${msg}`);
    console.error('scheduled-messages: broadcast failed', broadcast.id, err);
    // Leave the row in 'sending' — the stale-claim path retries it next tick.
  }
}

async function auditSystem(
  admin: ServiceClient,
  broadcast: DueBroadcast,
  action: 'sent' | 'send_failed',
  details: Record<string, unknown>,
) {
  const { error } = await admin.from('broadcast_audit_log').insert({
    wedding_id: broadcast.wedding_id,
    broadcast_id: broadcast.id,
    actor_user_id: null,
    actor: 'system',
    action,
    details,
  });
  if (error) console.error('scheduled-messages: audit insert failed', error);
}
