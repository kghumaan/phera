import { supabase } from './client'

export interface AuthResult {
  success: boolean
  user?: {
    id: string
    email: string
    name: string
    phone?: string
    avatar_style?: string
    avatar_seed?: string
    avatar_svg?: string
  }
  error?: string
}

// Google Sign In
export async function signInWithGoogle(): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/rsvp`,
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
export async function getCurrentUser(): Promise<AuthResult> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { success: false, error: 'No user session found' }
    }

    // Try to get enhanced user data from guests table first
    let guestData = null;
    if (user.email) {
      const { data: guest } = await supabase
        .from('guests')
        .select('id, name, email, phone, avatar_style, avatar_seed, avatar_svg')
        .eq('email', user.email.toLowerCase())
        .eq('wedding_id', 'sim-kv')
        .single();
      
      guestData = guest;
    }

    // If not found in guests table, check if this is a plus one authentication
    if (!guestData && user.email) {
      const { data: rsvpData } = await supabase
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
        .eq('wedding_id', 'sim-kv')
        .single();

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
      }
    }

    return {
      success: true,
      user: {
        id: guestData?.id || user.id,
        email: user.email || '',
        name: guestData?.name || user.user_metadata?.full_name || user.email || user.phone || '',
        phone: guestData?.phone || user.phone,
        avatar_style: guestData?.avatar_style,
        avatar_seed: guestData?.avatar_seed,
        avatar_svg: guestData?.avatar_svg,
      }
    }
  } catch (error) {
    console.error('Get current user error:', error)
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
export async function validateEmailExists(email: string): Promise<{ exists: boolean; guest?: any; isPlusOne?: boolean; mainGuest?: any }> {
  try {
    // First check if email exists in guests table (main guest)
    const { data: guest, error } = await supabase
      .from('guests')
      .select('id, name, email, phone, avatar_style, avatar_seed, avatar_svg')
      .eq('email', email.trim().toLowerCase())
      .eq('wedding_id', 'sim-kv')
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
      .eq('wedding_id', 'sim-kv')
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

// Enhanced email magic link with state preservation
export async function sendMagicLink(email: string, preservePin: boolean = false): Promise<AuthResult> {
  try {
    // First validate if email exists
    const validation = await validateEmailExists(email);
    if (!validation.exists) {
      return {
        success: false,
        error: 'Email address not found in our guest list. Please check your email or contact the couple.'
      };
    }

    // Prepare redirect URL with state preservation
    const redirectUrl = new URL('/auth/callback', window.location.origin);
    
    // If PIN verification should be preserved, add it to the state
    if (preservePin && typeof window !== 'undefined') {
      const pinVerified = localStorage.getItem('phera_pin_verified');
      const pinTimestamp = localStorage.getItem('phera_pin_timestamp');
      const allowsPlusOne = localStorage.getItem('phera_allows_plus_one');
      
      if (pinVerified === 'true' && pinTimestamp) {
        redirectUrl.searchParams.set('pin_verified', 'true');
        redirectUrl.searchParams.set('pin_timestamp', pinTimestamp);
        redirectUrl.searchParams.set('allows_plus_one', allowsPlusOne || 'false');
      }
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        shouldCreateUser: true, // Allow user creation - validation ensures they exist in guests table
        emailRedirectTo: redirectUrl.toString(),
      }
    });

    if (error) throw error;

    return { 
      success: true
    };
  } catch (error) {
    console.error('Magic link error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send magic link'
    };
  }
} 