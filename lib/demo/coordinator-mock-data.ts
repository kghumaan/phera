// Mock data for demo user coordinator experience
// Used by both the dashboard page and vendor detail page

export const DEMO_COORDINATOR_PHONE = '+1 (555) 012-3456';
export const DEMO_COORDINATOR_TOOLTIP =
  'This is a sample number. In your account, this would be the number you add to vendor WhatsApp groups so Phera can track your conversations.';

export function isDemoUser(): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem('phera_demo_mode') === 'true';
}

// ─── Dashboard mock vendors (matches Vendor interface from coordinator page) ──

export const DEMO_VENDORS = [
  {
    id: 'demo-1',
    name: 'Transportation',
    category: 'Transportation',
    phone: null,
    email: null,
    status: 'booked',
    vendor_conversations: [
      { id: 'demo-conv-1', title: 'Royal Rides Group', message_count: 34, last_message_at: '2026-03-10T14:30:00Z', status: 'active' },
    ],
    vendor_insights: [
      { id: 'di-1-s1', insight_type: 'summary', content: 'Royal Rides is handling airport shuttle service and baraat car. 3 luxury vehicles confirmed for the wedding day. Driver coordination is in progress — they need final guest count for the airport shuttle by March 15.', is_completed: false, priority: 'medium', due_date: null },
      { id: 'di-1-a1', insight_type: 'action_item', content: 'Confirm guest count for airport shuttle', is_completed: false, priority: 'high', due_date: '2026-03-15' },
      { id: 'di-1-a2', insight_type: 'action_item', content: 'Send hotel addresses to driver', is_completed: false, priority: 'medium', due_date: '2026-03-18' },
    ],
  },
  {
    id: 'demo-2',
    name: 'Makeup Artist',
    category: 'Makeup',
    phone: null,
    email: null,
    status: 'booked',
    vendor_conversations: [
      { id: 'demo-conv-2', title: 'Glamour by Priya Chat', message_count: 52, last_message_at: '2026-03-09T18:45:00Z', status: 'active' },
    ],
    vendor_insights: [
      { id: 'di-2-s1', insight_type: 'summary', content: 'Priya is booked for bridal makeup, bridesmaids (4), and mother of the bride. Trial session completed on Feb 28 — bride loved the soft glam look. Priya offered a 20% family discount if mom also books. Final touch-up schedule needs to be confirmed based on ceremony timeline.', is_completed: false, priority: 'medium', due_date: null },
      { id: 'di-2-a1', insight_type: 'action_item', content: 'Confirm if mom wants makeup - 20% family discount available', is_completed: false, priority: 'medium', due_date: '2026-03-14' },
    ],
  },
  {
    id: 'demo-3',
    name: 'DJ',
    category: 'DJ/Music',
    phone: null,
    email: null,
    status: 'active',
    vendor_conversations: [
      { id: 'demo-conv-3', title: 'DJ Mantra Group', message_count: 21, last_message_at: '2026-03-11T10:15:00Z', status: 'active' },
    ],
    vendor_insights: [
      { id: 'di-3-s1', insight_type: 'summary', content: 'DJ Mantra is confirmed for sangeet and reception. He needs the final song request list and do-not-play list by March 16. Also flagged that the venue needs to confirm 3-phase power outlet availability for his sound system — this is urgent.', is_completed: false, priority: 'medium', due_date: null },
      { id: 'di-3-a1', insight_type: 'action_item', content: 'Send final song request + do-not-play list', is_completed: false, priority: 'high', due_date: '2026-03-16' },
      { id: 'di-3-a2', insight_type: 'action_item', content: 'Check venue for 3-phase power outlet', is_completed: false, priority: 'urgent', due_date: '2026-03-12' },
    ],
  },
  {
    id: 'demo-4',
    name: 'Venue',
    category: 'Venue',
    phone: null,
    email: null,
    status: 'booked',
    vendor_conversations: [
      { id: 'demo-conv-4', title: 'Grand Orchid Wedding Group', message_count: 67, last_message_at: '2026-03-11T09:00:00Z', status: 'active' },
    ],
    vendor_insights: [
      { id: 'di-4-s1', insight_type: 'summary', content: 'Grand Orchid Hotel is confirmed as the main venue for all events (mehendi, sangeet, ceremony, reception). Room block of 45 rooms reserved. Menu tasting scheduled for March 13 — they need the final menu selection within 48 hours after tasting. Parking for 60+ cars needs confirmation.', is_completed: false, priority: 'medium', due_date: null },
      { id: 'di-4-a1', insight_type: 'action_item', content: 'Finalize menu after tasting', is_completed: false, priority: 'high', due_date: '2026-03-13' },
      { id: 'di-4-a2', insight_type: 'action_item', content: 'Share updated room block list', is_completed: false, priority: 'medium', due_date: '2026-03-15' },
      { id: 'di-4-a3', insight_type: 'action_item', content: 'Confirm parking for 60+ cars', is_completed: false, priority: 'low', due_date: '2026-03-17' },
    ],
  },
  {
    id: 'demo-5',
    name: 'Decor',
    category: 'Decor',
    phone: null,
    email: null,
    status: 'active',
    vendor_conversations: [
      { id: 'demo-conv-5', title: 'Lumina Events Decor', message_count: 18, last_message_at: '2026-03-10T16:20:00Z', status: 'active' },
    ],
    vendor_insights: [
      { id: 'di-5-s1', insight_type: 'summary', content: 'Lumina Events is handling all decor — mandap design, stage setup, floral arrangements, and lighting. They shared a mood board last week and are waiting for final approval before ordering materials. Budget is on track at $8,500.', is_completed: false, priority: 'medium', due_date: null },
      { id: 'di-5-a1', insight_type: 'action_item', content: 'Approve final mood board for mandap design', is_completed: false, priority: 'high', due_date: '2026-03-14' },
    ],
  },
];

