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
  it('should have 6 groups', () => {
    expect(groups).toHaveLength(6);
  });

  it('should have correct group IDs', () => {
    const ids = groups.map((g) => g.id);
    expect(ids).toEqual([
      'overview',
      'control-tower',
      'guests-group',
      'planning',
      'wedding-website',
      'settings',
    ]);
  });

  it('should have correct group labels', () => {
    const labels = groups.map((g) => g.label);
    expect(labels).toEqual([
      'Overview',
      'Control Tower',
      'Guests',
      'Planning',
      'Wedding Website',
      'Settings',
    ]);
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

  describe('Control Tower group', () => {
    const ct = groups.find((g) => g.id === 'control-tower');

    it('should be standalone', () => {
      expect(ct!.standalone).toBe(true);
    });

    it('should point to /control-tower', () => {
      expect(ct!.items[0].path).toBe('/control-tower');
    });
  });

  describe('Guests group', () => {
    const guests = groups.find((g) => g.id === 'guests-group');

    it('should exist with label "Guests"', () => {
      expect(guests).toBeDefined();
      expect(guests!.label).toBe('Guests');
    });

    it('should have Guest Responses', () => {
      const item = guests!.items.find((i) => i.id === 'guests');
      expect(item).toBeDefined();
      expect(item!.label).toBe('Guest Responses');
      expect(item!.path).toBe('/guests');
    });

    it('should have Transportation', () => {
      const item = guests!.items.find((i) => i.id === 'transportation');
      expect(item).toBeDefined();
      expect(item!.path).toBe('/transportation');
    });

    it('should have Guest Concierge', () => {
      const item = guests!.items.find((i) => i.id === 'concierge');
      expect(item).toBeDefined();
      expect(item!.label).toBe('Guest Concierge');
    });

    it('should have 3 items', () => {
      expect(guests!.items).toHaveLength(3);
    });

    it('should NOT include Outreach (removed)', () => {
      expect(guests!.items.find((i) => i.id === 'communication')).toBeUndefined();
    });

    it('should NOT include Travel Coordination (removed)', () => {
      expect(guests!.items.find((i) => i.id === 'travel-coordination')).toBeUndefined();
    });
  });

  describe('Planning group', () => {
    const planning = groups.find((g) => g.id === 'planning');

    it('should exist', () => {
      expect(planning).toBeDefined();
    });

    it('should contain Task Manager and Vendor Management', () => {
      const ids = planning!.items.map((i) => i.id);
      expect(ids).toContain('task-manager');
      expect(ids).toContain('coordinator');
    });

    it('should have 2 items', () => {
      expect(planning!.items).toHaveLength(2);
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

    it('should NOT include Overview (now standalone)', () => {
      expect(website!.items.find((i) => i.id === 'overview')).toBeUndefined();
    });
  });

  describe('Settings group', () => {
    const settings = groups.find((g) => g.id === 'settings');

    it('should contain PIN Management and Collaborators', () => {
      const ids = settings!.items.map((i) => i.id);
      expect(ids).toContain('pins');
      expect(ids).toContain('team');
    });

    it('should have 2 items', () => {
      expect(settings!.items).toHaveLength(2);
    });

    it('should NOT include placeholder Settings page (hidden)', () => {
      expect(settings!.items.find((i) => i.id === 'settings-page')).toBeUndefined();
    });
  });
});
