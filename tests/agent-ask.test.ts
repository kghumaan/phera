import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockRunAgentTurn = vi.fn();
vi.mock('@/lib/agent/loop', () => ({
  runAgentTurn: (...args: unknown[]) => mockRunAgentTurn(...args),
}));
vi.mock('@/lib/supabase/client', () => ({
  supabase: { from: vi.fn() },
  publicSupabase: { from: vi.fn() },
}));

import { dispatchTool, clearRegistryForTests, registerTools } from '@/lib/agent/tools/registry';
import { askTools } from '@/lib/agent/tools/ask';
import { resolveAgentAnswers, ANSWERS_NOTE_PREFIX } from '@/lib/agent/answer';
import type { AgentToolContext } from '@/lib/agent/types';
import { createFakeSupabase } from './mocks/fake-supabase';

const QUESTIONS = [
  { id: 'couple', prompt: 'Who is getting married?', type: 'text' as const },
  { id: 'date', prompt: 'When is the wedding?', type: 'date' as const },
];

describe('ask_user dispatch', () => {
  beforeEach(() => {
    clearRegistryForTests();
    registerTools(askTools);
  });

  it('parks questions as a pending action and returns them', async () => {
    const fake = createFakeSupabase({ agent_actions: { data: { id: 'q-1' } } });
    const ctx: AgentToolContext = {
      supabase: fake.client as never,
      weddingSlug: 'agent-lab-x',
      weddingUuid: 'uuid-1',
      userId: 'u1',
      conversationId: 'conv-1',
    isPro: true,
    };
    const result = await dispatchTool('ask_user', { questions: QUESTIONS }, ctx);
    expect(result.ok).toBe(true);
    expect(result.pendingActionId).toBe('q-1');
    expect(result.questions).toHaveLength(2);
    expect(result.content).toMatch(/ASKED/);
    const row = fake.inserts['agent_actions'][0] as Record<string, unknown>;
    expect(row.status).toBe('pending');
    expect(row.tool_name).toBe('ask_user');
  });

  it('rejects an empty question set', async () => {
    const fake = createFakeSupabase({});
    const ctx: AgentToolContext = {
      supabase: fake.client as never,
      weddingSlug: 'agent-lab-x',
      weddingUuid: 'uuid-1',
      userId: 'u1',
      conversationId: 'conv-1',
    isPro: true,
    };
    const result = await dispatchTool('ask_user', { questions: [] }, ctx);
    expect(result.ok).toBe(false);
    expect(fake.inserts['agent_actions']).toBeUndefined();
  });
});

describe('resolveAgentAnswers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRunAgentTurn.mockResolvedValue(undefined);
  });

  function setup(status = 'pending') {
    return createFakeSupabase({
      agent_actions: {
        data: {
          id: 'q-1',
          conversation_id: 'conv-1',
          wedding_id: 'agent-lab-x',
          tool_name: 'ask_user',
          input: { questions: QUESTIONS },
          status,
        },
      },
      weddings: { data: { id: 'uuid-1', slug: 'agent-lab-x' } },
    });
  }

  it('records answers and runs a follow-up turn with them', async () => {
    const fake = setup();
    await resolveAgentAnswers({
      supabase: fake.client as never,
      actionId: 'q-1',
      answers: { couple: 'Anaya & Vikram', date: '2027-03-13' },
      userId: 'u1',
      provider: {} as never,
      onEvent: () => {},
    });

    const update = fake.updates['agent_actions'][0] as Record<string, unknown>;
    expect(update.status).toBe('confirmed');
    expect(update.result).toEqual({ answers: { couple: 'Anaya & Vikram', date: '2027-03-13' } });

    const turn = mockRunAgentTurn.mock.calls[0][0] as { userMessage: string };
    expect(turn.userMessage.startsWith(ANSWERS_NOTE_PREFIX)).toBe(true);
    expect(turn.userMessage).toContain('Who is getting married? → Anaya & Vikram');
    expect(turn.userMessage).toContain('When is the wedding? → 2027-03-13');
  });

  it('formats multi-select and skipped answers', async () => {
    const fake = setup();
    await resolveAgentAnswers({
      supabase: fake.client as never,
      actionId: 'q-1',
      answers: { couple: ['A', 'B'], date: '' },
      userId: 'u1',
      provider: {} as never,
      onEvent: () => {},
    });
    const turn = mockRunAgentTurn.mock.calls[0][0] as { userMessage: string };
    expect(turn.userMessage).toContain('A, B');
    expect(turn.userMessage).toContain('→ (skipped)');
  });

  it('refuses an already-answered action', async () => {
    const fake = setup('confirmed');
    await expect(
      resolveAgentAnswers({
        supabase: fake.client as never,
        actionId: 'q-1',
        answers: {},
        userId: 'u1',
        provider: {} as never,
        onEvent: () => {},
      })
    ).rejects.toThrow(/Already answered/);
    expect(mockRunAgentTurn).not.toHaveBeenCalled();
  });
});
