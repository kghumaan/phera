import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedClient } from '@/lib/utils/auth-helpers';
import { verifyWeddingAccess } from '@/lib/utils/verify-wedding-access';

/**
 * GET /api/vendors/conversations/[conversationId]
 * Get a conversation with all its messages
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { supabase, user } = await getAuthenticatedClient();
    if (!supabase || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId } = await params;

    const { data: conversation, error: convoError } = await supabase
      .from('vendor_conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (convoError) throw convoError;
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const hasAccess = await verifyWeddingAccess(supabase, user.id, conversation.wedding_id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: messages, error: msgError } = await supabase
      .from('vendor_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('message_timestamp', { ascending: true });

    if (msgError) throw msgError;

    return NextResponse.json({
      conversation,
      messages: messages || [],
    });
  } catch (error: any) {
    console.error('Error getting conversation:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
