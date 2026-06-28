import { useEffect, useRef } from 'react';
import { onboardingAnalytics, type OnboardingRole } from './onboarding';

interface ExitState {
  step: number;
  role: OnboardingRole | null;
  /** True once the wizard has finished successfully — suppresses the exit event. */
  completed: boolean;
  /** True if the user has typed/selected anything (so we can tell idle bounces from real attempts). */
  hadInput: boolean;
}

/**
 * Detects when a user leaves the onboarding flow without finishing and emits an
 * `onboarding_abandoned` event with the step they bailed on.
 *
 * We listen on `visibilitychange → hidden` (the one page-lifecycle event that
 * fires reliably across desktop and mobile, including iOS Safari where
 * `beforeunload`/`unload` often don't) plus `pagehide` as a belt-and-braces
 * backstop. We fire at most once per mount.
 *
 * Caveat: a `hidden` transition also happens on a tab switch, so a user who
 * tabs away and returns is counted as a bounce. The structured funnel events
 * (`onboarding_step_completed`) remain the source of truth for drop-off; this
 * abandonment signal is the supplementary "where were they when they left."
 *
 * @param getState A getter returning the *current* flow state. Pass a fresh
 *   closure each render so the handler reads up-to-date values at exit time.
 */
export function useOnboardingExitTracking(getState: () => ExitState) {
  const firedRef = useRef(false);
  const mountedAtRef = useRef(Date.now());
  const getStateRef = useRef(getState);
  getStateRef.current = getState;

  useEffect(() => {
    const handleExit = () => {
      if (firedRef.current) return;
      const { step, role, completed, hadInput } = getStateRef.current();
      if (completed) return;
      firedRef.current = true;
      const secondsOnPage = Math.round((Date.now() - mountedAtRef.current) / 1000);
      onboardingAnalytics.abandoned({ step, role, secondsOnPage, hadInput });
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') handleExit();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pagehide', handleExit);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pagehide', handleExit);
    };
  }, []);
}
