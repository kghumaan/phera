import { NextRequest, NextResponse } from 'next/server';
import { outreachService } from '@/lib/supabase/outreach-service';

export async function GET(request: NextRequest) {
  const weddingId = request.nextUrl.searchParams.get('weddingId');
  const status = request.nextUrl.searchParams.get('status');

  if (!weddingId) {
    return NextResponse.json({ error: 'weddingId is required' }, { status: 400 });
  }

  try {
    const escalations = await outreachService.getEscalations(weddingId, status || undefined);
    return NextResponse.json({ escalations });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { weddingId, guestId, reason, context = {} } = body;

    if (!weddingId || !guestId || !reason) {
      return NextResponse.json({ error: 'weddingId, guestId, and reason are required' }, { status: 400 });
    }

    const escalation = await outreachService.createEscalation({
      wedding_id: weddingId,
      guest_id: guestId,
      reason,
      context,
      status: 'open',
    });

    return NextResponse.json({ escalation });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { escalationId, action, resolvedBy } = body;

    if (!escalationId || !action) {
      return NextResponse.json({ error: 'escalationId and action are required' }, { status: 400 });
    }

    if (action === 'resolve') {
      if (!resolvedBy) {
        return NextResponse.json({ error: 'resolvedBy is required for resolve action' }, { status: 400 });
      }
      await outreachService.resolveEscalation(escalationId, resolvedBy);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
