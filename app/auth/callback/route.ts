import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Helper function to process pending wedding invites for a user
async function processPendingInvites(supabase: ReturnType<typeof createRouteHandlerClient>, userId: string, userEmail: string): Promise<number> {
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
      const cookieStore = await cookies();
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

      // Exchange the code for a session
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      
      if (exchangeError) throw exchangeError;

      // Process any pending wedding invites for this user
      if (data.session?.user?.email) {
        await processPendingInvites(supabase, data.session.user.id, data.session.user.email);
      }

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
      // Priority 3: Check if user has access to any wedding (created or invited)
      else if (data.session) {
        // First check for weddings they created
        const { data: ownedWeddings } = await supabase
          .from('weddings')
          .select('slug')
          .eq('created_by', data.session.user.id)
          .limit(1);

        if (ownedWeddings && ownedWeddings.length > 0) {
          // User has their own wedding, send to their wedding's onboarding overview
          redirectUrl = new URL(`/admin/onboarding/${ownedWeddings[0].slug}/overview`, origin);
        } else {
          // Check if they have access via wedding_admins (from invite)
          const { data: adminWeddings } = await supabase
            .from('wedding_admins')
            .select('wedding_id')
            .eq('user_id', data.session.user.id)
            .limit(1);

          if (adminWeddings && adminWeddings.length > 0) {
            // Get the wedding slug for this wedding
            const { data: wedding } = await supabase
              .from('weddings')
              .select('slug')
              .eq('id', adminWeddings[0].wedding_id)
              .single();

            if (wedding) {
              redirectUrl = new URL(`/admin/onboarding/${wedding.slug}/overview`, origin);
            } else {
              redirectUrl = new URL('/admin/onboarding/new/overview', origin);
            }
          } else {
            // New user with no wedding - send straight to onboarding
            redirectUrl = new URL('/admin/onboarding/new/overview', origin);
          }
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