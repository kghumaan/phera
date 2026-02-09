import { createBrowserClient } from '@supabase/ssr'
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
