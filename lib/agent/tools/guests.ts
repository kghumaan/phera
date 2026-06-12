import { generateFallbackColor } from '@/lib/utils/avatar-generator';
import type { AgentToolContext, AgentToolDefinition } from '../types';

type GuestRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  wedding_side: string | null;
  logistics_data: Record<string, unknown> | null;
  outreach_status: string | null;
  whatsapp_opted_out: boolean | null;
};

const GUEST_COLUMNS =
  'id, name, email, phone, wedding_side, logistics_data, outreach_status, whatsapp_opted_out';

function compactGuest(g: GuestRow) {
  const logistics = (g.logistics_data ?? {}) as Record<string, unknown>;
  return {
    id: g.id,
    name: g.name,
    email: g.email,
    phone: g.phone,
    side: g.wedding_side,
    party_size: logistics.party_size ?? 1,
    tags: logistics.tags ?? logistics.tag ?? null,
    plus_one_name: logistics.plus_one_name ?? null,
    outreach_status: g.outreach_status,
  };
}

/** rsvps.attending is 'yes' | 'no' | 'maybe' today, but legacy rows may hold booleans. */
export function normalizeAttending(value: unknown): 'yes' | 'no' | 'maybe' | null {
  if (typeof value === 'boolean') return value ? 'yes' : 'no';
  if (value === 'yes' || value === 'no' || value === 'maybe') return value;
  return null;
}

async function fetchGuestRsvps(ctx: AgentToolContext, guestIds: string[]) {
  if (guestIds.length === 0) return new Map<string, unknown[]>();
  const { data } = await ctx.supabase
    .from('rsvps')
    .select('guest_id, event_id, attending, guest_count, dietary_restrictions, song_request')
    .eq('wedding_id', ctx.weddingSlug)
    .in('guest_id', guestIds);
  const byGuest = new Map<string, unknown[]>();
  for (const r of data ?? []) {
    const list = byGuest.get(r.guest_id) ?? [];
    list.push({
      event_id: r.event_id,
      attending: normalizeAttending(r.attending),
      guest_count: r.guest_count,
      dietary: r.dietary_restrictions,
      song_request: r.song_request,
    });
    byGuest.set(r.guest_id, list);
  }
  return byGuest;
}

