/**
 * Trimmed row types matching the web app's Supabase schema
 * (lib/supabase/types.ts at repo root). Only fields mobile screens consume.
 *
 * CRITICAL wedding_id convention (see wedding-service.ts:1732 on web):
 * - `guests`, `rsvps` → wedding_id stores the SLUG (TEXT)
 * - `wedding_events`, `wedding_schedule` → wedding_id stores the UUID
 * Resolve slug → wedding row first, then use wedding.id for events/schedule.
 */

export type Attending = 'yes' | 'no' | 'maybe';
export type WeddingSide = 'bride' | 'groom' | 'both';

export interface Wedding {
  id: string; // UUID
  slug: string;
  couple_name: string;
  partner1_name: string | null;
  partner2_name: string | null;
  wedding_date: string;
  wedding_date_end: string | null;
  wedding_date_display: string;
  rsvp_deadline: string;
  venue_name: string; // 'Venue TBD' placeholder convention
  venue_location: string;
  status: string; // 'draft' | 'live'
  created_by: string | null;
}

export interface GuestRsvpSummary {
  attending: Attending;
  guest_count: number | null;
  created_at: string | null;
}

export interface Guest {
  id: string;
  name: string;
  email: string; // '' / '@phera.io' sentinel when unknown
  phone: string | null;
  wedding_side: WeddingSide | null;
  avatar_color: string;
  initials: string | null;
  logistics_data: {
    tags?: string[];
    party_size?: number;
    plus_one_name?: string | null;
  } | null;
  created_at: string | null;
  /** Embedded via select('..., rsvps(attending, guest_count, created_at)'). */
  rsvps: GuestRsvpSummary[];
}

export interface Rsvp {
  id: string;
  guest_id: string | null;
  event_id: string; // 'general' in practice
  attending: Attending;
  guest_count: number | null;
  plus_one: boolean | null;
  food_preference: string[] | null;
  dietary_restrictions: string | null;
  special_message: string | null;
  created_at: string | null;
  /** Embedded guest row via select('*, guest:guests(*)'). */
  guest: Pick<Guest, 'id' | 'name' | 'avatar_color' | 'wedding_side'> | null;
}

export interface WeddingEvent {
  id: string;
  name: string;
  slug: string;
  date: string;
  time: string;
  dress_code: string;
  ritual_name: string | null;
  order_index: number;
}

export interface ScheduleItem {
  id: string;
  schedule_id: string | null;
  name: string;
  time: string;
  location: string | null;
  description: string | null;
  order_index: number;
  is_major_event: boolean | null;
}

export interface ScheduleDay {
  id: string;
  day_name: string;
  date: string;
  order_index: number;
  events: ScheduleItem[];
}

/** Client-side RSVP aggregate — mirrors web overview/guest-responses math. */
export interface RsvpStats {
  attendingResponses: number;
  notAttending: number;
  pending: number;
  /** Head-count: sum of guest_count over attending==='yes'. */
  totalGuestsComing: number;
}

export function aggregateRsvps(rsvps: Pick<Rsvp, 'attending' | 'guest_count'>[]): RsvpStats {
  return {
    attendingResponses: rsvps.filter((r) => r.attending === 'yes').length,
    notAttending: rsvps.filter((r) => r.attending === 'no').length,
    pending: rsvps.filter((r) => r.attending === 'maybe' || !r.attending).length,
    totalGuestsComing: rsvps
      .filter((r) => r.attending === 'yes')
      .reduce((sum, r) => sum + (r.guest_count || 1), 0),
  };
}
