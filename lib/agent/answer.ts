import type { SupabaseClient } from '@supabase/supabase-js';
import { runAgentTurn } from './loop';
import type { AgentProvider, AgentQuestion, AgentStreamEvent } from './types';

/** Marks answered-question messages so the chat UI can render them as a
 *  compact summary instead of a raw user bubble. */
export const ANSWERS_NOTE_PREFIX = '⟦answers⟧';

export interface ResolveAnswersArgs {
  supabase: SupabaseClient;
  actionId: string;
  /** Map of question id → answer (string, or string[] for multi-select). */
  answers: Record<string, string | string[]>;
  userId: string;
  provider: AgentProvider;
  onEvent: (event: AgentStreamEvent) => void;
}

function formatAnswer(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value.length ? value.join(', ') : '(skipped)';
  return value && value.trim() ? value.trim() : '(skipped)';
}

/**
 * Resolve a parked ask_user action: record the answers, then run a follow-up
 * agent turn with the answers as a plain user message so the agent acts on
 * them (records the venue, adds the guest, etc.).
 */
export async function resolveAgentAnswers(args: ResolveAnswersArgs): Promise<void> {
  const { supabase, actionId, answers, userId, provider, onEvent } = args;

  const { data: action } = await supabase
    .from('agent_actions')
    .select('id, conversation_id, wedding_id, tool_name, input, status')
    .eq('id', actionId)
    .single();
  if (!action) throw new Error('Pending questions not found');
  if (action.status !== 'pending') throw new Error(`Already answered (${action.status})`);
  if (action.tool_name !== 'ask_user') throw new Error('Action is not a question set');
  if (!action.conversation_id) throw new Error('Action has no conversation');

  const { data: wedding } = await supabase
    .from('weddings')
    .select('id, slug')
    .eq('slug', action.wedding_id)
    .single();
  if (!wedding) throw new Error('Wedding not found for action');

  const questions = ((action.input as { questions?: AgentQuestion[] })?.questions ?? []) as AgentQuestion[];

  await supabase
    .from('agent_actions')
    .update({ status: 'confirmed', result: { answers }, resolved_at: new Date().toISOString() })
    .eq('id', actionId);

  const lines = questions.map((q) => `- ${q.prompt} → ${formatAnswer(answers[q.id])}`);
  const note = `${ANSWERS_NOTE_PREFIX} The user answered the questions you asked. Apply these now with the right tools, then continue briefly:\n${lines.join('\n')}`;

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
