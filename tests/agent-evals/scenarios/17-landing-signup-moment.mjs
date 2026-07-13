/**
 * LANDING (hero chat box, anonymous): the signup moment. Per the system
 * prompt, request_signup fires ONCE — after the agent knows their names AND
 * what they're after — never in the very first reply, and never as prose
 * asking for an email.
 */
export default {
  name: 'landing-signup-moment',
  description: 'Anon hero chat: signup card after names+needs are known, never turn 1, never email-in-prose',
  persona: 'L3', // anonymous signup-nudge timing (docs/AGENT-EVALS.md §3b)
  seed: 'fresh-draft',
  anonymous: true,
  turns: [
    {
      message: 'We need help planning our wedding in Jaipur next winter',
      expect: {
        notEvents: ['signup_required'], // help first — never lead with signup
        replyNot: ['sign up|create an account|email address'],
      },
    },
    {
      answer: { couple_names: 'Aisha & Danyal' },
      expect: {
        replyNot: ['email address|password'], // the card collects those, never prose
      },
    },
    {
      message: 'Mainly RSVPs and a wedding website. Will this all be saved for us?',
      expect: {
        // Names + needs are now known and they asked about saving —
        // the signup card should appear on (or before) this turn.
        events: ['signup_required'],
        replyNot: ['type your email|send me your email'],
      },
    },
  ],
};
