/* eslint-disable @typescript-eslint/no-explicit-any -- bulk table cloning: generated supabase types don't cover every runtime row shape, and dynamic table name arguments require `as any` casts that make per-line disables noisy. */
import { createClient } from '@supabase/supabase-js';
import { PheraDatabase } from '@/lib/supabase/types';
import { seedDemoMockData } from './seed-demo-mock-data';
import { generateGuestAvatar, generateFallbackColor } from '@/lib/utils/avatar-generator';

const TEMPLATE_SLUG = 'demo-template';
const DEMO_SLUG_PREFIX = 'demo-';
const DEMO_MAX_AGE_MS = 2 * 60 * 60 * 1000; // 2 hours

// ---------------------------------------------------------------------------
// Standard demo schedule + events. Every demo clone renders this exact
// 3-day layout — edit here to change all future demos.
//
//   Day 1: Check In (minor) → Welcome Lunch & Haldi (major) → Sangeet (major)
//   Day 2: Breakfast (minor) → Wedding Ceremony (major) → High Tea (minor) → Reception (major)
//   Day 3: Breakfast (minor) → Checkout (minor)
//
// Event content (dress codes, carousel slides, ritual descriptions) is
// derived from the template's original Haldi / Mehendi+Sangeet / Varmala /
// Reception rows; Sangeet strips the mehendi portion per product spec.
// ---------------------------------------------------------------------------

function resolveBaseDate(weddingDate: string | null | undefined): string {
  // weddings.wedding_date comes back as ISO timestamp or plain date.
  // Fall back to a fixed date so this never crashes on a malformed value.
  if (!weddingDate) return '2026-12-11';
  const d = new Date(weddingDate);
  if (isNaN(d.getTime())) return '2026-12-11';
  return d.toISOString().slice(0, 10);
}

