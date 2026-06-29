import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedClient } from '@/lib/utils/auth-helpers';
import { verifyWeddingAccess } from '@/lib/utils/verify-wedding-access';
import { buildWeddingSnapshot, type WeddingSnapshot } from '@/lib/agent/context';

export const runtime = 'nodejs';

/** Friendly "set this up next" CTA per completeness item key. */
const GAP_CTA: Record<string, string> = {
  date: 'set your wedding date',
  venue: 'lock in your venue',
  events: 'add your ceremony events',
  schedule: 'build your day-by-day schedule',
  guests: 'add your guest list',
  rsvps: 'start collecting RSVPs',
  rsvp_deadline: 'set an RSVP deadline',
  rooms: 'set up room assignments',
  vendors: 'track your vendors',
  faqs: 'write your guest FAQs',
};

/**
 * Analytical, wedding-specific starter prompts for a RETURNING couple opening
 * the Planner — "41 of 280 RSVPs are in…" rather than generic chips. Derived
 * from the current snapshot. (True since-last-visit deltas are a later add.)
 */
function buildStarters(snapshot: WeddingSnapshot): string[] {
  const s = snapshot.stats;
  const out: string[] = [];

  if (s.guestCount > 0) {
    const pending = s.guestCount - s.respondedGuests;
    if (s.respondedGuests === 0) {
      out.push(`No RSVPs in yet from your ${s.guestCount} guests — want me to start chasing them?`);
    } else if (pending > 0) {
      out.push(`${s.respondedGuests} of ${s.guestCount} guests have RSVP'd — want me to nudge the ${pending} who haven't?`);
    } else {
      out.push(`All ${s.guestCount} guests have responded — show me who's coming to each event.`);
    }
  }

  if (s.daysToWedding !== null) {
    if (s.daysToWedding > 1) out.push(`${s.daysToWedding} days to go — what should we lock down next?`);
    else if (s.daysToWedding === 1) out.push(`Tomorrow's the big day — want the run-of-show?`);
    else if (s.daysToWedding === 0) out.push(`It's today! Want the day-of run-of-show?`);
  }

  const gap = snapshot.completeness.find((c) => !c.done);
  if (gap && GAP_CTA[gap.key]) out.push(`Want to ${GAP_CTA[gap.key]} next?`);

  out.push("What's still missing from our setup?");

  return Array.from(new Set(out)).slice(0, 4);
}

/**
 * GET /api/agent/summary?weddingSlug=...
 * Lightweight wedding summary for the Planner UI. Currently returns analytical
 * starter prompts; structured stats can be added to the payload as needed.
 */
export async function GET(request: NextRequest) {
  const { supabase, user } = await getAuthenticatedClient();
  if (!supabase || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const weddingSlug = request.nextUrl.searchParams.get('weddingSlug');
  if (!weddingSlug) {
    return NextResponse.json({ error: 'Missing weddingSlug' }, { status: 400 });
  }

  const { data: wedding } = await supabase
    .from('weddings')
    .select('id, slug')
    .eq('slug', weddingSlug)
    .single();
  if (!wedding) {
    return NextResponse.json({ error: 'Wedding not found' }, { status: 404 });
  }
  const hasAccess = await verifyWeddingAccess(supabase, user.id, wedding.id);
  if (!hasAccess) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const snapshot = await buildWeddingSnapshot(supabase, wedding.slug, wedding.id);
    return NextResponse.json({ starters: buildStarters(snapshot) });
  } catch {
    // Fail open — the client falls back to its default starters.
    return NextResponse.json({ starters: [] });
  }
}
