import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { LabScenario, LabState } from '@/lib/agent/lab/scenarios';
import type { AgentStreamEvent } from '@/lib/agent/types';

/**
 * Live eval runner — drives the REAL agent loop + Anthropic provider against
 * the phera-test Supabase, on disposable `agent-lab-*` weddings. Gated behind
 * env; in CI (no env) the suites skip. This is how persona fixtures from
 * docs/AGENT-EVALS.md get exercised against the live model (eval-driven dev:
 * red now for spine behaviors, green as we ship the conversation spine).
 *
 * Live runs need a FULL app env: TEST_SUPABASE_URL + TEST_SUPABASE_SERVICE_ROLE_KEY
 * + ANTHROPIC_API_KEY, and (because the agent loop initializes the browser
 * Supabase client at module load) NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY.
 */

const URL = process.env.TEST_SUPABASE_URL;
const SERVICE_KEY = process.env.TEST_SUPABASE_SERVICE_ROLE_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

export const hasLiveEnv = !!(URL && SERVICE_KEY && ANTHROPIC_KEY);

export function testClient(): SupabaseClient {
  return createClient(URL!, SERVICE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export interface TurnResult {
  reply: string;
  events: AgentStreamEvent[];
  actions: Array<{ tool_name: string; input: unknown; status: string; risk: string }>;
  state: LabState;
}

/**
 * Seed a disposable lab wedding, run ONE user message through the real loop +
 * Anthropic provider, capture reply / events / actions / final state, then tear
 * the wedding down. Single-turn (no parked-question round-trip yet) — enough for
 * the invariant fixtures; the multi-turn answer flow is a follow-up.
 */
export async function runPersonaTurn(opts: { scenario: LabScenario; message: string }): Promise<TurnResult> {
  // Lazy runtime imports: the agent loop initializes the browser Supabase
  // client at module load, so importing it eagerly would break CI collection
  // (where this suite is skipped). Loaded only when a live test actually runs.
  const [{ seedLabWedding, teardownLabWedding, dumpLabState }, { runAgentTurn }, { anthropicProvider }] =
    await Promise.all([
      import('@/lib/agent/lab/scenarios'),
      import('@/lib/agent/loop'),
      import('@/lib/agent/providers/anthropic'),
    ]);

  const supabase = testClient();
  const seed = await seedLabWedding(supabase, { scenario: opts.scenario, ownerId: null });
  try {
    const { data: conv } = await supabase
      .from('agent_conversations')
      .insert({ wedding_id: seed.slug, created_by: null, channel: 'web' })
      .select('id')
      .single();
    const conversationId = conv!.id as string;

    const turnStartedAt = new Date().toISOString();
    const events: AgentStreamEvent[] = [];
    let reply = '';
    await runAgentTurn({
      supabase,
      weddingSlug: seed.slug,
      weddingUuid: seed.weddingUuid,
      userId: 'lab',
      conversationId,
      userMessage: opts.message,
      provider: anthropicProvider,
      onEvent: (e) => {
        events.push(e);
        if (e.type === 'text_delta') reply += e.text;
      },
    });

    const { data: actions } = await supabase
      .from('agent_actions')
      .select('tool_name, input, status, risk, created_at')
      .eq('conversation_id', conversationId)
      .gte('created_at', turnStartedAt)
      .order('created_at');

    const state = await dumpLabState(supabase, seed.slug);
    return { reply, events, actions: (actions ?? []) as TurnResult['actions'], state };
  } finally {
    await teardownLabWedding(supabase, seed.slug);
  }
}
