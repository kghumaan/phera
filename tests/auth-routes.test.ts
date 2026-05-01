import { describe, it, expect, beforeEach } from 'vitest';

// Replicate the route-detection functions from AuthContext.tsx
// to test their logic in isolation.

function isPublicRoute(pathname: string): boolean {
  const publicPaths = ['/', '/auth/login', '/auth/callback', '/about', '/contact', '/blog', '/privacy', '/terms'];
  return publicPaths.some(p => pathname === p) || pathname.startsWith('/auth/') || pathname.startsWith('/blog/');
}

function isPreviewRoute(pathname: string): boolean {
  return pathname.startsWith('/preview/');
}

describe('Auth route detection', () => {
  // ─── isPublicRoute ──────────────────────────────────────────────────

  describe('isPublicRoute', () => {
    it('should treat "/" as public', () => {
      expect(isPublicRoute('/')).toBe(true);
    });

    it('should treat marketing pages as public', () => {
      expect(isPublicRoute('/about')).toBe(true);
      expect(isPublicRoute('/contact')).toBe(true);
      expect(isPublicRoute('/privacy')).toBe(true);
      expect(isPublicRoute('/terms')).toBe(true);
    });

    it('should treat /auth/* paths as public', () => {
      expect(isPublicRoute('/auth/signup')).toBe(true);
      expect(isPublicRoute('/auth/login')).toBe(true);
      expect(isPublicRoute('/auth/callback')).toBe(true);
      expect(isPublicRoute('/auth/reset-password')).toBe(true);
    });

    it('should treat /blog and /blog/* as public', () => {
      expect(isPublicRoute('/blog')).toBe(true);
      expect(isPublicRoute('/blog/my-post')).toBe(true);
      expect(isPublicRoute('/blog/2024/wedding-tips')).toBe(true);
    });

    it('should NOT treat admin pages as public', () => {
      expect(isPublicRoute('/admin/demo/overview')).toBe(false);
      expect(isPublicRoute('/admin/my-wedding/look-and-feel')).toBe(false);
    });

    it('should NOT treat guest wedding pages as public', () => {
      expect(isPublicRoute('/my-wedding')).toBe(false);
      expect(isPublicRoute('/demo')).toBe(false);
      expect(isPublicRoute('/my-wedding/details')).toBe(false);
    });

    it('should NOT treat preview pages as public', () => {
      expect(isPublicRoute('/preview/demo')).toBe(false);
      expect(isPublicRoute('/preview/my-wedding')).toBe(false);
    });

    it('should NOT treat onboarding as public', () => {
      expect(isPublicRoute('/onboarding')).toBe(false);
    });
  });

  // ─── isPreviewRoute ─────────────────────────────────────────────────

  describe('isPreviewRoute', () => {
    it('should detect /preview/* routes', () => {
      expect(isPreviewRoute('/preview/demo')).toBe(true);
      expect(isPreviewRoute('/preview/my-wedding')).toBe(true);
      expect(isPreviewRoute('/preview/demo/details')).toBe(true);
    });

    it('should NOT match non-preview routes', () => {
      expect(isPreviewRoute('/')).toBe(false);
      expect(isPreviewRoute('/admin/demo/overview')).toBe(false);
      expect(isPreviewRoute('/my-wedding')).toBe(false);
      expect(isPreviewRoute('/about')).toBe(false);
    });

    it('should NOT match partial prefix', () => {
      expect(isPreviewRoute('/preview')).toBe(false);
      expect(isPreviewRoute('/previewing/demo')).toBe(false);
    });
  });

  // ─── Route classification tiers ────────────────────────────────────

  describe('Auth initialization tiers', () => {
    // These tests verify the 3-tier auth logic:
    // 1. Preview routes → skip ALL auth (no onAuthStateChange)
    // 2. Public routes → skip initial check, keep onAuthStateChange
    // 3. Protected routes → full auth check + onAuthStateChange

    function getAuthTier(pathname: string): 'skip_all' | 'listener_only' | 'full' {
      if (isPreviewRoute(pathname)) return 'skip_all';
      if (isPublicRoute(pathname)) return 'listener_only';
      return 'full';
    }

    it('should skip all auth for preview routes', () => {
      expect(getAuthTier('/preview/demo')).toBe('skip_all');
      expect(getAuthTier('/preview/my-wedding')).toBe('skip_all');
    });

    it('should use listener-only for public marketing pages', () => {
      expect(getAuthTier('/')).toBe('listener_only');
      expect(getAuthTier('/about')).toBe('listener_only');
      expect(getAuthTier('/auth/login')).toBe('listener_only');
    });

    it('should use full auth for admin pages', () => {
      expect(getAuthTier('/admin/demo/overview')).toBe('full');
      expect(getAuthTier('/admin/my-wedding/look-and-feel')).toBe('full');
    });

    it('should use full auth for guest wedding pages', () => {
      expect(getAuthTier('/demo')).toBe('full');
      expect(getAuthTier('/my-wedding')).toBe('full');
      expect(getAuthTier('/my-wedding/details')).toBe('full');
    });

    it('should use full auth for onboarding', () => {
      expect(getAuthTier('/onboarding')).toBe('full');
    });
  });
});
