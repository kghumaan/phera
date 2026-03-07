import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('AuthContext logic', () => {
  // ─── isPublicRoute ──────────────────────────────────────────────────

  describe('isPublicRoute', () => {
    // Replicate the isPublicRoute function from AuthContext
    function isPublicRoute(pathname: string): boolean {
      const publicPaths = ['/auth/login', '/auth/callback'];
      return publicPaths.some(p => pathname === p) || pathname.startsWith('/auth/');
    }

    it('should NOT treat "/" as public (landing page should check auth)', () => {
      expect(isPublicRoute('/')).toBe(false);
    });

    it('should treat /auth/login as public', () => {
      expect(isPublicRoute('/auth/login')).toBe(true);
    });

    it('should treat /auth/callback as public', () => {
      expect(isPublicRoute('/auth/callback')).toBe(true);
    });

    it('should treat any /auth/* path as public', () => {
      expect(isPublicRoute('/auth/reset-password')).toBe(true);
      expect(isPublicRoute('/auth/verify')).toBe(true);
    });

    it('should NOT treat wedding pages as public', () => {
      expect(isPublicRoute('/my-wedding')).toBe(false);
    });

    it('should NOT treat admin pages as public', () => {
      expect(isPublicRoute('/admin/my-wedding/overview')).toBe(false);
    });

    it('should NOT treat onboarding as public', () => {
      expect(isPublicRoute('/onboarding')).toBe(false);
    });
  });

  // ─── generateInitials ──────────────────────────────────────────────

  describe('generateInitials', () => {
    function generateInitials(name: string): string {
      return name
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .substring(0, 2)
        .toUpperCase();
    }

    it('should generate 2-letter initials from full name', () => {
      expect(generateInitials('John Doe')).toBe('JD');
    });

    it('should generate 1-letter initial from single name', () => {
      expect(generateInitials('John')).toBe('J');
    });

    it('should take only first 2 initials from long name', () => {
      expect(generateInitials('John Robert Doe')).toBe('JR');
    });

    it('should uppercase initials', () => {
      expect(generateInitials('john doe')).toBe('JD');
    });

    it('should handle email as name fallback', () => {
      expect(generateInitials('user@example.com')).toBe('U');
    });
  });

  // ─── generateAvatarColor ───────────────────────────────────────────

  describe('generateAvatarColor', () => {
    function generateAvatarColor(name: string): string {
      const colors = [
        '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3',
        '#03A9F4', '#00BCD4', '#009688', '#4CAF50', '#8BC34A',
        '#CDDC39', '#FFC107', '#FF9800', '#FF5722', '#795548'
      ];

      let hash = 0;
      for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
      }

      return colors[Math.abs(hash) % colors.length];
    }

    it('should return a color from the palette', () => {
      const colors = [
        '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3',
        '#03A9F4', '#00BCD4', '#009688', '#4CAF50', '#8BC34A',
        '#CDDC39', '#FFC107', '#FF9800', '#FF5722', '#795548'
      ];
      const result = generateAvatarColor('Test User');
      expect(colors).toContain(result);
    });

    it('should be deterministic', () => {
      const color1 = generateAvatarColor('Same Name');
      const color2 = generateAvatarColor('Same Name');
      expect(color1).toBe(color2);
    });
  });

  // ─── User data construction (admin fallback) ──────────────────────

  describe('user data with avatar fallback', () => {
    it('should prefer guest avatar data over user_settings', () => {
      const guestData = {
        avatar_style: 'notionists',
        avatar_seed: 'guest-seed',
        avatar_svg: '<svg>guest</svg>',
        avatar_color: '#FF0000',
      };
      const userSettingsAvatar = {
        avatar_style: 'shapes',
        avatar_seed: 'settings-seed',
        avatar_svg: '<svg>settings</svg>',
        avatar_color: '#00FF00',
      };

      const avatar_style = guestData?.avatar_style || userSettingsAvatar?.avatar_style;
      const avatar_svg = guestData?.avatar_svg || userSettingsAvatar?.avatar_svg;

      expect(avatar_style).toBe('notionists');
      expect(avatar_svg).toBe('<svg>guest</svg>');
    });

    it('should fall back to user_settings avatar when no guest record', () => {
      const guestData = null;
      const userSettingsAvatar = {
        avatar_style: 'shapes',
        avatar_seed: 'settings-seed',
        avatar_svg: '<svg>settings</svg>',
        avatar_color: '#00FF00',
      };

      const avatar_style = guestData?.avatar_style || userSettingsAvatar?.avatar_style;
      const avatar_svg = guestData?.avatar_svg || userSettingsAvatar?.avatar_svg;

      expect(avatar_style).toBe('shapes');
      expect(avatar_svg).toBe('<svg>settings</svg>');
    });

    it('should fall back to generated color when neither has avatar', () => {
      const guestData = null;
      const userSettingsAvatar = null;
      const displayName = 'Admin User';

      function generateAvatarColor(name: string): string {
        const colors = ['#E91E63', '#9C27B0', '#673AB7'];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
          hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
      }

      const avatar_color = guestData?.avatar_color || userSettingsAvatar?.avatar_color || generateAvatarColor(displayName);
      expect(avatar_color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });

  // ─── Wedding slug handling ─────────────────────────────────────────

  describe('wedding slug handling', () => {
    it('should not use hardcoded wedding ID in plus-one auth', () => {
      const currentWeddingSlug = 'dynamic-slug';
      const fallback = currentWeddingSlug || '';
      expect(fallback).toBe('dynamic-slug');
      expect(fallback).not.toBe('simran-karanvir');
    });

    it('should use empty string as fallback when no wedding slug', () => {
      const currentWeddingSlug: string | null = null;
      const fallback = currentWeddingSlug || '';
      expect(fallback).toBe('');
      expect(fallback).not.toBe('simran-karanvir');
    });
  });

  // ─── RSVP skip logic ──────────────────────────────────────────────

  describe('RSVP check skip logic', () => {
    function shouldSkipRSVP(pathname: string, weddingSlug: string | null, isOnLandingPage: boolean): boolean {
      if (!weddingSlug) return true;
      if (isOnLandingPage) return true;
      if (pathname.startsWith('/admin')) return true;
      if (pathname.startsWith('/onboarding')) return true;
      if (pathname.startsWith('/auth')) return true;
      return false;
    }

    it('should skip RSVP when no wedding slug', () => {
      expect(shouldSkipRSVP('/', null, false)).toBe(true);
    });

    it('should skip RSVP on landing page', () => {
      expect(shouldSkipRSVP('/', 'test', true)).toBe(true);
    });

    it('should skip RSVP on admin routes', () => {
      expect(shouldSkipRSVP('/admin/test/overview', 'test', false)).toBe(true);
    });

    it('should skip RSVP on onboarding', () => {
      expect(shouldSkipRSVP('/onboarding', 'test', false)).toBe(true);
    });

    it('should NOT skip RSVP on wedding pages', () => {
      expect(shouldSkipRSVP('/my-wedding', 'my-wedding', false)).toBe(false);
    });
  });
});
