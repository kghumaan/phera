import type { SupabaseClient } from '@supabase/supabase-js';
import { generateFallbackColor } from '@/lib/utils/avatar-generator';

/**
 * Agent Lab — disposable mock weddings for end-to-end agent testing.
 *
 * Everything here is namespaced under the `agent-lab-` slug prefix so lab
 * data can never collide with (or delete) a real wedding. The seeders write
 * through the same tables the app uses, so the agent's tools behave exactly
 * as they would for a real customer.
 */

export const LAB_SLUG_PREFIX = 'agent-lab-';

export type LabScenario = 'blank' | 'populated';

export function isLabSlug(slug: string): boolean {
  return slug.startsWith(LAB_SLUG_PREFIX);
}

function assertLabSlug(slug: string) {
  if (!isLabSlug(slug)) {
    throw new Error(`Refusing to operate on non-lab wedding "${slug}" (must start with ${LAB_SLUG_PREFIX})`);
  }
}

function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * 86_400_000);
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export interface LabSeedResult {
  slug: string;
  weddingUuid: string;
  scenario: LabScenario;
  summary: Record<string, number | string>;
}

/** Deterministic guest roster for the populated scenario. Exported for tests. */
export const GUEST_ROSTER: Array<{
  name: string;
  side: 'bride' | 'groom' | 'both';
  party: number;
  tags: string[];
  rsvp?: 'yes' | 'no' | 'maybe';
}> = [
  { name: 'Raj Mehra', side: 'bride', party: 2, tags: ['family', 'uncle'], rsvp: 'yes' },
  { name: 'Sunita Mehra', side: 'bride', party: 1, tags: ['family'], rsvp: 'yes' },
  { name: 'Arjun Sharma', side: 'groom', party: 2, tags: ['family', 'cousin'], rsvp: 'yes' },
  { name: 'Meera Sharma', side: 'groom', party: 1, tags: ['family'], rsvp: 'yes' },
  { name: 'Dev Patel', side: 'groom', party: 1, tags: ['college'], rsvp: 'yes' },
  { name: 'Sarah Chen', side: 'bride', party: 2, tags: ['friends', 'reverse-destination'], rsvp: 'yes' },
  { name: 'Michael Ross', side: 'groom', party: 1, tags: ['friends', 'reverse-destination'], rsvp: 'maybe' },
  { name: 'Priyanka Iyer', side: 'bride', party: 3, tags: ['family'], rsvp: 'yes' },
  { name: 'Vikash Iyer', side: 'bride', party: 1, tags: ['family'], rsvp: 'no' },
  { name: 'Anjali Desai', side: 'both', party: 2, tags: ['family-friends'], rsvp: 'yes' },
  { name: 'Rohan Gupta', side: 'groom', party: 1, tags: ['college'], rsvp: 'maybe' },
  { name: 'Kavya Reddy', side: 'bride', party: 2, tags: ['friends'], rsvp: 'yes' },
  { name: 'Nikhil Rao', side: 'groom', party: 1, tags: ['work'], rsvp: 'no' },
  { name: 'Isha Malhotra', side: 'bride', party: 1, tags: ['friends'], rsvp: 'yes' },
  { name: 'Tom Becker', side: 'groom', party: 2, tags: ['friends', 'reverse-destination'] },
  { name: 'Lakshmi Nair', side: 'bride', party: 4, tags: ['family'] },
  { name: 'Aditya Joshi', side: 'groom', party: 1, tags: ['family', 'cousin'] },
  { name: 'Pooja Bhatt', side: 'bride', party: 1, tags: ['college'] },
  { name: 'Sameer Khan', side: 'groom', party: 2, tags: ['friends'] },
  { name: 'Divya Menon', side: 'bride', party: 1, tags: ['work'] },
  { name: 'Hardeep Singh', side: 'groom', party: 3, tags: ['family'] },
  { name: 'Natasha Verma', side: 'both', party: 1, tags: ['family-friends'] },
  { name: 'Karan Kapoor', side: 'groom', party: 1, tags: ['college'] },
  { name: 'Ritu Agarwal', side: 'bride', party: 2, tags: ['family'] },
];

