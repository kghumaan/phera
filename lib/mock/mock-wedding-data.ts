/**
 * DEV-ONLY mock wedding for rendering guest pages without a database.
 *
 * Activated only when NEXT_PUBLIC_PHERA_MOCK === '1' AND the route slug is
 * MOCK_WEDDING_SLUG — never in production builds (the env var is unset).
 * Used by the mobile-app port (mobile/ folder) as the visual comparison
 * baseline: `next dev` renders these pages, Playwright screenshots them at
 * iPhone viewport, and the React Native screens are matched against them.
 * The data mirrors mobile/src/lib/mock/fixtures.ts (same couple, dates,
 * events) so the two renders are directly comparable.
 */

export const MOCK_WEDDING_SLUG = 'priya-rahul-2026';

export function isMockWeddingEnabled(slug: string): boolean {
  return process.env.NEXT_PUBLIC_PHERA_MOCK === '1' && slug === MOCK_WEDDING_SLUG;
}

const wedding = {
  id: 'w-mock-0001',
  slug: MOCK_WEDDING_SLUG,
  couple_name: 'Priya & Rahul',
  partner1_name: 'Priya',
  partner2_name: 'Rahul',
  wedding_date: '2026-11-18',
  wedding_date_end: '2026-11-20',
  wedding_date_display: 'November 18–20, 2026',
  rsvp_deadline: '2026-09-30',
  venue_name: 'The Oberoi Udaivilas',
  venue_location: 'Udaipur, Rajasthan',
  venue_flag: '🇮🇳',
  status: 'live',
  created_by: null,
  primary_color: '#DE3F5E',
  welcome_text: 'We are getting married!',
  background_image: '/images/backgrounds/blue-clouds.webp',
  published_snapshot: null,
  has_unpublished_changes: false,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-06-01T00:00:00Z',
};

const events = [
  { id: 'e1', wedding_id: wedding.id, name: 'Haldi', slug: 'haldi', date: '2026-11-18', time: '10:00 AM', dress_code: 'Yellow & casual', dress_code_description: "Wear yellow if you can — and nothing you'd mind getting turmeric on.", ritual_name: 'Haldi ceremony', ritual_description: 'Turmeric paste is applied to the couple by family and friends — a blessing before the wedding.', gradient_background: null, order_index: 0, carousel_slides: [] },
  { id: 'e2', wedding_id: wedding.id, name: 'Sangeet', slug: 'sangeet', date: '2026-11-18', time: '7:00 PM', dress_code: 'Festive Indian', dress_code_description: 'Bright lehengas, saris, kurtas — comfortable shoes, you will dance.', ritual_name: null, ritual_description: 'A night of music and choreographed dances performed by both families.', gradient_background: null, order_index: 1, carousel_slides: [] },
  { id: 'e3', wedding_id: wedding.id, name: 'Wedding Ceremony', slug: 'wedding', date: '2026-11-19', time: '9:00 AM', dress_code: 'Traditional', dress_code_description: 'Traditional Indian attire preferred; avoid red and black.', ritual_name: 'Pheras', ritual_description: 'The couple circles the sacred fire seven times, each phera a vow.', gradient_background: null, order_index: 2, carousel_slides: [] },
  { id: 'e4', wedding_id: wedding.id, name: 'Reception', slug: 'reception', date: '2026-11-20', time: '7:30 PM', dress_code: 'Black tie / formal Indian', dress_code_description: 'Formal — a gown, suit, or your finest Indian formalwear.', ritual_name: null, ritual_description: 'Dinner, toasts, and dancing to celebrate the newlyweds.', gradient_background: null, order_index: 3, carousel_slides: [] },
];

const schedule = [
  {
    id: 's1', wedding_id: wedding.id, day_name: 'Day 1 — Mehndi & Sangeet', date: '2026-11-18', order_index: 0,
    events: [
      { id: 'si1', schedule_id: 's1', name: 'Haldi', time: '10:00 AM', location: 'Courtyard Lawn', description: 'Turmeric ceremony for the couple', order_index: 0, is_major_event: true, linked_event_id: 'e1', gradient_background: null },
      { id: 'si2', schedule_id: 's1', name: 'Lunch', time: '1:00 PM', location: 'Palace Dining Hall', description: null, order_index: 1, is_major_event: false, linked_event_id: null, gradient_background: null },
      { id: 'si3', schedule_id: 's1', name: 'Sangeet', time: '7:00 PM', location: 'Venue TBD', description: 'Music, dance performances & dinner', order_index: 2, is_major_event: true, linked_event_id: 'e2', gradient_background: null },
    ],
  },
  {
    id: 's2', wedding_id: wedding.id, day_name: 'Day 2 — The Wedding', date: '2026-11-19', order_index: 1,
    events: [
      { id: 'si4', schedule_id: 's2', name: 'Baraat', time: '8:00 AM', location: 'Main Gate', description: "Groom's procession — everyone dances!", order_index: 0, is_major_event: true, linked_event_id: null, gradient_background: null },
      { id: 'si5', schedule_id: 's2', name: 'Wedding Ceremony', time: '9:00 AM', location: 'Lakeside Mandap', description: 'Pheras & vows', order_index: 1, is_major_event: true, linked_event_id: 'e3', gradient_background: null },
      { id: 'si6', schedule_id: 's2', name: 'Vidaai', time: '5:00 PM', location: 'Main Courtyard', description: null, order_index: 2, is_major_event: false, linked_event_id: null, gradient_background: null },
    ],
  },
  {
    id: 's3', wedding_id: wedding.id, day_name: 'Day 3 — Reception', date: '2026-11-20', order_index: 2,
    events: [
      { id: 'si7', schedule_id: 's3', name: 'Reception & Dinner', time: '7:30 PM', location: 'Grand Ballroom', description: 'Cocktails, dinner & dancing', order_index: 0, is_major_event: true, linked_event_id: 'e4', gradient_background: null },
    ],
  },
];

const faqs = [
  { id: 'q1', wedding_id: wedding.id, question: 'What should I wear?', answer: 'Indian festive attire is encouraged but not required — bright colors welcome!', order_index: 0 },
  { id: 'q2', wedding_id: wedding.id, question: 'Can I bring a plus-one?', answer: 'Check your invitation — if your RSVP shows a plus-one option, yes!', order_index: 1 },
  { id: 'q3', wedding_id: wedding.id, question: 'Will there be vegetarian food?', answer: 'Absolutely. Every meal has vegetarian, vegan, and Jain options.', order_index: 2 },
  { id: 'q4', wedding_id: wedding.id, question: 'Is there a shuttle from the airport?', answer: 'Yes — share your flight details after you RSVP and we will assign you a pickup.', order_index: 3 },
];

const settings = {
  id: 'set-mock-0001',
  wedding_id: wedding.id,
  wedding_password: 'udaipur2026',
  concierge_enabled: false,
};

/** Shape mirrors published_snapshot (WeddingContext live-mode contract). */
export const MOCK_WEDDING_SNAPSHOT = {
  wedding,
  events,
  settings,
  faqs,
  schedule,
  travelCards: [] as unknown[],
  registry: [] as unknown[],
  shops: [] as unknown[],
};
