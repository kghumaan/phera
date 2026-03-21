import { NextRequest, NextResponse } from 'next/server';
import { outreachService } from '@/lib/supabase/outreach-service';

export async function GET(request: NextRequest) {
  const weddingId = request.nextUrl.searchParams.get('weddingId');

  if (!weddingId) {
    return NextResponse.json({ error: 'weddingId is required' }, { status: 400 });
  }

  try {
    const sequences = await outreachService.getPendingSequences(weddingId);
    return NextResponse.json({ sequences });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { weddingId, weddingDate } = body;

    if (!weddingId || !weddingDate) {
      return NextResponse.json({ error: 'weddingId and weddingDate are required' }, { status: 400 });
    }

    const sequences = await outreachService.generateSequence(weddingId, new Date(weddingDate));
    return NextResponse.json({ sequences });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
