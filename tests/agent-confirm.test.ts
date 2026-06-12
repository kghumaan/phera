import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockRunAgentTurn = vi.fn();
vi.mock('@/lib/agent/loop', () => ({
  runAgentTurn: (...args: unknown[]) => mockRunAgentTurn(...args),
}));
vi.mock('@/lib/supabase/client', () => ({
  supabase: { from: vi.fn() },
  publicSupabase: { from: vi.fn() },
}));

import { resolveAgentAction, CONFIRMATION_NOTE_PREFIX } from '@/lib/agent/confirm';
import { registerTools, clearRegistryForTests } from '@/lib/agent/tools/registry';
import { createFakeSupabase } from './mocks/fake-supabase';

const PENDING_ACTION = {
  id: 'action-1',
  conversation_id: 'conv-1',
  wedding_id: 'agent-lab-x',
  tool_name: 'gated_fixture',
  input: { room_id: 'r-204', guest_ids: ['g1'] },
  status: 'pending',
};

function setup(executeImpl: () => Promise<unknown>, actionOverrides: Record<string, unknown> = {}) {
  clearRegistryForTests();
  const executeSpy = vi.fn(executeImpl);
  registerTools([
    {
      name: 'gated_fixture',
      label: 'Reassigning a room',
      description: 'fixture',
      risk: 'gated',
      inputSchema: { type: 'object' },
      execute: executeSpy,
    },
  ]);
  const fake = createFakeSupabase({
    agent_actions: { data: { ...PENDING_ACTION, ...actionOverrides } },
    weddings: { data: { id: 'uuid-1', slug: 'agent-lab-x' } },
  });
  return { fake, executeSpy };
}

describe('resolveAgentAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRunAgentTurn.mockResolvedValue(undefined);
  });

  it('executes the tool on approve, marks it confirmed, and runs an acknowledgment turn', async () => {
    const { fake, executeSpy } = setup(async () => ({ updated: 'room 204' }));
    const events: unknown[] = [];
    await resolveAgentAction({
      supabase: fake.client as never,
      actionId: 'action-1',
      approve: true,
      userId: 'user-1',
      provider: {} as never,
      onEvent: (e) => events.push(e),
    });

    expect(executeSpy).toHaveBeenCalledWith(
      PENDING_ACTION.input,
      expect.objectContaining({ weddingSlug: 'agent-lab-x', weddingUuid: 'uuid-1', conversationId: 'conv-1' })
    );
    const update = fake.updates['agent_actions'][0] as Record<string, unknown>;
    expect(update.status).toBe('confirmed');

    const turnArgs = mockRunAgentTurn.mock.calls[0][0] as { userMessage: string };
    expect(turnArgs.userMessage.startsWith(CONFIRMATION_NOTE_PREFIX)).toBe(true);
    expect(turnArgs.userMessage).toMatch(/CONFIRMED/);
    expect(turnArgs.userMessage).toMatch(/room 204/);
  });

  it('marks declined without executing and tells the agent not to retry', async () => {
    const { fake, executeSpy } = setup(async () => ({}));
    await resolveAgentAction({
      supabase: fake.client as never,
      actionId: 'action-1',
      approve: false,
      userId: 'user-1',
      provider: {} as never,
      onEvent: () => {},
    });

    expect(executeSpy).not.toHaveBeenCalled();
    expect((fake.updates['agent_actions'][0] as Record<string, unknown>).status).toBe('declined');
    const turnArgs = mockRunAgentTurn.mock.calls[0][0] as { userMessage: string };
    expect(turnArgs.userMessage).toMatch(/DECLINED/);
    expect(turnArgs.userMessage).toMatch(/Do not retry/);
    // Input must be echoed so the model can disambiguate same-tool actions
    expect(turnArgs.userMessage).toContain('r-204');
  });

  it('marks failed when execution throws, and reports the failure to the agent', async () => {
    const { fake } = setup(async () => {
      throw new Error('capacity exceeded');
    });
    await resolveAgentAction({
      supabase: fake.client as never,
      actionId: 'action-1',
      approve: true,
      userId: 'user-1',
      provider: {} as never,
      onEvent: () => {},
    });

    expect((fake.updates['agent_actions'][0] as Record<string, unknown>).status).toBe('failed');
    const turnArgs = mockRunAgentTurn.mock.calls[0][0] as { userMessage: string };
    expect(turnArgs.userMessage).toMatch(/FAILED/);
    expect(turnArgs.userMessage).toMatch(/capacity exceeded/);
  });

  it('rejects actions that are not pending', async () => {
    const { fake } = setup(async () => ({}), { status: 'confirmed' });
    await expect(
      resolveAgentAction({
        supabase: fake.client as never,
        actionId: 'action-1',
        approve: true,
        userId: 'user-1',
        provider: {} as never,
        onEvent: () => {},
      })
    ).rejects.toThrow(/already resolved/);
    expect(mockRunAgentTurn).not.toHaveBeenCalled();
  });
});
