import { createBrowserClient } from '@supabase/ssr'
import { Database } from './types'

// Create a singleton instance to avoid multiple client warnings
let supabaseInstance: ReturnType<typeof createBrowserClient<Database>> | null = null

function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Disable automatic session detection from URL
        // The auth callback route handles code exchange server-side
        detectSessionInUrl: false,
        flowType: 'pkce',
      }
    }
  )
}

export function getSupabaseClient() {
  if (typeof window === 'undefined') {
    // Return a dummy client for SSR - will be replaced on client side
    return createClient()
  }

  if (!supabaseInstance) {
    supabaseInstance = createClient()
  }
  return supabaseInstance
}

// Export for backward compatibility
export const supabase = getSupabaseClient()
