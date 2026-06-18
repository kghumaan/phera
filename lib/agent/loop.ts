import type { SupabaseClient } from '@supabase/supabase-js';
import { buildWeddingSnapshot } from './context';
import { getUserIsPro } from './plan';
import { maybeCompactConversation } from './compact';
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
/** A held turn lock older than this is treated as a crashed turn. */
const TURN_LOCK_STALE_MS = 3 * 60_000;

export class TurnInProgressError extends Error {
  constructor() {
    super('Another request is already being processed for this conversation.');
    this.name = 'TurnInProgressError';
  }
}

export interface RunAgentTurnArgs {
  supabase: SupabaseClient;
  weddingSlug: string;
  weddingUuid: string;
  userId: string;
  conversationId: string;
  userMessage: string;
  provider: AgentProvider;
  /** Hands-free voice mode — agent should reply conversationally, no cards. */
  voice?: boolean;
  onEvent: (event: AgentStreamEvent) => void;
}

/**
 * A truncated window can start with tool_results whose tool_use was cut off,
 * or (after a crashed turn) end with an unanswered tool_use — both are API
 * errors. Trim the edges until the window is self-consistent.
 */
export function sanitizeHistoryWindow(messages: AgentChatMessage[]): AgentChatMessage[] {
  const window = [...messages];
  while (
    window.length > 0 &&
    (window[0].role !== 'user' || window[0].content.some((b) => b.type === 'tool_result'))
  ) {
    window.shift();
  }
  while (
    window.length > 0 &&
    window[window.length - 1].role === 'assistant' &&
    window[window.length - 1].content.some((b) => b.type === 'tool_use')
  ) {
    window.pop();
  }
  return window;
}

async function loadHistory(
  supabase: SupabaseClient,
  conversationId: string
): Promise<AgentChatMessage[]> {
  // Rolling summary of compacted turns (fail-open pre-migration).
  let summary: string | null = null;
  let summaryThrough: string | null = null;
  try {
    const { data } = await supabase
      .from('agent_conversations')
      .select('summary, summary_through')
      .eq('id', conversationId)
      .single();
    summary = data?.summary ?? null;
    summaryThrough = data?.summary_through ?? null;
  } catch {
    /* lifecycle columns not migrated yet */
  }

  // Newest messages win: fetch descending, then restore chronological order.
  let query = supabase
    .from('agent_messages')
    .select('role, content, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(HISTORY_LIMIT);
  if (summaryThrough) query = query.gt('created_at', summaryThrough);
  const { data } = await query;

  const window = sanitizeHistoryWindow(
    (data ?? [])
      .reverse()
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: (m.content ?? []) as AgentContentBlock[],
      }))
  );

  if (summary) {
    window.unshift({
      role: 'user',
      content: [
        {
          type: 'text',
          text: `⟦summary⟧ Notes from the earlier part of this conversation (already handled — context only):\n${summary}`,
        },
      ],
    });
  }
  return window;
}

/** Atomically claim the conversation's turn lock; stale locks are stolen. */
async function acquireTurnLock(supabase: SupabaseClient, conversationId: string): Promise<boolean> {
  try {
    const staleBefore = new Date(Date.now() - TURN_LOCK_STALE_MS).toISOString();
    const { data, error } = await supabase
      .from('agent_conversations')
      .update({ turn_started_at: new Date().toISOString() })
      .eq('id', conversationId)
      .or(`turn_started_at.is.null,turn_started_at.lt.${staleBefore}`)
      .select('id');
    if (error) {
      // Pre-migration (missing column) or filter error — fail open, loudly.
      console.error('[agent] turn lock acquire failed open:', error.message);
      return true;
    }
    return (data ?? []).length > 0;
  } catch {
    return true;
  }
}

async function releaseTurnLock(supabase: SupabaseClient, conversationId: string) {
  try {
    await supabase
      .from('agent_conversations')
      .update({ turn_started_at: null })
      .eq('id', conversationId);
  } catch {
    /* fail open */
  }
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
  const { supabase, conversationId } = args;

  if (!(await acquireTurnLock(supabase, conversationId))) {
    throw new TurnInProgressError();
  }
  try {
    await runAgentTurnLocked(args);
  } finally {
    await releaseTurnLock(supabase, conversationId);
  }
}

