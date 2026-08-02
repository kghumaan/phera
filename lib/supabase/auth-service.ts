import { supabase } from './client'

export interface AuthResult {
  success: boolean
  user?: {
    id: string
    guestId?: string | null
    email: string
    name: string
    phone?: string
    avatar_style?: string | null
    avatar_seed?: string | null
    avatar_svg?: string | null
  }
  error?: string
}

// Google Sign In
export async function signInWithGoogle(redirectTo?: string): Promise<AuthResult> {
  try {
    // Build the callback URL with redirect parameter
    const callbackUrl = new URL('/auth/callback', window.location.origin);

    // Use provided redirect or default to /rsvp
    const finalRedirect = redirectTo || '/rsvp';
    callbackUrl.searchParams.set('redirect', finalRedirect);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl.toString(),
      }
    })

    if (error) throw error

    // If successful, the user will be redirected and we'll handle the session in the component
    return { success: true }
  } catch (error) {
    console.error('Google sign in error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to sign in with Google'
    }
  }
}

// Phone Sign In (OTP)
export async function signInWithPhone(phone: string): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.signInWithOtp({
      phone: phone,
    })

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('Phone sign in error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send verification code'
    }
  }
}

// Verify OTP for phone authentication
export async function verifyOTP(phone: string, token: string): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      phone: phone,
      token: token,
      type: 'sms'
    })

    if (error) throw error

    const user = data.user
    if (!user) throw new Error('No user returned after verification')

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.full_name || user.phone || '',
        phone: user.phone || phone,
      }
    }
  } catch (error) {
    console.error('OTP verification error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to verify code'
    }
  }
}

// Get current user session
export async function getCurrentUser(weddingSlug?: string): Promise<AuthResult> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()

    console.log('getCurrentUser: Checking session...', { user: user?.email, error });

    if (!user) {
      console.log('getCurrentUser: No user session found');
      return { success: false, error: 'No user session found' }
    }

    console.log('getCurrentUser: Found Supabase session for:', user.email);

    // If no wedding slug provided, return just the auth user data (no guest lookup)
    if (!weddingSlug) {
      return {
        success: true,
        user: {
          id: user.id,
          email: user.email || '',
          name: user.user_metadata?.full_name || user.email || user.phone || '',
          phone: user.phone,
        }
      };
    }

    // Try to get enhanced user data from guests table first
    let guestData = null;
    if (user.email) {
      console.log('getCurrentUser: Looking up guest data for:', user.email.toLowerCase());
      const { data: guest, error: guestError } = await supabase
        .from('guests')
        .select('id, name, email, phone, avatar_style, avatar_seed, avatar_svg')
        .eq('email', user.email.toLowerCase())
        .eq('wedding_id', weddingSlug)
        .single();

      console.log('getCurrentUser: Guest lookup result:', { guest, guestError });
      guestData = guest;
    }

    // If not found in guests table, check if this is a plus one authentication
    if (!guestData && user.email) {
      console.log('getCurrentUser: Checking plus-one data for:', user.email.toLowerCase());
      const { data: rsvpData, error: rsvpError } = await supabase
        .from('rsvps')
        .select(`
          id,
          plus_one_name,
          plus_one_email,
          guest_id,
          guests (
            id,
            name,
            email,
            phone,
            avatar_style,
            avatar_seed,
            avatar_svg
          )
        `)
        .eq('plus_one_email', user.email.toLowerCase())
        .eq('wedding_id', weddingSlug)
        .single();

      console.log('getCurrentUser: Plus-one lookup result:', { rsvpData, rsvpError });

      if (rsvpData && rsvpData.plus_one_email) {
        // Create user data for plus one
        guestData = {
          id: `plus-one-${rsvpData.guest_id}`,
          name: rsvpData.plus_one_name || 'Plus One',
          email: rsvpData.plus_one_email,
          phone: null,
          avatar_style: null,
          avatar_seed: null,
          avatar_svg: null
        };
        console.log('getCurrentUser: Created plus-one user data:', guestData);
      }
    }

    const result = {
      success: true,
      user: {
        id: user.id, // Always use auth.users.id for admin checks and auth purposes
        guestId: guestData?.id || null, // Guest table ID for guest-specific operations
        email: user.email || '',
        name: guestData?.name || user.user_metadata?.full_name || user.email || user.phone || '',
        phone: guestData?.phone || user.phone,
        avatar_style: guestData?.avatar_style,
        avatar_seed: guestData?.avatar_seed,
        avatar_svg: guestData?.avatar_svg,
      }
    };

    console.log('getCurrentUser: Returning result:', result);
    return result;
  } catch (error) {
    console.error('getCurrentUser: Error occurred:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get user session'
    }
  }
}

// Sign out
export async function signOut(): Promise<void> {
  await supabase.auth.signOut()
}

