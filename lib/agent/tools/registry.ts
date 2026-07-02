import { resolveEffectiveRisk } from '../autonomy';
import type {
  AgentBeforeState,
  AgentDataPanel,
  AgentQuestion,
  AgentToolContext,
  AgentToolDefinition,
  VenueCard,
  WhatsAppBroadcastDraft,
} from '../types';

/**
 * Central tool registry. Every capability the agent has lives here as one
 * declarative entry — a thin wrapper over the existing service layer, so the
 * UI and the agent drive the exact same data paths. To extend the agent,
 * add a tool to one of the domain files in this directory and it shows up
 * in the model's tool list automatically.
 */
const registry = new Map<string, AgentToolDefinition>();

export function registerTools(tools: AgentToolDefinition[]) {
  for (const tool of tools) {
    if (registry.has(tool.name)) {
      throw new Error(`Agent tool already registered: ${tool.name}`);
    }
    registry.set(tool.name, tool);
  }
}

export function getTool(name: string): AgentToolDefinition | undefined {
  return registry.get(name);
}

export function listTools(): AgentToolDefinition[] {
  return Array.from(registry.values());
}

/** Test-only escape hatch so suites can register fixtures without leaking. */
export function clearRegistryForTests() {
  registry.clear();
}

export interface DispatchResult {
  ok: boolean;
  /** JSON-stringified payload handed back to the model as the tool_result. */
  content: string;
  /** Set when a gated tool was parked as a pending agent_actions row. */
  pendingActionId?: string;
  /** Set when ask_user parked questions for the client to render. */
  questions?: AgentQuestion[];
  /** Set when a Pro tool was blocked for a Basic user — the feature name. */
  upgradeRequiredFeature?: string;
  /** Set when request_upload asked the client to render an upload card. */
  uploadKind?: 'guests' | 'rooms';
  /** Set when an FAQ write tool (propose_faqs / add_faq / update_faq) returned the
   *  current FAQ list for the client's review-and-approve panel. Surfaced from
   *  the tool's execute() result — see the normal-execution path below. */
  faqReview?: { id: string; question: string; answer: string }[];
  /** Set when search_vendor_directory returned matches to render as listing cards
   *  in the right pane. Surfaced from the tool's execute() result — see the
   *  normal-execution path below. */
  venueCards?: VenueCard[];
  /** Set when connect_whatsapp asked the client to open the QR pairing panel. */
  whatsappPairing?: { status: string };
  /** Set when broadcast_message drafted a guest broadcast for the review panel. */
  broadcastReview?: WhatsAppBroadcastDraft;
  /** Set when a tool attached a `dataPanel` directive — structured data for the
   *  right pane (guest table, RSVP stats, schedule). The generic mechanism:
   *  new tools ride this key instead of adding another bespoke extractor. */
  dataPanel?: AgentDataPanel;
  /** One-line receipt from the tool's `summary` result key, shown muted in the
   *  chat ("214 RSVPs · 47 no reply") so grounded answers are visibly grounded. */
  summary?: string;
  /** True when a before-snapshot was captured and persisted for this write —
   *  the client may offer an inline Undo. */
  undoable?: boolean;
  /** For parked gated tools: the tool's describe() output (names, not UUIDs),
   *  rendered on the Confirm card. */
  pendingSummary?: string;
}

/** Pull a `faqReview` directive off a tool's execute() result, if present, so the
 *  loop can stream it to the client. The full result (incl. faqReview) is still
 *  handed back to the model as the tool_result content. */
function extractFaqReview(result: unknown): DispatchResult['faqReview'] | undefined {
  if (!result || typeof result !== 'object' || !('faqReview' in result)) return undefined;
  const value = (result as { faqReview?: unknown }).faqReview;
  if (!Array.isArray(value)) return undefined;
  return value as DispatchResult['faqReview'];
}

/** Pull a `venueCards` directive off a tool's execute() result, if present, so the
 *  loop can stream it to the client as listing cards. The full result (incl.
 *  venueCards) is still handed back to the model as the tool_result content. */
function extractVenueCards(result: unknown): DispatchResult['venueCards'] | undefined {
  if (!result || typeof result !== 'object' || !('venueCards' in result)) return undefined;
  const value = (result as { venueCards?: unknown }).venueCards;
  if (!Array.isArray(value)) return undefined;
  return value as DispatchResult['venueCards'];
}

/** Pull a `whatsappPairing` directive off a tool's execute() result so the loop
 *  can tell the client to open the QR pairing panel. */
