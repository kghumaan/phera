import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockDeleteWeddingFully = vi.fn();
vi.mock('@/lib/demo/clone-demo-wedding', () => ({
  deleteWeddingFully: (...args: unknown[]) => mockDeleteWeddingFully(...args),
}));

import { cleanupAbandonedAnonDrafts, ANON_DRAFT_MAX_AGE_MS } from '@/lib/anon/cleanup-anon-drafts';
import { createFakeSupabase } from './mocks/fake-supabase';

const NOW = 1_800_000_000_000; // fixed clock
const OLD = new Date(NOW - ANON_DRAFT_MAX_AGE_MS - 60_000).toISOString();
const RECENT = new Date(NOW - 60_000).toISOString();

function makeClient(opts: {
  drafts?: Array<{ id: string; slug: string; created_by: string | null }>;
  ownedWeddings?: Array<{ created_by: string }>;
  usersById?: Record<string, { is_anonymous: boolean } | null>;
  listUsersPage?: Array<{ id: string; is_anonymous?: boolean; created_at?: string }>;
}) {
  const deletedUsers: string[] = [];
  // from('weddings') serves pass 1 (drafts) on the first call and pass 2's
  // owned-weddings check on later calls.
  let weddingsCalls = 0;
  const draftsFake = createFakeSupabase({ weddings: { data: opts.drafts ?? [] } });
  const ownedFake = createFakeSupabase({ weddings: { data: opts.ownedWeddings ?? [] } });
  const client = {
    from: (table: string) => {
      if (table === 'weddings') {
        weddingsCalls += 1;
        return (weddingsCalls === 1 ? draftsFake : ownedFake).client.from(table);
      }
      return draftsFake.client.from(table);
    },
    auth: {
      admin: {
        getUserById: async (id: string) => {
          const user = opts.usersById?.[id] ?? null;
          return user ? { data: { user: { id, ...user } }, error: null } : { data: { user: null }, error: { message: 'not found' } };
        },
        listUsers: async () => ({ data: { users: opts.listUsersPage ?? [] }, error: null }),
        deleteUser: async (id: string) => {
          deletedUsers.push(id);
          return { error: null };
        },
      },
    },
  };
  return { client: client as never, deletedUsers };
}

describe('cleanupAbandonedAnonDrafts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDeleteWeddingFully.mockResolvedValue(undefined);
  });

  it('deletes expired drafts owned by anonymous users (and the user), keeps signed-up owners', async () => {
    const { client, deletedUsers } = makeClient({
      drafts: [
        { id: 'w-anon', slug: 'slug-anon', created_by: 'anon-1' },
        { id: 'w-real', slug: 'slug-real', created_by: 'real-1' },
        { id: 'w-ghost', slug: 'slug-ghost', created_by: 'gone-1' },
      ],
      usersById: {
        'anon-1': { is_anonymous: true },
        'real-1': { is_anonymous: false },
        'gone-1': null,
      },
    });

    const result = await cleanupAbandonedAnonDrafts(client, NOW);

    expect(mockDeleteWeddingFully).toHaveBeenCalledTimes(1);
    expect(mockDeleteWeddingFully).toHaveBeenCalledWith(expect.anything(), 'w-anon', 'slug-anon');
    expect(deletedUsers).toContain('anon-1');
    expect(deletedUsers).not.toContain('real-1');
    expect(deletedUsers).not.toContain('gone-1');
    expect(result.draftsDeleted).toBe(1);
    expect(result.draftsScanned).toBe(3);
  });

  it('deletes aged anonymous users with no wedding, keeps recent ones and wedding owners', async () => {
    const { client, deletedUsers } = makeClient({
      drafts: [],
      ownedWeddings: [{ created_by: 'anon-owner' }],
      listUsersPage: [
        { id: 'anon-idle', is_anonymous: true, created_at: OLD },
        { id: 'anon-fresh', is_anonymous: true, created_at: RECENT },
        { id: 'anon-owner', is_anonymous: true, created_at: OLD },
        { id: 'real-user', is_anonymous: false, created_at: OLD },
      ],
    });

    const result = await cleanupAbandonedAnonDrafts(client, NOW);

    expect(deletedUsers).toEqual(['anon-idle']);
    expect(result.usersDeleted).toBe(1);
    expect(mockDeleteWeddingFully).not.toHaveBeenCalled();
  });

  it('records errors without aborting the sweep', async () => {
    mockDeleteWeddingFully.mockRejectedValue(new Error('boom'));
    const { client, deletedUsers } = makeClient({
      drafts: [{ id: 'w-anon', slug: 'slug-anon', created_by: 'anon-1' }],
      usersById: { 'anon-1': { is_anonymous: true } },
    });

    const result = await cleanupAbandonedAnonDrafts(client, NOW);

    expect(result.errors.some((e) => e.includes('boom'))).toBe(true);
    expect(result.draftsDeleted).toBe(0);
    expect(deletedUsers).toEqual([]); // wedding delete failed → user kept for a retry
  });
});
