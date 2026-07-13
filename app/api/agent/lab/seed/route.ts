import { NextRequest, NextResponse } from 'next/server';
import { requireLabAccess, isLabAccess } from '@/lib/agent/lab/auth';
import { seedLabWedding, teardownLabWedding, isLabSlug } from '@/lib/agent/lab/scenarios';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * GET /api/agent/lab/seed
 * Lists existing lab weddings (for cleanup and the lab UI).
 */
export async function GET(request: NextRequest) {
  const access = await requireLabAccess(request);
  if (!isLabAccess(access)) return access;

  const { data } = await access.supabase
    .from('weddings')
    .select('slug, couple_name, created_at')
    .like('slug', 'agent-lab-%')
    .order('created_at', { ascending: false });
  return NextResponse.json({ weddings: data ?? [] });
}

/**
 * POST /api/agent/lab/seed   Body: { scenario: 'blank' | 'populated' | 'fresh-draft' }
 * Creates a disposable agent-lab-* wedding with mock data. 'fresh-draft'
 * mirrors the landing-page anonymous draft (names unknown, everything TBD).
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
  const scenario =
    body.scenario === 'blank' || body.scenario === 'populated' || body.scenario === 'fresh-draft'
      ? body.scenario
      : null;
  if (!scenario) {
    return NextResponse.json({ error: "scenario must be 'blank', 'populated', or 'fresh-draft'" }, { status: 400 });
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
