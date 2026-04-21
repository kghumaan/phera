import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function safe<T>(fn: () => PromiseLike<any>, fallback: T): Promise<T> {
  try {
    const r = await fn();
    return r.error ? fallback : (r.data as T);
  } catch {
    return fallback;
  }
}

/**
 * GET /api/control-tower/dashboard?weddingId=<slug>
 * Single consolidated endpoint for the Control Tower dashboard.
 */
export async function GET(request: NextRequest) {
  const weddingId = request.nextUrl.searchParams.get('weddingId');
  if (!weddingId) {
    return NextResponse.json({ error: 'weddingId is required' }, { status: 400 });
  }

  try {
    // ── 0. Resolve wedding metadata ──────────────────────────────
    // Prefer the real `wedding_date` timestamp for date math; fall back to
    // `wedding_date_display` only as a presentation hint. The display field
    // can drift out of sync (it's only refreshed when the Details page opens).
    let weddingUuid = weddingId;
    let weddingDate: string | null = null;
    let w: any = null;
    const SELECT_COLS = 'id, partner1_name, partner2_name, couple_name, wedding_date, wedding_date_display, venue_name, venue_location';
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(weddingId);
    if (!isUuid) {
      w = await safe(() => supabase.from('weddings').select(SELECT_COLS).eq('slug', weddingId).single(), null);
      if (w) weddingUuid = w.id;
    } else {
      w = await safe(() => supabase.from('weddings').select(SELECT_COLS).eq('id', weddingId).single(), null);
    }
    if (w) {
      weddingDate = w.wedding_date || w.wedding_date_display || null;
    }

    // ── 1. All guests (build name map) ──────────────────────────
    const allGuests = await safe(
      () => supabase.from('guests').select('id, name, email, phone, wedding_side').eq('wedding_id', weddingId),
      [] as any[],
    );

    const guestMap = new Map<string, { name: string; email: string; phone: string | null; wedding_side: string | null }>();
    for (const g of allGuests) {
      guestMap.set(g.id, { name: g.name, email: g.email, phone: g.phone, wedding_side: g.wedding_side });
    }
    const guestIds = allGuests.map((g: any) => g.id);
    const totalGuests = guestIds.length;

    // ── 2. Outreach status columns (best-effort) ────────────────
    const outreachCounts: Record<string, number> = {
      not_contacted: 0, save_the_date_sent: 0, rsvp_requested: 0,
      rsvp_confirmed: 0, travel_collected: 0, logistics_complete: 0, unresponsive: 0,
    };

    const guestsWithOutreach = await safe(
      () => supabase.from('guests').select('id, outreach_status, outreach_last_contacted_at, conversation_topic' as any).eq('wedding_id', weddingId),
      null,
    );

    const hasOutreachCol = guestsWithOutreach !== null;

    // ── 3. RSVPs ────────────────────────────────────────────────
    let rsvpYes = 0, rsvpNo = 0, rsvpMaybe = 0;
    const rsvpByGuest = new Map<string, string>();

    if (guestIds.length > 0) {
      const rsvps = await safe(
        () => supabase.from('rsvps').select('guest_id, attending, guest_count').in('guest_id', guestIds),
        [] as any[],
      );
      for (const r of rsvps) {
        rsvpByGuest.set(r.guest_id, r.attending);
        if (r.attending === 'yes') rsvpYes++;
        else if (r.attending === 'no') rsvpNo++;
        else if (r.attending === 'maybe') rsvpMaybe++;
      }
    }

    // Each guest belongs to EXACTLY one funnel stage. When outreach_status
    // is missing, infer it from RSVP presence so we never double-count.
    if (hasOutreachCol) {
      for (const g of guestsWithOutreach as any[]) {
        let stage = g.outreach_status;
        if (!stage) {
          stage = rsvpByGuest.has(g.id) ? 'rsvp_confirmed' : 'not_contacted';
        }
        if (stage in outreachCounts) outreachCounts[stage]++;
      }
    } else {
      // Fallback: outreach_status column doesn't exist at all
      outreachCounts.not_contacted = totalGuests - rsvpByGuest.size;
      outreachCounts.rsvp_confirmed = rsvpByGuest.size;
    }

    // ── 4. Escalations with guest names ─────────────────────────
    let escalations: any[] = [];
    if (guestIds.length > 0) {
      const rawIssues = await safe(
        () => (supabase as any).from('coordination_issues')
          .select('id, guest_id, category, title, description, priority, status, source, created_at')
          .eq('wedding_id', weddingId)
          .in('status', ['open', 'in_progress'])
          .order('created_at', { ascending: false }),
        [] as any[],
      );

      escalations = rawIssues.map((issue: any) => {
        const guest = guestMap.get(issue.guest_id);
        return {
          ...issue,
          guest_name: guest?.name || 'Unknown Guest',
          guest_email: guest?.email || '',
          guest_phone: guest?.phone || null,
        };
      });
    }

    // ── 5. Needs Attention (unresponsive / no RSVP after contact) ─
    const needsAttention: any[] = [];
    if (hasOutreachCol) {
      for (const g of guestsWithOutreach as any[]) {
        const info = guestMap.get(g.id);
        if (!info) continue;
        const status = g.outreach_status || 'not_contacted';
        const hasRsvp = rsvpByGuest.has(g.id);

        // Unresponsive, or contacted but no RSVP
        const isUnresponsive = status === 'unresponsive';
        const contactedNoRsvp = ['rsvp_requested', 'save_the_date_sent'].includes(status) && !hasRsvp;

        if (isUnresponsive || contactedNoRsvp) {
          needsAttention.push({
            id: g.id,
            name: info.name,
            email: info.email,
            phone: info.phone,
            wedding_side: info.wedding_side,
            outreach_status: status,
            rsvp_attending: rsvpByGuest.get(g.id) || null,
            last_contacted: g.outreach_last_contacted_at || null,
          });
        }
      }
    } else {
      // Fallback: guests without RSVPs
      for (const g of allGuests) {
        if (!rsvpByGuest.has(g.id)) {
          needsAttention.push({
            id: g.id,
            name: g.name,
            email: g.email,
            phone: g.phone,
            wedding_side: g.wedding_side,
            outreach_status: 'not_contacted',
            rsvp_attending: null,
            last_contacted: null,
          });
        }
      }
    }

    // Sort by stalest first, limit to 15
    needsAttention.sort((a: any, b: any) => {
      if (!a.last_contacted) return -1;
      if (!b.last_contacted) return 1;
      return new Date(a.last_contacted).getTime() - new Date(b.last_contacted).getTime();
    });
    const topNeedsAttention = needsAttention.slice(0, 15);

    // ── 6. Concierge insights ───────────────────────────────────
    let guestsReached = 0;
    let messagesHandled = 0;
    let avgResponseTimeSec = 0;

    const chatHistory = await safe(
      () => (supabase as any).from('whatsapp_chat_history')
        .select('guest_id, role, created_at')
        .eq('wedding_id', weddingUuid)
        .order('created_at', { ascending: true }),
      [] as any[],
    );

    if (chatHistory.length > 0) {
      const uniqueGuests = new Set(chatHistory.map((m: any) => m.guest_id));
      guestsReached = uniqueGuests.size;
      messagesHandled = chatHistory.filter((m: any) => m.role === 'assistant').length;

      // Avg response time: time between user msg and next assistant msg
      const times: number[] = [];
      for (let i = 0; i < chatHistory.length - 1; i++) {
        if (chatHistory[i].role === 'user' && chatHistory[i + 1]?.role === 'assistant') {
          const diff = (new Date(chatHistory[i + 1].created_at).getTime() - new Date(chatHistory[i].created_at).getTime()) / 1000;
          if (diff > 0 && diff < 300) times.push(diff);
        }
      }
      if (times.length > 0) {
        avgResponseTimeSec = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
      }
    }

    // Topic breakdown from conversation_topic column
    const topicBreakdown: Record<string, number> = {};
    if (hasOutreachCol) {
      for (const g of guestsWithOutreach as any[]) {
        const topic = g.conversation_topic;
        if (topic) {
          topicBreakdown[topic] = (topicBreakdown[topic] || 0) + 1;
        }
      }
    }

    // ── 7. Messages sent this week ──────────────────────────────
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const weekEvents = await safe(
      () => supabase.from('outreach_events')
        .select('id')
        .eq('wedding_id', weddingId)
        .eq('event_type', 'template_sent')
        .gte('created_at', oneWeekAgo.toISOString()),
      [] as any[],
    );
    const messagesSentThisWeek = weekEvents.length;

    // ── 8. Guest list for compose panel ─────────────────────────
    const guestList = allGuests.map((g: any) => ({
      id: g.id,
      name: g.name,
      phone: g.phone,
    }));

    // ── Derive partner names ───────────────────────────────────
    const wData = w as any;
    let partner1Name = wData?.partner1_name || '';
    let partner2Name = wData?.partner2_name || '';
    if (!partner1Name && wData?.couple_name) {
      const parts = wData.couple_name.split(/\s*[&+]\s*/);
      partner1Name = parts[0]?.trim() || '';
      partner2Name = parts[1]?.trim() || '';
    }
    const venueName = wData?.venue_name || '';
    const venueLocation = wData?.venue_location || '';
    const venue = [venueName, venueLocation].filter(Boolean).join(', ');

    // ── Provider info ─────────────────────────────────────────
    const whatsappProvider = process.env.WHAPI_API_TOKEN ? 'whapi' : 'meta';

    // ── Response ────────────────────────────────────────────────
    return NextResponse.json({
      provider: whatsappProvider,
      summary: {
        total_guests: totalGuests,
        ...outreachCounts,
        escalations_open: escalations.length,
        messages_sent_this_week: messagesSentThisWeek,
        rsvp_breakdown: {
          yes: rsvpYes,
          no: rsvpNo,
          maybe: rsvpMaybe,
          pending: totalGuests - rsvpYes - rsvpNo - rsvpMaybe,
        },
      },
      weddingDate,
      partner1Name,
      partner2Name,
      venue,
      escalations,
      needsAttention: topNeedsAttention,
      guestList,
      concierge: {
        guestsReached,
        messagesHandled,
        avgResponseTimeSec,
        topicBreakdown,
      },
    });
  } catch (error: any) {
    console.error('[control-tower/dashboard] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
