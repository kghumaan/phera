import { NextResponse } from 'next/server';
import { getOpsSupabaseAdmin } from '@/lib/ops/supabase-admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const supabase = getOpsSupabaseAdmin();

  // Purge entries older than 90 days (TTL).
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  await supabase.from('ops_user_outreach').delete().lt('created_at', cutoff);

  const { data, error } = await supabase
    .from('ops_user_outreach')
    .select('id, user_id, user_email, kind, channel, from_email, subject, provider_message_id, status, error, notes, sent_by, created_at')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ rows: data ?? [] });
}
