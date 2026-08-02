/**
 * P6 — local, small, everyone in town. The agent must PRUNE the spine to
 * the minimal path (website/RSVP/guest list) and not push the destination
 * cluster: no shuttles, no passport/visa logistics, no room blocks.
 */
export default {
  name: 'persona-local-small',
  description: 'Blank wedding: 40-person local wedding → minimal path, destination cluster pruned',
  persona: 'P6',
  seed: 'blank',
  turns: [
    {
      message:
        "We're Nina and Sam — a small 40-person wedding at a restaurant here in Hoboken, NJ this October. Everyone's local. Keep it simple: what do we actually need?",
      expect: {
        reply: ['rsvp|website|guest list|schedule'],
        // "You can skip shuttles" is fine — only PUSHING the destination
        // cluster fails: an offer/setup verb within reach of the noun.
        replyNot: [
          '(set up|arrange|organi[sz]e|book|need|want).{0,30}shuttle',
          'passport',
          'visa',
          'room block',
          'family liaison',
        ],
      },
      verify: async (state) => [
        {
          label: 'no invented guests/rooms for a blank local wedding',
          pass: state.guests.length === 0 && state.rooms.length === 0,
          detail: `${state.guests.length} guests, ${state.rooms.length} rooms`,
        },
      ],
    },
  ],
};
