import { describe, it, expect } from 'vitest';
import {
  APP_LAUNCH_BASE_MS,
  WEEK_MS,
  formatCountdown,
  nextLaunchDate,
} from '@/lib/landing/app-launch';

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

describe('app-launch', () => {
  // ─── nextLaunchDate ─────────────────────────────────────────────────

  describe('nextLaunchDate', () => {
    it('returns the base date when now is before the base', () => {
      const now = APP_LAUNCH_BASE_MS - 3 * DAY_MS;
      expect(nextLaunchDate(now)).toBe(APP_LAUNCH_BASE_MS);
    });

    it('rolls forward one week when now is exactly the base', () => {
      expect(nextLaunchDate(APP_LAUNCH_BASE_MS)).toBe(APP_LAUNCH_BASE_MS + WEEK_MS);
    });

    it('rolls forward one week when now is 1ms after the base', () => {
      const now = APP_LAUNCH_BASE_MS + 1;
      expect(nextLaunchDate(now)).toBe(APP_LAUNCH_BASE_MS + WEEK_MS);
    });

    it('rolls to the next weekly slot 3.5 weeks after the base', () => {
      const now = APP_LAUNCH_BASE_MS + 3.5 * WEEK_MS;
      expect(nextLaunchDate(now)).toBe(APP_LAUNCH_BASE_MS + 4 * WEEK_MS);
    });

    it('never returns a past or present timestamp', () => {
      const samples = [
        APP_LAUNCH_BASE_MS - WEEK_MS,
        APP_LAUNCH_BASE_MS - 1,
        APP_LAUNCH_BASE_MS,
        APP_LAUNCH_BASE_MS + 1,
        APP_LAUNCH_BASE_MS + WEEK_MS, // exactly on a rolled slot
        APP_LAUNCH_BASE_MS + 10 * WEEK_MS + 12345,
      ];
      for (const now of samples) {
        expect(nextLaunchDate(now)).toBeGreaterThan(now);
      }
    });
  });

  // ─── formatCountdown ────────────────────────────────────────────────

  describe('formatCountdown', () => {
    it('breaks a typical remaining span into days/hours/minutes/seconds', () => {
      const ms = 2 * DAY_MS + 3 * HOUR_MS + 4 * MINUTE_MS + 5 * 1000 + 250;
      expect(formatCountdown(ms)).toEqual({ days: 2, hours: 3, minutes: 4, seconds: 5 });
    });

    it('handles spans under a day (days stays 0)', () => {
      const ms = 5 * HOUR_MS + 59 * MINUTE_MS + 59 * 1000;
      expect(formatCountdown(ms)).toEqual({ days: 0, hours: 5, minutes: 59, seconds: 59 });
    });

    it('clamps zero to all zeros', () => {
      expect(formatCountdown(0)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    });

    it('clamps negative values to all zeros', () => {
      expect(formatCountdown(-5000)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      expect(formatCountdown(-3 * WEEK_MS)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    });
  });
});
