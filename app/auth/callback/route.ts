import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Extract custom redirect parameter (for admin flows)
  const redirectParam = searchParams.get('redirect');
  const nextParam = searchParams.get('next');
  
  // Extract PIN verification state from URL params (for guest flows)
  const pinVerified = searchParams.get('pin_verified');
  const pinTimestamp = searchParams.get('pin_timestamp');
  const allowsPlusOne = searchParams.get('allows_plus_one');

  // Handle authentication error
  if (error) {
    console.error('Auth callback error:', error, errorDescription);
    // Redirect to login page with error
    const redirectUrl = new URL('/auth/login', origin);
    redirectUrl.searchParams.set('error', errorDescription || error);
    return NextResponse.redirect(redirectUrl);
  }

  // Handle successful authentication
  if (code) {
    try {
      const cookieStore = await cookies();
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

      // Exchange the code for a session
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      
      if (exchangeError) throw exchangeError;

      // Determine redirect destination
      let redirectUrl: URL;

      // Priority 1: Use explicit redirect parameter (from login/signup flows)
      if (redirectParam) {
        redirectUrl = new URL(redirectParam, origin);
      } 
      // Priority 2: Use next parameter (alternative name)
      else if (nextParam) {
        redirectUrl = new URL(nextParam, origin);
      }
      // Priority 3: Check if user is a wedding admin (has created weddings)
      else if (data.session) {
        const { data: weddings } = await supabase
          .from('weddings')
          .select('slug')
          .eq('created_by', data.session.user.id)
          .limit(1);

        if (weddings && weddings.length > 0) {
          // User has a wedding, send to their wedding's onboarding overview
          redirectUrl = new URL(`/admin/onboarding/${weddings[0].slug}/overview`, origin);
        } else {
          // New user with no wedding - send straight to onboarding
          redirectUrl = new URL('/admin/onboarding/new/overview', origin);
        }
      }
      // Priority 4: Default to onboarding for new signups
      else {
        redirectUrl = new URL('/admin/onboarding/new/overview', origin);
      }

      // Preserve PIN verification state (for guest flows only)
      if (pinVerified === 'true' && pinTimestamp && redirectUrl.pathname === '/') {
        redirectUrl.searchParams.set('restore_pin', 'true');
        redirectUrl.searchParams.set('pin_timestamp', pinTimestamp);
        redirectUrl.searchParams.set('allows_plus_one', allowsPlusOne || 'false');
      }

      return NextResponse.redirect(redirectUrl);

    } catch (error) {
      console.error('Auth exchange error:', error);
      const redirectUrl = new URL('/auth/login', origin);
      redirectUrl.searchParams.set('error', 'Authentication failed');
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Default redirect if no code or error
  return NextResponse.redirect(new URL('/admin', origin));
} 