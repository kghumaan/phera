/**
 * The Working-on bar loop (PLANNER-SPINE-TRACKER A2/A3): declaring a topic
 * sets the persisted focus; a RETURNING couple (new conversation, same
 * wedding) is greeted with where they left off — never a spine restart;
 * confirming completion advances the focus to the next spine step.
 */
export default {
  name: 'working-on-resume',
  description: 'Populated wedding: focus persists, resumes on return, advances on completion',
  persona: 'P3', // mid-planning couple who leaves and comes back
  seed: 'populated',
  turns: [
    {
      message: "Let's work on the guest list next.",
      expect: {
        tools: ['set_current_focus'],
      },
    },
    {
      // They left and came back — brand-new conversation, same wedding.
      newConversation: true,
      message: "Hi, I'm back!",
      expect: {
        reply: ['guest list'],
        // The reopening should check in on the focused step, not restart onboarding.
        replyNot: ['what would you like help with|where are you in (the )?planning'],
      },
    },
    {
      message: "The guest list is fully handled — everyone's in. Let's move on.",
      expect: {
        tools: ['complete_focus_step'],
        reply: ['rsvp'], // next spine step after guest-list
      },
    },
  ],
};
