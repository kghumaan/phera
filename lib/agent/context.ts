import type { SupabaseClient } from '@supabase/supabase-js';
import {
  FOCUS_TITLE,
  SPINE_STEPS,
  spineStepLabel,
  spineComplete,
  type SpineFocus,
} from './spine';
import { SECTIONS, publicSiteUrl, type SectionKey } from './sections';
import { readSectionMetrics } from './section-metrics';
import { readHandoff } from './tools/handoff';

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
  /** Persisted spine focus (the "Working on" bar) — null when never set. */
  focus: (SpineFocus & { label: string | null; complete: boolean }) | null;
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
    knowledgeRes,
  ] = await Promise.all([
    supabase
      .from('weddings')
      .select(
        'couple_name, partner1_name, partner2_name, wedding_date, wedding_date_end, venue_name, venue_location, rsvp_deadline, status, created_by, expected_guest_count'
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
    // Goals + spine focus need only the slug — batched here instead of a
    // second serial round-trip. Fail-open if the knowledge table is missing.
    (async () => {
      try {
        return await supabase
          .from('agent_knowledge')
          .select('title, content, metadata')
          .eq('wedding_id', weddingSlug)
          .eq('scope', 'wedding')
          .in('title', ['Planning goals', FOCUS_TITLE]);
      } catch {
        return { data: null };
      }
    })(),
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

  // Planning goals + current spine focus — both live as wedding-scoped
  // agent_knowledge rows, fetched in the batch above. Fail-open if missing.
  let goals: string | null = null;
  let focus: WeddingSnapshot['focus'] = null;
  {
    const data = (knowledgeRes as { data: Array<{ title: string; content: string; metadata: unknown }> | null }).data;
    goals = data?.find((r) => r.title === 'Planning goals')?.content ?? null;
    const focusMeta = data?.find((r) => r.title === FOCUS_TITLE)?.metadata as
      | Partial<SpineFocus>
      | undefined;
    if (focusMeta) {
      const parsed: SpineFocus = {
        step: typeof focusMeta.step === 'string' ? focusMeta.step : null,
        done: Array.isArray(focusMeta.done) ? focusMeta.done.filter((s): s is string => typeof s === 'string') : [],
        skipped: Array.isArray(focusMeta.skipped)
          ? focusMeta.skipped.filter((s): s is string => typeof s === 'string')
          : [],
      };
      focus = { ...parsed, label: spineStepLabel(parsed.step), complete: spineComplete(parsed) };
    }
  }

  // Is the owner a planner (running a CLIENT's wedding) vs the couple themselves?
  // Changes how the agent addresses them during onboarding. Fail-open to couple.
  let isPlanner = false;
  try {
    if (wedding.created_by) {
      const { data } = await supabase
        .from('user_settings')
        .select('account_type')
        .eq('user_id', wedding.created_by)
        .maybeSingle();
      isPlanner = data?.account_type === 'planner';
    }
  } catch {
    /* settings unavailable — assume couple */
  }

  const today = new Date().toISOString().slice(0, 10);
  const daysToWedding = dateSet
    ? Math.round((new Date(wedding.wedding_date).getTime() - Date.now()) / 86_400_000)
    : null;

  // Rich-section state + any OPEN handoff. If the agent sent them to a section,
  // we stamped what the data looked like then — so now we can diff it and tell
  // the agent what they actually did, instead of it asking "are you done yet?".
  const sectionState = await readSectionMetrics(supabase, weddingSlug, weddingUuid);
  let handoffLine: string | null = null;
  try {
    const handoff = await readHandoff(supabase, weddingSlug);
    if (handoff) {
      const def = SECTIONS[handoff.section];
      const changed = def.progress(handoff.baseline, sectionState);
      const done = def.looksDone(sectionState);
      handoffLine = changed
        ? `OPEN HANDOFF — you sent them to ${def.label}. SINCE THEN THEY DID: ${changed}. ` +
          `Open your next reply by naming what they actually did (do NOT ask "did you finish?" — you can see it), then ask ONE ask_user single_select whether they're happy with ${def.label} for now. ` +
          `If yes → call finish_section and move on${
            handoff.section === 'website' && done && !sectionState.published
              ? ', and since the details are filled in, that is the moment to ask if they want to PUBLISH'
              : ''
          }.`
        : `OPEN HANDOFF — you sent them to ${def.label} and NOTHING has changed there yet. Don't nag. If they're talking about something else, help with that; only check in on ${def.label} if it comes up or they say they're done.`;
    }
  } catch {
    /* no handoff on file — fine */
  }

  // No handoff open, but the step they're on IS one of the rich sections: say so
  // as a standing instruction. In prose alone the model keeps "helpfully"
  // drafting welcome copy or asking for a venue in chat — work that belongs on
  // the page it is supposed to be opening for them.
  // The step they're on — from the spine focus if it's set, otherwise from the
  // goals they stated (the focus is often set mid-turn, so goals are what we
  // have on the very turn where the handoff is due).
  const goalText = (goals ?? '').toLowerCase();
  const dueSection: SectionKey | null = handoffLine
    ? null
    : ((['website', 'guest-list', 'rooms'] as SectionKey[]).find((key) => focus?.step === key) ??
      (goalText.includes('website')
        ? 'website'
        : goalText.includes('guest list')
          ? 'guest-list'
          : goalText.includes('room')
            ? 'rooms'
            : null));
  const handoffDueLine =
    dueSection && !SECTIONS[dueSection].looksDone(sectionState)
      ? `NEXT MOVE — ${SECTIONS[dueSection].label} is what they want and they have NOT been sent there yet: call hand_off_to_section("${dueSection}") as your first tool call this turn. The button only exists if you CALL the tool — talking about "the button above" without calling it shows them nothing. Do not write page content, draft FAQs, or ask for a venue/date in chat instead: those fields live in that section and they will fill them there.`
      : null;

  const lines = [
    `Today's date: ${today}`,
    `Account: ${
      isPlanner
        ? "PLANNER — you're helping a wedding planner set up their CLIENT's wedding (not the planner's own). Address the planner; ask for THE COUPLE's names (\"What's the couple's name?\"), phrase every question about their client's wedding in the third person, and treat the guest list / dates / details as the couple's. Never congratulate the planner on an engagement."
        : 'Couple — they are using Phera for their own wedding.'
    }`,
    `Planning goals: ${goals || 'NOT SET — first ask what they want help with'}`,
    `Working on (spine focus): ${
      focus?.step
        ? `${focus.label} [${focus.step}]${focus.done.length ? ` · done: ${focus.done.join(', ')}` : ''}${
            focus.skipped.length ? ` · skipped (resurface later): ${focus.skipped.join(', ')}` : ''
          } — if this is the first message of a NEW conversation, open by asking whether they're done with ${focus.label} before moving on`
        : focus?.complete
          ? `spine complete ✓${focus.skipped.length ? ` (still skipped: ${focus.skipped.join(', ')})` : ''}`
          : `NOT SET — once goals are set, call set_current_focus for the first relevant spine step (order: ${SPINE_STEPS.map((s) => s.key).join(' → ')})`
    }`,
    `Couple: ${wedding.couple_name ?? [wedding.partner1_name, wedding.partner2_name].filter(Boolean).join(' & ') ?? 'not set'}`,
    `Wedding date: ${dateSet ? wedding.wedding_date : 'NOT SET'}${dateSet && wedding.wedding_date_end ? ` to ${wedding.wedding_date_end}` : ''}${
      daysToWedding !== null ? ` (${daysToWedding} days away)` : ''
    }`,
    `Venue: ${venueName ?? 'NOT SET'}${venueLocation ? ` — ${venueLocation}` : ''}`,
    `RSVP deadline: ${rsvpDeadline ?? 'not set'}`,
    `Guests: ${guestCount} (${respondedGuests} responded) | Expected people (rough): ${wedding.expected_guest_count ? `~${wedding.expected_guest_count}` : 'not captured'} | Events: ${eventCount} | Schedule days: ${scheduleDays}`,
    `Rooms: ${roomCount} | Vendors: ${vendorCount} | FAQs: ${faqCount} | Open tasks: ${openTasks}`,
    // The rich-section state the agent used to be blind to: whether the site is
    // live, whether the guest list is organised, whether anyone is actually in a
    // room. Without these it can only ask "are you done?" — with them it can SEE.
    `Website: ${
      sectionState.published
        ? `LIVE at ${publicSiteUrl(weddingSlug)} — it is public; guests with the link can open it`
        : sectionState.detailsComplete
          ? 'DRAFT — details are filled in, so it is READY TO PUBLISH (ask them, then publish_website)'
          : 'DRAFT — still has placeholders (needs names, date, venue and a welcome note before it can go live)'
    }`,
    `Guest list: ${sectionState.guests} guests${
      sectionState.guests ? ` · ${sectionState.taggedGuests} tagged (side/family)` : ''
    } | Rooms: ${sectionState.rooms} · ${sectionState.assignedGuests} guests placed`,
    ...(handoffLine ? [handoffLine] : []),
    ...(handoffDueLine ? [handoffDueLine] : []),
    // In-app pages the agent can link when handing off to a rich section —
    // MarkdownText renders [label](/path) as a real link in the chat. For the
    // three RICH sections prefer hand_off_to_section (a real button) over a link.
    `App pages (markdown links you can share): [Website details](/admin/${weddingSlug}/details) · [Website design](/admin/${weddingSlug}/look-and-feel) · [Guest list](/admin/${weddingSlug}/guest-list) · [Schedule](/admin/${weddingSlug}/schedule) · [Room assignments](/admin/${weddingSlug}/room-assignments) · [FAQs](/admin/${weddingSlug}/faq) · [Settings & Publish](/admin/${weddingSlug}/settings)`,
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

  return { text: lines.join('\n'), completeness, stats, focus };
}
