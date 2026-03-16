import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Hoisted mocks ──────────────────────────────────────────────────

const { mockGroqCreate, mockSupabaseFrom } = vi.hoisted(() => ({
  mockGroqCreate: vi.fn(),
  mockSupabaseFrom: vi.fn(),
}));

vi.mock('groq-sdk', () => {
  return {
    default: class MockGroq {
      chat = {
        completions: {
          create: mockGroqCreate,
        },
      };
    },
  };
});

function createChain(finalData: any = null, finalError: any = null) {
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: finalData, error: finalError }),
    then: vi.fn((resolve: any) => resolve({ data: finalData, error: finalError })),
  };
  return chain;
}

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn().mockImplementation(() => ({
    from: mockSupabaseFrom,
  })),
}));

// ─── Import after mocks ──────────────────────────────────────────────

import { generateKnowledgeEntries, autoGenerateForUser } from '@/lib/concierge/generate-knowledge';

// ─── Tests ───────────────────────────────────────────────────────────

describe('generate-knowledge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ══════════════════════════════════════════════════════════════════
  // generateKnowledgeEntries
  // ══════════════════════════════════════════════════════════════════

  describe('generateKnowledgeEntries', () => {
    it('should return canGenerate: false when wedding not found', async () => {
      const chain = createChain(null, { message: 'Not found' });
      mockSupabaseFrom.mockReturnValue(chain);

      const result = await generateKnowledgeEntries('nonexistent-id');

      expect(result.canGenerate).toBe(false);
      if (!result.canGenerate) {
        expect(result.missing).toContain('wedding');
      }
    });

    it('should return canGenerate: false when venue_location is null', async () => {
      const chain = createChain({
        venue_name: 'Test Venue',
        venue_location: null,
        wedding_date: '2026-06-15',
        wedding_date_display: 'June 15, 2026',
        wedding_date_end: null,
      });
      mockSupabaseFrom.mockReturnValue(chain);

      const result = await generateKnowledgeEntries('wedding-123');

      expect(result.canGenerate).toBe(false);
      if (!result.canGenerate) {
        expect(result.missing).toContain('venue_location');
      }
    });

    it('should return canGenerate: false when venue_location is empty string', async () => {
      const chain = createChain({
        venue_name: 'Test Venue',
        venue_location: '',
        wedding_date: '2026-06-15',
        wedding_date_display: 'June 15, 2026',
        wedding_date_end: null,
      });
      mockSupabaseFrom.mockReturnValue(chain);

      const result = await generateKnowledgeEntries('wedding-123');

      expect(result.canGenerate).toBe(false);
      if (!result.canGenerate) {
        expect(result.missing).toContain('venue_location');
      }
    });

    it('should call Groq with correct parameters when venue data exists', async () => {
      const chain = createChain({
        venue_name: 'The Grand Palace',
        venue_location: 'Mumbai, India',
        wedding_date: '2026-06-15',
        wedding_date_display: 'June 15, 2026',
        wedding_date_end: '2026-06-17',
      });
      mockSupabaseFrom.mockReturnValue(chain);

      mockGroqCreate.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify([
              { title: 'Best Restaurants', content: 'Try the local spots...', category: 'dining' },
            ]),
          },
        }],
      });

      const result = await generateKnowledgeEntries('wedding-123');

      expect(mockGroqCreate).toHaveBeenCalledTimes(1);
      const callArgs = mockGroqCreate.mock.calls[0][0];
      expect(callArgs.model).toBe('llama-3.3-70b-versatile');
      expect(callArgs.temperature).toBe(0.6);
      expect(callArgs.max_tokens).toBe(4000);

      const userMessage = callArgs.messages[1].content;
      expect(userMessage).toContain('The Grand Palace');
      expect(userMessage).toContain('Mumbai, India');
      expect(userMessage).toContain('June 15, 2026');
      expect(userMessage).toContain('2026-06-17');
    });

    it('should parse valid JSON response from LLM', async () => {
      const chain = createChain({
        venue_name: 'Beach Resort',
        venue_location: 'Goa, India',
        wedding_date: '2026-03-20',
        wedding_date_display: 'March 20, 2026',
        wedding_date_end: null,
      });
      mockSupabaseFrom.mockReturnValue(chain);

      const mockEntries = [
        { title: 'Dining in Goa', content: 'Fresh seafood at Martin\'s Corner...', category: 'dining' },
        { title: 'Beach Activities', content: 'Parasailing at Baga Beach...', category: 'activities' },
        { title: 'Getting Around', content: 'Rent a scooter for 300 INR/day...', category: 'transportation' },
      ];

      mockGroqCreate.mockResolvedValue({
        choices: [{
          message: { content: JSON.stringify(mockEntries) },
        }],
      });

      const result = await generateKnowledgeEntries('wedding-123');

      expect(result.canGenerate).toBe(true);
      if (result.canGenerate) {
        expect(result.entries).toHaveLength(3);
        expect(result.entries[0].title).toBe('Dining in Goa');
        expect(result.entries[0].category).toBe('dining');
        expect(result.entries[1].title).toBe('Beach Activities');
        expect(result.entries[2].category).toBe('transportation');
      }
    });

    it('should handle JSON wrapped in code fences', async () => {
      const chain = createChain({
        venue_name: 'Hotel',
        venue_location: 'Delhi, India',
        wedding_date: '2026-04-01',
        wedding_date_display: 'April 1, 2026',
        wedding_date_end: null,
      });
      mockSupabaseFrom.mockReturnValue(chain);

      const mockEntries = [{ title: 'Test', content: 'Content here', category: 'dining' }];

      mockGroqCreate.mockResolvedValue({
        choices: [{
          message: { content: '```json\n' + JSON.stringify(mockEntries) + '\n```' },
        }],
      });

      const result = await generateKnowledgeEntries('wedding-123');

      expect(result.canGenerate).toBe(true);
      if (result.canGenerate) {
        expect(result.entries).toHaveLength(1);
        expect(result.entries[0].title).toBe('Test');
      }
    });

    it('should return empty entries on malformed JSON response', async () => {
      const chain = createChain({
        venue_name: 'Hotel',
        venue_location: 'Delhi, India',
        wedding_date: '2026-04-01',
        wedding_date_display: 'April 1, 2026',
        wedding_date_end: null,
      });
      mockSupabaseFrom.mockReturnValue(chain);

      mockGroqCreate.mockResolvedValue({
        choices: [{
          message: { content: 'Sorry, I cannot generate that.' },
        }],
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const result = await generateKnowledgeEntries('wedding-123');
      consoleSpy.mockRestore();

      expect(result.canGenerate).toBe(true);
      if (result.canGenerate) {
        expect(result.entries).toHaveLength(0);
      }
    });

    it('should return empty entries when LLM returns null content', async () => {
      const chain = createChain({
        venue_name: 'Hotel',
        venue_location: 'Delhi, India',
        wedding_date: '2026-04-01',
        wedding_date_display: null,
        wedding_date_end: null,
      });
      mockSupabaseFrom.mockReturnValue(chain);

      mockGroqCreate.mockResolvedValue({
        choices: [{
          message: { content: null },
        }],
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const result = await generateKnowledgeEntries('wedding-123');
      consoleSpy.mockRestore();

      expect(result.canGenerate).toBe(true);
      if (result.canGenerate) {
        expect(result.entries).toHaveLength(0);
      }
    });

    it('should use wedding_date when wedding_date_display is missing', async () => {
      const chain = createChain({
        venue_name: 'Venue',
        venue_location: 'Chennai, India',
        wedding_date: '2026-08-10',
        wedding_date_display: null,
        wedding_date_end: null,
      });
      mockSupabaseFrom.mockReturnValue(chain);

      mockGroqCreate.mockResolvedValue({
        choices: [{ message: { content: '[]' } }],
      });

      await generateKnowledgeEntries('wedding-123');

      const userMessage = mockGroqCreate.mock.calls[0][0].messages[1].content;
      expect(userMessage).toContain('2026-08-10');
    });

    it('should use fallback venue name when venue_name is null', async () => {
      const chain = createChain({
        venue_name: null,
        venue_location: 'Jaipur, India',
        wedding_date: '2026-05-01',
        wedding_date_display: 'May 1, 2026',
        wedding_date_end: null,
      });
      mockSupabaseFrom.mockReturnValue(chain);

      mockGroqCreate.mockResolvedValue({
        choices: [{ message: { content: '[]' } }],
      });

      await generateKnowledgeEntries('wedding-123');

      const userMessage = mockGroqCreate.mock.calls[0][0].messages[1].content;
      expect(userMessage).toContain('the wedding venue');
    });

    it('should include system prompt with all required categories', async () => {
      const chain = createChain({
        venue_name: 'Venue',
        venue_location: 'Bangalore, India',
        wedding_date: '2026-09-01',
        wedding_date_display: 'September 1, 2026',
        wedding_date_end: null,
      });
      mockSupabaseFrom.mockReturnValue(chain);

      mockGroqCreate.mockResolvedValue({
        choices: [{ message: { content: '[]' } }],
      });

      await generateKnowledgeEntries('wedding-123');

      const systemPrompt = mockGroqCreate.mock.calls[0][0].messages[0].content;
      const requiredCategories = [
        'dining', 'activities', 'transportation', 'weather',
        'emergency', 'nightlife', 'shopping', 'cultural_etiquette', 'local_tips',
      ];
      for (const cat of requiredCategories) {
        expect(systemPrompt).toContain(`"${cat}"`);
      }
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // autoGenerateForUser
  // ══════════════════════════════════════════════════════════════════

  describe('autoGenerateForUser', () => {
    it('should skip when user has no weddings', async () => {
      const mockServiceSupabase: any = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
          then: vi.fn((resolve: any) => resolve({ data: [], error: null })),
        }),
      };

      await autoGenerateForUser('user-123', mockServiceSupabase);

      expect(mockGroqCreate).not.toHaveBeenCalled();
    });

    it('should skip weddings without venue_location', async () => {
      let callCount = 0;
      const mockServiceSupabase: any = {
        from: vi.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              then: vi.fn((resolve: any) => resolve({
                data: [{ id: 'w-1', venue_location: null }],
                error: null,
              })),
            };
          }
          return createChain();
        }),
      };

      await autoGenerateForUser('user-123', mockServiceSupabase);

      expect(mockGroqCreate).not.toHaveBeenCalled();
    });

    it('should skip weddings that already have auto-generated entries', async () => {
      let callCount = 0;
      const mockServiceSupabase: any = {
        from: vi.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              then: vi.fn((resolve: any) => resolve({
                data: [{ id: 'w-1', venue_location: 'Mumbai, India' }],
                error: null,
              })),
            };
          }
          if (callCount === 2) {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              limit: vi.fn().mockReturnThis(),
              then: vi.fn((resolve: any) => resolve({
                data: [{ id: 'existing-entry' }],
                error: null,
              })),
            };
          }
          return createChain();
        }),
      };

      await autoGenerateForUser('user-123', mockServiceSupabase);

      expect(mockGroqCreate).not.toHaveBeenCalled();
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // LLM Prompt Quality
  // ══════════════════════════════════════════════════════════════════

  describe('LLM prompt quality', () => {
    it('should request JSON-only output in system prompt', async () => {
      const chain = createChain({
        venue_name: 'Venue',
        venue_location: 'Pune, India',
        wedding_date: '2026-07-01',
        wedding_date_display: 'July 1, 2026',
        wedding_date_end: null,
      });
      mockSupabaseFrom.mockReturnValue(chain);

      mockGroqCreate.mockResolvedValue({
        choices: [{ message: { content: '[]' } }],
      });

      await generateKnowledgeEntries('wedding-123');

      const systemPrompt = mockGroqCreate.mock.calls[0][0].messages[0].content;
      expect(systemPrompt).toContain('ONLY valid JSON');
      expect(systemPrompt).toContain('no markdown');
    });

    it('should request 8-12 entries in system prompt', async () => {
      const chain = createChain({
        venue_name: 'Venue',
        venue_location: 'Hyderabad, India',
        wedding_date: '2026-07-01',
        wedding_date_display: 'July 1, 2026',
        wedding_date_end: null,
      });
      mockSupabaseFrom.mockReturnValue(chain);

      mockGroqCreate.mockResolvedValue({
        choices: [{ message: { content: '[]' } }],
      });

      await generateKnowledgeEntries('wedding-123');

      const systemPrompt = mockGroqCreate.mock.calls[0][0].messages[0].content;
      expect(systemPrompt).toContain('8-12');
    });

    it('should request 150-300 words per entry', async () => {
      const chain = createChain({
        venue_name: 'Venue',
        venue_location: 'Kolkata, India',
        wedding_date: '2026-07-01',
        wedding_date_display: 'July 1, 2026',
        wedding_date_end: null,
      });
      mockSupabaseFrom.mockReturnValue(chain);

      mockGroqCreate.mockResolvedValue({
        choices: [{ message: { content: '[]' } }],
      });

      await generateKnowledgeEntries('wedding-123');

      const systemPrompt = mockGroqCreate.mock.calls[0][0].messages[0].content;
      expect(systemPrompt).toContain('150-300 words');
    });
  });
});
