import { describe, it, expect } from 'vitest';
import { PRICING_TIERS, PLANNER_TIER } from '@/lib/pricing/tiers';

describe('PRICING_TIERS shape', () => {
  it('exposes Free / Paid / White Glove in order with correct prices', () => {
    expect(PRICING_TIERS).toHaveLength(3);
    expect(PRICING_TIERS[0]).toMatchObject({ id: 'free', price: '$0' });
    expect(PRICING_TIERS[1]).toMatchObject({ id: 'paid', price: '$349', highlight: true });
    expect(PRICING_TIERS[2]).toMatchObject({ id: 'white_glove', price: '$599' });
  });

  it('Free tier covers the spec items (no AI design, no PIN language)', () => {
    const free = PRICING_TIERS[0];
    expect(free.features).toContain('Custom wedding website');
    expect(free.features).toContain('Guest list management');
    expect(free.features).toContain('Guest-level event access control');
    expect(free.features).toContain('Custom RSVP questions');
    expect(free.features).toContain('Task manager');
    expect(free.features).toContain('Multi-user collaboration');
    expect(free.features.some(f => /PIN-gated/i.test(f))).toBe(false);
    expect(free.features.some(f => /AI/i.test(f))).toBe(false);
  });

  it('Paid tier inherits from Free and lists premium services', () => {
    const paid = PRICING_TIERS[1];
    expect(paid.features[0]).toMatch(/Everything in Free/i);
    expect(paid.features).toContain('Room assignments');
    expect(paid.features).toContain('Transportation management');
    expect(paid.features).toContain('WhatsApp Concierge (Inbound & Outbound)');
    expect(paid.features).toContain('WhatsApp bot for the couple');
    expect(paid.features).toContain('Vendor management');
  });

  it('White Glove tier inherits from Base and excludes the dropped items', () => {
    const wg = PRICING_TIERS[2];
    expect(wg.features[0]).toMatch(/Everything in Base/i);
    expect(wg.features).toContain('Dedicated wedding coordinator');
    expect(wg.features).toContain('1-on-1 onboarding calls');
    expect(wg.features).toContain('Priority support');
    expect(wg.features.some(f => /on-site/i.test(f))).toBe(false);
    expect(wg.features.some(f => /weekly status/i.test(f))).toBe(false);
    expect(wg.features.some(f => /stripe/i.test(f))).toBe(false);
  });
});

describe('PLANNER_TIER', () => {
  it('is a single $249/wedding tier', () => {
    expect(PLANNER_TIER.price).toBe('$249');
    expect(PLANNER_TIER.priceSuffix).toBe('/wedding');
  });
});