// ─── Vendor detail data (matches VendorDetail interface from detail page) ─────

interface DemoMessage {
  id: string;
  sender_name: string;
  sender_type: string;
  content: string;
  message_timestamp: string;
  has_media: boolean;
  media_type: null;
}

interface DemoInsight {
  id: string;
  insight_type: string;
  content: string;
  is_completed: boolean;
  priority: string;
  due_date: string | null;
  metadata: null;
  created_at: string;
}

interface DemoVendorDetail {
  id: string;
  name: string;
  category: string | null;
  phone: string | null;
  email: string | null;
  status: string;
  notes: string | null;
  vendor_conversations: Array<{
    id: string;
    title: string | null;
    message_count: number;
    last_message_at: string | null;
    status: string;
    source: string;
    vendor_messages: DemoMessage[];
  }>;
  vendor_insights: DemoInsight[];
}

interface DemoMember {
  id: string;
  name: string;
  role: string;
  phone?: string;
}

export const DEMO_VENDOR_DETAILS: Record<string, DemoVendorDetail> = {
  'demo-1': {
    id: 'demo-1',
    name: 'Transportation',
    category: 'Transportation',
    phone: '+1 (555) 234-5678',
    email: 'info@royalrides.com',
    status: 'booked',
    notes: null,
    vendor_conversations: [{
      id: 'demo-conv-1',
      title: 'Royal Rides Group',
      message_count: 34,
      last_message_at: '2026-03-10T14:30:00Z',
      status: 'active',
      source: 'whatsapp',
      vendor_messages: [
        { id: 'dm-1-1', sender_name: 'Raj (Royal Rides)', sender_type: 'vendor', content: 'Hi! Just confirming — we have 3 luxury sedans and 1 shuttle van reserved for March 22. All white, as requested.', message_timestamp: '2026-03-05T10:00:00Z', has_media: false, media_type: null },
        { id: 'dm-1-2', sender_name: 'Simran', sender_type: 'couple', content: 'Perfect! The white cars will look amazing. Quick question — can the shuttle fit 15 people?', message_timestamp: '2026-03-05T10:15:00Z', has_media: false, media_type: null },
        { id: 'dm-1-3', sender_name: 'Raj (Royal Rides)', sender_type: 'vendor', content: 'The shuttle seats 14 comfortably, 16 max. If you have more than 14 guests arriving at the airport, I\u2019d recommend a second trip or we can add a minivan for $150.', message_timestamp: '2026-03-05T10:22:00Z', has_media: false, media_type: null },
        { id: 'dm-1-4', sender_name: 'KV', sender_type: 'couple', content: 'Let\u2019s plan for the extra minivan just in case. Can you hold that for us?', message_timestamp: '2026-03-05T11:00:00Z', has_media: false, media_type: null },
        { id: 'dm-1-5', sender_name: 'Raj (Royal Rides)', sender_type: 'vendor', content: 'Done! Minivan held until March 15. Just confirm final guest count by then so I can finalize the driver schedule.', message_timestamp: '2026-03-05T11:10:00Z', has_media: false, media_type: null },
        { id: 'dm-1-6', sender_name: 'Neha (Planner)', sender_type: 'planner', content: 'Raj, can you also send us the driver contact info? We\u2019ll need it for day-of coordination.', message_timestamp: '2026-03-07T09:30:00Z', has_media: false, media_type: null },
        { id: 'dm-1-7', sender_name: 'Raj (Royal Rides)', sender_type: 'vendor', content: 'Of course! I\u2019ll send driver details once we lock in the schedule. Also, please share the hotel addresses so drivers can pre-map routes.', message_timestamp: '2026-03-07T09:45:00Z', has_media: false, media_type: null },
        { id: 'dm-1-8', sender_name: 'Simran', sender_type: 'couple', content: 'Will send hotel list by March 18. Thanks Raj!', message_timestamp: '2026-03-07T10:00:00Z', has_media: false, media_type: null },
        { id: 'dm-1-9', sender_name: 'Raj (Royal Rides)', sender_type: 'vendor', content: 'Baraat car is confirmed \u2014 white Rolls Royce with floral decoration. We\u2019ll arrive at the hotel at 9 AM sharp.', message_timestamp: '2026-03-10T14:00:00Z', has_media: false, media_type: null },
        { id: 'dm-1-10', sender_name: 'KV', sender_type: 'couple', content: 'Amazing! Can\u2019t wait \ud83d\ude4f', message_timestamp: '2026-03-10T14:30:00Z', has_media: false, media_type: null },
      ],
    }],
    vendor_insights: [
      { id: 'ddi-1-s1', insight_type: 'summary', content: 'Royal Rides is handling airport shuttle service and baraat car. 3 luxury vehicles + 1 shuttle van confirmed. Extra minivan held until March 15. White Rolls Royce booked for baraat with floral decoration. Driver coordination is in progress.', is_completed: false, priority: 'medium', due_date: null, metadata: null, created_at: '2026-03-10T15:00:00Z' },
      { id: 'ddi-1-a1', insight_type: 'action_item', content: 'Confirm guest count for airport shuttle', is_completed: false, priority: 'high', due_date: '2026-03-15', metadata: null, created_at: '2026-03-10T15:00:00Z' },
      { id: 'ddi-1-a2', insight_type: 'action_item', content: 'Send hotel addresses to driver', is_completed: false, priority: 'medium', due_date: '2026-03-18', metadata: null, created_at: '2026-03-10T15:00:00Z' },
      { id: 'ddi-1-d1', insight_type: 'decision', content: 'Extra minivan added for $150 to handle overflow airport guests', is_completed: false, priority: 'medium', due_date: null, metadata: null, created_at: '2026-03-10T15:00:00Z' },
      { id: 'ddi-1-p1', insight_type: 'price_quote', content: 'Additional minivan: $150 (held until March 15)', is_completed: false, priority: 'medium', due_date: null, metadata: null, created_at: '2026-03-10T15:00:00Z' },
    ],
  },
  'demo-2': {
    id: 'demo-2',
    name: 'Makeup Artist',
    category: 'Makeup',
    phone: '+1 (555) 345-6789',
    email: 'priya@glamourbypriya.com',
    status: 'booked',
    notes: null,
    vendor_conversations: [{
      id: 'demo-conv-2',
      title: 'Glamour by Priya Chat',
      message_count: 52,
      last_message_at: '2026-03-09T18:45:00Z',
      status: 'active',
      source: 'whatsapp',
      vendor_messages: [
        { id: 'dm-2-1', sender_name: 'Priya', sender_type: 'vendor', content: 'Hi Simran! Trial went so well yesterday \u2014 you looked stunning with the soft glam look. I\u2019ve saved the exact shades we used.', message_timestamp: '2026-03-01T11:00:00Z', has_media: false, media_type: null },
        { id: 'dm-2-2', sender_name: 'Simran', sender_type: 'couple', content: 'I LOVED it Priya! Exactly what I envisioned. Let\u2019s go with that look for the reception.', message_timestamp: '2026-03-01T11:20:00Z', has_media: false, media_type: null },
        { id: 'dm-2-3', sender_name: 'Priya', sender_type: 'vendor', content: 'Perfect! For the ceremony, I was thinking a slightly more traditional look with the red lip we discussed. I\u2019ll prep both palettes.', message_timestamp: '2026-03-01T11:35:00Z', has_media: false, media_type: null },
        { id: 'dm-2-4', sender_name: 'Simran', sender_type: 'couple', content: 'Yes! Red lip for the ceremony, soft glam for reception. Also, my mom might want makeup too \u2014 is that possible?', message_timestamp: '2026-03-03T14:00:00Z', has_media: false, media_type: null },
        { id: 'dm-2-5', sender_name: 'Priya', sender_type: 'vendor', content: 'Absolutely! I offer a 20% family discount for mom. Just let me know by March 14 so I can block the extra time slot.', message_timestamp: '2026-03-03T14:15:00Z', has_media: false, media_type: null },
        { id: 'dm-2-6', sender_name: 'Neha (Planner)', sender_type: 'planner', content: 'Priya, what time should we schedule the bridal suite for makeup? Ceremony is at 11 AM.', message_timestamp: '2026-03-06T09:00:00Z', has_media: false, media_type: null },
        { id: 'dm-2-7', sender_name: 'Priya', sender_type: 'vendor', content: 'For bride + 4 bridesmaids, I\u2019d need to start at 5:30 AM. If mom is added, 5:00 AM. I\u2019ll bring two assistants.', message_timestamp: '2026-03-06T09:30:00Z', has_media: false, media_type: null },
        { id: 'dm-2-8', sender_name: 'Simran', sender_type: 'couple', content: 'That works! I\u2019ll confirm about mom by next week. Thanks Priya \u2764\ufe0f', message_timestamp: '2026-03-06T10:00:00Z', has_media: false, media_type: null },
        { id: 'dm-2-9', sender_name: 'Priya', sender_type: 'vendor', content: 'Quick reminder \u2014 can you confirm about your mom by March 14? Need to lock in the timeline.', message_timestamp: '2026-03-09T18:45:00Z', has_media: false, media_type: null },
      ],
    }],
    vendor_insights: [
      { id: 'ddi-2-s1', insight_type: 'summary', content: 'Priya is booked for bridal makeup, 4 bridesmaids, and potentially mother of the bride. Trial completed Feb 28 \u2014 bride chose soft glam for reception, red lip for ceremony. 20% family discount available for mom. Start time 5:00-5:30 AM depending on whether mom is included.', is_completed: false, priority: 'medium', due_date: null, metadata: null, created_at: '2026-03-09T19:00:00Z' },
      { id: 'ddi-2-a1', insight_type: 'action_item', content: 'Confirm if mom wants makeup \u2014 20% family discount available', is_completed: false, priority: 'medium', due_date: '2026-03-14', metadata: null, created_at: '2026-03-09T19:00:00Z' },
      { id: 'ddi-2-d1', insight_type: 'decision', content: 'Soft glam look for reception, traditional red lip for ceremony', is_completed: false, priority: 'medium', due_date: null, metadata: null, created_at: '2026-03-09T19:00:00Z' },
      { id: 'ddi-2-d2', insight_type: 'decision', content: 'Makeup start time: 5:30 AM (or 5:00 AM if mom joins)', is_completed: false, priority: 'medium', due_date: null, metadata: null, created_at: '2026-03-09T19:00:00Z' },
    ],
  },
  'demo-3': {
    id: 'demo-3',
    name: 'DJ',
    category: 'DJ/Music',
    phone: '+1 (555) 456-7890',
    email: 'bookings@djmantra.com',
    status: 'active',
    notes: null,
    vendor_conversations: [{
      id: 'demo-conv-3',
      title: 'DJ Mantra Group',
      message_count: 21,
      last_message_at: '2026-03-11T10:15:00Z',
      status: 'active',
      source: 'whatsapp',
      vendor_messages: [
        { id: 'dm-3-1', sender_name: 'DJ Mantra', sender_type: 'vendor', content: 'Hey guys! Quick update \u2014 I\u2019ve started prepping the sangeet playlist based on your Spotify list. Love the mix of Bollywood + Punjabi tracks.', message_timestamp: '2026-03-04T15:00:00Z', has_media: false, media_type: null },
        { id: 'dm-3-2', sender_name: 'KV', sender_type: 'couple', content: 'Awesome! We also want to add a few more songs. Will send the updated list by next week.', message_timestamp: '2026-03-04T15:30:00Z', has_media: false, media_type: null },
        { id: 'dm-3-3', sender_name: 'DJ Mantra', sender_type: 'vendor', content: 'Perfect. Also, do you have a do-not-play list? Some couples have songs they absolutely don\u2019t want at the reception.', message_timestamp: '2026-03-04T15:45:00Z', has_media: false, media_type: null },
        { id: 'dm-3-4', sender_name: 'Simran', sender_type: 'couple', content: 'Yes! I have a few. I\u2019ll compile it and send with the song requests.', message_timestamp: '2026-03-04T16:00:00Z', has_media: false, media_type: null },
        { id: 'dm-3-5', sender_name: 'DJ Mantra', sender_type: 'vendor', content: 'Great. Need everything by March 16 at the latest so I can finalize the setlist. Also \u2014 important question: does the venue have 3-phase power outlets? My speaker system needs it and I\u2019ve had issues at some venues before.', message_timestamp: '2026-03-06T11:00:00Z', has_media: false, media_type: null },
        { id: 'dm-3-6', sender_name: 'Neha (Planner)', sender_type: 'planner', content: 'I\u2019ll check with Grand Orchid about the power setup. How many outlets do you need total?', message_timestamp: '2026-03-06T11:30:00Z', has_media: false, media_type: null },
        { id: 'dm-3-7', sender_name: 'DJ Mantra', sender_type: 'vendor', content: 'I need at least 2 dedicated 3-phase outlets near the stage area. If they only have single-phase, I\u2019ll need to bring a converter which adds $200.', message_timestamp: '2026-03-06T11:45:00Z', has_media: false, media_type: null },
        { id: 'dm-3-8', sender_name: 'KV', sender_type: 'couple', content: 'Let\u2019s get this sorted ASAP. The venue should have 3-phase \u2014 it\u2019s a big hotel.', message_timestamp: '2026-03-06T12:00:00Z', has_media: false, media_type: null },
        { id: 'dm-3-9', sender_name: 'DJ Mantra', sender_type: 'vendor', content: 'Also confirming \u2014 I\u2019ll be bringing my full setup: 4 speakers, 2 subs, lighting rig, and wireless mics. Setup starts at 2 PM for the evening events.', message_timestamp: '2026-03-11T10:15:00Z', has_media: false, media_type: null },
      ],
    }],
    vendor_insights: [
      { id: 'ddi-3-s1', insight_type: 'summary', content: 'DJ Mantra is confirmed for sangeet and reception. Working on playlist from couple\u2019s Spotify list. Needs final song requests + do-not-play list by March 16. Critical: venue needs to confirm 3-phase power availability \u2014 converter costs $200 extra if not available.', is_completed: false, priority: 'medium', due_date: null, metadata: null, created_at: '2026-03-11T11:00:00Z' },
      { id: 'ddi-3-a1', insight_type: 'action_item', content: 'Send final song request + do-not-play list', is_completed: false, priority: 'high', due_date: '2026-03-16', metadata: null, created_at: '2026-03-11T11:00:00Z' },
      { id: 'ddi-3-a2', insight_type: 'action_item', content: 'Check venue for 3-phase power outlet', is_completed: false, priority: 'urgent', due_date: '2026-03-12', metadata: null, created_at: '2026-03-11T11:00:00Z' },
      { id: 'ddi-3-p1', insight_type: 'price_quote', content: 'Power converter (if needed): $200 extra', is_completed: false, priority: 'medium', due_date: null, metadata: null, created_at: '2026-03-11T11:00:00Z' },
      { id: 'ddi-3-dl1', insight_type: 'deadline', content: 'Final setlist lock: March 16', is_completed: false, priority: 'high', due_date: '2026-03-16', metadata: null, created_at: '2026-03-11T11:00:00Z' },
    ],
  },
  'demo-4': {
    id: 'demo-4',
    name: 'Venue',
    category: 'Venue',
    phone: '+1 (555) 567-8901',
    email: 'events@grandorchidhotel.com',
    status: 'booked',
    notes: null,
    vendor_conversations: [{
      id: 'demo-conv-4',
      title: 'Grand Orchid Wedding Group',
      message_count: 67,
      last_message_at: '2026-03-11T09:00:00Z',
      status: 'active',
      source: 'whatsapp',
      vendor_messages: [
        { id: 'dm-4-1', sender_name: 'Anita (Grand Orchid)', sender_type: 'vendor', content: 'Good morning! Just confirming your menu tasting is set for March 13 at 1 PM. You\u2019ll sample 8 dishes \u2014 4 veg, 4 non-veg.', message_timestamp: '2026-03-03T09:00:00Z', has_media: false, media_type: null },
        { id: 'dm-4-2', sender_name: 'Simran', sender_type: 'couple', content: 'Can\u2019t wait! Will my parents be able to join the tasting too?', message_timestamp: '2026-03-03T09:30:00Z', has_media: false, media_type: null },
        { id: 'dm-4-3', sender_name: 'Anita (Grand Orchid)', sender_type: 'vendor', content: 'Of course! Up to 6 people can attend the tasting, no extra charge. After the tasting, we\u2019ll need your final menu selections within 48 hours.', message_timestamp: '2026-03-03T09:45:00Z', has_media: false, media_type: null },
        { id: 'dm-4-4', sender_name: 'Neha (Planner)', sender_type: 'planner', content: 'Anita, can we also discuss the room block during the tasting? We need to update the guest list.', message_timestamp: '2026-03-05T14:00:00Z', has_media: false, media_type: null },
        { id: 'dm-4-5', sender_name: 'Anita (Grand Orchid)', sender_type: 'vendor', content: 'Absolutely. Currently holding 45 rooms. Let me know the updated count \u2014 we can adjust up to 60. Cutoff for room block changes is March 15.', message_timestamp: '2026-03-05T14:20:00Z', has_media: false, media_type: null },
        { id: 'dm-4-6', sender_name: 'KV', sender_type: 'couple', content: 'We might need closer to 55 rooms. I\u2019ll send the updated list soon.', message_timestamp: '2026-03-05T15:00:00Z', has_media: false, media_type: null },
        { id: 'dm-4-7', sender_name: 'Anita (Grand Orchid)', sender_type: 'vendor', content: 'No problem! Also, regarding parking \u2014 our lot accommodates 40 cars. For 60+ vehicles, we can arrange overflow parking at the adjacent lot for $500. Just need to know by March 17.', message_timestamp: '2026-03-08T10:00:00Z', has_media: false, media_type: null },
        { id: 'dm-4-8', sender_name: 'Neha (Planner)', sender_type: 'planner', content: 'Good to know. We\u2019ll estimate car count from the RSVP numbers and confirm.', message_timestamp: '2026-03-08T10:30:00Z', has_media: false, media_type: null },
        { id: 'dm-4-9', sender_name: 'Anita (Grand Orchid)', sender_type: 'vendor', content: 'One more thing \u2014 the ballroom will be set up starting 6 AM on wedding day. Ceremony area in the garden will be ready by 9 AM. Does that timeline work?', message_timestamp: '2026-03-11T09:00:00Z', has_media: false, media_type: null },
        { id: 'dm-4-10', sender_name: 'Simran', sender_type: 'couple', content: 'That\u2019s perfect! See you at the tasting \ud83c\udf7d\ufe0f', message_timestamp: '2026-03-11T09:15:00Z', has_media: false, media_type: null },
      ],
    }],
    vendor_insights: [
      { id: 'ddi-4-s1', insight_type: 'summary', content: 'Grand Orchid Hotel confirmed as main venue for all events. Room block: 45 rooms held (may expand to 55). Menu tasting March 13 \u2014 final selections due within 48 hours. Parking lot holds 40 cars; overflow lot available at $500 for 60+ vehicles. Setup timeline: ballroom at 6 AM, garden ceremony at 9 AM.', is_completed: false, priority: 'medium', due_date: null, metadata: null, created_at: '2026-03-11T10:00:00Z' },
      { id: 'ddi-4-a1', insight_type: 'action_item', content: 'Finalize menu after tasting', is_completed: false, priority: 'high', due_date: '2026-03-13', metadata: null, created_at: '2026-03-11T10:00:00Z' },
      { id: 'ddi-4-a2', insight_type: 'action_item', content: 'Share updated room block list', is_completed: false, priority: 'medium', due_date: '2026-03-15', metadata: null, created_at: '2026-03-11T10:00:00Z' },
      { id: 'ddi-4-a3', insight_type: 'action_item', content: 'Confirm parking for 60+ cars', is_completed: false, priority: 'low', due_date: '2026-03-17', metadata: null, created_at: '2026-03-11T10:00:00Z' },
      { id: 'ddi-4-d1', insight_type: 'decision', content: 'Room block expandable to 60 rooms (cutoff March 15)', is_completed: false, priority: 'medium', due_date: null, metadata: null, created_at: '2026-03-11T10:00:00Z' },
      { id: 'ddi-4-p1', insight_type: 'price_quote', content: 'Overflow parking lot: $500 for event day', is_completed: false, priority: 'medium', due_date: null, metadata: null, created_at: '2026-03-11T10:00:00Z' },
      { id: 'ddi-4-dl1', insight_type: 'deadline', content: 'Room block changes cutoff: March 15', is_completed: false, priority: 'high', due_date: '2026-03-15', metadata: null, created_at: '2026-03-11T10:00:00Z' },
      { id: 'ddi-4-dl2', insight_type: 'deadline', content: 'Parking confirmation needed by March 17', is_completed: false, priority: 'medium', due_date: '2026-03-17', metadata: null, created_at: '2026-03-11T10:00:00Z' },
    ],
  },
  'demo-5': {
    id: 'demo-5',
    name: 'Decor',
    category: 'Decor',
    phone: '+1 (555) 678-9012',
    email: 'team@luminaevents.com',
    status: 'active',
    notes: null,
    vendor_conversations: [{
      id: 'demo-conv-5',
      title: 'Lumina Events Decor',
      message_count: 18,
      last_message_at: '2026-03-10T16:20:00Z',
      status: 'active',
      source: 'whatsapp',
      vendor_messages: [
        { id: 'dm-5-1', sender_name: 'Tanya (Lumina)', sender_type: 'vendor', content: 'Hi! I\u2019ve finalized the mood board for your mandap design. It includes the white and gold theme with fresh florals and hanging crystals. Sending it now.', message_timestamp: '2026-03-05T13:00:00Z', has_media: false, media_type: null },
        { id: 'dm-5-2', sender_name: 'Simran', sender_type: 'couple', content: 'Oh my god, I love it! The hanging crystals are gorgeous. KV, what do you think?', message_timestamp: '2026-03-05T13:30:00Z', has_media: false, media_type: null },
        { id: 'dm-5-3', sender_name: 'KV', sender_type: 'couple', content: 'Looks incredible! Only question \u2014 can we add some greenery to balance the gold? Maybe some eucalyptus?', message_timestamp: '2026-03-05T14:00:00Z', has_media: false, media_type: null },
        { id: 'dm-5-4', sender_name: 'Tanya (Lumina)', sender_type: 'vendor', content: 'Great idea! Eucalyptus garlands would look beautiful along the mandap pillars. I\u2019ll update the mood board and send a revised version. No extra cost for the greenery.', message_timestamp: '2026-03-05T14:20:00Z', has_media: false, media_type: null },
        { id: 'dm-5-5', sender_name: 'Neha (Planner)', sender_type: 'planner', content: 'Tanya, what\u2019s the timeline for ordering materials? We want to make sure everything arrives in time.', message_timestamp: '2026-03-07T11:00:00Z', has_media: false, media_type: null },
        { id: 'dm-5-6', sender_name: 'Tanya (Lumina)', sender_type: 'vendor', content: 'I need the final mood board approval by March 14. That gives us 8 days to order specialty items. Standard items I already have in stock.', message_timestamp: '2026-03-07T11:30:00Z', has_media: false, media_type: null },
        { id: 'dm-5-7', sender_name: 'Tanya (Lumina)', sender_type: 'vendor', content: 'Budget update: we\u2019re at $8,500 total \u2014 mandap ($3,200), stage setup ($2,000), floral arrangements ($1,800), and lighting ($1,500). Everything within the agreed budget.', message_timestamp: '2026-03-10T16:00:00Z', has_media: false, media_type: null },
        { id: 'dm-5-8', sender_name: 'Simran', sender_type: 'couple', content: 'Looks great, right on budget! Will review the updated mood board this weekend and give you the green light.', message_timestamp: '2026-03-10T16:20:00Z', has_media: false, media_type: null },
      ],
    }],
    vendor_insights: [
      { id: 'ddi-5-s1', insight_type: 'summary', content: 'Lumina Events handling all decor \u2014 mandap, stage, florals, and lighting. White and gold theme with hanging crystals, couple requested eucalyptus greenery addition (no extra cost). Mood board approval needed by March 14 for material ordering. Total budget: $8,500 (on track).', is_completed: false, priority: 'medium', due_date: null, metadata: null, created_at: '2026-03-10T17:00:00Z' },
      { id: 'ddi-5-a1', insight_type: 'action_item', content: 'Approve final mood board for mandap design', is_completed: false, priority: 'high', due_date: '2026-03-14', metadata: null, created_at: '2026-03-10T17:00:00Z' },
      { id: 'ddi-5-d1', insight_type: 'decision', content: 'White and gold theme with eucalyptus garlands on mandap pillars', is_completed: false, priority: 'medium', due_date: null, metadata: null, created_at: '2026-03-10T17:00:00Z' },
      { id: 'ddi-5-p1', insight_type: 'price_quote', content: 'Total decor: $8,500 (mandap $3,200, stage $2,000, florals $1,800, lighting $1,500)', is_completed: false, priority: 'medium', due_date: null, metadata: null, created_at: '2026-03-10T17:00:00Z' },
      { id: 'ddi-5-dl1', insight_type: 'deadline', content: 'Mood board approval deadline: March 14 (for material ordering)', is_completed: false, priority: 'high', due_date: '2026-03-14', metadata: null, created_at: '2026-03-10T17:00:00Z' },
    ],
  },
};

