import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedClient } from '@/lib/utils/auth-helpers';
import { verifyWeddingAccess } from '@/lib/utils/verify-wedding-access';
import { buildWeddingSnapshot, type WeddingSnapshot } from '@/lib/agent/context';
import { SPINE_STEPS } from '@/lib/agent/spine';

export const runtime = 'nodejs';

/** First-person "set this up next" CTA per completeness item key — phrased as
 *  the user would type it (starters render as if the user tapped to send them). */
const GAP_CTA: Record<string, string> = {
  date: 'set my wedding date',
  venue: 'lock in my venue',
  events: 'add my ceremony events',
  schedule: 'build my day-by-day schedule',
  guests: 'add my guest list',
  rsvps: 'start collecting RSVPs',
  rsvp_deadline: 'set an RSVP deadline',
  rooms: 'set up room assignments',
  vendors: 'find and track my vendors',
  faqs: 'write my guest FAQs',
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
      out.push(`Help me chase RSVPs from my ${s.guestCount} guests.`);
    } else if (pending > 0) {
      out.push(`Nudge the ${pending} guests who haven't RSVP'd yet.`);
    } else {
      out.push(`Show me who's coming to each event.`);
    }
  }

  if (s.daysToWedding !== null) {
    if (s.daysToWedding > 1) out.push(`${s.daysToWedding} days to go — help me plan what's next.`);
    else if (s.daysToWedding === 1) out.push(`It's tomorrow — walk me through the run-of-show.`);
    else if (s.daysToWedding === 0) out.push(`It's today — give me the day-of run-of-show.`);
  }

  const gap = snapshot.completeness.find((c) => !c.done);
  if (gap && GAP_CTA[gap.key]) out.push(`Help me ${GAP_CTA[gap.key]}.`);

  out.push("What's still missing from my setup?");

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
    // The Working-on bar's state (PLANNER-SPINE-TRACKER A1/A2): current spine
    // step + progress, shaped for direct rendering.
    const f = snapshot.focus;
    const focus = f
      ? {
          step: f.step,
          label: f.label,
          stepNumber: f.step ? SPINE_STEPS.findIndex((s) => s.key === f.step) + 1 : null,
          totalSteps: SPINE_STEPS.length,
          done: f.done,
          skipped: f.skipped,
          complete: f.complete,
        }
      : null;
    return NextResponse.json({ starters: buildStarters(snapshot), focus });
  } catch {
    // Fail open — the client falls back to its default starters.
    return NextResponse.json({ starters: [], focus: null });
  }
}
