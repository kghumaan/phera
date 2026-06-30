import type { SupabaseClient } from '@supabase/supabase-js';
import { runAgentTurn } from './loop';
import { getTool } from './tools';
import type { AgentProvider, AgentStreamEvent, AgentToolContext } from './types';

/**
 * User messages carrying confirmation outcomes are prefixed with this marker
 * so chat UIs can render them as status lines instead of user bubbles.
 */
export const CONFIRMATION_NOTE_PREFIX = '⟦confirmation⟧';

export interface ResolveActionArgs {
  supabase: SupabaseClient;
  actionId: string;
  approve: boolean;
  userId: string;
  provider: AgentProvider;
  onEvent: (event: AgentStreamEvent) => void;
}

/**
 * Resolve a pending gated action: execute it (or mark it declined), update
 * the audit row, then run a follow-up agent turn so the assistant reports
 * the outcome in the conversation.
 */
export async function resolveAgentAction(args: ResolveActionArgs): Promise<void> {
  const { supabase, actionId, approve, userId, provider, onEvent } = args;

  const { data: action } = await supabase
    .from('agent_actions')
    .select('id, conversation_id, wedding_id, tool_name, input, status')
    .eq('id', actionId)
    .single();
  if (!action) throw new Error('Pending action not found');
  if (action.status !== 'pending') throw new Error(`Action already resolved (${action.status})`);
  if (!action.conversation_id) throw new Error('Action has no conversation');

  const { data: wedding } = await supabase
    .from('weddings')
    .select('id, slug')
    .eq('slug', action.wedding_id)
    .single();
  if (!wedding) throw new Error('Wedding not found for action');

  const tool = getTool(action.tool_name);
  const label = tool?.label ?? action.tool_name;
  // Several pending actions can share a tool — always identify the resolved
  // one by its exact input so the model never acknowledges the wrong action.
  const inputSummary = JSON.stringify(action.input ?? {}).slice(0, 600);
  let note: string;

  if (!approve) {
    await supabase
      .from('agent_actions')
      .update({ status: 'declined', resolved_at: new Date().toISOString() })
      .eq('id', actionId);
    note = `${CONFIRMATION_NOTE_PREFIX} The user DECLINED the pending action "${label}" (${action.tool_name}) with input ${inputSummary}. It was not executed and the data is unchanged. Do not retry it unless they ask again; acknowledge the specific action that was declined.`;
  } else if (!tool) {
    await supabase
      .from('agent_actions')
      .update({ status: 'failed', result: { output: 'Tool no longer exists' }, resolved_at: new Date().toISOString() })
      .eq('id', actionId);
    note = `${CONFIRMATION_NOTE_PREFIX} The user confirmed the pending action "${action.tool_name}", but that tool no longer exists. Apologize and suggest the admin UI.`;
  } else {
    const ctx: AgentToolContext = {
      supabase,
      weddingSlug: wedding.slug,
      weddingUuid: wedding.id,
      userId,
      conversationId: action.conversation_id,
      // Confirming a parked Pro action means they already passed the gate.
      isPro: true,
    };
    try {
      const result = await tool.execute((action.input ?? {}) as Record<string, unknown>, ctx);
      const serialized = typeof result === 'string' ? result : JSON.stringify(result ?? null);
      await supabase
        .from('agent_actions')
        .update({
          status: 'confirmed',
          result: { output: serialized.slice(0, 4000) },
          resolved_at: new Date().toISOString(),
        })
        .eq('id', actionId);
      note = `${CONFIRMATION_NOTE_PREFIX} The user CONFIRMED the pending action "${label}" (${action.tool_name}) with input ${inputSummary} and it has now executed successfully. Result: ${serialized.slice(0, 1500)}. Acknowledge briefly — do not re-run the tool.`;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await supabase
        .from('agent_actions')
        .update({
          status: 'failed',
          result: { output: message },
          resolved_at: new Date().toISOString(),
        })
        .eq('id', actionId);
      note = `${CONFIRMATION_NOTE_PREFIX} The user CONFIRMED the pending action "${label}" (${action.tool_name}) with input ${inputSummary} but execution FAILED: ${message}. Tell the user plainly and suggest what to do next.`;
    }
  }

  await runAgentTurn({
    supabase,
    weddingSlug: wedding.slug,
    weddingUuid: wedding.id,
    userId,
    conversationId: action.conversation_id,
    userMessage: note,
    provider,
    onEvent,
  });
}
