import { describe, it, expect } from 'vitest';
import { buildStarters } from '@/lib/agent/starters';
import type { WeddingSnapshot, CompletenessItem, WeddingStats } from '@/lib/agent/context';

const ALL_KEYS = [
  'date',
  'venue',
  'events',
  'schedule',
  'guests',
  'rsvps',
  'rsvp_deadline',
  'rooms',
  'vendors',
  'faqs',
] as const;

function snapshot(opts: {
  done?: Partial<Record<(typeof ALL_KEYS)[number], boolean>>;
  stats?: Partial<WeddingStats>;
}): WeddingSnapshot {
  const done = opts.done ?? {};
  const completeness: CompletenessItem[] = ALL_KEYS.map((key) => ({
    key,
    label: key,
    done: done[key] ?? false,
  }));
  const stats: WeddingStats = {
    coupleName: 'Priya & Rahul',
    guestCount: 0,
    respondedGuests: 0,
    daysToWedding: null,
    eventCount: 0,
    scheduleDays: 0,
    roomCount: 0,
    vendorCount: 0,
    faqCount: 0,
    openTasks: 0,
    dateSet: done.date ?? false,
    venueSet: done.venue ?? false,
    rsvpDeadlineSet: done.rsvp_deadline ?? false,
    goalsSet: false,
    ...opts.stats,
  };
  return { text: '', completeness, stats, focus: null };
}

describe('buildStarters', () => {
  it('leads with foundational gaps (date, venue) for a fresh wedding', () => {
    const out = buildStarters(snapshot({}));
    expect(out[0]).toBe('Help me set my wedding date.');
    expect(out[1]).toBe('Help me lock in my venue.');
  });

  it('never suggests a gap that is already done', () => {
    const out = buildStarters(snapshot({ done: { date: true, venue: true } }));
    expect(out).not.toContain('Help me set my wedding date.');
    expect(out).not.toContain('Help me lock in my venue.');
  });

  it('surfaces an RSVP chase when nobody has responded yet', () => {
    const out = buildStarters(
      snapshot({ done: { date: true, venue: true }, stats: { guestCount: 150, respondedGuests: 0 } })
    );
    expect(out).toContain('Help me chase RSVPs from my 150 guests.');
  });

  it('nudges only the pending count once some guests have responded', () => {
    const out = buildStarters(
      snapshot({ done: { date: true, venue: true }, stats: { guestCount: 150, respondedGuests: 100 } })
    );
    expect(out).toContain("Nudge the 50 guests who haven't RSVP'd yet.");
  });

  it('never suggests an RSVP-nudge starter once everyone has responded', () => {
    const out = buildStarters(
      snapshot({ done: { date: true, venue: true }, stats: { guestCount: 150, respondedGuests: 150 } })
    );
    expect(out.some((t) => t.includes('chase RSVPs') || t.includes("haven't RSVP'd"))).toBe(false);
  });

  it('gives the day-of run-of-show top priority when the wedding is today', () => {
    // daysToWedding is only computed once a date is set — a realistic "today".
    const out = buildStarters(snapshot({ done: { date: true, venue: true }, stats: { daysToWedding: 0 } }));
    expect(out[0]).toBe("It's today — give me the day-of run-of-show.");
  });

  it('gives the run-of-show top priority when the wedding is tomorrow', () => {
    const out = buildStarters(snapshot({ done: { date: true, venue: true }, stats: { daysToWedding: 1 } }));
    expect(out[0]).toBe("It's tomorrow — walk me through the run-of-show.");
  });

  it('adds a countdown prompt inside the two-week window', () => {
    const out = buildStarters(snapshot({ stats: { daysToWedding: 10 } }));
    expect(out).toContain('10 days to go — what should I be focused on?');
  });

  it('does not add a countdown prompt outside the two-week window', () => {
    const out = buildStarters(snapshot({ stats: { daysToWedding: 45 } }));
    expect(out.some((t) => t.includes('days to go'))).toBe(false);
  });

  it('does not surface a countdown for a wedding that already happened', () => {
    const out = buildStarters(snapshot({ stats: { daysToWedding: -5 } }));
    expect(out.some((t) => t.includes('days to go') || t.includes('today') || t.includes('tomorrow'))).toBe(
      false
    );
  });

  it('promotes guest-logistics gaps (guests, rsvp_deadline, rooms) above long-lead gaps once close to the date', () => {
    const out = buildStarters(
      snapshot({
        done: { date: true, venue: true },
        stats: { daysToWedding: 20 },
      })
    );
    const idx = (needle: string) => out.findIndex((t) => t.includes(needle));
    // guests/rsvp_deadline/rooms are tier 2 within 30 days; events/schedule/vendors/faqs stay tier 3-4.
    expect(idx('guest list')).toBeGreaterThanOrEqual(0);
    expect(idx('guest list')).toBeLessThan(idx('vendors'));
    expect(idx('RSVP deadline')).toBeLessThan(idx('ceremony events'));
  });

  it('keeps long-lead gaps ahead of guest-logistics gaps when the date is far out', () => {
    const out = buildStarters(
      snapshot({
        done: { date: true, venue: true },
        stats: { daysToWedding: 200 },
      })
    );
    const idx = (needle: string) => out.findIndex((t) => t.includes(needle));
    expect(idx('ceremony events')).toBeLessThan(idx('guest list'));
  });

  it('surfaces open tasks', () => {
    const out = buildStarters(snapshot({ done: { date: true, venue: true }, stats: { openTasks: 3 } }));
    expect(out).toContain('Help me work through my 3 open tasks.');
  });

  it('singularizes a single open task', () => {
    const out = buildStarters(snapshot({ done: { date: true, venue: true }, stats: { openTasks: 1 } }));
    expect(out).toContain('Help me work through my 1 open task.');
  });

  it('falls back to generic polish prompts once everything is done', () => {
    const allDone = Object.fromEntries(ALL_KEYS.map((k) => [k, true])) as Record<
      (typeof ALL_KEYS)[number],
      boolean
    >;
    const out = buildStarters(snapshot({ done: allDone }));
    expect(out.length).toBeGreaterThan(0);
    expect(out).toContain("What's still missing from my setup?");
  });

  it('never returns duplicate prompts', () => {
    const out = buildStarters(snapshot({ stats: { guestCount: 10, respondedGuests: 0, openTasks: 2 } }));
    expect(new Set(out).size).toBe(out.length);
  });

  it('caps the pool at 6 candidates', () => {
    const out = buildStarters(
      snapshot({ stats: { guestCount: 10, respondedGuests: 5, daysToWedding: 5, openTasks: 2 } })
    );
    expect(out.length).toBeLessThanOrEqual(6);
  });
});
