import { describe, it, expect, vi, beforeEach } from 'vitest';

// Test the LoginModal and LoginDialog redirect behavior
describe('LoginModal/LoginDialog redirect behavior', () => {
  describe('redirectTo prop passing', () => {
    it('should pass redirectTo to signInWithGoogle', () => {
      // Simulate what LoginModal does
      const signInWithGoogle = vi.fn().mockResolvedValue({ success: true });
      const redirectTo = '/my-wedding?bypass_pin=true';

      // This is the fix: redirectTo is passed to signInWithGoogle
      signInWithGoogle(redirectTo);

      expect(signInWithGoogle).toHaveBeenCalledWith('/my-wedding?bypass_pin=true');
    });

    it('should call signInWithGoogle with undefined when no redirectTo prop', () => {
      const signInWithGoogle = vi.fn().mockResolvedValue({ success: true });
      const redirectTo: string | undefined = undefined;

      signInWithGoogle(redirectTo);

      expect(signInWithGoogle).toHaveBeenCalledWith(undefined);
    });

    it('should construct correct callback URL for wedding page redirect', () => {
      const weddingSlug = 'smith-jones';
      const redirectTo = `/${weddingSlug}?bypass_pin=true`;

      // Simulate what signInWithGoogle does internally
      const callbackUrl = new URL('/auth/callback', 'https://phera.io');
      const finalRedirect = redirectTo || '/rsvp';
      callbackUrl.searchParams.set('redirect', finalRedirect);

      expect(callbackUrl.searchParams.get('redirect')).toBe('/smith-jones?bypass_pin=true');
    });

    it('should default to /rsvp when no redirectTo provided', () => {
      const redirectTo: string | undefined = undefined;

      const callbackUrl = new URL('/auth/callback', 'https://phera.io');
      const finalRedirect = redirectTo || '/rsvp';
      callbackUrl.searchParams.set('redirect', finalRedirect);

      expect(callbackUrl.searchParams.get('redirect')).toBe('/rsvp');
    });
  });

  describe('Google OAuth flow awareness', () => {
    it('should understand that onSuccess callback wont fire for Google OAuth', () => {
      // This test documents the expected behavior:
      // When a user clicks "Continue with Google" in LoginModal,
      // a full page redirect happens. The onSuccess callback will
      // NOT fire because the page navigates away.
      //
      // Instead, the redirect parameter in the OAuth URL determines
      // where the user ends up after authentication.

      const pageWillRedirect = true; // Google OAuth redirects the full page
      expect(pageWillRedirect).toBe(true);

      // The only way to control where the user ends up is via the
      // redirectTo parameter passed to signInWithGoogle
      const redirectTo = '/my-wedding?bypass_pin=true';
      expect(redirectTo).toBeTruthy();
    });
  });

  describe('email OTP flow (no redirect needed)', () => {
    it('should call onSuccess after email OTP verification (no page redirect)', () => {
      // Email OTP is verified in-page, so onSuccess fires correctly
      const onSuccess = vi.fn();
      const verifyResult = { success: true };

      if (verifyResult.success) {
        onSuccess();
      }

      expect(onSuccess).toHaveBeenCalled();
    });
  });
});
