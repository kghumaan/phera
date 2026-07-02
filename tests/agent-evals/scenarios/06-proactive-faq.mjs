/**
 * Planner judgment → guest-facing content. Udaipur in January is COOL —
 * the agent must not give generic "India is hot" advice, and a yes should
 * become a real FAQ row.
 */
export default {
  name: 'proactive-faq',
  description: 'Populated wedding: seasonal judgment becomes an FAQ on confirmation',
  persona: 'P9', // reverse-destination — non-Indian guests, first Indian wedding
  seed: 'populated',
  turns: [
    {
      message: 'Lots of our guests have never been to India. Anything weather-wise they should know for the wedding dates?',
      expect: {
        replyNot: ['\\bhot\\b.{0,40}(pack|bring|light)'],
      },
    },
    {
      message: 'Great — add that as an FAQ on the website please.',
      expect: { tools: ['add_faq'] },
      verify: async (state) => [
        {
          label: 'FAQ count grew beyond the seeded 2',
          pass: state.faqs.length >= 3,
          detail: `${state.faqs.length} FAQs`,
        },
      ],
    },
  ],
};
