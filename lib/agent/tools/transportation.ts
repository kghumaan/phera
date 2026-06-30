import type { AgentToolDefinition } from '../types';

export const transportationTools: AgentToolDefinition[] = [
  {
    name: 'get_transportation',
    label: 'Reading transportation',
    risk: 'read',
    proFeature: 'Transportation',
    description:
      'Get shuttle/transportation state: vehicles with capacity, pickup locations, and reservation counts per vehicle. Call this for questions about shuttles, pickups, or whether guests have reserved seats.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    execute: async (_input, ctx) => {
      const [vehicles, pickups, reservations] = await Promise.all([
        ctx.supabase
          .from('transportation_vehicles')
          .select('id, name, capacity, vehicle_type, departure_time, departure_location')
          .eq('wedding_id', ctx.weddingUuid),
        ctx.supabase
          .from('transportation_pickup_locations')
          .select('id, name')
          .eq('wedding_id', ctx.weddingUuid),
        ctx.supabase
          .from('transportation_reservations')
          .select('id, vehicle_id, party_size, status')
          .eq('wedding_id', ctx.weddingUuid),
      ]);

      const reservedByVehicle = new Map<string, number>();
      for (const r of reservations.data ?? []) {
        if (!r.vehicle_id) continue;
        reservedByVehicle.set(
          r.vehicle_id,
          (reservedByVehicle.get(r.vehicle_id) ?? 0) + (r.party_size ?? 1)
        );
      }

      return {
        vehicles: (vehicles.data ?? []).map((v) => ({
          id: v.id,
          name: v.name,
          capacity: v.capacity,
          type: v.vehicle_type,
          departure_time: v.departure_time,
          departure_location: v.departure_location,
          seats_reserved: reservedByVehicle.get(v.id) ?? 0,
        })),
        pickup_locations: (pickups.data ?? []).map((p) => p.name),
        total_reservations: (reservations.data ?? []).length,
      };
    },
  },
];
