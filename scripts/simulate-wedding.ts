#!/usr/bin/env npx tsx
/**
 * simulate-wedding.ts — Seed fake guests and run them through the real AI concierge.
 *
 * Usage:
 *   npx tsx scripts/simulate-wedding.ts --wedding=demo-v0ylzu6p
 *   npx tsx scripts/simulate-wedding.ts --wedding=demo-v0ylzu6p --guests=30
 *   npx tsx scripts/simulate-wedding.ts --wedding=demo-v0ylzu6p --cleanup
 *   npx tsx scripts/simulate-wedding.ts --wedding=demo-v0ylzu6p --seed=42
 */

import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';

// Dynamic import — must happen AFTER dotenv loads env vars,
// because ai-handler and its dependencies create Supabase clients at module scope.
let generateAIResponse: typeof import('../lib/whatsapp/ai-handler').generateAIResponse;
let getLastProvider: () => string;
async function loadAIHandler() {
  const mod = await import('../lib/whatsapp/ai-handler');
  generateAIResponse = mod.generateAIResponse;
  getLastProvider = () => mod.lastProvider;
}

// ─── Config ─────────────────────────────────────────────────────────

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? 'true'];
  }),
);

const WEDDING_ID = args.wedding || process.env.SIMULATE_WEDDING_ID || '';
const GUEST_COUNT = parseInt(args.guests || '150', 10);
const CLEANUP = args.cleanup === 'true';
const SEED = parseInt(args.seed || String(Date.now()), 10);
const DELAY_MS = parseInt(args.delay || '500', 10);
const QUIET = args.verbose !== 'true'; // suppress tool/handler logs by default
const TEST_EMAIL_DOMAIN = '@test.phera.io';

