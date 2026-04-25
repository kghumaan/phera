import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Hoisted mocks ──────────────────────────────────────────────────

const { mockAutoGenerateForUser } = vi.hoisted(() => ({
  mockAutoGenerateForUser: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/concierge/generate-knowledge', () => ({
  autoGenerateForUser: mockAutoGenerateForUser,
}));

const mockStripeRetrieve = vi.fn();
const mockStripeConstructEvent = vi.fn();

vi.mock('stripe', () => ({
  default: class MockStripe {
    checkout = { sessions: { retrieve: mockStripeRetrieve } };
    webhooks = { constructEvent: mockStripeConstructEvent };
  },
}));

const mockUpsert = vi.fn().mockResolvedValue({ error: null });

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      upsert: mockUpsert,
    })),
  })),
}));

// ─── Import after mocks ──────────────────────────────────────────────

import { POST as activateProPOST } from '@/app/api/stripe/activate-pro/route';
import { POST as webhookPOST } from '@/app/api/stripe/webhook/route';

// ─── Helpers ─────────────────────────────────────────────────────────

function createJsonRequest(body: unknown) {
  return {
    json: () => Promise.resolve(body),
  } as unknown as Request;
}

function createWebhookRequest(body: string, signature: string | null) {
  return {
    text: () => Promise.resolve(body),
    headers: {
      get: (key: string) => key === 'stripe-signature' ? signature : null,
    },
  } as unknown as Request;
}

// ─── Tests ───────────────────────────────────────────────────────────

describe('Stripe auto-generation integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('activate-pro route', () => {
    it('should return 400 when sessionId is missing', async () => {
      const res = await activateProPOST(createJsonRequest({}));
      expect(res.status).toBe(400);
    });

    it('should return 400 when payment is not completed', async () => {
      mockStripeRetrieve.mockResolvedValue({ payment_status: 'unpaid' });

      const res = await activateProPOST(createJsonRequest({ sessionId: 'cs_123' }));
      expect(res.status).toBe(400);
    });

    it('should return 400 when userId is missing from metadata', async () => {
      mockStripeRetrieve.mockResolvedValue({
        payment_status: 'paid',
        metadata: {},
      });

      const res = await activateProPOST(createJsonRequest({ sessionId: 'cs_123' }));
      expect(res.status).toBe(400);
    });

    it('should fire autoGenerateForUser on successful upgrade', async () => {
      mockStripeRetrieve.mockResolvedValue({
        payment_status: 'paid',
        metadata: { userId: 'user-123', tier: 'pro' },
      });

      const res = await activateProPOST(createJsonRequest({ sessionId: 'cs_123' }));
      const data = await res.json();

      expect(data.success).toBe(true);
      expect(data.tier).toBe('pro');
      expect(mockAutoGenerateForUser).toHaveBeenCalledWith('user-123', expect.anything());
    });

    it('should default tier to base when not specified', async () => {
      // Route default: missing metadata.tier resolves to 'base'. The autoGenerate
      // path still fires because the user paid; the tier label just falls
      // through unchanged.
      mockStripeRetrieve.mockResolvedValue({
        payment_status: 'paid',
        metadata: { userId: 'user-123' },
      });

      const res = await activateProPOST(createJsonRequest({ sessionId: 'cs_123' }));
      const data = await res.json();

      expect(data.tier).toBe('base');
    });

    it('should not block response if autoGenerate fails', async () => {
      mockStripeRetrieve.mockResolvedValue({
        payment_status: 'paid',
        metadata: { userId: 'user-123', tier: 'pro' },
      });
      mockAutoGenerateForUser.mockRejectedValue(new Error('Generation failed'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const res = await activateProPOST(createJsonRequest({ sessionId: 'cs_123' }));
      consoleSpy.mockRestore();

      const data = await res.json();
      expect(data.success).toBe(true); // Still succeeds
    });
  });

  describe('webhook route', () => {
    it('should return 400 when stripe-signature is missing', async () => {
      const res = await webhookPOST(createWebhookRequest('{}', null));
      expect(res.status).toBe(400);
    });

    it('should return 400 when signature is invalid', async () => {
      mockStripeConstructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const res = await webhookPOST(createWebhookRequest('{}', 'bad-sig'));
      consoleSpy.mockRestore();

      expect(res.status).toBe(400);
    });

    it('should fire autoGenerateForUser on checkout.session.completed', async () => {
      mockStripeConstructEvent.mockReturnValue({
        type: 'checkout.session.completed',
        data: {
          object: {
            payment_status: 'paid',
            metadata: { userId: 'user-456', tier: 'pro' },
          },
        },
      });

      const res = await webhookPOST(createWebhookRequest('{}', 'valid-sig'));
      const data = await res.json();

      expect(data.received).toBe(true);
      expect(mockAutoGenerateForUser).toHaveBeenCalledWith('user-456', expect.anything());
    });

    it('should not fire autoGenerate for non-checkout events', async () => {
      mockStripeConstructEvent.mockReturnValue({
        type: 'payment_intent.succeeded',
        data: { object: {} },
      });

      await webhookPOST(createWebhookRequest('{}', 'valid-sig'));

      expect(mockAutoGenerateForUser).not.toHaveBeenCalled();
    });

    it('should not fire autoGenerate when payment is not paid', async () => {
      mockStripeConstructEvent.mockReturnValue({
        type: 'checkout.session.completed',
        data: {
          object: {
            payment_status: 'unpaid',
            metadata: { userId: 'user-456' },
          },
        },
      });

      await webhookPOST(createWebhookRequest('{}', 'valid-sig'));

      expect(mockAutoGenerateForUser).not.toHaveBeenCalled();
    });

    it('should not fire autoGenerate when userId is missing', async () => {
      mockStripeConstructEvent.mockReturnValue({
        type: 'checkout.session.completed',
        data: {
          object: {
            payment_status: 'paid',
            metadata: {},
          },
        },
      });

      await webhookPOST(createWebhookRequest('{}', 'valid-sig'));

      expect(mockAutoGenerateForUser).not.toHaveBeenCalled();
    });

    it('should always return received: true even when autoGenerate fails', async () => {
      mockStripeConstructEvent.mockReturnValue({
        type: 'checkout.session.completed',
        data: {
          object: {
            payment_status: 'paid',
            metadata: { userId: 'user-456', tier: 'pro' },
          },
        },
      });
      mockAutoGenerateForUser.mockRejectedValue(new Error('Failed'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const res = await webhookPOST(createWebhookRequest('{}', 'valid-sig'));
      consoleSpy.mockRestore();

      const data = await res.json();
      expect(data.received).toBe(true);
    });
  });
});
