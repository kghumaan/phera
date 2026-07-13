import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Risk tiers control how a tool executes:
 *  - read:  auto-executes, not persisted to the audit log's "write" view
 *  - write: auto-executes, always audit-logged
 *  - gated: requires an explicit user confirmation before execution (Phase 2)
 */
export type AgentRiskLevel = 'read' | 'write' | 'gated';

/** Everything a tool handler needs. The supabase client is the caller's
 *  authenticated server client, so RLS enforces wedding access on every query. */
export interface AgentToolContext {
  supabase: SupabaseClient;
  /** TEXT slug, e.g. "priya-rahul-2026" — what guests/rooms/content tables key on */
  weddingSlug: string;
  /** weddings.id UUID — what weddings/wedding_events/settings key on */
  weddingUuid: string;
  userId: string;
  conversationId: string;
  /** Whether the account is on a paid plan — gates Pro-only tools. */
  isPro: boolean;
  /** Per-wedding autonomy overrides (tool name → mode): 'auto' skips the
   *  Confirm card on a gated tool, 'ask' parks a write tool behind one.
   *  Absent/empty = every tool runs at its declared risk. */
  autonomy?: Record<string, 'auto' | 'ask'>;
}

/**
 * Pre-write snapshot persisted to agent_actions.before so undo_last_action can
 * reverse the write. Self-describing: 'update' writes the captured values back;
 * 'delete' removes the row the action created (matched by natural key — the
 * undo tool refuses unless the match hits exactly one row); 'delete_many' does
 * the same for a batch insert, and refuses as a whole if ANY of its matches is
 * ambiguous, so a partial half-undone schedule is impossible.
 */
export type AgentBeforeState =
  | { restore: 'update'; table: string; match: Record<string, unknown>; values: Record<string, unknown> }
  | { restore: 'delete'; table: string; match: Record<string, unknown> }
  | { restore: 'delete_many'; table: string; matches: Record<string, unknown>[] };

export interface AgentToolDefinition {
  name: string;
  /** Shown to the model. State WHAT it does and WHEN to call it. */
  description: string;
  risk: AgentRiskLevel;
  /** Plain JSON Schema for the tool input (object type). */
  inputSchema: Record<string, unknown>;
  /** Short human label streamed to the chat UI while the tool runs. */
  label: string;
  /** If set, this tool belongs to a paid ("Pro") feature. For Basic users the
   *  call is blocked and an in-chat upgrade card is shown. The string is the
   *  user-facing feature name, e.g. "Room assignments". */
  proFeature?: string;
  /** Optional, for gated tools: resolve the raw input into ONE human-readable
   *  sentence (names instead of UUIDs) shown on the Confirm card so the user
   *  can inspect exactly what they're approving. Must not mutate anything. */
  describe?: (input: Record<string, unknown>, ctx: AgentToolContext) => Promise<string>;
  /** Optional, for mutating tools: capture exactly the state execute() will
   *  overwrite (or a delete-matcher for a row it will create), so the action
   *  can be reversed by undo_last_action. Runs just before execute(); a
   *  failure here never blocks the write — it only makes it non-undoable. */
  captureBefore?: (input: Record<string, unknown>, ctx: AgentToolContext) => Promise<AgentBeforeState | null>;
  execute: (input: Record<string, unknown>, ctx: AgentToolContext) => Promise<unknown>;
}

/** Provider-portable message content. Mirrors the Anthropic block shapes so the
 *  default provider is zero-conversion; other providers adapt in their layer. */
export type AgentContentBlock =
  | { type: 'text'; text: string }
  | { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> }
  | { type: 'tool_result'; tool_use_id: string; content: string; is_error?: boolean }
  /** Provider-internal block (e.g. Anthropic thinking) carried verbatim so it
   *  can be replayed unchanged on the same model. Other providers skip these. */
  | { type: 'opaque'; provider: string; raw: Record<string, unknown> };

export interface AgentChatMessage {
  role: 'user' | 'assistant';
  content: AgentContentBlock[];
}

/** Events streamed to the chat client over SSE. */
export type AgentStreamEvent =
  | { type: 'conversation'; conversationId: string }
  | { type: 'text_delta'; text: string }
  | { type: 'tool_start'; name: string; label: string }
  /** summary = one-line receipt of what the tool found/changed ("214 RSVPs ·
   *  47 no reply"); undoable = a before-snapshot was captured, so the client
   *  can offer an inline Undo on the receipt. */
  | { type: 'tool_done'; name: string; ok: boolean; summary?: string; undoable?: boolean }
  /** A gated tool call is parked as a pending agent_actions row — the client
   *  must render Confirm/Decline and call /api/agent/confirm to resolve it.
   *  summary = the tool's describe() output (names, not UUIDs) for the card. */
  | {
      type: 'confirmation_required';
      actionId: string;
      name: string;
      label: string;
      input: Record<string, unknown>;
      summary?: string;
    }
  /** The agent asked structured questions — the client renders inputs and
   *  resolves via /api/agent/answer. */
  | { type: 'questions_required'; actionId: string; questions: AgentQuestion[] }
  /** The user reached a Pro-only feature on a Basic plan — render an upgrade card. */
  | { type: 'upgrade_required'; feature: string }
  /** The agent asked the user to upload a file — render an upload card with format help. */
  | { type: 'upload_requested'; uploadKind: 'guests' | 'rooms' }
  /** Anonymous (pre-signup) session: render the inline create-account card.
   *  `required` = the free anonymous allowance is used up, so the composer
   *  locks until the visitor signs up. */
  | { type: 'signup_required'; required?: boolean }
  /** The agent drafted/updated guest FAQs and saved them live (unpublished) — the
   *  client shows a review panel on the right where the couple can expand, edit,
   *  and approve them. Non-blocking: the turn continues normally. */
  | { type: 'faq_review'; faqs: { id: string; question: string; answer: string }[] }
  /** The agent searched the vendor directory — the matching venues/hotels/vendors
   *  render as Airbnb-style listing cards in the right pane. Non-blocking. */
  | { type: 'venue_cards'; vendors: VenueCard[] }
  /** The agent opened the WhatsApp pairing panel — the couple connects their
   *  OWN number via QR. The panel polls /api/whatsapp/connect for QR + status. */
  | { type: 'whatsapp_pairing'; status: string }
  /** The agent drafted a guest broadcast — the right pane shows it for review,
   *  audience confirmation, and a send choice (couple's number / Phera / wa.me). */
  | { type: 'broadcast_review'; draft: WhatsAppBroadcastDraft }
  /** A read tool returned structured data (guest table, RSVP stats, schedule) —
   *  render it as a right-pane panel instead of prose. Non-blocking. */
  | { type: 'data_panel'; panel: AgentDataPanel }
  | { type: 'done' }
  | { type: 'error'; message: string };

