import { NextRequest, NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getAuthenticatedClient } from '@/lib/utils/auth-helpers';
import { verifyWeddingAccess } from '@/lib/utils/verify-wedding-access';

async function verifyAccessBySlug(
  supabase: SupabaseClient,
  userId: string,
  weddingSlug: string,
): Promise<boolean> {
  const { data } = await supabase
    .from('weddings')
    .select('id')
    .eq('slug', weddingSlug)
    .single();
  if (!data?.id) return false;
  return verifyWeddingAccess(supabase, userId, data.id);
}

/**
 * GET /api/whatsapp-bot/log?weddingSlug=...
 *
 * Read-only window into bot_admin_log so the Admin tab can render an
 * activity feed of every action the bot was asked to take. RLS keeps
 * results scoped to the wedding's owners/admins.
 */
export async function GET(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient();
    if (!supabase || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const weddingSlug = request.nextUrl.searchParams.get('weddingSlug');
    if (!weddingSlug) {
      return NextResponse.json({ error: 'Missing weddingSlug' }, { status: 400 });
    }

    const hasAccess = await verifyAccessBySlug(supabase, user.id, weddingSlug);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- table not in generated types yet
    const { data, error } = await (supabase as any)
      .from('bot_admin_log')
      .select('id, admin_phone, admin_name, action_type, summary, status, error_message, created_at, completed_at')
      .eq('wedding_id', weddingSlug)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    return NextResponse.json({ entries: data || [] });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    console.error('GET /api/whatsapp-bot/log:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
