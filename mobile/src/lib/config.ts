/**
 * Runtime configuration — production defaults baked in so a fresh clone
 * connects to the real backend with zero setup (`npx expo run:ios` and go).
 *
 * Precedence per value: EXPO_PUBLIC_* env var (set in .env or eas.json)
 * → production default. Preview mode (mock fixtures, no network) is
 * explicit opt-in via EXPO_PUBLIC_PREVIEW=1 — it is never inferred.
 *
 * The Supabase anon key is a public client credential: it ships in the
 * phera.io web bundle to every visitor and is safe in source. All data
 * access behind it is enforced by RLS.
 */

const PROD_SUPABASE_URL = 'https://vmuqlmxzzztkungxchbc.supabase.co';
const PROD_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtdXFsbXh6enp0a3VuZ3hjaGJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MzQ4NTgsImV4cCI6MjA2NTUxMDg1OH0.Hm4Bg4dJEDtpgLkO3ilGaaHZrD-k1OSJ_WI88Lskoqo';
// www directly — phera.io 308s to www.phera.io, and a redirect on every
// SSE POST is a needless failure point.
const PROD_API_BASE = 'https://www.phera.io';

export const isPreviewMode = process.env.EXPO_PUBLIC_PREVIEW === '1';

export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || PROD_SUPABASE_URL;

export const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || PROD_SUPABASE_ANON_KEY;

/** Base URL for the Next.js API routes (agent chat, guest access, …). */
export const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL || PROD_API_BASE;
