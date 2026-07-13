import type { SupabaseClient } from '@supabase/supabase-js';
import { buildWeddingSnapshot } from './context';
import { getUserIsPro } from './plan';
import { readAutonomy } from './autonomy';
import { maybeCompactConversation } from './compact';
import { HIDDEN_KICKOFF_PREFIX } from './message-prefixes';
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
  /** Anonymous (pre-signup) landing-page session — the snapshot tells the model
   *  to weave in the signup moment via request_signup. */
  isAnonymous?: boolean;
  /** The route just created this conversation, so there is no history to load —
   *  skips two DB round-trips on the latency-critical first turn. */
  isNewConversation?: boolean;
  /** Question ids this turn is answering (set by resolveAgentAnswers). Used to
   *  tell a scripted intake card apart from any other ask_user card. */
  answeredQuestionIds?: string[];
  onEvent: (event: AgentStreamEvent) => void;
}

/**
 * The ids of the scripted onboarding intake cards (see system-prompt.ts
 * ONBOARDING). Answering one of these is pure fact-recording, so it can run on
 * the fast model. Any OTHER card answered during onboarding — a budget, a
 * plan-before-you-build multi-select — is judgment work and stays on the full
 * model. Unknown ids fall back to the full model, so drift is safe by default.
 */
export const INTAKE_QUESTION_IDS = new Set([
  'couple_names',
  'planning_stage',
  'planning_city',
  'venue_name',
  'celebration_dates',
  'planning_goals',
]);

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

/**
 * Enforce Anthropic's tool_use↔tool_result pairing across the ENTIRE window, not
 * just its edges: every tool_result must reference a tool_use in the immediately
 * preceding assistant message, and every tool_use must be answered by a
 * tool_result in the immediately following user message. Orphans — left by an
 * interrupted turn or a split pair — are dropped, and any message emptied out is
 * removed. Without this ONE corrupted turn 400s the whole conversation forever
 * ("unexpected tool_use_id … no corresponding tool_use block").
 */
