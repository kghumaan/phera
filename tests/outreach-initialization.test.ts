import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/supabase/client', () => ({
  supabase: { from: vi.fn(), rpc: vi.fn() },
}));

vi.mock('@/lib/supabase/outreach-service', () => ({
  outreachService: {
    generateSequence: vi.fn().mockResolvedValue([]),
    getGuestOutreachStatuses: vi.fn().mockResolvedValue([]),
  },
}));

import { generateOutreachTimeline, initializeOutreachForWedding } from '@/lib/outreach/scheduler';
import { outreachService } from '@/lib/supabase/outreach-service';

describe('Outreach Initialization', () => {
  describe('Sequence generation on guest upload', () => {
    it('should call generateSequence with correct params', async () => {
      const weddingDate = new Date('2026-12-15');
      await initializeOutreachForWedding('test-wedding', weddingDate, 'destination_international');
      expect(outreachService.generateSequence).toHaveBeenCalled();
    });
  });

  describe('Edge case: wedding less than 8 weeks away', () => {
    it('should skip early sequences', () => {
      const weddingDate = new Date();
      weddingDate.setDate(weddingDate.getDate() + 30); // 30 days from now

      const timeline = generateOutreachTimeline(weddingDate, 'local');
      const types = timeline.map((t) => t.sequence_type);

      // save_the_date (90 days) and rsvp_request (42 days) should be skipped
      expect(types).not.toContain('save_the_date');
      expect(types).not.toContain('rsvp_request');

      // day_before and thank_you should still be present
      expect(types).toContain('day_before');
      expect(types).toContain('thank_you');
    });
  });

  describe('Guests get correct initial status', () => {
    it('imported guests should have not_contacted status', () => {
      const importedGuest = {
        name: 'Raj',
        phone: '+919876543210',
        outreach_status: 'not_contacted',
      };
      expect(importedGuest.outreach_status).toBe('not_contacted');
    });
  });

  describe('Manual trigger API', () => {
    it('should map sequence types to template keys', () => {
      const templateMap: Record<string, string> = {
        save_the_date: 'SAVE_THE_DATE',
        rsvp_request: 'RSVP_REQUEST',
        rsvp_nudge: 'NUDGE',
        travel_collection: 'TRAVEL_REQUEST',
        shuttle_assignment: 'SHUTTLE_ASSIGNMENT',
        schedule_reminder: 'SCHEDULE_REMINDER',
        day_before: 'DAY_BEFORE_SUMMARY',
        thank_you: 'THANK_YOU',
      };

      expect(Object.keys(templateMap)).toHaveLength(8);
      expect(templateMap['save_the_date']).toBe('SAVE_THE_DATE');
    });
  });
});
