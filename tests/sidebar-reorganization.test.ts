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
    expect(ids).toEqual(['coordination', 'wedding-website', 'settings']);
  });

  it('should have correct group labels', () => {
    const labels = groups.map((g) => g.label);
    expect(labels).toEqual(['Coordination', 'Wedding Website', 'Settings']);
  });

  describe('Coordination group', () => {
    const coordination = groups.find((g) => g.id === 'coordination');

    it('should exist', () => {
      expect(coordination).toBeDefined();
    });

    it('should have Control Tower as first item', () => {
      expect(coordination!.items[0].id).toBe('control-tower');
      expect(coordination!.items[0].path).toBe('/control-tower');
    });

    it('should have Guest List', () => {
      expect(coordination!.items.some((i) => i.id === 'guests')).toBe(true);
    });

    it('should have Concierge', () => {
      expect(coordination!.items.some((i) => i.id === 'concierge')).toBe(true);
    });

    it('should have Outreach (communication)', () => {
      const item = coordination!.items.find((i) => i.id === 'communication');
      expect(item).toBeDefined();
      expect(item!.label).toBe('Outreach');
    });

    it('should have Logistics pointing to /travel-coordination', () => {
      const item = coordination!.items.find((i) => i.id === 'logistics');
      expect(item).toBeDefined();
      expect(item!.label).toBe('Logistics');
      expect(item!.path).toBe('/travel-coordination');
    });

    it('should have 5 items', () => {
      expect(coordination!.items).toHaveLength(5);
    });
  });

  describe('Wedding Website group', () => {
    const website = groups.find((g) => g.id === 'wedding-website');

    it('should contain core website items', () => {
      const ids = website!.items.map((i) => i.id);
      expect(ids).toContain('overview');
      expect(ids).toContain('details');
      expect(ids).toContain('design');
      expect(ids).toContain('schedule');
      expect(ids).toContain('travel');
      expect(ids).toContain('rsvp-form');
      expect(ids).toContain('faq');
      expect(ids).toContain('registry');
    });

    it('should have 8 items', () => {
      expect(website!.items).toHaveLength(8);
    });
  });

  describe('Settings group', () => {
    const settings = groups.find((g) => g.id === 'settings');

    it('should contain settings items', () => {
      const ids = settings!.items.map((i) => i.id);
      expect(ids).toContain('pins');
      expect(ids).toContain('team');
      expect(ids).toContain('settings-page');
    });

    it('should have 3 items', () => {
      expect(settings!.items).toHaveLength(3);
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
