import type { AgentBeforeState, AgentToolDefinition } from '../types';

/**
 * Undo: reverses the most recent data change the agent made by replaying the
 * pre-write snapshot the dispatcher captured (agent_actions.before — see
 * captureBefore in types.ts). Each snapshot restores exactly one write:
 * 'update' puts the overwritten values back, 'delete' removes a row the
 * action created. Once reverted, the audit row flips to status 'reverted'
 * so the same change can never be double-undone.
 */

export const undoTools: AgentToolDefinition[] = [
  {
    name: 'undo_last_action',
    label: 'Undoing the last change',
    risk: 'write',
    description:
      'Call when the user wants to reverse the most recent data change the agent made ("undo that", "no, put it back"). Restores the state captured just before the write and tells you what was restored — say it back plainly. Pass tool_name to target a specific kind of change (e.g. only undo the last "update_guest").',
    inputSchema: {
      type: 'object',
      properties: {
        tool_name: {
          type: 'string',
          description: 'Optional: only undo the most recent change made by this specific tool',
        },
      },
      additionalProperties: false,
    },
    execute: async (input, ctx) => {
      let query = ctx.supabase
        .from('agent_actions')
        .select('id, tool_name, input, before, created_at')
        .eq('wedding_id', ctx.weddingSlug)
        .in('status', ['executed', 'confirmed'])
        .not('before', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1);
      if (typeof input.tool_name === 'string' && input.tool_name) {
        query = query.eq('tool_name', input.tool_name);
      }
      const { data, error } = await query;
      if (error) {
        // Pre-migration (agent_actions.before missing) this select errors —
        // degrade to the same gentle answer as "no snapshots yet".
        console.error('undo_last_action lookup failed:', error.message);
        return {
          undone: false,
          note: 'Nothing undoable found — undo covers data changes made after the undo upgrade, and each change can only be reverted once.',
        };
      }
      const row = data?.[0];
      if (!row) {
        return {
          undone: false,
          note: 'Nothing undoable found — undo covers data changes made after the undo upgrade, and each change can only be reverted once.',
        };
      }

      const before = row.before as AgentBeforeState;
      if (before.restore === 'update') {
        // Write the captured values back over whatever the action changed.
        const { error: restoreError } = await ctx.supabase
          .from(before.table)
          .update(before.values)
          .match(before.match);
        if (restoreError) throw new Error(restoreError.message);
      } else if (before.restore === 'delete_many') {
        // Batch insert (e.g. a whole drafted schedule). Resolve every natural
        // key FIRST — if any one is ambiguous or already gone, undo nothing, so
        // the couple never ends up with half a schedule.
        const ids: string[] = [];
        for (const match of before.matches) {
          const { data: matches, error: matchError } = await ctx.supabase
            .from(before.table)
            .select('id')
            .match(match);
          if (matchError) throw new Error(matchError.message);
          if (!matches || matches.length !== 1) {
            return {
              undone: false,
              note: `Refused to undo: ${!matches?.length ? 'one of the rows that change created no longer exists' : 'a created row is ambiguous'} in ${before.table}, so undoing could remove the wrong thing.`,
            };
          }
          ids.push(matches[0].id as string);
        }
        const { error: deleteError } = await ctx.supabase
          .from(before.table)
          .delete()
          .in('id', ids);
        if (deleteError) throw new Error(deleteError.message);
      } else {
        // 'delete': remove the row the action created — but only if the
        // natural-key match hits exactly one row, so undo can never guess.
        const { data: matches, error: matchError } = await ctx.supabase
          .from(before.table)
          .select('id')
          .match(before.match);
        if (matchError) throw new Error(matchError.message);
        if (!matches || matches.length === 0) {
          return {
            undone: false,
            note: `Refused to undo: the row that change created in ${before.table} no longer exists — it may already have been removed or edited.`,
          };
        }
        if (matches.length > 1) {
          return {
            undone: false,
            note: `Refused to undo: ${matches.length} rows in ${before.table} match the created row, so deleting could remove the wrong one.`,
          };
        }
        const { error: deleteError } = await ctx.supabase
          .from(before.table)
          .delete()
          .eq('id', matches[0].id);
        if (deleteError) throw new Error(deleteError.message);
      }

      // Mark the audit row reverted so this change can't be undone twice. The
      // restore itself succeeded, so a pre-migration CHECK constraint that
      // rejects 'reverted' must not fail the undo — log and move on.
      const { error: markError } = await ctx.supabase
        .from('agent_actions')
        .update({ status: 'reverted', resolved_at: new Date().toISOString() })
        .eq('id', row.id);
      if (markError) {
        console.error(`Could not mark agent_action ${row.id} reverted:`, markError.message);
      }

      return {
        undone: true,
        reverted_tool: row.tool_name,
        restored: before,
        summary: `Reverted ${(row.tool_name as string).replace(/_/g, ' ')}`,
      };
    },
  },
];
