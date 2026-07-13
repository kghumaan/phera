/**
 * LANDING (hero chat box, anonymous): visitor types ONE specific ask —
 * "Build our wedding website — June in Bali" (a real rotating-prompt example).
 * The agent must engage with the request directly (no congratulations opener
 * per the ANONYMOUS first-contact rule), weave names in via ask_user, and not
 * hijack the session into unrelated onboarding areas.
 */
export default {
  name: 'landing-hero-one-thing',
  description: 'Anon hero chat: one-thing website ask — act on it, no congrats opener, names via card',
  persona: 'L1', // hero chat box, wants exactly one thing (docs/AGENT-EVALS.md §3b)
  seed: 'fresh-draft',
  anonymous: true,
  turns: [
    {
      message: 'Build our wedding website — June in Bali',
      expect: {
        replyNot: ['congratulations on your engagement'],
        questionsNot: ['budget'],
        notTools: ['broadcast_message'],
      },
    },
    {
      answer: { couple_names: 'Nikhil & Tara' },
      expect: {
        questionsNot: ['your names|who.s getting married'], // never re-ask names just given
        replyNot: ["can't|cannot|unable"],
      },
      verify: async (state) => [
        {
          label: 'names persisted from the answer card',
          pass: /nikhil/i.test(state.wedding.couple_name ?? '') || state.wedding.partner1_name === 'Nikhil',
          detail: `${state.wedding.couple_name} / ${state.wedding.partner1_name}`,
        },
      ],
    },
    {
      message: 'Just the website for now please — nothing else today.',
      expect: {
        // Respect the one-thing boundary: no pivot to guest list / rooms / RSVPs.
        questionsNot: ['guest list|room|rsvp|shuttle|transport'],
      },
    },
  ],
};
