import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Hoisted mocks ──────────────────────────────────────────────────

const { mockGroqCreate, mockSupabaseFrom, mockSupabaseRpc, mockDispatchTool } = vi.hoisted(() => {
  // Set env vars so provider clients get initialized during module load
  process.env.GROQ_API_KEY = 'test-groq-key';
  // No GEMINI_API_KEY or DEEPSEEK_API_KEY — those providers stay null
  return {
    mockGroqCreate: vi.fn(),
    mockSupabaseFrom: vi.fn(),
    mockSupabaseRpc: vi.fn(),
    mockDispatchTool: vi.fn(),
  };
});

vi.mock('groq-sdk', () => ({
  default: class MockGroq {
    chat = { completions: { create: mockGroqCreate } };
  },
}));

// Mock Google GenAI — return null-like so Gemini is skipped (no API key in test env)
vi.mock('@google/genai', () => ({
  GoogleGenAI: class MockGoogleGenAI {
    models = { generateContent: vi.fn() };
  },
}));

// Mock OpenAI (used for DeepSeek fallback)
vi.mock('openai', () => ({
  default: class MockOpenAI {
    chat = { completions: { create: vi.fn() } };
  },
}));

// Chainable query builder
function chain(data: any = null, error: any = null) {
  const c: any = {
    select: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
    then: vi.fn((resolve: any) => resolve({ data, error })),
  };
  return c;
}

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: mockSupabaseFrom,
    rpc: mockSupabaseRpc,
  })),
}));

