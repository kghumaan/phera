import { NextResponse } from 'next/server';
import { getAuthenticatedClient } from '@/lib/utils/auth-helpers';
import { isSuperAdminEmail } from '@/lib/constants/super-admins';
import { getOpsSupabaseAdmin } from '@/lib/ops/supabase-admin';
import { deleteWedding } from '@/lib/ops/wedding-delete';

export const dynamic = 'force-dynamic';

/**
 * DELETE /api/account/delete
 * Hard-deletes the CURRENT logged-in user's account so they can re-run
 * onboarding from scratch: every wedding they own (full cascade via
 * lib/ops/wedding-delete), their user-keyed rows (user_settings,
 * wedding_admins memberships, ops outreach log), then the auth user itself.
 *
 * Super-admin only — this is a dev/test tool for the founder accounts,
 * not a public account-deletion feature.
 */
export async function DELETE() {
  const { user } = await getAuthenticatedClient();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  if (!isSuperAdminEmail(user.email)) {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
  }

  const admin = getOpsSupabaseAdmin();

  // 1. Cascade-delete every wedding this user owns.
  const { data: owned, error: ownedError } = await admin
    .from('weddings')
    .select('slug')
    .eq('created_by', user.id);

  if (ownedError) {
    return NextResponse.json({ error: ownedError.message }, { status: 500 });
  }

  const deletedWeddings: Array<{ slug: string; rows: number }> = [];
  for (const w of owned ?? []) {
    const result = await deleteWedding(w.slug as string);
    deletedWeddings.push({
      slug: w.slug as string,
      rows: result.deleted.reduce((a, r) => a + r.deleted, 0),
    });
  }

  // 2. User-keyed rows. Best-effort — a missing table or already-empty set
  // must not block the auth-user deletion below.
  const userKeyedTables = ['wedding_admins', 'user_settings', 'ops_user_outreach'];
  for (const table of userKeyedTables) {
    const { error } = await admin.from(table).delete().eq('user_id', user.id);
    if (error) {
      console.error(`[account/delete] failed to clear ${table}:`, error.message);
    }
  }

  // 3. The auth user itself.
  const del = await admin.auth.admin.deleteUser(user.id);
  if (del.error) {
    return NextResponse.json({ error: del.error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, userId: user.id, deletedWeddings });
}