/**
 * Generic structured-output payload a tool attaches under the `dataPanel` key
 * of its execute() result (same directive pattern as faqReview/venueCards) —
 * the ONE mechanism for "render this as a table/stats panel", so new tools
 * never need bespoke plumbing. Rows are server-shaped: the model never
 * re-types data, so no transcription errors and no wasted tokens.
 */
export type AgentDataPanel =
  | {
      kind: 'table';
      title: string;
      columns: { key: string; label: string }[];
      rows: Record<string, string | number | null>[];
    }
  | {
      kind: 'stats';
      title: string;
      items: { label: string; value: string; hint?: string }[];
    };

/** One venue/hotel/vendor match rendered as a listing card in the right pane.
 *  Built from a directory VendorRecord — see lib/agent/tools/directory.ts. */
export interface VenueCard {
  name: string;
  /** Human label, e.g. "Wedding Venue" / "Hotel" (already mapped from the enum). */
  category: string;
  city: string;
  country_code: string;
  rating: number | null;
  review_count: number | null;
  price_min: number | null;
  price_max: number | null;
  nri_experienced: boolean;
  specialties: string[];
  website: string | null;
  /** First portfolio image URL, if any. */
  image: string | null;
  /** Google Place ID (for google_places-sourced rows) so the right pane can
   *  fall back to the business's own Google photo via /api/vendors/photo when
   *  there's no portfolio image. Null for non-Google sources. */
  place_id: string | null;
  /** Best-guess guest capacity (venues/hotels only) — rendered behind an
   *  estimate icon, never as a confirmed figure. Null for non-hosting vendors. */
  capacity: { min: number; max: number } | null;
  /** Ballpark all-in 3-day wedding cost in USD (venues/hotels only), shown
   *  behind the same estimate icon. Null for non-hosting vendors. */
  costEstimate: { minUsd: number; maxUsd: number } | null;
}

/** A guest broadcast the agent drafted, shown in the right pane for review +
 *  a send choice. The actual send is the couple's explicit action in the panel
 *  (calls /api/whatsapp/send) — drafting never sends on its own. */
export interface WhatsAppBroadcastDraft {
  message: string;
  /** How the audience was resolved. */
  audience: 'all' | 'tags' | 'specific';
  /** Tags / guest ids that defined the audience (echoed back for the send call). */
  tags: string[];
  guestIds: string[];
  /** How many guests (with a phone) will receive it. */
  count: number;
  /** A few recipient names, for a human-readable confirmation. */
  sampleNames: string[];
  /** True if the couple's own WhatsApp is paired (enables "send as me"). */
  connected: boolean;
}

/** A single question the agent asks via the ask_user tool. The chat renders
 *  the right input per type and collects answers one at a time. */
export type AgentQuestionType =
  | 'text'
  | 'textarea'
  | 'date'
  | 'date_range'
  | 'time'
  | 'single_select'
  | 'multi_select';

export interface AgentQuestion {
  id: string;
  prompt: string;
  /** Optional secondary line shown under the prompt (e.g. "I need help with…"). */
  hint?: string;
  type: AgentQuestionType;
  options?: string[];
  /** For select types: let the user add their own option(s) too. */
  allowOther?: boolean;
  placeholder?: string;
  optional?: boolean;
  /** Hide the speak-to-answer mic for this question (the user must type it).
   *  Used for the onboarding names question. */
  inputOnly?: boolean;
}

export interface ProviderUsage {
  input_tokens: number;
  output_tokens: number;
  cache_read_input_tokens: number;
  cache_creation_input_tokens: number;
}

export interface ProviderTurnResult {
  content: AgentContentBlock[];
  stopReason: string; // 'end_turn' | 'tool_use' | 'max_tokens' | 'refusal' | ...
  usage?: ProviderUsage;
}

export interface AgentProvider {
  /** One model round: given history (+ system + snapshot), stream text deltas
   *  via onText and resolve with the full assistant content blocks. */
  streamTurn(opts: {
    system: string;
    snapshot: string;
    messages: AgentChatMessage[];
    tools: AgentToolDefinition[];
    onText?: (text: string) => void;
    /** Optimize for latency over deliberation (voice): disable extended
     *  thinking and allow a faster model. */
    fast?: boolean;
    /** Explicit model override for this turn (e.g. a fast model for the
     *  narrow onboarding path). Wins over fast/env defaults. */
    model?: string;
  }): Promise<ProviderTurnResult>;
}
