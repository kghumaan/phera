import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedClient } from '@/lib/utils/auth-helpers';
import { verifyWeddingAccess, verifyWeddingAccessBySlug } from '@/lib/utils/verify-wedding-access';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * GET /api/control-tower/conversation?weddingId=<slug_or_uuid>&guestId=<id>
 * Returns recent chat messages for a specific guest. Uses service role.
 * Resolves slug to UUID since whatsapp_chat_history uses UUID for wedding_id.
 */
export async function GET(request: NextRequest) {
  const weddingIdParam = request.nextUrl.searchParams.get('weddingId');
  const guestId = request.nextUrl.searchParams.get('guestId');

  if (!weddingIdParam || !guestId) {
    return NextResponse.json({ error: 'weddingId and guestId required' }, { status: 400 });
  }

  const { supabase: userClient, user } = await getAuthenticatedClient();
  if (!userClient || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const hasAccess = UUID_RE.test(weddingIdParam)
    ? await verifyWeddingAccess(userClient, user.id, weddingIdParam)
    : await verifyWeddingAccessBySlug(userClient, user.id, weddingIdParam);
  if (!hasAccess) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    // Resolve to UUID — try direct first, then slug lookup
    let weddingUuid = weddingIdParam;

    // If it doesn't look like a UUID, look up by slug
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(weddingIdParam);
    if (!isUuid) {
      const { data: wedding } = await supabase
        .from('weddings')
        .select('id')
        .eq('slug', weddingIdParam)
        .single();
      if (wedding) weddingUuid = wedding.id;
    }

    const { data, error } = await (supabase as any)
      .from('whatsapp_chat_history')
      .select('id, role, content, created_at')
      .eq('wedding_id', weddingUuid)
      .eq('guest_id', guestId)
      .in('role', ['user', 'assistant'])
      .order('created_at', { ascending: true })
      .limit(20);

    if (error) throw error;

    return NextResponse.json({ messages: data || [] });
  } catch {
    return NextResponse.json({ messages: [] });
  }
}
