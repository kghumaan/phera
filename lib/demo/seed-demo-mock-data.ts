import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Seed a freshly cloned demo wedding with mock Control Tower data:
 *   - outreach_status / conversation_topic spread across cloned guests
 *   - recent outreach_events (template_sent) so "Sent This Week" > 0
 *   - a few coordination_issues (escalations) for the queue
 *
 * Runs deterministically per guest-id so the same demo produces the
 * same distribution if re-run, but different demos get different
 * guests with different stages (via the slug salt).
 */

// Simple deterministic hash (djb2) — avoids import of node crypto, safe in server runtime
function hash(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = (h * 33) ^ str.charCodeAt(i);
  return h >>> 0; // unsigned
}

type Stage =
  | 'not_contacted'
  | 'save_the_date_sent'
  | 'rsvp_requested'
  | 'rsvp_confirmed'
  | 'travel_collected'
  | 'logistics_complete'
  | 'unresponsive';

// 10-bucket distribution, middle-weighted
const STAGE_BUCKETS: Stage[] = [
  'rsvp_confirmed',
  'rsvp_confirmed',
  'rsvp_confirmed',
  'rsvp_confirmed',
  'rsvp_requested',
  'rsvp_requested',
  'save_the_date_sent',
  'travel_collected',
  'unresponsive',
  'not_contacted',
];

const TOPICS = ['venue', 'dress_code', 'schedule', 'shuttle', 'dietary', 'lodging'];

const TEMPLATE_NAMES = [
  'save_the_date',
  'rsvp_request',
  'travel_request',
  'reminder',
];

// Tag pool — realistic groupings for an Indian/NRI demo wedding
const BRIDE_TAGS = [
  "Priya's Family",
  "Priya's Friends",
  "Priya's US Friends",
  "Priya's UK Friends",
  "College Friends",
  "Cousins",
];
const GROOM_TAGS = [
  "Arjun's Family",
  "Arjun's Friends",
  "Arjun's AU Friends",
  "Work Friends",
  "Childhood Friends",
  "Cousins",
];
const SHARED_TAGS = ['Shared Friends', 'Family Elders'];

interface SeedOpts {
  slug: string;
  weddingUuid: string;
  guestIds: string[];
}

