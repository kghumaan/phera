import { NextRequest, NextResponse } from 'next/server';
import { askPhera } from '@/lib/vendors/ai-extractor';
import { getAuthenticatedClient } from '@/lib/utils/auth-helpers';
import { verifyWeddingAccess } from '@/lib/utils/verify-wedding-access';

/**
 * POST /api/vendors/ask
 * "Ask Phera" — ask a question across all vendor conversations
 */
export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient();
    if (!supabase || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { weddingId, question, conversationId } = body;

    if (!weddingId || !question) {
      return NextResponse.json({ error: 'Missing weddingId or question' }, { status: 400 });
    }

    const hasAccess = await verifyWeddingAccess(supabase, user.id, weddingId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const answer = await askPhera({ weddingId, question, conversationId });

    return NextResponse.json({ answer });
  } catch (error: any) {
    console.error('Error in Ask Phera:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
