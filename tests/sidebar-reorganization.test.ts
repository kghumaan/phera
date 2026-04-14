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
  it('should have 5 groups', () => {
    expect(groups).toHaveLength(5);
  });

  it('should have correct group IDs', () => {
    const ids = groups.map((g) => g.id);
    expect(ids).toEqual(['overview', 'coordination', 'wedding-website', 'team', 'settings']);
  });

  it('should have correct group labels', () => {
    const labels = groups.map((g) => g.label);
    expect(labels).toEqual(['Overview', 'Coordination', 'Wedding Website', 'Collaborators', 'Settings']);
  });

  describe('Overview group', () => {
    const overview = groups.find((g) => g.id === 'overview');

    it('should be standalone', () => {
      expect(overview!.standalone).toBe(true);
    });

    it('should have Overview item', () => {
      expect(overview!.items[0].path).toBe('/overview');
    });
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

    it('should have Guest Responses', () => {
      const item = coordination!.items.find((i) => i.id === 'guests');
      expect(item).toBeDefined();
      expect(item!.label).toBe('Guest Responses');
    });

    it('should have Outreach (communication)', () => {
      const item = coordination!.items.find((i) => i.id === 'communication');
      expect(item).toBeDefined();
      expect(item!.label).toBe('Outreach');
    });

    it('should have Travel Coordination', () => {
      const item = coordination!.items.find((i) => i.id === 'travel-coordination');
      expect(item).toBeDefined();
      expect(item!.path).toBe('/travel-coordination');
    });

    it('should have 8 items', () => {
      expect(coordination!.items).toHaveLength(8);
    });
  });

  describe('Wedding Website group', () => {
    const website = groups.find((g) => g.id === 'wedding-website');

    it('should contain core website items', () => {
      const ids = website!.items.map((i) => i.id);
      expect(ids).toContain('details');
      expect(ids).toContain('design');
      expect(ids).toContain('schedule');
      expect(ids).toContain('travel');
      expect(ids).toContain('rsvp-form');
      expect(ids).toContain('faq');
      expect(ids).toContain('registry');
    });

    it('should have 7 items', () => {
      expect(website!.items).toHaveLength(7);
    });
  });

  describe('Settings group', () => {
    const settings = groups.find((g) => g.id === 'settings');

    it('should contain pins and settings-page', () => {
      const ids = settings!.items.map((i) => i.id);
      expect(ids).toContain('pins');
      expect(ids).toContain('settings-page');
    });

    it('should have 2 items', () => {
      expect(settings!.items).toHaveLength(2);
    });
  });

  describe('Collaborators group', () => {
    const team = groups.find((g) => g.id === 'team');

    it('should be standalone', () => {
      expect(team!.standalone).toBe(true);
    });

    it('should have team item', () => {
      expect(team!.items[0].path).toBe('/team');
    });
  });
});