export async function seedDemoMockData(
  supabase: SupabaseClient,
  { slug, weddingUuid, guestIds }: SeedOpts,
) {
  if (guestIds.length === 0) return;

  // ─── 1. Update outreach_status + conversation_topic on cloned guests ────
  // Group guest ids by target stage so we can issue one UPDATE per stage.
  const byStage: Record<Stage, string[]> = {
    not_contacted: [],
    save_the_date_sent: [],
    rsvp_requested: [],
    rsvp_confirmed: [],
    travel_collected: [],
    logistics_complete: [],
    unresponsive: [],
  };
  const byTopic: Record<string, string[]> = {};

  for (const gid of guestIds) {
    const h = hash(`${slug}:${gid}`);
    const stage = STAGE_BUCKETS[h % STAGE_BUCKETS.length];
    byStage[stage].push(gid);

    // ~60% of guests get a conversation_topic
    if ((h >> 4) % 10 < 6) {
      const topic = TOPICS[(h >> 8) % TOPICS.length];
      (byTopic[topic] ??= []).push(gid);
    }
  }

  const now = new Date();
  await Promise.all(
    (Object.entries(byStage) as [Stage, string[]][]).map(async ([stage, ids]) => {
      if (ids.length === 0) return;

      // Contacted guests get a last-contacted timestamp 1-7 days ago;
      // not_contacted stays null.
      const lastContacted = stage === 'not_contacted'
        ? null
        : new Date(now.getTime() - (1 + (hash(stage) % 6)) * 24 * 60 * 60 * 1000).toISOString();

      const attemptCount = stage === 'not_contacted'
        ? 0
        : stage === 'unresponsive'
        ? 3
        : 1 + (hash(stage) % 3);

      await supabase
        .from('guests')
        .update({
          outreach_status: stage,
          outreach_last_contacted_at: lastContacted,
          outreach_attempt_count: attemptCount,
        } as any)
        .in('id', ids);
    }),
  );

  await Promise.all(
    Object.entries(byTopic).map(async ([topic, ids]) => {
      if (ids.length === 0) return;
      await supabase
        .from('guests')
        .update({ conversation_topic: topic } as any)
        .in('id', ids);
    }),
  );

  // ─── 1b. Assign wedding_side (50/50) and tags to every cloned guest ─────
  // Group each guest into bride / groom / both and a realistic tag bucket
  // so the room-planning & outreach views look populated.
  const sideBuckets: Record<'bride' | 'groom' | 'both', string[]> = {
    bride: [],
    groom: [],
    both: [],
  };
  const tagBuckets: Record<string, string[]> = {};

  guestIds.forEach((gid, i) => {
    const h = hash(`${slug}:side:${gid}`);
    // 50/50 split with a small "both" group (~6%) for couple's mutual friends
    const sideRand = h % 100;
    let side: 'bride' | 'groom' | 'both';
    if (sideRand < 47) side = 'bride';
    else if (sideRand < 94) side = 'groom';
    else side = 'both';
    sideBuckets[side].push(gid);

    // Pick a tag from the matching pool (or shared for 'both')
    const pool = side === 'both' ? SHARED_TAGS : side === 'bride' ? BRIDE_TAGS : GROOM_TAGS;
    const tag = pool[(h >> 6) % pool.length];
    (tagBuckets[tag] ??= []).push(gid);
  });

  await Promise.all(
    (Object.entries(sideBuckets) as ['bride' | 'groom' | 'both', string[]][]).map(
      async ([side, ids]) => {
        if (ids.length === 0) return;
        await supabase.from('guests').update({ wedding_side: side } as any).in('id', ids);
      },
    ),
  );

  // Tags are persisted in the JSONB logistics_data column under .tag —
  // there's no dedicated column on guests yet. Fetch existing logistics_data
  // first so we don't clobber other keys, then write back per-guest.
  const guestsForTags = (
    await supabase
      .from('guests')
      .select('id, logistics_data')
      .in('id', guestIds)
  ).data as { id: string; logistics_data: any }[] | null;

  const existingDataById = new Map(
    (guestsForTags || []).map((g) => [g.id, g.logistics_data || {}]),
  );

  const tagUpdates: { id: string; logistics_data: any }[] = [];
  for (const [tag, ids] of Object.entries(tagBuckets)) {
    for (const gid of ids) {
      tagUpdates.push({
        id: gid,
        logistics_data: { ...(existingDataById.get(gid) || {}), tag },
      });
    }
  }

  await Promise.all(
    tagUpdates.map((u) =>
      supabase.from('guests').update({ logistics_data: u.logistics_data } as any).eq('id', u.id),
    ),
  );

  // ─── 2. Insert outreach_events over the past 7 days ─────────────────────
  // ~70% of contacted guests get an event, each with a template_name + recent
  // timestamp so the "Sent This Week" KPI and Activity Timeline populate.
  const contactedStages: Stage[] = [
    'save_the_date_sent', 'rsvp_requested', 'rsvp_confirmed', 'travel_collected', 'unresponsive',
  ];
  const eventRows: any[] = [];
  for (const stage of contactedStages) {
    for (const gid of byStage[stage]) {
      const h = hash(`${slug}:evt:${gid}`);
      if (h % 10 >= 7) continue; // skip ~30%

      const tpl = TEMPLATE_NAMES[h % TEMPLATE_NAMES.length];
      // Spread across the last 7 days
      const hoursAgo = h % (24 * 7);
      const sentAt = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000).toISOString();

      eventRows.push({
        wedding_id: slug,
        guest_id: gid,
        event_type: 'template_sent',
        template_name: tpl,
        channel: 'whatsapp',
        details: { seed: true, demo: true },
        created_at: sentAt,
      });
    }
  }
  if (eventRows.length > 0) {
    await supabase.from('outreach_events').insert(eventRows);
  }

  // ─── 3. Insert a few coordination_issues (escalations) ──────────────────
  // Pick the first few confirmed/travel-collected guests as the "customers"
  // behind each escalation so names look reasonable in the queue.
  const pool = [...byStage.rsvp_confirmed, ...byStage.travel_collected].slice(0, 4);
  if (pool.length > 0) {
    const issues = [
      {
        category: 'dietary',
        title: 'Severe nut allergy flagged',
        description: 'Guest mentioned a severe peanut allergy and asked about menu safety for the sangeet dinner. Needs caterer confirmation.',
        priority: 'high',
        status: 'open',
        hoursAgo: 4,
      },
      {
        category: 'travel',
        title: 'Flight change requested',
        description: 'Guest is rebooking arrival from Friday evening to Saturday morning. Needs new shuttle slot and updated room availability.',
        priority: 'medium',
        status: 'open',
        hoursAgo: 11,
      },
      {
        category: 'logistics',
        title: 'Plus-one not on list',
        description: 'Guest is bringing a +1 (partner) who is not on the original list. Needs RSVP confirmation and seating.',
        priority: 'medium',
        status: 'in_progress',
        hoursAgo: 24,
      },
      {
        category: 'venue',
        title: 'Wheelchair access for parent',
        description: 'Guest asking about wheelchair-accessible entrance for the haldi venue. Needs venue contact follow-up.',
        priority: 'high',
        status: 'open',
        hoursAgo: 48,
      },
    ];

    const issueRows = pool.map((gid, i) => {
      const issue = issues[i];
      return {
        wedding_id: slug,
        guest_id: gid,
        category: issue.category,
        title: issue.title,
        description: issue.description,
        priority: issue.priority,
        status: issue.status,
        source: 'concierge',
        created_at: new Date(now.getTime() - issue.hoursAgo * 60 * 60 * 1000).toISOString(),
      };
    });

    await supabase.from('coordination_issues' as any).insert(issueRows);
  }
}
