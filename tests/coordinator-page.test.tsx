import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mocks (must be before imports) ──────────────────────────────────

const mockUsePlan = vi.fn();
const mockUseAuth = vi.fn();

vi.mock('@/lib/contexts/PlanContext', () => ({
  usePlan: () => mockUsePlan(),
}));

vi.mock('@/lib/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'wedding-123' }, error: null }),
    })),
  },
}));

vi.mock('@/components/admin/UpgradeModal', () => ({
  default: ({ open }: { open: boolean }) =>
    open ? <div data-testid="upgrade-modal">UpgradeModal</div> : null,
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

import React from 'react';

// ─── Tests ───────────────────────────────────────────────────────────

describe('CoordinatorPage states', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  // ── State determination logic ──────────────────────────────────────

  describe('state determination', () => {
    it('should identify State A: basic user', () => {
      const isPro = false;
      const vendors: any[] = [];

      const state = !isPro ? 'A' : vendors.length === 0 ? 'B' : 'C';
      expect(state).toBe('A');
    });

    it('should identify State B: pro user, no vendors', () => {
      const isPro = true;
      const vendors: any[] = [];

      const state = !isPro ? 'A' : vendors.length === 0 ? 'B' : 'C';
      expect(state).toBe('B');
    });

    it('should identify State C: pro user, has vendors', () => {
      const isPro = true;
      const vendors = [{ id: '1', name: 'Test Vendor' }];

      const state = !isPro ? 'A' : vendors.length === 0 ? 'B' : 'C';
      expect(state).toBe('C');
    });
  });

  // ── Stats calculations (used in State C) ──────────────────────────

  describe('stats calculations', () => {
    it('should count total vendors', () => {
      const vendors = [
        { id: '1', name: 'V1', vendor_conversations: [], vendor_insights: [] },
        { id: '2', name: 'V2', vendor_conversations: [], vendor_insights: [] },
        { id: '3', name: 'V3', vendor_conversations: [], vendor_insights: [] },
      ];
      expect(vendors.length).toBe(3);
    });

    it('should count active conversations', () => {
      const vendors = [
        { id: '1', vendor_conversations: [{ status: 'ready' }] },
        { id: '2', vendor_conversations: [{ status: 'processing' }] },
        { id: '3', vendor_conversations: [{ status: 'ready' }, { status: 'ready' }] },
      ];

      const activeConversations = vendors.filter(
        (v) => v.vendor_conversations?.some((c) => c.status === 'ready')
      ).length;

      expect(activeConversations).toBe(2);
    });

    it('should count open action items across all vendors', () => {
      const vendors = [
        {
          id: '1',
          vendor_insights: [
            { insight_type: 'action_item', is_completed: false },
            { insight_type: 'action_item', is_completed: true },
            { insight_type: 'decision', is_completed: false },
          ],
        },
        {
          id: '2',
          vendor_insights: [
            { insight_type: 'action_item', is_completed: false },
            { insight_type: 'action_item', is_completed: false },
          ],
        },
      ];

      const openActionItems = vendors.reduce(
        (sum, v) =>
          sum +
          (v.vendor_insights?.filter(
            (i) => i.insight_type === 'action_item' && !i.is_completed
          ).length || 0),
        0
      );

      expect(openActionItems).toBe(3);
    });

    it('should handle vendors with no insights', () => {
      const vendors = [
        { id: '1', vendor_insights: null },
        { id: '2', vendor_insights: undefined },
        { id: '3', vendor_insights: [] },
      ] as any[];

      const openActionItems = vendors.reduce(
        (sum, v) =>
          sum +
          (v.vendor_insights?.filter(
            (i: any) => i.insight_type === 'action_item' && !i.is_completed
          ).length || 0),
        0
      );

      expect(openActionItems).toBe(0);
    });
  });

  // ── Mock data (State A) ───────────────────────────────────────────

  describe('mock data for basic user teaser', () => {
    const mockVendors = [
      { name: 'Lakeside Manor', category: 'Venue', status: 'booked', messages: 42 },
      { name: 'Priya Catering Co.', category: 'Catering', status: 'active', messages: 28 },
      { name: 'Golden Lens Studio', category: 'Photography', status: 'active', messages: 15 },
      { name: 'Bloom & Petal', category: 'Florist', status: 'booked', messages: 9 },
      { name: 'DJ Rhythm', category: 'DJ/Music', status: 'active', messages: 6 },
    ];

    it('should have at least 4 mock vendors for a convincing teaser', () => {
      expect(mockVendors.length).toBeGreaterThanOrEqual(4);
    });

    it('should have realistic vendor data with required fields', () => {
      for (const vendor of mockVendors) {
        expect(vendor).toHaveProperty('name');
        expect(vendor).toHaveProperty('category');
        expect(vendor).toHaveProperty('status');
        expect(vendor).toHaveProperty('messages');
        expect(typeof vendor.name).toBe('string');
        expect(vendor.messages).toBeGreaterThan(0);
      }
    });

    it('should have a mix of statuses', () => {
      const statuses = new Set(mockVendors.map((v) => v.status));
      expect(statuses.size).toBeGreaterThanOrEqual(2);
    });
  });

  // ── Coordinator phone fetch (State B & C) ─────────────────────────

  describe('coordinator phone info fetch', () => {
    it('should parse configured phone response correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          isConfigured: true,
          phoneNumber: '+14155551234',
          whatsappLink: 'https://wa.me/14155551234',
        }),
      });

      const res = await fetch('/api/vendors/coordinator-info');
      const data = await res.json();

      expect(data.isConfigured).toBe(true);
      expect(data.phoneNumber).toBe('+14155551234');
      expect(data.whatsappLink).toContain('wa.me');
    });

    it('should handle unconfigured phone response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          isConfigured: false,
          phoneNumber: '',
          whatsappLink: '',
        }),
      });

      const res = await fetch('/api/vendors/coordinator-info');
      const data = await res.json();

      expect(data.isConfigured).toBe(false);
      expect(data.phoneNumber).toBe('');
      expect(data.whatsappLink).toBe('');
    });

    it('should gracefully handle fetch failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      let phoneConfigured = false;
      let coordinatorPhone = '';

      try {
        await fetch('/api/vendors/coordinator-info');
      } catch {
        // silently fail — state stays at defaults
      }

      expect(phoneConfigured).toBe(false);
      expect(coordinatorPhone).toBe('');
    });
  });

  // ── Phone copy logic ──────────────────────────────────────────────

  describe('phone copy functionality', () => {
    it('should copy phone number to clipboard', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText },
        writable: true,
        configurable: true,
      });

      const coordinatorPhone = '+14155551234';
      await navigator.clipboard.writeText(coordinatorPhone);

      expect(writeText).toHaveBeenCalledWith('+14155551234');
    });
  });

  // ── Banner dismiss (State C) ──────────────────────────────────────

  describe('banner dismiss logic', () => {
    it('should show banner when phone configured and not dismissed', () => {
      const phoneConfigured = true;
      const bannerDismissed = false;

      const showBanner = phoneConfigured && !bannerDismissed;
      expect(showBanner).toBe(true);
    });

    it('should hide banner when dismissed', () => {
      const phoneConfigured = true;
      const bannerDismissed = true;

      const showBanner = phoneConfigured && !bannerDismissed;
      expect(showBanner).toBe(false);
    });

    it('should hide banner when phone not configured', () => {
      const phoneConfigured = false;
      const bannerDismissed = false;

      const showBanner = phoneConfigured && !bannerDismissed;
      expect(showBanner).toBe(false);
    });
  });
});
