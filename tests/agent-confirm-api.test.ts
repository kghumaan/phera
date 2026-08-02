import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockGetAuthenticatedClient = vi.fn();
const mockVerifyWeddingAccess = vi.fn();
const mockResolveAgentAction = vi.fn();

vi.mock('@/lib/utils/auth-helpers', () => ({
  getAuthenticatedClient: () => mockGetAuthenticatedClient(),
}));
vi.mock('@/lib/utils/verify-wedding-access', () => ({
  verifyWeddingAccess: (...args: unknown[]) => mockVerifyWeddingAccess(...args),
}));
vi.mock('@/lib/agent/confirm', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/agent/confirm')>();
  return {
    ...original,
    resolveAgentAction: (...args: unknown[]) => mockResolveAgentAction(...args),
  };
});
vi.mock('@/lib/agent/providers/anthropic', () => ({ anthropicProvider: {} }));
vi.mock('@/lib/supabase/client', () => ({
  supabase: { from: vi.fn() },
  publicSupabase: { from: vi.fn() },
}));

import { POST } from '@/app/api/agent/confirm/route';
import { createFakeSupabase } from './mocks/fake-supabase';

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/agent/confirm', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

function authed(tables: Record<string, { data?: unknown }>) {
  const fake = createFakeSupabase(tables);
  mockGetAuthenticatedClient.mockResolvedValue({ supabase: fake.client, user: { id: 'user-1' } });
  return fake;
}

describe('POST /api/agent/confirm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveAgentAction.mockImplementation(async ({ onEvent }) => {
      onEvent({ type: 'text_delta', text: 'done!' });
      onEvent({ type: 'done' });
    });
  });

  it('401s when unauthenticated', async () => {
    mockGetAuthenticatedClient.mockResolvedValue({ supabase: null, user: null });
    const res = await POST(makeRequest({ actionId: 'a1', approve: true }));
    expect(res.status).toBe(401);
  });

  it('400s on missing fields', async () => {
    authed({});
    const res = await POST(makeRequest({ actionId: 'a1' }));
    expect(res.status).toBe(400);
  });

  it('404s when the action does not exist', async () => {
    authed({ agent_actions: { data: null } });
    const res = await POST(makeRequest({ actionId: 'a1', approve: true }));
    expect(res.status).toBe(404);
  });

  it('403s without wedding access', async () => {
    authed({
      agent_actions: { data: { id: 'a1', wedding_id: 'w-slug', status: 'pending' } },
      weddings: { data: { id: 'uuid-1' } },
    });
    mockVerifyWeddingAccess.mockResolvedValue(false);
    const res = await POST(makeRequest({ actionId: 'a1', approve: true }));
    expect(res.status).toBe(403);
    expect(mockResolveAgentAction).not.toHaveBeenCalled();
  });

  it('409s when the action is already resolved', async () => {
    authed({
      agent_actions: { data: { id: 'a1', wedding_id: 'w-slug', status: 'confirmed' } },
      weddings: { data: { id: 'uuid-1' } },
    });
    mockVerifyWeddingAccess.mockResolvedValue(true);
    const res = await POST(makeRequest({ actionId: 'a1', approve: true }));
    expect(res.status).toBe(409);
  });

  it('streams the acknowledgment turn on success', async () => {
    authed({
      agent_actions: { data: { id: 'a1', wedding_id: 'w-slug', status: 'pending' } },
      weddings: { data: { id: 'uuid-1' } },
    });
    mockVerifyWeddingAccess.mockResolvedValue(true);
    const res = await POST(makeRequest({ actionId: 'a1', approve: false }));
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('text/event-stream');
    const text = await new Response(res.body).text();
    expect(text).toContain('"type":"text_delta"');
    expect(mockResolveAgentAction).toHaveBeenCalledWith(
      expect.objectContaining({ actionId: 'a1', approve: false, userId: 'user-1' })
    );
  });
});