export async function seedLabWedding(
  supabase: SupabaseClient,
  opts: { scenario: LabScenario; ownerId: string | null }
): Promise<LabSeedResult> {
  const { scenario, ownerId } = opts;
  const suffix = crypto.randomUUID().slice(0, 8);
  const slug = `${LAB_SLUG_PREFIX}${suffix}`;

  const weddingDate = daysFromNow(210);
  const weddingEnd = daysFromNow(212);

  const weddingRow =
    scenario === 'blank'
      ? {
          slug,
          couple_name: 'Anaya & Vikram',
          partner1_name: 'Anaya',
          partner2_name: 'Vikram',
          // Same placeholders the onboarding wizard writes for TBD
          wedding_date: new Date(0).toISOString(),
          wedding_date_display: 'Dates TBD',
          venue_name: 'Venue TBD',
          venue_location: '',
          rsvp_deadline: '',
          status: 'draft',
          created_by: ownerId,
        }
      : {
          slug,
          couple_name: 'Anaya & Vikram',
          partner1_name: 'Anaya',
          partner2_name: 'Vikram',
          wedding_date: weddingDate.toISOString(),
          wedding_date_end: weddingEnd.toISOString(),
          wedding_date_display: 'WEDDING WEEKEND',
          venue_name: 'Taj Lake Palace',
          venue_location: 'Udaipur, India',
          rsvp_deadline: isoDate(daysFromNow(150)),
          welcome_text: 'Three days of celebration on Lake Pichola — we cannot wait to see you!',
          status: 'draft',
          created_by: ownerId,
        };

  const { data: wedding, error: weddingError } = await supabase
    .from('weddings')
    .insert(weddingRow)
    .select('id, slug')
    .single();
  if (weddingError || !wedding) {
    throw new Error(`Failed to create lab wedding: ${weddingError?.message}`);
  }
  const weddingUuid = wedding.id as string;

  if (scenario === 'blank') {
    return { slug, weddingUuid, scenario, summary: { guests: 0, rooms: 0, events: 0 } };
  }

  // ── Events (uuid-keyed) ─────────────────────────────────────────────
  const eventRows = [
    { name: 'Mehndi', slug: 'mehndi', date: isoDate(weddingDate), time: '4:00 PM', dress_code: 'Colourful festive' },
    { name: 'Sangeet', slug: 'sangeet', date: isoDate(weddingDate), time: '8:00 PM', dress_code: 'Indo-western glam' },
    { name: 'Pheras', slug: 'pheras', date: isoDate(daysFromNow(211)), time: '10:00 AM', dress_code: 'Traditional' },
    { name: 'Reception', slug: 'reception', date: isoDate(weddingEnd), time: '7:00 PM', dress_code: 'Black tie with a twist' },
  ].map((e, i) => ({ ...e, wedding_id: weddingUuid, order_index: i }));
  const { error: eventsError } = await supabase.from('wedding_events').insert(eventRows);
  if (eventsError) throw new Error(`Failed to seed events: ${eventsError.message}`);

  // ── Schedule days + items (uuid-keyed) ──────────────────────────────
  const dayDefs = [
    {
      day_name: 'Day 1 — Mehndi & Sangeet',
      date: isoDate(weddingDate),
      items: [
        { name: 'Welcome lunch', time: '12:30 PM', location: 'Lily Pond Courtyard' },
        { name: 'Mehndi', time: '4:00 PM', location: 'Lily Pond Courtyard' },
        { name: 'Sangeet night', time: '8:00 PM', location: 'Grand Durbar Hall' },
      ],
    },
    {
      day_name: 'Day 2 — Wedding',
      date: isoDate(daysFromNow(211)),
      items: [
        { name: 'Baraat', time: '9:00 AM', location: 'Palace Jetty' },
        { name: 'Pheras', time: '10:00 AM', location: 'Mayur Mahal' },
        { name: 'Family dinner', time: '8:00 PM', location: 'Neel Kamal' },
      ],
    },
    {
      day_name: 'Day 3 — Reception',
      date: isoDate(weddingEnd),
      items: [
        { name: 'Farewell brunch', time: '11:00 AM', location: 'Amrit Sagar Bar' },
        { name: 'Reception', time: '7:00 PM', location: 'Grand Durbar Hall' },
      ],
    },
  ];
  let scheduleItemCount = 0;
  for (let d = 0; d < dayDefs.length; d++) {
    const def = dayDefs[d];
    const { data: day, error: dayError } = await supabase
      .from('wedding_schedule')
      .insert({ wedding_id: weddingUuid, date: def.date, day_name: def.day_name, order_index: d })
      .select('id')
      .single();
    if (dayError || !day) throw new Error(`Failed to seed schedule day: ${dayError?.message}`);
    const items = def.items.map((item, i) => ({ ...item, schedule_id: day.id, order_index: i }));
    const { error: itemsError } = await supabase.from('schedule_items').insert(items);
    if (itemsError) throw new Error(`Failed to seed schedule items: ${itemsError.message}`);
    scheduleItemCount += items.length;
  }

  // ── Guests (slug-keyed) ─────────────────────────────────────────────
  const guestRows = GUEST_ROSTER.map((g, i) => ({
    wedding_id: slug,
    name: g.name,
    email: `${g.name.toLowerCase().replace(/[^a-z]+/g, '.')}@example.com`,
    phone: `+1415555${String(1000 + i)}`,
    wedding_side: g.side,
    avatar_color: generateFallbackColor(g.name),
    logistics_data: { party_size: g.party, tags: g.tags },
  }));
  const { data: guests, error: guestsError } = await supabase
    .from('guests')
    .insert(guestRows)
    .select('id, name');
  if (guestsError || !guests) throw new Error(`Failed to seed guests: ${guestsError?.message}`);
  const guestIdByName = new Map<string, string>(guests.map((g) => [g.name as string, g.id as string]));

  // ── RSVPs (slug-keyed; attending is 'yes'|'no'|'maybe') ─────────────
  const rsvpRows = GUEST_ROSTER.filter((g) => g.rsvp).map((g) => ({
    wedding_id: slug,
    guest_id: guestIdByName.get(g.name),
    event_id: 'general',
    attending: g.rsvp as string,
    guest_count: g.rsvp === 'yes' ? g.party : 0,
  }));
  const { error: rsvpError } = await supabase.from('rsvps').insert(rsvpRows);
  if (rsvpError) throw new Error(`Failed to seed rsvps: ${rsvpError.message}`);

  // ── Rooms (slug-keyed) — Uncle Raj is in 204, of course ─────────────
  const assign = (...names: string[]) =>
    names.map((n) => guestIdByName.get(n)).filter(Boolean) as string[];
  const roomRows = [
    { room_number: '201', floor: '2', capacity: 2, bed_type: 'King', assigned_guest_ids: assign('Arjun Sharma') },
    { room_number: '202', floor: '2', capacity: 2, bed_type: 'Twin', assigned_guest_ids: assign('Dev Patel', 'Rohan Gupta') },
    { room_number: '203', floor: '2', capacity: 3, bed_type: 'King + cot', assigned_guest_ids: assign('Priyanka Iyer') },
    { room_number: '204', floor: '2', capacity: 2, bed_type: 'King', assigned_guest_ids: assign('Raj Mehra', 'Sunita Mehra') },
    { room_number: '301', floor: '3', capacity: 2, bed_type: 'Queen', assigned_guest_ids: assign('Sarah Chen') },
    { room_number: '302', floor: '3', capacity: 2, bed_type: 'Queen', assigned_guest_ids: [] },
    { room_number: '303', floor: '3', capacity: 4, bed_type: 'Suite', assigned_guest_ids: [] },
    { room_number: '304', floor: '3', capacity: 2, bed_type: 'King', assigned_guest_ids: [] },
  ].map((r) => ({ ...r, wedding_id: slug, hotel_name: 'Taj Lake Palace', source: 'manual' }));
  const { error: roomsError } = await supabase.from('wedding_rooms').insert(roomRows);
  if (roomsError) throw new Error(`Failed to seed rooms: ${roomsError.message}`);

  // ── Vendors (uuid-keyed) ────────────────────────────────────────────
  const vendorRows = [
    { name: 'Rasoi Royal Catering', category: 'catering', status: 'active' },
    { name: 'Lens & Light Studios', category: 'photography', status: 'active' },
    { name: 'Marigold Dreams Decor', category: 'decor', status: 'active' },
  ].map((v) => ({ ...v, wedding_id: weddingUuid }));
  const { error: vendorsError } = await supabase.from('vendors').insert(vendorRows);
  if (vendorsError) throw new Error(`Failed to seed vendors: ${vendorsError.message}`);

  // ── FAQs + tasks (uuid-keyed) ───────────────────────────────────────
  const { error: faqError } = await supabase.from('wedding_faqs').insert([
    {
      wedding_id: weddingUuid,
      question: 'What is the dress code?',
      answer: 'Each event has its own vibe — check the schedule. When in doubt: festive and colourful.',
    },
    {
      wedding_id: weddingUuid,
      question: 'How do we get to the palace?',
      answer: 'Boats run from the City Palace jetty every 15 minutes. Shuttle details to follow.',
    },
  ]);
  if (faqError) throw new Error(`Failed to seed FAQs: ${faqError.message}`);

  const { error: taskError } = await supabase.from('wedding_tasks').insert([
    { wedding_id: weddingUuid, title: 'Confirm boat shuttle timings with hotel', column: 'todo' },
    { wedding_id: weddingUuid, title: 'Finalize sangeet performance order', column: 'doing' },
  ]);
  if (taskError) throw new Error(`Failed to seed tasks: ${taskError.message}`);

  return {
    slug,
    weddingUuid,
    scenario,
    summary: {
      guests: guestRows.length,
      rsvps: rsvpRows.length,
      rooms: roomRows.length,
      events: eventRows.length,
      schedule_days: dayDefs.length,
      schedule_items: scheduleItemCount,
      vendors: vendorRows.length,
      faqs: 2,
      tasks: 2,
    },
  };
}

