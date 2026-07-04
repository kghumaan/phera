import type {
  Broadcast,
  ConciergeStats,
  Guest,
  GuestFlight,
  Reservation,
  Rsvp,
  ScheduleDay,
  Vehicle,
  Wedding,
  WeddingEvent,
  WeddingRoom,
  WeddingTask,
} from '@/lib/data/types';

/**
 * Preview-mode fixtures shaped exactly like the Supabase rows (see
 * src/lib/data/types.ts). One coherent mock wedding: Priya & Rahul,
 * Udaipur, Nov 18–20 2026.
 */

export const FIXTURE_WEDDING: Wedding = {
  id: 'w-preview-0001',
  slug: 'priya-rahul-2026',
  couple_name: 'Priya & Rahul',
  partner1_name: 'Priya',
  partner2_name: 'Rahul',
  wedding_date: '2026-11-18',
  wedding_date_end: '2026-11-20',
  wedding_date_display: 'November 18–20, 2026',
  rsvp_deadline: '2026-09-30',
  venue_name: 'The Oberoi Udaivilas',
  venue_location: 'Udaipur, Rajasthan',
  status: 'live',
  created_by: 'preview-user',
};

const g = (
  id: string,
  name: string,
  email: string,
  phone: string,
  side: Guest['wedding_side'],
  color: string,
  rsvp: Guest['rsvps'][number] | null,
  tags: string[] = [],
): Guest => ({
  id,
  name,
  email,
  phone,
  wedding_side: side,
  avatar_color: color,
  initials: null,
  logistics_data: tags.length ? { tags } : null,
  created_at: '2026-05-01T10:00:00Z',
  rsvps: rsvp ? [rsvp] : [],
});

export const FIXTURE_GUESTS: Guest[] = [
  g('g1', 'Anita Sharma', 'anita@example.com', '+14155550101', 'bride', '#DE3F5E', { attending: 'yes', guest_count: 2, created_at: '2026-06-01T09:00:00Z' }, ['family']),
  g('g2', 'Vikram Mehta', '', '+14155550102', 'groom', '#3b82f6', { attending: 'yes', guest_count: 1, created_at: '2026-06-02T09:00:00Z' }),
  g('g3', 'Sarah Chen', 'sarah@example.com', '+14155550103', 'bride', '#20C997', { attending: 'maybe', guest_count: 1, created_at: '2026-06-05T09:00:00Z' }, ['college']),
  g('g4', 'Dev Patel', 'dev@example.com', '+447700900104', 'groom', '#6C5CE7', null),
  g('g5', 'Meera & Raj Kapoor', '', '+919820050105', 'both', '#FF9933', { attending: 'yes', guest_count: 4, created_at: '2026-06-03T09:00:00Z' }, ['family']),
  g('g6', 'James Wilson', 'james@example.com', '+14155550106', 'groom', '#D4AF37', null),
  g('g7', 'Nisha Reddy', 'nisha@example.com', '+16135550107', 'bride', '#FF6B6B', { attending: 'no', guest_count: 0, created_at: '2026-06-04T09:00:00Z' }),
  g('g8', 'Rohan Gupta', '', '+14155550108', 'groom', '#20C997', { attending: 'yes', guest_count: 2, created_at: '2026-06-06T09:00:00Z' }, ['work']),
];

export const FIXTURE_RSVPS: Rsvp[] = FIXTURE_GUESTS.filter((gu) => gu.rsvps.length > 0).map(
  (gu, i) => ({
    id: `r${i + 1}`,
    guest_id: gu.id,
    event_id: 'general',
    attending: gu.rsvps[0]!.attending,
    guest_count: gu.rsvps[0]!.guest_count,
    plus_one: (gu.rsvps[0]!.guest_count ?? 1) > 1,
    food_preference: gu.id === 'g1' ? ['Vegetarian'] : gu.id === 'g5' ? ['Jain'] : null,
    dietary_restrictions: gu.id === 'g3' ? 'Severe nut allergy' : null,
    special_message: gu.id === 'g1' ? 'So excited for you both!! 🎉' : null,
    created_at: gu.rsvps[0]!.created_at,
    guest: { id: gu.id, name: gu.name, avatar_color: gu.avatar_color, wedding_side: gu.wedding_side },
  }),
);

