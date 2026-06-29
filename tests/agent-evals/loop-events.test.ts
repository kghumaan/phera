import { describe, it, expect, vi } from 'vitest';

// The loop pulls in the tool domains (→ service layer → browser client).
vi.mock('@/lib/supabase/client', () => ({
  supabase: { from: vi.fn() },
  publicSupabase: { from: vi.fn() },
}));

import { runAgentTurn } from '@/lib/agent/loop';
import type { AgentProvider, AgentStreamEvent, ProviderTurnResult } from '@/lib/agent/types';
import { createFakeSupabase } from '../mocks/fake-supabase';

/**
 * End-to-end reveal events — drives the REAL runAgentTurn loop with a mock
 * provider (canned tool calls) + a fake Supabase, and asserts the loop emits
 * the events the chat UI consumes to reveal the upgrade card / confirm card /
 * question form. Deterministic; runs in CI. Together with guardrails.test.ts
 * this proves "the upgrade reveal is smooth" without eyeballing the UI.
 */

function mockProvider(queue: ProviderTurnResult[]): AgentProvider {
  let i = 0;
  return {
    streamTurn: async () => queue[Math.min(i++, queue.length - 1)],
  };
}

const END_TURN: ProviderTurnResult = { content: [{ type: 'text', text: 'ok' }], stopReason: 'end_turn' };
function toolUse(name: string, input: Record<string, unknown> = {}): ProviderTurnResult {
  return { content: [{ type: 'tool_use', id: 'tu1', name, input }], stopReason: 'tool_use' };
}

function fakeFor(tier: 'phera' | 'pro') {
  return createFakeSupabase({
    agent_conversations: { data: [{ id: 'conv-1' }] }, // turn-lock acquire sees a row → lock held
    agent_messages: { data: [] },
    agent_actions: { data: { id: 'act-1' } },
    user_settings: { data: { subscription_tier: tier } }, // 'phera' → free, anything else → Pro
    weddings: {
      data: {
        id: 'uuid-1',
        couple_name: 'Priya & Rahul',
        wedding_date: new Date(Date.now() + 200 * 86_400_000).toISOString(),
        venue_name: 'Venue TBD',
        venue_location: null,
        rsvp_deadline: '',
      },
    },
    guests: { count: 0, data: [] },
    rsvps: { data: [] },
    wedding_rooms: { count: 0 },
    vendors: { count: 0 },
    wedding_events: { count: 0 },
    wedding_schedule: { count: 0 },
    wedding_faqs: { count: 0 },
    wedding_tasks: { count: 0 },
    agent_knowledge: { data: [] },
  });
}

async function run(provider: AgentProvider, fake: ReturnType<typeof fakeFor>, message = 'hi'): Promise<AgentStreamEvent[]> {
  const events: AgentStreamEvent[] = [];
  await runAgentTurn({
    supabase: fake.client as never,
    weddingSlug: 'agent-lab-x',
    weddingUuid: 'uuid-1',
    userId: 'u1',
    conversationId: 'conv-1',
    userMessage: message,
    provider,
    onEvent: (e) => events.push(e),
  });
  return events;
}

describe('loop reveal events', () => {
  it('Pro tool on a FREE plan → upgrade_required (with the feature name) + done', async () => {
    const events = await run(mockProvider([toolUse('list_rooms'), END_TURN]), fakeFor('phera'));
    const up = events.find((e) => e.type === 'upgrade_required');
    expect(up, 'an upgrade_required event was emitted').toBeTruthy();
    expect((up as Extract<AgentStreamEvent, { type: 'upgrade_required' }>).feature).toBe('Room assignments');
    expect(events.some((e) => e.type === 'done')).toBe(true);
  });

  it('Pro tool on a PRO plan → NO upgrade_required', async () => {
    const events = await run(mockProvider([toolUse('list_rooms'), END_TURN]), fakeFor('pro'));
    expect(events.some((e) => e.type === 'upgrade_required')).toBe(false);
  });

  it('gated tool on Pro → confirmation_required', async () => {
    const events = await run(
      mockProvider([toolUse('assign_guests_to_room', { room_id: 'r1', guest_ids: [] }), END_TURN]),
      fakeFor('pro')
    );
    expect(events.some((e) => e.type === 'confirmation_required')).toBe(true);
  });

  it('ask_user → questions_required', async () => {
    const events = await run(
      mockProvider([toolUse('ask_user', { questions: [{ id: 'a', prompt: 'Your names', type: 'text' }] }), END_TURN]),
      fakeFor('pro')
    );
    const q = events.find((e) => e.type === 'questions_required');
    expect(q, 'a questions_required event was emitted').toBeTruthy();
    expect((q as Extract<AgentStreamEvent, { type: 'questions_required' }>).questions).toHaveLength(1);
  });
});
