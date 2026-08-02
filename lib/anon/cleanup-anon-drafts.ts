import { createClient } from '@supabase/supabase-js';
import { deleteWeddingFully } from '@/lib/demo/clone-demo-wedding';

/**
 * Cleanup for the anonymous (pre-signup) landing-page chat flow.
 *
 * Anonymous visitors get a real Supabase auth user (signInAnonymously) and a
 * real draft wedding. Most convert in the same session — the same user id
 * simply becomes permanent, so nothing here touches them. The rest leave two
 * kinds of litter:
 *   1. Draft weddings whose owner is still an anonymous user after the TTL —
 *      the visitor never signed up. Delete the wedding (full child sweep) and
 *      the anonymous auth user.
 *   2. Anonymous auth users with no wedding at all (focused the hero box,
 *      never submitted). Delete the auth user.
 *
 * Runs from the daily demo-cleanup cron (Hobby plan: both cron slots are in
 * use, so this piggybacks — see app/api/cron/demo-cleanup/route.ts).
 */

export const ANON_DRAFT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

/** Per-run bounds so a pathological backlog can't blow the cron's budget. */
const MAX_DRAFTS_PER_RUN = 100;
const MAX_USER_PAGES_PER_RUN = 3;
const USERS_PER_PAGE = 1000;

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

type ServiceClient = ReturnType<typeof getServiceClient>;

export interface AnonCleanupResult {
  draftsScanned: number;
  draftsDeleted: number;
  usersDeleted: number;
  errors: string[];
}

/** True when the auth user exists and is an anonymous (never-signed-up) user. */
async function isAnonymousUser(supabase: ServiceClient, userId: string): Promise<boolean | null> {
  try {
    const { data, error } = await supabase.auth.admin.getUserById(userId);
    if (error || !data.user) return null; // owner gone — handled by caller
    return (data.user as { is_anonymous?: boolean }).is_anonymous === true;
  } catch {
    return null;
  }
}

export async function cleanupAbandonedAnonDrafts(
  client?: ServiceClient,
  now: number = Date.now()
): Promise<AnonCleanupResult> {
  const supabase = client ?? getServiceClient();
  const cutoff = new Date(now - ANON_DRAFT_MAX_AGE_MS).toISOString();
  const result: AnonCleanupResult = { draftsScanned: 0, draftsDeleted: 0, usersDeleted: 0, errors: [] };

  // 1. Expired drafts still owned by an anonymous user.
  const { data: drafts, error: findErr } = await supabase
    .from('weddings')
    .select('id, slug, created_by')
    .eq('status', 'draft')
    .lt('created_at', cutoff)
    .limit(MAX_DRAFTS_PER_RUN);
  if (findErr) {
    result.errors.push(`list drafts: ${findErr.message}`);
  } else {
    for (const w of (drafts ?? []) as Array<{ id: string; slug: string; created_by: string | null }>) {
      result.draftsScanned++;
      if (!w.created_by) continue;
      const anon = await isAnonymousUser(supabase, w.created_by);
      if (anon !== true) continue; // signed-up owner (or unknown) — never touch
      try {
        await deleteWeddingFully(supabase as never, w.id, w.slug);
        result.draftsDeleted++;
        const { error: delUserErr } = await supabase.auth.admin.deleteUser(w.created_by);
        if (delUserErr) result.errors.push(`delete user ${w.created_by}: ${delUserErr.message}`);
        else result.usersDeleted++;
      } catch (err) {
        result.errors.push(`delete draft ${w.slug}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }

  // 2. Aged anonymous users who never created a wedding at all.
  try {
    for (let page = 1; page <= MAX_USER_PAGES_PER_RUN; page++) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: USERS_PER_PAGE });
      if (error) {
        result.errors.push(`list users p${page}: ${error.message}`);
        break;
      }
      const users = data?.users ?? [];
      const staleAnon = users.filter(
        (u) =>
          (u as { is_anonymous?: boolean }).is_anonymous === true &&
          u.created_at &&
          new Date(u.created_at).getTime() < now - ANON_DRAFT_MAX_AGE_MS
      );
      if (staleAnon.length > 0) {
        const ids = staleAnon.map((u) => u.id);
        const { data: owned, error: ownedErr } = await supabase
          .from('weddings')
          .select('created_by')
          .in('created_by', ids);
        if (ownedErr) {
          result.errors.push(`check owned weddings: ${ownedErr.message}`);
        } else {
          const owners = new Set(((owned ?? []) as Array<{ created_by: string }>).map((w) => w.created_by));
          for (const u of staleAnon) {
            if (owners.has(u.id)) continue; // has a wedding — pass 1's job
            const { error: delErr } = await supabase.auth.admin.deleteUser(u.id);
            if (delErr) result.errors.push(`delete idle anon user ${u.id}: ${delErr.message}`);
            else result.usersDeleted++;
          }
        }
      }
      if (users.length < USERS_PER_PAGE) break; // last page
    }
  } catch (err) {
    result.errors.push(`idle-user sweep: ${err instanceof Error ? err.message : String(err)}`);
  }

  if (result.draftsDeleted || result.usersDeleted) {
    console.log(
      `[anon-cleanup] drafts deleted=${result.draftsDeleted} users deleted=${result.usersDeleted} (scanned ${result.draftsScanned} drafts)`
    );
  }
  return result;
}
