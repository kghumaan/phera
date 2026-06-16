import type { AgentToolDefinition } from '../types';

export const knowledgeTools: AgentToolDefinition[] = [
  {
    name: 'search_knowledge',
    label: 'Searching Phera knowledge',
    risk: 'read',
    description:
      'Search Phera\'s knowledge base: vendor directories, venue notes, seasonal/cultural guidance, and logistics know-how — global, per-city, and wedding-specific entries. Call this before answering questions about local vendors, venues, weather/seasonal advice, or city logistics, so recommendations come from curated data rather than memory. An empty result means Phera has no curated entry — say so and fall back to general guidance.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Free-text search over titles and content, e.g. "mehndi artist" or "monsoon"' },
        city: { type: 'string', description: 'City to scope to, e.g. "Udaipur". Defaults to the wedding\'s own city.' },
        category: {
          type: 'string',
          enum: ['vendor', 'venue', 'seasonal', 'cultural', 'logistics'],
          description: 'Optional category filter',
        },
      },
      additionalProperties: false,
    },
    execute: async (input, ctx) => {
      // Default the city scope to the wedding's own location.
      let city = (input.city as string) ?? null;
      if (!city) {
        const { data: wedding } = await ctx.supabase
          .from('weddings')
          .select('venue_location')
          .eq('id', ctx.weddingUuid)
          .single();
        city = wedding?.venue_location?.split(',')[0]?.trim() || null;
      }

      let query = ctx.supabase
        .from('agent_knowledge')
        .select('scope, city, category, title, content')
        .or(
          [
            'scope.eq.global',
            city ? `and(scope.eq.city,city.ilike.%${city.replace(/[%,()]/g, '')}%)` : null,
            `and(scope.eq.wedding,wedding_id.eq.${ctx.weddingSlug})`,
          ]
            .filter(Boolean)
            .join(',')
        )
        .limit(8);
      if (input.category) query = query.eq('category', input.category as string);
      if (input.query) {
        const term = String(input.query).replace(/[%,()]/g, ' ').trim();
        if (term) query = query.or(`title.ilike.%${term}%,content.ilike.%${term}%`);
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return {
        results: (data ?? []).map((k) => ({
          scope: k.scope,
          city: k.city,
          category: k.category,
          title: k.title,
          content: k.content.slice(0, 1200),
        })),
        total: (data ?? []).length,
      };
    },
  },
];
