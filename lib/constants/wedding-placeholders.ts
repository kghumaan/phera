/**
 * Placeholder conventions for draft weddings created before the couple's
 * names are known (agent-first onboarding, planner new-wedding flow).
 * Keep in sync with the draft creation in app/api/agent/onboard/start and
 * lib/stripe/planner-wedding.
 */
export const DRAFT_COUPLE_NAME = 'Your Wedding';

/** True while the wedding still carries a placeholder name — i.e. the couple's
 *  real names haven't been captured yet (agent onboarding step 1). */
export function isDraftCoupleName(name?: string | null): boolean {
  const n = (name ?? '').trim();
  return n === '' || n === DRAFT_COUPLE_NAME || n === 'TBD';
}
