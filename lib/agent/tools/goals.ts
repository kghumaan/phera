import type { AgentToolDefinition } from '../types';

/** Stored as a wedding-scoped agent_knowledge row so it persists across
 *  conversations and shows up in the wedding snapshot every turn. */
export const GOALS_TITLE = 'Planning goals';

export const goalsTools: AgentToolDefinition[] = [
  {
    name: 'set_planning_goals',
    label: 'Saving your goals',
    risk: 'write',
    description:
      'Record what the couple wants help with — their high-level goals (e.g. wedding website, RSVPs, room assignments, registry, full planning). Call this right after they answer the "what would you like help with?" question, and again whenever their goals change. These shape what you focus on.',
    inputSchema: {
      type: 'object',
      properties: {
        goals: { type: 'array', items: { type: 'string' }, description: 'The selected goals/areas they want help with' },
      },
      required: ['goals'],
      additionalProperties: false,
    },
    execute: async (input, ctx) => {
      const goals = (input.goals as string[]) ?? [];
      // Replace any prior goals row for this wedding.
      await ctx.supabase
        .from('agent_knowledge')
        .delete()
        .eq('wedding_id', ctx.weddingSlug)
        .eq('scope', 'wedding')
        .eq('title', GOALS_TITLE);
      const { error } = await ctx.supabase.from('agent_knowledge').insert({
        scope: 'wedding',
        wedding_id: ctx.weddingSlug,
        category: 'logistics',
        title: GOALS_TITLE,
        content: goals.join(', '),
        metadata: { goals },
      });
      if (error) throw new Error(error.message);
      return { saved: goals };
    },
  },
];
