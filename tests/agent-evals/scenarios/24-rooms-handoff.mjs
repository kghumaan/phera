/**
 * ROOMS — the third rich section. Placing 200 people in beds is a drag-and-drop
 * job, not a chat job, so the agent must hand off rather than play travel agent
 * one guest at a time.
 *
 *   "put everyone in rooms" → BUTTON to /room-assignments
 *   → they go and block out rooms + place guests in the real UI
 *   → they come back → the agent SEES the rooms and who's placed
 *   → confirms and closes the step.
 *
 * Seeded 'populated' because rooms only make sense once there are guests.
 */
export default {
  name: 'rooms-handoff',
  description: 'Rooms: handoff button → they place guests in the UI → agent notices the delta → confirms → closes the step',
  persona: 'P6',
  seed: 'populated',
  turns: [
    {
      message: 'Right — I want to put everyone into their hotel rooms now.',
      expect: {
        tools: ['hand_off_to_section'],
        events: ['section_handoff'],
      },
      verify: async (_state, _h, { reply }) => [
        {
          label: 'does not try to assign rooms one guest at a time in chat',
          pass: !/who (should|do you want) (to )?(go |be )?in room|which room (for|should)/i.test(reply),
          detail: reply.slice(0, 160),
        },
        {
          label: 'says it will be waiting when they come back',
          pass: /come back|when you'?re (back|done)|right here|still here|stays? (saved|here)/i.test(reply),
          detail: reply.slice(0, 140),
        },
      ],
    },
    {
      // They go to /room-assignments and place four more households.
      patch: {
        rooms: [
          { room_number: '401', hotel_name: 'Taj Lake Palace', capacity: 2, assign: ['Tom Becker'] },
          { room_number: '402', hotel_name: 'Taj Lake Palace', capacity: 4, assign: ['Lakshmi Nair'] },
          { room_number: '403', hotel_name: 'Taj Lake Palace', capacity: 2, assign: ['Karan Kapoor', 'Pooja Bhatt'] },
          { room_number: '404', hotel_name: 'Taj Lake Palace', capacity: 2, assign: ['Ritu Agarwal'] },
        ],
      },
    },
    {
      message: "I've placed the rest of them.",
      expect: {
        replyNot: ['did you finish', 'have you finished', 'are you done yet'],
      },
      verify: async (state, _h, { reply, prompts }) => {
        const said = `${reply} ${prompts.join(' ')}`;
        const placed = new Set(state.rooms.flatMap((r) => r.assigned_guest_ids ?? [])).size;
        return [
          {
            // 8 rooms / 7 guests placed at seed, + 4 rooms / 5 guests here.
            label: 'the new placements really landed in the DB',
            pass: state.rooms.length === 12 && placed === 12,
            detail: `rooms=${state.rooms.length} placed=${placed}`,
          },
          {
            label: 'acknowledges the room work instead of interrogating them',
            pass: /room|placed|sorted|bed/i.test(said),
            detail: said.slice(0, 180),
          },
          {
            label: 'checks they are happy with it rather than silently moving on',
            pass: /happy|good to (go|move)|shall we|ready to|move on|next|anything else/i.test(said),
            detail: said.slice(0, 180),
          },
        ];
      },
    },
    {
      message: "Yes — that's rooms done.",
      expect: { tools: ['finish_section'] },
    },
  ],
};
