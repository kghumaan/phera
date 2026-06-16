/**
 * The Uncle Raj storyline. Known gap encoded as desired behavior: Sunita
 * Mehra has her OWN guest row + yes RSVP — when "Raj and Sunita" cancel,
 * BOTH rows should flip, and the agent should connect the dots to room 204.
 */
export default {
  name: 'cancellation-couple',
  description: 'Populated wedding: couple cancels — both RSVPs flip, room 204 flagged',
  seed: 'populated',
  turns: [
    {
      message: "Sad news — Uncle Raj and Sunita Mehra just told us they can't make it anymore.",
      expect: {
        tools: ['record_rsvp'],
        reply: ['204'],
      },
      verify: async (state, h) => {
        const raj = h.rsvpFor(state, 'Raj Mehra');
        const sunita = h.rsvpFor(state, 'Sunita Mehra');
        return [
          { label: "Raj's RSVP is no", pass: raj?.attending === 'no', detail: JSON.stringify(raj) },
          {
            label: "Sunita's OWN RSVP row is no (known gap: she also has her own guest row)",
            pass: sunita?.attending === 'no',
            detail: JSON.stringify(sunita),
          },
          {
            label: 'room 204 not silently changed',
            pass: (h.room(state, '204')?.assigned_guest_ids ?? []).length === 2,
          },
        ];
      },
    },
  ],
};
