import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mocks ───────────────────────────────────────────────────────────

const mockGetAuthenticatedClient = vi.fn();
const mockVerifyWeddingAccess = vi.fn();

vi.mock('@/lib/utils/auth-helpers', () => ({
  getAuthenticatedClient: () => mockGetAuthenticatedClient(),
}));

vi.mock('@/lib/utils/verify-wedding-access', () => ({
  verifyWeddingAccess: (...args: any[]) => mockVerifyWeddingAccess(...args),
}));

function createChain(data: any = null, error: any = null) {
  const c: any = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
    then: vi.fn((resolve: any) => resolve({ data, error })),
  };
  return c;
}

// ─── Import after mocks ──────────────────────────────────────────────

import { GET, POST, PUT, DELETE } from '@/app/api/concierge/knowledge/route';

// ─── Helpers ─────────────────────────────────────────────────────────

function createGetRequest(params: Record<string, string>) {
  const url = new URL('http://localhost/api/concierge/knowledge');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return { nextUrl: url } as any;
}

function createBodyRequest(body: any) {
  return { json: () => Promise.resolve(body) } as any;
}

function createDeleteRequest(params: Record<string, string>) {
  return createGetRequest(params);
}

function mockAuth(hasAccess = true) {
  const mockSupabase = { from: vi.fn().mockReturnValue(createChain()) };
  mockGetAuthenticatedClient.mockResolvedValue({
    supabase: mockSupabase,
    user: { id: 'user-123' },
  });
  mockVerifyWeddingAccess.mockResolvedValue(hasAccess);
  return mockSupabase;
}

// ─── Tests ───────────────────────────────────────────────────────────

