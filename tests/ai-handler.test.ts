import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Hoisted mocks ──────────────────────────────────────────────────

const { mockGroqCreate, mockSupabaseFrom } = vi.hoisted(() => ({
  mockGroqCreate: vi.fn(),
  mockSupabaseFrom: vi.fn(),
}));

vi.mock('groq-sdk', () => ({
  default: class MockGroq {
    chat = { completions: { create: mockGroqCreate } };
  },
}));

// Chainable query builder
function chain(data: any = null, error: any = null) {
  const c: any = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
    then: vi.fn((resolve: any) => resolve({ data, error })),
  };
  return c;
}

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ from: mockSupabaseFrom })),
}));

import { generateAIResponse } from '@/lib/whatsapp/ai-handler';

// ─── Helpers ─────────────────────────────────────────────────────────

const baseParams = {
  weddingId: 'w-123',
  weddingSlug: 'test-wedding',
  guestId: 'g-456',
  guestName: 'Priya',
  userMessage: 'What time is the ceremony?',
};

function setupMockData(overrides: {
  wedding?: any;
  events?: any[];
  schedule?: any[];
  scheduleItems?: any[];
  travel?: any[];
  faqs?: any[];
  rsvps?: any[];
  chat?: any[];
  registry?: any[];
  shops?: any[];
  settings?: any;
  knowledge?: any[];
} = {}) {
  const defaults = {
    wedding: {
      couple_name: 'Priya & Raj',
      partner1_name: 'Priya',
      partner2_name: 'Raj',
      wedding_date_display: 'March 15, 2026',
      wedding_date: '2026-03-15',
      venue_name: 'The Grand Palace',
      venue_location: 'Mumbai, India',
      rsvp_deadline: '2026-03-01',
      welcome_text: 'Welcome to our wedding!',
    },
    events: [],
    schedule: [],
    scheduleItems: [],
    travel: [],
    faqs: [],
    rsvps: [],
    chat: [],
    registry: [],
    shops: [],
    settings: null,
    knowledge: [],
  };

  const d = { ...defaults, ...overrides };

  // Promise.all expects 13 parallel queries in order
  const mockCalls = [
    chain(d.wedding),                    // weddings
    chain(d.events),                     // wedding_events
    chain(d.schedule),                   // wedding_schedule
    chain(d.scheduleItems),              // schedule_items
    chain(d.travel),                     // wedding_travel_cards
    chain(d.travel),                     // travel_sections
    chain(d.faqs),                       // wedding_faqs
    chain(d.rsvps),                      // rsvps
    chain(d.chat),                       // whatsapp_chat_history
    chain(d.registry),                   // wedding_registry
    chain(d.shops),                      // wedding_shops
    chain(d.settings),                   // wedding_settings
    chain(d.knowledge),                  // concierge_knowledge_base
  ];

  let callIndex = 0;
  mockSupabaseFrom.mockImplementation(() => mockCalls[callIndex++]);
}

// ─── Tests ───────────────────────────────────────────────────────────

