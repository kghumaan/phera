import { describe, it, expect } from 'vitest';
import {
  generateAvatar,
  generateGuestAvatar,
  isValidAvatarData,
  svgToDataUri,
  generateFallbackColor,
  AVATAR_STYLES,
} from '@/lib/utils/avatar-generator';

describe('avatar-generator', () => {
  // ─── generateAvatar ─────────────────────────────────────────────────

  describe('generateAvatar', () => {
    it('should generate an SVG string', () => {
      const result = generateAvatar({ seed: 'test-seed' });
      expect(result.svg).toContain('<svg');
      expect(result.svg).toContain('</svg>');
    });

    it('should generate a data URI', () => {
      const result = generateAvatar({ seed: 'test-seed' });
      expect(result.dataUri).toMatch(/^data:image\/svg\+xml/);
    });

    it('should return the seed and style used', () => {
      const result = generateAvatar({ seed: 'my-seed', style: 'notionists-neutral' });
      expect(result.seed).toBe('my-seed');
      expect(result.style).toBe('notionists-neutral');
    });

    it('should default to notionists-neutral style', () => {
      const result = generateAvatar({ seed: 'default-style' });
      expect(result.style).toBe('notionists-neutral');
    });

    it('should generate different SVGs for different seeds', () => {
      const result1 = generateAvatar({ seed: 'seed-a' });
      const result2 = generateAvatar({ seed: 'seed-b' });
      expect(result1.svg).not.toBe(result2.svg);
    });

    it('should generate consistent SVGs for the same seed', () => {
      const result1 = generateAvatar({ seed: 'consistent-seed' });
      const result2 = generateAvatar({ seed: 'consistent-seed' });
      expect(result1.svg).toBe(result2.svg);
    });

    it('should support all defined styles', () => {
      for (const style of AVATAR_STYLES) {
        const result = generateAvatar({ seed: 'test', style });
        expect(result.svg).toContain('<svg');
        expect(result.style).toBe(style);
      }
    });
  });

  // ─── generateGuestAvatar ────────────────────────────────────────────

  describe('generateGuestAvatar', () => {
    it('should use email as seed', () => {
      const result = generateGuestAvatar('user@example.com');
      expect(result.seed).toBe('user@example.com');
    });

    it('should normalize email to lowercase', () => {
      const result = generateGuestAvatar('User@Example.COM');
      expect(result.seed).toBe('user@example.com');
    });

    it('should trim the email', () => {
      const result = generateGuestAvatar('  user@example.com  ');
      expect(result.seed).toBe('user@example.com');
    });

    it('should always use notionists-neutral style', () => {
      const result = generateGuestAvatar('test@test.com', 'Test Name');
      expect(result.style).toBe('notionists-neutral');
    });

    it('should consistently assign the same style for the same name', () => {
      const result1 = generateGuestAvatar('a@b.com', 'Same Name');
      const result2 = generateGuestAvatar('a@b.com', 'Same Name');
      expect(result1.style).toBe(result2.style);
      expect(result1.svg).toBe(result2.svg);
    });
  });

  // ─── isValidAvatarData ──────────────────────────────────────────────

  describe('isValidAvatarData', () => {
    it('should return true for valid SVG data', () => {
      expect(isValidAvatarData('<svg>content</svg>', 'seed-123')).toBe(true);
    });

    it('should return false when svg is undefined', () => {
      expect(isValidAvatarData(undefined, 'seed-123')).toBe(false);
    });

    it('should return false when seed is undefined', () => {
      expect(isValidAvatarData('<svg>content</svg>', undefined)).toBe(false);
    });

    it('should return false when svg is empty', () => {
      expect(isValidAvatarData('', 'seed-123')).toBe(false);
    });

    it('should return false when svg does not contain <svg tag', () => {
      expect(isValidAvatarData('not-an-svg', 'seed-123')).toBe(false);
    });
  });

  // ─── svgToDataUri ───────────────────────────────────────────────────

  describe('svgToDataUri', () => {
    it('should convert SVG to base64 data URI', () => {
      const result = svgToDataUri('<svg><circle r="10"/></svg>');
      expect(result).toMatch(/^data:image\/svg\+xml;base64,/);
    });

    it('should produce a valid base64 string', () => {
      const result = svgToDataUri('<svg>test</svg>');
      const base64Part = result.replace('data:image/svg+xml;base64,', '');
      expect(() => atob(base64Part)).not.toThrow();
    });
  });

  // ─── generateFallbackColor ──────────────────────────────────────────

  describe('generateFallbackColor', () => {
    it('should return a hex color string', () => {
      const color = generateFallbackColor('Test Name');
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    it('should be consistent for the same name', () => {
      const color1 = generateFallbackColor('Consistent Name');
      const color2 = generateFallbackColor('Consistent Name');
      expect(color1).toBe(color2);
    });

    it('should distribute different names across colors', () => {
      const colors = new Set<string>();
      const names = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry'];
      for (const name of names) {
        colors.add(generateFallbackColor(name));
      }
      // With 8 names, we should get at least 3 different colors
      expect(colors.size).toBeGreaterThanOrEqual(3);
    });
  });

  // ─── AVATAR_STYLES constant ─────────────────────────────────────────

  describe('AVATAR_STYLES', () => {
    it('should contain notionists-neutral', () => {
      expect(AVATAR_STYLES).toContain('notionists-neutral');
    });

    it('should have exactly 1 style', () => {
      expect(AVATAR_STYLES).toHaveLength(1);
    });
  });
});
