import { NextRequest, NextResponse } from 'next/server';
import { requireLabAccess, isLabAccess } from '@/lib/agent/lab/auth';
import { seedLabWedding, teardownLabWedding, isLabSlug } from '@/lib/agent/lab/scenarios';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * POST /api/agent/lab/seed   Body: { scenario: 'blank' | 'populated' }
 * Creates a disposable agent-lab-* wedding with mock data.
 */
export async function POST(request: NextRequest) {
  const access = await requireLabAccess(request);
  if (!isLabAccess(access)) return access;

  let body: { scenario?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const scenario = body.scenario === 'blank' ? 'blank' : body.scenario === 'populated' ? 'populated' : null;
  if (!scenario) {
    return NextResponse.json({ error: "scenario must be 'blank' or 'populated'" }, { status: 400 });
  }

  try {
    const result = await seedLabWedding(access.supabase, { scenario, ownerId: access.ownerId });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Lab seed failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Seed failed' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/agent/lab/seed?weddingSlug=agent-lab-...
 * Tears down a lab wedding and every related row. Refuses non-lab slugs.
 */
export async function DELETE(request: NextRequest) {
  const access = await requireLabAccess(request);
  if (!isLabAccess(access)) return access;

  const weddingSlug = request.nextUrl.searchParams.get('weddingSlug');
  if (!weddingSlug || !isLabSlug(weddingSlug)) {
    return NextResponse.json({ error: 'weddingSlug must be an agent-lab-* slug' }, { status: 400 });
  }

  try {
    const result = await teardownLabWedding(access.supabase, weddingSlug);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Lab teardown failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Teardown failed' },
      { status: 500 }
    );
  }
}
