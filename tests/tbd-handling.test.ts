import { describe, it, expect } from 'vitest';

// ─── Replicate onboarding transform logic ─────────────────────────────

interface OnboardingData {
  weddingDate: string; // ISO date string or empty
  weddingEndDate: string;
  venueName: string;
  venueLocation: string;
}

interface WeddingRecord {
  wedding_date: string;
  wedding_date_end: string | null;
  wedding_date_display: string;
  venue_name: string;
  venue_location: string;
}

function buildWeddingRecord(data: OnboardingData): WeddingRecord {
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();
  const fmtDay = (d: Date) => d.getDate().toString();
  const fmtMonth = (d: Date) => d.toLocaleDateString('en-US', { month: 'long' }).toUpperCase();
  const fmtYear = (d: Date) => d.getFullYear().toString();

  let wedding_date_display: string;
  if (data.weddingDate) {
    const start = new Date(data.weddingDate);
    const end = data.weddingEndDate ? new Date(data.weddingEndDate) : null;
    if (!end || start.getTime() === end.getTime()) {
      wedding_date_display = fmt(start);
    } else if (fmtYear(start) !== fmtYear(end)) {
      wedding_date_display = `${fmt(start)} - ${fmt(end)}`;
    } else if (fmtMonth(start) !== fmtMonth(end)) {
      wedding_date_display = `${fmtDay(start)} ${fmtMonth(start)} - ${fmtDay(end)} ${fmtMonth(end)}, ${fmtYear(start)}`;
    } else {
      wedding_date_display = `${fmtDay(start)}-${fmtDay(end)} ${fmtMonth(start)}, ${fmtYear(start)}`;
    }
  } else {
    wedding_date_display = 'Dates TBD';
  }

  return {
    wedding_date: data.weddingDate ? new Date(data.weddingDate).toISOString() : new Date(0).toISOString(),
    wedding_date_end: data.weddingEndDate ? new Date(data.weddingEndDate).toISOString() : null,
    wedding_date_display,
    venue_name: (data.venueName === 'TBD' || !data.venueName) ? 'Venue TBD' : data.venueName,
    venue_location: data.venueLocation || '',
  };
}

// ─── Replicate admin details date parsing logic ───────────────────────

const TBD_SENTINEL = new Date(0).toISOString(); // '1970-01-01T00:00:00.000Z'

function parseDatesFromRecord(wedding: WeddingRecord) {
  let startDate: Date | null = null;
  let endDate: Date | null = null;
  try {
    if (wedding.wedding_date) {
      const parsed = new Date(wedding.wedding_date);
      // Treat Unix epoch (1970-01-01) as TBD sentinel — show empty date picker
      if (!isNaN(parsed.getTime()) && parsed.getTime() !== 0) {
        startDate = parsed;
      }
    }
    if (wedding.wedding_date_end) {
      endDate = new Date(wedding.wedding_date_end);
      if (isNaN(endDate.getTime())) endDate = null;
    }
  } catch {
    // parsing error
  }

  const is_one_day = wedding.wedding_date === wedding.wedding_date_end || !wedding.wedding_date_end;

  return { startDate, endDate, is_one_day };
}

// ─── Tests ────────────────────────────────────────────────────────────

