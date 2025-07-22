import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

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
      const cookieStore = cookies();
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

      // Exchange the code for a session
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      
      if (exchangeError) throw exchangeError;

      // Determine redirect URL - go to main guest page if authenticated
      const redirectUrl = new URL('/', origin);
      
      // Add a flag to trigger client-side auth refresh
      redirectUrl.searchParams.set('auth_success', 'true');

      // Preserve PIN verification state by setting it in the redirect URL
      if (pinVerified === 'true' && pinTimestamp) {
        redirectUrl.searchParams.set('restore_pin', 'true');
        redirectUrl.searchParams.set('pin_timestamp', pinTimestamp);
        redirectUrl.searchParams.set('allows_plus_one', allowsPlusOne || 'false');
      } else {
        // If no existing PIN verification, bypass PIN entry for magic link users
        redirectUrl.searchParams.set('bypass_pin', 'true');
      }

      return NextResponse.redirect(redirectUrl);

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