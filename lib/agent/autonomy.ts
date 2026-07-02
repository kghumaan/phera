import type { SupabaseClient } from '@supabase/supabase-js';
import type { AgentRiskLevel, AgentToolDefinition } from './types';

/**
 * Per-wedding autonomy overrides — the user's dial for how much the agent does
 * without asking. Stored as a wedding-scoped agent_knowledge row (same pattern
 * as Planning goals and the spine focus — no migration needed), keyed tool
 * name → mode:
 *  - 'auto': a gated tool executes immediately (they ticked "don't ask again")
 *  - 'ask':  a write tool parks behind a Confirm card ("always ask me first")
 * Both partners share the wedding, so overrides are wedding-scoped by design.
 */
export const AUTONOMY_TITLE = 'Autonomy preferences';

export type AutonomyMode = 'auto' | 'ask';
export type AutonomyMap = Record<string, AutonomyMode>;

export async function readAutonomy(supabase: SupabaseClient, weddingSlug: string): Promise<AutonomyMap> {
  try {
    const { data } = await supabase
      .from('agent_knowledge')
      .select('metadata')
      .eq('wedding_id', weddingSlug)
      .eq('scope', 'wedding')
      .eq('title', AUTONOMY_TITLE)
      .maybeSingle();
    const meta = (data?.metadata ?? {}) as Record<string, unknown>;
    const map: AutonomyMap = {};
    for (const [tool, mode] of Object.entries(meta)) {
      if (mode === 'auto' || mode === 'ask') map[tool] = mode;
    }
    return map;
  } catch {
    // Fail-safe: no overrides means every tool runs at its declared risk.
    return {};
  }
}

/** Set (or clear, with mode null) one tool's autonomy override. */
export async function setAutonomyMode(
  supabase: SupabaseClient,
  weddingSlug: string,
  toolName: string,
  mode: AutonomyMode | null
): Promise<AutonomyMap> {
  const current = await readAutonomy(supabase, weddingSlug);
  if (mode) current[toolName] = mode;
  else delete current[toolName];

  await supabase
    .from('agent_knowledge')
    .delete()
    .eq('wedding_id', weddingSlug)
    .eq('scope', 'wedding')
    .eq('title', AUTONOMY_TITLE);
  const entries = Object.entries(current);
  if (entries.length > 0) {
    const { error } = await supabase.from('agent_knowledge').insert({
      scope: 'wedding',
      wedding_id: weddingSlug,
      category: 'logistics',
      title: AUTONOMY_TITLE,
      content: entries.map(([t, m]) => `${t}: ${m === 'auto' ? 'auto-approved' : 'ask first'}`).join('; '),
      metadata: current,
    });
    if (error) throw new Error(error.message);
  }
  return current;
}

/**
 * The risk a tool actually runs at for this wedding. 'auto' downgrades gated →
 * write (skip the Confirm card); 'ask' upgrades write → gated (park behind
 * one). Reads are never overridable, and set_autonomy itself is exempt so the
 * agent can never be granted the power to self-grant autonomy.
 */
export function resolveEffectiveRisk(
  tool: Pick<AgentToolDefinition, 'name' | 'risk'>,
  autonomy: AutonomyMap | undefined
): AgentRiskLevel {
  if (tool.risk === 'read' || tool.name === 'set_autonomy' || !autonomy) return tool.risk;
  const mode = autonomy[tool.name];
  if (tool.risk === 'gated' && mode === 'auto') return 'write';
  if (tool.risk === 'write' && mode === 'ask') return 'gated';
  return tool.risk;
}