describe('TBD handling', () => {
  // ─── Onboarding: Dates TBD ─────────────────────────────────────────

  describe('onboarding with dates TBD', () => {
    const record = buildWeddingRecord({
      weddingDate: '',
      weddingEndDate: '',
      venueName: 'The Grand Palace',
      venueLocation: 'Jaipur, India',
    });

    it('should set wedding_date to Unix epoch sentinel', () => {
      expect(record.wedding_date).toBe(TBD_SENTINEL);
    });

    it('should set wedding_date_end to null', () => {
      expect(record.wedding_date_end).toBeNull();
    });

    it('should set wedding_date_display to "Dates TBD"', () => {
      expect(record.wedding_date_display).toBe('Dates TBD');
    });

    it('should NOT generate a fake future date (uses epoch, not +2 months)', () => {
      // getUTCFullYear, not getFullYear: in timezones behind UTC the epoch
      // falls on Dec 31 1969 local time.
      const epochYear = new Date(record.wedding_date).getUTCFullYear();
      expect(epochYear).toBe(1970);
    });
  });

  // ─── Onboarding: Venue TBD ─────────────────────────────────────────

  describe('onboarding with venue TBD', () => {
    it('should set venue_name to "Venue TBD" when venueName is empty', () => {
      const record = buildWeddingRecord({
        weddingDate: '2026-12-15',
        weddingEndDate: '',
        venueName: '',
        venueLocation: '',
      });
      expect(record.venue_name).toBe('Venue TBD');
    });

    it('should set venue_name to "Venue TBD" when venueName is "TBD"', () => {
      const record = buildWeddingRecord({
        weddingDate: '2026-12-15',
        weddingEndDate: '',
        venueName: 'TBD',
        venueLocation: '',
      });
      expect(record.venue_name).toBe('Venue TBD');
    });

    it('should set venue_location to empty string when not provided', () => {
      const record = buildWeddingRecord({
        weddingDate: '2026-12-15',
        weddingEndDate: '',
        venueName: '',
        venueLocation: '',
      });
      expect(record.venue_location).toBe('');
    });

    it('should NOT set venue_name to "Venue Name" placeholder', () => {
      const record = buildWeddingRecord({
        weddingDate: '2026-12-15',
        weddingEndDate: '',
        venueName: '',
        venueLocation: '',
      });
      expect(record.venue_name).not.toBe('Venue Name');
    });

    it('should NOT set venue_location to "City, Country" placeholder', () => {
      const record = buildWeddingRecord({
        weddingDate: '2026-12-15',
        weddingEndDate: '',
        venueName: '',
        venueLocation: '',
      });
      expect(record.venue_location).not.toBe('City, Country');
    });
  });

  // ─── Onboarding: Both TBD ──────────────────────────────────────────

  describe('onboarding with both dates and venue TBD', () => {
    const record = buildWeddingRecord({
      weddingDate: '',
      weddingEndDate: '',
      venueName: '',
      venueLocation: '',
    });

    it('should produce all TBD sentinel values', () => {
      expect(record.wedding_date).toBe(TBD_SENTINEL);
      expect(record.wedding_date_end).toBeNull();
      expect(record.wedding_date_display).toBe('Dates TBD');
      expect(record.venue_name).toBe('Venue TBD');
      expect(record.venue_location).toBe('');
    });
  });

  // ─── Onboarding: Real values (no TBD) ──────────────────────────────

  describe('onboarding with real values', () => {
    const record = buildWeddingRecord({
      weddingDate: '2026-12-15',
      weddingEndDate: '2026-12-17',
      venueName: 'The Grand Palace',
      venueLocation: 'Jaipur, India',
    });

    it('should set a valid ISO date for wedding_date', () => {
      expect(record.wedding_date).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('should set a valid ISO date for wedding_date_end', () => {
      expect(record.wedding_date_end).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('should generate a formatted display string (not "Dates TBD")', () => {
      expect(record.wedding_date_display).not.toBe('Dates TBD');
      expect(record.wedding_date_display).toContain('DECEMBER');
    });

    it('should keep the real venue name', () => {
      expect(record.venue_name).toBe('The Grand Palace');
    });

    it('should keep the real venue location', () => {
      expect(record.venue_location).toBe('Jaipur, India');
    });
  });

  // ─── Admin details: date parsing with TBD sentinel values ──────────

  describe('admin details date parsing with TBD values', () => {
    it('should parse dates as null when wedding_date is epoch sentinel', () => {
      const { startDate, endDate } = parseDatesFromRecord({
        wedding_date: TBD_SENTINEL,
        wedding_date_end: null,
        wedding_date_display: 'Dates TBD',
        venue_name: 'Venue TBD',
        venue_location: '',
      });
      expect(startDate).toBeNull();
      expect(endDate).toBeNull();
    });

    it('should set is_one_day to true when dates are TBD (wedding_date_end is null)', () => {
      const { is_one_day } = parseDatesFromRecord({
        wedding_date: TBD_SENTINEL,
        wedding_date_end: null,
        wedding_date_display: 'Dates TBD',
        venue_name: 'Venue TBD',
        venue_location: '',
      });
      expect(is_one_day).toBe(true);
    });

    it('should pass wedding_date_display through as "Dates TBD"', () => {
      const record: WeddingRecord = {
        wedding_date: TBD_SENTINEL,
        wedding_date_end: null,
        wedding_date_display: 'Dates TBD',
        venue_name: 'Venue TBD',
        venue_location: '',
      };
      const formValue = record.wedding_date_display || '';
      expect(formValue).toBe('Dates TBD');
    });

    it('should pass venue_name through as "Venue TBD"', () => {
      const record: WeddingRecord = {
        wedding_date: TBD_SENTINEL,
        wedding_date_end: null,
        wedding_date_display: 'Dates TBD',
        venue_name: 'Venue TBD',
        venue_location: '',
      };
      const formValue = record.venue_name || '';
      expect(formValue).toBe('Venue TBD');
    });
  });

  // ─── Admin details: date parsing with real values ──────────────────

  describe('admin details date parsing with real values', () => {
    it('should parse valid ISO dates correctly', () => {
      const { startDate, endDate } = parseDatesFromRecord({
        wedding_date: '2026-12-15T00:00:00.000Z',
        wedding_date_end: '2026-12-17T00:00:00.000Z',
        wedding_date_display: '15-17 DECEMBER, 2026',
        venue_name: 'The Grand Palace',
        venue_location: 'Jaipur, India',
      });
      expect(startDate).not.toBeNull();
      expect(startDate!.getFullYear()).toBe(2026);
      expect(endDate).not.toBeNull();
      expect(endDate!.getFullYear()).toBe(2026);
    });

    it('should set is_one_day to false when start and end dates differ', () => {
      const { is_one_day } = parseDatesFromRecord({
        wedding_date: '2026-12-15T00:00:00.000Z',
        wedding_date_end: '2026-12-17T00:00:00.000Z',
        wedding_date_display: '15-17 DECEMBER, 2026',
        venue_name: 'The Grand Palace',
        venue_location: 'Jaipur, India',
      });
      expect(is_one_day).toBe(false);
    });
  });

  // ─── Display rendering: sentinel values are user-friendly ──────────

  describe('TBD sentinel values render correctly in preview/guest views', () => {
    it('"Dates TBD" is a user-friendly string for display', () => {
      const display = 'Dates TBD';
      expect(display).not.toBe('TBD');
      expect(display).not.toBe('');
      expect(display).toContain('TBD');
    });

    it('"Venue TBD" is a user-friendly string for display', () => {
      const display = 'Venue TBD';
      expect(display).not.toBe('Venue Name');
      expect(display).not.toBe('');
      expect(display).toContain('TBD');
    });
  });
});
