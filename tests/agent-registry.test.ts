import { describe, it, expect, beforeEach } from 'vitest';
import {
  registerTools,
  getTool,
  listTools,
  dispatchTool,
  clearRegistryForTests,
} from '@/lib/agent/tools/registry';
import type { AgentToolContext, AgentToolDefinition } from '@/lib/agent/types';
import { createFakeSupabase } from './mocks/fake-supabase';

function makeCtx() {
  const fake = createFakeSupabase({});
  const ctx: AgentToolContext = {
    supabase: fake.client as never,
    weddingSlug: 'test-wedding',
    weddingUuid: 'uuid-123',
    userId: 'user-1',
    conversationId: 'conv-1',
  };
  return { ctx, fake };
}

function makeTool(overrides: Partial<AgentToolDefinition> = {}): AgentToolDefinition {
  return {
    name: 'echo',
    label: 'Echoing',
    description: 'Echo the input back. Call when testing.',
    risk: 'read',
    inputSchema: { type: 'object', properties: {} },
    execute: async (input) => ({ echoed: input }),
    ...overrides,
  };
}

describe('agent tool registry', () => {
  beforeEach(() => clearRegistryForTests());

  it('registers and lists tools', () => {
    registerTools([makeTool(), makeTool({ name: 'other' })]);
    expect(listTools().map((t) => t.name)).toEqual(['echo', 'other']);
    expect(getTool('echo')?.label).toBe('Echoing');
  });

  it('rejects duplicate tool names', () => {
    registerTools([makeTool()]);
    expect(() => registerTools([makeTool()])).toThrow(/already registered/);
  });

  it('dispatches a tool and returns its serialized result', async () => {
    registerTools([makeTool()]);
    const { ctx } = makeCtx();
    const result = await dispatchTool('echo', { hello: 'world' }, ctx);
    expect(result.ok).toBe(true);
    expect(JSON.parse(result.content)).toEqual({ echoed: { hello: 'world' } });
  });

  it('audit-logs executions to agent_actions', async () => {
    registerTools([makeTool({ risk: 'write' })]);
    const { ctx, fake } = makeCtx();
    await dispatchTool('echo', { a: 1 }, ctx);
    expect(fake.inserts['agent_actions']).toHaveLength(1);
    const logged = fake.inserts['agent_actions'][0] as Record<string, unknown>;
    expect(logged.tool_name).toBe('echo');
    expect(logged.status).toBe('executed');
    expect(logged.risk).toBe('write');
    expect(logged.wedding_id).toBe('test-wedding');
  });

  it('returns ok:false for unknown tools', async () => {
    const { ctx } = makeCtx();
    const result = await dispatchTool('nope', {}, ctx);
    expect(result.ok).toBe(false);
    expect(result.content).toMatch(/Unknown tool/);
  });

  it('catches handler errors and logs a failed action', async () => {
    registerTools([
      makeTool({
        execute: async () => {
          throw new Error('boom');
        },
      }),
    ]);
    const { ctx, fake } = makeCtx();
    const result = await dispatchTool('echo', {}, ctx);
    expect(result.ok).toBe(false);
    expect(result.content).toMatch(/boom/);
    expect((fake.inserts['agent_actions'][0] as Record<string, unknown>).status).toBe('failed');
  });

  it('refuses gated tools until confirmation flow exists, and audit-logs the refusal', async () => {
    let executed = false;
    registerTools([
      makeTool({
        risk: 'gated',
        execute: async () => {
          executed = true;
          return null;
        },
      }),
    ]);
    const { ctx, fake } = makeCtx();
    const result = await dispatchTool('echo', {}, ctx);
    expect(result.ok).toBe(false);
    expect(result.content).toMatch(/confirmation/i);
    expect(executed).toBe(false);
    expect((fake.inserts['agent_actions'][0] as Record<string, unknown>).status).toBe('declined');
  });

  it('truncates oversized results', async () => {
    registerTools([makeTool({ execute: async () => 'x'.repeat(20_000) })]);
    const { ctx } = makeCtx();
    const result = await dispatchTool('echo', {}, ctx);
    expect(result.ok).toBe(true);
    expect(result.content.length).toBeLessThan(13_000);
    expect(result.content).toMatch(/truncated/);
  });
});
