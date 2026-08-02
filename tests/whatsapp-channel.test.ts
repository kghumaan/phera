import { describe, it, expect, vi, afterEach } from 'vitest';
import { whapiClientForToken } from '@/lib/vendors/whapi-client';
import { normalizePhone } from '@/lib/whatsapp/groups-service';

type Call = { url: string; init: RequestInit | undefined };

/** Minimal Response-like stub (only the bits whapi-client uses). */
function jsonRes(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as unknown as Response;
}

function mockFetch(body: unknown): { calls: Call[] } {
  const calls: Call[] = [];
  const fn = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(input), init });
    return jsonRes(body);
  });
  global.fetch = fn as unknown as typeof fetch;
  return { calls };
}

const ORIG_FETCH = global.fetch;
afterEach(() => {
  global.fetch = ORIG_FETCH;
  vi.restoreAllMocks();
});

describe('normalizePhone', () => {
  it('strips spaces, punctuation, and the leading +', () => {
    expect(normalizePhone('+91 (98765) 43210')).toBe('919876543210');
  });
  it('handles empty / junk input', () => {
    expect(normalizePhone('')).toBe('');
    expect(normalizePhone('abc')).toBe('');
  });
});

describe('whapiClientForToken — per-channel isolation', () => {
  it("authenticates with the couple's channel token, NOT the shared env token", async () => {
    const { calls } = mockFetch({ group_id: '123@g.us' });
    const { groupId } = await whapiClientForToken('couple-token-xyz').createGroup('Priya & Rahul', [
      '919876543210',
    ]);
    expect(groupId).toBe('123@g.us');
    expect(calls[0].url).toBe('https://gate.whapi.cloud/groups');
    const headers = calls[0].init?.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer couple-token-xyz');
    expect(JSON.parse(calls[0].init?.body as string)).toEqual({
      subject: 'Priya & Rahul',
      participants: ['919876543210'],
    });
  });

  it('createGroup falls back to `id` when `group_id` is absent', async () => {
    mockFetch({ id: 'gid@g.us' });
    const { groupId } = await whapiClientForToken('t').createGroup('x', ['1']);
    expect(groupId).toBe('gid@g.us');
  });

  it('getInviteLink builds a chat.whatsapp.com URL from an invite_code', async () => {
    mockFetch({ invite_code: 'ABC123' });
    const link = await whapiClientForToken('t').getInviteLink('123@g.us');
    expect(link).toBe('https://chat.whatsapp.com/ABC123');
  });

  it('getHealth reads a nested status.text', async () => {
    mockFetch({ status: { text: 'AUTH' } });
    const { status } = await whapiClientForToken('t').getHealth();
    expect(status).toBe('AUTH');
  });
});
