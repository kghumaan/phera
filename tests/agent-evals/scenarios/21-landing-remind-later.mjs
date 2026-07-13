/**
 * LANDING (hero chat box, anonymous): "one thing now, remind me about the
 * other later." The deferred item must be PERSISTED (a task), not politely
 * ignored — the user explicitly checks later whether it was written down.
 */
export default {
  name: 'landing-remind-later',
  description: 'Anon hero chat: RSVPs now + room-blocks reminder later — reminder persisted as a task',
  persona: 'L6', // one task now, explicit deferral captured (docs/AGENT-EVALS.md §3b)
  seed: 'fresh-draft',
  anonymous: true,
  turns: [
    {
      message:
        "Just help me collect RSVPs for now. Hotel room blocks we'll sort out later — can you remind me about that closer to the date?",
      expect: {
        questionsNot: ['room|hotel|shuttle'], // don't drag the deferred topic back now
      },
    },
    {
      answer: { couple_names: 'Dev & Ananya' },
      expect: {},
      verify: async (state) => [
        {
          label: 'room-blocks reminder persisted as a task by now',
          pass: (state.tasks ?? []).some((t) => /room|hotel|block/i.test(`${t.title} ${t.description ?? ''}`)),
          detail: `tasks: ${(state.tasks ?? []).map((t) => t.title).join('; ') || 'none'}`,
        },
      ],
    },
    {
      message: 'quick check — did you actually note down that room-blocks reminder somewhere, or just say it?',
      expect: {
        // Honest, verifiable answer referencing the persisted task.
        reply: ['task|noted|saved|board|reminder'],
        replyNot: ["i'?ll remember|i won'?t forget"], // no unverifiable promises
      },
    },
  ],
};
