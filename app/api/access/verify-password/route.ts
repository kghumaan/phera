import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getExpectedWeddingPassword } from '@/lib/supabase/wedding-password';
import { checkRateLimit } from '@/lib/utils/rate-limiter';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const limited = checkRateLimit(request, {
    maxRequests: 6,
    windowMs: 15 * 60 * 1000,
    keyPrefix: 'access-password',
  });
  if (limited) return limited;

  try {
    const { weddingSlug, password } = await request.json();

    if (!weddingSlug || typeof password !== 'string') {
      return NextResponse.json({ error: 'Missing weddingSlug or password' }, { status: 400 });
    }

    const { data: wedding, error: weddingError } = await supabase
      .from('weddings')
      .select('id')
      .eq('slug', weddingSlug)
      .single();

    if (weddingError || !wedding) {
      return NextResponse.json({ error: 'Wedding not found' }, { status: 404 });
    }

    const expected = await getExpectedWeddingPassword(supabase, wedding.id);
    if (!expected) {
      return NextResponse.json(
        { valid: false, error: 'No password configured for this wedding' },
        { status: 401 },
      );
    }

    if (password !== expected) {
      return NextResponse.json({ valid: false, error: 'Invalid password' }, { status: 401 });
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error('Password verify error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
