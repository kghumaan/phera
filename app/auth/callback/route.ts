import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Extract PIN verification state from URL params
  const pinVerified = searchParams.get('pin_verified');
  const pinTimestamp = searchParams.get('pin_timestamp');
  const allowsPlusOne = searchParams.get('allows_plus_one');

  // Handle authentication error
  if (error) {
    console.error('Auth callback error:', error, errorDescription);
    const redirectUrl = new URL('/', origin);
    redirectUrl.searchParams.set('auth_error', errorDescription || error);
    return NextResponse.redirect(redirectUrl);
  }

  // Handle successful authentication
  if (code) {
    try {
      // Create Supabase client for server-side auth
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // Exchange the code for a session
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      
      if (exchangeError) throw exchangeError;

      // Create response with redirect
      const redirectUrl = new URL('/', origin);
      const response = NextResponse.redirect(redirectUrl);

      // Set auth cookies
      if (data.session) {
        response.cookies.set('supabase-auth-token', data.session.access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7, // 7 days
        });
      }

      // Preserve PIN verification state by setting it in the redirect URL
      if (pinVerified === 'true' && pinTimestamp) {
        redirectUrl.searchParams.set('restore_pin', 'true');
        redirectUrl.searchParams.set('pin_timestamp', pinTimestamp);
        redirectUrl.searchParams.set('allows_plus_one', allowsPlusOne || 'false');
      }

      return response;

    } catch (error) {
      console.error('Auth exchange error:', error);
      const redirectUrl = new URL('/', origin);
      redirectUrl.searchParams.set('auth_error', 'Authentication failed');
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Default redirect if no code or error
  return NextResponse.redirect(new URL('/', origin));
} 