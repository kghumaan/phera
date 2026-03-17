import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedClient } from '@/lib/utils/auth-helpers';
import { verifyWeddingAccess } from '@/lib/utils/verify-wedding-access';
import { generateTravelContent } from '@/lib/travel/generate-travel-content';

export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient();
    if (!supabase || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { weddingId } = body;

    if (!weddingId) {
      return NextResponse.json({ error: 'Missing weddingId' }, { status: 400 });
    }

    const hasAccess = await verifyWeddingAccess(supabase, user.id, weddingId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const result = await generateTravelContent(weddingId);

    if (!result.canGenerate) {
      return NextResponse.json(
        { error: 'Cannot generate', missing: result.missing },
        { status: 422 }
      );
    }

    return NextResponse.json({ content: result.content });
  } catch (error) {
    console.error('Error generating travel content:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