if (!WEDDING_ID) {
  console.error('Usage: npx tsx scripts/simulate-wedding.ts --wedding=<wedding_slug>');
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// ─── Seeded RNG ─────────────────────────────────────────────────────

function mulberry32(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(SEED);
const pick = <T>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
const shuffle = <T>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// ─── Name pools ─────────────────────────────────────────────────────

const INDIAN_FIRST = [
  'Aarav', 'Aditi', 'Aisha', 'Ajay', 'Ananya', 'Arjun', 'Bhavna', 'Chetan',
  'Deepa', 'Dev', 'Diya', 'Gaurav', 'Isha', 'Kabir', 'Kavita', 'Kiran',
  'Lakshmi', 'Manish', 'Meera', 'Nandini', 'Neha', 'Nikhil', 'Pooja', 'Priya',
  'Rahul', 'Raj', 'Ravi', 'Ritu', 'Rohan', 'Sakshi', 'Sanjay', 'Shreya',
  'Simran', 'Sneha', 'Suresh', 'Tanvi', 'Varun', 'Vikram', 'Vivek', 'Yash',
];
const INDIAN_LAST = [
  'Agarwal', 'Bansal', 'Bhatia', 'Chopra', 'Das', 'Desai', 'Dutta', 'Gupta',
  'Iyer', 'Jain', 'Joshi', 'Kapoor', 'Khan', 'Kulkarni', 'Kumar', 'Mehta',
  'Menon', 'Mishra', 'Nair', 'Pandey', 'Patel', 'Pillai', 'Rao', 'Reddy',
  'Saxena', 'Shah', 'Sharma', 'Singh', 'Sinha', 'Tiwari', 'Verma', 'Yadav',
];
const WESTERN_FIRST = [
  'Alice', 'Ben', 'Catherine', 'Daniel', 'Emily', 'Frank', 'Grace', 'Henry',
  'Isabella', 'James', 'Jennifer', 'Kevin', 'Laura', 'Michael', 'Nicole', 'Oliver',
  'Patricia', 'Robert', 'Sarah', 'Thomas', 'Victoria', 'William', 'Zoe', 'David',
];
const WESTERN_LAST = [
  'Anderson', 'Brown', 'Chen', 'Davis', 'Evans', 'Garcia', 'Harris', 'Jackson',
  'Johnson', 'Kim', 'Lee', 'Martinez', 'Miller', 'Moore', 'O\'Brien', 'Rodriguez',
  'Smith', 'Taylor', 'Thomas', 'Thompson', 'Walker', 'White', 'Williams', 'Wilson',
];

const AVATAR_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#FFA07A', '#98D8C8', '#6C5CE7', '#FDCB6E',
];

// ─── Message pools ──────────────────────────────────────────────────

const RSVP_YES = [
  "Yes we'll be there! Can't wait!",
  "Count us in! It'll be me and my husband, 2 people total.",
  "Absolutely! Wouldn't miss it for the world. Just me, 1 guest.",
  "We're coming! 3 of us — me, my wife, and our daughter.",
  "Yes!! So excited! I'll be there with my plus one.",
  "Of course! We RSVP yes. Party of 2.",
  "Confirmed! Looking forward to it. Just myself.",
  "Yes! We'll be there with bells on. 2 guests.",
  "Can't wait! I'm coming. Also I'm vegetarian, hope that's ok?",
  "100% yes! Me and my partner. We're both vegan by the way.",
];

const RSVP_NO = [
  "So sorry, we can't make it. Have a wonderful celebration!",
  "Unfortunately I have a work conflict that week. Sending love!",
  "I wish I could be there but I'll be traveling. Congrats!",
  "Sadly we won't be able to attend. Family commitment.",
  "Sorry, can't make it. Will celebrate with you when you're back!",
];

const RSVP_MAYBE = [
  "I'm not sure yet, my visa is still processing. Can I let you know in 2 weeks?",
  "Let me check with my family and get back to you soon.",
  "Maybe! Depends on whether I can get time off work.",
  "I want to come but I'm waiting on some flight availability. Will confirm soon.",
  "Hoping to make it but not 100% sure yet. I'll update you!",
];

const TRAVEL_INFO = [
  "Flying from Delhi on Jan 1st, Air India flight 302.",
  "We booked the Marriott near the venue, checking in Dec 31st.",
  "Coming from NYC! United flight 432, arriving Jan 2nd.",
  "We're staying at the Taj, Jan 1-4. Already booked!",
  "Flying in from London on Dec 30th, British Airways.",
  "Driving down from Pune, arriving morning of Jan 1st.",
  "Taking Emirates from Dubai, landing Jan 1st afternoon.",
  "Booked the Hyatt, check-in Dec 31 check-out Jan 3.",
  "Coming from San Francisco. Alaska Airlines, arriving Jan 1.",
  "We got rooms at the Oberoi. Check-in Jan 1, check-out Jan 4.",
];

const QUESTIONS = [
  "What's the dress code for the sangeet?",
  "Is there parking available at the venue?",
  "Are kids welcome at the reception?",
  "What's the weather going to be like that time of year?",
  "Can you recommend any restaurants near the hotel?",
];

const ISSUES = [
  "My visa application got denied. I'm not sure what to do now.",
  "I need wheelchair accessibility at the venue. Is that available?",
  "Can I speak to the couple about something personal?",
  "There's been a family situation and I might need to change my plans.",
  "I have a severe peanut allergy — is the caterer aware of this?",
];

const DIETARY = [
  "We're strictly Jain vegetarian — no onion, no garlic, no root vegetables.",
  "I have a severe nut allergy. Please make sure the caterer knows.",
  "We're halal. Is the meat halal certified?",
  "I'm gluten-free and dairy-free. Any options for me?",
  "Vegan for both of us please. No animal products at all.",
];

// ─── Helpers ────────────────────────────────────────────────────────

function generateGuests(count: number) {
  const guests = [];
  for (let i = 0; i < count; i++) {
    const isIndian = rand() < 0.7;
    const first = isIndian ? pick(INDIAN_FIRST) : pick(WESTERN_FIRST);
    const last = isIndian ? pick(INDIAN_LAST) : pick(WESTERN_LAST);
    const name = `${first} ${last}`;
    const email = `${first.toLowerCase()}.${last.toLowerCase().replace("'", '')}${i}${TEST_EMAIL_DOMAIN}`;

    // Country code distribution
    const ccRoll = rand();
    const countryCode = ccRoll < 0.7 ? '+1' : ccRoll < 0.85 ? '+91' : pick(['+44', '+971', '+61']);
    const phone = `${countryCode}${String(Math.floor(rand() * 9000000000 + 1000000000))}`;

    // Side: 60% bride, 40% groom
    const side = rand() < 0.6 ? 'bride' : 'groom';

    // Segment
    let segment: string;
    const segRoll = rand();
    if (segRoll < 0.40) segment = 'close_family';
    else if (segRoll < 0.70) segment = 'friends';
    else if (segRoll < 0.85) segment = 'extended_family';
    else segment = 'wont_respond';

    guests.push({
      name,
      email,
      phone,
      wedding_id: WEDDING_ID,
      wedding_side: side,
      avatar_color: pick(AVATAR_COLORS),
      auth_method: 'simulated',
      // metadata for simulation (not stored in DB)
      _segment: segment,
      _country_code: countryCode,
    });
  }
  return guests;
}

function assignMessages(guests: Array<any>) {
  // Split into responders vs non-responders
  const responders = guests.filter((g) => g._segment !== 'wont_respond');
  const shuffled = shuffle(responders);

  // Proportional allocation
  const total = shuffled.length;
  const counts = {
    rsvp_yes: Math.round(total * 0.50),
    rsvp_no: Math.round(total * 0.15),
    rsvp_maybe: Math.round(total * 0.10),
    travel: Math.round(total * 0.10),
    question: Math.round(total * 0.05),
    issue: Math.round(total * 0.05),
    dietary: Math.round(total * 0.05),
  };

  const assignments: Array<{ guest: any; message: string; category: string }> = [];
  let idx = 0;

  for (const [category, count] of Object.entries(counts)) {
    const pool =
      category === 'rsvp_yes' ? RSVP_YES :
      category === 'rsvp_no' ? RSVP_NO :
      category === 'rsvp_maybe' ? RSVP_MAYBE :
      category === 'travel' ? TRAVEL_INFO :
      category === 'question' ? QUESTIONS :
      category === 'issue' ? ISSUES :
      DIETARY;

    for (let i = 0; i < count && idx < shuffled.length; i++, idx++) {
      assignments.push({
        guest: shuffled[idx],
        message: pick(pool),
        category,
      });
    }
  }

  return assignments;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function progress(current: number, total: number, label: string) {
  const pct = Math.round((current / total) * 100);
  const bar = '█'.repeat(Math.round(pct / 4)) + '░'.repeat(25 - Math.round(pct / 4));
  process.stdout.write(`\r  ${bar} ${pct}% — ${label} (${current}/${total})`);
  if (current === total) process.stdout.write('\n');
}

// ─── Phase: Cleanup ─────────────────────────────────────────────────

async function cleanup() {
  console.log('\n🧹 Cleaning up simulated data...\n');

  // Find all test guests
  const { data: testGuests } = await supabase
    .from('guests')
    .select('id, email')
    .eq('wedding_id', WEDDING_ID)
    .like('email', `%${TEST_EMAIL_DOMAIN}`);

  if (!testGuests || testGuests.length === 0) {
    console.log('  No simulated guests found.');
    return;
  }

  const ids = testGuests.map((g: any) => g.id);
  console.log(`  Found ${ids.length} simulated guests. Deleting...`);

  // Safe delete from all related tables
  const safeDel = async (table: string, col: string, vals: string[]) => {
    try {
      await (supabase as any).from(table).delete().in(col, vals);
    } catch {}
  };

  await Promise.all([
    safeDel('rsvps', 'guest_id', ids),
    safeDel('guest_flights', 'guest_id', ids),
    safeDel('guest_hotels', 'guest_id', ids),
    safeDel('guest_visas', 'guest_id', ids),
    safeDel('coordination_issues', 'guest_id', ids),
    safeDel('whatsapp_messages', 'guest_id', ids),
    safeDel('outreach_events', 'guest_id', ids),
    safeDel('whatsapp_opt_ins', 'guest_id', ids),
    safeDel('whatsapp_chat_history', 'guest_id', ids),
  ]);

  // Delete the guests themselves
  await supabase.from('guests').delete().in('id', ids);

  console.log(`  ✅ Deleted ${ids.length} guests and all associated records.\n`);
}

// ─── Phase 1: Seed ──────────────────────────────────────────────────

async function seedGuests(): Promise<any[]> {
  console.log(`\n📋 Phase 1: Seeding ${GUEST_COUNT} guests for wedding "${WEDDING_ID}"...\n`);

  const guests = generateGuests(GUEST_COUNT);

  // Insert in batches (DB records — strip _segment/_country_code meta)
  const dbRecords = guests.map(({ _segment, _country_code, ...rest }) => rest);
  const BATCH = 100;
  const insertedGuests: any[] = [];

  for (let i = 0; i < dbRecords.length; i += BATCH) {
    const batch = dbRecords.slice(i, i + BATCH);
    const { data, error } = await supabase
      .from('guests')
      .insert(batch)
      .select('id, name, email');

    if (error) {
      console.error(`  ❌ Batch insert failed: ${error.message}`);
      continue;
    }

    // Re-attach metadata
    for (const row of data || []) {
      const original = guests.find((g) => g.email === row.email);
      insertedGuests.push({ ...row, _segment: original?._segment, _country_code: original?._country_code });
    }

    progress(Math.min(i + BATCH, dbRecords.length), dbRecords.length, 'Inserting guests');
  }

  console.log(`  ✅ Inserted ${insertedGuests.length} guests.\n`);
  return insertedGuests;
}

// ─── Phase 2: Simulate outreach ─────────────────────────────────────

async function simulateOutreach(guests: any[]) {
  console.log(`\n📤 Phase 2: Simulating outreach sends...\n`);

  const now = Date.now();
  const twoHoursMs = 2 * 60 * 60 * 1000;

  for (let i = 0; i < guests.length; i++) {
    const g = guests[i];
    const sendTime = new Date(now - twoHoursMs + (i / guests.length) * twoHoursMs).toISOString();

    // Try to insert outreach event (table may not exist)
    try {
      await (supabase as any).from('outreach_events').insert({
        wedding_id: WEDDING_ID,
        guest_id: g.id,
        event_type: 'template_sent',
        template_name: 'rsvp_request_v1',
        channel: 'whatsapp',
        details: { simulated: true, status: 'delivered' },
        created_at: sendTime,
      });
    } catch {}

    // Try to update outreach status
    try {
      await supabase.from('guests').update({
        outreach_status: 'rsvp_requested',
        outreach_last_contacted_at: sendTime,
        outreach_attempt_count: 1,
      } as any).eq('id', g.id);
    } catch {}

    if (i % 20 === 0) progress(i + 1, guests.length, 'Sending outreach');
  }

  progress(guests.length, guests.length, 'Sending outreach');
  console.log(`  ✅ Simulated ${guests.length} outreach sends.\n`);
}

// ─── Phase 3: Simulate guest responses ──────────────────────────────

interface ResponseLog {
  guest: string;
  category: string;
  provider: string;
  timeMs: number;
  success: boolean;
  error?: string;
}

const responseLogs: ResponseLog[] = [];

async function simulateResponses(guests: any[]) {
  const assignments = assignMessages(guests);
  console.log(`\n💬 Phase 3: Simulating ${assignments.length} guest conversations (this takes a while)...\n`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < assignments.length; i++) {
    const { guest, message, category } = assignments[i];
    const startMs = Date.now();

    // Suppress noisy tool/handler logs during simulation
    const origLog = console.log;
    const origWarn = console.warn;
    if (QUIET) {
      console.log = () => {};
      console.warn = () => {};
    }

    try {
      const response = await generateAIResponse({
        weddingId: WEDDING_ID,
        weddingSlug: WEDDING_ID,
        guestId: guest.id,
        guestName: guest.name,
        userMessage: message,
      });

      const elapsed = Date.now() - startMs;
      const provider = getLastProvider();

      // Restore console
      if (QUIET) { console.log = origLog; console.warn = origWarn; }

      responseLogs.push({
        guest: guest.name,
        category,
        provider,
        timeMs: elapsed,
        success: true,
      });

      successCount++;
      const timeStr = elapsed > 1000 ? `${(elapsed / 1000).toFixed(1)}s` : `${elapsed}ms`;
      progress(i + 1, assignments.length, `${category}: ${guest.name.split(' ')[0]} [${provider} ${timeStr}]`);
    } catch (err: any) {
      const elapsed = Date.now() - startMs;

      // Restore console
      if (QUIET) { console.log = origLog; console.warn = origWarn; }

      responseLogs.push({
        guest: guest.name,
        category,
        provider: 'error',
        timeMs: elapsed,
        success: false,
        error: err.message,
      });

      errorCount++;
      progress(i + 1, assignments.length, `ERROR: ${guest.name.split(' ')[0]}`);
    }

    // Rate limit
    if (i < assignments.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  console.log(`\n  ✅ ${successCount} conversations completed, ${errorCount} errors.\n`);
}

// ─── Phase 4: Report ────────────────────────────────────────────────

async function printReport(thisRunGuestIds: string[]) {
  console.log('\n');
  console.log('═══════════════════════════════════════════');
  console.log(`PHERA SIMULATION REPORT — ${WEDDING_ID}`);
  console.log('═══════════════════════════════════════════');

  const guestIds = thisRunGuestIds;
  const totalGuests = guestIds.length;
  let rsvpYes = 0, rsvpNo = 0, rsvpMaybe = 0;
  if (guestIds.length > 0) {
    const { data: rsvps } = await supabase
      .from('rsvps')
      .select('guest_id, attending')
      .in('guest_id', guestIds);

    for (const r of (rsvps || []) as any[]) {
      if (r.attending === 'yes') rsvpYes++;
      else if (r.attending === 'no') rsvpNo++;
      else if (r.attending === 'maybe') rsvpMaybe++;
    }
  }

  // Travel
  let flightCount = 0, hotelCount = 0, visaCount = 0;
  if (guestIds.length > 0) {
    try {
      const { data: f } = await supabase.from('guest_flights').select('id').in('guest_id', guestIds);
      flightCount = f?.length || 0;
    } catch {}
    try {
      const { data: h } = await (supabase as any).from('guest_hotels').select('id').in('guest_id', guestIds);
      hotelCount = h?.length || 0;
    } catch {}
    try {
      const { data: v } = await (supabase as any).from('guest_visas').select('id').in('guest_id', guestIds);
      visaCount = v?.length || 0;
    } catch {}
  }

  // Coordination issues (scoped to this run's guests)
  let issues: any[] = [];
  if (guestIds.length > 0) {
    try {
      const { data } = await (supabase as any)
        .from('coordination_issues')
        .select('*')
        .in('guest_id', guestIds);
      issues = data || [];
    } catch {}
  }

  const urgentCount = issues.filter((i: any) => i.priority === 'urgent').length;
  const highCount = issues.filter((i: any) => i.priority === 'high').length;
  const mediumCount = issues.filter((i: any) => i.priority === 'medium').length;
  const lowCount = issues.filter((i: any) => i.priority === 'low').length;

  // AI notes
  let withNotes = 0;
  if (guestIds.length > 0) {
    try {
      const { data } = await supabase.from('guests').select('ai_notes' as any).in('id', guestIds);
      withNotes = (data || []).filter((g: any) => g.ai_notes).length;
    } catch {}
  }

  // Outreach events
  let outreachEventCount = 0;
  try {
    const { data } = await (supabase as any)
      .from('outreach_events')
      .select('id', { count: 'exact', head: true })
      .eq('wedding_id', WEDDING_ID);
    outreachEventCount = data?.length || 0;
  } catch {}

  // Responded = has RSVP or any conversation
  const responded = rsvpYes + rsvpNo + rsvpMaybe;

  console.log('');
  console.log('OUTREACH');
  console.log(`├── Sent: ${totalGuests}`);
  console.log(`├── Delivered: ${totalGuests}`);
  console.log(`├── Responded: ${responded}`);
  console.log(`└── No response: ${totalGuests - responded}`);
  console.log('');
  console.log('RSVP STATUS');
  console.log(`├── Attending: ${rsvpYes}`);
  console.log(`├── Declined: ${rsvpNo}`);
  console.log(`├── Maybe: ${rsvpMaybe}`);
  console.log(`└── No RSVP: ${totalGuests - rsvpYes - rsvpNo - rsvpMaybe}`);
  console.log('');
  console.log('TRAVEL LOGISTICS');
  console.log(`├── Flights recorded: ${flightCount}`);
  console.log(`├── Hotels recorded: ${hotelCount}`);
  console.log(`├── Visas tracked: ${visaCount}`);
  console.log(`└── Guests with no travel info: ${totalGuests - flightCount}`);
  console.log('');
  console.log('COORDINATION ISSUES');
  console.log(`├── Total: ${issues.length}`);
  console.log(`├── Urgent: ${urgentCount}`);
  console.log(`├── High: ${highCount}`);
  console.log(`├── Medium: ${mediumCount}`);
  console.log(`└── Low: ${lowCount}`);
  console.log('');
  console.log('CONCIERGE STATS');
  console.log(`├── Conversations simulated: ${responded}`);
  console.log(`├── Escalations: ${issues.filter((i: any) => i.category === 'escalation').length}`);
  console.log(`└── AI notes created: ${withNotes}`);

  // Performance stats from response logs
  if (responseLogs.length > 0) {
    const successful = responseLogs.filter((r) => r.success);
    const times = successful.map((r) => r.timeMs);
    const avg = times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;
    const min = times.length ? Math.min(...times) : 0;
    const max = times.length ? Math.max(...times) : 0;
    const p50 = times.length ? times.sort((a, b) => a - b)[Math.floor(times.length * 0.5)] : 0;
    const p95 = times.length ? times.sort((a, b) => a - b)[Math.floor(times.length * 0.95)] : 0;

    // Provider breakdown
    const providerCounts: Record<string, { count: number; totalMs: number }> = {};
    for (const log of successful) {
      if (!providerCounts[log.provider]) providerCounts[log.provider] = { count: 0, totalMs: 0 };
      providerCounts[log.provider].count++;
      providerCounts[log.provider].totalMs += log.timeMs;
    }

    console.log('');
    console.log('LLM PERFORMANCE');
    console.log(`├── Total calls: ${responseLogs.length} (${successful.length} ok, ${responseLogs.length - successful.length} errors)`);
    console.log(`├── Avg response: ${avg > 1000 ? `${(avg / 1000).toFixed(1)}s` : `${avg}ms`}`);
    console.log(`├── Min / Max: ${min > 1000 ? `${(min / 1000).toFixed(1)}s` : `${min}ms`} / ${max > 1000 ? `${(max / 1000).toFixed(1)}s` : `${max}ms`}`);
    console.log(`├── P50 / P95: ${p50 > 1000 ? `${(p50 / 1000).toFixed(1)}s` : `${p50}ms`} / ${p95 > 1000 ? `${(p95 / 1000).toFixed(1)}s` : `${p95}ms`}`);
    console.log(`└── Providers:`);
    for (const [provider, stats] of Object.entries(providerCounts)) {
      const provAvg = Math.round(stats.totalMs / stats.count);
      console.log(`    ├── ${provider}: ${stats.count} calls, avg ${provAvg > 1000 ? `${(provAvg / 1000).toFixed(1)}s` : `${provAvg}ms`}`);
    }

    // Slowest 5 calls
    const slowest = [...successful].sort((a, b) => b.timeMs - a.timeMs).slice(0, 5);
    if (slowest.length > 0) {
      console.log('');
      console.log('SLOWEST CALLS:');
      for (const s of slowest) {
        const t = s.timeMs > 1000 ? `${(s.timeMs / 1000).toFixed(1)}s` : `${s.timeMs}ms`;
        console.log(`  ${t} — ${s.guest} (${s.category}) via ${s.provider}`);
      }
    }
  }

  if (issues.length > 0) {
    console.log('');
    console.log('TOP ISSUES:');
    const topIssues = issues
      .sort((a: any, b: any) => {
        const prio: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
        return (prio[a.priority] ?? 4) - (prio[b.priority] ?? 4);
      })
      .slice(0, 10);
    for (const issue of topIssues) {
      console.log(`  [${issue.priority}] ${issue.title}`);
    }
  }

  console.log('');
  console.log('═══════════════════════════════════════════');
  console.log('');
}

// ─── Main ───────────────────────────────────────────────────────────

async function main() {
  console.log('');
  console.log('🎉 Phera Wedding Simulation');
  console.log(`   Wedding: ${WEDDING_ID}`);
  console.log(`   Guests: ${GUEST_COUNT}`);
  console.log(`   Seed: ${SEED}`);
  console.log(`   Delay: ${DELAY_MS}ms between AI calls`);

  // Load AI handler after env vars are ready
  await loadAIHandler();

  if (CLEANUP) {
    await cleanup();
    return;
  }

  const startTime = Date.now();

  // Phase 1
  const guests = await seedGuests();
  if (guests.length === 0) {
    console.error('❌ No guests were inserted. Check your wedding_id and DB connection.');
    process.exit(1);
  }

  // Phase 2
  await simulateOutreach(guests);

  // Phase 3
  await simulateResponses(guests);

  // Phase 4
  const guestIds = guests.map((g: any) => g.id);
  await printReport(guestIds);

  const elapsed = Math.round((Date.now() - startTime) / 1000);
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  console.log(`⏱️  Total time: ${mins}m ${secs}s\n`);
}

main().catch((err) => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
