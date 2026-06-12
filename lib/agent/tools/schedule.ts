import { WeddingService } from '@/lib/supabase/wedding-service';
import type { AgentToolDefinition } from '../types';

export const scheduleTools: AgentToolDefinition[] = [
  {
    name: 'get_schedule',
    label: 'Reading the schedule',
    risk: 'read',
    description:
      'Get the full multi-day schedule: each day with its items (name, time, location, dress code). Call this for questions about timing or before adding/updating schedule items (you need the day\'s schedule_id).',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    execute: async (_input, ctx) => {
      const service = new WeddingService(ctx.supabase as never);
      const days = await service.getWeddingSchedule(ctx.weddingUuid);
      return {
        days: days.map((d) => ({
          schedule_id: d.id,
          day_name: d.day_name,
          date: d.date,
          items: (d.events ?? []).map((item) => ({
            id: item.id,
            name: item.name,
            time: item.time,
            location: item.location,
            description: item.description,
            dress_code: item.dress_code,
            is_major_event: item.is_major_event,
          })),
        })),
      };
    },
  },
  {
    name: 'create_schedule_item',
    label: 'Adding a schedule item',
    risk: 'write',
    description:
      'Add one item to a schedule day (e.g. "Mehndi — 4 PM, courtyard"). Requires the day\'s schedule_id from get_schedule. Call when the user describes something happening at a time on a wedding day.',
    inputSchema: {
      type: 'object',
      properties: {
        schedule_id: { type: 'string', description: 'The day to add to (from get_schedule)' },
        name: { type: 'string' },
        time: { type: 'string', description: 'e.g. "4:00 PM"' },
        location: { type: 'string' },
        description: { type: 'string' },
        dress_code: { type: 'string' },
        is_major_event: { type: 'boolean' },
      },
      required: ['schedule_id', 'name', 'time'],
      additionalProperties: false,
    },
    execute: async (input, ctx) => {
      const { count } = await ctx.supabase
        .from('schedule_items')
        .select('id', { count: 'exact', head: true })
        .eq('schedule_id', input.schedule_id as string);
      const service = new WeddingService(ctx.supabase as never);
      const created = await service.createScheduleItem({
        schedule_id: input.schedule_id as string,
        name: input.name as string,
        time: input.time as string,
        location: (input.location as string) ?? null,
        description: (input.description as string) ?? null,
        dress_code: (input.dress_code as string) ?? null,
        is_major_event: (input.is_major_event as boolean) ?? false,
        order_index: count ?? 0,
      } as never);
      if (!created) throw new Error('Failed to create schedule item');
      return { created: { id: created.id, name: created.name, time: created.time } };
    },
  },
  {
    name: 'update_schedule_item',
    label: 'Updating a schedule item',
    risk: 'write',
    description:
      'Update one schedule item\'s name, time, location, description, or dress code. Call this when the user changes timing or details of something already on the schedule. Get the item id from get_schedule first.',
    inputSchema: {
      type: 'object',
      properties: {
        item_id: { type: 'string' },
        name: { type: 'string' },
        time: { type: 'string' },
        location: { type: 'string' },
        description: { type: 'string' },
        dress_code: { type: 'string' },
        is_major_event: { type: 'boolean' },
      },
      required: ['item_id'],
      additionalProperties: false,
    },
    execute: async (input, ctx) => {
      const updates: Record<string, unknown> = {};
      for (const f of ['name', 'time', 'location', 'description', 'dress_code', 'is_major_event'] as const) {
        if (input[f] !== undefined) updates[f] = input[f];
      }
      if (Object.keys(updates).length === 0) throw new Error('No updatable fields provided');
      const service = new WeddingService(ctx.supabase as never);
      const updated = await service.updateScheduleItem(input.item_id as string, updates as never);
      if (!updated) throw new Error('Failed to update schedule item');
      return { updated: { id: updated.id, name: updated.name, time: updated.time } };
    },
  },
  {
    name: 'update_event',
    label: 'Updating an event',
    risk: 'write',
    description:
      'Update a ceremony event (the big multi-day events like Sangeet/Haldi/Reception shown on the website): name, date, time, or dress code. Call this when the user changes one of those events. Event IDs come from get_wedding_overview.',
    inputSchema: {
      type: 'object',
      properties: {
        event_id: { type: 'string' },
        name: { type: 'string' },
        date: { type: 'string', description: 'YYYY-MM-DD' },
        time: { type: 'string' },
        dress_code: { type: 'string' },
      },
      required: ['event_id'],
      additionalProperties: false,
    },
    execute: async (input, ctx) => {
      const updates: Record<string, unknown> = {};
      for (const f of ['name', 'date', 'time', 'dress_code'] as const) {
        if (input[f] !== undefined) updates[f] = input[f];
      }
      if (Object.keys(updates).length === 0) throw new Error('No updatable fields provided');
      const service = new WeddingService(ctx.supabase as never);
      const updated = await service.updateEvent(input.event_id as string, updates as never);
      if (!updated) throw new Error('Failed to update event');
      return { updated: { id: updated.id, name: updated.name, date: updated.date } };
    },
  },
];
