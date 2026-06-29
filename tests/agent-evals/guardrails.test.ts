import { describe, it, expect, beforeAll, vi } from 'vitest';

// Tool domains import the service layer, which imports the browser client.
vi.mock('@/lib/supabase/client', () => ({
  supabase: { from: vi.fn() },
  publicSupabase: { from: vi.fn() },
}));

import { getAllTools, dispatchTool } from '@/lib/agent/tools';
import type { AgentToolContext, AgentToolDefinition } from '@/lib/agent/types';
import { createFakeSupabase } from '../mocks/fake-supabase';

/**
 * Deterministic guardrail evals — the global invariants from docs/AGENT-EVALS.md
 * that are decidable at the dispatch boundary, with NO model and NO network.
 * These prove the upgrade reveal, the gated-confirmation flow, and ask_user
 * parking regardless of what the model decides to do. They run in CI.
 */

function ctx(isPro: boolean, fake = createFakeSupabase({ agent_actions: { data: { id: 'act-1' } } })): AgentToolContext {
  return {
    supabase: fake.client as never,
    weddingSlug: 'agent-lab-x',
    weddingUuid: 'uuid-1',
    userId: 'u1',
    conversationId: 'conv-1',
    isPro,
  };
}

let tools: AgentToolDefinition[];
beforeAll(() => {
  tools = getAllTools();
});

describe('Pro gating — the upgrade reveal', () => {
  it('every Pro tool blocks a FREE user with an upgrade card and never executes', async () => {
    const proTools = tools.filter((t) => t.proFeature);
    expect(proTools.length).toBeGreaterThan(0);
    for (const t of proTools) {
      const r = await dispatchTool(t.name, {}, ctx(false));
      expect(r.ok, `${t.name} must not succeed on free`).toBe(false);
      expect(r.upgradeRequiredFeature, `${t.name} surfaces its feature name`).toBe(t.proFeature);
      expect(r.content).toMatch(/UPGRADE REQUIRED/);
      // It must NOT have parked or executed anything.
      expect(r.pendingActionId).toBeUndefined();
    }
  });

  it('Pro tools do NOT show an upgrade to a PRO user', async () => {
    const proTools = tools.filter((t) => t.proFeature);
    for (const t of proTools) {
      const r = await dispatchTool(t.name, {}, ctx(true));
      expect(r.upgradeRequiredFeature, `${t.name} must not block a Pro user`).toBeUndefined();
    }
  });

  it('the gated feature set is exactly Rooms / Transportation / Vendor coordination', () => {
    const features = [...new Set(tools.filter((t) => t.proFeature).map((t) => t.proFeature))].sort();
    expect(features).toEqual(['Room assignments', 'Transportation', 'Vendor coordination']);
  });
});

describe('Gated tools — confirmation required, never auto-execute', () => {
  it('every gated tool parks a pending action instead of executing', async () => {
    const gated = tools.filter((t) => t.risk === 'gated');
    expect(gated.length).toBeGreaterThan(0);
    for (const t of gated) {
      // isPro so a Pro-gate (if any) doesn't intercept before the gated branch.
      const r = await dispatchTool(t.name, {}, ctx(true));
      expect(r.ok, `${t.name} parks ok`).toBe(true);
      expect(r.pendingActionId, `${t.name} parks a pending action`).toBe('act-1');
      expect(r.content).toMatch(/PENDING/);
    }
  });
});

describe('ask_user — parks structured questions', () => {
  it('parks a questions_required action and echoes the questions', async () => {
    const r = await dispatchTool('ask_user', { questions: [{ id: 'a', prompt: 'A?', type: 'text' }] }, ctx(true));
    expect(r.ok).toBe(true);
    expect(r.pendingActionId).toBe('act-1');
    expect(r.questions).toHaveLength(1);
  });

  it('rejects an empty question set', async () => {
    const r = await dispatchTool('ask_user', { questions: [] }, ctx(true));
    expect(r.ok).toBe(false);
  });
});

describe('Free / read tools — never blocked', () => {
  it('a free read tool is not gated or upgrade-walled for a free user', async () => {
    const free = tools.find((t) => t.risk === 'read' && !t.proFeature);
    expect(free).toBeTruthy();
    const r = await dispatchTool(free!.name, {}, ctx(false));
    expect(r.upgradeRequiredFeature).toBeUndefined();
    expect(r.pendingActionId).toBeUndefined();
  });
});
