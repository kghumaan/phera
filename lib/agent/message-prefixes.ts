/**
 * Sentinel prefixes that tag agent chat messages for special handling.
 * Kept in a leaf module with NO server imports so both the client chat panel
 * and server API routes can import it without pulling in the agent runtime.
 */

/** Marks a hidden "kickoff" message that drives the agent without showing a
 *  user bubble (onboarding opener, post-upload continuation, etc.). */
export const HIDDEN_KICKOFF_PREFIX = '⟦kickoff⟧';
