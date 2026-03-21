import { NextRequest, NextResponse } from 'next/server';
import { outreachService } from '@/lib/supabase/outreach-service';

export async function GET(request: NextRequest) {
  const weddingId = request.nextUrl.searchParams.get('weddingId');

  if (!weddingId) {
    return NextResponse.json({ error: 'weddingId is required' }, { status: 400 });
  }

  try {
    const summary = await outreachService.getOutreachSummary(weddingId);
    return NextResponse.json(summary);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
