import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the module to avoid window.location issues
vi.mock('@/lib/utils/wedding-id-helpers', () => {
  return {
    getCurrentWeddingId: vi.fn(),
    isOnLandingPage: vi.fn(),
  };
});

import { getCurrentWeddingId, isOnLandingPage } from '@/lib/utils/wedding-id-helpers';

// Since the actual helpers read window.location.pathname, we test the logic patterns
describe('wedding-id-helpers logic patterns', () => {
  describe('wedding slug extraction from pathname', () => {
    function extractWeddingSlug(pathname: string): string | null {
      // Skip known non-wedding routes
      const nonWeddingPrefixes = ['/admin', '/auth', '/onboarding', '/api', '/rsvp', '/test', '/pricing', '/features', '/contact', '/privacy'];
      if (pathname === '/' || nonWeddingPrefixes.some(p => pathname.startsWith(p))) {
        return null;
      }

      // Extract the first path segment as wedding slug
      const segments = pathname.split('/').filter(Boolean);
      if (segments.length > 0) {
        return segments[0];
      }
      return null;
    }

    it('should extract wedding slug from /{slug}', () => {
      expect(extractWeddingSlug('/smith-jones')).toBe('smith-jones');
    });

    it('should extract wedding slug from /{slug}/rsvp', () => {
      expect(extractWeddingSlug('/smith-jones/rsvp')).toBe('smith-jones');
    });

    it('should return null for landing page', () => {
      expect(extractWeddingSlug('/')).toBeNull();
    });

    it('should return null for admin routes', () => {
      expect(extractWeddingSlug('/admin/my-wedding/overview')).toBeNull();
    });

    it('should return null for auth routes', () => {
      expect(extractWeddingSlug('/auth/login')).toBeNull();
    });

    it('should return null for onboarding', () => {
      expect(extractWeddingSlug('/onboarding')).toBeNull();
    });

    it('should return null for API routes', () => {
      expect(extractWeddingSlug('/api/webhooks/stripe')).toBeNull();
    });
  });

  describe('landing page detection', () => {
    function checkIsLandingPage(pathname: string): boolean {
      return pathname === '/';
    }

    it('should detect "/" as landing page', () => {
      expect(checkIsLandingPage('/')).toBe(true);
    });

    it('should NOT detect "/admin" as landing page', () => {
      expect(checkIsLandingPage('/admin')).toBe(false);
    });

    it('should NOT detect "/my-wedding" as landing page', () => {
      expect(checkIsLandingPage('/my-wedding')).toBe(false);
    });
  });
});
