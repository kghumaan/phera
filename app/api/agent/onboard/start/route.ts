import { NextResponse } from 'next/server';
import { getAuthenticatedClient } from '@/lib/utils/auth-helpers';
import { WeddingService } from '@/lib/supabase/wedding-service';
import { COLORS } from '@/lib/theme/tokens';

export const runtime = 'nodejs';

/**
 * POST /api/agent/onboard/start
 * Creates a fresh draft wedding owned by the user and marks onboarding
 * complete, so the AI-first path can drop them straight into the Planner
 * chat. Mirrors the placeholder/defaults the manual wizard would set; the
 * agent fills in real names/date/venue conversationally from there.
 */
export async function POST() {
  const { supabase, user } = await getAuthenticatedClient();
  if (!supabase || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // If they already have a wedding, don't make another — send them to it.
  const { data: existing } = await supabase
    .from('weddings')
    .select('slug')
    .eq('created_by', user.id)
    .order('created_at', { ascending: false })
    .limit(1);
  if (existing && existing.length > 0) {
    return NextResponse.json({ slug: existing[0].slug, existing: true });
  }

  const service = new WeddingService(supabase as never);
  // Unique, unguessable draft slug — renamed later once the couple is known.
  const suffix = (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`).replace(/-/g, '').slice(0, 10);
  const slug = `new-wedding-${suffix}`;

  const wedding = await service.createWedding({
    slug,
    couple_name: 'Your Wedding',
    partner1_name: '',
    partner2_name: '',
    wedding_date: new Date(0).toISOString(),
    wedding_date_display: 'Dates TBD',
    venue_name: 'Venue TBD',
    venue_location: '',
    rsvp_deadline: '',
    status: 'draft',
    created_by: user.id,
    background_image: '/images/backgrounds/blue-clouds.webp',
    primary_color: COLORS.brand.primary,
    couple_images: ['/images/couple/placeholder1.png', '/images/couple/placeholder2.png'],
    couple_image_url: '/images/couple/placeholder1.png',
  } as never);

  if (!wedding) {
    return NextResponse.json({ error: 'Could not create your wedding — please try again.' }, { status: 500 });
  }

  await supabase
    .from('user_settings')
    .upsert({ user_id: user.id, onboarding_completed: true, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });

  return NextResponse.json({ slug: wedding.slug });
}
