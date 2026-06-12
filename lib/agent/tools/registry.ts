import type { AgentToolContext, AgentToolDefinition } from '../types';

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
  if (tool.risk === 'gated') {
    const content =
      'This action requires user confirmation, which is not available yet. Tell the user to make this change in the admin UI for now.';
    await logAction(ctx, {
      name,
      input,
      risk: tool.risk,
      status: 'declined',
      result: content,
      startedAt: new Date().toISOString(),
    });
    return { ok: false, content };
  }

  const startedAt = new Date().toISOString();
  try {
    const result = await tool.execute(input ?? {}, ctx);
    const content = serializeResult(result);
    await logAction(ctx, { name, input, risk: tool.risk, status: 'executed', result: content, startedAt });
    return { ok: true, content };
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
  }
) {
  try {
    await ctx.supabase.from('agent_actions').insert({
      conversation_id: ctx.conversationId,
      wedding_id: ctx.weddingSlug,
      tool_name: entry.name,
      input: entry.input,
      result: { output: entry.result.slice(0, 4000) },
      status: entry.status,
      risk: entry.risk,
      created_at: entry.startedAt,
      resolved_at: new Date().toISOString(),
    });
  } catch (error) {
    // The audit log must never break a conversation turn.
    console.error('agent_actions insert failed:', error);
  }
}
