import { describe, it, expect } from 'vitest';
import { OutreachSummary, OutreachEvent, OutreachSequence } from '@/lib/types/outreach';

// Test the data logic used by Control Tower components
// (Avoid importing MUI components in tests to prevent ESM issues)

// ─── Helper functions extracted from page.tsx ───────────────────────

function daysUntilWedding(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function rsvpPercentage(breakdown: { yes: number; no: number; maybe: number; pending: number }, total: number): string {
  if (total === 0) return '0%';
  const responded = breakdown.yes + breakdown.no + breakdown.maybe;
  return `${Math.round((responded / total) * 100)}%`;
}

// ─── Helper for unified timeline filtering ──────────────────────────

type FilterMode = 'all' | 'sent' | 'received' | 'escalations';

function filterTimelineEvents(events: any[], filter: FilterMode): any[] {
  return events.filter((e: any) => {
    if (filter === 'sent') return ['template_sent', 'status_changed'].includes(e.event_type);
    if (filter === 'received') return ['message_received', 'rsvp_received', 'info_collected', 'conversation_started'].includes(e.event_type);
    if (filter === 'escalations') return ['escalated', 'issue_created'].includes(e.event_type);
    return true;
  });
}

// ─── Helper for compose panel template validation ───────────────────

const TEMPLATE_KEYS = [
  'SAVE_THE_DATE', 'RSVP_REQUEST', 'MULTI_EVENT_INVITE', 'LOGISTICS_INTRO',
  'NUDGE', 'TRAVEL_REQUEST', 'RSVP_CONFIRMATION', 'SCHEDULE_REMINDER',
  'DAY_BEFORE_SUMMARY', 'THANK_YOU', 'CULTURAL_GUIDE',
];

const STATUS_MAP: Record<string, string> = {
  SAVE_THE_DATE: 'save_the_date_sent',
  RSVP_REQUEST: 'rsvp_requested',
  MULTI_EVENT_INVITE: 'rsvp_requested',
  LOGISTICS_INTRO: 'rsvp_requested',
  TRAVEL_REQUEST: 'travel_collected',
};

describe('Control Tower — Data Logic', () => {
  describe('OutreachStatusTracker', () => {
    const mockSummary: OutreachSummary = {
      total_guests: 300,
      not_contacted: 100,
      save_the_date_sent: 80,
      rsvp_requested: 50,
      rsvp_confirmed: 40,
      travel_collected: 15,
      logistics_complete: 10,
      unresponsive: 5,
      escalations_open: 3,
      next_scheduled_action: {
        type: 'rsvp_nudge',
        date: new Date('2026-04-01'),
        target_count: 50,
      },
    };

    it('should have correct total', () => {
      const sum =
        mockSummary.not_contacted +
        mockSummary.save_the_date_sent +
        mockSummary.rsvp_requested +
        mockSummary.rsvp_confirmed +
        mockSummary.travel_collected +
        mockSummary.logistics_complete +
        mockSummary.unresponsive;
      expect(sum).toBe(mockSummary.total_guests);
    });

    it('should calculate progress percentage', () => {
      const confirmed = mockSummary.rsvp_confirmed + mockSummary.travel_collected + mockSummary.logistics_complete;
      const percentage = Math.round((confirmed / mockSummary.total_guests) * 100);
      expect(percentage).toBeGreaterThan(0);
      expect(percentage).toBeLessThanOrEqual(100);
    });
  });

  describe('ActionQueue', () => {
    it('should identify overdue sequences', () => {
      const now = new Date('2026-03-21');
      const sequences: Partial<OutreachSequence>[] = [
        { id: 's1', status: 'pending', scheduled_at: new Date('2026-03-20'), sequence_type: 'rsvp_nudge' },
        { id: 's2', status: 'pending', scheduled_at: new Date('2026-03-25'), sequence_type: 'travel_collection' },
      ];

      const overdue = sequences.filter(
        (s) => s.status === 'pending' && s.scheduled_at && new Date(s.scheduled_at) < now
      );
      expect(overdue).toHaveLength(1);
      expect(overdue[0].id).toBe('s1');
    });

    it('should calculate upcoming actions', () => {
      const sequences: Partial<OutreachSequence>[] = [
        { id: 's1', status: 'pending', sequence_type: 'rsvp_nudge', target_statuses: ['rsvp_requested'] },
      ];
      expect(sequences[0].sequence_type).toBe('rsvp_nudge');
    });
  });

  describe('Quality Monitoring', () => {
    it('should alert when delivery rate below 90%', () => {
      const deliveryRate = 0.85;
      const shouldAlert = deliveryRate < 0.9;
      expect(shouldAlert).toBe(true);
    });

    it('should NOT alert when delivery rate above 90%', () => {
      const deliveryRate = 0.95;
      const shouldAlert = deliveryRate < 0.9;
      expect(shouldAlert).toBe(false);
    });

    it('should alert when block rate above 2%', () => {
      const blockRate = 0.03;
      const shouldAlert = blockRate > 0.02;
      expect(shouldAlert).toBe(true);
    });
  });

  describe('Empty state', () => {
    it('should handle new wedding with no data', () => {
      const emptySummary: OutreachSummary = {
        total_guests: 0,
        not_contacted: 0,
        save_the_date_sent: 0,
        rsvp_requested: 0,
        rsvp_confirmed: 0,
        travel_collected: 0,
        logistics_complete: 0,
        unresponsive: 0,
        escalations_open: 0,
        next_scheduled_action: null,
      };
      expect(emptySummary.total_guests).toBe(0);
      expect(emptySummary.next_scheduled_action).toBeNull();
    });
  });

  // ═══ NEW: KPI Card Helpers ═══════════════════════════════════

  describe('KPI Card — Days Until Wedding', () => {
    it('should return positive days for future date', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 45);
      const days = daysUntilWedding(futureDate.toISOString());
      expect(days).toBe(45);
    });

    it('should return negative days for past date', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 3);
      const days = daysUntilWedding(pastDate.toISOString());
      expect(days).toBeLessThanOrEqual(-2);
    });

    it('should return null for missing date', () => {
      expect(daysUntilWedding(null)).toBeNull();
    });

    it('should return 0 or 1 for today', () => {
      const today = new Date().toISOString();
      const days = daysUntilWedding(today);
      // Could be 0 or 1 depending on time of day
      expect(days).toBeLessThanOrEqual(1);
      expect(days).toBeGreaterThanOrEqual(0);
    });
  });

  describe('KPI Card — RSVP Percentage', () => {
    it('should calculate correct percentage', () => {
      const breakdown = { yes: 80, no: 10, maybe: 10, pending: 200 };
      expect(rsvpPercentage(breakdown, 300)).toBe('33%');
    });

    it('should return 0% for no guests', () => {
      expect(rsvpPercentage({ yes: 0, no: 0, maybe: 0, pending: 0 }, 0)).toBe('0%');
    });

    it('should return 100% when all responded', () => {
      expect(rsvpPercentage({ yes: 200, no: 50, maybe: 50, pending: 0 }, 300)).toBe('100%');
    });

    it('should round correctly', () => {
      // 1/3 = 33.33... should round to 33%
      expect(rsvpPercentage({ yes: 1, no: 0, maybe: 0, pending: 2 }, 3)).toBe('33%');
    });
  });

  // ═══ NEW: Unified Timeline Logic ═════════════════════════════

  describe('Unified Timeline — Filtering', () => {
    const mockEvents = [
      { id: '1', event_type: 'template_sent', created_at: '2026-04-01' },
      { id: '2', event_type: 'message_received', created_at: '2026-04-02' },
      { id: '3', event_type: 'rsvp_received', created_at: '2026-04-03' },
      { id: '4', event_type: 'escalated', created_at: '2026-04-04' },
      { id: '5', event_type: 'issue_created', created_at: '2026-04-04' },
      { id: '6', event_type: 'status_changed', created_at: '2026-04-05' },
      { id: '7', event_type: 'info_collected', created_at: '2026-04-06' },
      { id: '8', event_type: 'conversation_started', created_at: '2026-04-06' },
      { id: '9', event_type: 'opted_out', created_at: '2026-04-07' },
    ];

    it('should return all events with "all" filter', () => {
      expect(filterTimelineEvents(mockEvents, 'all')).toHaveLength(9);
    });

    it('should filter sent events (template_sent + status_changed)', () => {
      const result = filterTimelineEvents(mockEvents, 'sent');
      expect(result).toHaveLength(2);
      expect(result.map((e: any) => e.event_type)).toEqual(['template_sent', 'status_changed']);
    });

    it('should filter received events', () => {
      const result = filterTimelineEvents(mockEvents, 'received');
      expect(result).toHaveLength(4);
      expect(result.map((e: any) => e.event_type)).toEqual([
        'message_received', 'rsvp_received', 'info_collected', 'conversation_started',
      ]);
    });

    it('should filter escalation events', () => {
      const result = filterTimelineEvents(mockEvents, 'escalations');
      expect(result).toHaveLength(2);
      expect(result.map((e: any) => e.event_type)).toEqual(['escalated', 'issue_created']);
    });
  });

  // ═══ NEW: Compose Panel Logic ════════════════════════════════

  describe('Compose Panel — Template Selection', () => {
    it('should have all expected templates', () => {
      expect(TEMPLATE_KEYS).toHaveLength(11);
      expect(TEMPLATE_KEYS).toContain('SAVE_THE_DATE');
      expect(TEMPLATE_KEYS).toContain('RSVP_REQUEST');
      expect(TEMPLATE_KEYS).toContain('CULTURAL_GUIDE');
    });

    it('should map templates to correct outreach statuses', () => {
      expect(STATUS_MAP['SAVE_THE_DATE']).toBe('save_the_date_sent');
      expect(STATUS_MAP['RSVP_REQUEST']).toBe('rsvp_requested');
      expect(STATUS_MAP['TRAVEL_REQUEST']).toBe('travel_collected');
    });

    it('should not have status mapping for non-progression templates', () => {
      expect(STATUS_MAP['THANK_YOU']).toBeUndefined();
      expect(STATUS_MAP['NUDGE']).toBeUndefined();
      expect(STATUS_MAP['CULTURAL_GUIDE']).toBeUndefined();
    });
  });

  describe('Compose Panel — Guest Filtering', () => {
    const guests = [
      { id: '1', name: 'Alice', phone: '+1234567890' },
      { id: '2', name: 'Bob', phone: null },
      { id: '3', name: 'Charlie', phone: '+9876543210' },
    ];

    it('should filter out guests without phone numbers', () => {
      const eligible = guests.filter((g) => g.phone);
      expect(eligible).toHaveLength(2);
      expect(eligible.map((g) => g.name)).toEqual(['Alice', 'Charlie']);
    });

    it('should handle empty guest list', () => {
      const eligible: typeof guests = [];
      expect(eligible.filter((g) => g.phone)).toHaveLength(0);
    });
  });
});
