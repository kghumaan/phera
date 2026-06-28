import { describe, it, expect } from 'vitest';
import { planScheduleReconciliation, type ExistingDay } from '@/lib/schedule/reconcile-days';

// Helper: local-time date so format(...,'yyyy-MM-dd') is stable across TZ.
const d = (y: number, m: number, day: number) => new Date(y, m - 1, day);

function day(id: string, date: string, order_index: number, eventIds: string[] = []): ExistingDay {
  return { id, date, order_index, eventIds };
}

describe('planScheduleReconciliation', () => {
  it('is a no-op when existing days already match the range exactly', () => {
    const existing = [
      day('a', '2026-01-01', 0),
      day('b', '2026-01-02', 1),
      day('c', '2026-01-03', 2),
    ];
    const plan = planScheduleReconciliation(d(2026, 1, 1), d(2026, 1, 3), existing);
    expect(plan.inSync).toBe(true);
    expect(plan.updates).toHaveLength(0);
    expect(plan.creates).toHaveLength(0);
    expect(plan.deletes).toHaveLength(0);
  });

  it('SAME duration shifted to a new range → remaps dates, deletes nothing (data retained)', () => {
    const existing = [
      day('a', '2026-01-01', 0, ['e1']),
      day('b', '2026-01-02', 1, ['e2']),
      day('c', '2026-01-03', 2, ['e3']),
    ];
    // Same 3-day duration, moved to June.
    const plan = planScheduleReconciliation(d(2026, 6, 10), d(2026, 6, 12), existing);
    expect(plan.inSync).toBe(false);
    expect(plan.deletes).toHaveLength(0); // nothing dropped — all data kept
    expect(plan.creates).toHaveLength(0);
    expect(plan.updates).toHaveLength(3);
    expect(plan.updates.map((u) => u.date)).toEqual(['2026-06-10', '2026-06-11', '2026-06-12']);
    // Days a/b/c (with events e1/e2/e3) survive — just re-dated.
    expect(plan.updates.map((u) => u.id)).toEqual(['a', 'b', 'c']);
  });

  it('SHRINK → keeps the first N days, deletes the trailing ones from the END', () => {
    const existing = [
      day('a', '2026-01-01', 0, ['e1']),
      day('b', '2026-01-02', 1, ['e2']),
      day('c', '2026-01-03', 2, ['e3']),
      day('d', '2026-01-04', 3, ['e4']),
      day('e', '2026-01-05', 4, ['e5a', 'e5b']),
    ];
    // 5 days → 3 days, same start.
    const plan = planScheduleReconciliation(d(2026, 1, 1), d(2026, 1, 3), existing);
    expect(plan.inSync).toBe(false);
    expect(plan.creates).toHaveLength(0);
    // First 3 already correct → no updates needed.
    expect(plan.updates).toHaveLength(0);
    // Trailing 2 deleted, with their events.
    expect(plan.deletes.map((x) => x.dayId)).toEqual(['d', 'e']);
    expect(plan.deletes[1].eventIds).toEqual(['e5a', 'e5b']);
  });

  it('SHRINK + shift → remaps the kept prefix and deletes the tail', () => {
    const existing = [
      day('a', '2026-01-01', 0, ['e1']),
      day('b', '2026-01-02', 1, ['e2']),
      day('c', '2026-01-03', 2, ['e3']),
      day('d', '2026-01-04', 3, ['e4']),
    ];
    // 4 days → 2 days in a different month.
    const plan = planScheduleReconciliation(d(2026, 9, 20), d(2026, 9, 21), existing);
    expect(plan.updates.map((u) => u.id)).toEqual(['a', 'b']);
    expect(plan.updates.map((u) => u.date)).toEqual(['2026-09-20', '2026-09-21']);
    expect(plan.deletes.map((x) => x.dayId)).toEqual(['c', 'd']);
  });

  it('GROW → keeps existing days and appends new empty days', () => {
    const existing = [
      day('a', '2026-01-01', 0, ['e1']),
      day('b', '2026-01-02', 1, ['e2']),
    ];
    // 2 days → 4 days, same start.
    const plan = planScheduleReconciliation(d(2026, 1, 1), d(2026, 1, 4), existing);
    expect(plan.deletes).toHaveLength(0);
    expect(plan.updates).toHaveLength(0); // first two unchanged
    expect(plan.creates.map((c) => c.date)).toEqual(['2026-01-03', '2026-01-04']);
    expect(plan.creates.map((c) => c.order_index)).toEqual([2, 3]);
  });

  it('SHRINK to a single day (no end date) deletes the rest', () => {
    const existing = [
      day('a', '2026-01-01', 0, ['e1']),
      day('b', '2026-01-02', 1, ['e2']),
      day('c', '2026-01-03', 2, ['e3']),
    ];
    const plan = planScheduleReconciliation(d(2026, 1, 1), null, existing);
    expect(plan.deletes.map((x) => x.dayId)).toEqual(['b', 'c']);
    expect(plan.updates).toHaveLength(0);
  });

  it('handles legacy "Monday - January 1, 2026" date strings', () => {
    const existing = [
      day('a', 'Thursday - January 1, 2026', 0, ['e1']),
      day('b', 'Friday - January 2, 2026', 1, ['e2']),
    ];
    // Exact same range, legacy format → recognized as in-sync, no churn.
    const plan = planScheduleReconciliation(d(2026, 1, 1), d(2026, 1, 2), existing);
    expect(plan.inSync).toBe(true);
  });
});