describe('/api/concierge/knowledge CRUD', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ══════════════════════════════════════════════════════════════════
  // SHARED AUTH TESTS
  // ══════════════════════════════════════════════════════════════════

  describe('authentication', () => {
    it('GET should return 401 when not authenticated', async () => {
      mockGetAuthenticatedClient.mockResolvedValue({ supabase: null, user: null });

      const res = await GET(createGetRequest({ weddingId: 'w-123' }));
      expect(res.status).toBe(401);
    });

    it('POST should return 401 when not authenticated', async () => {
      mockGetAuthenticatedClient.mockResolvedValue({ supabase: null, user: null });

      const res = await POST(createBodyRequest({ weddingId: 'w-123', title: 'T', content: 'C' }));
      expect(res.status).toBe(401);
    });

    it('PUT should return 401 when not authenticated', async () => {
      mockGetAuthenticatedClient.mockResolvedValue({ supabase: null, user: null });

      const res = await PUT(createBodyRequest({ id: '1', weddingId: 'w-123' }));
      expect(res.status).toBe(401);
    });

    it('DELETE should return 401 when not authenticated', async () => {
      mockGetAuthenticatedClient.mockResolvedValue({ supabase: null, user: null });

      const res = await DELETE(createDeleteRequest({ id: '1', weddingId: 'w-123' }));
      expect(res.status).toBe(401);
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // GET
  // ══════════════════════════════════════════════════════════════════

  describe('GET', () => {
    it('should return 400 when weddingId is missing', async () => {
      mockAuth();
      const res = await GET(createGetRequest({}));
      expect(res.status).toBe(400);
    });

    it('should return 403 when user lacks access', async () => {
      mockAuth(false);
      const res = await GET(createGetRequest({ weddingId: 'w-123' }));
      expect(res.status).toBe(403);
    });

    it('should return entries on success', async () => {
      const mockSupabase = mockAuth();
      const mockEntries = [
        { id: '1', title: 'Entry 1', content: 'Content 1', category: 'dining' },
      ];
      mockSupabase.from.mockReturnValue(createChain(mockEntries));

      const res = await GET(createGetRequest({ weddingId: 'w-123' }));
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toHaveProperty('entries');
    });

    it('should verify access with correct parameters', async () => {
      const mockSupabase = mockAuth();
      mockSupabase.from.mockReturnValue(createChain([]));

      await GET(createGetRequest({ weddingId: 'w-456' }));

      expect(mockVerifyWeddingAccess).toHaveBeenCalledWith(mockSupabase, 'user-123', 'w-456');
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // POST
  // ══════════════════════════════════════════════════════════════════

  describe('POST', () => {
    it('should return 400 when title is missing', async () => {
      mockAuth();
      const res = await POST(createBodyRequest({ weddingId: 'w-123', content: 'C' }));
      expect(res.status).toBe(400);
    });

    it('should return 400 when content is missing', async () => {
      mockAuth();
      const res = await POST(createBodyRequest({ weddingId: 'w-123', title: 'T' }));
      expect(res.status).toBe(400);
    });

    it('should return 400 when weddingId is missing', async () => {
      mockAuth();
      const res = await POST(createBodyRequest({ title: 'T', content: 'C' }));
      expect(res.status).toBe(400);
    });

    it('should return 403 when user lacks access', async () => {
      mockAuth(false);
      const res = await POST(createBodyRequest({ weddingId: 'w-123', title: 'T', content: 'C' }));
      expect(res.status).toBe(403);
    });

    it('should create entry and return it on success', async () => {
      const mockSupabase = mockAuth();
      const newEntry = { id: 'new-1', title: 'Dining', content: 'Great food', category: 'dining' };

      // First call: get max order_index, second call: insert
      let callCount = 0;
      mockSupabase.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return createChain([{ order_index: 2 }]); // existing max
        return createChain(newEntry); // insert result
      });

      const res = await POST(createBodyRequest({
        weddingId: 'w-123',
        title: 'Dining',
        content: 'Great food',
        category: 'dining',
      }));
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toHaveProperty('entry');
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // PUT
  // ══════════════════════════════════════════════════════════════════

  describe('PUT', () => {
    it('should return 400 when id is missing', async () => {
      mockAuth();
      const res = await PUT(createBodyRequest({ weddingId: 'w-123', title: 'Updated' }));
      expect(res.status).toBe(400);
    });

    it('should return 400 when weddingId is missing', async () => {
      mockAuth();
      const res = await PUT(createBodyRequest({ id: '1', title: 'Updated' }));
      expect(res.status).toBe(400);
    });

    it('should return 403 when user lacks access', async () => {
      mockAuth(false);
      const res = await PUT(createBodyRequest({ id: '1', weddingId: 'w-123', title: 'Updated' }));
      expect(res.status).toBe(403);
    });

    it('should update and return entry on success', async () => {
      const mockSupabase = mockAuth();
      const updated = { id: '1', title: 'Updated', content: 'C', category: 'dining', is_active: true };
      mockSupabase.from.mockReturnValue(createChain(updated));

      const res = await PUT(createBodyRequest({
        id: '1',
        weddingId: 'w-123',
        title: 'Updated',
      }));
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toHaveProperty('entry');
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // DELETE
  // ══════════════════════════════════════════════════════════════════

  describe('DELETE', () => {
    it('should return 400 when id is missing', async () => {
      mockAuth();
      const res = await DELETE(createDeleteRequest({ weddingId: 'w-123' }));
      expect(res.status).toBe(400);
    });

    it('should return 400 when weddingId is missing', async () => {
      mockAuth();
      const res = await DELETE(createDeleteRequest({ id: '1' }));
      expect(res.status).toBe(400);
    });

    it('should return 403 when user lacks access', async () => {
      mockAuth(false);
      const res = await DELETE(createDeleteRequest({ id: '1', weddingId: 'w-123' }));
      expect(res.status).toBe(403);
    });

    it('should delete and return success', async () => {
      const mockSupabase = mockAuth();
      mockSupabase.from.mockReturnValue(createChain(null, null));

      const res = await DELETE(createDeleteRequest({ id: '1', weddingId: 'w-123' }));
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});
