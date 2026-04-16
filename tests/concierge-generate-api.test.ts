import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mocks ───────────────────────────────────────────────────────────

const mockGetAuthenticatedClient = vi.fn();
const mockVerifyWeddingAccess = vi.fn();
const mockGenerateKnowledgeEntries = vi.fn();

vi.mock('@/lib/utils/auth-helpers', () => ({
  getAuthenticatedClient: () => mockGetAuthenticatedClient(),
}));

vi.mock('@/lib/utils/verify-wedding-access', () => ({
  verifyWeddingAccess: (...args: any[]) => mockVerifyWeddingAccess(...args),
}));

vi.mock('@/lib/concierge/generate-knowledge', () => ({
  generateKnowledgeEntries: (...args: any[]) => mockGenerateKnowledgeEntries(...args),
}));

const mockSupabaseDelete = vi.fn();
const mockSupabaseInsert = vi.fn();
const mockSupabaseSelect = vi.fn();

function createMockChain(finalData: any = null, finalError: any = null) {
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: finalData, error: finalError }),
    then: vi.fn((resolve: any) => resolve({ data: finalData, error: finalError })),
  };
  return chain;
}

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn().mockImplementation(() => ({
    from: vi.fn().mockImplementation(() => createMockChain()),
  })),
}));

// ─── Import after mocks ──────────────────────────────────────────────

import { POST } from '@/app/api/concierge/knowledge/generate/route';

// ─── Helpers ─────────────────────────────────────────────────────────

function createRequest(body: any) {
  return {
    json: () => Promise.resolve(body),
  } as any;
}

// ─── Tests ───────────────────────────────────────────────────────────

describe('/api/concierge/knowledge/generate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authentication & authorization', () => {
    it('should return 401 when not authenticated', async () => {
      mockGetAuthenticatedClient.mockResolvedValue({ supabase: null, user: null });

      const response = await POST(createRequest({ weddingId: 'w-123' }));
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 400 when weddingId is missing', async () => {
      mockGetAuthenticatedClient.mockResolvedValue({
        supabase: { from: vi.fn() },
        user: { id: 'user-123' },
      });

      const response = await POST(createRequest({}));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing weddingId');
    });

    it('should return 403 when user lacks access to wedding', async () => {
      mockGetAuthenticatedClient.mockResolvedValue({
        supabase: { from: vi.fn() },
        user: { id: 'user-123' },
      });
      mockVerifyWeddingAccess.mockResolvedValue(false);

      const response = await POST(createRequest({ weddingId: 'w-123' }));
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Forbidden');
    });
  });

  describe('generation flow', () => {
    it('should return 400 with missing fields when generation cannot proceed', async () => {
      mockGetAuthenticatedClient.mockResolvedValue({
        supabase: { from: vi.fn() },
        user: { id: 'user-123' },
      });
      mockVerifyWeddingAccess.mockResolvedValue(true);
      mockGenerateKnowledgeEntries.mockResolvedValue({
        canGenerate: false,
        missing: ['venue_location'],
      });

      const response = await POST(createRequest({ weddingId: 'w-123' }));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('insufficient_data');
      expect(data.missing).toContain('venue_location');
    });

    it('should call generateKnowledgeEntries with the correct weddingId', async () => {
      mockGetAuthenticatedClient.mockResolvedValue({
        supabase: { from: vi.fn() },
        user: { id: 'user-123' },
      });
      mockVerifyWeddingAccess.mockResolvedValue(true);
      mockGenerateKnowledgeEntries.mockResolvedValue({
        canGenerate: true,
        entries: [],
      });

      await POST(createRequest({ weddingId: 'w-456' }));

      expect(mockGenerateKnowledgeEntries).toHaveBeenCalledWith('w-456');
    });

    it('should return entries and count on success', async () => {
      mockGetAuthenticatedClient.mockResolvedValue({
        supabase: { from: vi.fn() },
        user: { id: 'user-123' },
      });
      mockVerifyWeddingAccess.mockResolvedValue(true);
      mockGenerateKnowledgeEntries.mockResolvedValue({
        canGenerate: true,
        entries: [
          { title: 'Dining', content: 'Great restaurants...', category: 'dining' },
          { title: 'Weather', content: 'Expect warm weather...', category: 'weather' },
        ],
      });

      const response = await POST(createRequest({ weddingId: 'w-123' }));
      const data = await response.json();

      expect(response.status).toBe(200);
      // The response depends on the mocked supabase insert/select chain
      // but it should at least have entries and count fields
      expect(data).toHaveProperty('entries');
      expect(data).toHaveProperty('count');
    });
  });

  describe('input validation', () => {
    it('should verify wedding access with correct user and wedding IDs', async () => {
      const mockSupabase = { from: vi.fn() };
      mockGetAuthenticatedClient.mockResolvedValue({
        supabase: mockSupabase,
        user: { id: 'user-789' },
      });
      mockVerifyWeddingAccess.mockResolvedValue(false);

      await POST(createRequest({ weddingId: 'w-abc' }));

      expect(mockVerifyWeddingAccess).toHaveBeenCalledWith(mockSupabase, 'user-789', 'w-abc');
    });
  });
});
