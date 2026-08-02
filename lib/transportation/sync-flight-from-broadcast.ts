import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Slice 2 of shuttle-by-arrival: land a guest's flight-request broadcast reply
 * (collected_data) into their `guest_flights` row so the transportation system
 * can place them on a shuttle by arrival time.
 *
 * MERGE semantics — only fills columns that are currently empty, so an admin's
 * manual edit always wins ("admin can override"). Best-effort normalization;
 * the raw answer is always preserved in `shuttle_preference_note` so nothing
 * is lost even when parsing fails.
 *
 * Keyed off the flight broadcast's schema keys (see RequestFlightDetailsButton):
 *   arrival_airport, arrival_date, arrival_time, airline_flight, needs_shuttle
 */

const FLIGHT_KEYS = ['arrival_airport', 'arrival_date', 'arrival_time', 'airline_flight', 'needs_shuttle'] as const;

type Collected = Record<string, unknown>;

function str(v: unknown): string {
  return v == null ? '' : String(v).trim();
}

/** True when the collected data carries at least one flight field. */
export function looksLikeFlightData(collected: Collected | null | undefined): boolean {
  if (!collected) return false;
  return FLIGHT_KEYS.some((k) => str(collected[k]) !== '');
}

/** "3:45 PM" / "15:45" / "9am" / "0945" → "HH:MM" (24h), or null. */
export function normalizeTime(raw: string): string | null {
  const t = raw.trim().toLowerCase();
  if (!t) return null;
  const m = t.match(/^(\d{1,2})[:.]?(\d{2})?\s*(am|pm)?/);
  if (!m) return null;
  let hour = parseInt(m[1], 10);
  const min = m[2] ? parseInt(m[2], 10) : 0;
  const mer = m[3];
  if (Number.isNaN(hour) || hour > 23 || min > 59) return null;
  if (mer === 'pm' && hour < 12) hour += 12;
  if (mer === 'am' && hour === 12) hour = 0;
  return `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

/** Best-effort date → "YYYY-MM-DD", or null. */
export function normalizeDate(raw: string): string | null {
  let s = raw.trim();
  if (!s) return null;
  // Pure ISO date — return verbatim. (Going through `new Date()` would parse it
  // as UTC midnight and a local read could shift it back a day.)
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  // Must actually look date-ish (a month name or a numeric day/slash date) —
  // otherwise appending a year to junk like "garbage" yields a bogus Jan-1.
  const dateish =
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(s) ||
    /\d{1,2}[/-]\d{1,2}/.test(s) ||
    /\b\d{1,2}\b/.test(s);
  if (!dateish) return null;
  // No 4-digit year (e.g. "Apr 12") → assume the current year, not whatever the
  // JS engine guesses.
  if (!/\d{4}/.test(s)) s = `${s} ${new Date().getFullYear()}`;
  const d = new Date(s);
  if (Number.isNaN(d.getTime()) || d.getFullYear() < 2000) return null;
  // Read LOCAL components (the string parsed as local time) to avoid a UTC
  // off-by-one.
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** "United 123" → {airline:'United', flightNumber:'123'}; "AI 302" → {airline:null, flightNumber:'AI 302'}. */
export function splitAirlineFlight(raw: string): { airline: string | null; flightNumber: string | null } {
  const s = raw.trim();
  if (!s) return { airline: null, flightNumber: null };
  // Trailing flight number: optional 1-3 letter carrier code + 1-4 digits.
  const m = s.match(/\b([A-Za-z]{1,3}\s?)?(\d{1,4}[A-Za-z]?)\s*$/);
  if (m && m.index != null) {
    const code = (m[1] || '').trim();
    const num = m[2].trim();
    const flightNumber = code ? `${code} ${num}` : num;
    const airline = s.slice(0, m.index).trim();
    return { airline: airline || null, flightNumber };
  }
  return { airline: s, flightNumber: null };
}

export interface FlightSyncResult {
  updated: boolean;
  filled: string[];
}

export async function syncGuestFlightFromBroadcast(
  supabase: SupabaseClient,
  guestId: string,
  weddingSlug: string,
  collected: Collected | null | undefined,
): Promise<FlightSyncResult> {
  if (!collected || !looksLikeFlightData(collected) || !weddingSlug) {
    return { updated: false, filled: [] };
  }

  const airport = str(collected.arrival_airport);
  const flightRaw = str(collected.airline_flight);
  const dateRaw = str(collected.arrival_date);
  const timeRaw = str(collected.arrival_time);
  const shuttleRaw = str(collected.needs_shuttle);

  const { airline, flightNumber } = splitAirlineFlight(flightRaw);
  const normDate = normalizeDate(dateRaw);
  const normTime = normalizeTime(timeRaw);
  const arrivalDatetime = normDate && normTime ? `${normDate}T${normTime}:00` : null;

  const noteParts: string[] = [];
  if (airport) noteParts.push(`arrives ${airport}`);
  if (dateRaw) noteParts.push(dateRaw);
  if (timeRaw) noteParts.push(timeRaw);
  if (shuttleRaw) noteParts.push(`shuttle: ${shuttleRaw}`);
  const note = noteParts.length ? `From flight request — ${noteParts.join(' · ')}` : '';

  // Existing row → only fill empty columns (admin edits win).
  const { data: existing } = await supabase
    .from('guest_flights')
    .select('*')
    .eq('guest_id', guestId)
    .eq('wedding_id', weddingSlug)
    .maybeSingle();

  const patch: Record<string, string> = {};
  const filled: string[] = [];
  const fillIfEmpty = (col: string, val: string | null) => {
    if (!val) return;
    const cur = existing ? (existing as Record<string, unknown>)[col] : null;
    if (cur == null || cur === '') {
      patch[col] = val;
      filled.push(col);
    }
  };

  fillIfEmpty('arrival_airport', airport || null);
  fillIfEmpty('airline', airline);
  fillIfEmpty('flight_number', flightNumber || (flightRaw || null));
  fillIfEmpty('arrival_datetime', arrivalDatetime);
  fillIfEmpty('shuttle_preference_time', normTime);
  fillIfEmpty('shuttle_preference_note', note || null);

  if (Object.keys(patch).length === 0) return { updated: false, filled: [] };

  patch.guest_id = guestId;
  patch.wedding_id = weddingSlug;
  patch.updated_at = new Date().toISOString();

  const { error } = await supabase
    .from('guest_flights')
    .upsert(patch, { onConflict: 'guest_id,wedding_id' });

  if (error) {
    console.error('[flight-sync] upsert failed:', error.message);
    return { updated: false, filled: [] };
  }
  return { updated: true, filled };
}