export function sanitizeToolPairing(messages: AgentChatMessage[]): AgentChatMessage[] {
  const msgs = messages.map((m) => ({ role: m.role, content: [...m.content] }));

  // Drop tool_results whose tool_use isn't in the immediately preceding message.
  for (let i = 0; i < msgs.length; i++) {
    if (msgs[i].role !== 'user' || !msgs[i].content.some((b) => b.type === 'tool_result')) continue;
    const prev = msgs[i - 1];
    const useIds = new Set(
      prev?.role === 'assistant' ? prev.content.flatMap((b) => (b.type === 'tool_use' ? [b.id] : [])) : []
    );
    msgs[i].content = msgs[i].content.filter((b) => b.type !== 'tool_result' || useIds.has(b.tool_use_id));
  }

  // Drop tool_uses not answered by a tool_result in the immediately next message.
  for (let i = 0; i < msgs.length; i++) {
    if (msgs[i].role !== 'assistant' || !msgs[i].content.some((b) => b.type === 'tool_use')) continue;
    const next = msgs[i + 1];
    const resultIds = new Set(
      next?.role === 'user' ? next.content.flatMap((b) => (b.type === 'tool_result' ? [b.tool_use_id] : [])) : []
    );
    msgs[i].content = msgs[i].content.filter((b) => b.type !== 'tool_use' || resultIds.has(b.id));
  }

  // Anthropic rejects messages with empty content — drop any left with none.
  return msgs.filter((m) => m.content.length > 0);
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
    sanitizeToolPairing(
      (data ?? [])
        .reverse()
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: (m.content ?? []) as AgentContentBlock[],
        }))
    )
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
  message: AgentChatMessage,
  // Explicit timestamp keeps reload ordering correct even though these inserts
  // run concurrently (off the turn's critical path) rather than awaited in turn.
  createdAt?: string
) {
  const { error } = await supabase.from('agent_messages').insert({
    conversation_id: conversationId,
    role: message.role,
    content: message.content,
    ...(createdAt ? { created_at: createdAt } : {}),
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

  const [history, snapshot, isPro, autonomy] = await Promise.all([
    args.isNewConversation ? Promise.resolve([] as AgentChatMessage[]) : loadHistory(supabase, conversationId),
    buildWeddingSnapshot(supabase, weddingSlug, weddingUuid),
    getUserIsPro(supabase, userId),
    readAutonomy(supabase, weddingSlug),
  ]);
  snapshot.text += `\nPlan: ${isPro ? 'Pro (all features unlocked)' : 'Basic / free — Room assignments, Transportation, and Vendor coordination require an upgrade'}`;
  const autonomyEntries = Object.entries(autonomy);
  if (autonomyEntries.length > 0) {
    snapshot.text += `\nAutonomy overrides (set by the user): ${autonomyEntries
      .map(([t, m]) => `${t} = ${m === 'auto' ? 'auto-approved, no Confirm card' : 'always ask first (Confirm card appears)'}`)
      .join('; ')}`;
  }
  if (args.isAnonymous) {
    snapshot.text +=
      `\nAccount: ANONYMOUS — a landing-page visitor trying Phera before signing up (see the "Anonymous visitors" rules).`;
    if (args.isNewConversation) {
      snapshot.text +=
        ` This message is their first contact, typed into the landing-page chat box: address it directly — no congratulations opener.`;
    }
  }
  if (args.voice) {
    snapshot.text +=
      `\n\nMODALITY: The user is in HANDS-FREE VOICE mode. Your reply is read aloud and they answer by speaking. ` +
      `Do NOT use ask_user. This OVERRIDES the ONBOARDING rule: never render the onboarding questions as a card. ` +
      `Instead ask, in ONE short spoken sentence, what they'd like help with and where they are in planning, then call set_planning_goals with their goals and stage. ` +
      `Ask everything else conversationally in plain prose too, ONE question at a time. ` +
      `request_upload IS allowed: when they want to add many guests or a room block, call it so a big upload panel appears in voice, and say in one line that they can upload now or skip for now. ` +
      `When something needs a paid upgrade, still call the tool: a big upgrade panel appears in voice. Say in one short line that it's a Premium feature they can upgrade for now or later, then move on. ` +
      `Keep replies short and natural to hear: prefer brief sentences and end each with a normal period. ` +
      `Never use a "…" ellipsis or an em dash (it forces a long pause in speech); use separate short sentences or commas instead. ` +
      `Avoid bullet lists, tables, and long enumerations; say the few items that matter.`;
  }

  const toolCtx: AgentToolContext = { supabase, weddingSlug, weddingUuid, userId, conversationId, isPro, autonomy };
  const tools = getAllTools();

  // DB writes run off the critical path (collected here, flushed before the turn
  // ends) so the model isn't blocked on Supabase between rounds. Explicit
  // ordered timestamps preserve reload order despite concurrent inserts.
  const turnStart = Date.now();
  let seq = 0;
  const stamp = () => new Date(turnStart + seq++).toISOString();
  const pendingWrites: Promise<unknown>[] = [];

  const userMessage: AgentChatMessage = {
    role: 'user',
    content: [{ type: 'text', text: args.userMessage }],
  };
  pendingWrites.push(persistMessage(supabase, conversationId, userMessage, stamp()));
  const messages: AgentChatMessage[] = [...history, userMessage];

  const usageTotals = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, rounds: 0 };
  // Per-turn failure counter so a broken tool can't be retried into the round
  // cap: on the 2nd consecutive failure the tool_result tells the model to
  // stop, explain, and offer the human-handoff path instead.
  const failCounts = new Map<string, number>();
  // Whether the round cap cut the turn off mid-tool-use — if so we force one
  // final text-only round so the user never gets a silent stall.
  let cappedMidToolUse = false;

  // ONBOARDING FAST PATH: answers to the scripted intake cards (names → stage →
  // city → goals) are narrow, high-traffic fact-recording — a fast model handles
  // them indistinguishably at a fraction of the latency (evals 2026-07-13: Haiku
  // 22/22 on the card fixtures, ~30% faster than Sonnet on identical turns).
  //
  // Everything else stays on the full model, including during onboarding:
  //  - FREE-TEXT turns — a first message can be a brain-dump or a real request
  //    (eval'd: fast models dropped facts and skipped act-first drafting).
  //  - NON-INTAKE cards — the budget question that gates venue/vendor options,
  //    a plan-before-you-build multi-select. Those are judgment, not stenography.
  const onboardingPhase = snapshot.text.includes('Planning goals: NOT SET');
  const answeredIds = args.answeredQuestionIds ?? [];
  const intakeCardTurn =
    args.userMessage.startsWith('⟦answers⟧') &&
    answeredIds.length > 0 &&
    answeredIds.every((id) => INTAKE_QUESTION_IDS.has(id));
  const useFastPath = onboardingPhase && intakeCardTurn;
  const onboardingModel = useFastPath
    ? process.env.AGENT_ONBOARDING_MODEL || 'claude-haiku-4-5-20251001'
    : undefined;

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const result = await provider.streamTurn({
      system: AGENT_SYSTEM_PROMPT,
      snapshot: snapshot.text,
      messages,
      tools,
      onText: (text) => onEvent({ type: 'text_delta', text }),
      fast: args.voice || useFastPath, // latency-optimized (no extended thinking)
      model: onboardingModel,
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
      await Promise.allSettled(pendingWrites);
      return;
    }

    const assistantMessage: AgentChatMessage = { role: 'assistant', content: result.content };
    messages.push(assistantMessage);
    pendingWrites.push(persistMessage(supabase, conversationId, assistantMessage, stamp()));

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
      onEvent({
        type: 'tool_done',
        name: use.name,
        ok: dispatched.ok,
        ...(dispatched.summary ? { summary: dispatched.summary } : {}),
        ...(dispatched.undoable ? { undoable: true } : {}),
      });
      if (dispatched.questions) parkedQuestions = true;
      // FAQ review is non-blocking — surface the panel and let the turn continue.
      if (dispatched.faqReview) onEvent({ type: 'faq_review', faqs: dispatched.faqReview });
      // Venue/vendor matches render as listing cards in the right pane — also
      // non-blocking; the turn continues so the agent can frame them in chat.
      if (dispatched.venueCards) onEvent({ type: 'venue_cards', vendors: dispatched.venueCards });
      // WhatsApp pairing + broadcast review open right-pane panels — non-blocking.
      if (dispatched.whatsappPairing) {
        onEvent({ type: 'whatsapp_pairing', status: dispatched.whatsappPairing.status });
      }
      if (dispatched.broadcastReview) {
        onEvent({ type: 'broadcast_review', draft: dispatched.broadcastReview });
      }
      // Structured data (guest table / RSVP stats / schedule) — non-blocking.
      if (dispatched.dataPanel) {
        onEvent({ type: 'data_panel', panel: dispatched.dataPanel });
      }
      if (dispatched.signupRequired) {
        onEvent({ type: 'signup_required' });
      } else if (dispatched.uploadKind) {
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
          ...(dispatched.pendingSummary ? { summary: dispatched.pendingSummary } : {}),
        });
      }
      // Two strikes on the same tool this turn → tell the model to stop
      // retrying and route around it (explain + offer the team hand-off).
      let content = dispatched.content;
      if (!dispatched.ok) {
        const fails = (failCounts.get(use.name) ?? 0) + 1;
        failCounts.set(use.name, fails);
        if (fails >= 2) {
          content +=
            '\n\n[SYSTEM NOTE: This tool has now failed ' +
            String(fails) +
            ' times this turn. Do NOT call it again. Tell the user plainly what failed and where in the app they can do it manually, and offer to pass it to the Phera team (submit_request, kind "support").]';
        }
      }
      toolResults.push({
        type: 'tool_result',
        tool_use_id: use.id,
        content,
        ...(dispatched.ok ? {} : { is_error: true }),
      });
    }

    const toolMessage: AgentChatMessage = { role: 'user', content: toolResults };
    messages.push(toolMessage);
    pendingWrites.push(persistMessage(supabase, conversationId, toolMessage, stamp()));

    // Questions are now in front of the user — end the turn instead of letting
    // the model add a redundant "I'll wait for your answers" line.
    if (parkedQuestions) break;
    if (round === MAX_TOOL_ROUNDS - 1) cappedMidToolUse = true;
  }

  // The round cap cut the turn off while the model still wanted tools — force
  // one text-only wrap-up so the user never gets a silent stall with no reply.
  if (cappedMidToolUse) {
    const nudge: AgentChatMessage = {
      role: 'user',
      content: [
        {
          type: 'text',
          text: `${HIDDEN_KICKOFF_PREFIX} Tool-round limit reached for this turn. Reply to the user NOW in plain text — in one or two short sentences say what you completed, what's still unfinished, and the single next step. Do not call any more tools.`,
        },
      ],
    };
    messages.push(nudge);
    pendingWrites.push(persistMessage(supabase, conversationId, nudge, stamp()));
    const wrapUp = await provider.streamTurn({
      system: AGENT_SYSTEM_PROMPT,
      snapshot: snapshot.text,
      messages,
      tools,
      onText: (text) => onEvent({ type: 'text_delta', text }),
      fast: args.voice,
    });
    // Keep only the text — an unanswered tool_use here would corrupt pairing.
    const textOnly = wrapUp.content.filter((b) => b.type === 'text');
    if (textOnly.length > 0) {
      pendingWrites.push(
        persistMessage(supabase, conversationId, { role: 'assistant', content: textOnly }, stamp())
      );
    }
  }

  // Ensure all message writes have landed before compaction reads them back and
  // before the turn ends. These ran concurrently with the model rounds, so the
  // user already heard the streamed reply — this tail doesn't delay them.
  await Promise.allSettled(pendingWrites);

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
