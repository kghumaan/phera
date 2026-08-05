/**
 * Wall-clock <-> UTC conversion for scheduled sends.
 *
 * The admin picks a date + time in a chosen IANA timezone; we store the
 * UTC instant (timestamptz) plus the timezone string for display. No
 * date library — the two-pass Intl offset trick below is exact for all
 * real timezones (DST transitions included; times inside a spring-forward
 * gap resolve to the post-transition offset).
 */

function tzOffsetMs(at: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const parts: Record<string, string> = {};
  for (const p of dtf.formatToParts(at)) parts[p.type] = p.value;
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    parts.hour === '24' ? 0 : Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  return asUtc - at.getTime();
}

/**
 * Converts a wall-clock date ("YYYY-MM-DD") + time ("HH:MM") in an IANA
 * timezone to a UTC ISO string. Throws on malformed input or an unknown
 * timezone (Intl throws RangeError).
 */
export function wallTimeToUtcISO(date: string, time: string, timeZone: string): string {
  const dm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const tm = /^(\d{2}):(\d{2})$/.exec(time);
  if (!dm || !tm) throw new Error(`Invalid date/time: ${date} ${time}`);
  const wallAsUtc = Date.UTC(Number(dm[1]), Number(dm[2]) - 1, Number(dm[3]), Number(tm[1]), Number(tm[2]));
  let guess = wallAsUtc;
  for (let i = 0; i < 2; i++) {
    guess = wallAsUtc - tzOffsetMs(new Date(guess), timeZone);
  }
  return new Date(guess).toISOString();
}

/** Formats a UTC instant for display in a timezone, e.g. "Aug 12, 5:00 PM". */
export function formatInTimeZone(utcISO: string, timeZone: string): string {
  const d = new Date(utcISO);
  if (Number.isNaN(d.getTime())) return utcISO;
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone,
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(d);
  } catch {
    return d.toISOString();
  }
}

/** Short timezone label, e.g. "PDT" / "GMT+5:30". */
export function timeZoneAbbreviation(utcISO: string, timeZone: string): string {
  try {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'short' }).formatToParts(
      new Date(utcISO),
    );
    return parts.find((p) => p.type === 'timeZoneName')?.value ?? timeZone;
  } catch {
    return timeZone;
  }
}

/** The browser's local IANA timezone (falls back to UTC server-side). */
export function localTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/**
 * Splits a UTC instant into wall-clock { date: "YYYY-MM-DD", time: "HH:MM" }
 * in the given timezone — the inverse of wallTimeToUtcISO, for edit forms.
 */
export function utcToWallTime(utcISO: string, timeZone: string): { date: string; time: string } {
  const at = new Date(utcISO);
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
  const parts: Record<string, string> = {};
  for (const p of dtf.formatToParts(at)) parts[p.type] = p.value;
  const hour = parts.hour === '24' ? '00' : parts.hour;
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${hour}:${parts.minute}`,
  };
}
