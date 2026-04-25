/**
 * Default-true per-guest event filtering.
 *
 * `guest_event_access` rows exist only when an admin has explicitly
 * UN-checked a (guest, event) pair. A missing row means the guest IS
 * invited. This helper computes the set of invited event IDs given the
 * full event list for a wedding plus the guest's opt-out rows.
 */

export interface AccessRow {
  event_id: string;
  invited: boolean;
}

export function computeInvitedEventIds(
  allEventIds: string[],
  rowsForGuest: AccessRow[],
): string[] {
  const uninvited = new Set(
    rowsForGuest.filter(r => r.invited === false).map(r => r.event_id),
  );
  return allEventIds.filter(id => !uninvited.has(id));
}
