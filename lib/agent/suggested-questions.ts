/**
 * Canned "tell me more" prompts a couple can tap instead of typing — shown as
 * pink pills above the composer and behind each option's (i) hint in
 * QuestionFlow. Submitting one runs a normal chat turn (never the fast
 * onboarding-intake model — see INTAKE_QUESTION_IDS in lib/agent/loop.ts), so
 * the answer always comes from the full model with complete feature knowledge.
 */

/** Keyed by the planning_goals / next_step option text, lowercased. */
const OPTION_QUESTIONS: Record<string, string> = {
  'wedding website': 'What can our wedding website include?',
  'save the dates': 'How do save-the-dates work through Phera?',
  'collect rsvps': 'How does RSVP collection work?',
  'guest list': 'How can you help with my guest list?',
  'room assignments': 'How do room assignments work?',
  'transportation & travel': 'How can you help with transportation — DJ, cars, everything?',
  'vendor coordination': 'How can you help me find vendors like a DJ or caterer?',
  registry: 'How does the registry work?',
  'day-of schedule': 'How can you help plan the day-of schedule?',
  'the whole thing': 'What all can you help with, start to finish?',
};

/** Falls back to a generic prompt for any option outside the curated set above. */
export function suggestedQuestionFor(option: string): string {
  return OPTION_QUESTIONS[option.trim().toLowerCase()] ?? `Tell me more about ${option.toLowerCase()}.`;
}

/** General-purpose prompts for the pill row above the composer. */
export const GENERAL_FAQ_PROMPTS = [
  'How can you help with logistics?',
  'How do room assignments work?',
  'How can you handle my guest list?',
  'How can you help with transportation — DJ, cars, everything?',
];
