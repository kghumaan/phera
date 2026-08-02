import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies, headers } from 'next/headers';

/**
 * Shared server-side auth helper for API routes.
 * Returns authenticated Supabase client and user, or nulls if unauthenticated.
 *
 * Accepts BOTH auth transports:
 * - Cookies (web app, unchanged behavior)
 * - `Authorization: Bearer <access_token>` (the mobile app — it holds a
 *   Supabase session in AsyncStorage and has no cookies)
 */
export async function getAuthenticatedClient() {
  // Bearer path first: mobile clients send the Supabase access token.
  const headerStore = await headers();
  const authHeader = headerStore.get('authorization');
  if (authHeader?.toLowerCase().startsWith('bearer ')) {
    const token = authHeader.slice(7).trim();
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      }
    );
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return { supabase: null, user: null };
    return { supabase, user };
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch {}
        },
      },
    }
  );
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { supabase: null, user: null };
  return { supabase, user };
}
