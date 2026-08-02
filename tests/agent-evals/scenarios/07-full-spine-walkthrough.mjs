/**
 * THE canonical spine eval: a venue-booked couple walks the ENTIRE planning
 * spine in the decided dependency order (docs/PLANNER-SPINE-TRACKER.md E1):
 * schedule → travel/stay → website → guest list → RSVPs → rooms → vendors
 * → registry → photos. Each turn feeds one step and checks the agent keeps
 * moving forward through the chain — no step skipped, no backward jumps,
 * no fabrication. Checks are structural + tolerant regex (live model).
 *
 * Enforced by tests/agent-evals/scenario-coverage.test.ts: this file must
 * exist, declare `spine: 'full'`, and its spineSteps must match the
 * canonical order — so the eval suite can never silently drop spine
 * coverage or drift from the decided order.
 */
export default {
  name: 'full-spine-walkthrough',
  description: 'Blank wedding: whole spine traversed in the decided order, one step per turn',
  persona: 'P2', // venue booked, early — wants help with everything
  spine: 'full',
  spineSteps: ['schedule', 'travel', 'website', 'guest-list', 'rsvps', 'rooms', 'vendors', 'registry', 'photos'],
  seed: 'blank',
  turns: [
    {
      // → step 1: schedule/events is where the agent should take them first
      message:
        "We're Meera and Kabir — we've booked The Leela in Goa for March 5-7 2027, about 150 guests, many flying in. We want help with everything, start to finish.",
      expect: {
        tools: ['update_wedding_details'],
        reply: ['schedule|events?|functions?|sangeet|ceremony'],
      },
      verify: async (state) => [
        {
          label: 'venue + dates captured without re-asking',
          pass: /leela/i.test(state.wedding.venue_name ?? '') && String(state.wedding.wedding_date).startsWith('2027-03'),
          detail: `${state.wedding.venue_name} / ${state.wedding.wedding_date}`,
        },
      ],
    },
    {
      // step 1 answered → schedule built, then → step 2: travel/stay (NOT website)
      message:
        'Sangeet on the evening of the 5th (dress code: festive), wedding ceremony the morning of the 6th (traditional), reception that night (black tie optional). Set it all up.',
      expect: {
        tools: ['create_event'],
        reply: ['travel|stay|hotel|accommodat|fly|shuttle'],
        replyNot: ["can't create|cannot create|admin UI"],
      },
      verify: async (state) => [
        {
          label: 'at least 3 events created from the sketch',
          pass: state.events.length >= 3,
          detail: state.events.map((e) => e.name).join(', '),
        },
      ],
    },
    {
      // step 2 answered → step 3: website + FAQs (built on real travel facts)
      message:
        "Most guests fly in from the US. We've blocked rooms at The Leela for close family — everyone else books their own. No shuttles needed, everything is on-property.",
      expect: {
        reply: ['website|faq'],
      },
    },
    {
      // step 3 → step 4: guest list
      message: 'Yes — set up the website and FAQs with all of that.',
      expect: {
        reply: ['guest list|guests|import|upload'],
      },
    },
    {
      // step 4: guest list via upload (never hand-typed through chat).
      // request_upload is special-cased in dispatch — it surfaces as the
      // upload_requested EVENT, not an action row.
      message: 'Our guest list is in a spreadsheet — it has plus-one columns and extra guest columns for families.',
      expect: {
        events: ['upload_requested'],
      },
      verify: async (state) => [
        {
          label: 'no guests fabricated before the upload',
          pass: state.guests.length === 0,
          detail: `${state.guests.length} guests`,
        },
      ],
    },
    {
      // step 5: RSVPs — the broadcast/invite moment (the SEND trigger)
      message: "Once the list is in we're ready to invite everyone to RSVP through the site. How does that work?",
      expect: {
        reply: ['rsvp|invite|broadcast|whatsapp|link'],
      },
    },
    {
      // step 6: rooms
      message: 'After RSVPs land, we want help assigning the family to the blocked rooms.',
      expect: {
        reply: ['room'],
      },
    },
    {
      // step 7: vendors — covered city (Goa) MUST search the directory first
      message: "We still don't have a photographer. Overall vendor budget is around $8,000 — any options in Goa?",
      expect: {
        tools: ['search_vendor_directory'],
        replyNot: ['our team will (find|source)'],
      },
    },
    {
      // step 8: registry
      message: 'We also have a Zola registry — can that go on the website too?',
      expect: {
        reply: ['registry'],
      },
    },
    {
      // step 9: photos — not self-serve yet; managed capture, never faked
      message: 'Last thing: we want a shared photo album guests can add their pictures to after each event.',
      expect: {
        tools: ['submit_request'],
        replyNot: ['created your album|album is (live|ready)'],
      },
    },
  ],
};
