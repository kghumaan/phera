import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/supabase/client', () => {
  const mockFrom = vi.fn();
  return { supabase: { from: mockFrom, rpc: vi.fn() } };
});

vi.mock('@/lib/supabase/outreach-service', () => ({
  outreachService: {
    generateSequence: vi.fn().mockResolvedValue([]),
  },
}));

import {
  generateOutreachTimeline,
  getRawTimeline,
  getDueSequences,
  handlePartialDelivery,
  WeddingType,
} from '@/lib/outreach/scheduler';
import { OutreachSequence } from '@/lib/types/outreach';
import { BatchSendResult } from '@/lib/whatsapp/outreach-sender';

describe('generateOutreachTimeline', () => {
  it('should generate destination_international timeline', () => {
    const weddingDate = new Date();
    weddingDate.setFullYear(weddingDate.getFullYear() + 2);
    const timeline = generateOutreachTimeline(weddingDate, 'destination_international');
    expect(timeline.length).toBe(9);
    expect(timeline[0].sequence_type).toBe('save_the_date');
    expect(timeline[0].days_before_wedding).toBe(300);
  });

  it('should generate destination_domestic timeline', () => {
    const weddingDate = new Date();
    weddingDate.setFullYear(weddingDate.getFullYear() + 1);
    const timeline = generateOutreachTimeline(weddingDate, 'destination_domestic');
    expect(timeline.length).toBe(9);
    expect(timeline[0].days_before_wedding).toBe(180);
  });

  it('should generate local timeline', () => {
    const weddingDate = new Date();
    weddingDate.setFullYear(weddingDate.getFullYear() + 1);
    const timeline = generateOutreachTimeline(weddingDate, 'local');
    expect(timeline.length).toBe(7);
    expect(timeline[0].days_before_wedding).toBe(90);
  });

  it('should skip early sequences when wedding is close', () => {
    // Wedding in 30 days
    const weddingDate = new Date();
    weddingDate.setDate(weddingDate.getDate() + 30);

    const timeline = generateOutreachTimeline(weddingDate, 'local');

    // Should skip save_the_date (90 days) and rsvp_request (42 days)
    const types = timeline.map((t) => t.sequence_type);
    expect(types).not.toContain('save_the_date');
    expect(types).not.toContain('rsvp_request');

    // Should include day_before and schedule_reminder
    expect(types).toContain('day_before');
    expect(types).toContain('schedule_reminder');

    // Post-wedding sequences always included
    expect(types).toContain('thank_you');
  });

  it('should always include post-wedding sequences', () => {
    const weddingDate = new Date();
    weddingDate.setDate(weddingDate.getDate() + 5);

    const timeline = generateOutreachTimeline(weddingDate, 'local');
    const types = timeline.map((t) => t.sequence_type);
    expect(types).toContain('thank_you');
  });

  it('should throw for unknown wedding type', () => {
    expect(() =>
      generateOutreachTimeline(new Date(), 'unknown' as WeddingType)
    ).toThrow('Unknown wedding type');
  });
});

describe('getRawTimeline', () => {
  it('should return all 3 wedding type timelines', () => {
    expect(getRawTimeline('destination_international').length).toBe(9);
    expect(getRawTimeline('destination_domestic').length).toBe(9);
    expect(getRawTimeline('local').length).toBe(7);
  });

  it('correct day counts for destination_international', () => {
    const timeline = getRawTimeline('destination_international');
    const days = timeline.map((t) => t.days_before_wedding);
    expect(days).toEqual([300, 180, 159, 152, 120, 42, 14, 1, -7]);
  });

  it('correct day counts for destination_domestic', () => {
    const timeline = getRawTimeline('destination_domestic');
    const days = timeline.map((t) => t.days_before_wedding);
    expect(days).toEqual([180, 90, 69, 62, 49, 28, 14, 1, -7]);
  });

  it('correct day counts for local', () => {
    const timeline = getRawTimeline('local');
    const days = timeline.map((t) => t.days_before_wedding);
    expect(days).toEqual([90, 42, 21, 14, 7, 1, -7]);
  });
});

describe('getDueSequences', () => {
  const makeSequence = (overrides: Partial<OutreachSequence> = {}): OutreachSequence => ({
    id: 's1',
    wedding_id: 'test',
    sequence_type: 'save_the_date',
    template_name: 'save_the_date_v1',
    days_before_wedding: 300,
    status: 'pending',
    scheduled_at: new Date('2026-01-01'),
    target_statuses: ['not_contacted'],
    created_at: new Date(),
    ...overrides,
  });

  it('should return pending sequences with past scheduled_at', () => {
    const now = new Date('2026-03-21');
    const sequences = [
      makeSequence({ scheduled_at: new Date('2026-03-20') }),
      makeSequence({ id: 's2', scheduled_at: new Date('2026-03-25') }),
    ];

    const due = getDueSequences(sequences, now);
    expect(due).toHaveLength(1);
    expect(due[0].id).toBe('s1');
  });

  it('should include sequences with no scheduled_at', () => {
    const sequences = [makeSequence({ scheduled_at: undefined })];
    const due = getDueSequences(sequences, new Date());
    expect(due).toHaveLength(1);
  });

  it('should exclude non-pending sequences', () => {
    const sequences = [makeSequence({ status: 'sent' })];
    const due = getDueSequences(sequences, new Date('2026-12-31'));
    expect(due).toHaveLength(0);
  });
});

describe('handlePartialDelivery', () => {
  it('should categorize batch results correctly', () => {
    const batchResult: BatchSendResult = {
      delivered: [{ phoneNumber: '+91001', guestId: 'g1', messageId: 'm1', status: 'accepted' }],
      accepted: [{ phoneNumber: '+91002', guestId: 'g2', messageId: 'm2', status: 'accepted' }],
      retryTomorrow: [{ phoneNumber: '+91003', guestId: 'g3', status: 'frequency_capped', errorCode: 131049 }],
      optedOut: [{ phoneNumber: '+91004', guestId: 'g4', status: 'opted_out', errorCode: 131050 }],
      failed: [{ phoneNumber: '+91005', guestId: 'g5', status: 'failed', error: 'Internal error' }],
      total: 5,
      provider: 'meta',
    };

    const result = handlePartialDelivery(batchResult);

    expect(result.delivered).toHaveLength(2); // delivered + accepted merged
    expect(result.retryTomorrow).toHaveLength(1);
    expect(result.optedOut).toHaveLength(1);
    expect(result.failed).toHaveLength(1);
  });
});
