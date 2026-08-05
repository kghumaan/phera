import type { WeddingSnapshot } from './context';

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

/** Generic ideas for a wedding that's already in good shape — only used to
 *  backfill unused slots, never ahead of anything real/urgent. */
const POLISH_PROMPTS = [
  'Help me polish my wedding website.',
  'Help me find a photographer.',
  "What's still missing from my setup?",
];

/** The server ranks more candidates than any single surface shows — callers
 *  slice to what fits (fewer in a docked sidebar than the full page). */
const MAX_CANDIDATES = 6;

interface Candidate {
  key: string;
  text: string;
  /** Lower = more relevant/urgent. Ties keep insertion order. */
  tier: number;
}

/**
 * Analytical, wedding-specific starter prompts for a RETURNING couple opening
 * the Planner — "help me chase RSVPs from my 212 guests" rather than generic
 * chips. Ranks candidates instead of picking just one:
 *
 *   1. Foundational blockers (date, venue) and imminent day-of prompts —
 *      nothing else really matters until these are set / it's the big day.
 *   2. Time-sensitive, personalized signals — RSVP progress, a countdown,
 *      open (agent-created) tasks — these use real numbers/specifics so
 *      they read as "the assistant is paying attention," not a canned tip.
 *   3–4. The remaining setup gaps, in natural planning order. Within ~30
 *      days of the wedding, guest-facing logistics (who's coming, where
 *      they sleep) get promoted above long-lead structural work (schedule
 *      polish, vendor research) — what's "relevant" shifts as the date
 *      approaches.
 *   5. Generic polish prompts, only to backfill empty slots.
 *
 * Returns up to MAX_CANDIDATES, ranked highest-relevance first.
 */
export function buildStarters(snapshot: WeddingSnapshot): string[] {
  const s = snapshot.stats;
  const done = new Set(snapshot.completeness.filter((c) => c.done).map((c) => c.key));
  const candidates: Candidate[] = [];

  const addGap = (key: string, tier: number) => {
    if (done.has(key) || !GAP_CTA[key]) return;
    candidates.push({ key, text: `Help me ${GAP_CTA[key]}.`, tier });
  };

  // Tier 1 — nothing else really makes sense before these.
  addGap('date', 1);
  addGap('venue', 1);
  if (s.daysToWedding === 0) {
    candidates.push({ key: 'day-of', text: "It's today — give me the day-of run-of-show.", tier: 1 });
  } else if (s.daysToWedding === 1) {
    candidates.push({ key: 'day-of', text: "It's tomorrow — walk me through the run-of-show.", tier: 1 });
  }

  // Tier 2 — time-sensitive, personalized analytics.
  if (s.guestCount > 0) {
    const pending = s.guestCount - s.respondedGuests;
    if (s.respondedGuests === 0) {
      candidates.push({ key: 'rsvp-nudge', text: `Help me chase RSVPs from my ${s.guestCount} guests.`, tier: 2 });
    } else if (pending > 0) {
      candidates.push({
        key: 'rsvp-nudge',
        text: `Nudge the ${pending} guest${pending === 1 ? '' : 's'} who haven't RSVP'd yet.`,
        tier: 2,
      });
    }
  }
  if (s.daysToWedding !== null && s.daysToWedding > 1 && s.daysToWedding <= 14) {
    candidates.push({ key: 'countdown', text: `${s.daysToWedding} days to go — what should I be focused on?`, tier: 2 });
  }
  // Open tasks are concrete, agent-created action items — as immediate and
  // personalized as the RSVP/countdown analytics, so they rank alongside them
  // rather than behind every remaining setup gap.
  if (s.openTasks > 0) {
    candidates.push({
      key: 'tasks',
      text: `Help me work through my ${s.openTasks} open task${s.openTasks === 1 ? '' : 's'}.`,
      tier: 2,
    });
  }

  // Tier 3 (promoted to 2 once the date is close) — the remaining setup gaps,
  // in natural planning order.
  const closeToDate = s.daysToWedding !== null && s.daysToWedding > 1 && s.daysToWedding <= 30;
  addGap('events', 3);
  addGap('schedule', 3);
  addGap('guests', closeToDate ? 2 : 3);
  addGap('rsvp_deadline', closeToDate ? 2 : 3);
  addGap('rooms', closeToDate ? 2 : 4);
  addGap('vendors', 4);
  addGap('faqs', 4);
  // Note: the 'rsvps' completeness key ("start collecting RSVPs") is
  // intentionally never surfaced here — it's subsumed by the richer,
  // numbers-based rsvp-nudge candidate above (both fire on the same
  // "no responses yet" condition; the analytics version is more specific).

  const ranked = [...candidates].sort((a, b) => a.tier - b.tier);
  const pool: Candidate[] = [...ranked, ...POLISH_PROMPTS.map((text, i) => ({ key: `polish-${i}`, text, tier: 5 }))];

  const seen = new Set<string>();
  const out: string[] = [];
  for (const c of pool) {
    if (seen.has(c.text)) continue;
    seen.add(c.text);
    out.push(c.text);
    if (out.length >= MAX_CANDIDATES) break;
  }
  return out;
}
