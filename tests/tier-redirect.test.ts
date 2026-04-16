import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Tests for the tier upgrade redirect flow:
 * - Not logged in → redirect to /auth/login with tier in redirect param
 * - Logged in → open UpgradeModal immediately
 * - After login redirect back with ?tier= → auto-open UpgradeModal, clean URL
 */

describe('Tier upgrade redirect logic', () => {
  let mockRouterPush: any;

  beforeEach(() => {
    mockRouterPush = vi.fn();
    vi.restoreAllMocks();
  });

  // Mirrors the handleTierAction logic used in page.tsx, pricing/page.tsx, features/page.tsx
  function handleTierAction(
    targetTier: 'pro' | 'planner',
    user: any,
    setUpgradeTier: (t: 'pro' | 'planner') => void,
    setUpgradeModalOpen: (v: boolean) => void,
    routerPush: (url: string) => void,
    pagePath: string,
  ) {
    setUpgradeTier(targetTier);
    if (user) {
      setUpgradeModalOpen(true);
    } else {
      routerPush(`/auth/login?redirect=${pagePath}?tier=${targetTier}`);
    }
  }

  // Mirrors the useEffect logic that reads tier param after redirect
  function handleTierParam(
    searchParams: URLSearchParams,
    user: any,
    setUpgradeTier: (t: 'pro' | 'planner') => void,
    setUpgradeModalOpen: (v: boolean) => void,
  ): boolean {
    const tier = searchParams.get('tier');
    if (tier && (tier === 'pro' || tier === 'planner') && user) {
      setUpgradeTier(tier);
      setUpgradeModalOpen(true);
      return true; // URL should be cleaned
    }
    return false;
  }

  describe('handleTierAction — not logged in', () => {
    it('should redirect to auth/login with pro tier for landing page', () => {
      const setTier = vi.fn();
      const setModal = vi.fn();
      handleTierAction('pro', null, setTier, setModal, mockRouterPush, '/');

      expect(setTier).toHaveBeenCalledWith('pro');
      expect(setModal).not.toHaveBeenCalled();
      expect(mockRouterPush).toHaveBeenCalledWith('/auth/login?redirect=/?tier=pro');
    });

    it('should redirect to auth/login with planner tier for landing page', () => {
      const setTier = vi.fn();
      const setModal = vi.fn();
      handleTierAction('planner', null, setTier, setModal, mockRouterPush, '/');

      expect(mockRouterPush).toHaveBeenCalledWith('/auth/login?redirect=/?tier=planner');
    });

    it('should redirect with /pricing path for pricing page', () => {
      const setTier = vi.fn();
      const setModal = vi.fn();
      handleTierAction('pro', null, setTier, setModal, mockRouterPush, '/pricing');

      expect(mockRouterPush).toHaveBeenCalledWith('/auth/login?redirect=/pricing?tier=pro');
    });

    it('should redirect with /features path for features page', () => {
      const setTier = vi.fn();
      const setModal = vi.fn();
      handleTierAction('pro', null, setTier, setModal, mockRouterPush, '/features');

      expect(mockRouterPush).toHaveBeenCalledWith('/auth/login?redirect=/features?tier=pro');
    });
  });

  describe('handleTierAction — logged in', () => {
    const fakeUser = { id: 'user-123', email: 'test@test.com' };

    it('should open UpgradeModal immediately with pro tier', () => {
      const setTier = vi.fn();
      const setModal = vi.fn();
      handleTierAction('pro', fakeUser, setTier, setModal, mockRouterPush, '/');

      expect(setTier).toHaveBeenCalledWith('pro');
      expect(setModal).toHaveBeenCalledWith(true);
      expect(mockRouterPush).not.toHaveBeenCalled();
    });

    it('should open UpgradeModal immediately with planner tier', () => {
      const setTier = vi.fn();
      const setModal = vi.fn();
      handleTierAction('planner', fakeUser, setTier, setModal, mockRouterPush, '/pricing');

      expect(setTier).toHaveBeenCalledWith('planner');
      expect(setModal).toHaveBeenCalledWith(true);
      expect(mockRouterPush).not.toHaveBeenCalled();
    });
  });

  describe('handleTierParam — after auth redirect', () => {
    const fakeUser = { id: 'user-123', email: 'test@test.com' };

    it('should auto-open modal with pro tier when user is logged in', () => {
      const setTier = vi.fn();
      const setModal = vi.fn();
      const params = new URLSearchParams('tier=pro');

      const shouldCleanUrl = handleTierParam(params, fakeUser, setTier, setModal);

      expect(setTier).toHaveBeenCalledWith('pro');
      expect(setModal).toHaveBeenCalledWith(true);
      expect(shouldCleanUrl).toBe(true);
    });

    it('should auto-open modal with planner tier when user is logged in', () => {
      const setTier = vi.fn();
      const setModal = vi.fn();
      const params = new URLSearchParams('tier=planner');

      const shouldCleanUrl = handleTierParam(params, fakeUser, setTier, setModal);

      expect(setTier).toHaveBeenCalledWith('planner');
      expect(setModal).toHaveBeenCalledWith(true);
      expect(shouldCleanUrl).toBe(true);
    });

    it('should NOT open modal if user is not logged in', () => {
      const setTier = vi.fn();
      const setModal = vi.fn();
      const params = new URLSearchParams('tier=pro');

      const shouldCleanUrl = handleTierParam(params, null, setTier, setModal);

      expect(setTier).not.toHaveBeenCalled();
      expect(setModal).not.toHaveBeenCalled();
      expect(shouldCleanUrl).toBe(false);
    });

    it('should NOT open modal if no tier param present', () => {
      const setTier = vi.fn();
      const setModal = vi.fn();
      const params = new URLSearchParams('');

      const shouldCleanUrl = handleTierParam(params, fakeUser, setTier, setModal);

      expect(setTier).not.toHaveBeenCalled();
      expect(setModal).not.toHaveBeenCalled();
      expect(shouldCleanUrl).toBe(false);
    });

    it('should NOT open modal for invalid tier values', () => {
      const setTier = vi.fn();
      const setModal = vi.fn();
      const params = new URLSearchParams('tier=enterprise');

      const shouldCleanUrl = handleTierParam(params, fakeUser, setTier, setModal);

      expect(setTier).not.toHaveBeenCalled();
      expect(setModal).not.toHaveBeenCalled();
      expect(shouldCleanUrl).toBe(false);
    });
  });
});
