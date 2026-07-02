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
      const withSpace = rows.filter((r) => (r.open_spots ?? 0) > 0).length;
      // Capped at 60 rows to stay well inside the tool-result serialization cap.
      const panelRows = rows.slice(0, 60);
      return {
        rooms: rows,
        total: rows.length,
        summary: `${rows.length} room${rows.length === 1 ? '' : 's'} · ${withSpace} with space`,
        ...(rows.length > 0
          ? {
              dataPanel: {
                kind: 'table' as const,
                title: `Rooms${rows.length > panelRows.length ? ` (first ${panelRows.length} of ${rows.length})` : ''}`,
                columns: [
                  { key: 'room', label: 'Room' },
                  { key: 'hotel', label: 'Hotel' },
                  { key: 'capacity', label: 'Capacity' },
                  { key: 'assigned', label: 'Assigned' },
                  { key: 'open', label: 'Open' },
                ],
                rows: panelRows.map((r) => ({
                  room: r.room_number,
                  hotel: r.hotel,
                  capacity: r.capacity,
                  assigned: r.assigned.join(', ') || null,
                  open: r.open_spots,
                })),
              },
            }
          : {}),
      };
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
    captureBefore: async (input, ctx) => {
      const { data: room } = await ctx.supabase
        .from('wedding_rooms')
        .select('capacity, bed_type, floor, hotel_name, notes')
        .eq('wedding_id', ctx.weddingSlug)
        .eq('id', input.room_id as string)
        .maybeSingle();
      if (!room) return null;
      return {
        restore: 'update',
        table: 'wedding_rooms',
        match: { wedding_id: ctx.weddingSlug, id: input.room_id as string },
        values: room,
      };
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
      'Replace the set of guests assigned to a room (pass the full new list of guest IDs). Use after list_rooms and list_guests to know the IDs. This is a sensitive change and requires user confirmation — pass `reason`: one short user-facing sentence of why, grounded in the data you read (capacity, who, what changes).',
    inputSchema: {
      type: 'object',
      properties: {
        room_id: { type: 'string' },
        guest_ids: { type: 'array', items: { type: 'string' } },
        reason: {
          type: 'string',
          description: 'One short sentence of why, grounded in data — shown to the user on the Confirm card.',
        },
      },
      required: ['room_id', 'guest_ids'],
      additionalProperties: false,
    },
    // Confirm-card summary: resolve the raw UUIDs to a readable sentence so
    // the user can inspect exactly what they're approving.
    describe: async (input, ctx) => {
      const guestIds = (input.guest_ids ?? []) as string[];
      const [{ data: room }, { data: guests }] = await Promise.all([
        ctx.supabase
          .from('wedding_rooms')
          .select('room_number, hotel_name, assigned_guest_ids')
          .eq('wedding_id', ctx.weddingSlug)
          .eq('id', input.room_id as string)
          .maybeSingle(),
        guestIds.length
          ? ctx.supabase.from('guests').select('id, name').eq('wedding_id', ctx.weddingSlug).in('id', guestIds)
          : Promise.resolve({ data: [] as { id: string; name: string }[] }),
      ]);
      const names = new Map((guests ?? []).map((g) => [g.id, g.name]));
      const who = guestIds.map((id) => names.get(id) ?? 'unknown guest').join(', ') || 'nobody (clears the room)';
      const where = room
        ? `Room ${room.room_number}${room.hotel_name ? ` at ${room.hotel_name}` : ''}`
        : 'this room';
      const replaces = (room?.assigned_guest_ids ?? []).length;
      return `${where} → ${who}${replaces ? ` (replaces the current ${replaces} assigned)` : ''}`;
    },
    // Undo snapshot: the assignment list this write is about to replace.
    captureBefore: async (input, ctx) => {
      const { data: room } = await ctx.supabase
        .from('wedding_rooms')
        .select('assigned_guest_ids')
        .eq('wedding_id', ctx.weddingSlug)
        .eq('id', input.room_id as string)
        .maybeSingle();
      if (!room) return null;
      return {
        restore: 'update',
        table: 'wedding_rooms',
        match: { wedding_id: ctx.weddingSlug, id: input.room_id as string },
        values: { assigned_guest_ids: room.assigned_guest_ids ?? [] },
      };
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
