import type { SupabaseClient } from '@supabase/supabase-js';
import { buildWeddingSnapshot } from './context';
import { AGENT_SYSTEM_PROMPT } from './system-prompt';
import { getAllTools, dispatchTool } from './tools';
import type {
  AgentChatMessage,
  AgentContentBlock,
  AgentProvider,
  AgentStreamEvent,
  AgentToolContext,
} from './types';

const MAX_TOOL_ROUNDS = 8;
const HISTORY_LIMIT = 40;

export interface RunAgentTurnArgs {
  supabase: SupabaseClient;
  weddingSlug: string;
  weddingUuid: string;
  userId: string;
  conversationId: string;
  userMessage: string;
  provider: AgentProvider;
  onEvent: (event: AgentStreamEvent) => void;
}

async function loadHistory(
  supabase: SupabaseClient,
  conversationId: string
): Promise<AgentChatMessage[]> {
  const { data } = await supabase
    .from('agent_messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(HISTORY_LIMIT);
  return (data ?? [])
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: (m.content ?? []) as AgentContentBlock[],
    }));
}

async function persistMessage(
  supabase: SupabaseClient,
  conversationId: string,
  message: AgentChatMessage
) {
  const { error } = await supabase.from('agent_messages').insert({
    conversation_id: conversationId,
    role: message.role,
    content: message.content,
  });
  if (error) console.error('agent_messages insert failed:', error.message);
}

/**
 * One full agent turn: user message in → model/tool rounds → final reply.
 * Streams progress through onEvent; persists every message so the
 * conversation survives reloads and feeds the future eval harness.
 */
export async function runAgentTurn(args: RunAgentTurnArgs): Promise<void> {
  const { supabase, weddingSlug, weddingUuid, userId, conversationId, provider, onEvent } = args;

  const toolCtx: AgentToolContext = { supabase, weddingSlug, weddingUuid, userId, conversationId };
  const tools = getAllTools();

  const [history, snapshot] = await Promise.all([
    loadHistory(supabase, conversationId),
    buildWeddingSnapshot(supabase, weddingSlug, weddingUuid),
  ]);

  const userMessage: AgentChatMessage = {
    role: 'user',
    content: [{ type: 'text', text: args.userMessage }],
  };
  await persistMessage(supabase, conversationId, userMessage);
  const messages: AgentChatMessage[] = [...history, userMessage];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const result = await provider.streamTurn({
      system: AGENT_SYSTEM_PROMPT,
      snapshot: snapshot.text,
      messages,
      tools,
      onText: (text) => onEvent({ type: 'text_delta', text }),
    });

    if (result.stopReason === 'refusal') {
      onEvent({ type: 'error', message: 'The assistant declined to answer that request.' });
      return;
    }

    const assistantMessage: AgentChatMessage = { role: 'assistant', content: result.content };
    messages.push(assistantMessage);
    await persistMessage(supabase, conversationId, assistantMessage);

    const toolUses = result.content.filter(
      (b): b is Extract<AgentContentBlock, { type: 'tool_use' }> => b.type === 'tool_use'
    );
    if (result.stopReason !== 'tool_use' || toolUses.length === 0) break;

    const toolResults: AgentContentBlock[] = [];
    for (const use of toolUses) {
      onEvent({
        type: 'tool_start',
        name: use.name,
        label: tools.find((t) => t.name === use.name)?.label ?? use.name,
      });
      const dispatched = await dispatchTool(use.name, use.input, toolCtx);
      onEvent({ type: 'tool_done', name: use.name, ok: dispatched.ok });
      toolResults.push({
        type: 'tool_result',
        tool_use_id: use.id,
        content: dispatched.content,
        ...(dispatched.ok ? {} : { is_error: true }),
      });
    }

    const toolMessage: AgentChatMessage = { role: 'user', content: toolResults };
    messages.push(toolMessage);
    await persistMessage(supabase, conversationId, toolMessage);
  }

  await supabase
    .from('agent_conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', conversationId);

  onEvent({ type: 'done' });
}
