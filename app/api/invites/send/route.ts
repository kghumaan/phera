import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { sendTeamInviteEmail } from '@/lib/email/resend';
import { weddingService } from '@/lib/supabase/wedding-service';

export async function POST(request: NextRequest) {
  try {
    // Check environment variables
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { 
          error: 'RESEND_API_KEY is not configured',
          message: 'Please add RESEND_API_KEY to your .env.local file and restart the dev server.'
        },
        { status: 500 }
      );
    }
    
    if (!process.env.RESEND_FROM_EMAIL) {
      return NextResponse.json(
        { 
          error: 'RESEND_FROM_EMAIL is not configured',
          message: 'Please add RESEND_FROM_EMAIL to your .env.local file and restart the dev server.'
        },
        { status: 500 }
      );
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
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
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { inviteId, weddingId } = body;

    if (!inviteId || !weddingId) {
      return NextResponse.json(
        { error: 'Missing inviteId or weddingId' },
        { status: 400 }
      );
    }

    // Get the invite details using server-side client
    const { data: invite, error: inviteError } = await supabase
      .from('wedding_invites')
      .select('*')
      .eq('id', inviteId)
      .eq('wedding_id', weddingId)
      .single();

    if (inviteError || !invite) {
      console.error('Error fetching invite:', inviteError);
      return NextResponse.json(
        { error: 'Invite not found', details: inviteError?.message },
        { status: 404 }
      );
    }

    // Get wedding details
    const wedding = await weddingService.getWeddingById(weddingId);
    if (!wedding) {
      return NextResponse.json(
        { error: 'Wedding not found' },
        { status: 404 }
      );
    }

    // Get inviter's name (current user)
    const inviterName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Someone';

    // Send the email
    const emailResult = await sendTeamInviteEmail({
      to: invite.email,
      inviterName,
      weddingCoupleName: wedding.couple_name,
      weddingSlug: wedding.slug,
      role: invite.role,
    });

    if (!emailResult.success) {
      console.error('Failed to send invite email:', emailResult.error);
      return NextResponse.json(
        { error: 'Failed to send email', details: emailResult.error },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in send invite API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message },
      { status: 500 }
    );
  }
}


