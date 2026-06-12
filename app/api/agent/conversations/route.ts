import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedClient } from '@/lib/utils/auth-helpers';
import { verifyWeddingAccess } from '@/lib/utils/verify-wedding-access';

export const runtime = 'nodejs';

/**
 * GET /api/agent/conversations?weddingSlug=...
 * Returns the latest conversation for the wedding (if any) with its messages,
 * so the chat page can restore history on load.
 */
export async function GET(request: NextRequest) {
  const { supabase, user } = await getAuthenticatedClient();
  if (!supabase || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const weddingSlug = request.nextUrl.searchParams.get('weddingSlug');
  if (!weddingSlug) {
    return NextResponse.json({ error: 'Missing weddingSlug' }, { status: 400 });
  }

  const { data: wedding } = await supabase
    .from('weddings')
    .select('id, slug')
    .eq('slug', weddingSlug)
    .single();
  if (!wedding) {
    return NextResponse.json({ error: 'Wedding not found' }, { status: 404 });
  }
  const hasAccess = await verifyWeddingAccess(supabase, user.id, wedding.id);
  if (!hasAccess) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: conversation } = await supabase
    .from('agent_conversations')
    .select('id, created_at, last_message_at')
    .eq('wedding_id', wedding.slug)
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  if (!conversation) {
    return NextResponse.json({ conversation: null, messages: [] });
  }

  const [{ data: messages }, { data: pendingActions }] = await Promise.all([
    supabase
      .from('agent_messages')
      .select('id, role, content, created_at')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true })
      .limit(200),
    supabase
      .from('agent_actions')
      .select('id, tool_name, input, created_at')
      .eq('conversation_id', conversation.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: true }),
  ]);

  return NextResponse.json({
    conversation,
    messages: messages ?? [],
    pendingActions: pendingActions ?? [],
  });
}
