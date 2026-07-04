import type {
  Guest,
  Rsvp,
  ScheduleDay,
  Wedding,
  WeddingEvent,
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
