import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Regression tests for wedding-scoped authorization.
 *
 * Two failure modes these lock down, both found in review of the API auth sweep:
 *  1. A route verified access against one identifier (the wedding UUID) and then
 *     did its real work against another, unverified one (a slug from the body).
 *  2. The UUID-vs-slug heuristic ("if it looks like a UUID, look it up by id")
 *     locked owners out of draft weddings — whose slug IS a raw UUID.
 */

/** Supabase stub that actually honours .eq() — the shared fake ignores filters,
 *  which is precisely what a scoping test cannot afford to do. */
function filteringSupabase(tables: Record<string, Record<string, unknown>[]>) {
  const from = (table: string) => {
    const filters: [string, unknown][] = [];
    const builder: Record<string, unknown> = {};
    const rows = () =>
      (tables[table] ?? []).filter((row) => filters.every(([col, val]) => row[col] === val));

    builder.select = () => builder;
    builder.eq = (col: string, val: unknown) => {
      filters.push([col, val]);
      return builder;
    };
    builder.maybeSingle = () => Promise.resolve({ data: rows()[0] ?? null, error: null });
    builder.single = () =>
      Promise.resolve(
        rows().length === 1
          ? { data: rows()[0], error: null }
          : { data: null, error: { message: 'no rows' } }
      );
    return builder;
  };
  return { from } as unknown as SupabaseClient;
}

import { resolveWeddingAccess } from '@/lib/utils/verify-wedding-access';

const OWNER = 'user-owner';
const STRANGER = 'user-stranger';

// A draft wedding minted by /api/agent/onboard/start: the SLUG is a raw UUID,
// distinct from the row's id. This is the shape that broke the old heuristic.
const DRAFT_SLUG = '11111111-1111-4111-8111-111111111111';
const DRAFT_ID = '22222222-2222-4222-8222-222222222222';

const db = () =>
  filteringSupabase({
    weddings: [
      { id: DRAFT_ID, slug: DRAFT_SLUG, created_by: OWNER },
      { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', slug: 'priya-rahul-2027', created_by: OWNER },
      { id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', slug: 'someone-else-2027', created_by: STRANGER },
    ],
    wedding_admins: [{ id: 'adm1', wedding_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', user_id: 'user-admin' }],
  });

describe('resolveWeddingAccess', () => {
  beforeEach(() => vi.clearAllMocks());

  it('resolves by id and hands back the canonical slug', async () => {
    // The whole point: a caller that authorized a UUID must take the slug from
    // the row it authorized, never from the request body.
    expect(await resolveWeddingAccess(db(), OWNER, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')).toEqual({
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      slug: 'priya-rahul-2027',
    });
  });

  it('resolves by slug', async () => {
    expect(await resolveWeddingAccess(db(), OWNER, 'priya-rahul-2027')).toEqual({
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      slug: 'priya-rahul-2027',
    });
  });

  it('resolves a draft wedding whose slug is itself a UUID', async () => {
    // Shape alone can't classify this: it looks like an id, but it's a slug.
    // The old heuristic looked it up by id, found nothing, and 403'd the owner
    // out of their own draft — the whole landing chat-first flow.
    expect(await resolveWeddingAccess(db(), OWNER, DRAFT_SLUG)).toEqual({
      id: DRAFT_ID,
      slug: DRAFT_SLUG,
    });
  });

  it('grants access to a wedding admin', async () => {
    expect(await resolveWeddingAccess(db(), 'user-admin', 'someone-else-2027')).toEqual({
      id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      slug: 'someone-else-2027',
    });
  });

  it("denies a stranger another couple's wedding", async () => {
    expect(await resolveWeddingAccess(db(), STRANGER, 'priya-rahul-2027')).toBeNull();
  });

  it('denies an unknown wedding', async () => {
    expect(await resolveWeddingAccess(db(), OWNER, 'no-such-wedding')).toBeNull();
  });
});
