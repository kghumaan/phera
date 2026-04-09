import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/**
 * GET /api/outreach/status?weddingId=<slug>
 *
 * Computes the outreach summary from real data across multiple tables.
 * Falls back gracefully when pivot columns/tables don't exist yet.
 */
export async function GET(request: NextRequest) {
  const weddingId = request.nextUrl.searchParams.get('weddingId');
  if (!weddingId) {
    return NextResponse.json({ error: 'weddingId is required' }, { status: 400 });
  }

  try {
    // ── 1. Total guests ──────────────────────────────────────────
    const { data: allGuests, error: guestsErr } = await supabase
      .from('guests')
      .select('id')
      .eq('wedding_id', weddingId);

    if (guestsErr) throw guestsErr;
    const totalGuests = allGuests?.length || 0;
    const guestIds = (allGuests || []).map((g: any) => g.id);

    // ── 2. RSVP counts from rsvps table ──────────────────────────
    let rsvpConfirmed = 0;
    let rsvpDeclined = 0;
    let rsvpMaybe = 0;
    const rsvpedGuestIds = new Set<string>();

    if (guestIds.length > 0) {
      const { data: rsvps } = await supabase
        .from('rsvps')
        .select('guest_id, attending')
        .in('guest_id', guestIds);

      for (const r of (rsvps || []) as any[]) {
        rsvpedGuestIds.add(r.guest_id);
        if (r.attending === 'yes') rsvpConfirmed++;
        else if (r.attending === 'no') rsvpDeclined++;
        else if (r.attending === 'maybe') rsvpMaybe++;
      }
    }

    // ── 3. Outreach status from guests table (best-effort) ───────
    // These columns exist if the pivot migration has been applied.
    let outreachCounts: Record<string, number> = {
      not_contacted: 0,
      save_the_date_sent: 0,
      rsvp_requested: 0,
      rsvp_confirmed: 0,
      travel_collected: 0,
      logistics_complete: 0,
      unresponsive: 0,
    };
    let hasOutreachColumn = false;

    try {
      const { data: outreachGuests, error } = await supabase
        .from('guests')
        .select('outreach_status' as any)
        .eq('wedding_id', weddingId);

      if (!error && outreachGuests) {
        hasOutreachColumn = true;
        for (const g of outreachGuests as any[]) {
          const status = g.outreach_status || 'not_contacted';
          if (status in outreachCounts) outreachCounts[status]++;
        }
      }
    } catch {
      // Column doesn't exist — use fallback below
    }

    // If outreach_status column doesn't exist, derive from RSVP data
    if (!hasOutreachColumn) {
      outreachCounts = {
        not_contacted: totalGuests - rsvpedGuestIds.size,
        save_the_date_sent: 0,
        rsvp_requested: 0,
        rsvp_confirmed: rsvpConfirmed,
        travel_collected: 0,
        logistics_complete: 0,
        unresponsive: 0,
      };
    }

    // ── 4. Open escalations — try coordination_issues first, fall back to outreach_escalations ──
    let escalationsOpen = 0;

    // Try coordination_issues (the table concierge tools write to)
    try {
      const { count, error } = await (supabase as any)
        .from('coordination_issues')
        .select('*', { count: 'exact', head: true })
        .eq('wedding_id', weddingId)
        .in('status', ['open', 'in_progress']);

      if (!error) escalationsOpen = count || 0;
    } catch {}

    // Also try outreach_escalations (legacy table)
    if (escalationsOpen === 0) {
      try {
        const { count, error } = await (supabase as any)
          .from('outreach_escalations')
          .select('*', { count: 'exact', head: true })
          .eq('wedding_id', weddingId)
          .eq('status', 'open');

        if (!error) escalationsOpen = count || 0;
      } catch {}
    }

    // ── 5. Next scheduled sequence (best-effort) ─────────────────
    let next_scheduled_action = null;
    try {
      const { data: nextSeq, error } = await (supabase as any)
        .from('outreach_sequences')
        .select('*')
        .eq('wedding_id', weddingId)
        .eq('status', 'pending')
        .order('scheduled_at', { ascending: true })
        .limit(1)
        .single();

      if (!error && nextSeq) {
        next_scheduled_action = {
          type: nextSeq.sequence_type,
          date: nextSeq.scheduled_at,
          target_count: 0,
        };
      }
    } catch {}

    return NextResponse.json({
      total_guests: totalGuests,
      ...outreachCounts,
      // Override rsvp_confirmed with actual RSVP count if it's higher
      rsvp_confirmed: Math.max(outreachCounts.rsvp_confirmed, rsvpConfirmed),
      escalations_open: escalationsOpen,
      next_scheduled_action,
      // Extra stats for UI enrichment
      _rsvp_breakdown: {
        yes: rsvpConfirmed,
        no: rsvpDeclined,
        maybe: rsvpMaybe,
        pending: totalGuests - rsvpedGuestIds.size,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