// Validate if email exists in guests table or as plus one before sending magic link
export async function validateEmailExists(email: string, weddingSlug?: string): Promise<{ exists: boolean; guest?: any; isPlusOne?: boolean; mainGuest?: any }> {
  // If no wedding slug, we can't validate against a guest list - allow the email through
  if (!weddingSlug) {
    return { exists: true };
  }

  try {
    // First check if email exists in guests table (main guest)
    const { data: guest, error } = await supabase
      .from('guests')
      .select('id, name, email, phone, avatar_style, avatar_seed, avatar_svg')
      .eq('email', email.trim().toLowerCase())
      .eq('wedding_id', weddingSlug)
      .single();

    if (guest) {
      return {
        exists: true,
        guest: guest,
        isPlusOne: false
      };
    }

    // If not found in guests table, check if email exists as plus one
    const { data: rsvpData, error: rsvpError } = await supabase
      .from('rsvps')
      .select(`
        id,
        plus_one_name,
        plus_one_email,
        guest_id,
        guests (
          id,
          name,
          email,
          phone,
          avatar_style,
          avatar_seed,
          avatar_svg
        )
      `)
      .eq('plus_one_email', email.trim().toLowerCase())
      .eq('wedding_id', weddingSlug)
      .single();

    if (rsvpData && rsvpData.plus_one_email) {
      // Create a virtual guest object for the plus one
      const plusOneGuest = {
        id: `plus-one-${rsvpData.guest_id}`,
        name: rsvpData.plus_one_name || 'Plus One',
        email: rsvpData.plus_one_email,
        phone: null,
        avatar_style: null,
        avatar_seed: null,
        avatar_svg: null
      };

      return {
        exists: true,
        guest: plusOneGuest,
        isPlusOne: true,
        mainGuest: rsvpData.guests
      };
    }

    // If neither main guest nor plus one found
    if (error && error.code !== 'PGRST116' && rsvpError && rsvpError.code !== 'PGRST116') {
      throw error || rsvpError;
    }

    return { exists: false };
  } catch (error) {
    console.error('Error validating email:', error);
    return { exists: false };
  }
}

// Enhanced email OTP with state preservation (renamed from sendMagicLink)
export async function sendEmailOTP(email: string): Promise<AuthResult> {
  try {
    // First validate that the email exists in our system (using lowercase for DB query)
    const validation = await validateEmailExists(email);
    if (!validation.exists) {
      return {
        success: false,
        error: 'Email address not found in our guest list. Please check your email or contact the couple.'
      };
    }

    // Send email OTP (no redirect URL needed for OTP)
    // IMPORTANT: Use original email case for Supabase Auth to match existing accounts
    // Only use lowercase for our database queries, not for Supabase Auth
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(), // Keep original case for Supabase Auth compatibility
      options: {
        shouldCreateUser: true, // Allow user creation - validation ensures they exist in guests table
        // No emailRedirectTo needed for OTP - codes are entered directly in the UI
        data: {
          // Store the email in user metadata for consistency
          email: email.trim().toLowerCase(), // Lowercase for internal consistency
        }
      }
    });

    if (error) {
      console.error('Email OTP error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Send email OTP error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email OTP'
    };
  }
}

// New function to verify email OTP code
export async function verifyEmailOTP(email: string, token: string): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: token.trim(),
      type: 'email'
    });

    if (error) {
      console.error('Email OTP verification error:', error);
      return {
        success: false,
        error: error.message === 'Invalid OTP' ? 'Invalid or expired code. Please try again.' : error.message
      };
    }

    if (!data.user || !data.session) {
      return {
        success: false,
        error: 'Authentication failed. Please try again.'
      };
    }

    return {
      success: true
      // Note: user will be handled by the auth context after verification
    };
  } catch (error) {
    console.error('Verify email OTP error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to verify code'
    };
  }
}

// Verify signup OTP (email confirmation after signUp)
export async function verifySignupOTP(email: string, token: string): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: token.trim(),
      type: 'signup'
    });

    if (error) {
      console.error('Signup OTP verification error:', error);
      return {
        success: false,
        error: error.message === 'Invalid OTP' ? 'Invalid or expired code. Please try again.' : error.message
      };
    }

    if (!data.user || !data.session) {
      return {
        success: false,
        error: 'Verification failed. Please try again.'
      };
    }

    return {
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email || '',
        name: data.user.user_metadata?.full_name || data.user.email || '',
      }
    };
  } catch (error) {
    console.error('Verify signup OTP error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to verify code'
    };
  }
}

// Keep the old function for backward compatibility, but make it use OTP
export async function sendMagicLink(email: string): Promise<AuthResult> {
  // Redirect to the new OTP function
  return sendEmailOTP(email);
} 