export const FIXTURE_EVENTS: WeddingEvent[] = [
  { id: 'e1', name: 'Haldi', slug: 'haldi', date: '2026-11-18', time: '10:00 AM', dress_code: 'Yellow & casual', ritual_name: 'Haldi ceremony', order_index: 0 },
  { id: 'e2', name: 'Sangeet', slug: 'sangeet', date: '2026-11-18', time: '7:00 PM', dress_code: 'Festive Indian', ritual_name: null, order_index: 1 },
  { id: 'e3', name: 'Wedding Ceremony', slug: 'wedding', date: '2026-11-19', time: '9:00 AM', dress_code: 'Traditional', ritual_name: 'Pheras', order_index: 2 },
  { id: 'e4', name: 'Reception', slug: 'reception', date: '2026-11-20', time: '7:30 PM', dress_code: 'Black tie / formal Indian', ritual_name: null, order_index: 3 },
];

export const FIXTURE_SCHEDULE: ScheduleDay[] = [
  {
    id: 's1',
    day_name: 'Day 1 — Mehndi & Sangeet',
    date: '2026-11-18',
    order_index: 0,
    events: [
      { id: 'si1', schedule_id: 's1', name: 'Haldi', time: '10:00 AM', location: 'Courtyard Lawn', description: 'Turmeric ceremony for the couple', order_index: 0, is_major_event: true },
      { id: 'si2', schedule_id: 's1', name: 'Lunch', time: '1:00 PM', location: 'Palace Dining Hall', description: null, order_index: 1, is_major_event: false },
      { id: 'si3', schedule_id: 's1', name: 'Sangeet', time: '7:00 PM', location: 'Venue TBD', description: 'Music, dance performances & dinner', order_index: 2, is_major_event: true },
    ],
  },
  {
    id: 's2',
    day_name: 'Day 2 — The Wedding',
    date: '2026-11-19',
    order_index: 1,
    events: [
      { id: 'si4', schedule_id: 's2', name: 'Baraat', time: '8:00 AM', location: 'Main Gate', description: "Groom's procession — everyone dances!", order_index: 0, is_major_event: true },
      { id: 'si5', schedule_id: 's2', name: 'Wedding Ceremony', time: '9:00 AM', location: 'Lakeside Mandap', description: 'Pheras & vows', order_index: 1, is_major_event: true },
      { id: 'si6', schedule_id: 's2', name: 'Vidaai', time: '5:00 PM', location: 'Main Courtyard', description: null, order_index: 2, is_major_event: false },
    ],
  },
  {
    id: 's3',
    day_name: 'Day 3 — Reception',
    date: '2026-11-20',
    order_index: 2,
    events: [
      { id: 'si7', schedule_id: 's3', name: 'Reception & Dinner', time: '7:30 PM', location: 'Grand Ballroom', description: 'Cocktails, dinner & dancing', order_index: 0, is_major_event: true },
    ],
  },
];

