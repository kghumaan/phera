/**
 * Chat-first onboarding visibility — the agent-led intake funnel (hero chat
 * box / Get Started → names → stage → city → goals → signup card), mirroring
 * lib/analytics/onboarding.ts which covers the manual wizard.
 *
 * Same two sinks: Vercel Analytics custom events + Sentry breadcrumbs.
 * Same privacy rule: STRUCTURE only — question ids and counts, never the
 * couple's names, venue, or any typed content (DPDPA).
 */
import { track } from '@vercel/analytics';
import * as Sentry from '@sentry/nextjs';

type EventProps = Record<string, string | number | boolean | null>;

function emit(event: string, props?: EventProps) {
  try {
    track(event, props);
  } catch {
    // Analytics must never break the flow.
  }
  Sentry.addBreadcrumb({ category: 'agent-onboarding', message: event, level: 'info', data: props });
}

/** How the visitor entered the chat onboarding. */
export type AgentOnboardingSource = 'hero-message' | 'cold-open' | 'resumed';

export const agentOnboardingAnalytics = {
  /** Chat onboarding began (panel mounted on a fresh draft). */
  started(source: AgentOnboardingSource) {
    emit('agent_onboarding_started', { source });
  },

  /** A question card was answered (ids only — never the answers). */
  questionAnswered(questionIds: string, answeredCount: number) {
    emit('agent_onboarding_answer', { questionIds, answeredCount });
  },

  /** The in-chat signup card was shown to an anonymous visitor. */
  signupCardShown() {
    emit('agent_onboarding_signup_shown');
  },

  /** Anonymous visitor converted to a real account without leaving the chat. */
  signupCompleted(method: 'email' | 'google') {
    emit('agent_onboarding_signup_completed', { method });
  },

  /** Left mid-onboarding (visibility hidden / pagehide, fired once). */
  abandoned(props: { answeredCount: number; signedUp: boolean; secondsOnPage: number }) {
    emit('agent_onboarding_abandoned', { ...props });
  },
};