export interface LabTeardownResult {
  slug: string;
  deleted: Record<string, number>;
}

export async function teardownLabWedding(
  supabase: SupabaseClient,
  slug: string
): Promise<LabTeardownResult> {
  assertLabSlug(slug);
  const { data: wedding } = await supabase.from('weddings').select('id').eq('slug', slug).single();
  if (!wedding) throw new Error(`Lab wedding not found: ${slug}`);
  const uuid = wedding.id as string;

  const deleted: Record<string, number> = {};
  const del = async (table: string, column: string, value: string) => {
    const { data } = await supabase.from(table).delete().eq(column, value).select('id');
    deleted[table] = (deleted[table] ?? 0) + (data?.length ?? 0);
  };

  // Conversations cascade messages/actions/feedback via FK.
  await del('agent_conversations', 'wedding_id', slug);
  await del('agent_actions', 'wedding_id', slug); // any rows without a conversation
  await del('agent_knowledge', 'wedding_id', slug);
  await del('rsvps', 'wedding_id', slug);
  await del('wedding_rooms', 'wedding_id', slug);
  await del('guests', 'wedding_id', slug);

  const { data: days } = await supabase.from('wedding_schedule').select('id').eq('wedding_id', uuid);
  for (const day of days ?? []) {
    await del('schedule_items', 'schedule_id', day.id as string);
  }
  await del('wedding_schedule', 'wedding_id', uuid);
  await del('wedding_events', 'wedding_id', uuid);
  await del('vendors', 'wedding_id', uuid);
  await del('wedding_faqs', 'wedding_id', uuid);
  await del('wedding_tasks', 'wedding_id', uuid);
  await del('wedding_settings', 'wedding_id', uuid);
  await del('weddings', 'id', uuid);

  return { slug, deleted };
}

