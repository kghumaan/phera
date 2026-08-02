import { describe, it, expect } from 'vitest';
import {
  assignShuttles,
  type ShuttleGuest,
  type ShuttleVehicle,
} from '@/lib/transportation/assign-shuttles';

// All times are "minutes from T0" for readability.
const T0 = 1_700_000_000_000;
const at = (mins: number) => T0 + mins * 60_000;

const guest = (guestId: string, arrMins: number | null, partySize = 1): ShuttleGuest => ({
  guestId,
  arrivalMs: arrMins == null ? null : at(arrMins),
  partySize,
});
const veh = (vehicleId: string, depMins: number, capacity: number, booked = 0): ShuttleVehicle => ({
  vehicleId,
  departureMs: at(depMins),
  capacity,
  booked,
});

const NO_BUFFER = { bufferMinutes: 0 };

describe('assignShuttles', () => {
  it('assigns a guest to the earliest shuttle departing at/after arrival', () => {
    const r = assignShuttles(
      [guest('g1', 100)],
      [veh('v1', 90, 10), veh('v2', 110, 10), veh('v3', 130, 10)],
      NO_BUFFER,
    );
    expect(r.assignments).toEqual([{ guestId: 'g1', vehicleId: 'v2', waitMinutes: 10 }]);
    expect(r.unassigned).toEqual([]);
  });

  it('never assigns a shuttle that departs before the guest lands', () => {
    const r = assignShuttles([guest('g1', 100)], [veh('v1', 90, 10)], NO_BUFFER);
    expect(r.assignments).toEqual([]);
    expect(r.unassigned).toEqual([{ guestId: 'g1', reason: 'no_shuttle_after_arrival' }]);
  });

  it('respects the post-landing buffer (default 45m)', () => {
    // v1 departs 20m after landing (< 45m buffer) → skipped; v2 at +50m is eligible.
    const r = assignShuttles([guest('g1', 100)], [veh('v1', 120, 10), veh('v2', 150, 10)]);
    expect(r.assignments).toEqual([{ guestId: 'g1', vehicleId: 'v2', waitMinutes: 50 }]);
  });

  it('keeps a party together and needs enough seats for the whole party', () => {
    // Party of 3: v1 has only 2 seats → skipped; v2 has room.
    const r = assignShuttles(
      [guest('g1', 100, 3)],
      [veh('v1', 110, 2), veh('v2', 130, 5)],
      NO_BUFFER,
    );
    expect(r.assignments).toEqual([{ guestId: 'g1', vehicleId: 'v2', waitMinutes: 30 }]);
  });

  it('decrements capacity as it assigns, pushing later guests to later shuttles', () => {
    // v1 (cap 1) at +10; v2 (cap 5) at +30. Two guests land together.
    const r = assignShuttles(
      [guest('g1', 100), guest('g2', 100)],
      [veh('v1', 110, 1), veh('v2', 130, 5)],
      NO_BUFFER,
    );
    expect(r.assignments).toContainEqual({ guestId: 'g1', vehicleId: 'v1', waitMinutes: 10 });
    expect(r.assignments).toContainEqual({ guestId: 'g2', vehicleId: 'v2', waitMinutes: 30 });
    expect(r.remainingByVehicle).toEqual({ v1: 0, v2: 4 });
  });

  it('reports all_full when in-time shuttles exist but none have room', () => {
    const r = assignShuttles([guest('g1', 100)], [veh('v1', 110, 1, 1)], NO_BUFFER); // booked 1/1
    expect(r.assignments).toEqual([]);
    expect(r.unassigned).toEqual([{ guestId: 'g1', reason: 'all_full' }]);
  });

  it('counts existing booked seats against capacity', () => {
    // cap 5, booked 4 → only 1 left; a party of 2 cannot fit.
    const r = assignShuttles([guest('g1', 100, 2)], [veh('v1', 110, 5, 4)], NO_BUFFER);
    expect(r.unassigned).toEqual([{ guestId: 'g1', reason: 'all_full' }]);
  });

  it('flags guests with no arrival info and preserves input order', () => {
    const r = assignShuttles(
      [guest('g1', null), guest('g2', 100), guest('g3', null)],
      [veh('v1', 110, 10)],
      NO_BUFFER,
    );
    expect(r.assignments).toEqual([{ guestId: 'g2', vehicleId: 'v1', waitMinutes: 10 }]);
    expect(r.unassigned).toEqual([
      { guestId: 'g1', reason: 'no_arrival_info' },
      { guestId: 'g3', reason: 'no_arrival_info' },
    ]);
  });

  it('flags a party larger than the biggest shuttle', () => {
    const r = assignShuttles([guest('g1', 100, 10)], [veh('v1', 110, 5), veh('v2', 130, 8)], NO_BUFFER);
    expect(r.unassigned).toEqual([{ guestId: 'g1', reason: 'party_too_large' }]);
  });

  it('gives earlier arrivals the earlier shuttle regardless of input order', () => {
    // g_b listed first but lands later; g_a lands earlier and should win v1.
    const r = assignShuttles(
      [guest('g_b', 200), guest('g_a', 100)],
      [veh('v1', 250, 1), veh('v2', 300, 1)],
      NO_BUFFER,
    );
    expect(r.assignments).toContainEqual({ guestId: 'g_a', vehicleId: 'v1', waitMinutes: 150 });
    expect(r.assignments).toContainEqual({ guestId: 'g_b', vehicleId: 'v2', waitMinutes: 100 });
  });

  it('honors maxWaitMinutes (a far-off shuttle is not a sensible placement)', () => {
    // Only shuttle departs 10h after landing; max wait 2h → unassignable.
    const r = assignShuttles([guest('g1', 0)], [veh('v1', 600, 10)], {
      bufferMinutes: 0,
      maxWaitMinutes: 120,
    });
    expect(r.unassigned).toEqual([{ guestId: 'g1', reason: 'no_shuttle_after_arrival' }]);
  });

  it('is deterministic on ties (arrival ties by guestId, departure ties by vehicleId)', () => {
    const guests = [guest('gb', 100), guest('ga', 100)];
    const vehicles = [veh('vb', 130, 1), veh('va', 130, 1)];
    const run = () => assignShuttles(guests, vehicles, NO_BUFFER);
    const first = run();
    // ga (earlier id) takes va (earlier id); gb takes vb.
    expect(first.assignments).toContainEqual({ guestId: 'ga', vehicleId: 'va', waitMinutes: 30 });
    expect(first.assignments).toContainEqual({ guestId: 'gb', vehicleId: 'vb', waitMinutes: 30 });
    // Same inputs → identical output.
    expect(run()).toEqual(first);
  });

  it('coerces a missing/zero party size to 1', () => {
    const r = assignShuttles(
      [{ guestId: 'g1', arrivalMs: at(100), partySize: 0 }],
      [veh('v1', 110, 1)],
      NO_BUFFER,
    );
    expect(r.assignments).toEqual([{ guestId: 'g1', vehicleId: 'v1', waitMinutes: 10 }]);
  });

  it('handles empty inputs', () => {
    expect(assignShuttles([], [])).toEqual({
      assignments: [],
      unassigned: [],
      remainingByVehicle: {},
    });
  });
});
