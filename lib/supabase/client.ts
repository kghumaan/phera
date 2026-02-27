import { createBrowserClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { PheraDatabase } from './types'
import { SupabaseClient } from '@supabase/supabase-js'

export type TypedSupabaseClient = SupabaseClient<PheraDatabase, 'public'>

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createBrowserClient<PheraDatabase, 'public'>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      detectSessionInUrl: false,
      flowType: 'pkce',
    }
  }
) as unknown as TypedSupabaseClient

export function getSupabaseClient() {
  return supabase
}

// Public client for preview/guest routes - no auth, no Navigator Lock contention.
// Uses createClient directly (not createBrowserClient which returns a singleton).
let _publicClient: TypedSupabaseClient | null = null
export function getPublicSupabaseClient(): TypedSupabaseClient {
  if (!_publicClient) {
    _publicClient = createClient<PheraDatabase>(
      supabaseUrl,
      supabaseAnonKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        }
      }
    ) as unknown as TypedSupabaseClient
  }
  return _publicClient
}
