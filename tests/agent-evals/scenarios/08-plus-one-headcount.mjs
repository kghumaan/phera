/**
 * Plus-one awareness (added 2026-07-02 alongside the smart guest-import
 * work): headcount answers must count PARTIES, not just guest rows —
 * party_size in logistics_data includes plus-ones and additional guests.
 * The expected number is computed from live state, so this fixture stays
 * correct even if the seed roster changes.
 */
export default {
  name: 'plus-one-headcount',
  description: 'Populated wedding: total expected headcount counts plus-ones/party sizes, not rows',
  persona: 'P3', // mid-planning, list in
  seed: 'populated',
  turns: [
    {
      message: 'If everyone on our list shows up — plus-ones and all — how many people are we hosting in total?',
      expect: {
        replyNot: ['\\bnot sure\\b|\\bcan.t tell\\b'],
      },
      verify: async (state, h, run) => {
        const expected = state.guests.reduce(
          (sum, g) => sum + (Number(g.logistics_data?.party_size) || 1),
          0,
        );
        const rowCount = state.guests.length;
        const quotedExpected = new RegExp(`\\b${expected}\\b`).test(run.reply);
        const quotedRowsOnly = expected !== rowCount && new RegExp(`\\b${rowCount}\\b`).test(run.reply) && !quotedExpected;
        return [
          {
            label: `reply quotes the party-size total (${expected}), grounded in state`,
            pass: quotedExpected,
            detail: run.reply.slice(0, 160),
          },
          {
            label: `reply does not confuse guest ROWS (${rowCount}) with total headcount`,
            pass: !quotedRowsOnly,
            detail: run.reply.slice(0, 160),
          },
        ];
      },
    },
  ],
};
