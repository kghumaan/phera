import type { SupabaseClient } from '@supabase/supabase-js';

export interface CompletenessItem {
  key: string;
  label: string;
  done: boolean;
  detail?: string;
}

export interface WeddingStats {
  coupleName: string | null;
  guestCount: number;
  respondedGuests: number;
  daysToWedding: number | null;
  eventCount: number;
  scheduleDays: number;
  roomCount: number;
  vendorCount: number;
  faqCount: number;
  openTasks: number;
  dateSet: boolean;
  venueSet: boolean;
  rsvpDeadlineSet: boolean;
  goalsSet: boolean;
}

export interface WeddingSnapshot {
  text: string;
  completeness: CompletenessItem[];
  /** Structured numbers behind the snapshot — for analytical UI (e.g. Planner starter prompts). */
  stats: WeddingStats;
}

/**
 * Build the dynamic context block injected after the cached system prompt:
 * a compact factual snapshot of the wedding plus a completeness checklist the
 * agent uses to drive onboarding questions and proactive suggestions.
 */
export async function buildWeddingSnapshot(
  supabase: SupabaseClient,
  weddingSlug: string,
  weddingUuid: string
): Promise<WeddingSnapshot> {
  const [
    weddingRes,
    guestCountRes,
    respondedRes,
    roomCountRes,
    vendorCountRes,
    eventCountRes,
    scheduleDayRes,
    faqCountRes,
    openTaskRes,
  ] = await Promise.all([
    supabase
      .from('weddings')
      .select(
        'couple_name, partner1_name, partner2_name, wedding_date, wedding_date_end, venue_name, venue_location, rsvp_deadline, status'
      )
      .eq('id', weddingUuid)
      .single(),
    supabase.from('guests').select('id', { count: 'exact', head: true }).eq('wedding_id', weddingSlug),
    supabase.from('rsvps').select('guest_id').eq('wedding_id', weddingSlug),
    supabase.from('wedding_rooms').select('id', { count: 'exact', head: true }).eq('wedding_id', weddingSlug),
    supabase.from('vendors').select('id', { count: 'exact', head: true }).eq('wedding_id', weddingUuid),
    supabase.from('wedding_events').select('id', { count: 'exact', head: true }).eq('wedding_id', weddingUuid),
    supabase.from('wedding_schedule').select('id', { count: 'exact', head: true }).eq('wedding_id', weddingUuid),
    supabase.from('wedding_faqs').select('id', { count: 'exact', head: true }).eq('wedding_id', weddingUuid),
    supabase
      .from('wedding_tasks')
      .select('id', { count: 'exact', head: true })
      .eq('wedding_id', weddingUuid)
      .neq('column', 'done'),
  ]);

  const wedding = weddingRes.data;
  if (!wedding) throw new Error('Wedding not found for snapshot');

  // Onboarding stores placeholders for "to be decided": wedding_date = epoch,
  // venue_name = 'Venue TBD', wedding_date_display = 'Dates TBD', rsvp_deadline = ''.
  const dateSet = !!wedding.wedding_date && new Date(wedding.wedding_date).getTime() > 0;
  const venueName = wedding.venue_name && !/\bTBD\b/i.test(wedding.venue_name) ? wedding.venue_name : null;
  const venueLocation = wedding.venue_location || null;
  const rsvpDeadline = wedding.rsvp_deadline || null;

  const guestCount = guestCountRes.count ?? 0;
  const respondedGuests = new Set((respondedRes.data ?? []).map((r) => r.guest_id).filter(Boolean)).size;
  const roomCount = roomCountRes.count ?? 0;
  const vendorCount = vendorCountRes.count ?? 0;
  const eventCount = eventCountRes.count ?? 0;
  const scheduleDays = scheduleDayRes.count ?? 0;
  const faqCount = faqCountRes.count ?? 0;
  const openTasks = openTaskRes.count ?? 0;

  const completeness: CompletenessItem[] = [
    { key: 'date', label: 'Wedding date set', done: dateSet, detail: dateSet ? wedding.wedding_date : undefined },
    {
      key: 'venue',
      label: 'Venue / location set',
      done: !!(venueName || venueLocation),
      detail: [venueName, venueLocation].filter(Boolean).join(', ') || undefined,
    },
    { key: 'events', label: 'Ceremony events created', done: eventCount > 0, detail: `${eventCount} events` },
    { key: 'schedule', label: 'Day-by-day schedule started', done: scheduleDays > 0, detail: `${scheduleDays} days` },
    { key: 'guests', label: 'Guest list started', done: guestCount > 0, detail: `${guestCount} guests` },
    {
      key: 'rsvps',
      label: 'RSVPs coming in',
      done: respondedGuests > 0,
      detail: guestCount > 0 ? `${respondedGuests}/${guestCount} responded` : undefined,
    },
    { key: 'rsvp_deadline', label: 'RSVP deadline set', done: !!rsvpDeadline, detail: rsvpDeadline ?? undefined },
    { key: 'rooms', label: 'Room block entered', done: roomCount > 0, detail: `${roomCount} rooms` },
    { key: 'vendors', label: 'Vendors tracked', done: vendorCount > 0, detail: `${vendorCount} vendors` },
    { key: 'faqs', label: 'Guest FAQs written', done: faqCount > 0, detail: `${faqCount} FAQs` },
  ];

  // Planning goals (what the couple actually wants help with) — stored as a
  // wedding-scoped agent_knowledge row. Fail-open if missing.
  let goals: string | null = null;
  try {
    const { data } = await supabase
      .from('agent_knowledge')
      .select('content')
      .eq('wedding_id', weddingSlug)
      .eq('scope', 'wedding')
      .eq('title', 'Planning goals')
      .maybeSingle();
    goals = data?.content ?? null;
  } catch {
    /* knowledge table not available */
  }

  const today = new Date().toISOString().slice(0, 10);
  const daysToWedding = dateSet
    ? Math.round((new Date(wedding.wedding_date).getTime() - Date.now()) / 86_400_000)
    : null;

  const lines = [
    `Today's date: ${today}`,
    `Planning goals: ${goals || 'NOT SET — first ask what they want help with'}`,
    `Couple: ${wedding.couple_name ?? [wedding.partner1_name, wedding.partner2_name].filter(Boolean).join(' & ') ?? 'not set'}`,
    `Wedding date: ${dateSet ? wedding.wedding_date : 'NOT SET'}${dateSet && wedding.wedding_date_end ? ` to ${wedding.wedding_date_end}` : ''}${
      daysToWedding !== null ? ` (${daysToWedding} days away)` : ''
    }`,
    `Venue: ${venueName ?? 'NOT SET'}${venueLocation ? ` — ${venueLocation}` : ''}`,
    `RSVP deadline: ${rsvpDeadline ?? 'not set'}`,
    `Guests: ${guestCount} (${respondedGuests} responded) | Events: ${eventCount} | Schedule days: ${scheduleDays}`,
    `Rooms: ${roomCount} | Vendors: ${vendorCount} | FAQs: ${faqCount} | Open tasks: ${openTasks}`,
    '',
    'Setup checklist:',
    ...completeness.map((c) => `- [${c.done ? 'x' : ' '}] ${c.label}${c.detail ? ` (${c.detail})` : ''}`),
  ];

  const stats: WeddingStats = {
    coupleName:
      wedding.couple_name ?? [wedding.partner1_name, wedding.partner2_name].filter(Boolean).join(' & ') ?? null,
    guestCount,
    respondedGuests,
    daysToWedding,
    eventCount,
    scheduleDays,
    roomCount,
    vendorCount,
    faqCount,
    openTasks,
    dateSet,
    venueSet: !!(venueName || venueLocation),
    rsvpDeadlineSet: !!rsvpDeadline,
    goalsSet: !!goals,
  };

  return { text: lines.join('\n'), completeness, stats };
}
