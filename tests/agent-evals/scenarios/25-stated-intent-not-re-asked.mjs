/**
 * "I ALREADY TOLD YOU WHAT I WANT."
 *
 * Reported from a live session: the couple opened with "Build a website for my
 * wedding", sat through names / stage / venue / dates — and was then asked
 * "What would you like help with?" with a Wedding-website chip to tap. Asking
 * someone to re-state the thing they opened with says you weren't listening.
 *
 * Onboarding may still take the basics. What it may NOT do is ask the goals
 * question when the goal is already on the table.
 */
export default {
  name: 'stated-intent-not-re-asked',
  description: 'Opening message names the goal → agent sets goals from it and never asks "what would you like help with?"',
  persona: 'P1',
  seed: 'fresh-draft',
  turns: [
    {
      message: 'Build a website for my wedding.',
      expect: { questionsNot: ['what would you like help with'] },
    },
    {
      message: 'We are Meera & Kabir, 5 February 2027, venue is booked — Falaknuma Palace, Hyderabad.',
      expect: {
        // It has names, stage, venue, date AND the stated goal — there is
        // nothing left to ask on goals.
        questionsNot: ['what would you like help with', 'help you with'],
        notTools: [],
      },
      verify: async (_state, _h, { toolsSeen, prompts }) => [
        {
          // Cumulative: recording the goal the moment they say it (turn 1) is
          // better than waiting, so don't pin it to a particular turn.
          label: 'records the goal it was given instead of asking for it',
          pass: toolsSeen.includes('set_planning_goals') || toolsSeen.includes('hand_off_to_section'),
          detail: `seen: ${toolsSeen.join(', ') || 'none'}`,
        },
        {
          label: 'never puts a "what would you like help with" card on screen',
          pass: !prompts.some((p) => /what would you like help with/i.test(p)),
          detail: `asked: ${prompts.join(' | ') || 'nothing'}`,
        },
      ],
    },
  ],
};
