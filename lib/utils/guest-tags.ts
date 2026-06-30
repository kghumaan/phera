/**
 * Guest tag helpers.
 *
 * Guests are tagged via `logistics_data.tags` (a string array — written by the
 * agent's add_guest/update_guest tools and the guest-list UI). A legacy single
 * `logistics_data.tag` string also exists on older rows. Broadcast targeting
 * historically read only the singular field, which silently skipped every guest
 * tagged the modern (array) way. These helpers read BOTH shapes so tag-targeted
 * broadcasts resolve correctly everywhere.
 */

/** Normalize a guest's tags to a clean string[] from either shape. */
export function guestTags(logisticsData: unknown): string[] {
  if (!logisticsData || typeof logisticsData !== 'object') return [];
  const ld = logisticsData as { tags?: unknown; tag?: unknown };
  const raw = ld.tags ?? ld.tag ?? [];
  const arr = Array.isArray(raw) ? raw : [raw];
  return arr.filter((t): t is string => typeof t === 'string' && t.trim().length > 0);
}

/** True if the guest carries at least one of the target tags. */
export function guestMatchesTags(logisticsData: unknown, targetTags: string[]): boolean {
  if (!targetTags.length) return false;
  const wanted = new Set(targetTags);
  return guestTags(logisticsData).some((t) => wanted.has(t));
}
