import { NextRequest, NextResponse } from 'next/server';
import { getOpsSupabaseAdmin } from '@/lib/ops/supabase-admin';

export const dynamic = 'force-dynamic';

/**
 * DELETE /api/ops/users/{id}
 * Hard-deletes an auth user + their outreach log entries.
 * Refuses if the user owns any wedding (delete the wedding first via /ops/wedding/[slug]).
 *
 * Body (optional): { force?: boolean } — if true, delete even if they own weddings
 * (still won't cascade the weddings — those rows get orphaned). Use carefully.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let body: { force?: boolean } = {};
  try {
    body = (await request.json()) as { force?: boolean };
  } catch {
    // no body is fine
  }

  const supabase = getOpsSupabaseAdmin();

  const { data: ownedWeddings } = await supabase
    .from('weddings')
    .select('slug')
    .eq('created_by', id);

  const ownsCount = ownedWeddings?.length ?? 0;
  if (ownsCount > 0 && !body.force) {
    return NextResponse.json(
      {
        error: 'User owns weddings. Delete those first or pass { force: true } to orphan them.',
        ownedWeddings: (ownedWeddings ?? []).map((w: { slug: string }) => w.slug),
      },
      { status: 409 },
    );
  }

  // Clear outreach log entries for this user.
  await supabase.from('ops_user_outreach').delete().eq('user_id', id);

  // Delete auth user.
  const del = await supabase.auth.admin.deleteUser(id);
  if (del.error) {
    return NextResponse.json({ error: del.error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    userId: id,
    orphanedWeddings: ownsCount,
  });
}
