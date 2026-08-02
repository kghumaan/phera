/**
 * Unit tests for the WhatsApp admin gate.
 *
 * Verifies the inbound message router:
 *   - returns null for non-admin phones (so guest pipeline runs)
 *   - matches admin rows across phone formats (+digits, raw, last10)
 *   - opens a `bot_admin_log` pending row before calling the handler
 *   - closes the log row with handler result + prefixes reply with ADMIN BOT
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mocks (must precede target imports) ──────────────────────────────

// Mock GoogleGenAI so admin-handler doesn't try to call Gemini in tests.
vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: {
      generateContent: vi.fn(),
    },
  })),
}));

// admin-handler is mocked so we can assert call args + force a known result
// without exercising Gemini.
const mockHandle = vi.fn();
vi.mock('@/lib/whatsapp/admin-handler', () => ({
  handleAdminCommand: (...args: unknown[]) => mockHandle(...args),
}));

interface BotAdminLike {
  id: string;
  wedding_id: string;
  name: string;
  phone: string;
}

type Row = Record<string, unknown>;

interface Capture {
  inserts: Array<{ table: string; row: Row }>;
  updates: Array<{ table: string; patch: Row; where: Record<string, unknown> }>;
  selects: Array<{ table: string }>;
}
let capture: Capture;

// Rows the mock will return for `select(...).in(...)` lookups.
let adminRowsByPhoneVariant: Record<string, BotAdminLike> = {};
let fuzzyAdminRow: BotAdminLike | null = null;
let logIdCounter = 0;

interface MockChain {
  insert: (row: Row) => { select: () => { single: () => Promise<{ data: { id: string }; error: null }> } };
  update: (patch: Row) => {
    eq: (col: string, val: unknown) => Promise<{ data: null; error: null }>;
  };
  select: () => {
    in: (col: string, variants: string[]) => { limit: () => Promise<{ data: BotAdminLike[]; error: null }> };
    ilike: () => { limit: () => Promise<{ data: BotAdminLike[]; error: null }> };
  };
}

function makeMockClient() {
  return {
    from(table: string): MockChain {
      capture.selects.push({ table });
      return {
        insert: (row: Row) => {
          capture.inserts.push({ table, row });
          return {
            select: () => ({
              single: async () => ({
                data: { id: `${table}-id-${++logIdCounter}` },
                error: null,
              }),
            }),
          };
        },
        update: (patch: Row) => ({
          eq: (col: string, val: unknown) => {
            capture.updates.push({ table, patch, where: { [col]: val } });
            return Promise.resolve({ data: null, error: null });
          },
        }),
        select: () => ({
          in: (_col: string, variants: string[]) => ({
            limit: async () => {
              for (const v of variants) {
                if (adminRowsByPhoneVariant[v]) {
                  return { data: [adminRowsByPhoneVariant[v]], error: null };
                }
              }
              return { data: [], error: null };
            },
          }),
          ilike: () => ({
            limit: async () => ({
              data: fuzzyAdminRow ? [fuzzyAdminRow] : [],
              error: null,
            }),
          }),
        }),
      };
    },
  };
}

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn().mockImplementation(() => makeMockClient()),
}));

// ─── Import after mocks ───────────────────────────────────────────────

import { tryHandleAdminMessage, ADMIN_REPLY_PREFIX } from '@/lib/whatsapp/admin-router';

// ─── Tests ────────────────────────────────────────────────────────────

describe('admin gate (tryHandleAdminMessage)', () => {
  beforeEach(() => {
    capture = { inserts: [], updates: [], selects: [] };
    adminRowsByPhoneVariant = {};
    fuzzyAdminRow = null;
    logIdCounter = 0;
    mockHandle.mockReset();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.local';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key';
  });

  it('returns null when no admin matches the sender phone (guest pipeline runs)', async () => {
    const result = await tryHandleAdminMessage({
      senderPhone: '13177302557',
      messageText: 'Hi! When does the shuttle leave?',
    });
    expect(result).toBeNull();
    expect(mockHandle).not.toHaveBeenCalled();
    expect(capture.inserts).toHaveLength(0);
  });

  it('matches an admin saved with a leading + and short-circuits the guest path', async () => {
    adminRowsByPhoneVariant['+13177302557'] = {
      id: 'admin-1',
      wedding_id: 'priya-rahul-2026',
      name: 'Priya',
      phone: '+13177302557',
    };
    mockHandle.mockResolvedValue({
      replyText: 'Saved.',
      summary: 'Added knowledge entry "Brunch spot"',
      actionType: 'add_knowledge_entry',
      status: 'success',
    });

    const result = await tryHandleAdminMessage({
      senderPhone: '13177302557',
      messageText: 'Add to KB: brunch at Café Mocha',
    });

    expect(result).not.toBeNull();
    expect(result!.weddingSlug).toBe('priya-rahul-2026');
    expect(result!.adminName).toBe('Priya');
    expect(result!.reply.startsWith(ADMIN_REPLY_PREFIX)).toBe(true);
    expect(result!.reply).toContain('Saved.');

    // handler called with the right context
    expect(mockHandle).toHaveBeenCalledTimes(1);
    expect(mockHandle.mock.calls[0][0]).toMatchObject({
      weddingSlug: 'priya-rahul-2026',
      adminName: 'Priya',
      adminPhone: '+13177302557',
      messageText: 'Add to KB: brunch at Café Mocha',
    });

    // pending log row inserted, then closed with handler result
    const log = capture.inserts.find((i) => i.table === 'bot_admin_log');
    expect(log).toBeTruthy();
    expect(log!.row).toMatchObject({
      wedding_id: 'priya-rahul-2026',
      admin_phone: '+13177302557',
      status: 'pending',
      action_type: 'inbound',
    });

    const closeUpdate = capture.updates.find((u) => u.table === 'bot_admin_log');
    expect(closeUpdate).toBeTruthy();
    expect(closeUpdate!.patch).toMatchObject({
      action_type: 'add_knowledge_entry',
      status: 'success',
    });
  });

  it('falls back to last-10-digits ILIKE when no exact phone variant matches', async () => {
    fuzzyAdminRow = {
      id: 'admin-2',
      wedding_id: 'maya-arjun-2026',
      name: 'Maya',
      phone: '7302557', // saved without country code
    };
    mockHandle.mockResolvedValue({
      replyText: 'Got it.',
      summary: 'Conversational reply',
      actionType: 'respond_only',
      status: 'success',
    });

    const result = await tryHandleAdminMessage({
      senderPhone: '13177302557',
      messageText: 'hello bot',
    });

    expect(result).not.toBeNull();
    expect(result!.weddingSlug).toBe('maya-arjun-2026');
    expect(mockHandle).toHaveBeenCalledTimes(1);
  });

  it('records a failed log row when the handler throws', async () => {
    adminRowsByPhoneVariant['13177302557'] = {
      id: 'admin-3',
      wedding_id: 'kabir-2026',
      name: 'Kabir',
      phone: '13177302557',
    };
    mockHandle.mockRejectedValue(new Error('LLM fell over'));

    const result = await tryHandleAdminMessage({
      senderPhone: '13177302557',
      messageText: 'whatever',
    });

    expect(result).not.toBeNull();
    expect(result!.reply).toContain('LLM fell over');
    const closeUpdate = capture.updates.find((u) => u.table === 'bot_admin_log');
    expect(closeUpdate).toBeTruthy();
    expect(closeUpdate!.patch).toMatchObject({
      status: 'failed',
      error_message: 'LLM fell over',
    });
  });
});
