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
  it('should have 11 groups (Control Tower hidden)', () => {
    expect(groups).toHaveLength(11);
  });

  it('should have correct group IDs in order', () => {
    const ids = groups.map((g) => g.id);
    expect(ids).toEqual([
      'overview',
      'planner',
      'wedding-website',
      'guests-group',
      'logistics',
      'communications',
      'vendors',
      'planning',
      'account',
      'collaborators',
      'support',
    ]);
  });

  it('should have correct group labels in order', () => {
    const labels = groups.map((g) => g.label);
    expect(labels).toEqual([
      'Overview',
      'Planner',
      'Wedding Website',
      'Guests',
      'Logistics',
      'Communications',
      'Vendors',
      'Planning',
      'Account',
      'Collaborators',
      'Contact us',
    ]);
  });

  describe('Planner group', () => {
    const planner = groups.find((g) => g.id === 'planner');

    it('should be standalone with the assistant page', () => {
      expect(planner!.standalone).toBe(true);
      expect(planner!.items).toHaveLength(1);
      expect(planner!.items[0].id).toBe('assistant');
      expect(planner!.items[0].path).toBe('/assistant');
    });
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

    it('should have Guest List as the first item', () => {
      expect(guests!.items[0].id).toBe('guest-list');
      expect(guests!.items[0].label).toBe('Guest List');
      expect(guests!.items[0].path).toBe('/guest-list');
    });

    it('should have Guest Responses', () => {
      const item = guests!.items.find((i) => i.id === 'guests');
      expect(item).toBeDefined();
      expect(item!.label).toBe('Guest Responses');
      expect(item!.path).toBe('/guest-responses');
    });

    it('should include Room Assignments (Pro-gated, moved from Logistics)', () => {
      const item = guests!.items.find((i) => i.id === 'rooms');
      expect(item).toBeDefined();
      expect(item!.label).toBe('Room Assignments');
      expect(item!.path).toBe('/room-assignments');
      expect(item!.isPro).toBe(true);
    });

    it('should have exactly 3 items (Guest List + Guest Responses + Room Assignments)', () => {
      expect(guests!.items).toHaveLength(3);
    });

    it('should NOT include WhatsApp Bot (moved to Communications)', () => {
      expect(guests!.items.find((i) => i.id === 'whatsapp-bot')).toBeUndefined();
    });

    it('should NOT include Transportation (lives under Logistics)', () => {
      expect(guests!.items.find((i) => i.id === 'transportation')).toBeUndefined();
    });
  });

  describe('Logistics group', () => {
    const logistics = groups.find((g) => g.id === 'logistics');

    it('should exist with label "Logistics"', () => {
      expect(logistics).toBeDefined();
      expect(logistics!.label).toBe('Logistics');
    });

    it('should be a single Logistics link to the transportation page (Pro-gated)', () => {
      const item = logistics!.items.find((i) => i.id === 'transportation');
      expect(item).toBeDefined();
      expect(item!.label).toBe('Logistics');
      expect(item!.path).toBe('/transportation');
      expect(item!.isPro).toBe(true);
    });

    it('should NOT include Room Assignments (moved to Guests)', () => {
      expect(logistics!.items.find((i) => i.id === 'rooms')).toBeUndefined();
    });

    it('should have exactly 1 item', () => {
      expect(logistics!.items).toHaveLength(1);
    });
  });

  describe('Communications group', () => {
    const comms = groups.find((g) => g.id === 'communications');

    it('should be standalone', () => {
      expect(comms).toBeDefined();
      expect(comms!.standalone).toBe(true);
    });

    it('should have a single WhatsApp Bot hub item labeled "Communications"', () => {
      expect(comms!.items).toHaveLength(1);
      const item = comms!.items[0];
      expect(item.id).toBe('whatsapp-bot');
      expect(item.label).toBe('Communications');
      expect(item.path).toBe('/whatsapp-bot');
    });
  });

  describe('Vendors group', () => {
    const vendors = groups.find((g) => g.id === 'vendors');

    it('should exist with label "Vendors"', () => {
      expect(vendors).toBeDefined();
      expect(vendors!.label).toBe('Vendors');
    });

    it('should have Vendor Management (Pro-gated, short label "Management")', () => {
      const item = vendors!.items.find((i) => i.id === 'coordinator');
      expect(item).toBeDefined();
      expect(item!.label).toBe('Management');
      expect(item!.path).toBe('/vendor-management');
      expect(item!.isPro).toBe(true);
    });

    it('should have Vendor Marketplace (Pro-gated, short label "Marketplace")', () => {
      const item = vendors!.items.find((i) => i.id === 'vendor-marketplace');
      expect(item).toBeDefined();
      expect(item!.label).toBe('Marketplace');
      expect(item!.path).toBe('/vendor-marketplace');
      expect(item!.isPro).toBe(true);
    });

    it('should have exactly 2 items', () => {
      expect(vendors!.items).toHaveLength(2);
    });
  });

  describe('Planning group', () => {
    const planning = groups.find((g) => g.id === 'planning');

    it('should exist', () => {
      expect(planning).toBeDefined();
    });

    it('should contain Task Manager and Knowledge Bank', () => {
      const ids = planning!.items.map((i) => i.id);
      expect(ids).toContain('task-manager');
      expect(ids).toContain('knowledge-bank');
    });

    it('should have exactly 2 items', () => {
      expect(planning!.items).toHaveLength(2);
    });

    it('should NOT include Vendor Management (moved to Vendors)', () => {
      expect(planning!.items.find((i) => i.id === 'coordinator')).toBeUndefined();
    });

    it('should NOT include Vendor Marketplace (moved to Vendors)', () => {
      expect(planning!.items.find((i) => i.id === 'vendor-marketplace')).toBeUndefined();
    });

    it('Task Manager should be Pro-gated', () => {
      const tm = planning!.items.find((i) => i.id === 'task-manager');
      expect(tm).toBeDefined();
      expect(tm!.isPro).toBe(true);
      expect(tm!.path).toBe('/task-manager');
    });

    it('Knowledge Bank should be Pro-gated', () => {
      const kb = planning!.items.find((i) => i.id === 'knowledge-bank');
      expect(kb).toBeDefined();
      expect(kb!.isPro).toBe(true);
      expect(kb!.path).toBe('/knowledge-bank');
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
      expect(ids).toContain('shopping');
      expect(ids).toContain('pins');
      expect(ids).toContain('settings');
    });

    it('should have 10 items (incl. Where to Shop, Event Access, Settings & Publish)', () => {
      expect(website!.items).toHaveLength(10);
    });

    it('Event Access should be the "pins" item labeled "Event Access"', () => {
      const pins = website!.items.find((i) => i.id === 'pins');
      expect(pins).toBeDefined();
      expect(pins!.label).toBe('Event Access');
      expect(pins!.path).toBe('/event-access');
    });

    it('Settings & Publish should be the last item', () => {
      const last = website!.items[website!.items.length - 1];
      expect(last.id).toBe('settings');
      expect(last.label).toBe('Settings & Publish');
      expect(last.path).toBe('/settings');
    });

    it('should NOT include Overview (standalone)', () => {
      expect(website!.items.find((i) => i.id === 'overview')).toBeUndefined();
    });
  });

  describe('Account group', () => {
    const account = groups.find((g) => g.id === 'account');

    it('should be standalone', () => {
      expect(account).toBeDefined();
      expect(account!.standalone).toBe(true);
    });

    it('should have a single account item', () => {
      expect(account!.items).toHaveLength(1);
      expect(account!.items[0].path).toBe('/account');
    });
  });

  describe('Collaborators group', () => {
    const collab = groups.find((g) => g.id === 'collaborators');

    it('should be standalone', () => {
      expect(collab!.standalone).toBe(true);
    });

    it('should have a single team item', () => {
      expect(collab!.items).toHaveLength(1);
      expect(collab!.items[0].path).toBe('/collaborators');
    });
  });

  it('should NOT have a Settings group (Settings is an item under Wedding Website)', () => {
    expect(groups.find((g) => g.id === 'settings')).toBeUndefined();
  });
});
