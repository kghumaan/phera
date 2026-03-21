import { describe, it, expect, vi } from 'vitest';

// Mock heavy dependencies to avoid React context issues
vi.mock('@/lib/contexts/PlanContext', () => ({
  usePlan: () => ({ isPro: true }),
}));
vi.mock('@/lib/contexts/NavigationGuardContext', () => ({
  useNavigationGuard: () => ({ checkGuard: () => true }),
}));
vi.mock('@/lib/supabase/client', () => ({
  supabase: { from: vi.fn() },
}));
vi.mock('@/lib/supabase/wedding-service', () => ({
  Wedding: {},
}));
vi.mock('./ProBadge', () => ({ default: () => null }));

import { groups } from '@/components/admin/OnboardingSidebar';

describe('Sidebar Reorganization', () => {
  it('should have exactly 3 groups', () => {
    expect(groups).toHaveLength(3);
  });

  it('should have correct group IDs', () => {
    const ids = groups.map((g) => g.id);
    expect(ids).toEqual(['operations', 'wedding-setup', 'more']);
  });

  it('should have correct group labels', () => {
    const labels = groups.map((g) => g.label);
    expect(labels).toEqual(['Operations', 'Wedding Setup', 'More']);
  });

  describe('Operations group', () => {
    const operations = groups.find((g) => g.id === 'operations');

    it('should exist', () => {
      expect(operations).toBeDefined();
    });

    it('should have Control Tower as first item', () => {
      expect(operations!.items[0].id).toBe('control-tower');
      expect(operations!.items[0].path).toBe('/control-tower');
    });

    it('should have Guest List', () => {
      expect(operations!.items.some((i) => i.id === 'guests')).toBe(true);
    });

    it('should have Communication Log', () => {
      expect(operations!.items.some((i) => i.id === 'communication')).toBe(true);
    });

    it('should have 3 items', () => {
      expect(operations!.items).toHaveLength(3);
    });
  });

  describe('Wedding Setup group', () => {
    const setup = groups.find((g) => g.id === 'wedding-setup');

    it('should contain core setup items', () => {
      const ids = setup!.items.map((i) => i.id);
      expect(ids).toContain('overview');
      expect(ids).toContain('details');
      expect(ids).toContain('design');
      expect(ids).toContain('rsvp-form');
      expect(ids).toContain('schedule');
      expect(ids).toContain('travel');
      expect(ids).toContain('pins');
    });

    it('should have 7 items', () => {
      expect(setup!.items).toHaveLength(7);
    });
  });

  describe('More group', () => {
    const more = groups.find((g) => g.id === 'more');

    it('should contain secondary items', () => {
      const ids = more!.items.map((i) => i.id);
      expect(ids).toContain('faq');
      expect(ids).toContain('registry');
      expect(ids).toContain('concierge');
      expect(ids).toContain('team');
      expect(ids).toContain('settings');
    });

    it('should have 5 items', () => {
      expect(more!.items).toHaveLength(5);
    });
  });

  it('should NOT contain Shopping Guide in any group', () => {
    const allItems = groups.flatMap((g) => g.items);
    expect(allItems.some((i) => i.id === 'shopping')).toBe(false);
  });

  it('should NOT contain Vendor Coordinator in any group', () => {
    const allItems = groups.flatMap((g) => g.items);
    expect(allItems.some((i) => i.id === 'coordinator')).toBe(false);
  });

  it('should NOT contain Task Manager in any group', () => {
    const allItems = groups.flatMap((g) => g.items);
    expect(allItems.some((i) => i.id === 'task-manager')).toBe(false);
  });
});
