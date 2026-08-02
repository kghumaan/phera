/**
 * THE FULL WEBSITE JOURNEY — the one production UAT (2026-07-14) proved we had
 * never tested end to end, because most of it did not exist:
 *
 *   ask for a website → handed off with a BUTTON (not a pasted link)
 *   → they go and fill the details in the real UI  [the `patch` step]
 *   → they come back → the agent SEES what changed and names it, instead of
 *     asking "did you finish?"
 *   → it offers to publish → publish is GATED, so the couple presses the button
 *   → the site goes LIVE and the link comes back to them
 *   → then the offer: hand us the guest list and we'll get the invite out.
 */
export default {
  name: 'website-full-journey',
  description: 'Website: handoff button → detect the work → publish (gated) → live link → guest-list offer',
  persona: 'P2',
  seed: 'blank', // nothing filled in — so the website genuinely needs doing
  turns: [
    {
      // Onboarding comes first on a blank wedding — the agent takes the basics
      // before it starts routing work. That's correct, so let it.
      message: 'We are Anjali & Rohan, getting married 12 December 2027 in Jaipur. We want a wedding website.',
      expect: { tools: ['update_wedding_details'] },
    },
    {
      message: 'The website is the only thing I care about right now. Sort it.',
      expect: {
        // Detailed website work belongs in the real UI: a BUTTON, never a link.
        // Cumulative — handing off the moment they SAY "website" (turn 1) is
        // better than waiting to be told twice, so don't pin it to this turn.
        toolsSeen: ['hand_off_to_section'],
        eventsSeen: ['section_handoff'],
      },
    },
    {
      // They go to the Website section and actually fill it in. This is the
      // real-world event the agent has to notice — the DB changing while it
      // wasn't looking.
      patch: {
        venue_name: 'Rambagh Palace',
        venue_location: 'Jaipur, India',
        welcome_text: "We're so happy you're celebrating with us in Jaipur.",
      },
    },
    {
      message: "Right, I've filled it all in.",
      expect: {
        // It can SEE the details landed — interrogating them is the failure mode.
        replyNot: ['did you finish', 'have you finished', 'are you done yet'],
      },
      verify: async (_state, _h, { reply, prompts }) => {
        // The offer can arrive as prose OR as a question card — both are it
        // asking. What must NOT happen is it noticing and then saying nothing.
        const said = `${reply} ${prompts.join(' ')}`;
        return [
          {
            label: 'offers to take the site live now that the details are in',
            pass: /publish|go live|(put|take|push).{0,24}live|make it (public|live)/i.test(said),
            detail: said.slice(0, 200),
          },
        ];
      },
    },
    {
      message: 'Yes, take it live.',
      // Publishing is outward-facing — it must PARK a confirmation, never fire.
      expect: { tools: ['publish_website'], pending: true },
    },
    {
      // Approving is what publishes — so the live-link card AND the guest-invite
      // offer fire HERE, on the acknowledgment turn.
      confirm: 'approve',
      expect: { events: ['website_published'] },
      verify: async (state, _h, { reply, prompts }) => {
        const said = `${reply} ${prompts.join(' ')}`;
        return [
          {
            label: 'the wedding is actually LIVE in the database',
            pass: state.wedding?.status === 'live',
            detail: `status=${state.wedding?.status} · said: ${reply.slice(0, 160)}`,
          },
          {
            // Empty guest list → the payoff is offering to get the invite out.
            label: 'offers to get the invite out to their guests',
            pass: /whatsapp|invite|guest list|send/i.test(said),
            detail: said.slice(0, 200),
          },
        ];
      },
    },
    {
      message: 'Lovely. What now?',
      verify: async (_state, _h, { questions }) => {
        // Website loop is done → hand the wheel back with the full menu.
        const menu = questions.find((q) => /anything else|what.*next|help.*with/i.test(q.prompt ?? ''));
        return [
          {
            label: 'closes the loop with an "anything else?" menu',
            pass: !!menu && (menu.options?.length ?? 0) >= 3,
            detail: menu ? `options: ${(menu.options ?? []).join(', ')}` : `asked: ${questions.map((q) => q.prompt).join(' | ') || 'nothing'}`,
          },
        ];
      },
    },
  ],
};