function extractWhatsappPairing(result: unknown): DispatchResult['whatsappPairing'] | undefined {
  if (!result || typeof result !== 'object' || !('whatsappPairing' in result)) return undefined;
  const value = (result as { whatsappPairing?: unknown }).whatsappPairing;
  if (!value || typeof value !== 'object') return undefined;
  return value as DispatchResult['whatsappPairing'];
}

/** Pull a `broadcastReview` directive off a tool's execute() result so the loop
 *  can stream the drafted broadcast to the client's review panel. */
function extractBroadcastReview(result: unknown): DispatchResult['broadcastReview'] | undefined {
  if (!result || typeof result !== 'object' || !('broadcastReview' in result)) return undefined;
  const value = (result as { broadcastReview?: unknown }).broadcastReview;
  if (!value || typeof value !== 'object') return undefined;
  return value as DispatchResult['broadcastReview'];
}

/** Pull a `dataPanel` directive off a tool's execute() result so the loop can
 *  stream it to the right pane. The generic structured-output channel. */
function extractDataPanel(result: unknown): DispatchResult['dataPanel'] | undefined {
  if (!result || typeof result !== 'object' || !('dataPanel' in result)) return undefined;
  const value = (result as { dataPanel?: unknown }).dataPanel;
  if (!value || typeof value !== 'object') return undefined;
  const panel = value as AgentDataPanel;
  if (panel.kind !== 'table' && panel.kind !== 'stats') return undefined;
  return panel;
}

