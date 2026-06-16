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
}

export interface AgentToolDefinition {
  name: string;
  /** Shown to the model. State WHAT it does and WHEN to call it. */
  description: string;
  risk: AgentRiskLevel;
  /** Plain JSON Schema for the tool input (object type). */
  inputSchema: Record<string, unknown>;
  /** Short human label streamed to the chat UI while the tool runs. */
  label: string;
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
  | { type: 'tool_done'; name: string; ok: boolean }
  /** A gated tool call is parked as a pending agent_actions row — the client
   *  must render Confirm/Decline and call /api/agent/confirm to resolve it. */
  | {
      type: 'confirmation_required';
      actionId: string;
      name: string;
      label: string;
      input: Record<string, unknown>;
    }
  /** The agent asked structured questions — the client renders inputs and
   *  resolves via /api/agent/answer. */
  | { type: 'questions_required'; actionId: string; questions: AgentQuestion[] }
  | { type: 'done' }
  | { type: 'error'; message: string };

/** A single question the agent asks via the ask_user tool. The chat renders
 *  the right input per type and collects answers one at a time. */
export type AgentQuestionType = 'text' | 'textarea' | 'date' | 'time' | 'single_select' | 'multi_select';

export interface AgentQuestion {
  id: string;
  prompt: string;
  type: AgentQuestionType;
  options?: string[];
  /** For select types: let the user add their own option(s) too. */
  allowOther?: boolean;
  placeholder?: string;
  optional?: boolean;
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
  }): Promise<ProviderTurnResult>;
}
