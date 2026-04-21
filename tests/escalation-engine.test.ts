import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/client', () => {
  const mockFrom = vi.fn();
  return { supabase: { from: mockFrom } };
});

vi.mock('@/lib/supabase/outreach-service', () => ({
  outreachService: {
    createEscalation: vi.fn().mockResolvedValue({ id: 'esc1', reason: 'unresponsive_after_3_attempts', status: 'open' }),
  },
}));

import { EscalationEngine } from '@/lib/ai/escalation-engine';
import { supabase } from '@/lib/supabase/client';
import { outreachService } from '@/lib/supabase/outreach-service';
import { Escalation } from '@/lib/types/outreach';

const mockFrom = (supabase as any).from as ReturnType<typeof vi.fn>;

function createChain(data: any = null, error: any = null) {
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
  };
  chain.then = (resolve: any) => resolve({ data, error });
  return chain;
}

describe('EscalationEngine', () => {
  let engine: EscalationEngine;

  beforeEach(() => {
    vi.clearAllMocks();
    engine = new EscalationEngine();
  });

  describe('checkForEscalation', () => {
    it('should trigger escalation after 3 unresponsive attempts', async () => {
      let callCount = 0;
      mockFrom.mockImplementation((table: string) => {
        if (table === 'guests') {
          return createChain({
            outreach_attempt_count: 3,
            outreach_status: 'rsvp_requested',
            name: 'Raj',
          });
        }
        // outreach_escalations — no existing
        return createChain([]);
      });

      const reason = await engine.checkForEscalation('g1', 'test-wedding');
      expect(reason).toBe('unresponsive_after_3_attempts');
      expect(outreachService.createEscalation).toHaveBeenCalled();
    });

    it('should NOT escalate if fewer than 3 attempts', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'guests') {
          return createChain({ outreach_attempt_count: 2, outreach_status: 'rsvp_requested', name: 'Raj' });
        }
        return createChain([]);
      });

      const reason = await engine.checkForEscalation('g1', 'test-wedding');
      expect(reason).toBeNull();
    });

    it('should NOT escalate if guest already confirmed', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'guests') {
          return createChain({ outreach_attempt_count: 5, outreach_status: 'rsvp_confirmed', name: 'Raj' });
        }
        return createChain([]);
      });

      const reason = await engine.checkForEscalation('g1', 'test-wedding');
      expect(reason).toBeNull();
    });

    it('should NOT create duplicate escalations', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'guests') {
          return createChain({ outreach_attempt_count: 5, outreach_status: 'rsvp_requested', name: 'Raj' });
        }
        // Existing open escalation
        return createChain([{ id: 'existing' }]);
      });

      const reason = await engine.checkForEscalation('g1', 'test-wedding');
      expect(reason).toBeNull();
      expect(outreachService.createEscalation).not.toHaveBeenCalled();
    });
  });

  describe('routeEscalation', () => {
    it('should suggest phone call for unresponsive', () => {
      const escalation: Escalation = {
        id: 'esc1',
        wedding_id: 'test-wedding',
        guest_id: 'g1',
        reason: 'unresponsive_after_3_attempts',
        context: { guest_name: 'Raj', attempt_count: 3, phone: '+919876543210' },
        status: 'open',
        created_at: new Date(),
      };

      const route = engine.routeEscalation(escalation);
      expect(route.action).toBe('suggest_phone_call');
      expect(route.message).toContain('Raj');
      expect(route.phone).toBe('+919876543210');
    });

    it('should route to couple for unanswerable question', () => {
      const escalation: Escalation = {
        id: 'esc2',
        wedding_id: 'test-wedding',
        guest_id: 'g1',
        reason: 'unanswerable_question',
        context: { question: 'What time is the baraat?' },
        status: 'open',
        created_at: new Date(),
      };

      const route = engine.routeEscalation(escalation);
      expect(route.action).toBe('route_to_couple');
      expect(route.message).toContain('baraat');
    });

    it('should route urgently for human_requested', () => {
      const escalation: Escalation = {
        id: 'esc3',
        wedding_id: 'test-wedding',
        guest_id: 'g1',
        reason: 'human_requested',
        context: { guest_name: 'Raj' },
        status: 'open',
        created_at: new Date(),
      };

      const route = engine.routeEscalation(escalation);
      expect(route.action).toBe('route_to_couple_urgent');
    });

    it('should route special requests to couple', () => {
      const escalation: Escalation = {
        id: 'esc4',
        wedding_id: 'test-wedding',
        guest_id: 'g1',
        reason: 'special_request',
        context: { guest_name: 'Meena', request: 'Wheelchair access needed' },
        status: 'open',
        created_at: new Date(),
      };

      const route = engine.routeEscalation(escalation);
      expect(route.action).toBe('route_to_couple');
      expect(route.message).toContain('Wheelchair');
    });
  });

  describe('getEscalationSummary', () => {
    it('should calculate summary correctly', async () => {
      const mockEscalations = [
        { id: 'e1', status: 'open', reason: 'unresponsive_after_3_attempts', created_at: '2026-03-19' },
        { id: 'e2', status: 'open', reason: 'special_request', created_at: '2026-03-20' },
        { id: 'e3', status: 'resolved', reason: 'unanswerable_question', created_at: '2026-03-18' },
      ];

      const chain = createChain(mockEscalations);
      mockFrom.mockReturnValue(chain);

      const summary = await engine.getEscalationSummary('test-wedding');

      expect(summary.total).toBe(3);
      expect(summary.by_status.open).toBe(2);
      expect(summary.by_status.resolved).toBe(1);
      expect(summary.by_reason['unresponsive_after_3_attempts']).toBe(1);
      expect(summary.by_reason['special_request']).toBe(1);
      expect(summary.oldest_unresolved).toBeDefined();
      expect(summary.oldest_unresolved?.id).toBe('e1');
    });

    it('should return null oldest when all resolved', async () => {
      const chain = createChain([
        { id: 'e1', status: 'resolved', reason: 'test', created_at: '2026-03-19' },
      ]);
      mockFrom.mockReturnValue(chain);

      const summary = await engine.getEscalationSummary('test-wedding');
      expect(summary.oldest_unresolved).toBeNull();
    });
  });
});
