import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockGetAuthenticatedClient = vi.fn();
const mockCreateWedding = vi.fn();
const mockSpeechCreate = vi.fn();

vi.mock('@/lib/utils/auth-helpers', () => ({
  getAuthenticatedClient: () => mockGetAuthenticatedClient(),
}));
vi.mock('@/lib/utils/rate-limiter', () => ({
  checkRateLimit: () => null,
}));
vi.mock('@/lib/supabase/wedding-service', () => ({
  WeddingService: class {
    createWedding = (...args: unknown[]) => mockCreateWedding(...args);
  },
}));
vi.mock('groq-sdk', () => ({
  default: class MockGroq {
    audio = { speech: { create: (...args: unknown[]) => mockSpeechCreate(...args) } };
  },
}));

import { POST as onboardStart } from '@/app/api/agent/onboard/start/route';
import { POST as ttsPost } from '@/app/api/agent/tts/route';
import { createFakeSupabase } from './mocks/fake-supabase';
import { DRAFT_COUPLE_NAME } from '@/lib/constants/wedding-placeholders';

function ttsRequest(body: unknown) {
  return new NextRequest('http://localhost/api/agent/tts', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

function onboardRequest() {
  return new NextRequest('http://localhost/api/agent/onboard/start', { method: 'POST' });
}

describe('POST /api/agent/onboard/start', () => {
  beforeEach(() => vi.clearAllMocks());

  it('401s when unauthenticated', async () => {
    mockGetAuthenticatedClient.mockResolvedValue({ supabase: null, user: null });
    const res = await onboardStart(onboardRequest());
    expect(res.status).toBe(401);
  });

  it('returns the existing wedding instead of creating a duplicate', async () => {
    const fake = createFakeSupabase({
      weddings: { data: [{ slug: 'priya-rahul-2027', couple_name: 'Priya & Rahul', status: 'published' }] },
    });
    mockGetAuthenticatedClient.mockResolvedValue({ supabase: fake.client, user: { id: 'u1' } });
    const res = await onboardStart(onboardRequest());
    const data = await res.json();
    // fresh:false — this wedding holds real details, so the caller must NOT
    // replay the scripted welcome onboarding over it.
    expect(data).toEqual({ slug: 'priya-rahul-2027', existing: true, fresh: false });
    expect(mockCreateWedding).not.toHaveBeenCalled();
  });

  it('reports an untouched draft as fresh, so the welcome flow still runs', async () => {
    // The landing prewarm creates the draft before the visitor submits, so by
    // the time they launch, their own empty draft comes back as `existing` —
    // it must still be treated as fresh.
    const fake = createFakeSupabase({
      weddings: { data: [{ slug: 'draft-uuid', couple_name: DRAFT_COUPLE_NAME, status: 'draft' }] },
    });
    mockGetAuthenticatedClient.mockResolvedValue({ supabase: fake.client, user: { id: 'u1' } });
    const res = await onboardStart(onboardRequest());
    const data = await res.json();
    expect(data).toEqual({ slug: 'draft-uuid', existing: true, fresh: true });
    expect(mockCreateWedding).not.toHaveBeenCalled();
  });

  it('creates a draft wedding and marks onboarding complete', async () => {
    const fake = createFakeSupabase({ weddings: { data: [] } });
    mockGetAuthenticatedClient.mockResolvedValue({ supabase: fake.client, user: { id: 'u1' } });
    mockCreateWedding.mockResolvedValue({ slug: 'new-wedding-abc123' });

    const res = await onboardStart(onboardRequest());
    const data = await res.json();
    expect(data.slug).toBe('new-wedding-abc123');

    const created = mockCreateWedding.mock.calls[0][0] as Record<string, unknown>;
    expect(created.created_by).toBe('u1');
    expect(created.status).toBe('draft');
    // Draft slugs are unguessable raw UUIDs (renamed once the couple's names
    // are known) — see app/api/agent/onboard/start/route.ts.
    expect(String(created.slug)).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(created.venue_name).toBe('Venue TBD');

    const settingsUpsert = (fake.upserts['user_settings'] ?? []) as Array<Record<string, unknown>>;
    expect(settingsUpsert[0]).toMatchObject({ user_id: 'u1', onboarding_completed: true });
  });

  it('500s when wedding creation fails', async () => {
    const fake = createFakeSupabase({ weddings: { data: [] } });
    mockGetAuthenticatedClient.mockResolvedValue({ supabase: fake.client, user: { id: 'u1' } });
    mockCreateWedding.mockResolvedValue(null);
    const res = await onboardStart(onboardRequest());
    expect(res.status).toBe(500);
  });
});

describe('POST /api/agent/tts', () => {
  beforeEach(() => vi.clearAllMocks());

  it('401s when unauthenticated', async () => {
    mockGetAuthenticatedClient.mockResolvedValue({ supabase: null, user: null });
    const res = await ttsPost(ttsRequest({ text: 'hello' }));
    expect(res.status).toBe(401);
  });

  it('400s on empty text', async () => {
    mockGetAuthenticatedClient.mockResolvedValue({ supabase: {}, user: { id: 'u1' } });
    const res = await ttsPost(ttsRequest({ text: '  ' }));
    expect(res.status).toBe(400);
  });

  it('returns audio/mpeg for valid text', async () => {
    mockGetAuthenticatedClient.mockResolvedValue({ supabase: {}, user: { id: 'u1' } });
    mockSpeechCreate.mockResolvedValue({ arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer });
    const res = await ttsPost(ttsRequest({ text: 'Welcome to your wedding' }));
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('audio/mpeg');
    const call = mockSpeechCreate.mock.calls[0][0] as Record<string, unknown>;
    expect(call.model).toBe('canopylabs/orpheus-v1-english');
    expect(call.response_format).toBe('mp3');
  });
});
