import { eachDayOfInterval, format } from 'date-fns';

/**
 * Reconciles a wedding's schedule "days" with its date range.
 *
 * Rules (data-retention first):
 *  - Same duration, shifted dates → remap each existing day's date in order;
 *    ALL data is kept, only the dates change.
 *  - Range grew → keep existing days, append new empty days for the extra dates.
 *  - Range shrank → keep the first N days (remapped, data intact) and delete
 *    the trailing days that no longer fit — always from the END.
 *
 * Pure function: it computes a plan; the caller performs the DB writes.
 */

export interface ExistingDay {
  id: string;
  date: string;
  order_index: number;
  /** IDs of schedule_items under this day (so the caller can delete them too). */
  eventIds: string[];
}

export interface DayUpdate {
  id: string;
  date: string;
  day_name: string;
  order_index: number;
}

export interface DayCreate {
  date: string;
  day_name: string;
  order_index: number;
}

export interface DayDelete {
  dayId: string;
  eventIds: string[];
}

export interface ReconcilePlan {
  /** True when existing days already match the range exactly — nothing to do. */
  inSync: boolean;
  updates: DayUpdate[];
  creates: DayCreate[];
  deletes: DayDelete[];
}

/** Normalize a date string to ISO yyyy-MM-dd (handles legacy "Monday - January 5, 2025"). */
export function normalizeDateStr(d: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  try {
    const cleaned = d.replace(/\s*-\s*/, ', ');
    const parsed = new Date(cleaned);
    if (!isNaN(parsed.getTime())) return format(parsed, 'yyyy-MM-dd');
  } catch {
    /* ignore */
  }
  return d;
}

export function planScheduleReconciliation(
  dateStart: Date,
  dateEnd: Date | null,
  existingDays: ExistingDay[],
): ReconcilePlan {
  const endDate = dateEnd || dateStart;
  const allDates = eachDayOfInterval({ start: dateStart, end: endDate });

  // Reassign in display order.
  const sorted = [...existingDays].sort((a, b) => a.order_index - b.order_index);

  const updates: DayUpdate[] = [];
  const creates: DayCreate[] = [];
  const deletes: DayDelete[] = [];

  // Already correct? Require an EXACT day count — more existing days than the
  // range now has means we must delete the extras (a shrink), so not in sync.
  const existingDateSet = new Set(sorted.map((d) => normalizeDateStr(d.date)));
  const newDateStrs = allDates.map((d) => format(d, 'yyyy-MM-dd'));
  const inSync = sorted.length === allDates.length && newDateStrs.every((d) => existingDateSet.has(d));
  if (inSync) return { inSync, updates, creates, deletes };

  // Remap the overlapping prefix (retains each day's events).
  for (let i = 0; i < Math.min(sorted.length, allDates.length); i++) {
    const newDateStr = format(allDates[i], 'yyyy-MM-dd');
    const newDayName = format(allDates[i], 'EEEE');
    const existingNorm = normalizeDateStr(sorted[i].date);
    if (existingNorm !== newDateStr || sorted[i].order_index !== i) {
      updates.push({ id: sorted[i].id, date: newDateStr, day_name: newDayName, order_index: i });
    }
  }

  // Range grew → append new empty days.
  for (let i = sorted.length; i < allDates.length; i++) {
    creates.push({
      date: format(allDates[i], 'yyyy-MM-dd'),
      day_name: format(allDates[i], 'EEEE'),
      order_index: i,
    });
  }

  // Range shrank → delete trailing days from the END.
  for (let i = allDates.length; i < sorted.length; i++) {
    deletes.push({ dayId: sorted[i].id, eventIds: sorted[i].eventIds });
  }

  return { inSync, updates, creates, deletes };
}
