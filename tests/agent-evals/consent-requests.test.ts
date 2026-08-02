import { describe, it, expect, beforeAll, vi } from 'vitest';

// Tool domains import the service layer, which imports the browser client.
vi.mock('@/lib/supabase/client', () => ({
  supabase: { from: vi.fn() },
  publicSupabase: { from: vi.fn() },
}));
// Never hit Resend in tests — assert the alert fires, don't send mail.
vi.mock('@/lib/email/alerts', () => ({
  sendPlannerRequestAlert: vi.fn(async () => ({ success: true })),
}));

import { getAllTools, dispatchTool, getTool } from '@/lib/agent/tools';
import { sendPlannerRequestAlert } from '@/lib/email/alerts';
import type { AgentToolContext } from '@/lib/agent/types';
import { createFakeSupabase, type FakeSupabase } from '../mocks/fake-supabase';

/**
 * Deterministic evals for the consent + managed-request tools — decided at the
 * dispatch boundary with NO model and NO network. Protects the merge-gate
 * behaviors: consent auto-executes & logs; managed/unsupported asks are captured
 * (+ emailed + audited) and never faked as automation, even with no DB table.
 */
function ctx(fake: FakeSupabase): AgentToolContext {
  return {
    supabase: fake.client as never,
    weddingSlug: 'agent-lab-x',
    weddingUuid: 'uuid-1',
    userId: 'u1',
    conversationId: 'conv-1',
    isPro: true,
  };
}

beforeAll(() => {
  getAllTools();
});

describe('record_consent — DPDPA opt-in logging', () => {
  it('is registered as an auto-execute write tool (no confirmation gate)', () => {
    const t = getTool('record_consent');
    expect(t).toBeDefined();
    expect(t!.risk).toBe('write');
    expect(t!.proFeature).toBeUndefined();
  });

  it('logs the consent and clears the agent to collect that scope', async () => {
    const fake = createFakeSupabase({ agent_actions: { data: { id: 'act-1' } } });
    const r = await dispatchTool(
      'record_consent',
      { scope: 'guest travel & ID logistics', language: 'en+hi' },
      ctx(fake)
    );
    expect(r.ok).toBe(true);
    const out = JSON.parse(r.content);
    expect(out.recorded).toBe(true);
    expect(out.language).toBe('en+hi');
    expect(out.scope).toMatch(/logistics/i);
    expect(out.given_at).toBeTruthy();
    // The dispatcher's audit row is the durable consent record.
    expect(fake.inserts.agent_actions?.[0]).toMatchObject({ tool_name: 'record_consent' });
  });
});

describe('submit_request — managed / unsupported hand-off', () => {
  it('captures a managed brief (with budget), emails the team, never fakes automation', async () => {
    const fake = createFakeSupabase({
      planner_requests: { data: { id: 'req-1' } },
      agent_actions: { data: { id: 'act-1' } },
    });
    const r = await dispatchTool(
      'submit_request',
      { kind: 'managed', service: 'Venue sourcing', details: 'Udaipur, ~280, palace feel', budget: '₹8–12L' },
      ctx(fake)
    );
    expect(r.ok).toBe(true);
    const out = JSON.parse(r.content);
    expect(out.captured).toBe(true);
    expect(out.kind).toBe('managed');
    expect(out.recordId).toBe('req-1');
    expect(out.note).toMatch(/our team/i);
    expect(out.note).toMatch(/never present this as/i);
    expect(sendPlannerRequestAlert).toHaveBeenCalledTimes(1);
    expect(fake.inserts.planner_requests?.[0]).toMatchObject({ kind: 'managed', budget: '₹8–12L' });
  });

  it('still succeeds (emails + audits) when the planner_requests table is absent', async () => {
    const fake = createFakeSupabase({
      planner_requests: { error: { message: 'relation "planner_requests" does not exist' } },
      agent_actions: { data: { id: 'act-1' } },
    });
    const r = await dispatchTool(
      'submit_request',
      { kind: 'unsupported', service: 'Live-stream the ceremony', details: 'wants a livestream link' },
      ctx(fake)
    );
    expect(r.ok).toBe(true);
    const out = JSON.parse(r.content);
    expect(out.captured).toBe(true);
    expect(out.recordId).toBeNull();
    expect(sendPlannerRequestAlert).toHaveBeenCalled();
  });
});
