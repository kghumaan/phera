import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Top-level supabase mock ─────────────────────────────────────────
//
// Both routes use the service-role createClient at module scope (NOT the
// per-request getAuthenticatedClient pattern), so we need to control what
// `from(table).select(...).eq(...)...` returns at chain end.
//
// Strategy: a per-test `tableHandlers` map. Each handler builds a chain
// whose terminal method (single / maybeSingle / awaiting the chain itself)
// resolves with the data we want for that specific call.

type ChainResult = { data: unknown; error: unknown };
type TableHandler = () => ChainResult;

let tableHandlers: Record<string, TableHandler[]> = {};

function nextHandler(table: string): TableHandler {
  const queue = tableHandlers[table];
  if (!queue || queue.length === 0) {
    throw new Error(`No handler queued for table "${table}"`);
  }
  return queue.shift()!;
}

function makeChain(handler: TableHandler) {
  const chain: Record<string, unknown> = {};
  const passthrough = ['select', 'eq', 'order', 'limit', 'in', 'gte', 'lte', 'neq', 'is', 'not'];
  for (const m of passthrough) chain[m] = vi.fn().mockReturnValue(chain);

  chain.single = vi.fn().mockImplementation(() => Promise.resolve(handler()));
  chain.maybeSingle = vi.fn().mockImplementation(() => Promise.resolve(handler()));
  chain.then = vi.fn().mockImplementation((resolve: (v: ChainResult) => unknown) => resolve(handler()));
  return chain;
}

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn((table: string) => makeChain(nextHandler(table))),
  })),
}));

// Rate-limiter: stub to never block. Each route calls checkRateLimit at the
// top — letting it through means the rest of the route runs. A separate
// describe block flips the stub to verify the limiter wires up correctly.
const mockCheckRateLimit = vi.fn();
vi.mock('@/lib/utils/rate-limiter', () => ({
  checkRateLimit: (...args: unknown[]) => mockCheckRateLimit(...args),
}));

// ─── Imports MUST come after mocks ───────────────────────────────────

import { POST as verifyPasswordPOST } from '@/app/api/access/verify-password/route';
import { GET as eventsGET } from '@/app/api/access/events/[weddingSlug]/route';

// ─── Test helpers ────────────────────────────────────────────────────

function jsonRequest(body: unknown) {
  return {
    json: () => Promise.resolve(body),
  } as never;
}

function urlRequest(url: string) {
  const u = new URL(url);
  return {
    nextUrl: u,
  } as never;
}

function queue(table: string, ...handlers: TableHandler[]) {
  tableHandlers[table] = (tableHandlers[table] || []).concat(handlers);
}

beforeEach(() => {
  tableHandlers = {};
  vi.clearAllMocks();
  mockCheckRateLimit.mockReturnValue(null);
});

// ─── /api/access/verify-password ─────────────────────────────────────

