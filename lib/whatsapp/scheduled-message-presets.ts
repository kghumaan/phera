/**
 * Pre-configured scheduled messages offered to admins once a wedding has a
 * real date. Each preset proposes a send time relative to the wedding date;
 * the admin reviews the text + time, then explicitly enables it (recorded
 * as an approval in broadcast_audit_log). Nothing sends without that.
 *
 * Bodies are free-form Whapi texts (our SIM-connected number), so no Meta
 * template approval applies. The same body goes to every recipient; keep
 * copy guest-generic (no per-guest variables).
 */

export interface PresetVars {
  coupleName: string;
  venueName: string | null;
  venueLocation: string | null;
}

export interface ScheduledMessagePreset {
  key: string;
  title: string;
  description: string;
  /** Days relative to the wedding date (negative = before). */
  offsetDays: number;
  /** Wall-clock send time in the admin's chosen timezone. */
  defaultTime: string;
  build: (vars: PresetVars) => string;
}

function venueClause(vars: PresetVars): string {
  if (vars.venueName && !/tbd/i.test(vars.venueName)) {
    return vars.venueLocation && !/tbd/i.test(vars.venueLocation)
      ? ` at ${vars.venueName}, ${vars.venueLocation}`
      : ` at ${vars.venueName}`;
  }
  return '';
}

export const SCHEDULED_MESSAGE_PRESETS: ScheduledMessagePreset[] = [
  {
    key: 'reminder_48h',
    title: '48 hours to go',
    description: 'A schedule and dress-code reminder, 2 days before the wedding.',
    offsetDays: -2,
    defaultTime: '17:00',
    build: (v) =>
      `Just 2 days to go! ${v.coupleName}'s wedding celebrations begin soon${venueClause(v)}. ` +
      `The full schedule, dress codes, and venue details are on the wedding website. ` +
      `If you have any questions at all, just reply here and we'll help you out.`,
  },
  {
    key: 'welcome',
    title: 'Welcome message',
    description: 'A warm welcome as guests arrive, the day before the wedding.',
    offsetDays: -1,
    defaultTime: '10:00',
    build: (v) =>
      `Welcome! We're so happy you're here for ${v.coupleName}'s wedding${venueClause(v)}. ` +
      `If you need anything while you're here (directions, timings, recommendations), ` +
      `just reply to this message and we'll sort you out.`,
  },
  {
    key: 'goodbye',
    title: 'Thank you & goodbye',
    description: 'A thank-you note the day after the wedding wraps up.',
    offsetDays: 1,
    defaultTime: '10:00',
    build: (v) =>
      `A note from ${v.coupleName}: thank you for celebrating with us! ` +
      `Having you there meant the world. Safe travels home, and if you took photos ` +
      `you'd love to share, just reply here.`,
  },
];

export function getPreset(key: string): ScheduledMessagePreset | undefined {
  return SCHEDULED_MESSAGE_PRESETS.find((p) => p.key === key);
}

/**
 * Computes the preset's default wall-clock send date ("YYYY-MM-DD") from the
 * wedding date. Returns null when the wedding date is missing or a known
 * placeholder (epoch = "date not set").
 */
export function presetDefaultDate(preset: ScheduledMessagePreset, weddingDateISO: string | null): string | null {
  if (!weddingDateISO) return null;
  const wedding = new Date(weddingDateISO);
  if (Number.isNaN(wedding.getTime())) return null;
  if (wedding.getTime() < Date.UTC(2000, 0, 1)) return null;
  const d = new Date(wedding.getTime());
  d.setUTCDate(d.getUTCDate() + preset.offsetDays);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
