import { vi } from 'vitest';

// Chainable query builder mock
export function createQueryBuilder(resolvedData: any = null, resolvedError: any = null) {
  const builder: any = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: resolvedData, error: resolvedError }),
    maybeSingle: vi.fn().mockResolvedValue({ data: resolvedData, error: resolvedError }),
    then: vi.fn((resolve: any) => resolve({ data: resolvedData, error: resolvedError })),
  };
  return builder;
}

// Default mock user
export const mockSupabaseUser = {
  id: 'user-123',
  email: 'test@example.com',
  phone: '+1234567890',
  user_metadata: { full_name: 'Test User' },
};

// Create a full supabase mock
export function createSupabaseMock(overrides: {
  user?: any;
  session?: any;
  fromData?: Record<string, { data: any; error: any }>;
} = {}) {
  const user = overrides.user ?? null;
  const session = overrides.session ?? (user ? { user } : null);
  const fromData = overrides.fromData ?? {};

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user },
        error: null,
      }),
      getSession: vi.fn().mockResolvedValue({
        data: { session },
        error: null,
      }),
      signInWithOAuth: vi.fn().mockResolvedValue({ data: {}, error: null }),
      signInWithOtp: vi.fn().mockResolvedValue({ data: {}, error: null }),
      signUp: vi.fn().mockResolvedValue({
        data: { user, session },
        error: null,
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      verifyOtp: vi.fn().mockResolvedValue({
        data: { user, session },
        error: null,
      }),
      refreshSession: vi.fn().mockResolvedValue({
        data: { session },
        error: null,
      }),
      exchangeCodeForSession: vi.fn().mockResolvedValue({
        data: { session },
        error: null,
      }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: {
          subscription: {
            unsubscribe: vi.fn(),
          },
        },
      }),
    },
    from: vi.fn((table: string) => {
      if (fromData[table]) {
        return createQueryBuilder(fromData[table].data, fromData[table].error);
      }
      return createQueryBuilder();
    }),
  };
}
