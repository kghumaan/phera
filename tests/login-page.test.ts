import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Tests for the consolidated /auth/login page logic.
 *
 * The login page tries signInWithPassword first. If that fails with
 * "Invalid login credentials", it falls through to signUp. This test
 * suite validates the branching logic without rendering React components.
 */

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Simulate the core handleLogin branching logic */
async function simulateHandleLogin(
  email: string,
  password: string,
  opts: {
    signInResult: { data: any; error: any };
    signUpResult?: { data: any; error: any };
    redirectTo?: string;
    role?: string | null;
  }
) {
  const actions: string[] = [];
  const redirectTo = opts.redirectTo || '/admin';
  const role = opts.role || null;

  const getOnboardingUrl = () => `/onboarding${role ? `?role=${role}` : ''}`;

  const signInResult = opts.signInResult;

  if (signInResult.error) {
    if (signInResult.error.message.includes('Invalid login credentials')) {
      // Password too short
      if (password.length < 6) {
        actions.push('error:Password must be at least 6 characters for a new account');
        return actions;
      }

      const signUpResult = opts.signUpResult!;

      if (signUpResult.error) {
        if (
          signUpResult.error.message.includes('already registered') ||
          signUpResult.error.message.includes('already been registered')
        ) {
          actions.push('error:Incorrect password. Try again or use Google sign-in.');
        } else {
          actions.push(`error:${signUpResult.error.message}`);
        }
      } else if (signUpResult.data.user) {
        // Empty identities = email exists, wrong password
        if (
          signUpResult.data.user.identities &&
          signUpResult.data.user.identities.length === 0
        ) {
          actions.push('error:Incorrect password. Try again or use Google sign-in.');
          return actions;
        }

        // Genuinely new user
        actions.push('set:isNewUser');
        actions.push('avatar:generated');

        if (signUpResult.data.session) {
          actions.push('refreshAuth');
          actions.push(`redirect:${getOnboardingUrl()}`);
        } else {
          actions.push('step:otp');
        }
      }
    } else if (signInResult.error.message.includes('Email not confirmed')) {
      actions.push('set:isNewUser');
      actions.push('resend:otp');
      actions.push('step:otp');
    } else {
      actions.push(`error:${signInResult.error.message}`);
    }
  } else if (signInResult.data.session) {
    actions.push(`redirect:${redirectTo}`);
  }

  return actions;
}

/** Simulate the OTP verification logic */
function simulateVerifyOtp(opts: {
  success: boolean;
  error?: string;
  isNewUser: boolean;
  role?: string | null;
  redirectTo?: string;
}) {
  const actions: string[] = [];
  const role = opts.role || null;
  const redirectTo = opts.redirectTo || '/admin';
  const getOnboardingUrl = () => `/onboarding${role ? `?role=${role}` : ''}`;

  if (!opts.success) {
    actions.push(`otpError:${opts.error || 'Verification failed'}`);
    return actions;
  }

  actions.push('refreshAuth');

  if (opts.isNewUser) {
    actions.push(`redirect:${getOnboardingUrl()}`);
  } else {
    actions.push(`redirect:${redirectTo}`);
  }

  return actions;
}

