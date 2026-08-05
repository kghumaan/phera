import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedClient } from '@/lib/utils/auth-helpers';
import { verifyWeddingAccess } from '@/lib/utils/verify-wedding-access';
import { buildWeddingSnapshot } from '@/lib/agent/context';
import { buildStarters } from '@/lib/agent/starters';
import { SPINE_STEPS } from '@/lib/agent/spine';

export const runtime = 'nodejs';

/**
 * GET /api/agent/summary?weddingSlug=...
 * Lightweight wedding summary for the Planner UI. Currently returns analytical
 * starter prompts; structured stats can be added to the payload as needed.
 */
export async function GET(request: NextRequest) {
  const { supabase, user } = await getAuthenticatedClient();
  if (!supabase || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const weddingSlug = request.nextUrl.searchParams.get('weddingSlug');
  if (!weddingSlug) {
    return NextResponse.json({ error: 'Missing weddingSlug' }, { status: 400 });
  }

  const { data: wedding } = await supabase
    .from('weddings')
    .select('id, slug, created_by')
    .eq('slug', weddingSlug)
    .single();
  if (!wedding) {
    return NextResponse.json({ error: 'Wedding not found' }, { status: 404 });
  }
  // Owners skip the duplicate lookup inside verifyWeddingAccess.
  const hasAccess =
    wedding.created_by === user.id || (await verifyWeddingAccess(supabase, user.id, wedding.id));
  if (!hasAccess) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const snapshot = await buildWeddingSnapshot(supabase, wedding.slug, wedding.id);
    // The Working-on bar's state (PLANNER-SPINE-TRACKER A1/A2): current spine
    // step + progress, shaped for direct rendering.
    const f = snapshot.focus;
    const focus = f
      ? {
          step: f.step,
          label: f.label,
          stepNumber: f.step ? SPINE_STEPS.findIndex((s) => s.key === f.step) + 1 : null,
          totalSteps: SPINE_STEPS.length,
          done: f.done,
          skipped: f.skipped,
          complete: f.complete,
        }
      : null;
    return NextResponse.json({ starters: buildStarters(snapshot), focus });
  } catch {
    // Fail open — the client falls back to its default starters.
    return NextResponse.json({ starters: [], focus: null });
  }
}