function addDaysISO(baseISO: string, days: number): string {
  const [y, m, d] = baseISO.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

type StandardEvent = {
  slug: string;
  name: string;
  day_offset: number;
  time: string;
  dress_code: string;
  dress_code_description: string;
  dress_code_icon: string | null;
  gradient_background: string;
  text_color: string;
  ritual_name: string;
  ritual_description: string;
  outfit_example_url: string | null;
  outfit_ideas_men: unknown;
  outfit_ideas_women: unknown;
  carousel_slides: unknown;
  carousel_images: unknown;
  order_index: number;
};

const STANDARD_EVENTS: readonly StandardEvent[] = [
  // Day 1 — Welcome Lunch & Haldi
  {
    slug: 'welcome-lunch-haldi',
    name: 'Welcome Lunch & Haldi',
    day_offset: 0,
    time: '12:30 PM',
    dress_code: 'Yellow & White Casuals',
    dress_code_description:
      'Wear yellow or white — you will get turmeric on you! Light kurtas, cotton suits, or casual Indian wear. Leave your fancy outfits for later.',
    dress_code_icon: null,
    gradient_background: '#FA9A00',
    text_color: '#141414',
    ritual_name: 'Haldi',
    ritual_description:
      'The Haldi ceremony involves applying a paste of turmeric, sandalwood, and rosewater to the bride and groom. Turmeric is believed to purify, bless, and bring a natural glow. It often turns into a joyful, playful celebration!',
    outfit_example_url: null,
    outfit_ideas_men: [],
    outfit_ideas_women: [],
    carousel_slides: [
      {
        type: 'three_lines',
        body_text:
          'Embrace the Haldi spirit! Wear cheerful yellows or clean whites. Since turmeric stains are expected, opt for comfortable and casual cotton kurtas, breezy suits, or relaxed summer wear.',
        top_label: 'WELCOME & HALDI',
        main_heading: 'Sunshine Bright',
      },
      { src: '/images/collage/Dress Codes-5-Haldi Women.png', type: 'image' },
      {
        type: 'two_sections',
        section1_items: ['Yellow Cotton Suits', 'Simple Lehengas', 'White Chikankari'],
        section2_items: ['Yellow Kurtas', 'White Linen Shirts', 'Comfortable Trousers'],
        section1_header: 'Women',
        section2_header: 'Men',
      },
      { src: '/images/collage/Dress Codes-4-Haldi Men.png', type: 'image' },
      {
        type: 'three_lines',
        body_text:
          "A playful and blessful ceremony where families apply a vibrant mixture of turmeric, sandalwood, and rosewater to the couple. Known for its glow-enhancing properties, it's a beautiful, messy, and laugh-filled start to the festivities.",
        top_label: 'The Ceremony',
        main_heading: 'What is Haldi?',
      },
    ],
    carousel_images: [],
    order_index: 0,
  },
  // Day 1 — Sangeet (derived from Mehendi & Sangeet, mehendi portion stripped)
  {
    slug: 'sangeet',
    name: 'Sangeet',
    day_offset: 0,
    time: '6:00 PM',
    dress_code: 'Colorful Indian Attire',
    dress_code_description:
      'Vibrant lehengas, sherwanis, or kurtas in bold colors. Think jewel tones, mirror work, and festive prints. This is the most playful dress code of the wedding!',
    dress_code_icon: null,
    gradient_background: 'GradientReception.webp',
    text_color: '#FFFFFF',
    ritual_name: 'Sangeet',
    ritual_description:
      'The Sangeet is a musical evening where both families come together to celebrate with choreographed performances, music, and dance.',
    outfit_example_url: null,
    outfit_ideas_men: [],
    outfit_ideas_women: [],
    carousel_slides: [
      {
        type: 'three_lines',
        body_text:
          'Dress to impress—think sharp suits, elegant gowns, or chic lehengas and sherwanis in jewel tones and standout embellishments.',
        top_label: 'SANGEET',
        main_heading: 'Cocktail Glam',
      },
      { src: '/images/collage/Dress Codes-9-Reception Women.png', type: 'image' },
      {
        type: 'two_sections',
        section1_items: ['Evening Gowns', 'Embellished Sarees', 'Fusion Co-ord Sets', 'Cocktail Lehengas'],
        section2_items: ['Tuxedos & Dinner Suits', 'Tailored Sherwanis', 'Patterned Nehru Jackets', ''],
        section1_header: 'Women',
        section2_header: 'Men',
      },
      { src: '/images/collage/Dress Codes-10-Reception Men.png', type: 'image' },
      {
        type: 'three_lines',
        body_text:
          'An evening of choreographed dances, heartfelt toasts, and live music — both families come together to celebrate the couple in true festive style.',
        top_label: 'The Celebration',
        main_heading: 'What is a Sangeet?',
      },
      { src: '/images/collage/Dress Codes-17-Reception 1.png', type: 'image' },
    ],
    carousel_images: [],
    order_index: 1,
  },
  // Day 2 — Wedding Ceremony (Varmala-derived, rebranded generically)
  {
    slug: 'wedding-ceremony',
    name: 'Wedding Ceremony',
    day_offset: 1,
    time: '11:00 AM',
    dress_code: 'Formal Indian / Cocktail',
    dress_code_description:
      'Men: sherwanis, bandhgalas, or suits. Women: sarees, lehengas, or cocktail gowns. Rich fabrics and elegant silhouettes — this is the grand ceremony.',
    dress_code_icon: null,
    gradient_background: '#941C28',
    text_color: '#141414',
    ritual_name: 'Wedding Ceremony',
    ritual_description:
      'The main ceremony where the couple exchange vows and garlands, binding two families together in tradition, ritual, and celebration.',
    outfit_example_url: null,
    outfit_ideas_men: [],
    outfit_ideas_women: [],
    carousel_slides: [
      {
        type: 'three_lines',
        body_text:
          'The main event calls for your absolute best. Think timeless elegance—rich silks, sophisticated sherwanis, and stunning sarees or cocktail gowns. The ambiance is royal and grand.',
        top_label: 'WEDDING CEREMONY',
        main_heading: 'Royal Elegance',
      },
      { src: '/images/collage/Dress Codes-1-Wedding Women.png', type: 'image' },
      {
        type: 'two_sections',
        section1_items: ['Traditional Lehengas', 'Banarasi Sarees', 'Elegant Gowns'],
        section2_items: ['Structured Sherwanis', 'Jodhpuri Suits', 'Classic Bandhgalas'],
        section1_header: 'Women',
        section2_header: 'Men',
      },
      { src: '/images/collage/Dress Codes-2-Wedding Men.png', type: 'image' },
      {
        type: 'three_lines',
        body_text:
          'A breathtaking ceremony where the couple exchange vows and floral garlands under the open sky — the coming together of two souls and two families.',
        top_label: 'The Tradition',
        main_heading: 'What is the Wedding Ceremony?',
      },
    ],
    carousel_images: [],
    order_index: 2,
  },
  // Day 2 — Reception
  {
    slug: 'reception',
    name: 'The Reception',
    day_offset: 1,
    time: '7:00 PM',
    dress_code: 'Black Tie / Glamorous',
    dress_code_description:
      'This is the grand finale — go all out! Floor-length gowns, tuxedos, designer lehengas, or sharp suits. Think red carpet glamour.',
    dress_code_icon: null,
    gradient_background: '#004550',
    text_color: '#141414',
    ritual_name: 'Reception',
    ritual_description:
      "The Reception is a grand celebration where the newlyweds are formally introduced as a married couple to all guests. It features dinner, toasts, the couple's first dance, and an open dance floor to close out the wedding festivities.",
    outfit_example_url: null,
    outfit_ideas_men: [],
    outfit_ideas_women: [],
    carousel_slides: [
      {
        type: 'three_lines',
        body_text:
          'The absolute grand finale! Pull out all the stops for an evening of sophistication. Think red-carpet readiness: stunning floor-length gowns, sharp tuxedos, and opulent fabrics.',
        top_label: 'THE RECEPTION',
        main_heading: 'Black Tie Glamour',
      },
      { src: '/images/collage/Dress Codes-9-Reception Women.png', type: 'image' },
      {
        type: 'two_sections',
        section1_items: ['Floor-length Gowns', 'Designer Lehengas', 'Chic Sequins'],
        section2_items: ['Tuxedos', 'Dark Tailored Suits', 'Bowties & Ties'],
        section1_header: 'Women',
        section2_header: 'Men',
      },
      { src: '/images/collage/Dress Codes-10-Reception Men.png', type: 'image' },
      {
        type: 'three_lines',
        body_text:
          "A lavish celebration marking the newlyweds' first official appearance as a married couple. Expect heartfelt toasts, spectacular dinners, and an unforgettable open dance floor to dance the night away.",
        top_label: 'The Celebration',
        main_heading: 'The Final Bow',
      },
    ],
    carousel_images: [],
    order_index: 3,
  },
];

type StandardScheduleItem = {
  name: string;
  time: string;
  location: string | null;
  description: string | null;
  dress_code: string | null;
  gradient_background: string | null;
  is_major_event: boolean;
  linked_event_slug: string | null;
  order_index: number;
};

type StandardScheduleDay = {
  day_order: number;
  day_name: string;
  day_offset: number;
  items: StandardScheduleItem[];
};

const STANDARD_SCHEDULE: readonly StandardScheduleDay[] = [
  {
    day_order: 0,
    day_name: 'Friday',
    day_offset: 0,
    items: [
      {
        name: 'Check In',
        time: '11:00 AM',
        location: 'Hotel Lobby',
        description: null,
        dress_code: null,
        gradient_background: null,
        is_major_event: false,
        linked_event_slug: null,
        order_index: 0,
      },
      {
        name: 'Welcome Lunch & Haldi',
        time: '12:30 PM',
        location: 'Riverside Terrace',
        description: 'Turmeric ceremony, blessings & brunch',
        dress_code: 'Yellow & White Casuals',
        gradient_background: '#FA9A00',
        is_major_event: true,
        linked_event_slug: 'welcome-lunch-haldi',
        order_index: 1,
      },
      {
        name: 'Sangeet',
        time: '6:00 PM',
        location: 'Grand Sala',
        description: 'Music, dance performances & dinner',
        dress_code: 'Colorful Indian Attire',
        gradient_background: '#941C28',
        is_major_event: true,
        linked_event_slug: 'sangeet',
        order_index: 2,
      },
    ],
  },
  {
    day_order: 1,
    day_name: 'Saturday',
    day_offset: 1,
    items: [
      {
        name: 'Breakfast',
        time: '8:30 AM',
        location: 'The Market',
        description: null,
        dress_code: null,
        gradient_background: null,
        is_major_event: false,
        linked_event_slug: null,
        order_index: 0,
      },
      {
        name: 'Wedding Ceremony',
        time: '11:00 AM',
        location: 'Chao Phraya Lawn',
        description: 'Vows, garland exchange & blessings',
        dress_code: 'Formal Indian / Cocktail',
        gradient_background: '#941C28',
        is_major_event: true,
        linked_event_slug: 'wedding-ceremony',
        order_index: 1,
      },
      {
        name: 'High Tea',
        time: '4:00 PM',
        location: 'Kasara Executive Lounge',
        description: null,
        dress_code: null,
        gradient_background: null,
        is_major_event: false,
        linked_event_slug: null,
        order_index: 2,
      },
      {
        name: 'The Reception',
        time: '7:00 PM',
        location: 'Mewar Terrace',
        description: 'Grand finale — dinner, toasts, first dance & party',
        dress_code: 'Black Tie / Glamorous',
        gradient_background: '#004550',
        is_major_event: true,
        linked_event_slug: 'reception',
        order_index: 3,
      },
    ],
  },
  {
    day_order: 2,
    day_name: 'Sunday',
    day_offset: 2,
    items: [
      {
        name: 'Breakfast',
        time: '9:00 AM',
        location: 'The Market',
        description: null,
        dress_code: null,
        gradient_background: null,
        is_major_event: false,
        linked_event_slug: null,
        order_index: 0,
      },
      {
        name: 'Checkout',
        time: '11:00 AM',
        location: 'Hotel Lobby',
        description: null,
        dress_code: null,
        gradient_background: null,
        is_major_event: false,
        linked_event_slug: null,
        order_index: 1,
      },
    ],
  },
];

function getServiceClient() {
  return createClient<PheraDatabase>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function generateDemoSlug(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let suffix = '';
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  for (const b of bytes) {
    suffix += chars[b % chars.length];
  }
  return `${DEMO_SLUG_PREFIX}${suffix}`;
}

export async function cloneDemoWedding(userId: string): Promise<string> {
  const supabase = getServiceClient();
  const t0 = Date.now();
  const lap = (label: string, start: number) => {
    const ms = Date.now() - start;
    console.log(`[demo-clone] ${label}: ${ms}ms`);
    return Date.now();
  };
  let t = t0;

  // 1. Fetch template wedding
  const { data: template, error: templateError } = await supabase
    .from('weddings')
    .select('*')
    .eq('slug', TEMPLATE_SLUG)
    .single();
  t = lap('fetch template wedding', t);

  if (templateError || !template) {
    throw new Error(`Template wedding "${TEMPLATE_SLUG}" not found`);
  }

  // 2. Generate unique slug
  const newSlug = generateDemoSlug();

  // 3. Insert cloned wedding row
  const { id: _id, created_at: _ca, updated_at: _ua, slug: _slug, created_by: _cb, ...weddingData } = template;

  // Guarantee couple_name + partner names are populated. The template
  // occasionally has them blank; derive defaults so the preview hero
  // renders real content instead of an empty frame with no names.
  const wd = weddingData as any;
  const partner1Name = (wd.partner1_name || '').trim() || 'Priya Sharma';
  const partner2Name = (wd.partner2_name || '').trim() || 'Arjun Mehta';
  const p1 = partner1Name.split(' ')[0];
  const p2 = partner2Name.split(' ')[0];
  const derivedCoupleName = p1 && p2 ? `${p1} & ${p2}` : p1 || p2;
  const finalCoupleName = wd.couple_name?.trim() || derivedCoupleName;

  const { data: newWedding, error: insertError } = await supabase
    .from('weddings')
    .insert({
      ...weddingData,
      partner1_name: partner1Name,
      partner2_name: partner2Name,
      couple_name: finalCoupleName,
      slug: newSlug,
      created_by: userId,
      status: 'draft',
    } as any)
    .select('id')
    .single();

  if (insertError || !newWedding) {
    throw new Error(`Failed to create demo wedding: ${insertError?.message}`);
  }

  const newWeddingId = newWedding.id;
  t = lap('insert new wedding row', t);

  // 4. Read everything from the template in parallel.
  // All of these SELECTs are independent — no reason to do them serially.
  // NOTE: we no longer read wedding_events or wedding_schedule from the template —
  // all demo clones get the hardcoded STANDARD_EVENTS / STANDARD_SCHEDULE below.
  const [
    { data: templateGuests },
    { data: templateChat },
    { data: templateRsvps },
    { data: templateOutreachEvents },
    { data: templateIssues },
  ] = await Promise.all([
    (supabase as any).from('guests').select('*').eq('wedding_id', TEMPLATE_SLUG),
    (supabase as any).from('whatsapp_chat_history').select('*').eq('wedding_id', template.id).order('created_at', { ascending: true }),
    (supabase as any).from('rsvps').select('*').eq('wedding_id', TEMPLATE_SLUG),
    (supabase as any).from('outreach_events').select('*').eq('wedding_id', TEMPLATE_SLUG),
    (supabase as any).from('coordination_issues').select('*').eq('wedding_id', TEMPLATE_SLUG),
  ]);
  t = lap(`parallel reads (guests=${templateGuests?.length ?? 0}, chat=${templateChat?.length ?? 0}, rsvps=${templateRsvps?.length ?? 0}, outreach=${templateOutreachEvents?.length ?? 0}, issues=${templateIssues?.length ?? 0})`, t);

  // Kick off simple clones immediately — they don't depend on anything else.
  const simpleClones: Promise<void>[] = [
    cloneSimpleTable(supabase, 'wedding_faqs', template.id, newWeddingId),
    cloneSimpleTable(supabase, 'wedding_travel_cards', template.id, newWeddingId),
    cloneSimpleTable(supabase, 'travel_sections' as any, template.id, newWeddingId),
    cloneSimpleTable(supabase, 'wedding_registry', template.id, newWeddingId),
    cloneSimpleTable(supabase, 'wedding_shops', template.id, newWeddingId),
    cloneSimpleTable(supabase, 'wedding_settings', template.id, newWeddingId),
    cloneSimpleTable(supabase, 'concierge_knowledge_base', template.id, newWeddingId),
    cloneSimpleTable(supabase, 'transportation_settings', template.id, newWeddingId),
    cloneSimpleTable(supabase, 'wedding_tasks', template.id, newWeddingId),
    // guest_flights + travel_bus_signups are keyed by the wedding SLUG in the app
    // (see lib/ops/constants.ts keyType:'slug' and the ai-handler slug reads), so
    // they must be cloned slug→slug. The old (template.id, newWeddingId) form wrote
    // the UUID: that both hid the rows from the demo (app reads by slug) AND
    // orphaned them from the slug-based demo cleanup. Template has 0 rows in these
    // today, so this is a no-op now but correct if seeded later.
    // NOTE: cloneSimpleTable does not remap guest_flights.guest_id — if these are
    // ever seeded, add guest_id remapping via guestIdMapping (built below).
    cloneSimpleTable(supabase, 'guest_flights', TEMPLATE_SLUG, newSlug),
    cloneSimpleTable(supabase, 'travel_bus_signups', TEMPLATE_SLUG, newSlug),
    cloneSimpleTable(supabase, 'vendors', template.id, newWeddingId),
  ];

  // 5. Primary inserts in parallel: events, schedule days, guests.
  // Events + schedule use the hardcoded STANDARD_* constants so every demo
  // shows the same 3-day layout regardless of template state.
  const baseDateStr = resolveBaseDate(template.wedding_date);

  const eventsInsertPromise = supabase
    .from('wedding_events')
    .insert(
      STANDARD_EVENTS.map((ev) => ({
        ...ev,
        date: addDaysISO(baseDateStr, ev.day_offset),
        wedding_id: newWeddingId,
      })).map(({ day_offset: _o, ...rest }) => rest) as any
    )
    .select('id, slug');

  const scheduleInsertPromise = supabase
    .from('wedding_schedule')
    .insert(
      STANDARD_SCHEDULE.map((day) => ({
        wedding_id: newWeddingId,
        date: addDaysISO(baseDateStr, day.day_offset),
        day_name: day.day_name,
        order_index: day.day_order,
      })) as any
    )
    .select('id, order_index');

  const guestsInsertPromise = templateGuests?.length
    ? (supabase as any)
        .from('guests')
        .insert(
          templateGuests.map(({ id, wedding_id, created_at, initials, ...rest }: any) => {
            const name = rest.name || 'Guest';
            const seed = (rest.email || rest.phone || name).toString();
            const color = rest.avatar_color || generateFallbackColor(name);
            let avatarSvg = rest.avatar_svg;
            if (!avatarSvg) {
              try {
                avatarSvg = generateGuestAvatar(seed, name).svg;
              } catch {
                avatarSvg = null;
              }
            }
            return {
              ...rest,
              wedding_id: newSlug,
              avatar_color: color,
              avatar_svg: avatarSvg,
            };
          })
        )
        .select('id, name')
    : Promise.resolve({ data: null as any });

  const [
    { data: newEvents },
    { data: newSchedules },
    { data: newGuests },
  ] = await Promise.all([
    eventsInsertPromise,
    scheduleInsertPromise,
    guestsInsertPromise,
  ]);
  t = lap('primary inserts (standard events + schedule + guests)', t);

  // 6. Build ID maps from the results.
  // eventSlugToId: slug -> new wedding_events.id (used by schedule_items.linked_event_id)
  const eventSlugToId: Record<string, string> = {};
  if (newEvents) {
    for (const ev of newEvents as any[]) {
      if (ev.slug) eventSlugToId[ev.slug] = ev.id;
    }
  }

  // scheduleDayOrderToId: day_order -> new wedding_schedule.id
  const scheduleDayOrderToId: Record<number, string> = {};
  if (newSchedules) {
    for (const sc of newSchedules as any[]) {
      scheduleDayOrderToId[sc.order_index] = sc.id;
    }
  }

  const guestIdMapping: Record<string, string> = {};
  if (templateGuests && newGuests) {
    const templateByName = new Map(templateGuests.map((g: any) => [g.name, g.id]));
    for (const ng of newGuests) {
      const oldId = templateByName.get(ng.name);
      if (oldId) guestIdMapping[oldId as string] = ng.id;
    }
  }

  // 7. Dependent inserts in parallel: schedule_items, chat_history, rsvps.
  const dependentInserts: Promise<any>[] = [];

  // schedule_items built from STANDARD_SCHEDULE, linked to newly inserted days + events.
  const itemsToInsert = STANDARD_SCHEDULE.flatMap((day) => {
    const scheduleId = scheduleDayOrderToId[day.day_order];
    if (!scheduleId) return [];
    return day.items.map((item) => ({
      schedule_id: scheduleId,
      name: item.name,
      time: item.time,
      location: item.location ?? null,
      description: item.description ?? null,
      dress_code: item.dress_code ?? null,
      gradient_background: item.gradient_background ?? null,
      is_major_event: item.is_major_event,
      linked_event_id: item.linked_event_slug ? eventSlugToId[item.linked_event_slug] ?? null : null,
      order_index: item.order_index,
    }));
  });
  if (itemsToInsert.length) {
    dependentInserts.push((supabase as any).from('schedule_items').insert(itemsToInsert as any));
  }

  if (Object.keys(guestIdMapping).length > 0) {
    if (templateChat?.length) {
      const chatToInsert = templateChat
        .filter((msg: any) => !msg.guest_id || guestIdMapping[msg.guest_id])
        .map(({ id, wedding_id, created_at, ...rest }: any) => ({
          ...rest,
          wedding_id: newWeddingId,
          guest_id: rest.guest_id ? guestIdMapping[rest.guest_id] : null,
        }));
      if (chatToInsert.length) {
        dependentInserts.push((supabase as any).from('whatsapp_chat_history').insert(chatToInsert));
      }
    }

    if (templateRsvps?.length) {
      const rsvpsToInsert = templateRsvps
        .filter((rsvp: any) => guestIdMapping[rsvp.guest_id])
        .map(({ id, wedding_id, created_at, ...rest }: any) => ({
          ...rest,
          wedding_id: newSlug,
          guest_id: guestIdMapping[rest.guest_id],
          event_id: 'general',
        }));
      if (rsvpsToInsert.length) {
        dependentInserts.push((supabase as any).from('rsvps').insert(rsvpsToInsert));
      }
    }

    // Clone outreach_events (Control Tower activity feed) with guest_id
    // remapping. These used to be generated fresh in seedDemoMockData on
    // every clone — pre-seeded in the template now, so a simple clone is
    // much faster.
    if (templateOutreachEvents?.length) {
      const eventsToInsert = templateOutreachEvents
        .filter((ev: any) => !ev.guest_id || guestIdMapping[ev.guest_id])
        .map(({ id, wedding_id, ...rest }: any) => ({
          ...rest,
          wedding_id: newSlug,
          guest_id: rest.guest_id ? guestIdMapping[rest.guest_id] : null,
        }));
      if (eventsToInsert.length) {
        dependentInserts.push((supabase as any).from('outreach_events').insert(eventsToInsert));
      }
    }

    // Clone coordination_issues (escalations queue) with guest_id remapping.
    if (templateIssues?.length) {
      const issuesToInsert = templateIssues
        .filter((iss: any) => !iss.guest_id || guestIdMapping[iss.guest_id])
        .map(({ id, wedding_id, created_at, resolved_at, resolved_by, ...rest }: any) => ({
          ...rest,
          wedding_id: newSlug,
          guest_id: rest.guest_id ? guestIdMapping[rest.guest_id] : null,
        }));
      if (issuesToInsert.length) {
        dependentInserts.push((supabase as any).from('coordination_issues').insert(issuesToInsert));
      }
    }
  }

  // Kick off wedding_admins insert alongside the other background work.
  const adminInsert = supabase.from('wedding_admins').insert({
    wedding_id: newWeddingId,
    user_id: userId,
    role: 'owner',
  } as any).then(() => {});
  simpleClones.push(adminInsert as Promise<void>);

  // Seed a handful of guest comments (some with GIFs) so the Activity tab
  // has content on both mobile and desktop in the demo. Maps onto cloned
  // guests picked deterministically from guestIdMapping.
  const commentsSeed = seedDemoComments(supabase, newSlug, guestIdMapping);
  simpleClones.push(commentsSeed);

  // Kick off transportation now that guestIdMapping is ready. Runs in
  // parallel with the other background work.
  const transportationPromise = cloneTransportationData(supabase, template.id, newWeddingId, guestIdMapping);

  // Single wait for all remaining background work: the dependent inserts,
  // the simple clones (already running since step 4), transportation, and
  // the admin insert. Wall time is max of these, not their sum.
  await Promise.all([
    Promise.all(dependentInserts),
    Promise.all(simpleClones),
    transportationPromise,
  ]);
  t = lap(`finalize (dep=${dependentInserts.length}, simple=${simpleClones.length}, transport)`, t);

  // Fallback: if the template hasn't been pre-seeded yet (nothing came back
  // from the outreach_events read), run seedDemoMockData inline so the
  // Control Tower isn't empty. Once you run the one-shot
  // /api/admin/seed-demo-template endpoint, the template carries these rows
  // and this branch is skipped on future clones.
  const templateAlreadySeeded = (templateOutreachEvents?.length ?? 0) > 0;
  if (!templateAlreadySeeded) {
    console.log('[demo-clone] template not pre-seeded — running seedDemoMockData inline (slower path)');
    try {
      await seedDemoMockData(supabase, {
        slug: newSlug,
        weddingUuid: newWeddingId,
        guestIds: Object.values(guestIdMapping),
      });
    } catch (err) {
      console.error('[cloneDemoWedding] seedDemoMockData failed:', err);
    }
    t = lap('seedDemoMockData (fallback)', t);
  }

  console.log(`[demo-clone] TOTAL: ${Date.now() - t0}ms`);

  return newSlug;
}

// Prewritten demo comments. Some include Giphy GIFs; hosts rendered via
// next/image are whitelisted in next.config.ts (media*.giphy.com).
const DEMO_COMMENTS: Array<{
  message: string;
  gif_id?: string;
  gif_url?: string;
  gif_preview_url?: string;
  gif_title?: string;
}> = [
  { message: 'Started dance practice. My back has officially retired.' },
  {
    message: 'Booking my nagin dance solo for sangeet. Committee, take notes.',
    gif_id: 'Wv8i6nZslaTbiVMBVk',
    gif_url: 'https://media.giphy.com/media/Wv8i6nZslaTbiVMBVk/giphy.gif',
    gif_preview_url: 'https://media.giphy.com/media/Wv8i6nZslaTbiVMBVk/giphy-preview.gif',
    gif_title: 'nagin dance ranveer singh',
  },
  { message: 'Mom has sent 47 outfit options. Forty. Seven.' },
  {
    message: 'BARAAT. MODE. ACTIVATED. 🥁',
    gif_id: '26uTszfXVHdfR61B6',
    gif_url: 'https://media.giphy.com/media/26uTszfXVHdfR61B6/giphy.gif',
    gif_preview_url: 'https://media.giphy.com/media/26uTszfXVHdfR61B6/giphy-preview.gif',
    gif_title: 'ranveer singh indian wedding',
  },
  { message: 'Flights booked, OOO set, life officially paused for shaadi.' },
  {
    message: "Crying already and the festivities haven't even started 🥹",
    gif_id: 'Ge1jlqRfcEFpaewp7W',
    gif_url: 'https://media.giphy.com/media/Ge1jlqRfcEFpaewp7W/giphy.gif',
    gif_preview_url: 'https://media.giphy.com/media/Ge1jlqRfcEFpaewp7W/giphy-preview.gif',
    gif_title: 'happy crying 3 idiots',
  },
  { message: 'Priya, you are going to be a STUNNING bride 😍' },
  {
    message: "Punjabi side bringing the dhol AND the chaos. You've been warned.",
    gif_id: 'PlUZkVgqeNvDTjeS5A',
    gif_url: 'https://media.giphy.com/media/PlUZkVgqeNvDTjeS5A/giphy.gif',
    gif_preview_url: 'https://media.giphy.com/media/PlUZkVgqeNvDTjeS5A/giphy-preview.gif',
    gif_title: 'diljit dosanjh punjabi dance',
  },
  { message: 'Aunty network activated. Status updates incoming hourly.' },
  { message: 'Arjun bhai, treat toh banti hai. Multiple treats actually.' },
  {
    message: 'Pre-booking my real estate on the dance floor 💃',
    gif_id: 'ny3gf7IEUMPxUAuU5W',
    gif_url: 'https://media.giphy.com/media/ny3gf7IEUMPxUAuU5W/giphy.gif',
    gif_preview_url: 'https://media.giphy.com/media/ny3gf7IEUMPxUAuU5W/giphy-preview.gif',
    gif_title: 'south asian celebration',
  },
  {
    message: '300 guests. 3 days. Zero plan. LET’S GOOO.',
    gif_id: 'LV57tkuYhvJCY9hivc',
    gif_url: 'https://media.giphy.com/media/LV57tkuYhvJCY9hivc/giphy.gif',
    gif_preview_url: 'https://media.giphy.com/media/LV57tkuYhvJCY9hivc/giphy-preview.gif',
    gif_title: 'dance party skoda india',
  },
];

async function seedDemoComments(
  supabase: ReturnType<typeof getServiceClient>,
  weddingSlug: string,
  guestIdMapping: Record<string, string>,
): Promise<void> {
  const guestIds = Object.values(guestIdMapping);
  if (guestIds.length === 0) return;

  // Deterministic pick: shuffle guestIds via slug hash so repeated clones
  // of the same slug produce the same set, but different slugs get different
  // guests attached to the canned messages.
  const salt = weddingSlug.split('').reduce((h, c) => ((h * 33) ^ c.charCodeAt(0)) >>> 0, 5381);
  const ordered = [...guestIds].sort((a, b) => {
    const ah = (a.charCodeAt(0) + salt) >>> 0;
    const bh = (b.charCodeAt(0) + salt) >>> 0;
    return ah - bh;
  });

  const pairCount = Math.min(DEMO_COMMENTS.length, ordered.length);
  const now = Date.now();
  const rows = DEMO_COMMENTS.slice(0, pairCount).map((c, i) => ({
    guest_id: ordered[i],
    wedding_id: weddingSlug,
    message: c.message,
    gif_id: c.gif_id ?? null,
    gif_url: c.gif_url ?? null,
    gif_preview_url: c.gif_preview_url ?? null,
    gif_title: c.gif_title ?? null,
    // Spread created_at so the list has a natural-looking order.
    created_at: new Date(now - i * 37 * 60 * 1000).toISOString(),
  }));

  const { error } = await (supabase as any).from('comments').insert(rows);
  if (error) {
    console.error('[demo-clone] seedDemoComments failed:', error.message);
  }
}

async function cloneSimpleTable(
  supabase: ReturnType<typeof getServiceClient>,
  tableName: string,
  templateWeddingId: string,
  newWeddingId: string
) {
  const { data: rows } = await supabase
    .from(tableName as any)
    .select('*')
    .eq('wedding_id', templateWeddingId);

  if (!rows?.length) return;

  const cloned = rows.map((row: any) => {
    const { id, wedding_id, created_at, updated_at, ...rest } = row;
    return { ...rest, wedding_id: newWeddingId };
  });

  await supabase.from(tableName as any).insert(cloned);
}

// Tables with TEXT wedding_id storing the wedding slug.
// No FK CASCADE on slug — must be deleted explicitly.
// Order matters: tables with NO ACTION FK to guests must precede `guests`,
// and `guests` must be LAST so all guest_id FKs are cleared.
const SLUG_CHILD_TABLES = [
  // NO ACTION FK to guests — must precede guests deletion
  'coordination_issues',
  'whatsapp_broadcasts',
  // Other slug-based children (most CASCADE from guests; explicit for orphans)
  'rsvps',
  'comments',
  'outreach_events',
  'outreach_sequences',
  'outreach_escalations',
  'guest_flights',
  'guest_hotels',
  'guest_visas',
  'guest_checklist_items',
  'milestones',
  'whatsapp_messages',
  'whatsapp_opt_ins',
  'travel_bus_signups',
  'pin_access',
  'rsvp_custom_questions',
  'wedding_rooms',
  // Parent of many of the above — must be LAST among slug tables
  'guests',
] as const;

// Vendor group: TEXT column but stores wedding UUID as string.
// Order matters — leaf tables first.
const VENDOR_TABLES_UUID_IN_TEXT = [
  'conversation_members',
  'vendor_messages',
  'vendor_insights',
  'vendor_conversations',
  'vendors',
] as const;

// UUID children with FK but ON DELETE NO ACTION — would block parent delete.
const UUID_NO_CASCADE_TABLES = [
  'concierge_knowledge_base',
  'feature_requests',
] as const;

// Slug-keyed agent tables. Not written by the clone, but a demo user chatting
// with the agent creates these keyed by the demo slug. agent_messages +
// agent_feedback cascade from agent_conversations, so they aren't listed.
// Swept alongside SLUG_CHILD_TABLES; none FK guests, so order is free.
const AGENT_SLUG_TABLES = [
  'agent_actions',
  'agent_conversations',
  'agent_knowledge',
] as const;

// Skip Postgres "relation does not exist" (42P01) — schema drift between envs is OK.
function isMissingTable(error: any): boolean {
  return error?.code === '42P01' || /does not exist/i.test(error?.message || '');
}

// Exported for the anon-draft cleanup (lib/anon/cleanup-anon-drafts.ts), which
// reuses the same slug/UUID child-table knowledge instead of duplicating it.
export async function deleteWeddingFully(
  supabase: ReturnType<typeof getServiceClient>,
  weddingId: string,
  weddingSlug: string,
) {
  const deleteFrom = async (table: string, idValue: string) => {
    const { error } = await supabase.from(table as any).delete().eq('wedding_id', idValue);
    if (error && !isMissingTable(error)) {
      throw new Error(`delete ${table} (id=${idValue}): ${error.message}`);
    }
  };

  for (const table of SLUG_CHILD_TABLES) await deleteFrom(table, weddingSlug);
  for (const table of VENDOR_TABLES_UUID_IN_TEXT) await deleteFrom(table, weddingId);
  for (const table of UUID_NO_CASCADE_TABLES) await deleteFrom(table, weddingId);

  // CASCADE handles the remaining UUID children (wedding_events, wedding_schedule,
  // wedding_faqs, transportation_*, travel_sections, whatsapp_chat_history, etc.).
  const { error } = await supabase.from('weddings').delete().eq('id', weddingId);
  if (error) throw new Error(`delete weddings row (uuid=${weddingId}): ${error.message}`);
}

/**
 * Backstop that makes cleanup self-healing. deleteWeddingFully() finds demos via
 * the weddings table, so any child left behind by an interrupted or older
 * cleanup (its wedding row already gone) becomes invisible to it forever — which
 * is exactly how ~1,900 orphan rows accumulated historically. This sweep re-finds
 * them by slug: a 'demo-*' wedding_id can only belong to a demo, so any such row
 * whose wedding_id isn't a currently-live demo wedding is an orphan and is
 * deleted. Slug-keyed tables only; vendor UUID-keyed rows are removed inline by
 * deleteWeddingFully before the wedding row goes, and UUID orphans can't be
 * attributed to a demo after the fact.
 */
async function sweepOrphanedDemoData(supabase: ReturnType<typeof getServiceClient>) {
  // Live demo weddings (incl. the template) — everything else demo-slugged is orphaned.
  const { data: liveDemos, error: listErr } = await supabase
    .from('weddings')
    .select('slug')
    .like('slug', `${DEMO_SLUG_PREFIX}%`);
  if (listErr) {
    console.error('[demo-cleanup] orphan sweep: listing live demos failed:', listErr.message);
    return;
  }
  const keep = new Set<string>([TEMPLATE_SLUG, ...((liveDemos ?? []) as Array<{ slug: string }>).map((w) => w.slug)]);
  const keepList = `(${Array.from(keep).join(',')})`;

  // guests LAST (other slug tables NO ACTION-FK it); agent tables first (independent).
  const sweepTables = [...AGENT_SLUG_TABLES, ...SLUG_CHILD_TABLES];
  let swept = 0;
  for (const table of sweepTables) {
    const { data, error } = await supabase
      .from(table as any)
      .delete()
      .like('wedding_id', `${DEMO_SLUG_PREFIX}%`)
      .not('wedding_id', 'in', keepList)
      .select('wedding_id');
    if (error) {
      if (!isMissingTable(error)) console.error(`[demo-cleanup] orphan sweep ${table}: ${error.message}`);
      continue;
    }
    swept += data?.length ?? 0;
  }
  if (swept > 0) console.log(`[demo-cleanup] orphan sweep removed ${swept} orphaned demo row(s)`);
}

export async function cleanupExpiredDemoWeddings(_userId?: string) {
  const supabase = getServiceClient();
  const cutoff = new Date(Date.now() - DEMO_MAX_AGE_MS).toISOString();

  // Scan ALL users' expired demos, not just the caller's.
  const { data: expired, error: findErr } = await supabase
    .from('weddings')
    .select('id, slug')
    .like('slug', `${DEMO_SLUG_PREFIX}%`)
    .neq('slug', TEMPLATE_SLUG)
    .lt('created_at', cutoff);

  if (findErr) {
    console.error('[demo-cleanup] failed to list expired demos:', findErr.message);
  } else if (expired?.length) {
    console.log(`[demo-cleanup] purging ${expired.length} expired demo wedding(s)`);
    let ok = 0;
    let failed = 0;
    for (const w of expired) {
      try {
        await deleteWeddingFully(supabase, w.id, w.slug);
        ok++;
      } catch (err: any) {
        failed++;
        console.error(`[demo-cleanup] ${w.slug}: ${err?.message || err}`);
      }
    }
    console.log(`[demo-cleanup] done: ${ok} purged, ${failed} failed`);
  }

  // Always run the backstop — even when nothing was expired this pass, it clears
  // any historical/interrupted orphans so demo data can never linger past a run.
  await sweepOrphanedDemoData(supabase);
}

async function cloneTransportationData(
  supabase: ReturnType<typeof getServiceClient>,
  templateId: string,
  newId: string,
  guestIdMapping: Record<string, string>
) {
  // Parallel reads: the 4 independent tables (vehicles, vehicle_types,
  // pickup_locations, time_ranges) plus groups and reservations. Fetching
  // all together saves several serial round-trips.
  const [
    { data: vhs },
    { data: vts },
    { data: pls },
    { data: trs },
    { data: grps },
    { data: resvs },
  ] = await Promise.all([
    supabase.from('transportation_vehicles').select('*').eq('wedding_id', templateId),
    supabase.from('transportation_vehicle_types').select('*').eq('wedding_id', templateId),
    supabase.from('transportation_pickup_locations').select('*').eq('wedding_id', templateId),
    supabase.from('transportation_time_ranges').select('*').eq('wedding_id', templateId),
    supabase.from('transportation_groups').select('*').eq('wedding_id', templateId),
    supabase.from('transportation_reservations').select('*').eq('wedding_id', templateId),
  ]);

  // Parallel primary inserts: vehicles, vehicle types, pickup locations,
  // time ranges. None of these depend on each other, so run concurrently.
  const vMap: Record<string, string> = {};
  const vtMap: Record<string, string> = {};
  const pMap: Record<string, string> = {};

  const vehiclesInsert = vhs?.length
    ? supabase.from('transportation_vehicles')
        .insert(vhs.map(({ id, created_at, updated_at, wedding_id, ...rest }: any) => ({ ...rest, wedding_id: newId })))
        .select('id, vehicle_name')
    : Promise.resolve({ data: null as any });

  const vehicleTypesInsert = vts?.length
    ? supabase.from('transportation_vehicle_types')
        .insert(vts.map(({ id, created_at, updated_at, wedding_id, ...rest }: any) => ({ ...rest, wedding_id: newId })))
        .select('id, name')
    : Promise.resolve({ data: null as any });

  const pickupLocationsInsert = pls?.length
    ? supabase.from('transportation_pickup_locations')
        .insert(pls.map(({ id, created_at, updated_at, wedding_id, ...rest }: any) => ({ ...rest, wedding_id: newId })))
        .select('id, name')
    : Promise.resolve({ data: null as any });

  const timeRangesInsert = trs?.length
    ? supabase.from('transportation_time_ranges')
        .insert(trs.map(({ id, created_at, updated_at, wedding_id, ...rest }: any) => ({ ...rest, wedding_id: newId })))
        .select('id, start_datetime')
    : Promise.resolve({ data: null as any });

  const [
    { data: newVhs },
    { data: newVts },
    { data: newPls },
    // time ranges map is never used downstream, so we don't need the result
    ,
  ] = await Promise.all([vehiclesInsert, vehicleTypesInsert, pickupLocationsInsert, timeRangesInsert]);

  if (vhs && newVhs) {
    for (const oldV of vhs) {
      const matching = newVhs.find((v: any) => v.vehicle_name === oldV.vehicle_name);
      if (matching) vMap[oldV.id] = matching.id;
    }
  }
  if (vts && newVts) {
    for (const old of vts) {
      const matching = newVts.find((v: any) => v.name === old.name);
      if (matching) vtMap[old.id] = matching.id;
    }
  }
  if (pls && newPls) {
    for (const oldP of pls) {
      const matching = newPls.find((p: any) => p.name === oldP.name);
      if (matching) pMap[oldP.id] = matching.id;
    }
  }

  // Dependent inserts in parallel: groups + reservations.
  const dependent: Promise<any>[] = [];

  if (grps?.length) {
    dependent.push(
      (supabase as any).from('transportation_groups').insert(
        grps.map(({ id, created_at, updated_at, wedding_id, ...rest }: any) => ({
          ...rest,
          wedding_id: newId,
          pickup_location_id: pMap[rest.pickup_location_id] || rest.pickup_location_id,
          vehicle_type_id: rest.vehicle_type_id ? vtMap[rest.vehicle_type_id] || rest.vehicle_type_id : null,
        }))
      )
    );
  }

  if (resvs?.length) {
    const toInsert = resvs
      .filter((r: any) => !r.guest_id || guestIdMapping[r.guest_id])
      .map(({ id, created_at, updated_at, wedding_id, ...rest }: any) => ({
        ...rest,
        wedding_id: newId,
        vehicle_id: rest.vehicle_id ? vMap[rest.vehicle_id] : null,
        pickup_location_id: rest.pickup_location_id ? pMap[rest.pickup_location_id] : null,
        guest_id: rest.guest_id ? guestIdMapping[rest.guest_id] : null,
      }));
    if (toInsert.length) {
      dependent.push((supabase as any).from('transportation_reservations').insert(toInsert));
    }
  }

  await Promise.all(dependent);
}

