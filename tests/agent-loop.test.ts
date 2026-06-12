import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/supabase/client', () => ({
  supabase: { from: vi.fn() },
  publicSupabase: { from: vi.fn() },
}));

import { runAgentTurn } from '@/lib/agent/loop';
import type { AgentProvider, AgentStreamEvent, ProviderTurnResult } from '@/lib/agent/types';
import { createFakeSupabase } from './mocks/fake-supabase';

const SNAPSHOT_TABLES = {
  weddings: {
    data: {
      couple_name: 'Priya & Rahul',
      partner1_name: 'Priya',
      partner2_name: 'Rahul',
      wedding_date: '2027-01-15',
      wedding_date_end: null,
      venue_name: 'The Leela Palace',
      venue_location: 'Udaipur, India',
      rsvp_deadline: null,
      status: 'draft',
    },
  },
  guests: { count: 10 },
  rsvps: { data: [] },
  wedding_rooms: { count: 0 },
  vendors: { count: 0 },
  wedding_events: { count: 2 },
  wedding_schedule: { count: 1 },
  wedding_faqs: { count: 0 },
  wedding_tasks: { count: 0 },
  agent_messages: { data: [] },
  agent_conversations: { data: [] },
  agent_actions: { data: [] },
};

function scriptedProvider(turns: ProviderTurnResult[]): AgentProvider & { calls: number } {
  const provider = {
    calls: 0,
    async streamTurn({ onText }: { onText?: (t: string) => void }) {
      const turn = turns[provider.calls];
      provider.calls += 1;
      for (const block of turn.content) {
        if (block.type === 'text' && onText) onText(block.text);
      }
      return turn;
    },
  };
  return provider as AgentProvider & { calls: number };
}

async function run(provider: AgentProvider, fakeTables = SNAPSHOT_TABLES) {
  const fake = createFakeSupabase(fakeTables);
  const events: AgentStreamEvent[] = [];
  await runAgentTurn({
    supabase: fake.client as never,
    weddingSlug: 'priya-rahul-2027',
    weddingUuid: 'uuid-1',
    userId: 'user-1',
    conversationId: 'conv-1',
    userMessage: 'How is planning going?',
    provider,
    onEvent: (e) => events.push(e),
  });
  return { fake, events };
}

describe('runAgentTurn', () => {
  it('streams a plain text reply and persists both messages', async () => {
    const provider = scriptedProvider([
      { content: [{ type: 'text', text: 'Looking great!' }], stopReason: 'end_turn' },
    ]);
    const { fake, events } = await run(provider);

    expect(provider.calls).toBe(1);
    expect(events.filter((e) => e.type === 'text_delta').map((e) => (e as { text: string }).text)).toEqual([
      'Looking great!',
    ]);
    expect(events.at(-1)?.type).toBe('done');

    const persisted = fake.inserts['agent_messages'] as Array<{ role: string }>;
    expect(persisted.map((m) => m.role)).toEqual(['user', 'assistant']);
    expect(fake.updates['agent_conversations']).toHaveLength(1);
  });

  it('runs a tool round-trip and feeds the result back to the model', async () => {
    const provider = scriptedProvider([
      {
        content: [
          { type: 'text', text: 'Let me check.' },
          { type: 'tool_use', id: 'tu-1', name: 'not_a_real_tool', input: {} },
        ],
        stopReason: 'tool_use',
      },
      { content: [{ type: 'text', text: 'Done.' }], stopReason: 'end_turn' },
    ]);
    const { fake, events } = await run(provider);

    expect(provider.calls).toBe(2);
    const toolEvents = events.filter((e) => e.type === 'tool_start' || e.type === 'tool_done');
    expect(toolEvents).toEqual([
      { type: 'tool_start', name: 'not_a_real_tool', label: 'not_a_real_tool' },
      { type: 'tool_done', name: 'not_a_real_tool', ok: false },
    ]);

    // user msg, assistant tool_use msg, tool_result msg, final assistant msg
    const persisted = fake.inserts['agent_messages'] as Array<{ role: string; content: unknown[] }>;
    expect(persisted.map((m) => m.role)).toEqual(['user', 'assistant', 'user', 'assistant']);
    const toolResultBlock = (persisted[2].content as Array<{ type: string; is_error?: boolean }>)[0];
    expect(toolResultBlock.type).toBe('tool_result');
    expect(toolResultBlock.is_error).toBe(true);
    expect(events.at(-1)?.type).toBe('done');
  });

  it('stops after the max number of tool rounds', async () => {
    const toolTurn: ProviderTurnResult = {
      content: [{ type: 'tool_use', id: 'tu-x', name: 'not_a_real_tool', input: {} }],
      stopReason: 'tool_use',
    };
    const provider = scriptedProvider(Array(20).fill(toolTurn));
    const { events } = await run(provider);
    expect((provider as { calls: number }).calls).toBe(8);
    expect(events.at(-1)?.type).toBe('done');
  });

  it('surfaces refusals as an error event without persisting an assistant turn', async () => {
    const provider = scriptedProvider([{ content: [], stopReason: 'refusal' }]);
    const { fake, events } = await run(provider);
    expect(events.some((e) => e.type === 'error')).toBe(true);
    const persisted = fake.inserts['agent_messages'] as Array<{ role: string }>;
    expect(persisted.map((m) => m.role)).toEqual(['user']);
  });
});
