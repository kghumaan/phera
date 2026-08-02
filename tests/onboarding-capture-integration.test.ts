/**
 * End-to-end-ish proof that the REAL onboarding page emits behavior events:
 * a logged-in user lands, clicks a role, then leaves — and we capture all of it.
 * Mounts app/onboarding/page.tsx with Supabase auth/avatar/services mocked.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const track = vi.fn();
const addBreadcrumb = vi.fn();
const replayStart = vi.fn();

vi.mock('@vercel/analytics', () => ({ track: (...a: unknown[]) => track(...a) }));
vi.mock('@sentry/nextjs', () => ({
  addBreadcrumb: (...a: unknown[]) => addBreadcrumb(...a),
  getReplay: () => ({ start: replayStart }),
}));

// Supabase: authed user, no existing settings (PGRST116 = no rows).
vi.mock('@/lib/supabase/client', () => {
  const single = vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } });
  const eq = vi.fn(() => ({ single }));
  const select = vi.fn(() => ({ eq }));
  return {
    supabase: {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1', email: 'a@b.com' } } }) },
      from: vi.fn(() => ({ select })),
    },
  };
});

vi.mock('@/lib/supabase/wedding-service', () => ({ weddingService: {} }));
vi.mock('@/lib/utils/avatar-generator', () => ({
  generateGuestAvatar: () => ({ style: 's', seed: 'x', svg: '<svg/>' }),
}));
vi.mock('@/components/ui/OptimizedBackground', () => ({
  default: ({ children }: { children: React.ReactNode }) => React.createElement('div', null, children),
}));
// react-datepicker pulls in browser-only bits; stub it (only used on step 2).
vi.mock('react-datepicker', () => ({ default: () => React.createElement('input', { 'data-testid': 'datepicker' }) }));
vi.mock('react-datepicker/dist/react-datepicker.css', () => ({}));

import OnboardingPage from '@/app/onboarding/page';

beforeEach(() => {
  track.mockClear();
  addBreadcrumb.mockClear();
  replayStart.mockClear();
  Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
});

function eventsNamed(name: string) {
  return track.mock.calls.filter((c) => c[0] === name);
}

describe('onboarding page — real behavior capture', () => {
  it('captures entry, role click, and the user leaving mid-flow', async () => {
    render(React.createElement(OnboardingPage));

    // 1. Entry: started event + forced session replay once auth resolves.
    await waitFor(() => expect(eventsNamed('onboarding_started').length).toBeGreaterThan(0));
    expect(replayStart).toHaveBeenCalled();

    // Step 1 is on screen.
    await waitFor(() => expect(screen.getByText("I'm a Couple")).toBeTruthy());
    expect(eventsNamed('onboarding_step_viewed').some((c) => c[1].step === 1)).toBe(true);

    // 2. User clicks the "couple" role.
    fireEvent.click(screen.getByText("I'm a Couple"));
    expect(track).toHaveBeenCalledWith('onboarding_role_selected', { role: 'couple' });
    expect(track).toHaveBeenCalledWith('onboarding_step_completed', { step: 1, role: 'couple' });

    // Now on step 2.
    await waitFor(() => expect(eventsNamed('onboarding_step_viewed').some((c) => c[1].step === 2)).toBe(true));

    // 3. User leaves (tab hidden) without finishing → abandonment captured on step 2.
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));

    await waitFor(() => expect(eventsNamed('onboarding_abandoned').length).toBe(1));
    const abandon = eventsNamed('onboarding_abandoned')[0][1];
    expect(abandon.step).toBe(2);
    expect(abandon.role).toBe('couple');
  });
});
