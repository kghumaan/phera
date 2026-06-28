/**
 * Onboarding visibility — funnel + abandonment instrumentation.
 *
 * Two sinks, one call:
 *   1. Vercel Analytics custom events (`track`) — builds the onboarding funnel
 *      (started → role → step 2 → step 3 → completed) and abandonment counts
 *      in the Vercel dashboard.
 *   2. Sentry breadcrumbs — so when an error or session replay is captured, the
 *      user's full onboarding trail is attached for context.
 *
 * Privacy: we deliberately log STRUCTURE, not raw PII. We record whether a
 * venue/date was provided (booleans) and coarse buckets, never the couple's
 * names, exact venue, or contact details. Keep it that way (DPDPA).
 */
import { track } from '@vercel/analytics';
import * as Sentry from '@sentry/nextjs';

export type OnboardingRole = 'couple' | 'planner';

// Vercel's `track` only accepts string | number | boolean | null values.
type EventProps = Record<string, string | number | boolean | null>;

function emit(event: string, props?: EventProps) {
  try {
    track(event, props);
  } catch {
    // Analytics must never break the flow.
  }
  Sentry.addBreadcrumb({
    category: 'onboarding',
    message: event,
    level: 'info',
    data: props,
  });
}

export const onboardingAnalytics = {
  /** Fired once when the wizard mounts for an authenticated user. */
  started(props?: { role: OnboardingRole | null; startStep: number }) {
    emit('onboarding_started', {
      role: props?.role ?? 'unknown',
      startStep: props?.startStep ?? 1,
    });
  },

  /** Fired whenever a step becomes visible. */
  stepViewed(step: number, role: OnboardingRole | null) {
    emit('onboarding_step_viewed', { step, role: role ?? 'unknown' });
  },

  /** User picked couple vs. planner on step 1. */
  roleSelected(role: OnboardingRole) {
    emit('onboarding_role_selected', { role });
  },

  /** User advanced past a step via the Continue button. */
  stepCompleted(step: number, role: OnboardingRole | null) {
    emit('onboarding_step_completed', { step, role: role ?? 'unknown' });
  },

  /** Onboarding finished successfully (wedding/planner record created). */
  completed(props: {
    role: OnboardingRole;
    goalCount: number;
    hasVenue: boolean;
    hasDate: boolean;
    plan: 'basic' | 'pro';
  }) {
    emit('onboarding_completed', { ...props });
  },

  /**
   * User left mid-flow without finishing. Fired from a page-lifecycle handler
   * (visibilitychange / pagehide), so it must survive an unloading page —
   * `track` is fire-and-forget and these lifecycle events flush reliably.
   */
  abandoned(props: {
    step: number;
    role: OnboardingRole | null;
    secondsOnPage: number;
    hadInput: boolean;
  }) {
    emit('onboarding_abandoned', {
      step: props.step,
      role: props.role ?? 'unknown',
      secondsOnPage: props.secondsOnPage,
      hadInput: props.hadInput,
    });
  },

  /**
   * Force a Sentry Session Replay for this (high-intent) session. Safe to call
   * repeatedly — it no-ops if replay isn't configured or is already recording.
   */
  startSessionReplay() {
    try {
      const replay = Sentry.getReplay();
      replay?.start();
    } catch {
      // Already recording, or replay integration not loaded — ignore.
    }
  },
};
