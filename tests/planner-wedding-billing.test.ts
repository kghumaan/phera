import { describe, it, expect } from 'vitest';
import {
  PLANNER_PER_WEDDING_AMOUNT_CENTS,
  PLANNER_PER_WEDDING_CURRENCY,
  buildPlannerWeddingDefaults,
  findUniqueSlug,
  generateWeddingSlug,
} from '@/lib/stripe/planner-wedding';

describe('planner per-wedding billing helpers', () => {
  describe('constants', () => {
    it('charges $249 USD per wedding', () => {
      expect(PLANNER_PER_WEDDING_AMOUNT_CENTS).toBe(24900);
      expect(PLANNER_PER_WEDDING_CURRENCY).toBe('usd');
    });
  });

  describe('generateWeddingSlug', () => {
    it('lowercases and dashes a normal name', () => {
      expect(generateWeddingSlug('Sarah & Mike')).toBe('sarah-mike');
    });

    it('strips trailing/leading separators', () => {
      expect(generateWeddingSlug('  Priya and Rahul!  ')).toBe('priya-and-rahul');
    });

    it('returns empty for an entirely-symbol input', () => {
      expect(generateWeddingSlug('!!!')).toBe('');
    });

    it('preserves numerals', () => {
      expect(generateWeddingSlug('Sam & Jess 2026')).toBe('sam-jess-2026');
    });
  });

  describe('findUniqueSlug', () => {
    it('returns base slug when available', async () => {
      const slug = await findUniqueSlug('couple', async () => true);
      expect(slug).toBe('couple');
    });

    it('appends counter when base is taken', async () => {
      const taken = new Set(['couple', 'couple-1']);
      const slug = await findUniqueSlug('couple', async (s) => !taken.has(s));
      expect(slug).toBe('couple-2');
    });
  });

  describe('buildPlannerWeddingDefaults', () => {
    it('produces a draft wedding payload tied to the user', () => {
      const defaults = buildPlannerWeddingDefaults('sam-jess', 'Sam & Jess', 'user-123');
      expect(defaults.slug).toBe('sam-jess');
      expect(defaults.couple_name).toBe('Sam & Jess');
      expect(defaults.created_by).toBe('user-123');
      expect(defaults.status).toBe('draft');
      expect(defaults.background_image).toMatch(/^\//);
      expect(defaults.primary_color).toMatch(/^#/);
    });
  });
});
