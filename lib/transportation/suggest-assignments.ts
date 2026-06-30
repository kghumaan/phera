/**
 * Slice 3 wiring: load real data, run the (unit-tested) pure `assignShuttles`
 * algorithm, and return an enriched preview the admin can review before
 * anything is written. `applyShuttleAssignments` then turns the accepted
 * preview into DRAFT (`pending`) reservations the admin confirms.
 *
 * ID note: transportation_* tables key on the wedding UUID; guest-facing tables
 * (guests, rsvps, guest_flights) key on the wedding slug — so callers pass both.
 */

import { supabase } from '@/lib/supabase/client';
import { getAllVehiclesWithCapacity, createReservation } from '@/lib/supabase/transportation-service';
import { getAllGuestFlights } from '@/lib/supabase/travel-service';
import {
  assignShuttles,
  type ShuttleGuest,
  type ShuttleVehicle,
  type AssignOptions,
  type UnassignedReason,
} from './assign-shuttles';

export interface AssignmentPreview {
  assignments: Array<{
    guestId: string;
    guestName: string;
    vehicleId: string;
    vehicleName: string;
    waitMinutes: number;
    partySize: number;
  }>;
  unassigned: Array<{ guestId: string; guestName: string; reason: UnassignedReason }>;
  vehicles: Array<{ vehicleId: string; name: string; capacity: number; remaining: number }>;
}

function toMs(datetime: string | null | undefined): number | null {
  if (!datetime) return null;
  const ms = Date.parse(datetime);
  return Number.isNaN(ms) ? null : ms;
}

export async function buildShuttleAssignmentPreview(
  weddingId: string,
  weddingSlug: string,
  options: AssignOptions = {},
): Promise<AssignmentPreview> {
  const [vehiclesRaw, flights, rsvpRes, guestRes] = await Promise.all([
    getAllVehiclesWithCapacity(weddingId, 'arrival'),
    getAllGuestFlights(weddingSlug),
    supabase.from('rsvps').select('guest_id, guest_count, plus_one').eq('wedding_id', weddingSlug),
    supabase.from('guests').select('id, name').eq('wedding_id', weddingSlug),
  ]);

  const nameById = new Map<string, string>();
  for (const g of (guestRes.data ?? []) as Array<{ id: string; name: string }>) {
    nameById.set(g.id, g.name);
  }

  const partyById = new Map<string, number>();
  for (const r of (rsvpRes.data ?? []) as Array<{ guest_id: string; guest_count: number | null; plus_one: boolean | null }>) {
    if (!r.guest_id) continue;
    partyById.set(r.guest_id, r.guest_count || (r.plus_one ? 2 : 1));
  }

  const vehicleNameById = new Map<string, string>();
  const vehicles: ShuttleVehicle[] = [];
  for (const v of vehiclesRaw as Array<{ id: string; vehicle_name: string | null; departure_datetime: string | null; capacity: number; booked: number }>) {
    const departureMs = toMs(v.departure_datetime);
    if (departureMs == null) continue; // a shuttle with no departure time can't be matched on arrival
    const name = v.vehicle_name || 'Shuttle';
    vehicleNameById.set(v.id, name);
    vehicles.push({ vehicleId: v.id, departureMs, capacity: v.capacity, booked: v.booked, name });
  }

  const partyOf = (guestId: string) => Math.max(1, partyById.get(guestId) ?? 1);

  const guests: ShuttleGuest[] = [];
  for (const f of flights as Array<{ guest_id: string | null; arrival_datetime: string | null }>) {
    if (!f.guest_id) continue;
    guests.push({
      guestId: f.guest_id,
      arrivalMs: toMs(f.arrival_datetime),
      partySize: partyOf(f.guest_id),
      name: nameById.get(f.guest_id),
    });
  }

  const result = assignShuttles(guests, vehicles, options);

  return {
    assignments: result.assignments.map((a) => ({
      guestId: a.guestId,
      guestName: nameById.get(a.guestId) ?? 'Guest',
      vehicleId: a.vehicleId,
      vehicleName: vehicleNameById.get(a.vehicleId) ?? 'Shuttle',
      waitMinutes: a.waitMinutes,
      partySize: partyOf(a.guestId),
    })),
    unassigned: result.unassigned.map((u) => ({
      guestId: u.guestId,
      guestName: nameById.get(u.guestId) ?? 'Guest',
      reason: u.reason,
    })),
    vehicles: vehicles.map((v) => ({
      vehicleId: v.vehicleId,
      name: v.name ?? 'Shuttle',
      capacity: v.capacity,
      remaining: result.remainingByVehicle[v.vehicleId] ?? 0,
    })),
  };
}

/**
 * Turn accepted preview assignments into DRAFT (`pending`) arrival reservations.
 * Uses the existing createReservation (upserts per guest+direction, status
 * 'pending'), so the admin reviews/confirms them with the normal flow. Returns
 * how many were written.
 */
export async function applyShuttleAssignments(
  weddingId: string,
  assignments: Array<{ guestId: string; vehicleId: string; partySize: number }>,
): Promise<{ created: number; failed: number }> {
  let created = 0;
  let failed = 0;
  for (const a of assignments) {
    const res = await createReservation(weddingId, a.guestId, {
      direction: 'arrival',
      vehicle_id: a.vehicleId,
      party_size: Math.max(1, a.partySize),
      notes: 'Auto-suggested from arrival time',
    });
    if (res) created += 1;
    else failed += 1;
  }
  return { created, failed };
}
