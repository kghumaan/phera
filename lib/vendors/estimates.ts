/**
 * Best-guess PLACEHOLDER estimates for figures we don't yet hold real data for:
 * a venue's guest capacity and the all-in cost of hosting a multi-day wedding
 * there. These are deliberately rough and must ALWAYS be surfaced behind the
 * `EstimateInfo` icon (components/shared/EstimateInfo) — never presented as a
 * confirmed quote. Deterministic inputs in → stable output, so a given venue
 * always shows the same placeholder.
 *
 * Only venues + hotels "host" weddings, so both helpers return null for other
 * vendor categories (photographer, DJ, …) and callers simply skip the row.
 */

/** Categories that actually host a wedding (and so have capacity + a venue cost). */
const HOSTS_WEDDINGS = new Set(['venue', 'hotel']);

export interface CapacityEstimate {
  min: number;
  max: number;
}

export interface CostEstimate {
  minUsd: number;
  maxUsd: number;
}

export const ESTIMATE_NOTE =
  'Ballpark estimate — not a confirmed quote. Actual capacity and cost depend on your dates, guest count, room block and package. We confirm real figures with the venue.';

/**
 * Guess a venue's guest capacity. We have no capacity data yet, so we lean on
 * review_count as a weak proxy for size (large resorts collect far more reviews
 * than boutique properties). Placeholder only.
 */
export function estimateGuestCapacity(v: {
  category: string;
  review_count: number | null;
}): CapacityEstimate | null {
  if (!HOSTS_WEDDINGS.has(v.category)) return null;
  const reviews = v.review_count ?? 0;
  if (reviews >= 4000) return { min: 350, max: 700 };
  if (reviews >= 1500) return { min: 250, max: 500 };
  if (reviews >= 500) return { min: 150, max: 350 };
  if (reviews >= 100) return { min: 100, max: 250 };
  return { min: 80, max: 200 };
}

/**
 * Rough all-in cost of a 3-day destination wedding at this venue (venue hire +
 * events + a room block), tiered off Google's price level (stored as the
 * price_range USD band). When we have no price signal, lean on the quality
 * rating. Placeholder only — always shown behind the estimate info icon.
 */
export function estimateWeddingCostUsd(v: {
  category: string;
  price_range_max: number | null;
  rating: number | null;
}): CostEstimate | null {
  if (!HOSTS_WEDDINGS.has(v.category)) return null;
  const bands: CostEstimate[] = [
    { minUsd: 10_000, maxUsd: 25_000 }, // value
    { minUsd: 20_000, maxUsd: 45_000 }, // mid
    { minUsd: 40_000, maxUsd: 80_000 }, // upscale
    { minUsd: 75_000, maxUsd: 150_000 }, // luxury
  ];
  const max = v.price_range_max;
  let tier: number;
  if (max != null) tier = max <= 1500 ? 0 : max <= 4000 ? 1 : max <= 10_000 ? 2 : 3;
  else tier = (v.rating ?? 0) >= 4.7 ? 2 : 1; // unknown price → lean on quality
  return bands[tier];
}

/** "$10K", "$8K", "$150K" — compact USD for the estimate chips. */
function usdCompact(n: number): string {
  return n >= 1000 ? `$${Math.round(n / 1000)}K` : `$${n}`;
}

export function formatCapacity(c: CapacityEstimate): string {
  return `${c.min}–${c.max} guests`;
}

export function formatCostBand(c: CostEstimate): string {
  return `${usdCompact(c.minUsd)}–${usdCompact(c.maxUsd)}`;
}
