import { describe, it, expect } from 'vitest';
import { PRICING_TIERS, PLANNER_TIER } from '@/lib/pricing/tiers';
import { FAQ_ITEMS } from '@/lib/landing/faq-content';

/**
 * Asserts against the REAL data modules that drive the landing page
 * (lib/pricing/tiers.ts + lib/landing/faq-content.ts). An earlier version
 * of this file asserted a hardcoded local copy of a 3-tier NRI/domestic
 * pricing model ($349/$599/$799 + INR) that was never shipped — it tested
 * nothing. If these tests fail, the landing page actually changed.
 */

describe('Landing page pricing (lib/pricing/tiers.ts)', () => {
  it('has exactly three couple tiers: free, paid, white_glove', () => {
    expect(PRICING_TIERS.map((t) => t.id)).toEqual(['free', 'paid', 'white_glove']);
  });

  it('has a genuinely free tier', () => {
    const free = PRICING_TIERS.find((t) => t.id === 'free')!;
    expect(free.price).toBe('$0');
    expect(free.features.length).toBeGreaterThan(0);
  });

  it('prices Base at $349 as the highlighted tier', () => {
    const base = PRICING_TIERS.find((t) => t.id === 'paid')!;
    expect(base.price).toBe('$349');
    expect(base.highlight).toBe(true);
  });

  it('prices White Glove at $599 with an external contact CTA', () => {
    const wg = PRICING_TIERS.find((t) => t.id === 'white_glove')!;
    expect(wg.price).toBe('$599');
    expect(wg.buttonHref).toMatch(/^https?:\/\//);
  });

  it('prices the planner tier at $249 per wedding', () => {
    expect(PLANNER_TIER.price).toBe('$249');
    expect(PLANNER_TIER.priceSuffix).toBe('/wedding');
  });

  it('formats every price as USD', () => {
    for (const t of [...PRICING_TIERS, PLANNER_TIER]) {
      expect(t.price).toMatch(/^\$\d+$/);
    }
  });
});

describe('Landing page FAQ (lib/landing/faq-content.ts)', () => {
  it('has questions with answers', () => {
    expect(FAQ_ITEMS.length).toBeGreaterThanOrEqual(8);
    for (const f of FAQ_ITEMS) {
      expect(f.q.trim().length).toBeGreaterThan(0);
      expect(f.q.trim().endsWith('?')).toBe(true);
      expect(f.a.trim().length).toBeGreaterThan(0);
    }
  });

  it('covers the non-replying-guest question', () => {
    expect(FAQ_ITEMS.some((f) => f.q.includes("doesn't reply on WhatsApp"))).toBe(true);
  });

  it('covers guest data safety', () => {
    expect(FAQ_ITEMS.some((f) => f.q.includes('data safe'))).toBe(true);
  });

  it('covers the free tier honestly', () => {
    const freeFaq = FAQ_ITEMS.find((f) => f.q.includes('free tier'))!;
    expect(freeFaq.a).toContain('$349');
  });

  it('does not claim unattended auto-sending — approval is always in the loop', () => {
    const coordination = FAQ_ITEMS.find((f) => f.q.includes('guest coordination'))!;
    expect(coordination.a.toLowerCase()).toContain('approve');
  });
});