vi.mock('@/lib/whatsapp/concierge-tools', () => ({
  dispatchTool: mockDispatchTool,
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

/**
 * Sets up mock data for all parallel queries in generateAIResponse.
 * The handler now makes ~20 parallel queries + a timestamp update + rpc call.
 * We use mockSupabaseFrom to return the appropriate chain for each table name.
 */
function setupMockData(overrides: {
  wedding?: any;
  events?: any[];
  schedule?: any[];
  scheduleItems?: any[];
  travel?: any[];
  travelSections?: any[];
  faqs?: any[];
  rsvps?: any[];
  chat?: any[];
  registry?: any[];
  shops?: any[];
  settings?: any;
  knowledge?: any[];
  guestDetail?: any;
  flights?: any[];
  hotels?: any[];
  visas?: any[];
  issues?: any[];
  shuttle?: any[];
  allRsvps?: any[];
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
    travelSections: [],
    faqs: [],
    rsvps: [],
    chat: [],
    registry: [],
    shops: [],
    settings: null,
    knowledge: [],
    guestDetail: {
      id: 'g-456',
      name: 'Priya',
      phone: '+919876543210',
      email: 'priya@test.com',
      wedding_side: 'bride',
      conversation_state: null,
      conversation_topic: null,
      ai_notes: null,
    },
    flights: [],
    hotels: [],
    visas: [],
    issues: [],
    shuttle: [],
    allRsvps: [],
  };

  const d = { ...defaults, ...overrides };

  // Map table names to their mock data
  const tableData: Record<string, any> = {
    weddings: d.wedding,
    wedding_events: d.events,
    wedding_schedule: d.schedule,
    schedule_items: d.scheduleItems,
    wedding_travel_cards: d.travel,
    travel_sections: d.travelSections,
    wedding_faqs: d.faqs,
    rsvps: d.rsvps, // first call is guest rsvps, second is allRsvps
    whatsapp_chat_history: d.chat,
    wedding_registry: d.registry,
    wedding_shops: d.shops,
    wedding_settings: d.settings,
    concierge_knowledge_base: d.knowledge,
    guests: d.guestDetail,
    guest_flights: d.flights,
    guest_hotels: d.hotels,
    guest_visas: d.visas,
    coordination_issues: d.issues,
    travel_bus_signups: d.shuttle,
  };

  // Track call count per table to handle 'rsvps' being called twice and 'guests' being called for update + select
  const tableCalls: Record<string, number> = {};

  mockSupabaseFrom.mockImplementation((table: string) => {
    tableCalls[table] = (tableCalls[table] || 0) + 1;

    // 'guests' first call is the update (timestamp), second is the select (guest detail)
    if (table === 'guests' && tableCalls[table] === 1) {
      return chain(null); // timestamp update — returns nothing
    }
    // 'guests' third call (after all parallel queries) is the outbound timestamp update
    if (table === 'guests' && tableCalls[table] >= 3) {
      return chain(null);
    }

    // 'rsvps' second call is the allRsvps aggregate count query
    if (table === 'rsvps' && tableCalls[table] === 2) {
      return chain(d.allRsvps);
    }

    const data = tableData[table];
    return chain(data !== undefined ? data : null);
  });

  mockSupabaseRpc.mockResolvedValue({ data: null, error: null });
}

// ─── Tests ───────────────────────────────────────────────────────────

describe('ai-handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGroqCreate.mockResolvedValue({
      choices: [{
        message: { content: 'The ceremony starts at 4 PM at The Grand Palace!', tool_calls: null },
        finish_reason: 'stop',
      }],
    });
    mockDispatchTool.mockResolvedValue({ success: true });
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

    it('should include guest flight info when available', async () => {
      setupMockData({
        flights: [
          { airline: 'Air India', flight_number: 'AI-101', arrival_datetime: '2026-03-14T10:00:00', departure_datetime: null, arrival_airport: 'BOM', departure_airport: 'JFK' },
        ],
      });
      await generateAIResponse(baseParams);

      const systemPrompt = mockGroqCreate.mock.calls[0][0].messages[0].content;
      expect(systemPrompt).toContain('Air India');
      expect(systemPrompt).toContain('AI-101');
    });

    it('should include open coordination issues in guest context', async () => {
      setupMockData({
        issues: [
          { category: 'visa', title: 'Visa application pending', priority: 'high' },
        ],
      });
      await generateAIResponse(baseParams);

      const systemPrompt = mockGroqCreate.mock.calls[0][0].messages[0].content;
      expect(systemPrompt).toContain('Visa application pending');
      expect(systemPrompt).toContain('HIGH');
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
      expect(systemPrompt).toContain('start of the conversation');
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

    it('should pass tools to Groq', async () => {
      setupMockData();
      await generateAIResponse(baseParams);

      const tools = mockGroqCreate.mock.calls[0][0].tools;
      expect(tools).toBeDefined();
      expect(tools.length).toBe(8);
      expect(tools[0].type).toBe('function');
    });

    it('should return the LLM response content', async () => {
      setupMockData();
      const result = await generateAIResponse(baseParams);

      expect(result).toBe('The ceremony starts at 4 PM at The Grand Palace!');
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // TOOL USE
  // ══════════════════════════════════════════════════════════════════

  describe('tool use', () => {
    it('should dispatch tool calls and make a follow-up LLM call', async () => {
      setupMockData();

      // First call: model returns a tool call
      mockGroqCreate
        .mockResolvedValueOnce({
          choices: [{
            message: {
              content: null,
              tool_calls: [{
                id: 'tc-1',
                type: 'function',
                function: {
                  name: 'update_guest_rsvp',
                  arguments: JSON.stringify({ attending: 'yes', guest_count: 2 }),
                },
              }],
            },
            finish_reason: 'tool_calls',
          }],
        })
        // Second call: model returns final text
        .mockResolvedValueOnce({
          choices: [{
            message: { content: 'Got it! I\'ve noted your RSVP as yes for 2 guests. See you there! 🎉', tool_calls: null },
            finish_reason: 'stop',
          }],
        });

      const result = await generateAIResponse(baseParams);

      // Should have dispatched the tool
      expect(mockDispatchTool).toHaveBeenCalledWith(
        'update_guest_rsvp',
        { attending: 'yes', guest_count: 2 },
        'g-456',
        'w-123',
      );

      // Should have made 2 Groq calls
      expect(mockGroqCreate).toHaveBeenCalledTimes(2);

      // Final response should be the text from the second call
      expect(result).toContain('noted your RSVP');
    });

    it('should handle multiple tool calls in one response', async () => {
      setupMockData();

      mockGroqCreate
        .mockResolvedValueOnce({
          choices: [{
            message: {
              content: null,
              tool_calls: [
                {
                  id: 'tc-1',
                  type: 'function',
                  function: { name: 'update_guest_rsvp', arguments: JSON.stringify({ attending: 'yes' }) },
                },
                {
                  id: 'tc-2',
                  type: 'function',
                  function: { name: 'update_guest_notes', arguments: JSON.stringify({ note: 'Very excited about the sangeet' }) },
                },
              ],
            },
            finish_reason: 'tool_calls',
          }],
        })
        .mockResolvedValueOnce({
          choices: [{
            message: { content: 'All set!', tool_calls: null },
            finish_reason: 'stop',
          }],
        });

      await generateAIResponse(baseParams);

      expect(mockDispatchTool).toHaveBeenCalledTimes(2);
      expect(mockDispatchTool).toHaveBeenCalledWith('update_guest_rsvp', { attending: 'yes' }, 'g-456', 'w-123');
      expect(mockDispatchTool).toHaveBeenCalledWith('update_guest_notes', { note: 'Very excited about the sangeet' }, 'g-456', 'w-123');
    });

    it('should still return text response even if tool dispatch fails', async () => {
      setupMockData();
      mockDispatchTool.mockResolvedValue({ success: false, error: 'DB connection failed' });

      mockGroqCreate
        .mockResolvedValueOnce({
          choices: [{
            message: {
              content: null,
              tool_calls: [{
                id: 'tc-1',
                type: 'function',
                function: { name: 'update_guest_rsvp', arguments: JSON.stringify({ attending: 'yes' }) },
              }],
            },
            finish_reason: 'tool_calls',
          }],
        })
        .mockResolvedValueOnce({
          choices: [{
            message: { content: 'I\'ve noted that. See you at the wedding!', tool_calls: null },
            finish_reason: 'stop',
          }],
        });

      const result = await generateAIResponse(baseParams);

      // Should still get a response despite tool failure
      expect(result).toContain('noted that');
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // FALLBACK RESPONSE
  // ══════════════════════════════════════════════════════════════════

  describe('fallback response', () => {
    it('should return fallback when Groq returns empty content with no tool calls', async () => {
      setupMockData();
      mockGroqCreate.mockResolvedValue({
        choices: [{ message: { content: null, tool_calls: null }, finish_reason: 'stop' }],
      });

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

    it('should attempt escalation when LLM call fails', async () => {
      setupMockData();
      mockGroqCreate.mockRejectedValue(new Error('API down'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      await generateAIResponse(baseParams);
      consoleSpy.mockRestore();
      warnSpy.mockRestore();
      logSpy.mockRestore();

      expect(mockDispatchTool).toHaveBeenCalledWith(
        'escalate_to_human',
        expect.objectContaining({ reason: expect.stringContaining('LLM call failed') }),
        'g-456',
        'w-123',
      );
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
    });

    it('should instruct not to make up information', async () => {
      setupMockData();
      await generateAIResponse(baseParams);

      const systemPrompt = mockGroqCreate.mock.calls[0][0].messages[0].content;
      expect(systemPrompt).toContain('NEVER make up information');
    });
  });
});