/** Pull a one-line `summary` receipt off a tool's execute() result. */
function extractSummary(result: unknown): string | undefined {
  if (!result || typeof result !== 'object' || !('summary' in result)) return undefined;
  const value = (result as { summary?: unknown }).summary;
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

const MAX_RESULT_CHARS = 12_000;

function serializeResult(value: unknown): string {
  const raw = typeof value === 'string' ? value : JSON.stringify(value ?? null);
  if (raw.length <= MAX_RESULT_CHARS) return raw;
  return `${raw.slice(0, MAX_RESULT_CHARS)}… [truncated — ask for a narrower slice]`;
}

/**
 * Execute a tool call and audit-log it. Reads are logged too (cheap, and the
 * audit trail doubles as eval data); gated tools refuse until the Phase 2
 * confirmation flow lands.
 */
export async function dispatchTool(
  name: string,
  input: Record<string, unknown>,
  ctx: AgentToolContext
): Promise<DispatchResult> {
  const tool = registry.get(name);
  if (!tool) {
    return { ok: false, content: `Unknown tool: ${name}` };
  }

  // Pro gate: Basic users can't use paid features. Surface an upgrade card
  // instead of executing — the agent explains it's the feature they wanted.
  if (tool.proFeature && !ctx.isPro) {
    return {
      ok: false,
      upgradeRequiredFeature: tool.proFeature,
      content: `UPGRADE REQUIRED — "${tool.proFeature}" is a paid (Premium) feature and this account is on the free Basic plan. An upgrade card is now shown in the chat. Tell the user, in one warm line, that ${tool.proFeature} is a Premium feature (one they asked for) and they can upgrade via the card to unlock it and continue. Do NOT retry this tool.`,
    };
  }

  // request_upload: show an inline upload card (with format help) in the chat.
  if (name === 'request_upload') {
    const kind = input?.kind === 'rooms' ? 'rooms' : 'guests';
    return {
      ok: true,
      uploadKind: kind,
      content: `An upload card for the ${
        kind === 'guests' ? 'guest list (with the recommended columns)' : 'hotel floor plan'
      } is now shown in the chat. The user attaches their file there and the import result arrives as a message. Add one short line inviting them to upload; do not retry.`,
    };
  }

  // ask_user: park the questions; the chat renders inputs and the answers
  // come back via /api/agent/answer as the next user message.
  if (name === 'ask_user') {
    const questions = (input?.questions ?? []) as AgentQuestion[];
    if (!Array.isArray(questions) || questions.length === 0) {
      return { ok: false, content: 'ask_user needs a non-empty "questions" array.' };
    }
    const { data: pending, error } = await ctx.supabase
      .from('agent_actions')
      .insert({
        conversation_id: ctx.conversationId,
        wedding_id: ctx.weddingSlug,
        tool_name: 'ask_user',
        input,
        status: 'pending',
        risk: 'read',
      })
      .select('id')
      .single();
    if (error || !pending) {
      return { ok: false, content: `Could not queue the questions: ${error?.message}` };
    }
    return {
      ok: true,
      pendingActionId: pending.id as string,
      questions,
      content:
        'ASKED — the questions are now shown to the user as input fields. Stop here and wait; their answers arrive as the next message. Do not re-ask in prose.',
    };
  }

  // The user's autonomy dial can downgrade gated→write ("don't ask again") or
  // upgrade write→gated ("always ask me first"). set_autonomy is the one
  // dynamic case: granting autonomy ('auto', or anything malformed) always
  // needs a Confirm tap, while tightening ('ask') or clearing ('default')
  // only reduces the agent's leash, so it applies instantly.
  let effectiveRisk = resolveEffectiveRisk(tool, ctx.autonomy);
  if (name === 'set_autonomy' && (input?.mode === 'ask' || input?.mode === 'default')) {
    effectiveRisk = 'write';
  }

  if (effectiveRisk === 'gated') {
    // Park the call as a pending action; the chat client renders a
    // Confirm/Decline card and /api/agent/confirm resolves it. describe()
    // resolves the raw input to a readable sentence (names, not UUIDs); it's
    // stashed in the row's result JSONB — unused while pending, overwritten
    // at resolution — so a reload can restore the card's summary too.
    const pendingSummary = await tool.describe?.(input ?? {}, ctx).catch(() => undefined);
    const { data: pending, error } = await ctx.supabase
      .from('agent_actions')
      .insert({
        conversation_id: ctx.conversationId,
        wedding_id: ctx.weddingSlug,
        tool_name: name,
        input,
        status: 'pending',
        risk: tool.risk,
        ...(pendingSummary ? { result: { summary: pendingSummary } } : {}),
      })
      .select('id')
      .single();
    if (error || !pending) {
      return { ok: false, content: `Could not queue the action for confirmation: ${error?.message}` };
    }
    return {
      ok: true,
      pendingActionId: pending.id as string,
      ...(pendingSummary ? { pendingSummary } : {}),
      content:
        'PENDING — this action now awaits the user\'s confirmation via a Confirm button shown in the chat. It has NOT executed yet. Briefly tell the user what will happen when they confirm; do not assume or claim it is done.',
    };
  }

  const startedAt = new Date().toISOString();
  // Snapshot what's about to be overwritten so the write is undoable. Never
  // blocks the write: a failed snapshot just means undo can't restore it.
  let before: AgentBeforeState | null = null;
  if (effectiveRisk === 'write' && tool.captureBefore) {
    try {
      before = await tool.captureBefore(input ?? {}, ctx);
    } catch (error) {
      console.error(`captureBefore failed for ${name}:`, error);
    }
  }
  try {
    const result = await tool.execute(input ?? {}, ctx);
    const content = serializeResult(result);
    await logAction(ctx, { name, input, risk: tool.risk, status: 'executed', result: content, startedAt, before });
    const faqReview = extractFaqReview(result);
    const venueCards = extractVenueCards(result);
    const whatsappPairing = extractWhatsappPairing(result);
    const broadcastReview = extractBroadcastReview(result);
    const dataPanel = extractDataPanel(result);
    const summary = extractSummary(result);
    return {
      ok: true,
      content,
      ...(faqReview ? { faqReview } : {}),
      ...(venueCards ? { venueCards } : {}),
      ...(whatsappPairing ? { whatsappPairing } : {}),
      ...(broadcastReview ? { broadcastReview } : {}),
      ...(dataPanel ? { dataPanel } : {}),
      ...(summary ? { summary } : {}),
      ...(before ? { undoable: true } : {}),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await logAction(ctx, { name, input, risk: tool.risk, status: 'failed', result: message, startedAt });
    return { ok: false, content: `Tool failed: ${message}` };
  }
}

async function logAction(
  ctx: AgentToolContext,
  entry: {
    name: string;
    input: Record<string, unknown>;
    risk: string;
    status: 'executed' | 'failed' | 'declined';
    result: string;
    startedAt: string;
    before?: AgentBeforeState | null;
  }
) {
  const row = {
    conversation_id: ctx.conversationId,
    wedding_id: ctx.weddingSlug,
    tool_name: entry.name,
    input: entry.input,
    result: { output: entry.result.slice(0, 4000) },
    status: entry.status,
    risk: entry.risk,
    created_at: entry.startedAt,
    resolved_at: new Date().toISOString(),
  };
  try {
    if (entry.before) {
      // The before column lands with the agentic-ux migration; until it's
      // applied, fall back to the plain row so no audit entry is ever lost.
      const { error } = await ctx.supabase.from('agent_actions').insert({ ...row, before: entry.before });
      if (error) await ctx.supabase.from('agent_actions').insert(row);
    } else {
      await ctx.supabase.from('agent_actions').insert(row);
    }
  } catch (error) {
    // The audit log must never break a conversation turn.
    console.error('agent_actions insert failed:', error);
  }
}