describe('ai-handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGroqCreate.mockResolvedValue({
      choices: [{ message: { content: 'The ceremony starts at 4 PM at The Grand Palace!' } }],
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // SYSTEM PROMPT CONSTRUCTION
  // ══════════════════════════════════════════════════════════════════

  describe('system prompt construction', () => {
    it('should include wedding details in system prompt', async () => {
      setupMockData();
      await generateAIResponse(baseParams);

      const systemPrompt = mockGroqCreate.mock.calls[0][0].messages[0].content;
      expect(systemPrompt).toContain('Priya & Raj');
      expect(systemPrompt).toContain('March 15, 2026');
      expect(systemPrompt).toContain('The Grand Palace');
      expect(systemPrompt).toContain('Mumbai, India');
    });

    it('should include events in system prompt', async () => {
      setupMockData({
        events: [
          { name: 'Sangeet', date: 'March 14', time: '7 PM', venue_name: 'Hotel Taj', dress_code: 'Traditional' },
          { name: 'Wedding', date: 'March 15', time: '4 PM', venue_name: 'The Grand Palace', dress_code: 'Formal', dress_code_description: 'Indian or Western' },
        ],
      });
      await generateAIResponse(baseParams);

      const systemPrompt = mockGroqCreate.mock.calls[0][0].messages[0].content;
      expect(systemPrompt).toContain('Sangeet');
      expect(systemPrompt).toContain('7 PM');
      expect(systemPrompt).toContain('Hotel Taj');
      expect(systemPrompt).toContain('Traditional');
      expect(systemPrompt).toContain('Wedding');
      expect(systemPrompt).toContain('Formal');
      expect(systemPrompt).toContain('Indian or Western');
    });

    it('should include FAQs in system prompt', async () => {
      setupMockData({
        faqs: [
          { question: 'Is there parking?', answer: 'Yes, valet parking is available.' },
        ],
      });
      await generateAIResponse(baseParams);

      const systemPrompt = mockGroqCreate.mock.calls[0][0].messages[0].content;
      expect(systemPrompt).toContain('Is there parking?');
      expect(systemPrompt).toContain('valet parking');
    });

    it('should include knowledge base entries in system prompt', async () => {
      setupMockData({
        knowledge: [
          { title: 'Restaurant Recs', content: 'Try Bombay Canteen for dinner', category: 'dining' },
        ],
      });
      await generateAIResponse(baseParams);

      const systemPrompt = mockGroqCreate.mock.calls[0][0].messages[0].content;
      expect(systemPrompt).toContain('Restaurant Recs');
      expect(systemPrompt).toContain('Bombay Canteen');
      expect(systemPrompt).toContain('Local Tips & Recommendations');
    });

    it('should include RSVP info for the guest', async () => {
      setupMockData({
        rsvps: [
          { event_id: 'e1', attending: 'yes', guest_count: 2, food_preference: ['vegetarian'], dietary_restrictions: 'no nuts', song_request: 'Tum Hi Ho' },
        ],
      });
      await generateAIResponse(baseParams);

      const systemPrompt = mockGroqCreate.mock.calls[0][0].messages[0].content;
      expect(systemPrompt).toContain('yes');
      expect(systemPrompt).toContain('2 guests');
      expect(systemPrompt).toContain('vegetarian');
      expect(systemPrompt).toContain('no nuts');
      expect(systemPrompt).toContain('Tum Hi Ho');
    });

    it('should include schedule with grouped items', async () => {
      setupMockData({
        schedule: [{ id: 's1', day_name: 'Saturday', date: '2026-03-15' }],
        scheduleItems: [
          { schedule_id: 's1', time: '3:00 PM', name: 'Baraat', description: 'Groom arrival', location: 'Main Gate' },
          { schedule_id: 's1', time: '4:00 PM', name: 'Ceremony', description: 'Wedding ceremony', location: 'Mandap' },
        ],
      });
      await generateAIResponse(baseParams);

      const systemPrompt = mockGroqCreate.mock.calls[0][0].messages[0].content;
      expect(systemPrompt).toContain('Saturday');
      expect(systemPrompt).toContain('Baraat');
      expect(systemPrompt).toContain('Ceremony');
      expect(systemPrompt).toContain('Main Gate');
    });

    it('should include registry when present', async () => {
      setupMockData({
        registry: [
          { emoji: '🎁', fund_name: 'Honeymoon Fund', description: 'Help us go to Bali', external_url: 'https://example.com' },
        ],
      });
      await generateAIResponse(baseParams);

      const systemPrompt = mockGroqCreate.mock.calls[0][0].messages[0].content;
      expect(systemPrompt).toContain('Gift Registry');
      expect(systemPrompt).toContain('Honeymoon Fund');
    });

    it('should include wedding website URL', async () => {
      setupMockData();
      await generateAIResponse(baseParams);

      const systemPrompt = mockGroqCreate.mock.calls[0][0].messages[0].content;
      expect(systemPrompt).toContain('https://phera.io/test-wedding');
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // GREETING DETECTION
  // ══════════════════════════════════════════════════════════════════

  describe('greeting detection', () => {
    it('should greet warmly on first message (no chat history)', async () => {
      setupMockData({ chat: [] });
      await generateAIResponse(baseParams);

      const systemPrompt = mockGroqCreate.mock.calls[0][0].messages[0].content;
      expect(systemPrompt).toContain('first message in the conversation');
      expect(systemPrompt).toContain('Greet them warmly');
    });

    it('should not re-greet when assistant already said hello', async () => {
      setupMockData({
        chat: [
          { role: 'assistant', content: 'Hey Priya! Welcome to the wedding!' },
          { role: 'user', content: 'Thanks! What time is dinner?' },
        ],
      });
      await generateAIResponse(baseParams);

      const systemPrompt = mockGroqCreate.mock.calls[0][0].messages[0].content;
      expect(systemPrompt).toContain('ALREADY greeted');
      expect(systemPrompt).toContain('Do NOT say');
    });

    it('should detect greeting with "hi" in assistant response', async () => {
      setupMockData({
        chat: [
          { role: 'assistant', content: 'Hi there! How can I help?' },
        ],
      });
      await generateAIResponse(baseParams);

      const systemPrompt = mockGroqCreate.mock.calls[0][0].messages[0].content;
      expect(systemPrompt).toContain('ALREADY greeted');
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // CHAT HISTORY
  // ══════════════════════════════════════════════════════════════════

  describe('chat history', () => {
    it('should pass chat history in chronological order to Groq', async () => {
      setupMockData({
        chat: [
          { role: 'user', content: 'Second msg' },
          { role: 'assistant', content: 'First response' },
        ],
      });
      await generateAIResponse(baseParams);

      const messages = mockGroqCreate.mock.calls[0][0].messages;
      // messages[0] = system, messages[1..n-1] = history (reversed), messages[n] = current user
      expect(messages[0].role).toBe('system');
      expect(messages[messages.length - 1].role).toBe('user');
      expect(messages[messages.length - 1].content).toBe('What time is the ceremony?');
    });

    it('should filter out non-user/assistant messages from history', async () => {
      setupMockData({
        chat: [
          { role: 'system', content: 'Internal prompt' },
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi!' },
        ],
      });
      await generateAIResponse(baseParams);

      const messages = mockGroqCreate.mock.calls[0][0].messages;
      const historyMessages = messages.slice(1, -1); // exclude system and current user
      const hasSystem = historyMessages.some((m: any) => m.role === 'system');
      expect(hasSystem).toBe(false);
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // GROQ API CALL
  // ══════════════════════════════════════════════════════════════════

  describe('Groq API call', () => {
    it('should use llama-3.3-70b-versatile model', async () => {
      setupMockData();
      await generateAIResponse(baseParams);

      expect(mockGroqCreate.mock.calls[0][0].model).toBe('llama-3.3-70b-versatile');
    });

    it('should use temperature 0.7', async () => {
      setupMockData();
      await generateAIResponse(baseParams);

      expect(mockGroqCreate.mock.calls[0][0].temperature).toBe(0.7);
    });

    it('should use max_tokens 500', async () => {
      setupMockData();
      await generateAIResponse(baseParams);

      expect(mockGroqCreate.mock.calls[0][0].max_tokens).toBe(500);
    });

    it('should return the LLM response content', async () => {
      setupMockData();
      const result = await generateAIResponse(baseParams);

      expect(result).toBe('The ceremony starts at 4 PM at The Grand Palace!');
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // FALLBACK RESPONSE
  // ══════════════════════════════════════════════════════════════════

  describe('fallback response', () => {
    it('should return fallback when Groq returns empty choices', async () => {
      setupMockData();
      mockGroqCreate.mockResolvedValue({ choices: [{ message: { content: null } }] });

      const result = await generateAIResponse(baseParams);

      expect(result).toContain('Priya');
      expect(result).toContain('phera.io/test-wedding');
    });

    it('should return fallback when Groq throws an error', async () => {
      setupMockData();
      mockGroqCreate.mockRejectedValue(new Error('API rate limit'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const result = await generateAIResponse(baseParams);
      consoleSpy.mockRestore();

      expect(result).toContain('Priya');
      expect(result).toContain('phera.io/test-wedding');
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // EDGE CASES
  // ══════════════════════════════════════════════════════════════════

  describe('edge cases', () => {
    it('should handle missing wedding data gracefully', async () => {
      setupMockData({ wedding: null });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const result = await generateAIResponse(baseParams);
      consoleSpy.mockRestore();

      // Should still produce some response (either LLM or fallback)
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle empty events/faqs/etc gracefully', async () => {
      setupMockData({
        events: [],
        faqs: [],
        schedule: [],
        travel: [],
        registry: [],
        shops: [],
        knowledge: [],
      });
      await generateAIResponse(baseParams);

      const systemPrompt = mockGroqCreate.mock.calls[0][0].messages[0].content;
      expect(systemPrompt).toContain('No events listed yet');
      expect(systemPrompt).toContain('No FAQs available');
      expect(systemPrompt).toContain('No schedule available');
    });

    it('should not include registry section when no registry entries', async () => {
      setupMockData({ registry: [] });
      await generateAIResponse(baseParams);

      const systemPrompt = mockGroqCreate.mock.calls[0][0].messages[0].content;
      expect(systemPrompt).not.toContain('Gift Registry');
    });

    it('should not include knowledge section when no entries', async () => {
      setupMockData({ knowledge: [] });
      await generateAIResponse(baseParams);

      const systemPrompt = mockGroqCreate.mock.calls[0][0].messages[0].content;
      expect(systemPrompt).not.toContain('Local Tips & Recommendations');
    });

    it('should include WhatsApp group link when present', async () => {
      setupMockData({ settings: { whatsapp_group_link: 'https://chat.whatsapp.com/abc123' } });
      await generateAIResponse(baseParams);

      const systemPrompt = mockGroqCreate.mock.calls[0][0].messages[0].content;
      expect(systemPrompt).toContain('https://chat.whatsapp.com/abc123');
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // INSTRUCTIONS
  // ══════════════════════════════════════════════════════════════════

  describe('instructions', () => {
    it('should include WhatsApp formatting instructions', async () => {
      setupMockData();
      await generateAIResponse(baseParams);

      const systemPrompt = mockGroqCreate.mock.calls[0][0].messages[0].content;
      expect(systemPrompt).toContain('WhatsApp');
      expect(systemPrompt).toContain('*bold*');
      expect(systemPrompt).toContain('concise');
    });

    it('should instruct not to make up information', async () => {
      setupMockData();
      await generateAIResponse(baseParams);

      const systemPrompt = mockGroqCreate.mock.calls[0][0].messages[0].content;
      expect(systemPrompt).toContain('Never make up information');
    });
  });
});
