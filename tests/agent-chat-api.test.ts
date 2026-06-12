import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockGetAuthenticatedClient = vi.fn();
const mockVerifyWeddingAccess = vi.fn();
const mockRunAgentTurn = vi.fn();

vi.mock('@/lib/utils/auth-helpers', () => ({
  getAuthenticatedClient: () => mockGetAuthenticatedClient(),
}));
vi.mock('@/lib/utils/verify-wedding-access', () => ({
  verifyWeddingAccess: (...args: unknown[]) => mockVerifyWeddingAccess(...args),
}));
vi.mock('@/lib/agent/loop', () => ({
  runAgentTurn: (...args: unknown[]) => mockRunAgentTurn(...args),
}));
vi.mock('@/lib/agent/providers/anthropic', () => ({
  anthropicProvider: { streamTurn: vi.fn() },
}));

import { POST } from '@/app/api/agent/chat/route';
import { createFakeSupabase } from './mocks/fake-supabase';

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/agent/chat', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

function authedClient(tables: Record<string, { data?: unknown; count?: number | null }>) {
  const fake = createFakeSupabase(tables);
  mockGetAuthenticatedClient.mockResolvedValue({
    supabase: fake.client,
    user: { id: 'user-1' },
  });
  return fake;
}

const VALID_BODY = { weddingSlug: 'priya-rahul-2027', message: 'hello' };

describe('POST /api/agent/chat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRunAgentTurn.mockImplementation(async ({ onEvent }) => {
      onEvent({ type: 'text_delta', text: 'hi' });
      onEvent({ type: 'done' });
    });
  });

  it('returns 401 when unauthenticated', async () => {
    mockGetAuthenticatedClient.mockResolvedValue({ supabase: null, user: null });
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(401);
  });

  it('returns 400 when fields are missing', async () => {
    authedClient({});
    const res = await POST(makeRequest({ weddingSlug: 'x' }));
    expect(res.status).toBe(400);
  });

  it('returns 404 when the wedding does not exist', async () => {
    authedClient({ weddings: { data: null } });
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(404);
  });

  it('returns 403 when the user lacks wedding access', async () => {
    authedClient({ weddings: { data: { id: 'uuid-1', slug: 'priya-rahul-2027' } } });
    mockVerifyWeddingAccess.mockResolvedValue(false);
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(403);
    expect(mockRunAgentTurn).not.toHaveBeenCalled();
  });

  it('streams SSE events and creates a conversation for authorized users', async () => {
    const fake = authedClient({
      weddings: { data: { id: 'uuid-1', slug: 'priya-rahul-2027' } },
      agent_conversations: { data: { id: 'conv-9' } },
    });
    mockVerifyWeddingAccess.mockResolvedValue(true);

    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('text/event-stream');

    const text = await new Response(res.body).text();
    const events = text
      .split('\n\n')
      .filter((f) => f.startsWith('data: '))
      .map((f) => JSON.parse(f.slice(6)));

    expect(events[0]).toEqual({ type: 'conversation', conversationId: 'conv-9' });
    expect(events).toContainEqual({ type: 'text_delta', text: 'hi' });
    expect(events.at(-1)).toEqual({ type: 'done' });

    expect(fake.inserts['agent_conversations']).toHaveLength(1);
    expect(mockRunAgentTurn).toHaveBeenCalledWith(
      expect.objectContaining({
        weddingSlug: 'priya-rahul-2027',
        weddingUuid: 'uuid-1',
        userId: 'user-1',
        conversationId: 'conv-9',
        userMessage: 'hello',
      })
    );
  });

  it('emits an SSE error event when the agent turn throws', async () => {
    authedClient({
      weddings: { data: { id: 'uuid-1', slug: 'priya-rahul-2027' } },
      agent_conversations: { data: { id: 'conv-9' } },
    });
    mockVerifyWeddingAccess.mockResolvedValue(true);
    mockRunAgentTurn.mockRejectedValue(new Error('provider exploded'));

    const res = await POST(makeRequest(VALID_BODY));
    const text = await new Response(res.body).text();
    expect(text).toContain('"type":"error"');
    // Internal error details must not leak to the client
    expect(text).not.toContain('provider exploded');
  });
});