async function runAgentTurnLocked(args: RunAgentTurnArgs): Promise<void> {
  const { supabase, weddingSlug, weddingUuid, userId, conversationId, provider, onEvent } = args;

  const [history, snapshot, isPro] = await Promise.all([
    loadHistory(supabase, conversationId),
    buildWeddingSnapshot(supabase, weddingSlug, weddingUuid),
    getUserIsPro(supabase, userId),
  ]);
  snapshot.text += `\nPlan: ${isPro ? 'Pro (all features unlocked)' : 'Basic / free — Room assignments, Transportation, and Vendor coordination require an upgrade'}`;
  if (args.voice) {
    snapshot.text +=
      `\n\nMODALITY: The user is in HANDS-FREE VOICE mode — your reply is read aloud and they answer by speaking. Ask questions conversationally in plain prose, ONE at a time; do NOT use ask_user, request_upload, or any on-screen cards. Keep replies short and natural to hear. Avoid bullet lists, tables, and long enumerations — say the few items that matter.`;
  }

  const toolCtx: AgentToolContext = { supabase, weddingSlug, weddingUuid, userId, conversationId, isPro };
  const tools = getAllTools();

  const userMessage: AgentChatMessage = {
    role: 'user',
    content: [{ type: 'text', text: args.userMessage }],
  };
  await persistMessage(supabase, conversationId, userMessage);
  const messages: AgentChatMessage[] = [...history, userMessage];

  const usageTotals = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, rounds: 0 };

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const result = await provider.streamTurn({
      system: AGENT_SYSTEM_PROMPT,
      snapshot: snapshot.text,
      messages,
      tools,
      onText: (text) => onEvent({ type: 'text_delta', text }),
    });

    if (result.usage) {
      usageTotals.input += result.usage.input_tokens;
      usageTotals.output += result.usage.output_tokens;
      usageTotals.cacheRead += result.usage.cache_read_input_tokens;
      usageTotals.cacheWrite += result.usage.cache_creation_input_tokens;
      usageTotals.rounds += 1;
    }

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
    let parkedQuestions = false;
    for (const use of toolUses) {
      const label = tools.find((t) => t.name === use.name)?.label ?? use.name;
      onEvent({ type: 'tool_start', name: use.name, label });
      const dispatched = await dispatchTool(use.name, use.input, toolCtx);
      onEvent({ type: 'tool_done', name: use.name, ok: dispatched.ok });
      if (dispatched.questions) parkedQuestions = true;
      if (dispatched.uploadKind) {
        onEvent({ type: 'upload_requested', uploadKind: dispatched.uploadKind });
      } else if (dispatched.upgradeRequiredFeature) {
        onEvent({ type: 'upgrade_required', feature: dispatched.upgradeRequiredFeature });
      } else if (dispatched.pendingActionId && dispatched.questions) {
        onEvent({
          type: 'questions_required',
          actionId: dispatched.pendingActionId,
          questions: dispatched.questions,
        });
      } else if (dispatched.pendingActionId) {
        onEvent({
          type: 'confirmation_required',
          actionId: dispatched.pendingActionId,
          name: use.name,
          label,
          input: use.input,
        });
      }
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

    // Questions are now in front of the user — end the turn instead of letting
    // the model add a redundant "I'll wait for your answers" line.
    if (parkedQuestions) break;
  }

  await supabase
    .from('agent_conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', conversationId);

  // Cost/caching telemetry — cacheRead ≈ 0 on repeat turns means the prompt
  // cache is being invalidated somewhere (see lib/agent/providers/anthropic.ts).
  console.log(
    `[agent] turn ${conversationId.slice(0, 8)} rounds=${usageTotals.rounds} in=${usageTotals.input} out=${usageTotals.output} cacheRead=${usageTotals.cacheRead} cacheWrite=${usageTotals.cacheWrite}`
  );

  // Roll older turns into the conversation summary once the window outgrows
  // the history limit. Synchronous (serverless would kill a dangling promise)
  // but rare — only fires when the post-watermark message count crosses the
  // threshold.
  await maybeCompactConversation(supabase, conversationId, provider);

  onEvent({ type: 'done' });
}
