import { NextRequest, NextResponse } from 'next/server';
import { outreachService } from '@/lib/supabase/outreach-service';

export async function GET(request: NextRequest) {
  const weddingId = request.nextUrl.searchParams.get('weddingId');
  const guestId = request.nextUrl.searchParams.get('guestId');
  const limit = request.nextUrl.searchParams.get('limit');

  if (!weddingId) {
    return NextResponse.json({ error: 'weddingId is required' }, { status: 400 });
  }

  try {
    if (guestId) {
      const events = await outreachService.getGuestEvents(guestId);
      return NextResponse.json({ events });
    }

    const events = await outreachService.getWeddingEvents(
      weddingId,
      limit ? parseInt(limit) : undefined
    );
    return NextResponse.json({ events });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
