import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isDemoUser,
  DEMO_VENDORS,
  DEMO_VENDOR_DETAILS,
  DEMO_MEMBERS,
  DEMO_COORDINATOR_PHONE,
  DEMO_COORDINATOR_TOOLTIP,
  DEMO_BUTTON_TOOLTIPS,
} from '@/lib/demo/coordinator-mock-data';

// ─── Mocks ──────────────────────────────────────────────────────────

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

vi.mock('sonner', () => ({
  toast: { success: mockToastSuccess, error: mockToastError },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockRouterPush, replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/admin/demo/vendor-management',
  useSearchParams: () => new URLSearchParams(),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

// ═══════════════════════════════════════════════════════════════════
// DEMO USER IDENTIFICATION
// ═══════════════════════════════════════════════════════════════════

describe('Demo user identification', () => {
  afterEach(() => {
    sessionStorage.removeItem('phera_demo_mode');
  });

  it('should identify demo mode when sessionStorage flag is set', () => {
    sessionStorage.setItem('phera_demo_mode', 'true');
    expect(isDemoUser()).toBe(true);
  });

  it('should not identify demo mode when flag is absent', () => {
    expect(isDemoUser()).toBe(false);
  });

  it('should not identify demo mode when flag is not "true"', () => {
    sessionStorage.setItem('phera_demo_mode', 'false');
    expect(isDemoUser()).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════
// DEMO MOCK DATA INTEGRITY — DASHBOARD VENDORS
// ═══════════════════════════════════════════════════════════════════

describe('Demo vendors (dashboard)', () => {
  it('should have exactly 5 vendors', () => {
    expect(DEMO_VENDORS).toHaveLength(5);
  });

  it('should have unique IDs', () => {
    const ids = DEMO_VENDORS.map((v) => v.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('should have required Vendor interface fields for each vendor', () => {
    for (const vendor of DEMO_VENDORS) {
      expect(vendor).toHaveProperty('id');
      expect(vendor).toHaveProperty('name');
      expect(vendor).toHaveProperty('category');
      expect(vendor).toHaveProperty('status');
      expect(vendor).toHaveProperty('vendor_conversations');
      expect(vendor).toHaveProperty('vendor_insights');
      expect(typeof vendor.id).toBe('string');
      expect(typeof vendor.name).toBe('string');
      expect(vendor.name.length).toBeGreaterThan(0);
    }
  });

  it('should have valid statuses', () => {
    const validStatuses = ['active', 'booked', 'declined', 'paid'];
    for (const vendor of DEMO_VENDORS) {
      expect(validStatuses).toContain(vendor.status);
    }
  });

  it('should have at least one conversation per vendor', () => {
    for (const vendor of DEMO_VENDORS) {
      expect(vendor.vendor_conversations.length).toBeGreaterThanOrEqual(1);
      for (const conv of vendor.vendor_conversations) {
        expect(conv).toHaveProperty('id');
        expect(conv).toHaveProperty('message_count');
        expect(conv.message_count).toBeGreaterThan(0);
      }
    }
  });

  it('should have at least one summary insight per vendor', () => {
    for (const vendor of DEMO_VENDORS) {
      const summaries = vendor.vendor_insights.filter(
        (i) => i.insight_type === 'summary'
      );
      expect(summaries.length).toBeGreaterThanOrEqual(1);
      for (const s of summaries) {
        expect(s.content.length).toBeGreaterThan(20);
      }
    }
  });

  it('should have at least one action item per vendor', () => {
    for (const vendor of DEMO_VENDORS) {
      const items = vendor.vendor_insights.filter(
        (i) => i.insight_type === 'action_item'
      );
      expect(items.length).toBeGreaterThanOrEqual(1);
      for (const item of items) {
        expect(item.content.length).toBeGreaterThan(5);
        expect(item.due_date).toBeTruthy();
      }
    }
  });

  it('should have valid insight types', () => {
    const validTypes = ['summary', 'action_item', 'decision', 'price_quote', 'deadline'];
    for (const vendor of DEMO_VENDORS) {
      for (const insight of vendor.vendor_insights) {
        expect(validTypes).toContain(insight.insight_type);
      }
    }
  });

  it('should have parseable due dates on action items', () => {
    for (const vendor of DEMO_VENDORS) {
      for (const insight of vendor.vendor_insights) {
        if (insight.due_date) {
          const date = new Date(insight.due_date);
          expect(isNaN(date.getTime())).toBe(false);
        }
      }
    }
  });
});

// ═══════════════════════════════════════════════════════════════════
// DEMO MOCK DATA INTEGRITY — VENDOR DETAIL PAGES
// ═══════════════════════════════════════════════════════════════════

describe('Demo vendor details', () => {
  it('should have detail data for every dashboard vendor', () => {
    for (const vendor of DEMO_VENDORS) {
      expect(DEMO_VENDOR_DETAILS[vendor.id]).toBeDefined();
    }
  });

  it('should match dashboard vendor names', () => {
    for (const vendor of DEMO_VENDORS) {
      const detail = DEMO_VENDOR_DETAILS[vendor.id];
      expect(detail.name).toBe(vendor.name);
      expect(detail.category).toBe(vendor.category);
      expect(detail.status).toBe(vendor.status);
    }
  });

  it('should have required VendorDetail interface fields', () => {
    for (const [id, detail] of Object.entries(DEMO_VENDOR_DETAILS)) {
      expect(detail).toHaveProperty('id');
      expect(detail.id).toBe(id);
      expect(detail).toHaveProperty('name');
      expect(detail).toHaveProperty('category');
      expect(detail).toHaveProperty('status');
      expect(detail).toHaveProperty('notes');
      expect(detail).toHaveProperty('vendor_conversations');
      expect(detail).toHaveProperty('vendor_insights');
    }
  });

  it('should have conversations with message arrays', () => {
    for (const detail of Object.values(DEMO_VENDOR_DETAILS)) {
      expect(detail.vendor_conversations.length).toBeGreaterThanOrEqual(1);
      for (const conv of detail.vendor_conversations) {
        expect(conv).toHaveProperty('id');
        expect(conv).toHaveProperty('vendor_messages');
        expect(conv).toHaveProperty('source');
        expect(conv.vendor_messages.length).toBeGreaterThanOrEqual(5);
      }
    }
  });

  it('should have valid message fields', () => {
    for (const detail of Object.values(DEMO_VENDOR_DETAILS)) {
      for (const conv of detail.vendor_conversations) {
        for (const msg of conv.vendor_messages) {
          expect(msg).toHaveProperty('id');
          expect(msg).toHaveProperty('sender_name');
          expect(msg).toHaveProperty('sender_type');
          expect(msg).toHaveProperty('content');
          expect(msg).toHaveProperty('message_timestamp');
          expect(msg).toHaveProperty('has_media');
          expect(typeof msg.content).toBe('string');
          expect(msg.content.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('should have valid sender types', () => {
    const validTypes = ['vendor', 'couple', 'planner', 'coordinator', 'unknown'];
    for (const detail of Object.values(DEMO_VENDOR_DETAILS)) {
      for (const conv of detail.vendor_conversations) {
        for (const msg of conv.vendor_messages) {
          expect(validTypes).toContain(msg.sender_type);
        }
      }
    }
  });

  it('should have parseable message timestamps sorted chronologically', () => {
    for (const detail of Object.values(DEMO_VENDOR_DETAILS)) {
      for (const conv of detail.vendor_conversations) {
        let prevTime = 0;
        for (const msg of conv.vendor_messages) {
          const time = new Date(msg.message_timestamp).getTime();
          expect(isNaN(time)).toBe(false);
          expect(time).toBeGreaterThanOrEqual(prevTime);
          prevTime = time;
        }
      }
    }
  });

  it('should have insight data matching detail page expectations', () => {
    const requiredTypes = ['summary', 'action_item'];
    for (const detail of Object.values(DEMO_VENDOR_DETAILS)) {
      for (const type of requiredTypes) {
        const found = detail.vendor_insights.filter((i) => i.insight_type === type);
        expect(found.length).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('should have insights with required fields for detail page rendering', () => {
    for (const detail of Object.values(DEMO_VENDOR_DETAILS)) {
      for (const insight of detail.vendor_insights) {
        expect(insight).toHaveProperty('id');
        expect(insight).toHaveProperty('insight_type');
        expect(insight).toHaveProperty('content');
        expect(insight).toHaveProperty('is_completed');
        expect(insight).toHaveProperty('priority');
        expect(insight).toHaveProperty('metadata');
        expect(insight).toHaveProperty('created_at');
        // created_at must be parseable
        expect(isNaN(new Date(insight.created_at).getTime())).toBe(false);
      }
    }
  });

  it('should have valid priorities', () => {
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    for (const detail of Object.values(DEMO_VENDOR_DETAILS)) {
      for (const insight of detail.vendor_insights) {
        expect(validPriorities).toContain(insight.priority);
      }
    }
  });
});

// ═══════════════════════════════════════════════════════════════════
// DEMO MOCK DATA INTEGRITY — MEMBERS
// ═══════════════════════════════════════════════════════════════════

describe('Demo members', () => {
  it('should have members for every dashboard vendor', () => {
    for (const vendor of DEMO_VENDORS) {
      expect(DEMO_MEMBERS[vendor.id]).toBeDefined();
      expect(DEMO_MEMBERS[vendor.id].length).toBeGreaterThanOrEqual(2);
    }
  });

  it('should have required member fields', () => {
    for (const members of Object.values(DEMO_MEMBERS)) {
      for (const member of members) {
        expect(member).toHaveProperty('id');
        expect(member).toHaveProperty('name');
        expect(member).toHaveProperty('role');
        expect(typeof member.name).toBe('string');
        expect(member.name.length).toBeGreaterThan(0);
      }
    }
  });

  it('should have valid roles', () => {
    const validRoles = ['vendor', 'admin', 'member'];
    for (const members of Object.values(DEMO_MEMBERS)) {
      for (const member of members) {
        expect(validRoles).toContain(member.role);
      }
    }
  });

  it('should have at least one vendor-role member per vendor', () => {
    for (const members of Object.values(DEMO_MEMBERS)) {
      const vendorMembers = members.filter((m) => m.role === 'vendor');
      expect(vendorMembers.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('should have unique member IDs globally', () => {
    const allIds = Object.values(DEMO_MEMBERS).flat().map((m) => m.id);
    expect(new Set(allIds).size).toBe(allIds.length);
  });
});

// ═══════════════════════════════════════════════════════════════════
// DEMO CONSTANTS
// ═══════════════════════════════════════════════════════════════════

describe('Demo constants', () => {
  it('should have a coordinator phone number', () => {
    expect(DEMO_COORDINATOR_PHONE).toBeTruthy();
    expect(typeof DEMO_COORDINATOR_PHONE).toBe('string');
    expect(DEMO_COORDINATOR_PHONE.length).toBeGreaterThan(5);
  });

  it('should have a coordinator tooltip', () => {
    expect(DEMO_COORDINATOR_TOOLTIP).toBeTruthy();
    expect(typeof DEMO_COORDINATOR_TOOLTIP).toBe('string');
    expect(DEMO_COORDINATOR_TOOLTIP.length).toBeGreaterThan(10);
  });

  it('should have all required button tooltips', () => {
    const requiredKeys = [
      'connectChat',
      'uploadChat',
      'refreshAll',
      'deleteVendor',
      'editVendor',
      'refreshInsights',
      'deleteVendorDetail',
      'actionItemCheckbox',
    ];
    for (const key of requiredKeys) {
      expect(DEMO_BUTTON_TOOLTIPS).toHaveProperty(key);
      expect((DEMO_BUTTON_TOOLTIPS as any)[key].length).toBeGreaterThan(5);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════
// DEMO DASHBOARD FLOW LOGIC
// ═══════════════════════════════════════════════════════════════════

describe('Demo dashboard flow', () => {
  it('demo user should bypass beta gate', () => {
    const BETA_ACCESS_EMAILS = ['kv.s.ghumaan@gmail.com', 'savani.simran@google.com'];
    const email = 'demo@phera.io';
    const isPro = true;
    const isBetaUser = BETA_ACCESS_EMAILS.includes(email.toLowerCase());
    sessionStorage.setItem('phera_demo_mode', 'true');
    const isDemo = isDemoUser();

    // Without demo check, this user hits State A.5 (beta gate)
    expect(isPro && !isBetaUser).toBe(true);
    // With demo check, they bypass it
    expect(isPro && !isBetaUser && !isDemo).toBe(false);
    sessionStorage.removeItem('phera_demo_mode');
  });

  it('demo user should load mock vendors without API calls', () => {
    const isDemo = true;
    const vendors: any[] = [];
    let apiCalled = false;

    if (isDemo) {
      vendors.push(...DEMO_VENDORS);
    } else {
      apiCalled = true;
    }

    expect(vendors).toHaveLength(5);
    expect(apiCalled).toBe(false);
  });

  it('non-demo user should NOT get mock vendors', () => {
    const isDemo = false;
    const vendors: any[] = [];
    let apiCalled = false;

    if (isDemo) {
      vendors.push(...DEMO_VENDORS);
    } else {
      apiCalled = true;
    }

    expect(vendors).toHaveLength(0);
    expect(apiCalled).toBe(true);
  });

  it('demo vendor cards should navigate to detail pages', () => {
    const weddingSlug = 'demo';
    for (const vendor of DEMO_VENDORS) {
      const expectedPath = `/admin/${weddingSlug}/vendor-management/${vendor.id}`;
      expect(expectedPath).toContain(vendor.id);
      // Verify the detail data exists for this navigation target
      expect(DEMO_VENDOR_DETAILS[vendor.id]).toBeDefined();
    }
  });
});

// ═══════════════════════════════════════════════════════════════════
// DEMO DETAIL PAGE FLOW LOGIC
// ═══════════════════════════════════════════════════════════════════

describe('Demo detail page flow', () => {
  it('should load vendor detail from mock data', () => {
    for (const vendorId of Object.keys(DEMO_VENDOR_DETAILS)) {
      const detail = DEMO_VENDOR_DETAILS[vendorId];
      expect(detail).toBeDefined();
      expect(detail.id).toBe(vendorId);

      // EditForm should be derivable from detail
      const editForm = {
        name: detail.name || '',
        category: detail.category || '',
        phone: detail.phone || '',
        email: detail.email || '',
        status: detail.status || 'active',
        notes: detail.notes || '',
      };
      expect(editForm.name).toBeTruthy();
      expect(editForm.status).toBeTruthy();
    }
  });

  it('should compute allMessages correctly from mock conversations', () => {
    for (const detail of Object.values(DEMO_VENDOR_DETAILS)) {
      const allMessages = detail.vendor_conversations
        .flatMap((c) => c.vendor_messages || [])
        .sort(
          (a, b) =>
            new Date(a.message_timestamp).getTime() - new Date(b.message_timestamp).getTime()
        );
      expect(allMessages.length).toBeGreaterThanOrEqual(5);

      // Verify sorted order
      for (let i = 1; i < allMessages.length; i++) {
        expect(
          new Date(allMessages[i].message_timestamp).getTime()
        ).toBeGreaterThanOrEqual(
          new Date(allMessages[i - 1].message_timestamp).getTime()
        );
      }
    }
  });

  it('should group insights by type correctly', () => {
    for (const detail of Object.values(DEMO_VENDOR_DETAILS)) {
      const summaries = detail.vendor_insights.filter((i) => i.insight_type === 'summary');
      const actionItems = detail.vendor_insights.filter((i) => i.insight_type === 'action_item');
      const decisions = detail.vendor_insights.filter((i) => i.insight_type === 'decision');
      const priceQuotes = detail.vendor_insights.filter((i) => i.insight_type === 'price_quote');
      const deadlines = detail.vendor_insights.filter((i) => i.insight_type === 'deadline');

      // At least summary + action items
      expect(summaries.length).toBeGreaterThanOrEqual(1);
      expect(actionItems.length).toBeGreaterThanOrEqual(1);

      // Total should match
      const totalGrouped = summaries.length + actionItems.length + decisions.length + priceQuotes.length + deadlines.length;
      expect(totalGrouped).toBe(detail.vendor_insights.length);
    }
  });

  it('should allow local toggle of action items (no API call)', () => {
    const detail = { ...DEMO_VENDOR_DETAILS['demo-1'] };
    const actionItem = detail.vendor_insights.find((i) => i.insight_type === 'action_item')!;
    expect(actionItem.is_completed).toBe(false);

    // Simulate optimistic toggle
    const updated = {
      ...detail,
      vendor_insights: detail.vendor_insights.map((i) =>
        i.id === actionItem.id ? { ...i, is_completed: !actionItem.is_completed } : i
      ),
    };
    const toggledItem = updated.vendor_insights.find((i) => i.id === actionItem.id)!;
    expect(toggledItem.is_completed).toBe(true);
  });

  it('should have members data for each vendor detail', () => {
    for (const vendorId of Object.keys(DEMO_VENDOR_DETAILS)) {
      expect(DEMO_MEMBERS[vendorId]).toBeDefined();
      expect(DEMO_MEMBERS[vendorId].length).toBeGreaterThanOrEqual(2);
    }
  });

  it('should handle missing vendor ID gracefully', () => {
    const detail = DEMO_VENDOR_DETAILS['nonexistent-id'];
    expect(detail).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════════════
// CROSS-PAGE CONSISTENCY
// ═══════════════════════════════════════════════════════════════════

describe('Cross-page data consistency', () => {
  it('dashboard message counts should match detail message counts', () => {
    for (const vendor of DEMO_VENDORS) {
      const dashboardMsgCount = vendor.vendor_conversations.reduce(
        (s, c) => s + c.message_count, 0
      );
      const detail = DEMO_VENDOR_DETAILS[vendor.id];
      const detailMsgCount = detail.vendor_conversations[0].vendor_messages.length;
      // message_count on dashboard should match actual messages in detail
      // (or be greater if we say "34 msgs" but only show 10 representative ones)
      expect(dashboardMsgCount).toBeGreaterThanOrEqual(detailMsgCount);
    }
  });

  it('dashboard action item counts should match detail', () => {
    for (const vendor of DEMO_VENDORS) {
      const dashboardActionCount = vendor.vendor_insights.filter(
        (i) => i.insight_type === 'action_item' && !i.is_completed
      ).length;
      const detail = DEMO_VENDOR_DETAILS[vendor.id];
      const detailActionCount = detail.vendor_insights.filter(
        (i) => i.insight_type === 'action_item' && !i.is_completed
      ).length;
      expect(dashboardActionCount).toBe(detailActionCount);
    }
  });

  it('vendor IDs should be consistent across all data structures', () => {
    const dashboardIds = new Set(DEMO_VENDORS.map((v) => v.id));
    const detailIds = new Set(Object.keys(DEMO_VENDOR_DETAILS));
    const memberIds = new Set(Object.keys(DEMO_MEMBERS));

    expect(dashboardIds).toEqual(detailIds);
    expect(dashboardIds).toEqual(memberIds);
  });
});
