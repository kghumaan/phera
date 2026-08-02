import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock sendMetaTemplate (used by sendBatch for Meta provider)
const mockSendMetaTemplate = vi.fn();

// Mock dependencies
vi.mock('@/lib/whatsapp/provider', () => ({
  getProvider: vi.fn().mockReturnValue('meta'),
  getRateLimitMs: vi.fn().mockReturnValue(0), // no delay in tests
  sendOutreach: vi.fn(),
  sendMetaTemplate: (...args: any[]) => mockSendMetaTemplate(...args),
}));

vi.mock('@/lib/whatsapp/client', () => ({
  whatsappClient: {
    sendTemplate: vi.fn(),
    sendMessage: vi.fn(),
  },
  WhatsAppClient: vi.fn(),
}));

vi.mock('@/lib/whatsapp/opt-ins', () => ({
  checkOptInStatus: vi.fn().mockResolvedValue(true),
  handleOptOut: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/supabase/client', () => {
  const mockFrom = vi.fn();
  return {
    supabase: {
      from: mockFrom,
    },
  };
});

vi.mock('@/lib/supabase/outreach-service', () => ({
  outreachService: {
    logEvent: vi.fn().mockResolvedValue({ id: 'e1' }),
  },
}));

import { outreachSender, OutreachMessage } from '@/lib/whatsapp/outreach-sender';
import { whatsappClient } from '@/lib/whatsapp/client';
import { checkOptInStatus, handleOptOut } from '@/lib/whatsapp/opt-ins';
import { outreachService } from '@/lib/supabase/outreach-service';
import { supabase } from '@/lib/supabase/client';

const mockFrom = (supabase as any).from as ReturnType<typeof vi.fn>;

describe('OutreachSender', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSendMetaTemplate.mockReset();
  });

  describe('sendBatch', () => {
    const makeMessage = (overrides?: Partial<OutreachMessage>): OutreachMessage => ({
      phoneNumber: '+919876543210',
      guestId: 'g1',
      weddingId: 'test-wedding',
      templateKey: 'NUDGE',
      languageCode: 'en',
      params: { guest_name: 'Raj', couple_names: 'Priya & Rahul' },
      ...overrides,
    });

    it('should send messages and return accepted results', async () => {
      mockSendMetaTemplate.mockResolvedValue({ success: true, messageId: 'wamid123', provider: 'meta' });

      const messages = [makeMessage()];
      const result = await outreachSender.sendBatch(messages);

      expect(result.total).toBe(1);
      expect(result.accepted).toHaveLength(1);
      expect(result.accepted[0].messageId).toBe('wamid123');
    });

    it('should handle frequency cap (error 131049) by queueing for tomorrow', async () => {
      const error = new Error('WhatsApp API error: Frequency cap (Code: 131049)');
      (error as any).code = 131049;
      mockSendMetaTemplate.mockRejectedValue(error);

      const messages = [makeMessage()];
      const result = await outreachSender.sendBatch(messages);

      expect(result.retryTomorrow).toHaveLength(1);
      expect(result.retryTomorrow[0].errorCode).toBe(131049);
      // Should NOT have been retried
      expect(result.accepted).toHaveLength(0);
    });

    it('should handle opt-out (error 131050) and never retry', async () => {
      const error = new Error('WhatsApp API error: User opted out (Code: 131050)');
      (error as any).code = 131050;
      mockSendMetaTemplate.mockRejectedValue(error);

      const chain: any = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };
      mockFrom.mockReturnValue(chain);

      const messages = [makeMessage()];
      const result = await outreachSender.sendBatch(messages);

      expect(result.optedOut).toHaveLength(1);
      expect(result.optedOut[0].errorCode).toBe(131050);
      expect(handleOptOut).toHaveBeenCalled();
    });

    it('should skip already opted-out guests', async () => {
      (checkOptInStatus as any).mockResolvedValueOnce(false);

      const messages = [makeMessage()];
      const result = await outreachSender.sendBatch(messages);

      expect(result.optedOut).toHaveLength(1);
      expect(mockSendMetaTemplate).not.toHaveBeenCalled();
    });

    it('should log events for accepted messages', async () => {
      mockSendMetaTemplate.mockResolvedValue({ success: true, messageId: 'wamid456', provider: 'meta' });

      const messages = [makeMessage()];
      await outreachSender.sendBatch(messages);

      expect(outreachService.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event_type: 'template_sent',
          template_name: 'NUDGE',
          channel: 'whatsapp',
        })
      );
    });

    it('should handle generic failures', async () => {
      mockSendMetaTemplate.mockResolvedValue({ success: false, error: 'Internal error', provider: 'meta' });

      const messages = [makeMessage()];
      const result = await outreachSender.sendBatch(messages);

      expect(result.failed).toHaveLength(1);
    });
  });

  describe('isInServiceWindow', () => {
    it('should return true if guest replied within 24 hours', async () => {
      const chain: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [{ id: 'e1' }], error: null }),
      };
      mockFrom.mockReturnValue(chain);

      const result = await outreachSender.isInServiceWindow('+919876543210', 'test-wedding');
      expect(result).toBe(true);
    });

    it('should return false if no recent reply', async () => {
      const chain: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
      mockFrom.mockReturnValue(chain);

      const result = await outreachSender.isInServiceWindow('+919876543210', 'test-wedding');
      expect(result).toBe(false);
    });
  });

  describe('getQualityMetrics', () => {
    it('should calculate quality metrics correctly', async () => {
      const mockEvents = [
        { event_type: 'template_sent', template_name: 'save_the_date_v1', details: {} },
        { event_type: 'template_sent', template_name: 'save_the_date_v1', details: {} },
        { event_type: 'status_changed', template_name: 'save_the_date_v1', details: { delivery_status: 'delivered' } },
        { event_type: 'status_changed', template_name: 'save_the_date_v1', details: { delivery_status: 'read' } },
        { event_type: 'opted_out', template_name: null, details: {} },
      ];

      const chain: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: mockEvents, error: null }),
      };
      mockFrom.mockReturnValue(chain);

      const metrics = await outreachSender.getQualityMetrics('test-wedding');

      expect(metrics.sent).toBe(2);
      expect(metrics.delivered).toBe(1);
      expect(metrics.read).toBe(1);
      expect(metrics.blocked).toBe(1);
      expect(metrics.deliveryRate).toBe(0.5);
      expect(metrics.readRate).toBe(1);
      expect(metrics.perTemplate['save_the_date_v1'].sent).toBe(2);
    });
  });

  describe('handleDeliveryWebhook', () => {
    it('should log delivery status update', async () => {
      const chain: any = {
        select: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [{ id: 'e1', wedding_id: 'test-wedding', guest_id: 'g1' }],
          error: null,
        }),
      };
      mockFrom.mockReturnValue(chain);

      await outreachSender.handleDeliveryWebhook('wamid123', 'delivered');

      expect(outreachService.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event_type: 'status_changed',
          details: expect.objectContaining({ delivery_status: 'delivered' }),
        })
      );
    });
  });
});
