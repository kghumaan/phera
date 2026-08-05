import { WeddingService } from '@/lib/supabase/wedding-service';
import type { AgentToolDefinition } from '../types';

export const travelTools: AgentToolDefinition[] = [
  {
    name: 'get_travel_info',
    label: 'Reading travel info',
    risk: 'read',
    description:
      'Get travel-related state: the travel content sections shown to guests (flights/hotels/notes) and a summary of guest flights on file (who has shared arrival details). Call this for questions about guest travel, arrivals, or airport logistics.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    execute: async (_input, ctx) => {
      const service = new WeddingService(ctx.supabase as never);
      // guest_flights has been keyed by slug in some weddings and uuid in
      // others historically — match either so we never miss data.
      const [sections, flights] = await Promise.all([
        service.getTravelSections(ctx.weddingUuid),
        ctx.supabase
          .from('guest_flights')
          .select('guest_id, airline, flight_number, arrival_datetime, departure_datetime')
          .in('wedding_id', [ctx.weddingSlug, ctx.weddingUuid]),
      ]);

      const flightRows = flights.data ?? [];
      const guestNames = new Map<string, string>();
      const guestIds = flightRows.map((f) => f.guest_id).filter(Boolean);
      if (guestIds.length > 0) {
        const { data: guests } = await ctx.supabase
          .from('guests')
          .select('id, name')
          .eq('wedding_id', ctx.weddingSlug)
          .in('id', guestIds);
        for (const g of guests ?? []) guestNames.set(g.id, g.name);
      }

      return {
        sections: sections.map((s) => ({
          id: s.id,
          title: s.title,
          type: s.type,
          subtitle: s.subtitle,
          address: s.address,
        })),
        flights_on_file: flightRows.length,
        flights: flightRows.slice(0, 50).map((f) => ({
          guest: guestNames.get(f.guest_id) ?? f.guest_id,
          airline: f.airline,
          flight_number: f.flight_number,
          arrival_datetime: f.arrival_datetime,
          departure_datetime: f.departure_datetime,
        })),
      };
    },
  },
];
