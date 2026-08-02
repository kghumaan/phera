import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

const track = vi.fn();
const addBreadcrumb = vi.fn();
const replayStart = vi.fn();
const getReplay = vi.fn(() => ({ start: replayStart }));

vi.mock('@vercel/analytics', () => ({ track: (...a: unknown[]) => track(...a) }));
vi.mock('@sentry/nextjs', () => ({
  addBreadcrumb: (...a: unknown[]) => addBreadcrumb(...a),
  getReplay: () => getReplay(),
}));

import { onboardingAnalytics } from '@/lib/analytics/onboarding';
import { useOnboardingExitTracking } from '@/lib/analytics/useOnboardingExitTracking';

beforeEach(() => {
  track.mockClear();
  addBreadcrumb.mockClear();
  replayStart.mockClear();
});

function setVisibility(state: 'visible' | 'hidden') {
  Object.defineProperty(document, 'visibilityState', { value: state, configurable: true });
}

describe('onboardingAnalytics', () => {
  it('fans every event out to both Vercel track and a Sentry breadcrumb', () => {
    onboardingAnalytics.roleSelected('couple');
    expect(track).toHaveBeenCalledWith('onboarding_role_selected', { role: 'couple' });
    expect(addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'onboarding', message: 'onboarding_role_selected' }),
    );
  });

  it('falls back to "unknown" role when none is set', () => {
    onboardingAnalytics.stepViewed(2, null);
    expect(track).toHaveBeenCalledWith('onboarding_step_viewed', { step: 2, role: 'unknown' });
  });

  it('emits completion with structured (non-PII) properties', () => {
    onboardingAnalytics.completed({
      role: 'couple', goalCount: 3, hasVenue: true, hasDate: false, plan: 'basic',
    });
    expect(track).toHaveBeenCalledWith('onboarding_completed', {
      role: 'couple', goalCount: 3, hasVenue: true, hasDate: false, plan: 'basic',
    });
  });

  it('starts a Sentry session replay when one is available', () => {
    onboardingAnalytics.startSessionReplay();
    expect(replayStart).toHaveBeenCalledTimes(1);
  });

  it('never throws if the analytics sink errors', () => {
    track.mockImplementationOnce(() => { throw new Error('boom'); });
    expect(() => onboardingAnalytics.started()).not.toThrow();
  });
});

describe('useOnboardingExitTracking', () => {
  it('emits onboarding_abandoned with the current step when the tab is hidden', () => {
    setVisibility('visible');
    renderHook(() =>
      useOnboardingExitTracking(() => ({ step: 2, role: 'couple', completed: false, hadInput: true })),
    );

    setVisibility('hidden');
    document.dispatchEvent(new Event('visibilitychange'));

    expect(track).toHaveBeenCalledWith(
      'onboarding_abandoned',
      expect.objectContaining({ step: 2, role: 'couple', hadInput: true }),
    );
  });

  it('fires at most once even across multiple hide events', () => {
    setVisibility('visible');
    renderHook(() =>
      useOnboardingExitTracking(() => ({ step: 1, role: null, completed: false, hadInput: false })),
    );

    setVisibility('hidden');
    document.dispatchEvent(new Event('visibilitychange'));
    document.dispatchEvent(new Event('visibilitychange'));
    window.dispatchEvent(new Event('pagehide'));

    const abandons = track.mock.calls.filter((c) => c[0] === 'onboarding_abandoned');
    expect(abandons).toHaveLength(1);
  });

  it('does NOT fire when the flow has completed', () => {
    setVisibility('visible');
    renderHook(() =>
      useOnboardingExitTracking(() => ({ step: 3, role: 'couple', completed: true, hadInput: true })),
    );

    setVisibility('hidden');
    document.dispatchEvent(new Event('visibilitychange'));

    const abandons = track.mock.calls.filter((c) => c[0] === 'onboarding_abandoned');
    expect(abandons).toHaveLength(0);
  });
});
