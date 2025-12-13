import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/supabase/types';

// Helper function to process pending wedding invites for a user
async function processPendingInvites(supabase: ReturnType<typeof createServerClient<Database>>, userId: string, userEmail: string): Promise<number> {
  try {
    // Find all pending invites for this email
    const { data: invites, error: fetchError } = await supabase
      .from('wedding_invites')
      .select('*')
      .eq('email', userEmail.toLowerCase());

    if (fetchError || !invites || invites.length === 0) {
      return 0;
    }

    let processedCount = 0;

    for (const invite of invites) {
      // Check if user is already an admin for this wedding
      const { data: existingAdmin } = await supabase
        .from('wedding_admins')
        .select('id')
        .eq('wedding_id', invite.wedding_id)
        .eq('user_id', userId)
        .single();

      if (!existingAdmin) {
        // Add user as admin
        const { error: insertError } = await supabase
          .from('wedding_admins')
          .insert([{
            wedding_id: invite.wedding_id,
            user_id: userId,
            role: invite.role,
          }]);

        if (!insertError) {
          // Delete the processed invite
          await supabase
            .from('wedding_invites')
            .delete()
            .eq('id', invite.id);

          processedCount++;
        }
      } else {
        // User already has access, just delete the invite
        await supabase
          .from('wedding_invites')
          .delete()
          .eq('id', invite.id);
      }
    }

    console.log(`Processed ${processedCount} pending invites for ${userEmail}`);
    return processedCount;
  } catch (error) {
    console.error('Error processing pending invites:', error);
    return 0;
  }
}

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
      console.log('[Callback] Received code, exchanging for session...');
      const cookieStore = await cookies();

      const supabase = createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll()
            },
            setAll(cookiesToSet) {
              try {
                cookiesToSet.forEach(({ name, value, options }) =>
                  cookieStore.set(name, value, options)
                )
              } catch {
                // The `setAll` method was called from a Server Component.
                // This can be ignored if you have middleware refreshing
                // user sessions.
              }
            },
          },
        }
      );

      // Exchange the code for a session
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      console.log('[Callback] Exchange result:', {
        hasSession: !!data.session,
        hasUser: !!data.session?.user,
        error: exchangeError
      });

      if (exchangeError) throw exchangeError;

      // Process any pending wedding invites for this user
      if (data.session?.user?.email) {
        await processPendingInvites(supabase, data.session.user.id, data.session.user.email);
      }

      // Determine redirect destination
      let redirectUrl: URL;

      // Priority 1: Use explicit redirect parameter
      if (redirectParam) {
        redirectUrl = new URL(redirectParam, origin);

        // Special handling: If redirecting to /admin/onboarding/new/overview,
        // check if user already has weddings and redirect to existing wedding instead
        if (redirectParam === '/admin/onboarding/new/overview' && data.session?.user?.id) {
          // Check if user has any existing weddings
          const { data: weddings } = await supabase
            .from('weddings')
            .select('slug')
            .eq('created_by', data.session.user.id)
            .order('created_at', { ascending: false })
            .limit(1);

          // If user has existing weddings, redirect to their most recent one
          if (weddings && weddings.length > 0) {
            const weddingSlug = weddings[0].slug;
            redirectUrl = new URL(`/admin/onboarding/${weddingSlug}/overview`, origin);
            console.log(`[Callback] User has existing wedding, redirecting to: ${weddingSlug}`);
          } else {
            // Also check if they're an admin of any weddings
            const { data: adminWeddings } = await supabase
              .from('wedding_admins')
              .select('wedding_id, weddings(slug)')
              .eq('user_id', data.session.user.id)
              .order('created_at', { ascending: false })
              .limit(1);

            if (adminWeddings && adminWeddings.length > 0 && adminWeddings[0].weddings) {
              const weddingSlug = (adminWeddings[0].weddings as any).slug;
              redirectUrl = new URL(`/admin/onboarding/${weddingSlug}/overview`, origin);
              console.log(`[Callback] User is admin of wedding, redirecting to: ${weddingSlug}`);
            }
          }
        }
      }
      // Priority 2: Use next parameter (alternative name)
      else if (nextParam) {
        redirectUrl = new URL(nextParam, origin);
      }
      // Priority 3: Default to /rsvp for guest flows
      else {
        redirectUrl = new URL('/rsvp', origin);
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