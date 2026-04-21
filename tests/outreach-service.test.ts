import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock must be hoisted — no references to outer variables in factory
vi.mock('@/lib/supabase/client', () => {
  const mockFrom = vi.fn();
  return {
    supabase: {
      from: mockFrom,
      rpc: vi.fn().mockResolvedValue({ error: null }),
    },
  };
});

// Import after mock
import { supabase } from '@/lib/supabase/client';
import { outreachService } from '@/lib/supabase/outreach-service';
import { OutreachStatus, SEQUENCE_TEMPLATE_MAP } from '@/lib/types/outreach';

const mockFrom = (supabase as any).from as ReturnType<typeof vi.fn>;

function createChain(finalData: any = null, finalError: any = null) {
  const chain: any = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    eq: vi.fn(),
    in: vi.fn(),
    lte: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
    single: vi.fn().mockResolvedValue({ data: finalData, error: finalError }),
  };
  // Every method returns the chain for chaining
  for (const key of Object.keys(chain)) {
    if (key !== 'single') {
      chain[key].mockReturnValue(chain);
    }
  }
  // Make chain thenable for terminal queries
  chain.then = (resolve: any) => resolve({ data: finalData, error: finalError, count: finalData === null ? 0 : undefined });
  return chain;
}

describe('outreachService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateSequence', () => {
    it('should generate sequence records with correct dates', async () => {
      const weddingDate = new Date('2026-12-15');
      const weddingId = 'priya-rahul-2026';

      const chain = createChain([{ id: '1', sequence_type: 'save_the_date' }]);
      mockFrom.mockReturnValue(chain);

      await outreachService.generateSequence(weddingId, weddingDate);

      expect(mockFrom).toHaveBeenCalledWith('outreach_sequences');
      expect(chain.insert).toHaveBeenCalled();

      const insertArg = chain.insert.mock.calls[0][0];
      expect(insertArg).toHaveLength(9);
      expect(insertArg[0].sequence_type).toBe('save_the_date');
      expect(insertArg[0].wedding_id).toBe(weddingId);
      expect(insertArg[0].status).toBe('pending');
      expect(insertArg[0].template_name).toBe(SEQUENCE_TEMPLATE_MAP['save_the_date']);
    });

    it('should calculate scheduled_at dates correctly', async () => {
      const weddingDate = new Date('2026-12-15');
      const chain = createChain([]);
      mockFrom.mockReturnValue(chain);

      await outreachService.generateSequence('test-wedding', weddingDate);

      const insertArg = chain.insert.mock.calls[0][0];

      // save_the_date is 300 days before
      const saveTheDate = new Date(insertArg[0].scheduled_at);
      const expectedDate = new Date('2026-12-15');
      expectedDate.setDate(expectedDate.getDate() - 300);
      expect(saveTheDate.toDateString()).toBe(expectedDate.toDateString());

      // thank_you is -7 days before (7 days AFTER)
      const thankYou = insertArg[insertArg.length - 1];
      expect(thankYou.sequence_type).toBe('thank_you');
      const thankYouDate = new Date(thankYou.scheduled_at);
      const expectedThankYou = new Date('2026-12-15');
      expectedThankYou.setDate(expectedThankYou.getDate() + 7);
      expect(thankYouDate.toDateString()).toBe(expectedThankYou.toDateString());
    });
  });

  describe('getGuestOutreachStatuses', () => {
    it('should return guests with outreach columns', async () => {
      const mockGuests = [
        {
          id: 'g1',
          name: 'Test Guest',
          phone: '+919876543210',
          email: 'test@example.com',
          outreach_status: 'not_contacted',
          outreach_last_contacted_at: null,
          outreach_attempt_count: 0,
          whatsapp_opted_out: false,
          contact_type: 'guest',
          is_family_liaison: false,
        },
      ];

      const chain = createChain(mockGuests);
      mockFrom.mockReturnValue(chain);

      const result = await outreachService.getGuestOutreachStatuses('test-wedding');

      expect(mockFrom).toHaveBeenCalledWith('guests');
      expect(result).toEqual(mockGuests);
    });
  });

  describe('updateGuestStatus', () => {
    it('should update guest status and log event', async () => {
      const chain = createChain({ wedding_id: 'test-wedding' });
      mockFrom.mockReturnValue(chain);
      (supabase as any).rpc.mockResolvedValue({ error: null });

      await outreachService.updateGuestStatus('g1', 'rsvp_confirmed', { source: 'whatsapp' });

      expect(mockFrom).toHaveBeenCalledWith('guests');
    });

    it('should accept all valid outreach statuses', async () => {
      const validStatuses: OutreachStatus[] = [
        'not_contacted', 'save_the_date_sent', 'rsvp_requested',
        'rsvp_confirmed', 'travel_collected', 'logistics_complete', 'unresponsive',
      ];

      for (const status of validStatuses) {
        const chain = createChain({ wedding_id: 'test-wedding' });
        mockFrom.mockReturnValue(chain);
        (supabase as any).rpc.mockResolvedValue({ error: null });

        await outreachService.updateGuestStatus('g1', status);
      }
      expect(mockFrom).toHaveBeenCalledWith('guests');
    });
  });

  describe('logEvent', () => {
    it('should insert an outreach event', async () => {
      const mockEvent = {
        id: 'e1',
        wedding_id: 'test-wedding',
        guest_id: 'g1',
        event_type: 'template_sent',
        template_name: 'save_the_date_v1',
        channel: 'whatsapp',
        details: { message_id: 'wamid123' },
        created_at: new Date(),
      };

      const chain = createChain(mockEvent);
      mockFrom.mockReturnValue(chain);

      await outreachService.logEvent({
        wedding_id: 'test-wedding',
        guest_id: 'g1',
        event_type: 'template_sent',
        template_name: 'save_the_date_v1',
        channel: 'whatsapp',
        details: { message_id: 'wamid123' },
      });

      expect(mockFrom).toHaveBeenCalledWith('outreach_events');
      expect(chain.insert).toHaveBeenCalled();
    });
  });

  describe('getGuestEvents', () => {
    it('should return events ordered by created_at desc', async () => {
      const mockEvents = [
        { id: 'e2', event_type: 'message_received', created_at: '2026-03-20' },
        { id: 'e1', event_type: 'template_sent', created_at: '2026-03-19' },
      ];

      const chain = createChain(mockEvents);
      mockFrom.mockReturnValue(chain);

      const result = await outreachService.getGuestEvents('g1');

      expect(mockFrom).toHaveBeenCalledWith('outreach_events');
      expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result).toEqual(mockEvents);
    });
  });

  describe('getWeddingEvents', () => {
    it('should return events with limit', async () => {
      const chain = createChain([]);
      mockFrom.mockReturnValue(chain);

      await outreachService.getWeddingEvents('test-wedding', 10);

      expect(chain.limit).toHaveBeenCalledWith(10);
    });
  });

  describe('getPendingSequences', () => {
    it('should return pending sequences that are due', async () => {
      const chain = createChain([{ id: 's1', status: 'pending' }]);
      mockFrom.mockReturnValue(chain);

      await outreachService.getPendingSequences('test-wedding');

      expect(mockFrom).toHaveBeenCalledWith('outreach_sequences');
      expect(chain.eq).toHaveBeenCalledWith('status', 'pending');
    });

    it('should work without weddingId filter', async () => {
      const chain = createChain([]);
      mockFrom.mockReturnValue(chain);

      await outreachService.getPendingSequences();

      expect(mockFrom).toHaveBeenCalledWith('outreach_sequences');
    });
  });

  describe('markSequenceSent', () => {
    it('should update sequence status to sent', async () => {
      const chain = createChain(null);
      mockFrom.mockReturnValue(chain);

      await outreachService.markSequenceSent('s1');

      expect(mockFrom).toHaveBeenCalledWith('outreach_sequences');
      expect(chain.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'sent' })
      );
    });
  });

  describe('createEscalation', () => {
    it('should insert an escalation', async () => {
      const chain = createChain({
        id: 'esc1',
        wedding_id: 'test-wedding',
        guest_id: 'g1',
        reason: 'unresponsive_after_3_attempts',
        status: 'open',
      });
      mockFrom.mockReturnValue(chain);

      await outreachService.createEscalation({
        wedding_id: 'test-wedding',
        guest_id: 'g1',
        reason: 'unresponsive_after_3_attempts',
        context: { attempt_count: 3 },
        status: 'open',
      });

      expect(mockFrom).toHaveBeenCalledWith('outreach_escalations');
      expect(chain.insert).toHaveBeenCalled();
    });
  });

  describe('resolveEscalation', () => {
    it('should resolve an escalation', async () => {
      const chain = createChain(null);
      mockFrom.mockReturnValue(chain);

      await outreachService.resolveEscalation('esc1', 'admin-user-id');

      expect(mockFrom).toHaveBeenCalledWith('outreach_escalations');
      expect(chain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'resolved',
          resolved_by: 'admin-user-id',
        })
      );
    });
  });

  describe('getOutreachSummary', () => {
    it('should calculate summary stats correctly', async () => {
      const mockGuests = [
        { outreach_status: 'not_contacted' },
        { outreach_status: 'not_contacted' },
        { outreach_status: 'rsvp_confirmed' },
        { outreach_status: 'save_the_date_sent' },
        { outreach_status: 'unresponsive' },
      ];

      let callIndex = 0;
      mockFrom.mockImplementation((table: string) => {
        if (table === 'guests' && callIndex === 0) {
          callIndex++;
          return createChain(mockGuests);
        }
        if (table === 'outreach_escalations') {
          const c = createChain(null);
          c.then = (resolve: any) => resolve({ count: 2, error: null });
          return c;
        }
        if (table === 'outreach_sequences') {
          return createChain(null, { code: 'PGRST116', message: 'not found' });
        }
        // Fallback for target count
        const c = createChain(null);
        c.then = (resolve: any) => resolve({ count: 0, error: null });
        return c;
      });

      const result = await outreachService.getOutreachSummary('test-wedding');

      expect(result.total_guests).toBe(5);
      expect(result.not_contacted).toBe(2);
      expect(result.rsvp_confirmed).toBe(1);
      expect(result.save_the_date_sent).toBe(1);
      expect(result.unresponsive).toBe(1);
      expect(result.rsvp_requested).toBe(0);
      expect(result.travel_collected).toBe(0);
      expect(result.logistics_complete).toBe(0);
    });
  });
});
