import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedClient } from '@/lib/utils/auth-helpers';
import { verifyWeddingAccess } from '@/lib/utils/verify-wedding-access';

/**
 * GET /api/concierge/stats?weddingId=xxx
 * Returns concierge metrics: unique guests, message count, avg response time
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

    // Fetch all chat history for this wedding
    const { data: messages, error } = await (supabase as any)
      .from('whatsapp_chat_history')
      .select('id, guest_id, role, created_at')
      .eq('wedding_id', weddingId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    const allMessages = messages || [];

    // Unique guests (distinct guest_ids with role='user')
    const userMessages = allMessages.filter((m: any) => m.role === 'user');
    const uniqueGuestIds = new Set(userMessages.map((m: any) => m.guest_id));
    const guestsReached = uniqueGuestIds.size;

    // Messages handled (role='assistant')
    const assistantMessages = allMessages.filter((m: any) => m.role === 'assistant');
    const messagesHandled = assistantMessages.length;

    // Avg response time: for each user message, find the next assistant message and compute diff
    let totalResponseMs = 0;
    let responseCount = 0;

    for (let i = 0; i < allMessages.length; i++) {
      if (allMessages[i].role === 'user') {
        // Find next assistant message
        for (let j = i + 1; j < allMessages.length; j++) {
          if (allMessages[j].role === 'assistant') {
            const userTime = new Date(allMessages[i].created_at).getTime();
            const assistantTime = new Date(allMessages[j].created_at).getTime();
            const diff = assistantTime - userTime;
            if (diff > 0 && diff < 300000) { // Only count if < 5 min (ignore stale pairs)
              totalResponseMs += diff;
              responseCount++;
            }
            break;
          }
          if (allMessages[j].role === 'user') break; // Another user msg means no response found
        }
      }
    }

    const avgResponseTimeSec = responseCount > 0
      ? Math.round(totalResponseMs / responseCount / 1000)
      : 0;

    return NextResponse.json({
      guestsReached,
      messagesHandled,
      avgResponseTimeSec,
      totalMessages: allMessages.length,
    });
  } catch (error: any) {
    console.error('Error fetching concierge stats:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
