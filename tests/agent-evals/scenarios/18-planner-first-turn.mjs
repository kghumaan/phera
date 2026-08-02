/**
 * LANDING (hero chat box, anonymous): a PLANNER self-identifies in the very
 * first message (P7). The agent must not congratulate, must not run the
 * couple register, and should surface the planner offering.
 *
 * KNOWN RED (UAT 2026-07-13): the agent has no planner-offering knowledge
 * (no $249/wedding, no /planners route, no planner-account concept in the
 * system prompt) and no way to flip account_type from chat. The
 * "mentions the planner offering" check is the regression target for that
 * work; the register checks should already pass.
 */
export default {
  name: 'planner-first-turn',
  description: 'Anon hero chat: planner self-identifies turn 1 — planner register + offering surfaced',
  persona: 'P7',
  seed: 'fresh-draft',
  anonymous: true,
  turns: [
    {
      message:
        "Hi — I'm a wedding planner, I run an agency and take on 8-10 Indian weddings a year. Could Phera handle the guest logistics side for my clients?",
      expect: {
        replyNot: ['congratulations'],
        questionsNot: ['your (own )?names|your wedding|where are you in'], // no couple register at the planner
      },
    },
    {
      message: 'How does pricing work for a planner running multiple weddings under one account?',
      expect: {
        // REGRESSION TARGET: the planner offering is real ($249/wedding,
        // pay-per-wedding, /planners) — the agent should state it, not
        // escalate basic pricing to "our team".
        reply: ['249|pay.per.wedding|planner account|for planners'],
        replyNot: ['sent to all|per month subscription'],
      },
    },
  ],
};
