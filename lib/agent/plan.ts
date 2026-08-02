import type { SupabaseClient } from '@supabase/supabase-js';

/** The only tiers that grant Pro features. Allowlist, not "anything except
 *  free": legacy values like 'basic'/'pro' (the old wizard wrote 'basic' for
 *  every signup) must never silently grant paid access again. Mirrors
 *  PlanContext. */
export const PAID_TIERS = new Set(['phera_premium', 'phera_grand', 'planner']);

/**
 * Whether the user is on a paid plan. subscription_tier 'phera' (or unset,
 * or any unknown/legacy value) = Basic/free. Fail-open to Basic (false) so
 * gating never silently grants paid access.
 */
export async function getUserIsPro(supabase: SupabaseClient, userId: string): Promise<boolean> {
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
