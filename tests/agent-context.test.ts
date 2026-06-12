import { describe, it, expect } from 'vitest';
import { buildWeddingSnapshot } from '@/lib/agent/context';
import { createFakeSupabase } from './mocks/fake-supabase';

const BARE_WEDDING = {
  couple_name: null,
  partner1_name: 'Priya',
  partner2_name: 'Rahul',
  wedding_date: null,
  wedding_date_end: null,
  venue_name: null,
  venue_location: null,
  rsvp_deadline: null,
  status: 'draft',
};

describe('buildWeddingSnapshot', () => {
  it('flags missing basics for a fresh wedding', async () => {
    const fake = createFakeSupabase({
      weddings: { data: BARE_WEDDING },
      guests: { count: 0 },
      rsvps: { data: [] },
      wedding_rooms: { count: 0 },
      vendors: { count: 0 },
      wedding_events: { count: 0 },
      wedding_schedule: { count: 0 },
      wedding_faqs: { count: 0 },
      wedding_tasks: { count: 0 },
    });
    const snapshot = await buildWeddingSnapshot(fake.client as never, 'slug', 'uuid');

    const byKey = Object.fromEntries(snapshot.completeness.map((c) => [c.key, c.done]));
    expect(byKey.date).toBe(false);
    expect(byKey.venue).toBe(false);
    expect(byKey.guests).toBe(false);
    expect(snapshot.text).toContain('NOT SET');
    expect(snapshot.text).toContain('Priya & Rahul');
    expect(snapshot.text).toContain("Today's date:");
  });

  it('marks progress for a populated wedding', async () => {
    const fake = createFakeSupabase({
      weddings: {
        data: {
          ...BARE_WEDDING,
          couple_name: 'Priya & Rahul',
          wedding_date: '2027-01-15',
          venue_name: 'The Leela Palace',
          venue_location: 'Udaipur, India',
          rsvp_deadline: '2026-11-01',
        },
      },
      guests: { count: 120 },
      rsvps: { data: [{ guest_id: 'g1' }, { guest_id: 'g1' }, { guest_id: 'g2' }] },
      wedding_rooms: { count: 30 },
      vendors: { count: 4 },
      wedding_events: { count: 5 },
      wedding_schedule: { count: 3 },
      wedding_faqs: { count: 6 },
      wedding_tasks: { count: 7 },
    });
    const snapshot = await buildWeddingSnapshot(fake.client as never, 'slug', 'uuid');

    const byKey = Object.fromEntries(snapshot.completeness.map((c) => [c.key, c.done]));
    for (const key of ['date', 'venue', 'events', 'schedule', 'guests', 'rsvps', 'rsvp_deadline', 'rooms', 'vendors', 'faqs']) {
      expect(byKey[key], key).toBe(true);
    }
    // distinct responders, not raw rsvp rows
    expect(snapshot.text).toContain('120 (2 responded)');
    expect(snapshot.text).toContain('The Leela Palace');
    expect(snapshot.text).toContain('days away');
  });

  it('throws when the wedding row is missing', async () => {
    const fake = createFakeSupabase({ weddings: { data: null } });
    await expect(buildWeddingSnapshot(fake.client as never, 'slug', 'uuid')).rejects.toThrow(
      /not found/i
    );
  });
});