// ─── Mock members per vendor ──────────────────────────────────────────────────

export const DEMO_MEMBERS: Record<string, DemoMember[]> = {
  'demo-1': [
    { id: 'dm1-1', name: 'Raj Malhotra', role: 'vendor', phone: '+1 (555) 234-5678' },
    { id: 'dm1-2', name: 'KV', role: 'admin' },
    { id: 'dm1-3', name: 'Simran', role: 'admin' },
    { id: 'dm1-4', name: 'Neha Sharma', role: 'member' },
  ],
  'demo-2': [
    { id: 'dm2-1', name: 'Priya Kapoor', role: 'vendor', phone: '+1 (555) 345-6789' },
    { id: 'dm2-2', name: 'Simran', role: 'admin' },
    { id: 'dm2-3', name: 'Neha Sharma', role: 'member' },
  ],
  'demo-3': [
    { id: 'dm3-1', name: 'DJ Mantra', role: 'vendor', phone: '+1 (555) 456-7890' },
    { id: 'dm3-2', name: 'KV', role: 'admin' },
    { id: 'dm3-3', name: 'Simran', role: 'admin' },
    { id: 'dm3-4', name: 'Neha Sharma', role: 'member' },
  ],
  'demo-4': [
    { id: 'dm4-1', name: 'Anita Verma', role: 'vendor', phone: '+1 (555) 567-8901' },
    { id: 'dm4-2', name: 'KV', role: 'admin' },
    { id: 'dm4-3', name: 'Simran', role: 'admin' },
    { id: 'dm4-4', name: 'Neha Sharma', role: 'member' },
  ],
  'demo-5': [
    { id: 'dm5-1', name: 'Tanya Singh', role: 'vendor', phone: '+1 (555) 678-9012' },
    { id: 'dm5-2', name: 'KV', role: 'admin' },
    { id: 'dm5-3', name: 'Simran', role: 'admin' },
    { id: 'dm5-4', name: 'Neha Sharma', role: 'member' },
  ],
};

// Demo tooltip text for disabled action buttons
export const DEMO_BUTTON_TOOLTIPS = {
  connectChat: 'Discovers WhatsApp groups that include your coordinator number',
  uploadChat: 'Import a .txt chat export from WhatsApp',
  refreshAll: 'Re-syncs all connected conversations for latest messages',
  deleteVendor: 'Remove this vendor and all its data from your coordinator',
  editVendor: 'Edit vendor name, category, and status',
  refreshInsights: 'Re-analyzes the conversation with AI to extract fresh insights',
  deleteVendorDetail: 'Remove this vendor and all its data',
  actionItemCheckbox: 'Mark action items as completed',
};
