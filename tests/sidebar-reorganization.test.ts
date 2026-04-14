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
  it('should have 5 groups (Control Tower hidden)', () => {
    expect(groups).toHaveLength(5);
  });

  it('should have correct group IDs', () => {
    const ids = groups.map((g) => g.id);
    expect(ids).toEqual([
      'overview',
      'wedding-website',
      'guests-group',
      'planning',
      'collaborators',
    ]);
  });

  it('should have correct group labels', () => {
    const labels = groups.map((g) => g.label);
    expect(labels).toEqual([
      'Overview',
      'Wedding Website',
      'Guests',
      'Planning',
      'Collaborators',
    ]);
  });

  it('should NOT include Control Tower (hidden until feature-ready)', () => {
    expect(groups.find((g) => g.id === 'control-tower')).toBeUndefined();
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

    it('should have Room Assignments', () => {
      const item = guests!.items.find((i) => i.id === 'rooms');
      expect(item).toBeDefined();
      expect(item!.path).toBe('/rooms');
      expect(item!.label).toBe('Room Assignments');
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

    it('should have 4 items', () => {
      expect(guests!.items).toHaveLength(4);
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
      expect(ids).toContain('pins');
    });

    it('should have 8 items (incl. Event Access)', () => {
      expect(website!.items).toHaveLength(8);
    });

    it('Event Access should be the last item and labeled "Event Access"', () => {
      const last = website!.items[website!.items.length - 1];
      expect(last.id).toBe('pins');
      expect(last.label).toBe('Event Access');
      expect(last.path).toBe('/pins');
    });

    it('should NOT include Overview (standalone)', () => {
      expect(website!.items.find((i) => i.id === 'overview')).toBeUndefined();
    });
  });

  describe('Collaborators group', () => {
    const collab = groups.find((g) => g.id === 'collaborators');

    it('should be standalone', () => {
      expect(collab!.standalone).toBe(true);
    });

    it('should have a single team item', () => {
      expect(collab!.items).toHaveLength(1);
      expect(collab!.items[0].path).toBe('/team');
    });
  });

  it('should NOT have a Settings group', () => {
    expect(groups.find((g) => g.id === 'settings')).toBeUndefined();
  });
});
