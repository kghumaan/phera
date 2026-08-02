/**
 * Landing "app coming soon" countdown — pure date logic.
 *
 * The mobile-app teaser section counts down to a launch date. Until the
 * real launch (when the owner deletes the widget), the countdown must
 * always show a date in the future: if the base date passes, it rolls
 * forward in 1-week increments to the next future slot.
 */

export const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Jul 25 2026 — 2 weeks from the feature's build date. */
export const APP_LAUNCH_BASE_MS = Date.UTC(2026, 6, 25);

/**
 * The next launch date strictly in the future of `nowMs`.
 *
 * - Before the base date → the base date.
 * - At or after the base date → rolled forward in 1-week increments to the
 *   NEXT future slot (exactly-at-base returns base + 1 week; never returns
 *   a past or present timestamp).
 */
export function nextLaunchDate(nowMs: number): number {
  if (nowMs < APP_LAUNCH_BASE_MS) return APP_LAUNCH_BASE_MS;
  const weeksToAdd = Math.floor((nowMs - APP_LAUNCH_BASE_MS) / WEEK_MS) + 1;
  return APP_LAUNCH_BASE_MS + weeksToAdd * WEEK_MS;
}

/** Break a remaining-time span into countdown units, clamped at zero. */
export function formatCountdown(msRemaining: number): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
} {
  const ms = Math.max(0, msRemaining);
  return {
    days: Math.floor(ms / (24 * 60 * 60 * 1000)),
    hours: Math.floor(ms / (60 * 60 * 1000)) % 24,
    minutes: Math.floor(ms / (60 * 1000)) % 60,
    seconds: Math.floor(ms / 1000) % 60,
  };
}
