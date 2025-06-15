import { supabase } from './client'

export interface AuthResult {
  success: boolean
  user?: {
    id: string
    email: string
    name: string
    phone?: string
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

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.full_name || user.email || user.phone || '',
        phone: user.phone,
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