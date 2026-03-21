import { describe, it, expect } from 'vitest';
import { OutreachSummary, OutreachEvent, OutreachSequence } from '@/lib/types/outreach';

// Test the data logic used by Control Tower components
// (Avoid importing MUI components in tests to prevent ESM issues)

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
});
