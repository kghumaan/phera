import { describe, it, expect, beforeEach } from 'vitest';
import { dispatchTool, clearRegistryForTests, registerTools } from '@/lib/agent/tools/registry';
import { shagunTools } from '@/lib/agent/tools/shagun';
import type { AgentToolContext } from '@/lib/agent/types';
import { createFakeSupabase, type FakeSupabase } from '../mocks/fake-supabase';

function ctx(fake: FakeSupabase): AgentToolContext {
  return {
    supabase: fake.client as never,
    weddingSlug: 'agent-lab-x',
    weddingUuid: 'uuid-1',
    userId: 'u1',
    conversationId: 'conv-1',
    isPro: false, // the ledger is free — never gated
  };
}

describe('shagun ledger tools', () => {
  beforeEach(() => {
    clearRegistryForTests();
    registerTools(shagunTools);
  });

  it('record_shagun merges the gift into the guest, preserving other logistics', async () => {
    const fake = createFakeSupabase({
      guests: { data: { id: 'g1', name: 'Raj Mehra', logistics_data: { party_size: 2 } } },
    });
    const r = await dispatchTool('record_shagun', { guest_id: 'g1', amount: 101, currency: 'USD', gift_type: 'cash' }, ctx(fake));
    expect(r.ok).toBe(true);
    const update = fake.updates['guests'][0] as {
      logistics_data: { shagun: { amount: number; currency: string; gift_type: string }; party_size?: number };
    };
    expect(update.logistics_data.shagun).toEqual({ amount: 101, currency: 'USD', gift_type: 'cash' });
    expect(update.logistics_data.party_size).toBe(2); // existing field untouched
  });

  it('record_shagun rejects a negative amount', async () => {
    const fake = createFakeSupabase({ guests: { data: { id: 'g1', name: 'Raj', logistics_data: {} } } });
    const r = await dispatchTool('record_shagun', { guest_id: 'g1', amount: -5 }, ctx(fake));
    expect(r.ok).toBe(false);
  });

  it('get_shagun_ledger totals by currency and skips guests with no gift', async () => {
    const fake = createFakeSupabase({
      guests: {
        data: [
          { id: 'g1', name: 'Raj', logistics_data: { shagun: { amount: 101, currency: 'USD', gift_type: 'cash' } } },
          { id: 'g2', name: 'Sunita', logistics_data: { shagun: { amount: 51, currency: 'USD' } } },
          { id: 'g3', name: 'NoGift', logistics_data: {} },
        ],
      },
    });
    const r = await dispatchTool('get_shagun_ledger', {}, ctx(fake));
    expect(r.ok).toBe(true);
    const out = JSON.parse(r.content) as { count: number; totals: Record<string, number>; entries: unknown[] };
    expect(out.count).toBe(2);
    expect(out.totals.USD).toBe(152);
  });
});
