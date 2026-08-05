import type { SupabaseClient } from '@supabase/supabase-js';
import { isSuperAdminEmail } from '@/lib/constants/super-admins';

/** The only tiers that grant Pro features. Allowlist, not "anything except
 *  free": legacy values like 'basic'/'pro' (the old wizard wrote 'basic' for
 *  every signup) must never silently grant paid access again. Mirrors
 *  PlanContext. */
export const PAID_TIERS = new Set(['phera_premium', 'phera_grand', 'planner']);

/**
 * Whether the user is on a paid plan. subscription_tier 'phera' (or unset,
 * or any unknown/legacy value) = Basic/free. Fail-open to Basic (false) so
 * gating never silently grants paid access.
 *
 * Super admins (SUPER_ADMIN_EMAILS) are Pro by default regardless of
 * subscription_tier — no per-user DB row needed. Pass `email` when the
 * caller already has it to skip the DB round-trip.
 */
export async function getUserIsPro(
  supabase: SupabaseClient,
  userId: string,
  email?: string | null
): Promise<boolean> {
  if (isSuperAdminEmail(email)) return true;
  try {
    const { data } = await supabase
      .from('user_settings')
      .select('subscription_tier')
      .eq('user_id', userId)
      .maybeSingle();
    return PAID_TIERS.has(data?.subscription_tier ?? '');
  } catch {
    return false;
  }
}
