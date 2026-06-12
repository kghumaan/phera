import type { SupabaseClient } from '@supabase/supabase-js';
import type { AgentChatMessage, AgentContentBlock, AgentProvider } from './types';

/**
 * Conversation compaction: once a conversation outgrows the model's history
 * window, the older turns are distilled into a rolling summary stored on
 * agent_conversations (summary + summary_through watermark). loadHistory
 * then sends [summary] + [recent messages] instead of silently dropping
 * older context.
 *
 * Fail-open by design: if the lifecycle columns haven't been migrated yet,
 * every function here quietly no-ops.
 */

/** Compact when more than this many messages sit after the watermark… */
export const COMPACT_THRESHOLD = 60;
/** …and keep this many of the newest messages verbatim. */
export const COMPACT_KEEP = 40;

const SUMMARIZE_SYSTEM = `You compress wedding-planning conversations between a couple and their AI planner into dense factual notes for the planner's own memory.

Write a summary under 350 words covering, in this order:
1. Decisions made and data changed (dates, venue, guests added/cancelled, rooms, schedule, FAQs, tasks) — include names and numbers.
2. The user's stated preferences and constraints.
3. Open questions or actions still pending.

If an "Earlier summary" is provided, fold its facts in — nothing from it may be lost unless contradicted by newer messages. Output only the summary text.`;

function transcriptLine(message: AgentChatMessage): string | null {
  const parts: string[] = [];
  for (const block of message.content) {
    if (block.type === 'text' && block.text.trim()) parts.push(block.text.trim());
    else if (block.type === 'tool_use') parts.push(`[called ${block.name} ${JSON.stringify(block.input).slice(0, 200)}]`);
    else if (block.type === 'tool_result') parts.push(`[tool result: ${block.content.slice(0, 200)}]`);
  }
  if (parts.length === 0) return null;
  return `${message.role.toUpperCase()}: ${parts.join(' ')}`;
}

export async function maybeCompactConversation(
  supabase: SupabaseClient,
  conversationId: string,
  provider: AgentProvider
): Promise<void> {
  let conversation: { summary: string | null; summary_through: string | null } | null = null;
  try {
    const { data, error } = await supabase
      .from('agent_conversations')
      .select('summary, summary_through')
      .eq('id', conversationId)
      .single();
    if (error || !data) return; // columns missing (pre-migration) or row gone
    conversation = data;
  } catch {
    return;
  }

  let query = supabase
    .from('agent_messages')
    .select('role, content, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(300);
  if (conversation.summary_through) query = query.gt('created_at', conversation.summary_through);
  const { data: messages } = await query;
  if (!messages || messages.length <= COMPACT_THRESHOLD) return;

  const toSummarize = messages.slice(0, messages.length - COMPACT_KEEP);
  const transcript = toSummarize
    .map((m) =>
      transcriptLine({ role: m.role as 'user' | 'assistant', content: (m.content ?? []) as AgentContentBlock[] })
    )
    .filter(Boolean)
    .join('\n');

  const prompt = `${conversation.summary ? `Earlier summary:\n${conversation.summary}\n\n` : ''}Conversation to compress:\n${transcript}`;

  try {
    const result = await provider.streamTurn({
      system: SUMMARIZE_SYSTEM,
      snapshot: '(none)',
      messages: [{ role: 'user', content: [{ type: 'text', text: prompt }] }],
      tools: [],
    });
    const summary = result.content
      .filter((b): b is Extract<AgentContentBlock, { type: 'text' }> => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();
    if (!summary) return;

    await supabase
      .from('agent_conversations')
      .update({
        summary,
        summary_through: toSummarize[toSummarize.length - 1].created_at,
      })
      .eq('id', conversationId);
    console.log(`[agent] compacted conversation ${conversationId.slice(0, 8)}: ${toSummarize.length} messages → summary`);
  } catch (error) {
    // Compaction is best-effort; the next turn will try again.
    console.error('Conversation compaction failed:', error);
  }
}
