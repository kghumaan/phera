import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Resolve a wedding's guest password.
 *
 * Canonical home is `wedding_secrets` (admin-only RLS, no anon read —
 * migrations/20260705_wedding_secrets.sql). During the transition we fall
 * back to the legacy `wedding_settings.wedding_password` column so
 * passwords set by the pre-secrets deployment keep working until
 * 20260705b drops that column (after which the fallback query errors and
 * we return null from it harmlessly).
 */
export async function getExpectedWeddingPassword(
  supabase: SupabaseClient,
  weddingId: string,
): Promise<string | null> {
  const { data: secret } = await supabase
    .from('wedding_secrets')
    .select('wedding_password')
    .eq('wedding_id', weddingId)
    .maybeSingle();
  if (secret?.wedding_password) return secret.wedding_password;

  const { data: legacy } = await supabase
    .from('wedding_settings')
    .select('wedding_password')
    .eq('wedding_id', weddingId)
    .maybeSingle();
  return (legacy as { wedding_password?: string | null } | null)?.wedding_password ?? null;
}
