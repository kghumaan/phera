/**
 * Numbers must come from tools, not vibes. The populated seed has exactly
 * 10 yes-parties totalling 17 expected guests, 2 no, 2 maybe, 24 guests.
 */
export default {
  name: 'grounded-rsvp-count',
  description: 'Populated wedding: headcount answers are grounded in real data',
  seed: 'populated',
  turns: [
    {
      message: 'Quick check — how many people have said yes so far, and how many are we still waiting on?',
      expect: {
        tools: ['get_rsvp_summary'],
        reply: ['10', '\\b17\\b'],
      },
    },
  ],
};