describe('POST /api/access/verify-password', () => {
  it('rejects requests with missing fields', async () => {
    const res = await verifyPasswordPOST(jsonRequest({ weddingSlug: 'priya-rahul' }));
    expect(res.status).toBe(400);
  });

  it('rejects requests where password is not a string', async () => {
    const res = await verifyPasswordPOST(jsonRequest({ weddingSlug: 'priya-rahul', password: 1234 }));
    expect(res.status).toBe(400);
  });

  it('returns 404 when wedding does not exist', async () => {
    queue('weddings', () => ({ data: null, error: { message: 'no rows' } }));
    const res = await verifyPasswordPOST(jsonRequest({ weddingSlug: 'unknown', password: 'open-sesame' }));
    expect(res.status).toBe(404);
  });

  it('returns 401 with valid:false when no password is configured for the wedding', async () => {
    queue('weddings', () => ({ data: { id: 'wed-uuid-1' }, error: null }));
    queue('wedding_settings', () => ({ data: null, error: null }));
    const res = await verifyPasswordPOST(jsonRequest({ weddingSlug: 'priya-rahul', password: 'open-sesame' }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.valid).toBe(false);
  });

  it('returns 401 with valid:false on wrong password', async () => {
    queue('weddings', () => ({ data: { id: 'wed-uuid-1' }, error: null }));
    queue('wedding_settings', () => ({ data: { wedding_password: 'correct-horse' }, error: null }));
    const res = await verifyPasswordPOST(jsonRequest({ weddingSlug: 'priya-rahul', password: 'WRONG' }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.valid).toBe(false);
  });

  it('returns valid:true on correct password', async () => {
    queue('weddings', () => ({ data: { id: 'wed-uuid-1' }, error: null }));
    queue('wedding_settings', () => ({ data: { wedding_password: 'correct-horse' }, error: null }));
    const res = await verifyPasswordPOST(jsonRequest({ weddingSlug: 'priya-rahul', password: 'correct-horse' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.valid).toBe(true);
  });

  it('does case-sensitive password matching', async () => {
    queue('weddings', () => ({ data: { id: 'wed-uuid-1' }, error: null }));
    queue('wedding_settings', () => ({ data: { wedding_password: 'CorrectHorse' }, error: null }));
    const res = await verifyPasswordPOST(jsonRequest({ weddingSlug: 'priya-rahul', password: 'correcthorse' }));
    expect(res.status).toBe(401);
  });

  it('honours the rate limiter — returns the limiter response when blocked', async () => {
    mockCheckRateLimit.mockReturnValueOnce(
      new Response(JSON.stringify({ error: 'Too many attempts' }), { status: 429 }),
    );
    const res = await verifyPasswordPOST(jsonRequest({ weddingSlug: 'priya-rahul', password: 'x' }));
    expect(res.status).toBe(429);
  });
});

// ─── /api/access/events/[weddingSlug] ────────────────────────────────

describe('GET /api/access/events/[weddingSlug]', () => {
  const params = (slug: string) => Promise.resolve({ weddingSlug: slug });

  it('returns 400 when guestId is missing', async () => {
    const res = await eventsGET(
      urlRequest('https://x.test/api/access/events/priya-rahul'),
      { params: params('priya-rahul') },
    );
    expect(res.status).toBe(400);
  });

  it('returns 404 when guest does not exist', async () => {
    queue('guests', () => ({ data: null, error: null }));
    const res = await eventsGET(
      urlRequest('https://x.test/api/access/events/priya-rahul?guestId=g1'),
      { params: params('priya-rahul') },
    );
    expect(res.status).toBe(404);
  });

  it('returns 404 when guest belongs to a different wedding', async () => {
    queue('guests', () => ({ data: { id: 'g1', wedding_id: 'other-wedding' }, error: null }));
    const res = await eventsGET(
      urlRequest('https://x.test/api/access/events/priya-rahul?guestId=g1'),
      { params: params('priya-rahul') },
    );
    expect(res.status).toBe(404);
  });

  it('returns all event ids when the guest has no opt-out rows (default-true contract)', async () => {
    queue('guests', () => ({ data: { id: 'g1', wedding_id: 'priya-rahul' }, error: null }));
    queue('weddings', () => ({ data: { id: 'wed-uuid-1' }, error: null }));
    queue('wedding_events', () => ({ data: [{ id: 'e1' }, { id: 'e2' }, { id: 'e3' }], error: null }));
    queue('guest_event_access', () => ({ data: [], error: null }));

    const res = await eventsGET(
      urlRequest('https://x.test/api/access/events/priya-rahul?guestId=g1'),
      { params: params('priya-rahul') },
    );
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.invitedEventIds).toEqual(['e1', 'e2', 'e3']);
  });

  it('filters out events explicitly marked invited=false for the guest', async () => {
    queue('guests', () => ({ data: { id: 'g1', wedding_id: 'priya-rahul' }, error: null }));
    queue('weddings', () => ({ data: { id: 'wed-uuid-1' }, error: null }));
    queue('wedding_events', () => ({ data: [{ id: 'e1' }, { id: 'e2' }, { id: 'e3' }], error: null }));
    queue('guest_event_access', () => ({
      data: [
        { event_id: 'e1', invited: false },
        { event_id: 'e3', invited: true }, // redundant true → no-op
      ],
      error: null,
    }));

    const res = await eventsGET(
      urlRequest('https://x.test/api/access/events/priya-rahul?guestId=g1'),
      { params: params('priya-rahul') },
    );
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.invitedEventIds).toEqual(['e2', 'e3']);
  });

  it('falls back to all events when guest_event_access table errors (pre-migration safety)', async () => {
    queue('guests', () => ({ data: { id: 'g1', wedding_id: 'priya-rahul' }, error: null }));
    queue('weddings', () => ({ data: { id: 'wed-uuid-1' }, error: null }));
    queue('wedding_events', () => ({ data: [{ id: 'e1' }, { id: 'e2' }], error: null }));
    queue('guest_event_access', () => ({ data: null, error: { message: 'relation does not exist' } }));

    const res = await eventsGET(
      urlRequest('https://x.test/api/access/events/priya-rahul?guestId=g1'),
      { params: params('priya-rahul') },
    );
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.invitedEventIds).toEqual(['e1', 'e2']);
  });

  it('returns 500 when the events query itself errors', async () => {
    queue('guests', () => ({ data: { id: 'g1', wedding_id: 'priya-rahul' }, error: null }));
    queue('weddings', () => ({ data: { id: 'wed-uuid-1' }, error: null }));
    queue('wedding_events', () => ({ data: null, error: { message: 'boom' } }));

    const res = await eventsGET(
      urlRequest('https://x.test/api/access/events/priya-rahul?guestId=g1'),
      { params: params('priya-rahul') },
    );
    expect(res.status).toBe(500);
  });

  it('hides ALL events from a guest who has been opted out of every one', async () => {
    queue('guests', () => ({ data: { id: 'g1', wedding_id: 'priya-rahul' }, error: null }));
    queue('weddings', () => ({ data: { id: 'wed-uuid-1' }, error: null }));
    queue('wedding_events', () => ({ data: [{ id: 'e1' }, { id: 'e2' }], error: null }));
    queue('guest_event_access', () => ({
      data: [
        { event_id: 'e1', invited: false },
        { event_id: 'e2', invited: false },
      ],
      error: null,
    }));

    const res = await eventsGET(
      urlRequest('https://x.test/api/access/events/priya-rahul?guestId=g1'),
      { params: params('priya-rahul') },
    );
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.invitedEventIds).toEqual([]);
  });
});
