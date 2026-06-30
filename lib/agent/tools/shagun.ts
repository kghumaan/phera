import type { AgentToolContext, AgentToolDefinition } from '../types';

/**
 * Shagun ledger — the digital version of the bahi / vyavahar notebook a family
 * keeps of the cash/gifts (shagun) received at the wedding. Stored per guest in
 * guests.logistics_data.shagun (merged, never replaced) so it needs no new
 * table. PRIVATE to the couple — never shown to guests, never a take-rate.
 * See docs/MONETIZATION.md (free ledger = a culturally-native Free→Pro hook).
 */

interface ShagunEntry {
  amount: number;
  currency: string;
  gift_type: string;
  note?: string;
}

export const shagunTools: AgentToolDefinition[] = [
  {
    name: 'record_shagun',
    label: 'Recording a gift',
    risk: 'write',
    description:
      "Record a shagun (cash or gift) a guest gave, in the couple's private gift ledger. Shagun is the cash/envelope or gift given at Indian weddings — this digitizes the notebook families keep. Requires the guest_id (use list_guests first if you only have a name) and an amount. Currency defaults to USD; gift_type defaults to 'cash'. Never expose this to guests.",
    inputSchema: {
      type: 'object',
      properties: {
        guest_id: { type: 'string' },
        amount: { type: 'number', description: 'Value of the gift (non-negative)' },
        currency: { type: 'string', description: "e.g. USD, INR, GBP. Defaults to USD." },
        gift_type: { type: 'string', enum: ['cash', 'gold', 'gift', 'other'], description: "Defaults to 'cash'" },
        note: { type: 'string', description: 'Optional free-form note, e.g. "gold bangles"' },
      },
      required: ['guest_id', 'amount'],
      additionalProperties: false,
    },
    execute: async (input, ctx) => {
      const amount = Number(input.amount);
      if (!Number.isFinite(amount) || amount < 0) {
        throw new Error('Amount must be a non-negative number.');
      }
      const { data: guest } = await ctx.supabase
        .from('guests')
        .select('id, name, logistics_data')
        .eq('wedding_id', ctx.weddingSlug)
        .eq('id', input.guest_id as string)
        .single();
      if (!guest) throw new Error('Guest not found — use list_guests to find them first.');

      const logistics = { ...((guest.logistics_data as Record<string, unknown>) ?? {}) };
      const shagun: ShagunEntry = {
        amount,
        currency: (input.currency as string)?.trim() || 'USD',
        gift_type: (input.gift_type as string) || 'cash',
        ...(input.note ? { note: input.note as string } : {}),
      };
      logistics.shagun = shagun;

      const { error } = await ctx.supabase
        .from('guests')
        .update({ logistics_data: logistics })
        .eq('wedding_id', ctx.weddingSlug)
        .eq('id', guest.id);
      if (error) throw new Error(error.message);
      return { recorded: { guest: guest.name, ...shagun } };
    },
  },
  {
    name: 'get_shagun_ledger',
    label: 'Reading the shagun ledger',
    risk: 'read',
    description:
      "Read the couple's private shagun (gift) ledger — who gave what, with per-currency totals. Call this for questions about gifts received, totals, or to prepare thank-yous. Couple-only; never share with guests.",
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    execute: async (_input, ctx) => {
      const { data, error } = await ctx.supabase
        .from('guests')
        .select('id, name, logistics_data')
        .eq('wedding_id', ctx.weddingSlug)
        .order('name');
      if (error) throw new Error(error.message);

      const entries: Array<{ guest: string; amount: number; currency: string; gift_type: string; note: string | null }> = [];
      const totals: Record<string, number> = {};
      for (const g of data ?? []) {
        const shagun = (g.logistics_data as Record<string, unknown> | null)?.shagun as ShagunEntry | undefined;
        if (!shagun || typeof shagun.amount !== 'number') continue;
        const currency = shagun.currency || 'USD';
        entries.push({
          guest: g.name,
          amount: shagun.amount,
          currency,
          gift_type: shagun.gift_type ?? 'cash',
          note: shagun.note ?? null,
        });
        totals[currency] = (totals[currency] ?? 0) + shagun.amount;
      }
      return { count: entries.length, totals, entries };
    },
  },
];
