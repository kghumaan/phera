import { NextRequest, NextResponse } from 'next/server';
import { requireLabAccess, isLabAccess } from '@/lib/agent/lab/auth';
import { dumpLabState, isLabSlug } from '@/lib/agent/lab/scenarios';

export const runtime = 'nodejs';

/**
 * GET /api/agent/lab/state?weddingSlug=agent-lab-...
 * Full data dump of a lab wedding (wedding, guests, rooms, schedule, agent
 * conversation history + tool-action audit log). The verification surface
 * for "did the agent actually mutate what it said it did".
 */
export async function GET(request: NextRequest) {
  const access = await requireLabAccess(request);
  if (!isLabAccess(access)) return access;

  const weddingSlug = request.nextUrl.searchParams.get('weddingSlug');
  if (!weddingSlug || !isLabSlug(weddingSlug)) {
    return NextResponse.json({ error: 'weddingSlug must be an agent-lab-* slug' }, { status: 400 });
  }

  try {
    const state = await dumpLabState(access.supabase, weddingSlug);
    return NextResponse.json(state);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'State dump failed' },
      { status: error instanceof Error && /not found/i.test(error.message) ? 404 : 500 }
    );
  }
}
