import { NextRequest, NextResponse } from 'next/server';
import { getOpsSupabaseAdmin } from '@/lib/ops/supabase-admin';

export const dynamic = 'force-dynamic';

type Body = {
  userId: string;
  notes?: string;
};

export async function POST(request: NextRequest) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }
  if (!body.userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 });
  }

  const supabase = getOpsSupabaseAdmin();

  const userRes = await supabase.auth.admin.getUserById(body.userId);
  if (userRes.error || !userRes.data.user) {
    return NextResponse.json(
      { error: userRes.error?.message || 'User not found' },
      { status: 404 },
    );
  }

  const { error } = await supabase.from('ops_user_outreach').insert({
    user_id: userRes.data.user.id,
    user_email: userRes.data.user.email ?? '',
    kind: 'skipped',
    channel: 'email',
    status: 'skipped',
    notes: body.notes || null,
    sent_by: 'manual:ops',
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