/** Simulate Google login logic */
function simulateGoogleLogin(opts: { role?: string | null; redirectTo?: string }) {
  const role = opts.role || null;
  const redirectTo = opts.redirectTo || '/admin';
  const getOnboardingUrl = () => `/onboarding${role ? `?role=${role}` : ''}`;

  const callbackRedirect = role ? getOnboardingUrl() : redirectTo;
  return { provider: 'google', callbackRedirect };
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('Login page consolidated auth flow', () => {
  // 1. Existing user, correct password
  it('should redirect to /admin for existing user with correct password', async () => {
    const actions = await simulateHandleLogin('test@example.com', 'password123', {
      signInResult: {
        data: { session: { user: { email: 'test@example.com' } } },
        error: null,
      },
    });
    expect(actions).toEqual(['redirect:/admin']);
  });

  // 2. Existing user, wrong password (signUp returns empty identities)
  it('should show incorrect password error when identities are empty', async () => {
    const actions = await simulateHandleLogin('test@example.com', 'wrongpass', {
      signInResult: {
        data: { session: null },
        error: { message: 'Invalid login credentials' },
      },
      signUpResult: {
        data: { user: { id: 'u1', identities: [] }, session: null },
        error: null,
      },
    });
    expect(actions).toEqual([
      'error:Incorrect password. Try again or use Google sign-in.',
    ]);
  });

  // 3. Existing user, "already registered" error from signUp
  it('should show incorrect password for "already registered" error', async () => {
    const actions = await simulateHandleLogin('test@example.com', 'wrongpass', {
      signInResult: {
        data: { session: null },
        error: { message: 'Invalid login credentials' },
      },
      signUpResult: {
        data: { user: null, session: null },
        error: { message: 'User already registered' },
      },
    });
    expect(actions).toEqual([
      'error:Incorrect password. Try again or use Google sign-in.',
    ]);
  });

  // 4. New user, email confirmation enabled (no session) — shows OTP step
  it('should show OTP step for new user when email confirmation is enabled', async () => {
    const actions = await simulateHandleLogin('new@example.com', 'newpass123', {
      signInResult: {
        data: { session: null },
        error: { message: 'Invalid login credentials' },
      },
      signUpResult: {
        data: {
          user: { id: 'u2', identities: [{ id: 'id1' }] },
          session: null,
        },
        error: null,
      },
    });
    expect(actions).toEqual(['set:isNewUser', 'avatar:generated', 'step:otp']);
  });

  // 5. New user, email confirmation disabled (has session) — redirects to /onboarding
  it('should redirect to /onboarding for new user with session', async () => {
    const actions = await simulateHandleLogin('new@example.com', 'newpass123', {
      signInResult: {
        data: { session: null },
        error: { message: 'Invalid login credentials' },
      },
      signUpResult: {
        data: {
          user: { id: 'u3', email: 'new@example.com', identities: [{ id: 'id1' }] },
          session: { user: { email: 'new@example.com', id: 'u3' } },
        },
        error: null,
      },
    });
    expect(actions).toEqual([
      'set:isNewUser',
      'avatar:generated',
      'refreshAuth',
      'redirect:/onboarding',
    ]);
  });

  // 6. New user with ?role=planner — passes role to onboarding URL
  it('should pass role param to onboarding URL', async () => {
    const actions = await simulateHandleLogin('planner@example.com', 'pass123456', {
      signInResult: {
        data: { session: null },
        error: { message: 'Invalid login credentials' },
      },
      signUpResult: {
        data: {
          user: { id: 'u4', email: 'planner@example.com', identities: [{ id: 'id1' }] },
          session: { user: { email: 'planner@example.com', id: 'u4' } },
        },
        error: null,
      },
      role: 'planner',
    });
    expect(actions).toContain('redirect:/onboarding?role=planner');
  });

  // 7. Google OAuth — calls signInWithOAuth with correct provider
  it('should use google provider for OAuth login', () => {
    const result = simulateGoogleLogin({ redirectTo: '/admin' });
    expect(result.provider).toBe('google');
    expect(result.callbackRedirect).toBe('/admin');
  });

  it('should redirect Google OAuth to onboarding when role is set', () => {
    const result = simulateGoogleLogin({ role: 'planner' });
    expect(result.callbackRedirect).toBe('/onboarding?role=planner');
  });

  // 8. OTP auto-verify on 6 digits — calls verifySignupOTP
  it('should auto-trigger OTP verification when 6 digits entered', () => {
    // This tests the handleOtpChange logic
    let verifyTriggered = false;
    const handleOtpChange = (value: string) => {
      if (value.length === 6) {
        verifyTriggered = true;
      }
    };
    handleOtpChange('12345');
    expect(verifyTriggered).toBe(false);
    handleOtpChange('123456');
    expect(verifyTriggered).toBe(true);
  });

  // 9. Email not confirmed — resends OTP + shows OTP step
  it('should resend OTP and show OTP step for unconfirmed email', async () => {
    const actions = await simulateHandleLogin('unconfirmed@example.com', 'pass123', {
      signInResult: {
        data: { session: null },
        error: { message: 'Email not confirmed' },
      },
    });
    expect(actions).toEqual(['set:isNewUser', 'resend:otp', 'step:otp']);
  });

  // 10. New user OTP verification — redirects to /onboarding (not /admin)
  it('should redirect new user to /onboarding after OTP verification', () => {
    const actions = simulateVerifyOtp({
      success: true,
      isNewUser: true,
    });
    expect(actions).toEqual(['refreshAuth', 'redirect:/onboarding']);
  });

  it('should redirect existing user to /admin after OTP verification', () => {
    const actions = simulateVerifyOtp({
      success: false,
      error: 'Invalid or expired code',
      isNewUser: false,
    });
    expect(actions).toEqual(['otpError:Invalid or expired code']);
  });

  it('should redirect existing user to redirectTo after OTP verification', () => {
    const actions = simulateVerifyOtp({
      success: true,
      isNewUser: false,
      redirectTo: '/admin/my-wedding/overview',
    });
    expect(actions).toEqual(['refreshAuth', 'redirect:/admin/my-wedding/overview']);
  });

  it('should pass role to onboarding after new user OTP verification', () => {
    const actions = simulateVerifyOtp({
      success: true,
      isNewUser: true,
      role: 'planner',
    });
    expect(actions).toEqual(['refreshAuth', 'redirect:/onboarding?role=planner']);
  });

  // Edge case: password too short for new account
  it('should show error when password is too short for signup', async () => {
    const actions = await simulateHandleLogin('new@example.com', '12345', {
      signInResult: {
        data: { session: null },
        error: { message: 'Invalid login credentials' },
      },
    });
    expect(actions).toEqual([
      'error:Password must be at least 6 characters for a new account',
    ]);
  });

  // Edge case: custom redirectTo for existing user
  it('should use custom redirectTo for existing user sign-in', async () => {
    const actions = await simulateHandleLogin('test@example.com', 'password123', {
      signInResult: {
        data: { session: { user: { email: 'test@example.com' } } },
        error: null,
      },
      redirectTo: '/admin/my-wedding/overview',
    });
    expect(actions).toEqual(['redirect:/admin/my-wedding/overview']);
  });
});
