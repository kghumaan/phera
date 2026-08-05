import { describe, it, expect } from 'vitest';
import {
  wallTimeToUtcISO,
  utcToWallTime,
  formatInTimeZone,
  localTimeZone,
} from '@/lib/utils/wall-time';
import {
  SCHEDULED_MESSAGE_PRESETS,
  getPreset,
  presetDefaultDate,
} from '@/lib/whatsapp/scheduled-message-presets';

describe('wall-time conversion', () => {
  it('converts IST wall time to UTC (fixed offset, no DST)', () => {
    // 17:00 IST = 11:30 UTC
    expect(wallTimeToUtcISO('2026-12-05', '17:00', 'Asia/Kolkata')).toBe('2026-12-05T11:30:00.000Z');
  });

  it('converts US Pacific wall time across DST correctly', () => {
    // July = PDT (UTC-7)
    expect(wallTimeToUtcISO('2026-07-10', '10:00', 'America/Los_Angeles')).toBe('2026-07-10T17:00:00.000Z');
    // December = PST (UTC-8)
    expect(wallTimeToUtcISO('2026-12-10', '10:00', 'America/Los_Angeles')).toBe('2026-12-10T18:00:00.000Z');
  });

  it('handles UTC directly', () => {
    expect(wallTimeToUtcISO('2026-03-01', '09:15', 'UTC')).toBe('2026-03-01T09:15:00.000Z');
  });

  it('round-trips through utcToWallTime', () => {
    const utc = wallTimeToUtcISO('2026-11-20', '18:45', 'Asia/Dubai');
    expect(utcToWallTime(utc, 'Asia/Dubai')).toEqual({ date: '2026-11-20', time: '18:45' });
  });

  it('throws on malformed input', () => {
    expect(() => wallTimeToUtcISO('2026-1-5', '17:00', 'UTC')).toThrow();
    expect(() => wallTimeToUtcISO('2026-01-05', '5pm', 'UTC')).toThrow();
    expect(() => wallTimeToUtcISO('2026-01-05', '17:00', 'Not/AZone')).toThrow();
  });

  it('formats an instant for display in a timezone', () => {
    const label = formatInTimeZone('2026-12-05T11:30:00.000Z', 'Asia/Kolkata');
    expect(label).toContain('Dec 5');
    expect(label).toContain('5:00');
  });

  it('localTimeZone returns a non-empty string', () => {
    expect(localTimeZone().length).toBeGreaterThan(0);
  });
});

describe('scheduled message presets', () => {
  it('defines the three defaults', () => {
    expect(SCHEDULED_MESSAGE_PRESETS.map((p) => p.key)).toEqual(['reminder_48h', 'welcome', 'goodbye']);
  });

  it('builds bodies with couple + venue interpolated', () => {
    const body = getPreset('reminder_48h')!.build({
      coupleName: 'Priya & Rahul',
      venueName: 'The Leela Palace',
      venueLocation: 'Udaipur',
    });
    expect(body).toContain('Priya & Rahul');
    expect(body).toContain('The Leela Palace, Udaipur');
  });

  it('omits the venue clause for TBD placeholders', () => {
    const body = getPreset('welcome')!.build({
      coupleName: 'Priya & Rahul',
      venueName: 'Venue TBD',
      venueLocation: null,
    });
    expect(body).not.toContain('TBD');
    expect(body).toContain('Priya & Rahul');
  });

  it('computes default send dates relative to the wedding date', () => {
    const wedding = '2026-12-05T00:00:00.000Z';
    expect(presetDefaultDate(getPreset('reminder_48h')!, wedding)).toBe('2026-12-03');
    expect(presetDefaultDate(getPreset('welcome')!, wedding)).toBe('2026-12-04');
    expect(presetDefaultDate(getPreset('goodbye')!, wedding)).toBe('2026-12-06');
  });

  it('returns null for missing or placeholder (epoch) wedding dates', () => {
    expect(presetDefaultDate(getPreset('welcome')!, null)).toBeNull();
    expect(presetDefaultDate(getPreset('welcome')!, new Date(0).toISOString())).toBeNull();
    expect(presetDefaultDate(getPreset('welcome')!, 'not-a-date')).toBeNull();
  });

  it('never uses em dashes in guest-facing copy', () => {
    for (const p of SCHEDULED_MESSAGE_PRESETS) {
      const body = p.build({ coupleName: 'A & B', venueName: 'X', venueLocation: 'Y' });
      expect(body).not.toContain('—');
    }
  });
});
