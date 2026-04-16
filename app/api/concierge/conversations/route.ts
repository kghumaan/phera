import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedClient } from '@/lib/utils/auth-helpers';
import { verifyWeddingAccess } from '@/lib/utils/verify-wedding-access';

interface ConversationMessage {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

interface Conversation {
  guestId: string;
  guestName: string;
  messages: ConversationMessage[];
  lastMessageAt: string;
  lastMessagePreview: string;
  messageCount: number;
}

/**
 * GET /api/concierge/conversations?weddingId=xxx
 * Returns conversations grouped by guest
 */
export async function GET(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient();
    if (!supabase || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const weddingId = request.nextUrl.searchParams.get('weddingId');
    if (!weddingId) {
      return NextResponse.json({ error: 'Missing weddingId' }, { status: 400 });
    }

    const hasAccess = await verifyWeddingAccess(supabase, user.id, weddingId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all chat messages (excluding system messages)
    const { data: messages, error } = await (supabase as any)
      .from('whatsapp_chat_history')
      .select('id, guest_id, role, content, created_at')
      .eq('wedding_id', weddingId)
      .in('role', ['user', 'assistant'])
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Get unique guest IDs
    const guestIds = [...new Set((messages || []).map((m: any) => m.guest_id))];

    // Fetch guest names
    const { data: guests } = await supabase
      .from('guests')
      .select('id, name')
      .in('id', guestIds.length > 0 ? guestIds : ['__none__']);

    const guestMap = new Map((guests || []).map((g: any) => [g.id, g.name || 'Unknown Guest']));

    // Group messages by guest
    const conversationMap = new Map<string, Conversation>();

    for (const msg of (messages || [])) {
      if (!conversationMap.has(msg.guest_id)) {
        conversationMap.set(msg.guest_id, {
          guestId: msg.guest_id,
          guestName: guestMap.get(msg.guest_id) || 'Unknown Guest',
          messages: [],
          lastMessageAt: msg.created_at,
          lastMessagePreview: '',
          messageCount: 0,
        });
      }

      const conv = conversationMap.get(msg.guest_id)!;
      conv.messages.push({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        created_at: msg.created_at,
      });
      conv.lastMessageAt = msg.created_at;
      conv.lastMessagePreview = msg.content?.slice(0, 80) || '';
      conv.messageCount++;
    }

    // Sort by most recent first
    const conversations = Array.from(conversationMap.values())
      .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());

    return NextResponse.json({ conversations });
  } catch (error: any) {
    console.error('Error fetching concierge conversations:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
