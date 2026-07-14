/**
 * The RICH SECTIONS — the parts of Phera that have a real UI the agent must not
 * try to reproduce in chat: designing the website, tagging and organising the
 * guest list, and placing guests in rooms.
 *
 * The loop around each one is always the same:
 *   1. hand off with a BUTTON (hand_off_to_section) and snapshot what the data
 *      looked like at that moment,
 *   2. they go and work in the real UI,
 *   3. when they come back, the snapshot shows what CHANGED since the baseline,
 *      so the agent can SEE they're done instead of guessing,
 *   4. it confirms with them and moves on (finish_section).
 *
 * Detection is the point: without a baseline the agent can only ask "are you
 * done?" forever. With one, it can say "I can see you tagged 96 households".
 */

export type SectionKey = 'website' | 'guest-list' | 'rooms';

export interface SectionMetrics {
  /** Counts used to detect progress. Compared against the stored baseline. */
  guests: number;
  taggedGuests: number;
  rooms: number;
  assignedGuests: number;
  events: number;
  faqs: number;
  /** Website "details are filled in" signals. */
  detailsComplete: boolean;
  published: boolean;
}

export interface SectionDef {
  key: SectionKey;
  label: string;
  /** Where the work actually happens. */
  path: (slug: string) => string;
  /** One line for the button card: what they're going there to do. */
  blurb: string;
  /** Human summary of what changed since the handoff — null when nothing did. */
  progress: (before: SectionMetrics, now: SectionMetrics) => string | null;
  /** Whether the section now looks finished enough to confirm and move on. */
  looksDone: (now: SectionMetrics) => boolean;
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export const SECTIONS: Record<SectionKey, SectionDef> = {
  website: {
    key: 'website',
    label: 'Website',
    path: (slug) => `/admin/${slug}/details`,
    blurb: 'Add your story, photos and the details guests need — then style it.',
    progress: (before, now) => {
      const bits: string[] = [];
      if (!before.detailsComplete && now.detailsComplete) bits.push('the core details are filled in');
      if (now.events > before.events) bits.push(`${plural(now.events - before.events, 'event')} added`);
      if (now.faqs > before.faqs) bits.push(`${plural(now.faqs - before.faqs, 'FAQ')} written`);
      if (!before.published && now.published) bits.push('the site is now LIVE');
      return bits.length ? bits.join(', ') : null;
    },
    looksDone: (now) => now.detailsComplete,
  },
  'guest-list': {
    key: 'guest-list',
    label: 'Guest list',
    path: (slug) => `/admin/${slug}/guest-list`,
    blurb: 'Add guests, tag them by side and family, and sort out plus-ones.',
    progress: (before, now) => {
      const bits: string[] = [];
      if (now.guests > before.guests) bits.push(`${plural(now.guests - before.guests, 'guest')} added`);
      if (now.taggedGuests > before.taggedGuests) {
        bits.push(`${plural(now.taggedGuests - before.taggedGuests, 'guest')} tagged`);
      }
      return bits.length ? bits.join(', ') : null;
    },
    looksDone: (now) => now.guests > 0,
  },
  rooms: {
    key: 'rooms',
    label: 'Room assignments',
    path: (slug) => `/admin/${slug}/room-assignments`,
    blurb: 'Place guests in rooms — drag families together, keep elders near the lifts.',
    progress: (before, now) => {
      const bits: string[] = [];
      if (now.rooms > before.rooms) bits.push(`${plural(now.rooms - before.rooms, 'room')} added`);
      if (now.assignedGuests > before.assignedGuests) {
        bits.push(`${plural(now.assignedGuests - before.assignedGuests, 'guest')} placed`);
      }
      return bits.length ? bits.join(', ') : null;
    },
    looksDone: (now) => now.rooms > 0 && now.assignedGuests > 0,
  },
};

export const SECTION_KEYS = Object.keys(SECTIONS) as SectionKey[];

export function isSectionKey(value: unknown): value is SectionKey {
  return typeof value === 'string' && value in SECTIONS;
}

/** The couple's public wedding site. */
export function publicSiteUrl(slug: string): string {
  return `https://phera.io/${slug}`;
}

/** Title of the agent_knowledge row that holds the open handoff (no migration —
 *  agent_knowledge is already a wedding-scoped key/value store with metadata). */
export const HANDOFF_TITLE = 'Section handoff';

export interface HandoffState {
  section: SectionKey;
  at: string;
  baseline: SectionMetrics;
}
