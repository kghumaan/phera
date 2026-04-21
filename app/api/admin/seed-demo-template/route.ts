import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { seedDemoMockData } from '@/lib/demo/seed-demo-mock-data';
import type { PheraDatabase } from '@/lib/supabase/types';

const TEMPLATE_SLUG = 'demo-template';

/**
 * One-shot endpoint to seed the demo-template wedding with the mock Control
 * Tower data (outreach stages, tags, topics, outreach_events, issues).
 *
 * Intended to be called ONCE (or whenever the template is reset). The
 * regular demo clone flow then inherits the seeded rows automatically and
 * skips the slow per-clone seed step.
 *
 * Protected by a shared secret header so it can't be called publicly.
 * Set SEED_DEMO_TEMPLATE_SECRET in your environment and pass it as the
 * `x-seed-secret` header.
 */
export async function POST(req: Request) {
  const secret = process.env.SEED_DEMO_TEMPLATE_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: 'SEED_DEMO_TEMPLATE_SECRET is not configured on the server.' },
      { status: 500 }
    );
  }

  const provided = req.headers.get('x-seed-secret');
  if (provided !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient<PheraDatabase>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Find the template
  const { data: template, error: templateError } = await supabase
    .from('weddings')
    .select('id, slug')
    .eq('slug', TEMPLATE_SLUG)
    .single();

  if (templateError || !template) {
    return NextResponse.json(
      { error: `Template wedding "${TEMPLATE_SLUG}" not found` },
      { status: 404 }
    );
  }

  // Get the guest IDs for the template
  const { data: guests } = await (supabase as any)
    .from('guests')
    .select('id')
    .eq('wedding_id', TEMPLATE_SLUG);

  const guestIds: string[] = (guests || []).map((g: any) => g.id);

  if (guestIds.length === 0) {
    return NextResponse.json(
      { error: 'Template has no guests to seed' },
      { status: 400 }
    );
  }

  // Clear any existing mock data so the seed is idempotent
  await Promise.all([
    (supabase as any).from('outreach_events').delete().eq('wedding_id', TEMPLATE_SLUG),
    (supabase as any).from('coordination_issues').delete().eq('wedding_id', TEMPLATE_SLUG),
  ]);

  const t0 = Date.now();
  await seedDemoMockData(supabase, {
    slug: TEMPLATE_SLUG,
    weddingUuid: template.id,
    guestIds,
  });

  return NextResponse.json({
    ok: true,
    seededGuests: guestIds.length,
    elapsedMs: Date.now() - t0,
  });
}
