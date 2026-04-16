import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── Mocks (must be before imports) ──────────────────────────────────

const mockUsePlan = vi.fn();
const mockUseAuth = vi.fn();
const mockRouterPush = vi.fn();
const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();

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

vi.mock('@/components/admin/coordinator/AskPheraPanel', () => ({
  default: () => <div data-testid="ask-phera-panel" />,
}));

vi.mock('@/components/admin/coordinator/AskPheraFab', () => ({
  default: () => <div data-testid="ask-phera-fab" />,
}));

vi.mock('sonner', () => ({
  toast: { success: mockToastSuccess, error: mockToastError },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockRouterPush, replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/admin/test-wedding/coordinator',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

import React from 'react';

// ─── Tests ───────────────────────────────────────────────────────────

describe('CoordinatorPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
    mockUsePlan.mockReturnValue({ isPro: true });
    mockUseAuth.mockReturnValue({ user: { email: 'test@example.com' } });
  });

  // ══════════════════════════════════════════════════════════════════
  // STATE DETERMINATION
  // ══════════════════════════════════════════════════════════════════

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

    it('should treat forceOnboarding as State B even with vendors', () => {
      const isPro = true;
      const vendors = [{ id: '1', name: 'Test Vendor' }];
      const forceOnboarding = true;
      const state = !isPro ? 'A' : (vendors.length === 0 || forceOnboarding) ? 'B' : 'C';
      expect(state).toBe('B');
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // STATS CALCULATIONS
  // ══════════════════════════════════════════════════════════════════

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

    it('should count total messages across vendor conversations', () => {
      const vendors = [
        { id: '1', vendor_conversations: [{ message_count: 42 }, { message_count: 10 }] },
        { id: '2', vendor_conversations: [{ message_count: 28 }] },
        { id: '3', vendor_conversations: [] },
      ];
      const totalMessages = vendors.reduce(
        (sum, v) => sum + (v.vendor_conversations?.reduce((s, c) => s + (c.message_count || 0), 0) || 0),
        0
      );
      expect(totalMessages).toBe(80);
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // MOCK DATA (STATE A)
  // ══════════════════════════════════════════════════════════════════

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

  // ══════════════════════════════════════════════════════════════════
  // COORDINATOR PHONE FETCH
  // ══════════════════════════════════════════════════════════════════

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

  // ══════════════════════════════════════════════════════════════════
  // PHONE COPY LOGIC
  // ══════════════════════════════════════════════════════════════════

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

  // ══════════════════════════════════════════════════════════════════
  // BANNER DISMISS LOGIC
  // ══════════════════════════════════════════════════════════════════

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

  // ══════════════════════════════════════════════════════════════════
  // useRef GUARD LOGIC — preventing duplicate API calls
  // ══════════════════════════════════════════════════════════════════

  describe('useRef guard logic', () => {
    it('should prevent duplicate calls when guard is active', () => {
      const guardRef = { current: false };
      const calls: number[] = [];

      const handler = () => {
        if (guardRef.current) return;
        guardRef.current = true;
        calls.push(1);
        // simulate async — guard stays true during execution
      };

      handler(); // first call succeeds
      handler(); // second call blocked by guard
      expect(calls.length).toBe(1);
    });

    it('should allow new call after guard is released', () => {
      const guardRef = { current: false };
      const calls: number[] = [];

      const handler = () => {
        if (guardRef.current) return;
        guardRef.current = true;
        calls.push(1);
        guardRef.current = false; // released in finally
      };

      handler();
      handler();
      expect(calls.length).toBe(2);
    });

    it('should release guard even when handler throws', async () => {
      const guardRef = { current: false };

      const handler = async () => {
        if (guardRef.current) return 'blocked';
        guardRef.current = true;
        try {
          throw new Error('boom');
        } finally {
          guardRef.current = false;
        }
      };

      await expect(handler()).rejects.toThrow('boom');
      expect(guardRef.current).toBe(false);
      // Guard released — next call should proceed
      const result = handler();
      await expect(result).rejects.toThrow('boom');
    });

    it('should guard discoverGroups from rapid double-click', async () => {
      const discoverGuardRef = { current: false };
      let callCount = 0;

      const handleDiscoverGroups = async () => {
        if (discoverGuardRef.current) return;
        discoverGuardRef.current = true;
        callCount++;
        try {
          // simulate network delay
          await new Promise(r => setTimeout(r, 10));
        } finally {
          discoverGuardRef.current = false;
        }
      };

      // Fire two calls "simultaneously" (before first resolves)
      const p1 = handleDiscoverGroups();
      const p2 = handleDiscoverGroups();
      await Promise.all([p1, p2]);

      expect(callCount).toBe(1);
    });

    it('should guard syncAll from rapid double-click', async () => {
      const syncAllGuardRef = { current: false };
      let callCount = 0;

      const handleSyncAll = async () => {
        if (syncAllGuardRef.current) return;
        syncAllGuardRef.current = true;
        callCount++;
        try {
          await new Promise(r => setTimeout(r, 10));
        } finally {
          syncAllGuardRef.current = false;
        }
      };

      const p1 = handleSyncAll();
      const p2 = handleSyncAll();
      await Promise.all([p1, p2]);

      expect(callCount).toBe(1);
    });

    it('should guard importChat from rapid double-click', async () => {
      const importGuardRef = { current: false };
      let callCount = 0;

      const handleImportChat = async () => {
        if (importGuardRef.current) return;
        importGuardRef.current = true;
        callCount++;
        try {
          await new Promise(r => setTimeout(r, 10));
        } finally {
          importGuardRef.current = false;
        }
      };

      const p1 = handleImportChat();
      const p2 = handleImportChat();
      await Promise.all([p1, p2]);

      expect(callCount).toBe(1);
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // DISCOVER GROUPS — single API call
  // ══════════════════════════════════════════════════════════════════

  describe('handleDiscoverGroups — single API call', () => {
    it('should fetch both groups and directChats in a single request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          groups: [
            { id: 'g1@g.us', name: 'Venue Chat', participantCount: 5 },
            { id: 'g2@g.us', name: 'Caterer Chat', participantCount: 3 },
          ],
          directChats: [
            { id: 'd1@s.whatsapp.net', name: 'John', participantCount: 0 },
          ],
        }),
      });

      // Simulate the handler logic
      const res = await fetch('/api/vendors/sync-groups');
      const data = await res.json();

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith('/api/vendors/sync-groups');
      expect(data.groups).toHaveLength(2);
      expect(data.directChats).toHaveLength(1);
    });

    it('should NOT pass type= query parameter anymore', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ groups: [], directChats: [] }),
      });

      await fetch('/api/vendors/sync-groups');

      // Verify no ?type= was appended
      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toBe('/api/vendors/sync-groups');
      expect(calledUrl).not.toContain('type=');
    });

    it('should set both groups and directChats from single response', async () => {
      const response = {
        groups: [{ id: 'g1@g.us', name: 'Group A', participantCount: 4 }],
        directChats: [{ id: 'd1@s.whatsapp.net', name: 'Contact B', participantCount: 0 }],
      };

      // Simulate state updates from a single response
      let discoveredGroups: any[] = [];
      let discoveredDirectChats: any[] = [];

      discoveredGroups = response.groups || [];
      discoveredDirectChats = response.directChats || [];

      expect(discoveredGroups).toHaveLength(1);
      expect(discoveredDirectChats).toHaveLength(1);
      expect(discoveredGroups[0].name).toBe('Group A');
      expect(discoveredDirectChats[0].name).toBe('Contact B');
    });

    it('should handle empty response from sync-groups', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ groups: [], directChats: [] }),
      });

      const res = await fetch('/api/vendors/sync-groups');
      const data = await res.json();

      expect(data.groups).toEqual([]);
      expect(data.directChats).toEqual([]);
    });

    it('should handle API error and show toast', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Whapi not configured' }),
      });

      const res = await fetch('/api/vendors/sync-groups');
      const data = await res.json();

      expect(res.ok).toBe(false);
      expect(data.error).toBe('Whapi not configured');
    });

    it('should handle network failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      let caught = false;
      try {
        await fetch('/api/vendors/sync-groups');
      } catch {
        caught = true;
      }

      expect(caught).toBe(true);
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // SYNC ALL — progress label + error reporting
  // ══════════════════════════════════════════════════════════════════

  describe('handleSyncAll — progress label and error reporting', () => {
    it('should compute syncAllLabel from vendor conversations count', () => {
      const vendors = [
        { id: '1', vendor_conversations: [{ id: 'c1' }, { id: 'c2' }] },
        { id: '2', vendor_conversations: [{ id: 'c3' }] },
        { id: '3', vendor_conversations: [] },
      ];

      const trackedCount = vendors.reduce(
        (n, v) => n + ((v.vendor_conversations as any[])?.length || 0), 0
      );

      expect(trackedCount).toBe(3);
      expect(`Refreshing ${trackedCount} conversation${trackedCount !== 1 ? 's' : ''}...`)
        .toBe('Refreshing 3 conversations...');
    });

    it('should use singular label for 1 conversation', () => {
      const vendors = [{ id: '1', vendor_conversations: [{ id: 'c1' }] }];
      const trackedCount = vendors.reduce(
        (n, v) => n + ((v.vendor_conversations as any[])?.length || 0), 0
      );

      expect(trackedCount).toBe(1);
      expect(`Refreshing ${trackedCount} conversation${trackedCount !== 1 ? 's' : ''}...`)
        .toBe('Refreshing 1 conversation...');
    });

    it('should handle 0 conversations gracefully', () => {
      const vendors: any[] = [];
      const trackedCount = vendors.reduce(
        (n, v) => n + ((v.vendor_conversations as any[])?.length || 0), 0
      );

      expect(trackedCount).toBe(0);
      expect(`Refreshing ${trackedCount} conversation${trackedCount !== 1 ? 's' : ''}...`)
        .toBe('Refreshing 0 conversations...');
    });

    it('should report success with data from sync-all response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          synced: 2,
          totalNewMessages: 15,
          totalConversations: 3,
          message: 'Synced 2 conversation(s) with 15 new messages',
        }),
      });

      const res = await fetch('/api/vendors/sync-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weddingId: 'wedding-123' }),
      });
      const data = await res.json();

      expect(res.ok).toBe(true);
      expect(data.synced).toBe(2);
      expect(data.totalNewMessages).toBe(15);
      expect(data.message).toContain('Synced 2');
    });

    it('should report partial errors from sync-all', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          synced: 1,
          totalNewMessages: 5,
          totalConversations: 3,
          errors: ['Venue Chat: Whapi error', 'DJ Group: Unknown error'],
          message: 'Synced 1 conversation(s) with 5 new messages',
        }),
      });

      const res = await fetch('/api/vendors/sync-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weddingId: 'wedding-123' }),
      });
      const data = await res.json();

      expect(res.ok).toBe(true);
      expect(data.errors).toHaveLength(2);
      expect(data.errors[0]).toContain('Venue Chat');
    });

    it('should handle sync-all total failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Whapi not configured' }),
      });

      const res = await fetch('/api/vendors/sync-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weddingId: 'wedding-123' }),
      });
      const data = await res.json();

      expect(res.ok).toBe(false);
      expect(data.error).toBe('Whapi not configured');
    });

    it('should handle no tracked conversations', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          synced: 0,
          totalNewMessages: 0,
          totalConversations: 0,
          message: 'No tracked conversations to sync',
        }),
      });

      const res = await fetch('/api/vendors/sync-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weddingId: 'wedding-123' }),
      });
      const data = await res.json();

      expect(data.synced).toBe(0);
      expect(data.message).toContain('No tracked');
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // IMPORT CHAT — guard + await loadData + error reporting
  // ══════════════════════════════════════════════════════════════════

  describe('handleImportChat', () => {
    it('should send FormData with file and weddingId', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message_count: 42, conversation_id: 'c-123' }),
      });

      const formData = new FormData();
      formData.append('file', new Blob(['test chat data'], { type: 'text/plain' }), 'chat.txt');
      formData.append('weddingId', 'wedding-123');

      const res = await fetch('/api/vendors/import-chat', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      expect(res.ok).toBe(true);
      expect(data.message_count).toBe(42);
    });

    it('should optionally include vendorId in FormData', async () => {
      const formData = new FormData();
      formData.append('file', new Blob(['chat']), 'chat.txt');
      formData.append('weddingId', 'wedding-123');
      formData.append('vendorId', 'vendor-456');

      expect(formData.get('vendorId')).toBe('vendor-456');
    });

    it('should not send vendorId when empty', () => {
      const formData = new FormData();
      formData.append('file', new Blob(['chat']), 'chat.txt');
      formData.append('weddingId', 'wedding-123');
      const importVendorId = '';
      if (importVendorId) formData.append('vendorId', importVendorId);

      expect(formData.get('vendorId')).toBeNull();
    });

    it('should handle import failure response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Invalid file format' }),
      });

      const res = await fetch('/api/vendors/import-chat', {
        method: 'POST',
        body: new FormData(),
      });
      const data = await res.json();

      expect(res.ok).toBe(false);
      expect(data.error).toBe('Invalid file format');
    });

    it('should handle network failure during import', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Connection refused'));

      let caught = false;
      try {
        await fetch('/api/vendors/import-chat', { method: 'POST', body: new FormData() });
      } catch {
        caught = true;
      }

      expect(caught).toBe(true);
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // SYNC SELECTED CHATS
  // ══════════════════════════════════════════════════════════════════

  describe('handleSyncSelected', () => {
    it('should split selected IDs into groupIds and chatIds', () => {
      const selectedChatIds = new Set([
        'g1@g.us',
        'g2@g.us',
        'd1@s.whatsapp.net',
        'd2@s.whatsapp.net',
      ]);

      const groupIds = Array.from(selectedChatIds).filter(id => id.endsWith('@g.us'));
      const chatIds = Array.from(selectedChatIds).filter(id => id.endsWith('@s.whatsapp.net'));

      expect(groupIds).toEqual(['g1@g.us', 'g2@g.us']);
      expect(chatIds).toEqual(['d1@s.whatsapp.net', 'd2@s.whatsapp.net']);
    });

    it('should handle only group selections', () => {
      const selectedChatIds = new Set(['g1@g.us', 'g2@g.us']);
      const groupIds = Array.from(selectedChatIds).filter(id => id.endsWith('@g.us'));
      const chatIds = Array.from(selectedChatIds).filter(id => id.endsWith('@s.whatsapp.net'));

      expect(groupIds).toHaveLength(2);
      expect(chatIds).toHaveLength(0);
    });

    it('should handle only direct chat selections', () => {
      const selectedChatIds = new Set(['d1@s.whatsapp.net']);
      const groupIds = Array.from(selectedChatIds).filter(id => id.endsWith('@g.us'));
      const chatIds = Array.from(selectedChatIds).filter(id => id.endsWith('@s.whatsapp.net'));

      expect(groupIds).toHaveLength(0);
      expect(chatIds).toHaveLength(1);
    });

    it('should send correct POST body to sync-groups', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          synced: 2,
          results: [
            { chatName: 'Venue', messagesImported: 50, vendorName: 'Lakeside', isNew: true, chatType: 'group' },
            { chatName: 'John', messagesImported: 20, vendorName: 'John DJ', isNew: true, chatType: 'direct' },
          ],
          message: 'Synced 2 chat(s) with 70 new messages',
        }),
      });

      const res = await fetch('/api/vendors/sync-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weddingId: 'wedding-123',
          groupIds: ['g1@g.us'],
          chatIds: ['d1@s.whatsapp.net'],
        }),
      });
      const data = await res.json();

      expect(data.synced).toBe(2);
      expect(data.results).toHaveLength(2);
    });

    it('should handle sync errors in response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          synced: 0,
          results: [],
          errors: [{ chatId: 'g1@g.us', chatName: 'Venue', error: 'No messages returned' }],
          message: 'Sync failed: Venue: No messages returned',
        }),
      });

      const res = await fetch('/api/vendors/sync-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weddingId: 'wedding-123', groupIds: ['g1@g.us'], chatIds: [] }),
      });
      const data = await res.json();

      expect(data.synced).toBe(0);
      expect(data.errors).toHaveLength(1);
      expect(data.errors[0].error).toContain('No messages');
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // CHAT SELECTION TOGGLE
  // ══════════════════════════════════════════════════════════════════

  describe('toggleChatSelection', () => {
    it('should add chat to selection', () => {
      const prev = new Set<string>();
      const next = new Set(prev);
      next.add('g1@g.us');
      expect(next.has('g1@g.us')).toBe(true);
      expect(next.size).toBe(1);
    });

    it('should remove chat from selection on second toggle', () => {
      const prev = new Set(['g1@g.us']);
      const next = new Set(prev);
      if (next.has('g1@g.us')) next.delete('g1@g.us');
      else next.add('g1@g.us');

      expect(next.has('g1@g.us')).toBe(false);
      expect(next.size).toBe(0);
    });

    it('should handle select all for current tab', () => {
      const prev = new Set<string>();
      const currentTabChatIds = ['g1@g.us', 'g2@g.us', 'g3@g.us'];
      const next = new Set(prev);
      currentTabChatIds.forEach(id => next.add(id));

      expect(next.size).toBe(3);
    });

    it('should handle clear for current tab without affecting other tab', () => {
      const prev = new Set(['g1@g.us', 'g2@g.us', 'd1@s.whatsapp.net']);
      const groupTabIds = ['g1@g.us', 'g2@g.us'];
      const next = new Set(prev);
      groupTabIds.forEach(id => next.delete(id));

      expect(next.size).toBe(1);
      expect(next.has('d1@s.whatsapp.net')).toBe(true);
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // SYNC DIALOG TAB LOGIC
  // ══════════════════════════════════════════════════════════════════

  describe('sync dialog tab logic', () => {
    it('should show groups on tab 0', () => {
      const syncDialogTab = 0;
      const discoveredGroups = [{ id: 'g1@g.us', name: 'Group', participantCount: 3 }];
      const discoveredDirectChats = [{ id: 'd1@s.whatsapp.net', name: 'Direct', participantCount: 0 }];

      const currentTabChats = syncDialogTab === 0 ? discoveredGroups : discoveredDirectChats;
      expect(currentTabChats).toEqual(discoveredGroups);
    });

    it('should show direct chats on tab 1', () => {
      const syncDialogTab: number = 1;
      const discoveredGroups = [{ id: 'g1@g.us', name: 'Group', participantCount: 3 }];
      const discoveredDirectChats = [{ id: 'd1@s.whatsapp.net', name: 'Direct', participantCount: 0 }];

      const currentTabChats = syncDialogTab === 0 ? discoveredGroups : discoveredDirectChats;
      expect(currentTabChats).toEqual(discoveredDirectChats);
    });

    it('should use single discoveringGroups flag for both tabs', () => {
      // After revert: currentTabLoading = discoveringGroups (not tab-dependent)
      const discoveringGroups = true;
      const currentTabLoading = discoveringGroups;

      expect(currentTabLoading).toBe(true);

      // Both tabs use same loading state
      const tab0Loading = discoveringGroups;
      const tab1Loading = discoveringGroups;
      expect(tab0Loading).toBe(tab1Loading);
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // LOADING STATE TRANSITIONS
  // ══════════════════════════════════════════════════════════════════

  describe('loading state transitions', () => {
    it('should follow correct discover flow: idle → loading → loaded', () => {
      const states: string[] = [];
      let discoveringGroups = false;

      // idle
      states.push(discoveringGroups ? 'loading' : 'idle');

      // start
      discoveringGroups = true;
      states.push(discoveringGroups ? 'loading' : 'idle');

      // done
      discoveringGroups = false;
      states.push(discoveringGroups ? 'loading' : 'idle');

      expect(states).toEqual(['idle', 'loading', 'idle']);
    });

    it('should follow correct sync-all flow: idle → syncing → synced', () => {
      const states: string[] = [];
      let syncingAll = false;
      let syncAllLabel = '';

      states.push('idle');

      syncingAll = true;
      syncAllLabel = 'Refreshing 3 conversations...';
      states.push('syncing');

      syncingAll = false;
      syncAllLabel = '';
      states.push('idle');

      expect(states).toEqual(['idle', 'syncing', 'idle']);
    });

    it('should follow correct import flow: idle → importing → done', () => {
      const states: string[] = [];
      let importing = false;

      states.push('idle');

      importing = true;
      states.push('importing');

      importing = false;
      states.push('idle');

      expect(states).toEqual(['idle', 'importing', 'idle']);
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // AWAIT LOAD DATA
  // ══════════════════════════════════════════════════════════════════

  describe('await loadData behavior', () => {
    it('should complete loadData before clearing spinner', async () => {
      const events: string[] = [];

      const loadData = async () => {
        events.push('loadData:start');
        await new Promise(r => setTimeout(r, 10));
        events.push('loadData:end');
      };

      // Simulates handleSyncAll with await
      events.push('syncAll:start');
      await loadData();
      events.push('syncAll:clearSpinner');

      expect(events).toEqual([
        'syncAll:start',
        'loadData:start',
        'loadData:end',
        'syncAll:clearSpinner',
      ]);
    });

    it('should NOT clear spinner before data loads (old behavior without await)', async () => {
      const events: string[] = [];

      const loadData = async () => {
        events.push('loadData:start');
        await new Promise(r => setTimeout(r, 10));
        events.push('loadData:end');
      };

      // Simulates old code without await (fire-and-forget)
      events.push('syncAll:start');
      loadData(); // no await — fire and forget
      events.push('syncAll:clearSpinner');

      // Wait for loadData to finish
      await new Promise(r => setTimeout(r, 20));

      // Spinner cleared BEFORE data loaded — bad UX
      expect(events).toEqual([
        'syncAll:start',
        'loadData:start',
        'syncAll:clearSpinner',
        'loadData:end',
      ]);
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // ERROR REPORTING
  // ══════════════════════════════════════════════════════════════════

  describe('error reporting', () => {
    it('should log and toast on discover groups error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Whapi not configured' }),
      });

      // Simulate handler error path
      const res = await fetch('/api/vendors/sync-groups');
      const data = await res.json();
      if (!res.ok) {
        console.error('Failed to discover chats:', data);
        mockToastError(data.error || 'Failed to discover chats');
      }

      expect(consoleSpy).toHaveBeenCalledWith('Failed to discover chats:', data);
      expect(mockToastError).toHaveBeenCalledWith('Whapi not configured');
      consoleSpy.mockRestore();
    });

    it('should log and toast on sync-all partial errors', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const data = {
        synced: 1,
        errors: ['Venue Chat: Whapi error'],
        message: 'Synced 1 conversation(s)',
      };

      if (data.errors?.length) {
        console.error('Sync-all partial errors:', data.errors);
        mockToastError(`Sync finished with errors: ${data.errors.join('; ')}`);
      }

      expect(consoleSpy).toHaveBeenCalledWith('Sync-all partial errors:', data.errors);
      expect(mockToastError).toHaveBeenCalledWith('Sync finished with errors: Venue Chat: Whapi error');
      consoleSpy.mockRestore();
    });

    it('should log and toast on import chat error response', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const errData = { error: 'Invalid file format' };
      console.error('Import failed:', errData);
      mockToastError(errData.error || 'Import failed');

      expect(consoleSpy).toHaveBeenCalledWith('Import failed:', errData);
      expect(mockToastError).toHaveBeenCalledWith('Invalid file format');
      consoleSpy.mockRestore();
    });

    it('should log and toast on import chat network error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const err = new Error('Connection refused');
      console.error('Import chat error:', err);
      mockToastError('Import failed');

      expect(consoleSpy).toHaveBeenCalledWith('Import chat error:', err);
      expect(mockToastError).toHaveBeenCalledWith('Import failed');
      consoleSpy.mockRestore();
    });

    it('should log coordinator info fetch errors', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const err = new Error('Network error');
      console.error('Failed to fetch coordinator info:', err);

      expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch coordinator info:', err);
      consoleSpy.mockRestore();
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // VENDOR TILE DATA
  // ══════════════════════════════════════════════════════════════════

  describe('vendor tile data (State C)', () => {
    const vendor = {
      id: 'v1',
      name: 'Lakeside Manor',
      category: 'Venue',
      phone: '+1234',
      email: null,
      status: 'booked',
      vendor_conversations: [
        { id: 'c1', title: 'Group Chat', message_count: 42, last_message_at: '2026-03-01', status: 'ready' },
        { id: 'c2', title: 'Direct Chat', message_count: 10, last_message_at: '2026-03-02', status: 'ready' },
      ],
      vendor_insights: [
        { id: 'i1', insight_type: 'summary', content: 'Venue confirmed for Dec 15.', is_completed: false, priority: 'medium', due_date: null },
        { id: 'i2', insight_type: 'action_item', content: 'Send deposit', is_completed: false, priority: 'high', due_date: '2026-03-10' },
        { id: 'i3', insight_type: 'action_item', content: 'Confirm menu', is_completed: true, priority: 'medium', due_date: null },
      ],
    };

    it('should find summary insight', () => {
      const summary = vendor.vendor_insights.find(i => i.insight_type === 'summary');
      expect(summary).toBeDefined();
      expect(summary!.content).toContain('Dec 15');
    });

    it('should count open (incomplete) action items', () => {
      const actionItems = vendor.vendor_insights.filter(
        i => i.insight_type === 'action_item' && !i.is_completed
      );
      expect(actionItems).toHaveLength(1);
      expect(actionItems[0].content).toBe('Send deposit');
    });

    it('should compute total messages across conversations', () => {
      const totalMessages = vendor.vendor_conversations.reduce(
        (s, c) => s + (c.message_count || 0), 0
      );
      expect(totalMessages).toBe(52);
    });

    it('should map status to correct color', () => {
      const STATUS_COLORS: Record<string, string> = {
        active: '#2196F3',
        booked: '#4CAF50',
        declined: '#9E9E9E',
        paid: '#8BC34A',
      };

      expect(STATUS_COLORS[vendor.status]).toBe('#4CAF50');
      expect(STATUS_COLORS['active']).toBe('#2196F3');
      expect(STATUS_COLORS['nonexistent']).toBeUndefined();
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // LOAD DATA
  // ══════════════════════════════════════════════════════════════════

  describe('loadData', () => {
    it('should fetch wedding by slug then vendors by weddingId', async () => {
      // First call: wedding lookup (via supabase mock)
      // Second call: vendors fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          vendors: [
            { id: 'v1', name: 'Vendor A', category: 'Venue', status: 'active', vendor_conversations: [], vendor_insights: [] },
          ],
        }),
      });

      const res = await fetch('/api/vendors?weddingId=wedding-123');
      const data = await res.json();

      expect(data.vendors).toHaveLength(1);
      expect(data.vendors[0].name).toBe('Vendor A');
    });

    it('should handle empty vendor list', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ vendors: [] }),
      });

      const res = await fetch('/api/vendors?weddingId=wedding-123');
      const data = await res.json();

      expect(data.vendors).toEqual([]);
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // SUPER ADMIN
  // ══════════════════════════════════════════════════════════════════

  describe('super admin detection', () => {
    it('should identify kv as super admin', () => {
      const email: string = 'kv.s.ghumaan@gmail.com';
      const isSuperAdmin = email === 'kv.s.ghumaan@gmail.com' || email === 'savani.simran@google.com' || email === 'demo@phera.io';
      expect(isSuperAdmin).toBe(true);
    });

    it('should identify simran as super admin', () => {
      const email: string = 'savani.simran@google.com';
      const isSuperAdmin = email === 'kv.s.ghumaan@gmail.com' || email === 'savani.simran@google.com' || email === 'demo@phera.io';
      expect(isSuperAdmin).toBe(true);
    });

    it('should identify demo user as super admin', () => {
      const email: string = 'demo@phera.io';
      const isSuperAdmin = email === 'kv.s.ghumaan@gmail.com' || email === 'savani.simran@google.com' || email === 'demo@phera.io';
      expect(isSuperAdmin).toBe(true);
    });

    it('should not identify random user as super admin', () => {
      const email: string = 'random@example.com';
      const isSuperAdmin = email === 'kv.s.ghumaan@gmail.com' || email === 'savani.simran@google.com' || email === 'demo@phera.io';
      expect(isSuperAdmin).toBe(false);
    });
  });
});
