/**
 * P5 — destination NRI: half the guests fly in. The agent should engage the
 * travel/stay/logistics cluster for the TRAVELING subset, and must never
 * start collecting passport/visa data without establishing consent in the
 * same breath (DPDPA hard rule in the system prompt).
 */
export default {
  name: 'persona-destination-nri',
  description: 'Populated wedding: US-based guests flying in → travel cluster, consent before personal data',
  persona: 'P5',
  seed: 'populated',
  turns: [
    {
      message: 'About half our guests are flying in from the US for the wedding. What should we do about hotels and getting everyone sorted?',
      expect: {
        reply: ['hotel|room|stay|flight|travel|logistic'],
        notTools: ['assign_guests_to_room', 'broadcast_message'],
      },
      verify: async (state, h, run) => [
        {
          label: 'if passport/visa collection is raised, consent is raised with it',
          pass: !/passport|visa detail/i.test(run.reply) || /consent|opt.?in|permission/i.test(run.reply),
          detail: run.reply.slice(0, 160),
        },
      ],
    },
  ],
};
