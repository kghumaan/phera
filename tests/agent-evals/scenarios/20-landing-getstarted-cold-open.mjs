/**
 * LANDING (Get Started button, anonymous): cold open. The client renders a
 * scripted greeting + names card locally (no model call), and the FIRST
 * server turn is the answers-note carrying the names. The agent must pick up
 * from onboarding step 2 (stage question), never repeat the greeting or the
 * names question, and persist the names it was handed.
 */
// Mirrors AgentChatPanel.resolveAnswers' local-branch note verbatim (updated
// 2026-07-13 to instruct eager name persistence — the fix for the "names not
// written until turn 9" UAT finding).
const ANSWERS_NOTE =
  '⟦answers⟧ The user responded to the onboarding questions:\n- Your names → Simran & Arjun\n' +
  'FIRST record their names with update_wedding_details (couple_name plus partner1_name/partner2_name) — ' +
  'the wedding still carries the draft placeholder until you do. Then, if that answers the question, ' +
  'acknowledge them warmly by name and continue your onboarding ' +
  'sequence from step 2 — the greeting and names question already happened; never repeat them. ' +
  'If it is actually a request or question instead, handle THAT first, then weave the onboarding back in naturally.';

export default {
  name: 'landing-getstarted-cold-open',
  description: 'Anon Get Started: answers-note first turn — continue at step 2, names persisted, no re-greet',
  persona: 'L5', // Get Started cold open (docs/AGENT-EVALS.md §3b)
  seed: 'fresh-draft',
  anonymous: true,
  turns: [
    {
      message: ANSWERS_NOTE,
      expect: {
        // Was red before 2026-07-13: the old answers-note never told the agent
        // to record the names, so the wedding stayed 'Your Wedding' until some
        // later update_wedding_details happened to run. The note now instructs
        // eager persistence — this asserts it holds.
        tools: ['update_wedding_details'],
        questions: ['planning process|where are you'], // onboarding step 2: the stage question
        questionsNot: ['your names|who.s getting married'],
        replyNot: ['congratulations on your engagement'], // the local card already greeted them
      },
      verify: async (state) => [
        {
          label: 'names persisted from the answers-note',
          pass: state.wedding.partner1_name === 'Simran' || /simran/i.test(state.wedding.couple_name ?? ''),
          detail: `couple_name="${state.wedding.couple_name}" partners="${state.wedding.partner1_name} & ${state.wedding.partner2_name}"`,
        },
      ],
    },
    {
      answer: { stage: ['Just getting started'] },
      expect: {
        // "Just getting started" branch: city/region next (the model sometimes
        // jumps to goals first — tolerated); NEVER a venue name.
        questions: ['city|region|where|destination|help with'],
        questionsNot: ['venue name|which venue'],
      },
    },
  ],
};
