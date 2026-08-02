import type { AgentToolDefinition } from '../types';
import { setAutonomyMode } from '../autonomy';
import { getTool } from './registry';

/**
 * The user's autonomy dial as a tool: "stop asking me about X" / "always ask
 * me before Y" / "back to normal". Overrides persist per-wedding via
 * lib/agent/autonomy.ts and the dispatcher resolves them into each tool's
 * effective risk. Granting 'auto' is itself gated (one final Confirm tap —
 * the agent can never quietly widen its own leash); 'ask' and 'default'
 * only tighten or reset, so they apply instantly.
 */

export const autonomyTools: AgentToolDefinition[] = [
  {
    name: 'set_autonomy',
    label: 'Adjusting how much I check first',
    risk: 'gated',
    description:
      'Call when the user wants to change how much you confirm before acting. Mode "auto" = "stop asking me about X" — only valid for tools that normally show a Confirm card. Mode "ask" = "always ask me before Y" — for tools that normally run automatically. Mode "default" = "back to normal" — clears any override. Granting "auto" shows one final Confirm card; "ask" and "default" apply instantly.',
    inputSchema: {
      type: 'object',
      properties: {
        tool_name: {
          type: 'string',
          description: 'Exact name of the tool whose confirmation behaviour to change (e.g. "update_guest")',
        },
        mode: {
          type: 'string',
          enum: ['auto', 'ask', 'default'],
          description: '"auto" = run without confirming, "ask" = always confirm first, "default" = clear the override',
        },
      },
      required: ['tool_name', 'mode'],
      additionalProperties: false,
    },
    describe: async (input) => {
      const toolName = input.tool_name as string;
      const label = getTool(toolName)?.label ?? toolName;
      return `Stop asking before "${label}" — it will run automatically from now on (say "ask me first" anytime to turn confirmations back on).`;
    },
    execute: async (input, ctx) => {
      const toolName = input.tool_name as string;
      const mode = input.mode as 'auto' | 'ask' | 'default';
      const target = getTool(toolName);
      if (!target) {
        throw new Error(`No tool named "${toolName}" — use the exact tool name (e.g. "update_guest").`);
      }
      if (mode === 'auto' && target.risk !== 'gated') {
        throw new Error(
          `"${toolName}" already runs without a Confirm card — "auto" only applies to actions that normally ask first.`
        );
      }
      if (mode === 'ask' && target.risk !== 'write') {
        throw new Error(
          target.risk === 'gated'
            ? `"${toolName}" already asks for confirmation every time — no override needed.`
            : `"${toolName}" only reads data, so there's nothing to confirm before.`
        );
      }
      const overrides = await setAutonomyMode(
        ctx.supabase,
        ctx.weddingSlug,
        toolName,
        mode === 'default' ? null : mode
      );
      const summary =
        mode === 'auto'
          ? `Won't ask before "${target.label}" anymore`
          : mode === 'ask'
            ? `Will always ask before "${target.label}"`
            : `"${target.label}" is back to its normal confirmations`;
      return { tool: toolName, mode, overrides, summary };
    },
  },
];