export const FIXTURE_FLIGHTS: GuestFlight[] = [
  { id: 'f1', guest_id: 'g1', airline: 'United', flight_number: 'UA 48', departure_airport: 'SFO', arrival_airport: 'UDR', departure_datetime: '2026-11-16T21:15:00', arrival_datetime: '2026-11-17T14:30:00', shuttle_preference_time: '3:00 PM', guest: { id: 'g1', name: 'Anita Sharma' } },
  { id: 'f2', guest_id: 'g2', airline: 'Air India', flight_number: 'AI 172', departure_airport: 'SFO', arrival_airport: 'UDR', departure_datetime: '2026-11-16T23:40:00', arrival_datetime: '2026-11-17T16:05:00', shuttle_preference_time: '5:00 PM', guest: { id: 'g2', name: 'Vikram Mehta' } },
  { id: 'f3', guest_id: 'g5', airline: 'IndiGo', flight_number: '6E 214', departure_airport: 'BOM', arrival_airport: 'UDR', departure_datetime: '2026-11-17T09:10:00', arrival_datetime: '2026-11-17T10:25:00', shuttle_preference_time: null, guest: { id: 'g5', name: 'Meera & Raj Kapoor' } },
  { id: 'f4', guest_id: 'g8', airline: 'British Airways', flight_number: 'BA 139', departure_airport: 'LHR', arrival_airport: 'UDR', departure_datetime: '2026-11-17T10:20:00', arrival_datetime: '2026-11-18T04:45:00', shuttle_preference_time: '6:00 AM', guest: { id: 'g8', name: 'Rohan Gupta' } },
];

export const FIXTURE_VEHICLES: Vehicle[] = [
  { id: 'v1', direction: 'arrival', vehicle_name: 'Shuttle A — Airport loop', capacity: 12, departure_datetime: '2026-11-17T15:00:00', pickup_location: 'Udaipur Airport', dropoff_location: 'The Oberoi Udaivilas', booked: 8, available: 4 },
  { id: 'v2', direction: 'arrival', vehicle_name: 'Shuttle B — Evening pickup', capacity: 12, departure_datetime: '2026-11-17T18:00:00', pickup_location: 'Udaipur Airport', dropoff_location: 'The Oberoi Udaivilas', booked: 12, available: 0 },
  { id: 'v3', direction: 'departure', vehicle_name: 'Return coach', capacity: 30, departure_datetime: '2026-11-21T09:00:00', pickup_location: 'The Oberoi Udaivilas', dropoff_location: 'Udaipur Airport', booked: 11, available: 19 },
];

export const FIXTURE_RESERVATIONS: Reservation[] = [
  { id: 'tr1', guest_id: 'g1', direction: 'arrival', vehicle_id: 'v1', party_size: 2, status: 'confirmed', notes: null, guest: { id: 'g1', name: 'Anita Sharma' } },
  { id: 'tr2', guest_id: 'g2', direction: 'arrival', vehicle_id: 'v2', party_size: 1, status: 'pending', notes: null, guest: { id: 'g2', name: 'Vikram Mehta' } },
  { id: 'tr3', guest_id: 'g8', direction: 'arrival', vehicle_id: null, party_size: 2, status: 'pending', notes: null, guest: { id: 'g8', name: 'Rohan Gupta' } },
  { id: 'tr4', guest_id: null, direction: 'departure', vehicle_id: 'v3', party_size: 3, status: 'confirmed', notes: 'Sharma cousins (manual)', guest: null },
];

export const FIXTURE_ROOMS: WeddingRoom[] = [
  { id: 'rm1', room_number: '204', floor: '2', hotel_name: 'The Oberoi Udaivilas', bed_type: 'King', capacity: 2, notes: null, assigned_guest_ids: ['g1'] },
  { id: 'rm2', room_number: '205', floor: '2', hotel_name: 'The Oberoi Udaivilas', bed_type: 'Twin', capacity: 2, notes: 'Near elevator', assigned_guest_ids: ['g2', 'g3'] },
  { id: 'rm3', room_number: '310', floor: '3', hotel_name: 'The Oberoi Udaivilas', bed_type: 'Suite', capacity: 4, notes: null, assigned_guest_ids: ['g5'] },
  { id: 'rm4', room_number: '12', floor: '1', hotel_name: 'Trident Udaipur', bed_type: 'Queen', capacity: 2, notes: null, assigned_guest_ids: [] },
];

