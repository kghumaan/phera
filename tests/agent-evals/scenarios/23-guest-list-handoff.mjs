/**
 * GUEST LIST — the same handoff loop as the website, on the section couples
 * actually spend hours in.
 *
 *   "sort our guest list" → BUTTON to /guest-list (not a chat-by-chat import)
 *   → they go and add + tag 5 households in the real UI
 *   → they come back → the agent SEES 5 guests, 5 tagged, and names it back
 *     instead of asking "did you finish?"
 *   → it confirms they're happy and moves on rather than silently jumping ahead.
 */
export default {
  name: 'guest-list-handoff',
  description: 'Guest list: handoff button → they add + tag in the UI → agent notices the delta → confirms → moves on',
  persona: 'P3',
  seed: 'blank',
  turns: [
    {
      message: 'We are Nisha & Arun, married 20 March 2027 in Udaipur.',
      expect: { tools: ['update_wedding_details'] },
    },
    {
      message: 'I need to get our guest list in and tag everyone by side and family. Help me sort it.',
      expect: {
        // Bulk add + tagging is exactly what the rich section is for.
        tools: ['hand_off_to_section'],
        events: ['section_handoff'],
      },
      verify: async (_state, _h, { reply }) => [
        {
          label: 'says it will be waiting when they come back',
          pass: /come back|when you'?re (back|done)|right here|still here|stays? (saved|here)/i.test(reply),
          detail: reply.slice(0, 140),
        },
        {
          label: 'does not try to collect the guests name-by-name in chat',
          pass: !/give me (the |their )?(first|next) (few |couple )?names|list them (out |here)|type them (out|here)/i.test(reply),
          detail: reply.slice(0, 140),
        },
      ],
    },
    {
      // They go to /guest-list and do the work: 5 households, all tagged.
      patch: {
        guests: [
          { name: 'Raj Mehra', side: 'bride', party: 2, tags: ['family'] },
          { name: 'Sunita Mehra', side: 'bride', party: 1, tags: ['family'] },
          { name: 'Dev Patel', side: 'groom', party: 1, tags: ['college'] },
          { name: 'Sarah Chen', side: 'bride', party: 2, tags: ['friends', 'reverse-destination'] },
          { name: 'Aditya Joshi', side: 'groom', party: 1, tags: ['family', 'cousin'] },
        ],
      },
    },
    {
      message: 'Done — everyone is in.',
      expect: {
        replyNot: ['did you finish', 'have you finished', 'are you done yet'],
      },
      verify: async (_state, _h, { reply, prompts }) => {
        const said = `${reply} ${prompts.join(' ')}`;
        return [
          {
            // The whole point of the baseline: it can COUNT what landed.
            label: 'names back what they actually did (5 guests)',
            pass: /\b5\b|five/i.test(said),
            detail: said.slice(0, 180),
          },
          {
            label: 'checks they are happy with it rather than silently moving on',
            pass: /happy|good to (go|move)|shall we|ready to|move on|next/i.test(said),
            detail: said.slice(0, 180),
          },
        ];
      },
    },
    {
      message: "Yes, I'm happy with it.",
      expect: { tools: ['finish_section'] },
      verify: async (_state, _h, { questions }) => {
        // LOOP CLOSE: finishing a section must hand the wheel back with a menu
        // of what's next — not silently slide to the next spine step.
        const menu = questions.find((q) => /anything else|what.*next|help.*with/i.test(q.prompt ?? ''));
        const options = menu?.options ?? [];
        return [
          {
            label: 'closes the loop by asking "anything else?"',
            pass: !!menu,
            detail: `asked: ${questions.map((q) => q.prompt).join(' | ') || 'nothing'}`,
          },
          {
            label: 'the menu lists several things it can help with next',
            pass: options.length >= 3,
            detail: `options: ${options.join(', ') || 'none'}`,
          },
        ];
      },
    },
  ],
};
