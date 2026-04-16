import { describe, it, expect, vi, beforeEach } from 'vitest';

// We can't easily test Next.js route handlers in unit tests without a lot of setup,
// so we test the logic patterns used in the callback route.
// The auth callback route is at app/auth/callback/route.ts

describe('auth callback route logic', () => {
  describe('redirect parameter handling', () => {
    it('should parse redirect param from URL', () => {
      const url = new URL('https://phera.io/auth/callback?code=abc&redirect=/my-wedding%3Fbypass_pin%3Dtrue');
      const redirectParam = url.searchParams.get('redirect');
      expect(redirectParam).toBe('/my-wedding?bypass_pin=true');
    });

    it('should handle redirect to wedding with bypass_pin', () => {
      const redirectParam = '/my-wedding?bypass_pin=true';
      const redirectUrl = new URL(redirectParam, 'https://phera.io');
      expect(redirectUrl.pathname).toBe('/my-wedding');
      expect(redirectUrl.searchParams.get('bypass_pin')).toBe('true');
    });

    it('should handle redirect to admin routes', () => {
      const redirectParam = '/admin/my-wedding/overview';
      const redirectUrl = new URL(redirectParam, 'https://phera.io');
      expect(redirectUrl.pathname).toBe('/admin/my-wedding/overview');
      expect(redirectUrl.pathname.startsWith('/admin')).toBe(true);
    });

    it('should handle redirect to root', () => {
      const redirectParam = '/';
      const redirectUrl = new URL(redirectParam, 'https://phera.io');
      expect(redirectUrl.pathname).toBe('/');
    });

    it('should preserve pin verification state when redirecting to root', () => {
      const redirectUrl = new URL('/', 'https://phera.io');
      const pinVerified = 'true';
      const pinTimestamp = '1234567890';
      const allowsPlusOne = 'true';

      if (pinVerified === 'true' && pinTimestamp && redirectUrl.pathname === '/') {
        redirectUrl.searchParams.set('restore_pin', 'true');
        redirectUrl.searchParams.set('pin_timestamp', pinTimestamp);
        redirectUrl.searchParams.set('allows_plus_one', allowsPlusOne);
      }

      expect(redirectUrl.searchParams.get('restore_pin')).toBe('true');
      expect(redirectUrl.searchParams.get('pin_timestamp')).toBe('1234567890');
    });

    it('should NOT add pin params when redirecting to non-root', () => {
      const redirectUrl = new URL('/my-wedding', 'https://phera.io');
      const pinVerified = 'true';
      const pinTimestamp = '1234567890';

      // This mirrors the actual route logic
      if (pinVerified === 'true' && pinTimestamp && redirectUrl.pathname === '/') {
        redirectUrl.searchParams.set('restore_pin', 'true');
      }

      expect(redirectUrl.searchParams.has('restore_pin')).toBe(false);
    });
  });

  describe('onboarding redirect logic', () => {
    it('should redirect to onboarding when not completed and targeting admin', () => {
      const onboardingCompleted = false;
      const redirectParam = '/admin/my-wedding/overview';

      let finalRedirect: string;
      if (redirectParam.startsWith('/admin') && !onboardingCompleted) {
        finalRedirect = '/onboarding';
      } else {
        finalRedirect = redirectParam;
      }

      expect(finalRedirect).toBe('/onboarding');
    });

    it('should allow admin redirect when onboarding completed', () => {
      const onboardingCompleted = true;
      const redirectParam = '/admin/my-wedding/overview';

      let finalRedirect: string;
      if (redirectParam.startsWith('/admin') && !onboardingCompleted) {
        finalRedirect = '/onboarding';
      } else {
        finalRedirect = redirectParam;
      }

      expect(finalRedirect).toBe('/admin/my-wedding/overview');
    });

    it('should default to onboarding when no redirect and onboarding not done', () => {
      const onboardingCompleted = false;
      const redirectParam = null;
      const nextParam = null;

      let finalRedirect: string;
      if (redirectParam) {
        finalRedirect = redirectParam;
      } else if (nextParam) {
        finalRedirect = nextParam;
      } else if (!onboardingCompleted) {
        finalRedirect = '/onboarding';
      } else {
        finalRedirect = '/admin';
      }

      expect(finalRedirect).toBe('/onboarding');
    });
  });

  describe('Google OAuth callback URL construction', () => {
    it('should build callback URL with redirect parameter', () => {
      const callbackUrl = new URL('/auth/callback', 'https://phera.io');
      const finalRedirect = '/my-wedding?bypass_pin=true';
      callbackUrl.searchParams.set('redirect', finalRedirect);

      expect(callbackUrl.toString()).toBe(
        'https://phera.io/auth/callback?redirect=%2Fmy-wedding%3Fbypass_pin%3Dtrue'
      );
    });

    it('should correctly round-trip the redirect parameter', () => {
      // Simulate what signInWithGoogle does
      const callbackUrl = new URL('/auth/callback', 'https://phera.io');
      callbackUrl.searchParams.set('redirect', '/test-wedding?bypass_pin=true');

      // Simulate what the callback route does
      const received = new URL(callbackUrl.toString());
      const redirectParam = received.searchParams.get('redirect');

      expect(redirectParam).toBe('/test-wedding?bypass_pin=true');
    });
  });
});
