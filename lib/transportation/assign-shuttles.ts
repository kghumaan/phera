/**
 * Slice 3 of shuttle-by-arrival: the pure assignment algorithm.
 *
 * Given guests (with arrival times + party sizes) and already-planned shuttles
 * (with departure times + remaining capacity), place each guest on the best
 * shuttle: the EARLIEST one that departs after they land (+ a buffer to clear
 * the airport) and still has room for their whole party. Parties are kept
 * together (never split across shuttles).
 *
 * Pure + deterministic — works on epoch-ms numbers and integer capacities, with
 * no DB, no `Date.now()`, no I/O — so it can be exhaustively unit-tested. The
 * service layer converts DB rows (datetimes → ms, RSVP → party size) and writes
 * the resulting draft reservations; edge cases feed the admin "needs attention"
 * list (slice 4).
 */

export interface ShuttleGuest {
  guestId: string;
  /** Arrival time as epoch ms, or null when the guest hasn't shared a flight. */
  arrivalMs: number | null;
  /** Party size including the guest themselves (coerced to >= 1). */
  partySize: number;
  name?: string;
}

export interface ShuttleVehicle {
  vehicleId: string;
  /** Departure time as epoch ms. */
  departureMs: number;
  /** Total seats on the shuttle. */
  capacity: number;
  /** Seats already taken by existing (non-cancelled) reservations. */
  booked: number;
  name?: string;
}

export type UnassignedReason =
  | 'no_arrival_info' // guest never shared flight details
  | 'no_shuttle_after_arrival' // no shuttle departs after they land (+ buffer / within max wait)
  | 'all_full' // shuttles depart in time but none have room for the party
  | 'party_too_large'; // party is bigger than the largest shuttle's total capacity

export interface ShuttleAssignment {
  guestId: string;
  vehicleId: string;
  /** Minutes between landing and shuttle departure. */
  waitMinutes: number;
}

export interface UnassignedGuest {
  guestId: string;
  reason: UnassignedReason;
}

export interface AssignmentResult {
  assignments: ShuttleAssignment[];
  unassigned: UnassignedGuest[];
  /** Remaining seats per vehicle after this run. */
  remainingByVehicle: Record<string, number>;
}

export interface AssignOptions {
  /** Minutes after landing before a guest can board (deplane + customs). Default 45. */
  bufferMinutes?: number;
  /** Cap how long after landing a shuttle may depart (avoid 8-hour waits). Optional — no cap by default. */
  maxWaitMinutes?: number;
}

const MS_PER_MIN = 60_000;

// Deterministic string compare so equal-key ties never depend on input order.
function byId(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function assignShuttles(
  guests: ShuttleGuest[],
  vehicles: ShuttleVehicle[],
  options: AssignOptions = {},
): AssignmentResult {
  const buffer = (options.bufferMinutes ?? 45) * MS_PER_MIN;
  const maxWait = options.maxWaitMinutes != null ? options.maxWaitMinutes * MS_PER_MIN : null;

  const remaining: Record<string, number> = {};
  for (const v of vehicles) {
    remaining[v.vehicleId] = Math.max(0, v.capacity - Math.max(0, v.booked));
  }
  const maxCapacity = vehicles.reduce((m, v) => Math.max(m, v.capacity), 0);

  const assignments: ShuttleAssignment[] = [];
  const unassigned: UnassignedGuest[] = [];

  // No arrival time → can't place. Recorded up front, in input order.
  const placeable: ShuttleGuest[] = [];
  for (const g of guests) {
    if (g.arrivalMs == null) unassigned.push({ guestId: g.guestId, reason: 'no_arrival_info' });
    else placeable.push(g);
  }

  // Earliest arrivals first so they get the earliest shuttles; deterministic tiebreak.
  placeable.sort((a, b) => a.arrivalMs! - b.arrivalMs! || byId(a.guestId, b.guestId));

  for (const g of placeable) {
    const partySize = Math.max(1, g.partySize);

    // Bigger than any single shuttle → can never fit (we keep parties together).
    if (partySize > maxCapacity) {
      unassigned.push({ guestId: g.guestId, reason: 'party_too_large' });
      continue;
    }

    const earliestDeparture = g.arrivalMs! + buffer;
    const afterArrival = vehicles.filter(
      (v) =>
        v.departureMs >= earliestDeparture &&
        (maxWait == null || v.departureMs - g.arrivalMs! <= maxWait),
    );

    if (afterArrival.length === 0) {
      unassigned.push({ guestId: g.guestId, reason: 'no_shuttle_after_arrival' });
      continue;
    }

    const eligible = afterArrival.filter((v) => remaining[v.vehicleId] >= partySize);
    if (eligible.length === 0) {
      unassigned.push({ guestId: g.guestId, reason: 'all_full' });
      continue;
    }

    // Earliest departure = least wait; deterministic tiebreak by vehicleId.
    eligible.sort((a, b) => a.departureMs - b.departureMs || byId(a.vehicleId, b.vehicleId));
    const chosen = eligible[0];
    remaining[chosen.vehicleId] -= partySize;
    assignments.push({
      guestId: g.guestId,
      vehicleId: chosen.vehicleId,
      waitMinutes: Math.round((chosen.departureMs - g.arrivalMs!) / MS_PER_MIN),
    });
  }

  return { assignments, unassigned, remainingByVehicle: remaining };
}
