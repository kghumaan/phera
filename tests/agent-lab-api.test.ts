import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockGetAuthenticatedClient = vi.fn();
const mockSeed = vi.fn();
const mockTeardown = vi.fn();
const mockDump = vi.fn();
const mockCreateClient = vi.fn();

vi.mock('@/lib/utils/auth-helpers', () => ({
  getAuthenticatedClient: () => mockGetAuthenticatedClient(),
}));
vi.mock('@supabase/supabase-js', () => ({
  createClient: (...args: unknown[]) => mockCreateClient(...args),
}));
vi.mock('@/lib/agent/lab/scenarios', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/agent/lab/scenarios')>();
  return {
    ...original,
    seedLabWedding: (...args: unknown[]) => mockSeed(...args),
    teardownLabWedding: (...args: unknown[]) => mockTeardown(...args),
    dumpLabState: (...args: unknown[]) => mockDump(...args),
  };
});
vi.mock('@/lib/agent/loop', () => ({ runAgentTurn: vi.fn() }));
vi.mock('@/lib/agent/providers/anthropic', () => ({ anthropicProvider: {} }));

import { POST as seedPOST, DELETE as seedDELETE } from '@/app/api/agent/lab/seed/route';
import { GET as stateGET } from '@/app/api/agent/lab/state/route';
import { POST as chatPOST } from '@/app/api/agent/lab/chat/route';
import { resetLabAuthCacheForTests } from '@/lib/agent/lab/auth';

const LAB_TOKEN = 'test-lab-token-123';

function req(url: string, init?: ConstructorParameters<typeof NextRequest>[1]) {
  return new NextRequest(`http://localhost${url}`, init);
}

function tokenHeaders(extra: Record<string, string> = {}) {
  return { Authorization: `Bearer ${LAB_TOKEN}`, 'Content-Type': 'application/json', ...extra };
}

describe('agent lab API auth + guards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetLabAuthCacheForTests();
    vi.stubEnv('AGENT_LAB_TOKEN', LAB_TOKEN);
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-key');
    mockCreateClient.mockReturnValue({ from: vi.fn() });
    mockGetAuthenticatedClient.mockResolvedValue({ supabase: null, user: null });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('404s every lab route when AGENT_LAB_TOKEN is not configured', async () => {
    vi.stubEnv('AGENT_LAB_TOKEN', '');
    const res = await seedPOST(
      req('/api/agent/lab/seed', { method: 'POST', body: JSON.stringify({ scenario: 'blank' }) })
    );
    expect(res.status).toBe(404);
    const stateRes = await stateGET(req('/api/agent/lab/state?weddingSlug=agent-lab-x'));
    expect(stateRes.status).toBe(404);
  });

  it('401s on a wrong bearer token', async () => {
    const res = await seedPOST(
      req('/api/agent/lab/seed', {
        method: 'POST',
        headers: { Authorization: 'Bearer wrong' },
        body: JSON.stringify({ scenario: 'blank' }),
      })
    );
    expect(res.status).toBe(401);
    expect(mockSeed).not.toHaveBeenCalled();
  });

  it('401s without a session or token', async () => {
    const res = await seedPOST(
      req('/api/agent/lab/seed', { method: 'POST', body: JSON.stringify({ scenario: 'blank' }) })
    );
    expect(res.status).toBe(401);
  });

  it('seeds via valid bearer token using the service client', async () => {
    mockSeed.mockResolvedValue({ slug: 'agent-lab-abc', weddingUuid: 'u1', scenario: 'blank', summary: {} });
    const res = await seedPOST(
      req('/api/agent/lab/seed', {
        method: 'POST',
        headers: tokenHeaders(),
        body: JSON.stringify({ scenario: 'blank' }),
      })
    );
    expect(res.status).toBe(200);
    expect((await res.json()).slug).toBe('agent-lab-abc');
    expect(mockCreateClient).toHaveBeenCalled();
  });

  it('rejects invalid scenarios', async () => {
    const res = await seedPOST(
      req('/api/agent/lab/seed', {
        method: 'POST',
        headers: tokenHeaders(),
        body: JSON.stringify({ scenario: 'production' }),
      })
    );
    expect(res.status).toBe(400);
  });

  it('refuses teardown of non-lab slugs', async () => {
    const res = await seedDELETE(
      req('/api/agent/lab/seed?weddingSlug=priya-rahul-2026', {
        method: 'DELETE',
        headers: tokenHeaders(),
      })
    );
    expect(res.status).toBe(400);
    expect(mockTeardown).not.toHaveBeenCalled();
  });

  it('refuses state dumps of non-lab slugs', async () => {
    const res = await stateGET(
      req('/api/agent/lab/state?weddingSlug=real-wedding', { headers: tokenHeaders() })
    );
    expect(res.status).toBe(400);
    expect(mockDump).not.toHaveBeenCalled();
  });

  it('refuses chat against non-lab slugs', async () => {
    const res = await chatPOST(
      req('/api/agent/lab/chat', {
        method: 'POST',
        headers: tokenHeaders(),
        body: JSON.stringify({ weddingSlug: 'real-wedding', message: 'hi' }),
      })
    );
    expect(res.status).toBe(400);
  });

  it('session mode works for logged-in users', async () => {
    mockGetAuthenticatedClient.mockResolvedValue({ supabase: { from: vi.fn() }, user: { id: 'user-9' } });
    mockSeed.mockResolvedValue({ slug: 'agent-lab-xyz', weddingUuid: 'u2', scenario: 'populated', summary: {} });
    const res = await seedPOST(
      req('/api/agent/lab/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: 'populated' }),
      })
    );
    expect(res.status).toBe(200);
    expect(mockSeed).toHaveBeenCalledWith(expect.anything(), {
      scenario: 'populated',
      ownerId: 'user-9',
    });
  });
});
