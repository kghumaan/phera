import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Whether the user is on a paid plan. Mirrors PlanContext:
 * subscription_tier 'phera' (or unset) = Basic/free; anything else = Pro.
 * Fail-open to Basic (false) so gating never silently grants paid access.
 */
export async function getUserIsPro(supabase: SupabaseClient, userId: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('user_settings')
      .select('subscription_tier')
      .eq('user_id', userId)
      .maybeSingle();
    const tier = data?.subscription_tier;
    return !!tier && tier !== 'phera';
  } catch {
    return false;
  }
}