export interface LabState {
  wedding: Record<string, unknown> | null;
  guests: unknown[];
  rsvps: unknown[];
  rooms: unknown[];
  events: unknown[];
  schedule: unknown[];
  vendors: unknown[];
  faqs: unknown[];
  tasks: unknown[];
  agent: {
    conversations: unknown[];
    messages: unknown[];
    actions: unknown[];
  };
}

/** Full data dump used to verify mutations after agent turns. */
export async function dumpLabState(supabase: SupabaseClient, slug: string): Promise<LabState> {
  assertLabSlug(slug);
  const { data: wedding } = await supabase
    .from('weddings')
    .select(
      'id, slug, couple_name, partner1_name, partner2_name, wedding_date, wedding_date_end, wedding_date_display, venue_name, venue_location, rsvp_deadline, welcome_text, status'
    )
    .eq('slug', slug)
    .single();
  if (!wedding) throw new Error(`Lab wedding not found: ${slug}`);
  const uuid = wedding.id as string;

  const [guests, rsvps, rooms, events, days, items, vendors, faqs, tasks, conversations, messages, actions] =
    await Promise.all([
      supabase
        .from('guests')
        .select('id, name, email, phone, wedding_side, logistics_data, outreach_status')
        .eq('wedding_id', slug)
        .order('name'),
      supabase.from('rsvps').select('id, guest_id, event_id, attending, guest_count').eq('wedding_id', slug),
      supabase
        .from('wedding_rooms')
        .select('id, room_number, hotel_name, floor, capacity, bed_type, notes, assigned_guest_ids')
        .eq('wedding_id', slug)
        .order('room_number'),
      supabase
        .from('wedding_events')
        .select('id, name, slug, date, time, dress_code, order_index')
        .eq('wedding_id', uuid)
        .order('order_index'),
      supabase.from('wedding_schedule').select('id, day_name, date, order_index').eq('wedding_id', uuid).order('order_index'),
      supabase.from('schedule_items').select('id, schedule_id, name, time, location, description, dress_code, order_index'),
      supabase.from('vendors').select('id, name, category, status, phone, email, notes').eq('wedding_id', uuid),
      supabase.from('wedding_faqs').select('id, question, answer').eq('wedding_id', uuid),
      supabase.from('wedding_tasks').select('id, title, description, column, tags').eq('wedding_id', uuid),
      supabase
        .from('agent_conversations')
        .select('id, channel, created_at, last_message_at')
        .eq('wedding_id', slug)
        .order('created_at'),
      supabase
        .from('agent_messages')
        .select('id, conversation_id, role, content, created_at')
        .order('created_at')
        .limit(500),
      supabase
        .from('agent_actions')
        .select('id, conversation_id, tool_name, input, result, status, risk, created_at')
        .eq('wedding_id', slug)
        .order('created_at'),
    ]);

  const conversationIds = new Set((conversations.data ?? []).map((c) => c.id));

  return {
    wedding,
    guests: guests.data ?? [],
    rsvps: rsvps.data ?? [],
    rooms: rooms.data ?? [],
    events: events.data ?? [],
    schedule: (days.data ?? []).map((d) => ({
      ...d,
      items: (items.data ?? []).filter((i) => i.schedule_id === d.id),
    })),
    vendors: vendors.data ?? [],
    faqs: faqs.data ?? [],
    tasks: tasks.data ?? [],
    agent: {
      conversations: conversations.data ?? [],
      messages: (messages.data ?? []).filter((m) => conversationIds.has(m.conversation_id)),
      actions: actions.data ?? [],
    },
  };
}
