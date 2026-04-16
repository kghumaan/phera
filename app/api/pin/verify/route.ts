import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// In-memory rate limiting: Map<ip, { count, resetAt }>
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const MAX_ATTEMPTS = 6;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true };
  }

  if (entry.count >= MAX_ATTEMPTS) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  entry.count++;
  return { allowed: true };
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown';

    const { allowed, retryAfter } = checkRateLimit(ip);
    if (!allowed) {
      const minutes = Math.ceil((retryAfter || 0) / 60);
      return NextResponse.json(
        { error: `Too many incorrect attempts. Please wait ${minutes} minute${minutes > 1 ? 's' : ''} before trying again.`, retryAfter },
        {
          status: 429,
          headers: { 'Retry-After': String(retryAfter) },
        }
      );
    }

    const { weddingSlug, pin } = await request.json();

    if (!weddingSlug || !pin) {
      return NextResponse.json(
        { error: 'Missing weddingSlug or pin' },
        { status: 400 }
      );
    }

    // Get the wedding ID from slug
    const { data: wedding, error: weddingError } = await supabase
      .from('weddings')
      .select('id')
      .eq('slug', weddingSlug)
      .single();

    if (weddingError || !wedding) {
      return NextResponse.json(
        { error: 'Wedding not found' },
        { status: 404 }
      );
    }

    // Get pin codes from wedding settings
    const { data: settings, error: settingsError } = await supabase
      .from('wedding_settings')
      .select('pin_codes')
      .eq('wedding_id', wedding.id)
      .maybeSingle();

    if (settingsError) {
      return NextResponse.json(
        { error: 'Failed to verify PIN' },
        { status: 500 }
      );
    }

    const pinCodes = (settings?.pin_codes || []) as Array<{
      pin: string;
      type: string;
      allows_plus_one: boolean;
      skip_rsvp?: boolean;
      hidden_events?: string[];
    }>;

    const matchedPin = pinCodes.find((p) => p.pin === pin);

    if (!matchedPin) {
      return NextResponse.json(
        { valid: false, error: 'Invalid PIN' },
        { status: 401 }
      );
    }

    // PIN is valid — return metadata (but not the PIN codes themselves)
    return NextResponse.json({
      valid: true,
      type: matchedPin.type,
      allows_plus_one: matchedPin.allows_plus_one,
      skip_rsvp: matchedPin.skip_rsvp || false,
      hidden_events: matchedPin.hidden_events || [],
    });
  } catch (error) {
    console.error('PIN verify error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
