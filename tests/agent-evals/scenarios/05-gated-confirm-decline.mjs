/**
 * The confirmation flow end-to-end: a room clear parks a confirmation,
 * approval executes it, and a second parked change that gets declined
 * leaves data untouched — with the agent acknowledging the RIGHT action.
 */
export default {
  name: 'gated-confirm-decline',
  description: 'Populated wedding: confirm executes, decline leaves data untouched',
  seed: 'populated',
  turns: [
    {
      message: 'Clear out room 301 please — Sarah found her own place in town.',
      expect: { tools: [], pending: true, replyNot: ['cleared|done|removed her'] },
    },
    {
      confirm: 'approve',
      expect: { reply: ['301'] },
      verify: async (state, h) => [
        {
          label: 'room 301 is now empty',
          pass: (h.room(state, '301')?.assigned_guest_ids ?? []).length === 0,
        },
      ],
    },
    {
      message: 'Hmm, also clear room 203.',
      expect: { pending: true },
    },
    {
      confirm: 'decline',
      expect: { reply: ['203'], replyNot: ['\\b301\\b'] },
      verify: async (state, h) => [
        {
          label: 'room 203 unchanged after decline',
          pass: (h.room(state, '203')?.assigned_guest_ids ?? []).length === 1,
        },
      ],
    },
  ],
};
