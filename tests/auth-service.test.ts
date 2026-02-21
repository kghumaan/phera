import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockSupabaseUser } from './mocks/supabase';

// Use vi.hoisted so the mock is available when vi.mock factory runs (hoisted above imports)
const { mockSupabase } = vi.hoisted(() => {
  const mockSupabase = {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      signInWithOAuth: vi.fn().mockResolvedValue({ data: {}, error: null }),
      signInWithOtp: vi.fn().mockResolvedValue({ data: {}, error: null }),
      signUp: vi.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      verifyOtp: vi.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
      refreshSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  };
  return { mockSupabase };
});

vi.mock('@/lib/supabase/client', () => ({
  supabase: mockSupabase,
}));

// Now import the functions under test
import {
  signInWithGoogle,
  getCurrentUser,
  validateEmailExists,
  sendEmailOTP,
  verifyEmailOTP,
  signOut,
} from '@/lib/supabase/auth-service';

describe('auth-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset default mock behavior
    mockSupabase.auth.signInWithOAuth.mockResolvedValue({ data: {}, error: null });
    mockSupabase.auth.signOut.mockResolvedValue({ error: null });
    // Reset window.location for each test
    Object.defineProperty(window, 'location', {
      value: {
        origin: 'https://phera.io',
        pathname: '/',
        search: '',
        href: 'https://phera.io/',
      },
      writable: true,
    });
  });

  // ─── signInWithGoogle ───────────────────────────────────────────────

  describe('signInWithGoogle', () => {
    it('should call signInWithOAuth with google provider', async () => {
      const result = await signInWithGoogle();
      expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: 'google',
        })
      );
      expect(result.success).toBe(true);
    });

    it('should default redirectTo to /rsvp when none provided', async () => {
      await signInWithGoogle();
      const callArgs = mockSupabase.auth.signInWithOAuth.mock.calls[0][0];
      const redirectUrl = new URL(callArgs.options.redirectTo);
      expect(redirectUrl.searchParams.get('redirect')).toBe('/rsvp');
    });

    it('should use custom redirectTo when provided', async () => {
      await signInWithGoogle('/my-wedding?bypass_pin=true');
      const callArgs = mockSupabase.auth.signInWithOAuth.mock.calls[0][0];
      const redirectUrl = new URL(callArgs.options.redirectTo);
      expect(redirectUrl.searchParams.get('redirect')).toBe('/my-wedding?bypass_pin=true');
    });

    it('should include /auth/callback in the redirect URL', async () => {
      await signInWithGoogle('/some-page');
      const callArgs = mockSupabase.auth.signInWithOAuth.mock.calls[0][0];
      const redirectUrl = new URL(callArgs.options.redirectTo);
      expect(redirectUrl.pathname).toBe('/auth/callback');
    });

    it('should return error when OAuth fails', async () => {
      mockSupabase.auth.signInWithOAuth.mockResolvedValueOnce({
        data: null,
        error: new Error('OAuth failed'),
      });
      const result = await signInWithGoogle();
      expect(result.success).toBe(false);
      expect(result.error).toBe('OAuth failed');
    });
  });

  // ─── getCurrentUser ─────────────────────────────────────────────────

  describe('getCurrentUser', () => {
    it('should return error when no session exists', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: null,
      });
      const result = await getCurrentUser();
      expect(result.success).toBe(false);
      expect(result.error).toBe('No user session found');
    });

    it('should return basic user data when no weddingSlug provided', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: mockSupabaseUser },
        error: null,
      });
      const result = await getCurrentUser();
      expect(result.success).toBe(true);
      expect(result.user?.id).toBe('user-123');
      expect(result.user?.email).toBe('test@example.com');
      expect(result.user?.name).toBe('Test User');
    });

    it('should NOT query guests table when no weddingSlug provided', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: mockSupabaseUser },
        error: null,
      });
      await getCurrentUser();
      // from() should not be called since no slug was provided
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('should query guests table with weddingSlug when provided', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: mockSupabaseUser },
        error: null,
      });

      // Mock the guests query chain
      const guestQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'guest-456',
            name: 'Wedding Guest',
            email: 'test@example.com',
            phone: '+1234567890',
            avatar_style: 'shapes',
            avatar_seed: 'test-seed',
            avatar_svg: '<svg>test</svg>',
          },
          error: null,
        }),
      };
      mockSupabase.from.mockReturnValueOnce(guestQueryBuilder);

      const result = await getCurrentUser('my-wedding');
      expect(mockSupabase.from).toHaveBeenCalledWith('guests');
      expect(guestQueryBuilder.eq).toHaveBeenCalledWith('wedding_id', 'my-wedding');
      expect(result.user?.name).toBe('Wedding Guest');
      expect(result.user?.avatar_svg).toBe('<svg>test</svg>');
    });

    it('should NOT use hardcoded simran-karanvir wedding ID', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: mockSupabaseUser },
        error: null,
      });

      const guestQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
      };
      mockSupabase.from.mockReturnValue(guestQueryBuilder);

      await getCurrentUser('some-wedding');

      // Verify no call uses 'simran-karanvir'
      for (const call of guestQueryBuilder.eq.mock.calls) {
        expect(call[1]).not.toBe('simran-karanvir');
      }
    });

    it('should check plus-one rsvps when guest not found', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: mockSupabaseUser },
        error: null,
      });

      // First call (guests) returns nothing
      const guestQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
      };

      // Second call (rsvps) returns plus-one data
      const rsvpQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'rsvp-1',
            plus_one_name: 'Plus One Guest',
            plus_one_email: 'test@example.com',
            guest_id: 'main-guest-id',
          },
          error: null,
        }),
      };

      mockSupabase.from
        .mockReturnValueOnce(guestQueryBuilder) // guests query
        .mockReturnValueOnce(rsvpQueryBuilder); // rsvps query

      const result = await getCurrentUser('my-wedding');
      expect(result.success).toBe(true);
      expect(result.user?.name).toBe('Plus One Guest');
    });
  });

  // ─── validateEmailExists ───────────────────────────────────────────

  describe('validateEmailExists', () => {
    it('should return exists:true when no weddingSlug (skip validation)', async () => {
      const result = await validateEmailExists('test@example.com');
      expect(result.exists).toBe(true);
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('should query guests table with weddingSlug', async () => {
      const queryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'guest-1', name: 'Found Guest', email: 'test@example.com' },
          error: null,
        }),
      };
      mockSupabase.from.mockReturnValue(queryBuilder);

      const result = await validateEmailExists('test@example.com', 'my-wedding');
      expect(result.exists).toBe(true);
      expect(result.isPlusOne).toBe(false);
      expect(queryBuilder.eq).toHaveBeenCalledWith('wedding_id', 'my-wedding');
    });

    it('should NOT use hardcoded wedding ID', async () => {
      const queryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
      };
      mockSupabase.from.mockReturnValue(queryBuilder);

      await validateEmailExists('test@example.com', 'dynamic-wedding');

      for (const call of queryBuilder.eq.mock.calls) {
        expect(call[1]).not.toBe('simran-karanvir');
      }
    });

    it('should check plus-one email if main guest not found', async () => {
      const guestQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
      };
      const rsvpQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'rsvp-1',
            plus_one_name: 'Plus One',
            plus_one_email: 'plusone@example.com',
            guest_id: 'main-guest',
            guests: { id: 'main-guest', name: 'Main', email: 'main@example.com' },
          },
          error: null,
        }),
      };

      mockSupabase.from
        .mockReturnValueOnce(guestQueryBuilder)
        .mockReturnValueOnce(rsvpQueryBuilder);

      const result = await validateEmailExists('plusone@example.com', 'my-wedding');
      expect(result.exists).toBe(true);
      expect(result.isPlusOne).toBe(true);
    });

    it('should return exists:false when email not found anywhere', async () => {
      const queryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
      };
      mockSupabase.from.mockReturnValue(queryBuilder);

      const result = await validateEmailExists('unknown@example.com', 'my-wedding');
      expect(result.exists).toBe(false);
    });

    it('should normalize email to lowercase', async () => {
      const queryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'g1', name: 'Test', email: 'test@example.com' },
          error: null,
        }),
      };
      mockSupabase.from.mockReturnValue(queryBuilder);

      await validateEmailExists('  Test@Example.COM  ', 'my-wedding');
      expect(queryBuilder.eq).toHaveBeenCalledWith('email', 'test@example.com');
    });
  });

  // ─── signOut ────────────────────────────────────────────────────────

  describe('signOut', () => {
    it('should call supabase signOut', async () => {
      await signOut();
      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    });
  });

  // ─── verifyEmailOTP ─────────────────────────────────────────────────

  describe('verifyEmailOTP', () => {
    it('should verify email OTP successfully', async () => {
      mockSupabase.auth.verifyOtp.mockResolvedValueOnce({
        data: { user: mockSupabaseUser, session: { user: mockSupabaseUser } },
        error: null,
      });

      const result = await verifyEmailOTP('test@example.com', '123456');
      expect(result.success).toBe(true);
      expect(mockSupabase.auth.verifyOtp).toHaveBeenCalledWith({
        email: 'test@example.com',
        token: '123456',
        type: 'email',
      });
    });

    it('should return error for invalid OTP', async () => {
      mockSupabase.auth.verifyOtp.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: 'Invalid OTP' },
      });

      const result = await verifyEmailOTP('test@example.com', '000000');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid');
    });

    it('should trim email and token', async () => {
      mockSupabase.auth.verifyOtp.mockResolvedValueOnce({
        data: { user: mockSupabaseUser, session: { user: mockSupabaseUser } },
        error: null,
      });

      await verifyEmailOTP('  test@example.com  ', '  123456  ');
      expect(mockSupabase.auth.verifyOtp).toHaveBeenCalledWith({
        email: 'test@example.com',
        token: '123456',
        type: 'email',
      });
    });
  });
});
