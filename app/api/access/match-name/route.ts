import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit } from '@/lib/utils/rate-limiter';
import { matchGuestsByName } from '@/lib/access/name-match';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Require password already verified for this wedding before exposing names.
 * The caller includes the password in the payload so the match endpoint can
 * never be used for name enumeration without a valid password.
 */
export async function POST(request: NextRequest) {
  const limited = checkRateLimit(request, {
    maxRequests: 20,
    windowMs: 10 * 60 * 1000,
    keyPrefix: 'access-match-name',
  });
  if (limited) return limited;

  try {
    const { weddingSlug, query, password } = await request.json();

    if (!weddingSlug || typeof query !== 'string' || typeof password !== 'string') {
      return NextResponse.json({ error: 'Missing weddingSlug, query, or password' }, { status: 400 });
    }

    const { data: wedding, error: weddingError } = await supabase
      .from('weddings')
      .select('id')
      .eq('slug', weddingSlug)
      .single();

    if (weddingError || !wedding) {
      return NextResponse.json({ error: 'Wedding not found' }, { status: 404 });
    }

    const { data: settings } = await supabase
      .from('wedding_settings')
      .select('wedding_password')
      .eq('wedding_id', wedding.id)
      .maybeSingle();

    const expected = settings?.wedding_password;
    if (!expected || password !== expected) {
      return NextResponse.json({ error: 'Password required' }, { status: 401 });
    }

    const { data: guests, error: guestsError } = await supabase
      .from('guests')
      .select('id, name, logistics_data, avatar_color, initials')
      .eq('wedding_id', weddingSlug);

    if (guestsError) {
      return NextResponse.json({ error: 'Failed to load guests' }, { status: 500 });
    }

    const result = matchGuestsByName(query, (guests || []) as Parameters<typeof matchGuestsByName>[1]);
    // Cap to 20 results to keep the UI clean.
    return NextResponse.json({ matches: result.slice(0, 20) });
  } catch (error) {
    console.error('Name match error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
