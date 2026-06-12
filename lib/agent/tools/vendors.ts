import type { AgentToolDefinition } from '../types';

export const vendorTools: AgentToolDefinition[] = [
  {
    name: 'get_vendors',
    label: 'Reading vendors',
    risk: 'read',
    description:
      'List the wedding\'s vendors (name, category, status, contact) and any open action items from vendor conversations. Call this for questions like "have we sorted the caterer?" or "what vendors are missing?".',
    inputSchema: {
      type: 'object',
      properties: {
        category: { type: 'string', description: 'Filter, e.g. "catering", "photography"' },
      },
      additionalProperties: false,
    },
    execute: async (input, ctx) => {
      let query = ctx.supabase
        .from('vendors')
        .select('id, name, category, status, phone, email, notes')
        .eq('wedding_id', ctx.weddingUuid)
        .order('category');
      if (input.category) query = query.ilike('category', `%${input.category}%`);
      const { data: vendors, error } = await query;
      if (error) throw new Error(error.message);

      const { data: insights } = await ctx.supabase
        .from('vendor_insights')
        .select('vendor_id, insight_type, priority, is_completed')
        .eq('wedding_id', ctx.weddingUuid)
        .eq('is_completed', false)
        .limit(100);

      const openByVendor = new Map<string, number>();
      for (const i of insights ?? []) {
        if (!i.vendor_id) continue;
        openByVendor.set(i.vendor_id, (openByVendor.get(i.vendor_id) ?? 0) + 1);
      }

      return {
        vendors: (vendors ?? []).map((v) => ({
          id: v.id,
          name: v.name,
          category: v.category,
          status: v.status,
          phone: v.phone,
          email: v.email,
          open_action_items: openByVendor.get(v.id) ?? 0,
        })),
        total: (vendors ?? []).length,
      };
    },
  },
  {
    name: 'add_vendor',
    label: 'Adding a vendor',
    risk: 'write',
    description:
      'Add a vendor to track (name + category, optional contact). Call this when the user mentions hiring or talking to a vendor not yet in the list.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        category: { type: 'string', description: 'e.g. catering, photography, decor, music' },
        phone: { type: 'string' },
        email: { type: 'string' },
        notes: { type: 'string' },
      },
      required: ['name', 'category'],
      additionalProperties: false,
    },
    execute: async (input, ctx) => {
      const { data, error } = await ctx.supabase
        .from('vendors')
        .insert({
          wedding_id: ctx.weddingUuid,
          name: input.name as string,
          category: input.category as string,
          phone: (input.phone as string) ?? null,
          email: (input.email as string) ?? null,
          notes: (input.notes as string) ?? null,
          status: 'active',
        })
        .select('id, name, category')
        .single();
      if (error) throw new Error(error.message);
      return { created: data };
    },
  },
];
