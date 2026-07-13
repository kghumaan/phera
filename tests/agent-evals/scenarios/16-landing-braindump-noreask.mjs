/**
 * LANDING (hero chat box, anonymous): brain-dump — every basic fact in the
 * first message (E1 in docs/AGENT-EVALS.md §4). The agent must parse and
 * persist ALL of it in turn 1 and never re-ask any given fact afterwards.
 *
 * KNOWN GAP (UAT 2026-07-13): the "~300 guests / half flying from the US"
 * facts have no home — nothing records an expected headcount. The verify
 * below checks the facts that CAN be persisted; the headcount check is a
 * regression target that goes green once a capture path exists.
 */
export default {
  name: 'landing-braindump-noreask',
  description: 'Anon hero chat: E1 brain-dump — all facts persisted turn 1, zero re-asks',
  persona: 'E1',
  seed: 'fresh-draft',
  anonymous: true,
  turns: [
    {
      message:
        "We're Priya & Rahul — getting married Dec 12-14 2026 at the Leela Palace Udaipur, around 300 guests and probably half of them flying in from the US. We need help with basically everything.",
      expect: {
        tools: ['update_wedding_details', 'set_planning_goals'],
        questionsNot: ['your names|venue|which city|when are'], // nothing they already said
      },
      verify: async (state, _h, run) => [
        { label: 'names persisted', pass: state.wedding.partner1_name === 'Priya' && state.wedding.partner2_name === 'Rahul' },
        { label: 'dates persisted', pass: String(state.wedding.wedding_date).startsWith('2026-12-12'), detail: String(state.wedding.wedding_date) },
        { label: 'venue persisted', pass: /leela/i.test(state.wedding.venue_name ?? ''), detail: state.wedding.venue_name },
        {
          label: '~300 expected-guest headcount recorded (weddings.expected_guest_count, added 2026-07-13)',
          pass: state.wedding.expected_guest_count >= 250 && state.wedding.expected_guest_count <= 350,
          detail: `expected_guest_count=${state.wedding.expected_guest_count}`,
        },
      ],
    },
    {
      message: 'Yes, lay out a typical schedule for those days.',
      expect: {
        questionsNot: ['your names|venue name|which city|what.*dates'],
        replyNot: ["what are your names|which venue|where.*wedding"],
      },
    },
  ],
};
