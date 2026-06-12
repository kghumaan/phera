import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/supabase/client', () => ({
  supabase: { from: vi.fn() },
  publicSupabase: { from: vi.fn() },
}));

import { runAgentTurn, TurnInProgressError, sanitizeHistoryWindow } from '@/lib/agent/loop';
import type { AgentChatMessage, AgentProvider, AgentStreamEvent, ProviderTurnResult } from '@/lib/agent/types';
import { createFakeSupabase, type TableResult } from './mocks/fake-supabase';

const SNAPSHOT_TABLES: Record<string, TableResult> = {
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
  // Non-empty: the turn-lock acquire must see an updatable row.
  agent_conversations: { data: [{ id: 'conv-1', summary: null, summary_through: null }] },
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
    // lock acquire + last_message_at + lock release
    const convUpdates = fake.updates['agent_conversations'] as Array<Record<string, unknown>>;
    expect(convUpdates.some((u) => 'last_message_at' in u)).toBe(true);
    expect(convUpdates.at(-1)).toEqual({ turn_started_at: null });
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

  it('emits confirmation_required when a gated tool is parked', async () => {
    const provider = scriptedProvider([
      {
        content: [
          {
            type: 'tool_use',
            id: 'tu-g',
            name: 'assign_guests_to_room',
            input: { room_id: 'r-204', guest_ids: ['g1'] },
          },
        ],
        stopReason: 'tool_use',
      },
      { content: [{ type: 'text', text: 'Awaiting your confirmation.' }], stopReason: 'end_turn' },
    ]);
    const { events } = await run(provider, {
      ...SNAPSHOT_TABLES,
      agent_actions: { data: { id: 'pending-1' } },
    });

    const confirmEvent = events.find((e) => e.type === 'confirmation_required');
    expect(confirmEvent).toEqual({
      type: 'confirmation_required',
      actionId: 'pending-1',
      name: 'assign_guests_to_room',
      label: 'Reassigning a room',
      input: { room_id: 'r-204', guest_ids: ['g1'] },
    });
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

  it('throws TurnInProgressError when the conversation lock is held', async () => {
    const provider = scriptedProvider([
      { content: [{ type: 'text', text: 'never reached' }], stopReason: 'end_turn' },
    ]);
    // Empty result from the conditional lock update = lock held by another turn
    await expect(
      run(provider, { ...SNAPSHOT_TABLES, agent_conversations: { data: [] } })
    ).rejects.toThrow(TurnInProgressError);
    expect(provider.calls).toBe(0);
  });

  it('prepends the rolling summary as context when one exists', async () => {
    let seenMessages: AgentChatMessage[] = [];
    const provider: AgentProvider = {
      async streamTurn({ messages }) {
        seenMessages = messages;
        return { content: [{ type: 'text', text: 'ok' }], stopReason: 'end_turn' };
      },
    };
    await run(provider, {
      ...SNAPSHOT_TABLES,
      agent_conversations: {
        data: [{ id: 'conv-1', summary: 'Venue is the Leela; Raj cancelled.', summary_through: '2026-01-01' }],
      },
    });
    const first = seenMessages[0];
    expect(first.role).toBe('user');
    expect((first.content[0] as { text: string }).text).toContain('⟦summary⟧');
    expect((first.content[0] as { text: string }).text).toContain('Raj cancelled');
  });

  it('surfaces refusals as an error event without persisting an assistant turn', async () => {
    const provider = scriptedProvider([{ content: [], stopReason: 'refusal' }]);
    const { fake, events } = await run(provider);
    expect(events.some((e) => e.type === 'error')).toBe(true);
    const persisted = fake.inserts['agent_messages'] as Array<{ role: string }>;
    expect(persisted.map((m) => m.role)).toEqual(['user']);
  });
});

describe('sanitizeHistoryWindow', () => {
  const text = (t: string) => ({ type: 'text' as const, text: t });

  it('drops leading tool_result messages whose tool_use was truncated away', () => {
    const window = sanitizeHistoryWindow([
      { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'x', content: 'orphan' }] },
      { role: 'assistant', content: [text('reply')] },
      { role: 'user', content: [text('hello')] },
      { role: 'assistant', content: [text('hi')] },
    ]);
    expect(window).toHaveLength(2);
    expect(window[0].role).toBe('user');
    expect((window[0].content[0] as { text: string }).text).toBe('hello');
  });

  it('drops a trailing assistant message with an unanswered tool_use (crashed turn)', () => {
    const window = sanitizeHistoryWindow([
      { role: 'user', content: [text('hello')] },
      { role: 'assistant', content: [{ type: 'tool_use', id: 't1', name: 'list_guests', input: {} }] },
    ]);
    expect(window).toHaveLength(1);
    expect(window[0].role).toBe('user');
  });

  it('keeps an already-consistent window unchanged', () => {
    const input = [
      { role: 'user' as const, content: [text('hello')] },
      { role: 'assistant' as const, content: [text('hi')] },
    ];
    expect(sanitizeHistoryWindow(input)).toEqual(input);
  });
});
