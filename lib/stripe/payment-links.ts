/**
 * Stripe Payment Link helpers — single redirect-based checkout entry point
 * for the whole app. We standardize on hosted Stripe Payment Links instead
 * of embedded checkout so every paid flow looks and feels the same.
 *
 * Per-user identity is carried via `client_reference_id` (Stripe allowed
 * chars: [a-zA-Z0-9_-], max 200). We pack `userId__weddingSlug` into that
 * single field; webhooks + activate-pro parse it back.
 */

export type PaymentLinkTier = 'base' | 'premium' | 'planner_perwedding';

const TIER_ENV: Record<PaymentLinkTier, string> = {
  base: 'NEXT_PUBLIC_STRIPE_PAYMENT_LINK_BASE',
  premium: 'NEXT_PUBLIC_STRIPE_PAYMENT_LINK_PREMIUM',
  planner_perwedding: 'NEXT_PUBLIC_STRIPE_PAYMENT_LINK_PLANNER_PERWEDDING',
};

const PUBLIC_TIER_URLS: Record<PaymentLinkTier, string | undefined> = {
  base: process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK_BASE,
  premium: process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK_PREMIUM,
  planner_perwedding: process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK_PLANNER_PERWEDDING,
};

const CLIENT_REF_SEPARATOR = '__';

export function encodeClientReference(params: { userId: string; weddingSlug?: string | null }): string {
  const { userId, weddingSlug } = params;
  return weddingSlug ? `${userId}${CLIENT_REF_SEPARATOR}${weddingSlug}` : userId;
}

export function decodeClientReference(ref: string | null | undefined): { userId: string | null; weddingSlug: string | null } {
  if (!ref) return { userId: null, weddingSlug: null };
  const [userId, weddingSlug] = ref.split(CLIENT_REF_SEPARATOR);
  return { userId: userId || null, weddingSlug: weddingSlug || null };
}

export interface BuildPaymentLinkUrlOptions {
  userId: string;
  weddingSlug?: string | null;
  email?: string | null;
}

/**
 * Returns the full Stripe Payment Link URL for the given tier with
 * `client_reference_id` and `prefilled_email` query params attached.
 * Throws if the underlying env var is unset — call sites should treat
 * that as a configuration error (and not a missing payment).
 */
export function buildPaymentLinkUrl(tier: PaymentLinkTier, opts: BuildPaymentLinkUrlOptions): string {
  const base = PUBLIC_TIER_URLS[tier];
  if (!base) {
    throw new Error(`Missing env var ${TIER_ENV[tier]} — configure the Stripe Payment Link URL for tier "${tier}".`);
  }
  const url = new URL(base);
  url.searchParams.set('client_reference_id', encodeClientReference(opts));
  if (opts.email) url.searchParams.set('prefilled_email', opts.email);
  return url.toString();
}

export function isPaymentLinkConfigured(tier: PaymentLinkTier): boolean {
  return !!PUBLIC_TIER_URLS[tier];
}
