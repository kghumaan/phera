import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHmac } from 'crypto';

vi.mock('@/lib/supabase/client', () => {
  const mockFrom = vi.fn();
  return { supabase: { from: mockFrom } };
});

vi.mock('@/lib/ai/guest-coordinator', () => {
  return {
    GuestCoordinator: class MockGuestCoordinator {
      handleIncomingMessage = vi.fn().mockResolvedValue({
        message: 'Test response',
        actions: [],
      });
    },
  };
});

vi.mock('@/lib/supabase/outreach-service', () => ({
  outreachService: {
    logEvent: vi.fn().mockResolvedValue({ id: 'e1' }),
    updateGuestStatus: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('@/lib/whatsapp/outreach-sender', () => ({
  outreachSender: {
    handleDeliveryWebhook: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('@/lib/whatsapp/opt-ins', () => ({
  handleOptOut: vi.fn().mockResolvedValue(undefined),
}));

import { WebhookHandler } from '@/lib/whatsapp/webhook-handler';
import { supabase } from '@/lib/supabase/client';
import { outreachSender } from '@/lib/whatsapp/outreach-sender';
import { handleOptOut } from '@/lib/whatsapp/opt-ins';

const mockFrom = (supabase as any).from as ReturnType<typeof vi.fn>;

describe('WebhookHandler', () => {
  let handler: WebhookHandler;

  beforeEach(() => {
    vi.clearAllMocks();
    handler = new WebhookHandler();
  });

  describe('verifySignature', () => {
    it('should verify valid HMAC signature', () => {
      const secret = 'test_secret';
      process.env.WHATSAPP_WEBHOOK_SECRET = secret;

      const body = '{"test": true}';
      const hash = createHmac('sha256', secret).update(body).digest('hex');
      const signature = `sha256=${hash}`;

      expect(handler.verifySignature(body, signature)).toBe(true);
    });

    it('should reject invalid signature', () => {
      process.env.WHATSAPP_WEBHOOK_SECRET = 'test_secret';
      expect(handler.verifySignature('{"test": true}', 'sha256=invalid')).toBe(false);
    });

    it('should reject when no secret configured', () => {
      delete process.env.WHATSAPP_WEBHOOK_SECRET;
      expect(handler.verifySignature('body', 'sha256=test')).toBe(false);
    });
  });

  describe('routeMessage', () => {
    const makeMessage = (text: string) => ({
      from: '+919876543210',
      id: 'wamid123',
      timestamp: '1234567890',
      type: 'text' as const,
      text: { body: text },
    });

    it('should route admin messages to admin handler', async () => {
      const chain: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'g1', name: 'Admin', contact_type: 'admin', is_family_liaison: false, wedding_id: 'test' },
          error: null,
        }),
      };
      mockFrom.mockReturnValue(chain);

      const result = await handler.routeMessage('+919876543210', makeMessage('Status?'), 'test-wedding');
      expect(result.handler).toBe('admin');
    });

    it('should route guest messages to coordinator', async () => {
      const chain: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'g1', name: 'Raj', contact_type: 'guest', is_family_liaison: false, wedding_id: 'test' },
          error: null,
        }),
      };
      mockFrom.mockReturnValue(chain);

      const result = await handler.routeMessage('+919876543210', makeMessage('Yes, attending!'), 'test-wedding');
      expect(result.handler).toBe('guest');
    });

    it('should route liaison messages appropriately', async () => {
      const chain: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'g1', name: 'Liaison', contact_type: 'guest', is_family_liaison: true, wedding_id: 'test' },
          error: null,
        }),
      };
      mockFrom.mockReturnValue(chain);

      const result = await handler.routeMessage('+919876543210', makeMessage('All 5 of us are coming'), 'test-wedding');
      expect(result.handler).toBe('liaison');
    });

    it('should handle unknown sender', async () => {
      const chain: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
      };
      mockFrom.mockReturnValue(chain);

      const result = await handler.routeMessage('+919876543210', makeMessage('Hello'), 'test-wedding');
      expect(result.handler).toBe('unknown');
      expect(result.response).toContain('couldn\'t find');
    });

    it('should handle interactive button reply', async () => {
      const chain: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'g1', name: 'Raj', contact_type: 'guest', is_family_liaison: false, wedding_id: 'test' },
          error: null,
        }),
      };
      mockFrom.mockReturnValue(chain);

      const interactiveMsg = {
        from: '+919876543210',
        id: 'wamid123',
        timestamp: '1234567890',
        type: 'interactive' as const,
        interactive: {
          type: 'button_reply' as const,
          button_reply: { id: 'btn_yes', title: 'Yes, attending! ✅' },
        },
      };

      const result = await handler.routeMessage('+919876543210', interactiveMsg, 'test-wedding');
      expect(result.handler).toBe('guest');
    });
  });

  describe('handleStatusUpdate', () => {
    it('should process delivered status', async () => {
      await handler.handleStatusUpdate({
        id: 'wamid123',
        status: 'delivered',
        timestamp: '1234567890',
        recipient_id: '+919876543210',
      });

      expect(outreachSender.handleDeliveryWebhook).toHaveBeenCalledWith('wamid123', 'delivered', undefined);
    });

    it('should handle frequency cap error (131049)', async () => {
      await handler.handleStatusUpdate({
        id: 'wamid123',
        status: 'failed',
        timestamp: '1234567890',
        recipient_id: '+919876543210',
        errors: [{ code: 131049, title: 'Frequency cap' }],
      });

      expect(outreachSender.handleDeliveryWebhook).toHaveBeenCalledWith('wamid123', 'failed', 131049);
    });

    it('should handle opt-out error (131050)', async () => {
      await handler.handleStatusUpdate({
        id: 'wamid123',
        status: 'failed',
        timestamp: '1234567890',
        recipient_id: '+919876543210',
        errors: [{ code: 131050, title: 'User opted out' }],
      });

      expect(handleOptOut).toHaveBeenCalled();
    });
  });
});
