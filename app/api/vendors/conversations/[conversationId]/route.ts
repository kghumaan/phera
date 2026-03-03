import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

async function getAuthenticatedClient() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch {}
        },
      },
    }
  );
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { supabase: null, user: null };
  return { supabase, user };
}

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
