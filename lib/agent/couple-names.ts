import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Recording the couple's names is the single most important write in onboarding
 * and it must NOT depend on the model remembering to call a tool.
 *
 * Production UAT (2026-07-14) caught exactly that: the agent greeted people
 * warmly by name — "Lovely to meet you, Kavya & Aditya!" — and their wedding row
 * still said "Your Wedding", because the turn only called ask_user and moved on.
 * A mechanical write belongs in code, not in a prompt.
 */

/** "Priya & Rahul" / "Priya and Rahul" / "Priya, Rahul" → the two partners. */
export function parseCoupleNames(raw: string): {
  couple_name: string;
  partner1_name: string;
  partner2_name: string;
} {
  const couple = raw.trim().replace(/\s+/g, ' ');
  const parts = couple
    .split(/\s+(?:&|\+|and)\s+|\s*,\s*/i)
    .map((p) => p.trim())
    .filter(Boolean);
  return {
    couple_name: couple,
    partner1_name: parts[0] ?? '',
    partner2_name: parts[1] ?? '',
  };
}

/**
 * Write the names straight to the wedding row. Returns false if there was
 * nothing usable to write. Never throws — a failure here must not break the
 * conversation, and the agent's own update_wedding_details is still a backstop.
 */
export async function persistCoupleNames(
  supabase: SupabaseClient,
  weddingUuid: string,
  raw: unknown
): Promise<boolean> {
  if (typeof raw !== 'string' || !raw.trim()) return false;
  const names = parseCoupleNames(raw);
  if (!names.partner1_name) return false;
  try {
    const { error } = await supabase.from('weddings').update(names).eq('id', weddingUuid);
    if (error) {
      console.error('persistCoupleNames failed:', error.message);
      return false;
    }
    return true;
  } catch (error) {
    console.error('persistCoupleNames threw:', error);
    return false;
  }
}
