/**
 * A brand-new couple gives fuzzy basics ("second weekend of March", city but
 * no venue). The agent must capture everything in one tool call without
 * inventing a venue, and keep the conversation to a few questions at a time.
 */
export default {
  name: 'onboarding-fuzzy-basics',
  description: 'Blank wedding: fuzzy date + city captured correctly, no question wall',
  persona: 'P1', // brand-new, just engaged, nothing set (docs/AGENT-EVALS.md §3)
  seed: 'blank',
  turns: [
    {
      message: "Hi! We just signed up. We're Anaya and Vikram — thinking the second weekend of March 2027, in Goa near Anjuna, but no venue yet.",
      expect: {
        tools: ['update_wedding_details'],
        replyNot: ['admin UI|dashboard.*create'],
      },
      verify: async (state) => {
        const w = state.wedding;
        return [
          {
            label: 'date resolved to the second Saturday of March 2027',
            pass: String(w.wedding_date).startsWith('2027-03-13'),
            detail: String(w.wedding_date),
          },
          {
            label: 'venue location captured',
            pass: /goa/i.test(w.venue_location ?? ''),
            detail: w.venue_location,
          },
          {
            label: 'venue name still TBD (not invented)',
            pass: /tbd/i.test(w.venue_name ?? '') || !w.venue_name,
            detail: w.venue_name,
          },
          { label: 'partner names set', pass: w.partner1_name === 'Anaya' && w.partner2_name === 'Vikram' },
        ];
      },
    },
  ],
};
