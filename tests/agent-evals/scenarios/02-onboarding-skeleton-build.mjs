/**
 * After basics, the couple sketches a 3-day wedding. The agent must build
 * the actual structure (schedule days + ceremony events) with tools, not
 * just acknowledge or redirect to the UI.
 */
export default {
  name: 'onboarding-skeleton-build',
  description: 'Blank wedding: 3-day sketch becomes real schedule days + events',
  seed: 'blank',
  turns: [
    {
      message: 'We are Priya & Dev, wedding March 12-14 2027 in Jaipur. Set the dates please.',
      expect: { tools: ['update_wedding_details'] },
    },
    {
      message: 'Sketch the days for us: mehndi and sangeet on Friday the 12th, the wedding ceremony Saturday the 13th, farewell brunch Sunday the 14th. Set it all up.',
      expect: {
        tools: ['create_schedule_day', 'create_event'],
        replyNot: ['admin UI', "can't create", 'cannot create'],
      },
      verify: async (state) => [
        { label: '3 schedule days created', pass: state.schedule.length === 3, detail: `${state.schedule.length}` },
        {
          label: 'at least 3 ceremony events created',
          pass: state.events.length >= 3,
          detail: state.events.map((e) => e.name).join(', '),
        },
        {
          label: 'events dated within the wedding window',
          pass: state.events.every((e) => ['2027-03-12', '2027-03-13', '2027-03-14'].includes(e.date)),
        },
      ],
    },
  ],
};
