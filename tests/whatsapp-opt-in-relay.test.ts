import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

/**
 * /api/whatsapp/opt-in is PUBLIC — guests call it mid-RSVP, unauthenticated.
 * It also sends a WhatsApp template. That combination is only safe if the
 * number it sends to comes from the guest's row rather than the request body;
 * otherwise the route is an open relay for Phera's Meta number.
 */

const mockSendTemplate = vi.fn();
const mockCreateOptIn = vi.fn();
const guestRows: Record<string, unknown>[] = [];

vi.mock('@/lib/whatsapp/client', () => ({
  whatsappClient: { sendTemplate: (...args: unknown[]) => mockSendTemplate(...args) },
}));
vi.mock('@/lib/whatsapp/opt-ins', () => ({
  createOptIn: (...args: unknown[]) => mockCreateOptIn(...args),
  handleOptOut: vi.fn().mockResolvedValue(true),
}));
vi.mock('@/lib/whatsapp/templates', () => ({
  formatParametersForAPI: () => [],
}));
vi.mock('@/lib/utils/rate-limiter', () => ({ checkRateLimit: () => null }));
vi.mock('@/lib/ops/supabase-admin', () => ({
  getOpsSupabaseAdmin: () => ({
    from: (table: string) => {
      const filters: [string, unknown][] = [];
      const builder: Record<string, unknown> = {};
      builder.select = () => builder;
      builder.eq = (col: string, val: unknown) => {
        filters.push([col, val]);
        return builder;
      };
      const match = () => {
        if (table === 'guests') {
          return guestRows.filter((r) => filters.every(([c, v]) => r[c] === v))[0] ?? null;
        }
        if (table === 'weddings') return { couple_name: 'Priya & Rahul', wedding_date_display: 'Mar 2027' };
        return { language: 'en' };
      };
      builder.maybeSingle = () => Promise.resolve({ data: match(), error: null });
      builder.single = () => Promise.resolve({ data: match(), error: null });
      return builder;
    },
  }),
}));

import { POST } from '@/app/api/whatsapp/opt-in/route';

function optInRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/whatsapp/opt-in', {
    method: 'POST',
    body: JSON.stringify({ action: 'opt-in', method: 'rsvp_form', ...body }),
    headers: { 'Content-Type': 'application/json' },
  });
}

const GUEST = { id: 'g1', wedding_id: 'priya-rahul-2027', name: 'Asha Rao', phone: '+91 98765 43210' };

describe('POST /api/whatsapp/opt-in — send-relay guards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateOptIn.mockResolvedValue({ id: 'optin-1' });
    mockSendTemplate.mockResolvedValue({ messages: [{ id: 'wamid.1' }] });
    guestRows.length = 0;
    guestRows.push({ ...GUEST });
  });

  it('sends the confirmation to the number on the guest row, not the body', async () => {
    const res = await POST(
      optInRequest({ guestId: 'g1', weddingId: 'priya-rahul-2027', phoneNumber: '+919876543210' })
    );
    expect(res.status).toBe(200);
    // Same number, different formatting — accepted, and the STORED value is what gets used.
    expect(mockSendTemplate).toHaveBeenCalledWith('+91 98765 43210', 'rsvp_confirmation', 'en', []);
    expect(mockCreateOptIn).toHaveBeenCalledWith('g1', 'priya-rahul-2027', '+91 98765 43210', 'rsvp_form');
  });

  it('refuses a phone number that is not the one on file — no send', async () => {
    const res = await POST(
      optInRequest({ guestId: 'g1', weddingId: 'priya-rahul-2027', phoneNumber: '+1 555 000 9999' })
    );
    expect(res.status).toBe(400);
    expect(mockSendTemplate).not.toHaveBeenCalled();
    expect(mockCreateOptIn).not.toHaveBeenCalled();
  });

  it("refuses a guest that belongs to a different wedding — no send", async () => {
    const res = await POST(
      optInRequest({ guestId: 'g1', weddingId: 'someone-else-2027', phoneNumber: '+91 98765 43210' })
    );
    expect(res.status).toBe(404);
    expect(mockSendTemplate).not.toHaveBeenCalled();
    expect(mockCreateOptIn).not.toHaveBeenCalled();
  });

  it('does not send the template for non-RSVP opt-in methods', async () => {
    const res = await POST(
      optInRequest({ guestId: 'g1', weddingId: 'priya-rahul-2027', phoneNumber: '+91 98765 43210', method: 'manual' })
    );
    expect(res.status).toBe(200);
    expect(mockSendTemplate).not.toHaveBeenCalled();
  });
});