export const guestTools: AgentToolDefinition[] = [
  {
    name: 'list_guests',
    label: 'Looking up guests',
    risk: 'read',
    description:
      'List guests for this wedding, optionally filtered by a name search, wedding side, or RSVP status. Returns up to `limit` guests (default 40) plus the total count. Call this when the user asks about their guest list, who is attending, or before updating a specific guest whose ID you do not know.',
    inputSchema: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Case-insensitive name fragment' },
        side: { type: 'string', enum: ['bride', 'groom', 'both'] },
        rsvp_status: {
          type: 'string',
          enum: ['attending', 'not_attending', 'maybe', 'no_response'],
          description: 'Filter by overall RSVP state',
        },
        limit: { type: 'integer', description: 'Max guests to return (default 40, max 100)' },
        offset: { type: 'integer' },
      },
      additionalProperties: false,
    },
    execute: async (input, ctx) => {
      const limit = Math.min(Number(input.limit) || 40, 100);
      const offset = Number(input.offset) || 0;
      let query = ctx.supabase
        .from('guests')
        .select(GUEST_COLUMNS, { count: 'exact' })
        .eq('wedding_id', ctx.weddingSlug)
        .order('name')
        .range(offset, offset + limit - 1);
      if (input.search) query = query.ilike('name', `%${input.search}%`);
      if (input.side) query = query.eq('wedding_side', input.side as string);
      const { data, count, error } = await query;
      if (error) throw new Error(error.message);

      const guests = (data ?? []) as GuestRow[];
      const rsvps = await fetchGuestRsvps(ctx, guests.map((g) => g.id));
      let rows = guests.map((g) => {
        const guestRsvps = (rsvps.get(g.id) ?? []) as Array<{ attending: string | null }>;
        const status = guestRsvps.some((r) => r.attending === 'yes')
          ? 'attending'
          : guestRsvps.some((r) => r.attending === 'maybe')
            ? 'maybe'
            : guestRsvps.some((r) => r.attending === 'no')
              ? 'not_attending'
              : 'no_response';
        return { ...compactGuest(g), rsvp_status: status };
      });
      if (input.rsvp_status) rows = rows.filter((r) => r.rsvp_status === input.rsvp_status);
      return { total: count ?? rows.length, returned: rows.length, guests: rows };
    },
  },
  {
    name: 'get_guest',
    label: 'Reading guest profile',
    risk: 'read',
    description:
      'Get one guest\'s full profile by guest ID: contact info, party details, all RSVP responses per event, and flight info if any. Call this when the conversation focuses on a specific guest.',
    inputSchema: {
      type: 'object',
      properties: { guest_id: { type: 'string' } },
      required: ['guest_id'],
      additionalProperties: false,
    },
    execute: async (input, ctx) => {
      const { data: guest, error } = await ctx.supabase
        .from('guests')
        .select('*')
        .eq('wedding_id', ctx.weddingSlug)
        .eq('id', input.guest_id as string)
        .single();
      if (error || !guest) throw new Error('Guest not found');
      const [rsvps, flight] = await Promise.all([
        fetchGuestRsvps(ctx, [guest.id]),
        ctx.supabase
          .from('guest_flights')
          .select('airline, flight_number, arrival_date, arrival_time, departure_date')
          .eq('guest_id', guest.id)
          .maybeSingle(),
      ]);
      return {
        ...compactGuest(guest as GuestRow),
        is_family_liaison: guest.is_family_liaison,
        whatsapp_opted_out: guest.whatsapp_opted_out,
        logistics_data: guest.logistics_data,
        rsvps: rsvps.get(guest.id) ?? [],
        flight: flight.data ?? null,
      };
    },
  },
  {
    name: 'get_rsvp_summary',
    label: 'Tallying RSVPs',
    risk: 'read',
    description:
      'Get RSVP totals for the wedding: per event, how many parties said yes/no and the total expected headcount, plus how many guests have not responded. Call this for questions like "how many people are coming?".',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    execute: async (_input, ctx) => {
      const [{ count: guestCount }, { data: rsvps, error }] = await Promise.all([
        ctx.supabase
          .from('guests')
          .select('id', { count: 'exact', head: true })
          .eq('wedding_id', ctx.weddingSlug),
        ctx.supabase
          .from('rsvps')
          .select('event_id, attending, guest_count, guest_id')
          .eq('wedding_id', ctx.weddingSlug),
      ]);
      if (error) throw new Error(error.message);
      const byEvent = new Map<
        string,
        { yes: number; no: number; maybe: number; headcount: number }
      >();
      const responded = new Set<string>();
      for (const r of rsvps ?? []) {
        if (r.guest_id) responded.add(r.guest_id);
        const key = r.event_id ?? 'general';
        const entry = byEvent.get(key) ?? { yes: 0, no: 0, maybe: 0, headcount: 0 };
        const attending = normalizeAttending(r.attending);
        if (attending === 'yes') {
          entry.yes += 1;
          entry.headcount += r.guest_count ?? 1;
        } else if (attending === 'no') entry.no += 1;
        else if (attending === 'maybe') entry.maybe += 1;
        byEvent.set(key, entry);
      }
      return {
        total_guests: guestCount ?? 0,
        responded: responded.size,
        no_response: Math.max(0, (guestCount ?? 0) - responded.size),
        by_event: Object.fromEntries(byEvent),
      };
    },
  },
  {
    name: 'add_guest',
    label: 'Adding a guest',
    risk: 'write',
    description:
      'Add a single guest to the guest list. Call this when the user names someone to invite. For bulk imports, point the user to the Guest List import wizard instead.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        email: { type: 'string' },
        phone: { type: 'string', description: 'Include country code, e.g. +1415...' },
        side: { type: 'string', enum: ['bride', 'groom', 'both'] },
        party_size: { type: 'integer', description: 'Total people in this party including the guest (default 1)' },
        tags: { type: 'array', items: { type: 'string' } },
      },
      required: ['name'],
      additionalProperties: false,
    },
    execute: async (input, ctx) => {
      const logistics: Record<string, unknown> = {};
      if (input.party_size) logistics.party_size = input.party_size;
      if (input.tags) logistics.tags = input.tags;
      const { data, error } = await ctx.supabase
        .from('guests')
        .insert({
          wedding_id: ctx.weddingSlug,
          name: input.name as string,
          email: (input.email as string) ?? null,
          phone: (input.phone as string) ?? null,
          wedding_side: (input.side as string) ?? null,
          avatar_color: generateFallbackColor(input.name as string),
          ...(Object.keys(logistics).length > 0 ? { logistics_data: logistics } : {}),
        })
        .select('id, name')
        .single();
      if (error) throw new Error(error.message);
      return { created: data };
    },
  },
  {
    name: 'record_rsvp',
    label: 'Recording an RSVP',
    risk: 'write',
    description:
      'Record or change a guest\'s RSVP on the couple\'s behalf — e.g. when the user says someone confirmed, cancelled, or is unsure. attending is yes/no/maybe; guest_count is how many people from their party are coming (defaults to their party size for yes, 0 for no). Use list_guests first if you only have a name.',
    inputSchema: {
      type: 'object',
      properties: {
        guest_id: { type: 'string' },
        attending: { type: 'string', enum: ['yes', 'no', 'maybe'] },
        guest_count: { type: 'integer', description: 'People attending from this party' },
        event_id: { type: 'string', description: "Event identifier; omit for the wedding overall ('general')" },
      },
      required: ['guest_id', 'attending'],
      additionalProperties: false,
    },
    execute: async (input, ctx) => {
      const eventId = (input.event_id as string) || 'general';
      const { data: guest } = await ctx.supabase
        .from('guests')
        .select('id, name, logistics_data')
        .eq('wedding_id', ctx.weddingSlug)
        .eq('id', input.guest_id as string)
        .single();
      if (!guest) throw new Error('Guest not found');

      const partySize =
        Number((guest.logistics_data as Record<string, unknown> | null)?.party_size) || 1;
      const guestCount =
        input.guest_count !== undefined
          ? Number(input.guest_count)
          : input.attending === 'yes'
            ? partySize
            : 0;

      const { data: existing } = await ctx.supabase
        .from('rsvps')
        .select('id')
        .eq('wedding_id', ctx.weddingSlug)
        .eq('guest_id', guest.id)
        .eq('event_id', eventId)
        .maybeSingle();

      if (existing) {
        const { error } = await ctx.supabase
          .from('rsvps')
          .update({ attending: input.attending as string, guest_count: guestCount })
          .eq('id', existing.id);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await ctx.supabase.from('rsvps').insert({
          wedding_id: ctx.weddingSlug,
          guest_id: guest.id,
          event_id: eventId,
          attending: input.attending as string,
          guest_count: guestCount,
        });
        if (error) throw new Error(error.message);
      }
      return { guest: guest.name, attending: input.attending, guest_count: guestCount, event_id: eventId };
    },
  },
  {
    name: 'update_guest',
    label: 'Updating a guest',
    risk: 'write',
    description:
      'Update one guest\'s contact info, side, party size, or tags. Call this when the user corrects or adds guest details. Use list_guests first if you only have a name. logistics fields are merged, not replaced.',
    inputSchema: {
      type: 'object',
      properties: {
        guest_id: { type: 'string' },
        name: { type: 'string' },
        email: { type: 'string' },
        phone: { type: 'string' },
        side: { type: 'string', enum: ['bride', 'groom', 'both'] },
        party_size: { type: 'integer' },
        tags: { type: 'array', items: { type: 'string' } },
        notes: { type: 'string', description: 'Free-form planning note stored on the guest' },
      },
      required: ['guest_id'],
      additionalProperties: false,
    },
    execute: async (input, ctx) => {
      const updates: Record<string, unknown> = {};
      if (input.name !== undefined) updates.name = input.name;
      if (input.email !== undefined) updates.email = input.email;
      if (input.phone !== undefined) updates.phone = input.phone;
      if (input.side !== undefined) updates.wedding_side = input.side;

      if (input.party_size !== undefined || input.tags !== undefined || input.notes !== undefined) {
        const { data: current } = await ctx.supabase
          .from('guests')
          .select('logistics_data')
          .eq('wedding_id', ctx.weddingSlug)
          .eq('id', input.guest_id as string)
          .single();
        const logistics = { ...((current?.logistics_data as Record<string, unknown>) ?? {}) };
        if (input.party_size !== undefined) logistics.party_size = input.party_size;
        if (input.tags !== undefined) logistics.tags = input.tags;
        if (input.notes !== undefined) logistics.agent_notes = input.notes;
        updates.logistics_data = logistics;
      }
      if (Object.keys(updates).length === 0) throw new Error('No updatable fields provided');

      const { data, error } = await ctx.supabase
        .from('guests')
        .update(updates)
        .eq('wedding_id', ctx.weddingSlug)
        .eq('id', input.guest_id as string)
        .select('id, name')
        .single();
      if (error) throw new Error(error.message);
      return { updated: data, fields: Object.keys(updates) };
    },
  },
];
