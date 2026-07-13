import { WeddingService } from '@/lib/supabase/wedding-service';
import { humanizeFields } from './humanize';
import type { AgentToolDefinition } from '../types';

/** Fields the agent may update on the weddings row. Styling/publishing stay in the UI for now. */
const UPDATABLE_WEDDING_FIELDS = [
  'couple_name',
  'partner1_name',
  'partner2_name',
  'wedding_date',
  'wedding_date_end',
  'wedding_date_display',
  'venue_name',
  'venue_location',
  'welcome_text',
  'rsvp_deadline',
  'expected_guest_count',
] as const;

export const weddingTools: AgentToolDefinition[] = [
  {
    name: 'get_wedding_overview',
    label: 'Reading wedding details',
    risk: 'read',
    description:
      'Get the wedding\'s core details: couple names, dates, venue, RSVP deadline, welcome text, plus the list of ceremony events. Call this when the user asks about basic wedding facts or before updating any of them.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    execute: async (_input, ctx) => {
      const service = new WeddingService(ctx.supabase as never);
      const [wedding, events] = await Promise.all([
        service.getWeddingById(ctx.weddingUuid),
        service.getWeddingEvents(ctx.weddingUuid),
      ]);
      if (!wedding) throw new Error('Wedding not found');
      return {
        slug: wedding.slug,
        couple_name: wedding.couple_name,
        partner1_name: wedding.partner1_name,
        partner2_name: wedding.partner2_name,
        wedding_date: wedding.wedding_date,
        wedding_date_end: wedding.wedding_date_end,
        wedding_date_display: wedding.wedding_date_display,
        venue_name: wedding.venue_name,
        venue_location: wedding.venue_location,
        rsvp_deadline: wedding.rsvp_deadline,
        welcome_text: wedding.welcome_text,
        status: wedding.status,
        events: events.map((e) => ({
          id: e.id,
          name: e.name,
          date: e.date,
          time: e.time,
          dress_code: e.dress_code,
        })),
      };
    },
  },
  {
    name: 'update_wedding_details',
    label: 'Updating wedding details',
    risk: 'write',
    description:
      'Update core wedding details (couple names, dates, venue, RSVP deadline, welcome text). Call this when the user tells you a detail like the venue, the date, or a name change. Dates are YYYY-MM-DD. Only pass the fields being changed.',
    inputSchema: {
      type: 'object',
      properties: {
        couple_name: { type: 'string', description: 'Display name for the couple, e.g. "Priya & Rahul"' },
        partner1_name: { type: 'string' },
        partner2_name: { type: 'string' },
        wedding_date: { type: 'string', description: 'Start date, YYYY-MM-DD' },
        wedding_date_end: { type: 'string', description: 'End date for multi-day weddings, YYYY-MM-DD' },
        wedding_date_display: { type: 'string', description: 'Human-friendly date text shown on the site' },
        venue_name: { type: 'string' },
        venue_location: { type: 'string', description: 'City/region, e.g. "Udaipur, India"' },
        welcome_text: { type: 'string' },
        rsvp_deadline: { type: 'string', description: 'YYYY-MM-DD' },
        expected_guest_count: {
          type: 'number',
          description:
            'Rough expected number of PEOPLE (not invites). Record the moment the couple mentions it ("around 300 guests", "half of 250 flying in").',
        },
      },
      additionalProperties: false,
    },
    captureBefore: async (input, ctx) => {
      const fields = UPDATABLE_WEDDING_FIELDS.filter((f) => input[f] !== undefined);
      if (fields.length === 0) return null;
      const { data: wedding } = await ctx.supabase
        .from('weddings')
        .select(fields.join(', '))
        .eq('id', ctx.weddingUuid)
        .maybeSingle();
      if (!wedding) return null;
      return {
        restore: 'update',
        table: 'weddings',
        match: { id: ctx.weddingUuid },
        values: wedding as unknown as Record<string, unknown>,
      };
    },
    execute: async (input, ctx) => {
      const updates: Record<string, unknown> = {};
      for (const field of UPDATABLE_WEDDING_FIELDS) {
        if (input[field] !== undefined) updates[field] = input[field];
      }
      if (Object.keys(updates).length === 0) throw new Error('No updatable fields provided');
      const service = new WeddingService(ctx.supabase as never);
      const updated = await service.updateWedding(ctx.weddingUuid, updates as never);
      if (!updated) throw new Error('Update failed');
      return {
        updated: Object.keys(updates),
        wedding_date: updated.wedding_date,
        venue_name: updated.venue_name,
        summary: `${humanizeFields(Object.keys(updates))} updated`,
      };
    },
  },
];
