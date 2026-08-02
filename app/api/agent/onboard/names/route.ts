import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedClient } from '@/lib/utils/auth-helpers';
import { resolveWeddingAccess } from '@/lib/utils/verify-wedding-access';
import { checkRateLimit } from '@/lib/utils/rate-limiter';
import { persistCoupleNames } from '@/lib/agent/couple-names';

export const runtime = 'nodejs';

/**
 * POST /api/agent/onboard/names
 * Body: { weddingSlug: string, names: string }
 *
 * The onboarding names card is rendered CLIENT-side for an instant first paint,
 * so its answer never passes through /api/agent/answer. It used to be handed to
 * the model with "please record these" — and production UAT caught the model
 * greeting couples by name while their row still read "Your Wedding".
 *
 * So the names are written here, deterministically, before the turn runs.
 */
export async function POST(request: NextRequest) {
  const limited = checkRateLimit(request, { maxRequests: 20, windowMs: 60_000, keyPrefix: 'onboard-names' });
  if (limited) return limited;

  const { supabase, user } = await getAuthenticatedClient();
  if (!supabase || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { weddingSlug?: string; names?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const { weddingSlug, names } = body;
  if (!weddingSlug || typeof names !== 'string' || !names.trim()) {
    return NextResponse.json({ error: 'Missing weddingSlug or names' }, { status: 400 });
  }

  const wedding = await resolveWeddingAccess(supabase, user.id, weddingSlug);
  if (!wedding) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const saved = await persistCoupleNames(supabase, wedding.id, names);
  return NextResponse.json({ saved });
}
