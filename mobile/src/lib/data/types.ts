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
  dress_code_description: string | null;
  ritual_name: string | null;
  ritual_description: string | null;
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

export interface GuestFlight {
  id: string;
  guest_id: string | null;
  airline: string | null;
  flight_number: string | null;
  departure_airport: string | null;
  arrival_airport: string | null;
  departure_datetime: string | null; // "YYYY-MM-DDTHH:mm:00"
  arrival_datetime: string | null;
  shuttle_preference_time: string | null;
  /** Embedded via select('*, guest:guests(id, name, email, phone)'). */
  guest: { id: string; name: string } | null;
}

export interface Vehicle {
  id: string;
  direction: 'arrival' | 'departure';
  vehicle_name: string | null;
  capacity: number;
  departure_datetime: string;
  pickup_location: string | null;
  dropoff_location: string | null;
  /** Computed client-side from non-cancelled reservations (web pattern). */
  booked: number;
  available: number;
}

export interface Reservation {
  id: string;
  guest_id: string | null;
  direction: 'arrival' | 'departure';
  vehicle_id: string | null;
  party_size: number | null;
  status: 'pending' | 'confirmed' | 'cancelled';
  notes: string | null; // manual entries store the guest name here
  guest: { id: string; name: string } | null;
}

/** wedding_rooms — keyed by SLUG. Guests assigned via uuid[] column. */
export interface WeddingRoom {
  id: string;
  room_number: string;
  floor: string | null;
  hotel_name: string | null;
  bed_type: string | null;
  capacity: number | null;
  notes: string | null;
  assigned_guest_ids: string[];
}

export type TaskColumn = 'todo' | 'doing' | 'done';

/** wedding_tasks — keyed by wedding UUID. Kanban board. */
export interface WeddingTask {
  id: string;
  title: string;
  description?: string | null;
  column: TaskColumn;
  tags?: string[] | null;
  order_index: number;
  created_at: string;
}

/** concierge_broadcasts — keyed by SLUG. Includes client-side rollups. */
export interface Broadcast {
  id: string;
  message: string;
  target_type: 'all' | 'tags' | 'specific';
  status: 'draft' | 'sending' | 'sent' | 'failed';
  sent_at: string | null;
  sent_count: number;
  failed_count: number;
  created_at: string;
  recipient_count: number;
  delivered_count: number;
  replied_count: number;
}

/** Grouped from whatsapp_chat_history (keyed by wedding UUID). */
export interface ConciergeConversation {
  guestId: string;
  guestName: string;
  lastMessageAt: string;
  lastMessagePreview: string;
  messageCount: number;
}

export interface ConciergeStats {
  guestsReached: number;
  messagesHandled: number;
  avgResponseTimeSec: number | null;
  conversations: ConciergeConversation[];
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