export const FIXTURE_TASKS: WeddingTask[] = [
  { id: 't1', title: 'Finalize sangeet venue', description: 'Two options shortlisted — need decision by Friday', column: 'todo', tags: ['venue'], order_index: 0, created_at: '2026-06-20T10:00:00Z' },
  { id: 't2', title: 'Send RSVP reminders', description: null, column: 'todo', tags: ['guests'], order_index: 1, created_at: '2026-06-21T10:00:00Z' },
  { id: 't3', title: 'Book airport shuttles', description: 'Confirm 2 shuttles for Nov 17 arrivals', column: 'doing', tags: ['travel'], order_index: 0, created_at: '2026-06-18T10:00:00Z' },
  { id: 't4', title: 'Approve mehndi artist quote', description: null, column: 'doing', tags: ['vendors'], order_index: 1, created_at: '2026-06-22T10:00:00Z' },
  { id: 't5', title: 'Send save-the-dates', description: null, column: 'done', tags: ['guests'], order_index: 0, created_at: '2026-05-10T10:00:00Z' },
];

export const FIXTURE_BROADCASTS: Broadcast[] = [
  { id: 'b1', message: 'Namaste! 🎉 Save the date — Priya & Rahul are getting married Nov 18–20 in Udaipur. RSVP link coming soon!', target_type: 'all', status: 'sent', sent_at: '2026-05-15T14:00:00Z', sent_count: 138, failed_count: 4, created_at: '2026-05-15T13:58:00Z', recipient_count: 142, delivered_count: 131, replied_count: 87 },
  { id: 'b2', message: 'RSVP reminder: we need your response by Sep 30 to finalize catering. Tap below to reply — takes 30 seconds!', target_type: 'tags', status: 'sent', sent_at: '2026-06-28T11:30:00Z', sent_count: 41, failed_count: 0, created_at: '2026-06-28T11:28:00Z', recipient_count: 41, delivered_count: 40, replied_count: 12 },
  { id: 'b3', message: 'Shuttle schedule for arrival day — please share your flight details so we can assign your pickup.', target_type: 'specific', status: 'sending', sent_at: null, sent_count: 18, failed_count: 0, created_at: '2026-07-04T09:00:00Z', recipient_count: 37, delivered_count: 9, replied_count: 2 },
];

export const FIXTURE_CONCIERGE: ConciergeStats = {
  guestsReached: 64,
  messagesHandled: 211,
  avgResponseTimeSec: 8,
  conversations: [
    { guestId: 'g1', guestName: 'Anita Sharma', lastMessageAt: '2026-07-04T08:45:00Z', lastMessagePreview: 'Perfect, thank you! And is there a dress code for the sangeet?', messageCount: 9 },
    { guestId: 'g4', guestName: 'Dev Patel', lastMessageAt: '2026-07-03T22:10:00Z', lastMessagePreview: 'Can I bring my kids to the reception?', messageCount: 4 },
    { guestId: 'g6', guestName: 'James Wilson', lastMessageAt: '2026-07-03T16:02:00Z', lastMessagePreview: 'What should a non-Indian guest wear to the haldi? 😅', messageCount: 12 },
    { guestId: 'g5', guestName: 'Meera & Raj Kapoor', lastMessageAt: '2026-07-02T19:30:00Z', lastMessagePreview: 'We land at 10:25 AM on the 17th.', messageCount: 6 },
  ],
};

export const MOCK_USER = {
  id: 'preview-user',
  email: 'preview@phera.io',
  name: 'Preview Couple',
} as const;

export const FIXTURE_NEXT_ACTIONS = [
  { id: 'a1', title: 'Send RSVP reminder to pending guests', detail: 'Last nudge was 6 days ago', icon: 'chatbubbles-outline' },
  { id: 'a2', title: 'Collect travel details from confirmed guests', detail: 'Flights land in 20 weeks', icon: 'airplane-outline' },
  { id: 'a3', title: 'Review 2 escalations from the concierge', detail: 'Guests asked about the sangeet dress code', icon: 'alert-circle-outline' },
] as const;
