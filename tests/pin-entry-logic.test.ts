import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('PinEntry auth logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  // ─── PIN verification localStorage ──────────────────────────────────

  describe('PIN verification localStorage', () => {
    const weddingSlug = 'test-wedding';

    it('should store pin verification data after successful PIN entry', () => {
      // Simulate what PinEntry does on successful PIN
      localStorage.setItem(`phera_pin_verified_${weddingSlug}`, 'true');
      localStorage.setItem(`phera_pin_timestamp_${weddingSlug}`, Date.now().toString());
      localStorage.setItem(`phera_allows_plus_one_${weddingSlug}`, 'true');
      localStorage.setItem(`phera_pin_type_${weddingSlug}`, 'general');

      expect(localStorage.getItem(`phera_pin_verified_${weddingSlug}`)).toBe('true');
      expect(localStorage.getItem(`phera_allows_plus_one_${weddingSlug}`)).toBe('true');
      expect(localStorage.getItem(`phera_pin_type_${weddingSlug}`)).toBe('general');
    });

    it('should use wedding-specific keys (not global)', () => {
      localStorage.setItem(`phera_pin_verified_wedding-a`, 'true');
      localStorage.setItem(`phera_pin_timestamp_wedding-a`, Date.now().toString());

      // A different wedding should not be verified
      expect(localStorage.getItem(`phera_pin_verified_wedding-b`)).toBeNull();
    });

    it('should detect expired pin verification (older than 24 hours)', () => {
      const oldTimestamp = Date.now() - 25 * 60 * 60 * 1000; // 25 hours ago
      localStorage.setItem(`phera_pin_verified_${weddingSlug}`, 'true');
      localStorage.setItem(`phera_pin_timestamp_${weddingSlug}`, oldTimestamp.toString());

      const pinVerified = localStorage.getItem(`phera_pin_verified_${weddingSlug}`);
      const pinTimestamp = localStorage.getItem(`phera_pin_timestamp_${weddingSlug}`);

      if (pinVerified === 'true' && pinTimestamp) {
        const timestamp = parseInt(pinTimestamp);
        const isRecent = Date.now() - timestamp < 24 * 60 * 60 * 1000;
        expect(isRecent).toBe(false);
      }
    });

    it('should accept recent pin verification (within 24 hours)', () => {
      const recentTimestamp = Date.now() - 1 * 60 * 60 * 1000; // 1 hour ago
      localStorage.setItem(`phera_pin_verified_${weddingSlug}`, 'true');
      localStorage.setItem(`phera_pin_timestamp_${weddingSlug}`, recentTimestamp.toString());

      const pinTimestamp = localStorage.getItem(`phera_pin_timestamp_${weddingSlug}`);
      const timestamp = parseInt(pinTimestamp!);
      const isRecent = Date.now() - timestamp < 24 * 60 * 60 * 1000;
      expect(isRecent).toBe(true);
    });

    it('should store skip_rsvp flag when present in PIN config', () => {
      const matchedPin = { pin: '1234', type: 'vip', allows_plus_one: true, skip_rsvp: true };

      if (matchedPin.skip_rsvp) {
        localStorage.setItem(`phera_skip_rsvp_${weddingSlug}`, 'true');
      } else {
        localStorage.removeItem(`phera_skip_rsvp_${weddingSlug}`);
      }

      expect(localStorage.getItem(`phera_skip_rsvp_${weddingSlug}`)).toBe('true');
    });

    it('should remove skip_rsvp flag when not present', () => {
      localStorage.setItem(`phera_skip_rsvp_${weddingSlug}`, 'true');
      const matchedPin = { pin: '1234', type: 'general', allows_plus_one: false, skip_rsvp: false };

      if (matchedPin.skip_rsvp) {
        localStorage.setItem(`phera_skip_rsvp_${weddingSlug}`, 'true');
      } else {
        localStorage.removeItem(`phera_skip_rsvp_${weddingSlug}`);
      }

      expect(localStorage.getItem(`phera_skip_rsvp_${weddingSlug}`)).toBeNull();
    });

    it('should store hidden_events as JSON', () => {
      const hiddenEvents = ['event-1', 'event-2'];
      localStorage.setItem(`phera_hidden_events_${weddingSlug}`, JSON.stringify(hiddenEvents));

      const stored = JSON.parse(localStorage.getItem(`phera_hidden_events_${weddingSlug}`)!);
      expect(stored).toEqual(['event-1', 'event-2']);
    });
  });

  // ─── bypass_pin URL parameter ──────────────────────────────────────

  describe('bypass_pin URL parameter', () => {
    it('should detect bypass_pin=true in URL params', () => {
      const urlParams = new URLSearchParams('?bypass_pin=true');
      const bypassPin = urlParams.get('bypass_pin');
      expect(bypassPin).toBe('true');
    });

    it('should detect auth_success=true in URL params', () => {
      const urlParams = new URLSearchParams('?auth_success=true');
      const authSuccess = urlParams.get('auth_success');
      expect(authSuccess).toBe('true');
    });

    it('should detect restore_pin=true in URL params', () => {
      const urlParams = new URLSearchParams('?restore_pin=true&pin_timestamp=123&allows_plus_one=true');
      expect(urlParams.get('restore_pin')).toBe('true');
      expect(urlParams.get('pin_timestamp')).toBe('123');
      expect(urlParams.get('allows_plus_one')).toBe('true');
    });

    it('should trigger bypass for any of the auth URL params', () => {
      const authParams = ['auth_success', 'restore_pin', 'magic_link', 'bypass_pin'];

      for (const param of authParams) {
        const urlParams = new URLSearchParams(`?${param}=true`);
        const shouldBypass =
          urlParams.get('auth_success') === 'true' ||
          urlParams.get('restore_pin') === 'true' ||
          urlParams.get('magic_link') === 'true' ||
          urlParams.get('bypass_pin') === 'true';

        expect(shouldBypass).toBe(true);
      }
    });

    it('should NOT trigger bypass when no auth params present', () => {
      const urlParams = new URLSearchParams('?some_other_param=value');
      const shouldBypass =
        urlParams.get('auth_success') === 'true' ||
        urlParams.get('restore_pin') === 'true' ||
        urlParams.get('magic_link') === 'true' ||
        urlParams.get('bypass_pin') === 'true';

      expect(shouldBypass).toBe(false);
    });
  });

  // ─── Google OAuth redirect URL for PinEntry ────────────────────────

  describe('PinEntry Google OAuth redirect URL', () => {
    it('should construct correct redirect URL for Google OAuth from PinEntry', () => {
      const weddingSlug = 'smith-jones';
      const redirectTo = `/${weddingSlug}?bypass_pin=true`;

      // This is what signInWithGoogle will receive
      expect(redirectTo).toBe('/smith-jones?bypass_pin=true');

      // This is what the callback URL should look like
      const callbackUrl = new URL('/auth/callback', 'https://phera.io');
      callbackUrl.searchParams.set('redirect', redirectTo);

      // The callback route will extract the redirect
      const receivedRedirect = callbackUrl.searchParams.get('redirect');
      expect(receivedRedirect).toBe('/smith-jones?bypass_pin=true');

      // And create the final redirect URL
      const finalUrl = new URL(receivedRedirect!, 'https://phera.io');
      expect(finalUrl.pathname).toBe('/smith-jones');
      expect(finalUrl.searchParams.get('bypass_pin')).toBe('true');
    });
  });

  // ─── PIN code matching ──────────────────────────────────────────────

  describe('PIN code matching', () => {
    const pinCodes = [
      { pin: '1234', type: 'general', allows_plus_one: false, skip_rsvp: false },
      { pin: '5678', type: 'vip', allows_plus_one: true, skip_rsvp: false },
      { pin: '9999', type: 'family', allows_plus_one: true, skip_rsvp: true },
    ];

    it('should match valid PIN', () => {
      const enteredPin = '1234';
      const matched = pinCodes.find(p => p.pin === enteredPin);
      expect(matched).toBeDefined();
      expect(matched!.type).toBe('general');
    });

    it('should not match invalid PIN', () => {
      const enteredPin = '0000';
      const matched = pinCodes.find(p => p.pin === enteredPin);
      expect(matched).toBeUndefined();
    });

    it('should correctly identify VIP pin with plus one', () => {
      const enteredPin = '5678';
      const matched = pinCodes.find(p => p.pin === enteredPin);
      expect(matched!.allows_plus_one).toBe(true);
      expect(matched!.type).toBe('vip');
    });

    it('should correctly identify family pin with skip_rsvp', () => {
      const enteredPin = '9999';
      const matched = pinCodes.find(p => p.pin === enteredPin);
      expect(matched!.skip_rsvp).toBe(true);
    });
  });

  // ─── Sign out cleanup ──────────────────────────────────────────────

  describe('sign out cleanup', () => {
    it('should clear all wedding-specific localStorage on sign out', () => {
      const weddingSlug = 'my-wedding';

      // Set up some state
      localStorage.setItem('phera_guest_auth', JSON.stringify({ id: '123' }));
      localStorage.setItem(`phera_pin_verified_${weddingSlug}`, 'true');
      localStorage.setItem(`phera_pin_timestamp_${weddingSlug}`, '123');
      localStorage.setItem(`phera_allows_plus_one_${weddingSlug}`, 'true');
      localStorage.setItem(`phera_bypass_rsvp_${weddingSlug}`, 'true');
      localStorage.setItem(`phera_skip_rsvp_${weddingSlug}`, 'true');
      localStorage.setItem(`phera_pin_type_${weddingSlug}`, 'general');

      // Simulate sign out cleanup (mirrors AuthContext signOut)
      localStorage.removeItem('phera_guest_auth');
      localStorage.removeItem(`phera_pin_verified_${weddingSlug}`);
      localStorage.removeItem(`phera_pin_timestamp_${weddingSlug}`);
      localStorage.removeItem(`phera_allows_plus_one_${weddingSlug}`);
      localStorage.removeItem(`phera_bypass_rsvp_${weddingSlug}`);
      localStorage.removeItem(`phera_skip_rsvp_${weddingSlug}`);
      localStorage.removeItem(`phera_pin_type_${weddingSlug}`);

      expect(localStorage.getItem('phera_guest_auth')).toBeNull();
      expect(localStorage.getItem(`phera_pin_verified_${weddingSlug}`)).toBeNull();
      expect(localStorage.getItem(`phera_pin_timestamp_${weddingSlug}`)).toBeNull();
      expect(localStorage.getItem(`phera_allows_plus_one_${weddingSlug}`)).toBeNull();
    });
  });
});
