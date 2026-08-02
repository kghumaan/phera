/**
 * LANDING (hero chat box, anonymous): the visitor starts as an ambiguous
 * "help with a wedding" user and only reveals mid-chat that they are the
 * PLANNER, not the couple. After the reveal the agent must flip to the
 * third-person client register and stop saying "your wedding".
 *
 * KNOWN GAP (UAT 2026-07-13): nothing persists the planner identity — the
 * snapshot Account line only flips via user_settings.account_type, which
 * chat cannot set. Register adaptation is purely in-context; a new
 * conversation forgets they're a planner.
 */
export default {
  name: 'planner-mid-reveal',
  description: 'Anon hero chat: mid-chat "I am their planner" reveal — register flips, no "your wedding" after',
  persona: 'P7',
  seed: 'fresh-draft',
  anonymous: true,
  turns: [
    {
      message: 'Need help organizing a big Indian wedding in Jaipur next March — around 250 guests, multi-day.',
      expect: {},
    },
    {
      answer: { couple_names: 'Rohan & Diya' },
      expect: {},
    },
    {
      message:
        "Small thing — I'm actually their wedding planner, this is for my clients Rohan & Diya. I handle a few weddings a year.",
      expect: {
        // Must acknowledge the reveal and address them as the planner.
        reply: ['planner|client|their wedding|the couple'],
        replyNot: ['congratulations on your engagement'],
        questionsNot: ['your wedding|your names'],
      },
    },
    {
      message: "Let's draft the 3-day schedule for them.",
      expect: {
        // The register is the point of this fixture — the agent may reasonably
        // ask for dates/events before creating schedule rows, so no tools
        // requirement here; just never slip back into the couple register.
        replyNot: ['your wedding|your big day|your celebrations'],
      },
    },
  ],
};
