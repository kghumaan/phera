import { describe, it, expect, vi } from 'vitest';
import { maybeCompactConversation, COMPACT_THRESHOLD, COMPACT_KEEP } from '@/lib/agent/compact';
import type { AgentProvider } from '@/lib/agent/types';
import { createFakeSupabase } from './mocks/fake-supabase';

function makeMessages(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    role: i % 2 === 0 ? 'user' : 'assistant',
    content: [{ type: 'text', text: `message ${i}` }],
    created_at: new Date(1_700_000_000_000 + i * 60_000).toISOString(),
  }));
}

function summarizingProvider(): AgentProvider & { calls: number; lastPrompt: string } {
  const provider = {
    calls: 0,
    lastPrompt: '',
    async streamTurn({ messages }: { messages: Array<{ content: Array<{ type: string; text?: string }> }> }) {
      provider.calls += 1;
      provider.lastPrompt = (messages[0].content[0] as { text: string }).text;
      return {
        content: [{ type: 'text' as const, text: 'CONDENSED SUMMARY' }],
        stopReason: 'end_turn',
      };
    },
  };
  return provider as never;
}

describe('maybeCompactConversation', () => {
  it('no-ops below the threshold', async () => {
    const provider = summarizingProvider();
    const fake = createFakeSupabase({
      agent_conversations: { data: { summary: null, summary_through: null } },
      agent_messages: { data: makeMessages(COMPACT_THRESHOLD) },
    });
    await maybeCompactConversation(fake.client as never, 'conv-1', provider);
    expect(provider.calls).toBe(0);
    expect(fake.updates['agent_conversations']).toBeUndefined();
  });

  it('summarizes everything but the newest KEEP messages and moves the watermark', async () => {
    const provider = summarizingProvider();
    const messages = makeMessages(COMPACT_THRESHOLD + 10);
    const fake = createFakeSupabase({
      agent_conversations: { data: { summary: null, summary_through: null } },
      agent_messages: { data: messages },
    });
    await maybeCompactConversation(fake.client as never, 'conv-1', provider);

    expect(provider.calls).toBe(1);
    expect(provider.lastPrompt).toContain('message 0');
    const update = fake.updates['agent_conversations'][0] as Record<string, unknown>;
    expect(update.summary).toBe('CONDENSED SUMMARY');
    const lastSummarized = messages[messages.length - COMPACT_KEEP - 1];
    expect(update.summary_through).toBe(lastSummarized.created_at);
  });

  it('folds the prior summary into the new one', async () => {
    const provider = summarizingProvider();
    const fake = createFakeSupabase({
      agent_conversations: { data: { summary: 'OLD FACTS', summary_through: '2026-01-01' } },
      agent_messages: { data: makeMessages(COMPACT_THRESHOLD + 5) },
    });
    await maybeCompactConversation(fake.client as never, 'conv-1', provider);
    expect(provider.lastPrompt).toContain('Earlier summary:\nOLD FACTS');
  });

  it('survives provider failure without touching the conversation', async () => {
    const provider: AgentProvider = {
      async streamTurn() {
        throw new Error('model down');
      },
    };
    const fake = createFakeSupabase({
      agent_conversations: { data: { summary: null, summary_through: null } },
      agent_messages: { data: makeMessages(COMPACT_THRESHOLD + 5) },
    });
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await maybeCompactConversation(fake.client as never, 'conv-1', provider);
    spy.mockRestore();
    expect(fake.updates['agent_conversations']).toBeUndefined();
  });
});
