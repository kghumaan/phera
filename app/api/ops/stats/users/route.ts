import { NextResponse } from 'next/server';
import { getOpsSupabaseAdmin } from '@/lib/ops/supabase-admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const DAY_MS = 24 * 60 * 60 * 1000;

export async function GET() {
  const supabase = getOpsSupabaseAdmin();
  const now = Date.now();

  const firstPage = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (firstPage.error) {
    return NextResponse.json({ error: firstPage.error.message }, { status: 500 });
  }

  const allUsers = [...firstPage.data.users];
  const totalPages = Math.ceil((firstPage.data.total ?? allUsers.length) / 200);
  for (let p = 2; p <= Math.min(totalPages, 10); p += 1) {
    const next = await supabase.auth.admin.listUsers({ page: p, perPage: 200 });
    if (next.error) break;
    allUsers.push(...next.data.users);
  }

  allUsers.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  const recent = allUsers.slice(0, 25).map((u) => ({
    id: u.id,
    email: u.email ?? null,
    phone: u.phone ?? null,
    created_at: u.created_at,
    last_sign_in_at: u.last_sign_in_at ?? null,
    provider:
      (u.app_metadata as { provider?: string } | null)?.provider ??
      (u.identities?.[0]?.provider as string | undefined) ??
      null,
  }));

  return NextResponse.json({
    total: firstPage.data.total ?? allUsers.length,
    last24h: allUsers.filter(
      (u) => new Date(u.created_at).getTime() >= now - DAY_MS,
    ).length,
    last7d: allUsers.filter(
      (u) => new Date(u.created_at).getTime() >= now - 7 * DAY_MS,
    ).length,
    last30d: allUsers.filter(
      (u) => new Date(u.created_at).getTime() >= now - 30 * DAY_MS,
    ).length,
    recent,
  });
}
