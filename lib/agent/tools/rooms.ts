import type { AgentToolDefinition } from '../types';

export const roomTools: AgentToolDefinition[] = [
  {
    name: 'list_rooms',
    label: 'Reading room assignments',
    risk: 'read',
    proFeature: 'Room assignments',
    description:
      'List hotel rooms with capacity and the names of guests assigned to each, plus which rooms have open spots. Call this for any question about rooms, hotel blocks, or who sleeps where.',
    inputSchema: {
      type: 'object',
      properties: {
        hotel_name: { type: 'string', description: 'Filter to one hotel' },
        only_with_space: { type: 'boolean', description: 'Only rooms with unfilled capacity' },
      },
      additionalProperties: false,
    },
    execute: async (input, ctx) => {
      let query = ctx.supabase
        .from('wedding_rooms')
        .select('id, room_number, floor, hotel_name, bed_type, capacity, notes, assigned_guest_ids')
        .eq('wedding_id', ctx.weddingSlug)
        .order('hotel_name')
        .order('room_number');
      if (input.hotel_name) query = query.ilike('hotel_name', `%${input.hotel_name}%`);
      const { data: rooms, error } = await query;
      if (error) throw new Error(error.message);

      const allGuestIds = [...new Set((rooms ?? []).flatMap((r) => r.assigned_guest_ids ?? []))];
      const guestNames = new Map<string, string>();
      if (allGuestIds.length > 0) {
        const { data: guests } = await ctx.supabase
          .from('guests')
          .select('id, name')
          .eq('wedding_id', ctx.weddingSlug)
          .in('id', allGuestIds);
        for (const g of guests ?? []) guestNames.set(g.id, g.name);
      }

      let rows = (rooms ?? []).map((r) => {
        const assigned = (r.assigned_guest_ids ?? []).map(
          (id: string) => guestNames.get(id) ?? `unknown(${id})`
        );
        const capacity = r.capacity ?? null;
        return {
          id: r.id,
          room_number: r.room_number,
          hotel: r.hotel_name,
          floor: r.floor,
          bed_type: r.bed_type,
          capacity,
          assigned,
          open_spots: capacity === null ? null : Math.max(0, capacity - assigned.length),
          notes: r.notes,
        };
      });
      if (input.only_with_space) rows = rows.filter((r) => (r.open_spots ?? 0) > 0);
      return { rooms: rows, total: rows.length };
    },
  },
  {
    name: 'update_room',
    label: 'Updating a room',
    risk: 'write',
    proFeature: 'Room assignments',
    description:
      'Update one room\'s details: capacity, bed type, floor, hotel name, or notes. Does NOT change guest assignments — use assign_guests_to_room for that.',
    inputSchema: {
      type: 'object',
      properties: {
        room_id: { type: 'string' },
        capacity: { type: 'integer' },
        bed_type: { type: 'string' },
        floor: { type: 'string' },
        hotel_name: { type: 'string' },
        notes: { type: 'string' },
      },
      required: ['room_id'],
      additionalProperties: false,
    },
    execute: async (input, ctx) => {
      const updates: Record<string, unknown> = {};
      for (const f of ['capacity', 'bed_type', 'floor', 'hotel_name', 'notes'] as const) {
        if (input[f] !== undefined) updates[f] = input[f];
      }
      if (Object.keys(updates).length === 0) throw new Error('No updatable fields provided');
      const { data, error } = await ctx.supabase
        .from('wedding_rooms')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('wedding_id', ctx.weddingSlug)
        .eq('id', input.room_id as string)
        .select('id, room_number')
        .single();
      if (error) throw new Error(error.message);
      return { updated: data, fields: Object.keys(updates) };
    },
  },
  {
    name: 'assign_guests_to_room',
    label: 'Reassigning a room',
    risk: 'gated',
    proFeature: 'Room assignments',
    description:
      'Replace the set of guests assigned to a room (pass the full new list of guest IDs). Use after list_rooms and list_guests to know the IDs. This is a sensitive change and requires user confirmation.',
    inputSchema: {
      type: 'object',
      properties: {
        room_id: { type: 'string' },
        guest_ids: { type: 'array', items: { type: 'string' } },
      },
      required: ['room_id', 'guest_ids'],
      additionalProperties: false,
    },
    execute: async (input, ctx) => {
      const { data, error } = await ctx.supabase
        .from('wedding_rooms')
        .update({
          assigned_guest_ids: input.guest_ids as string[],
          updated_at: new Date().toISOString(),
        })
        .eq('wedding_id', ctx.weddingSlug)
        .eq('id', input.room_id as string)
        .select('id, room_number, assigned_guest_ids')
        .single();
      if (error) throw new Error(error.message);
      return { updated: data };
    },
  },
];
