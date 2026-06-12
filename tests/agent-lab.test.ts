import { describe, it, expect } from 'vitest';
import {
  isLabSlug,
  seedLabWedding,
  teardownLabWedding,
  dumpLabState,
  GUEST_ROSTER,
  LAB_SLUG_PREFIX,
} from '@/lib/agent/lab/scenarios';
import { createFakeSupabase } from './mocks/fake-supabase';

function fakeForSeed() {
  return createFakeSupabase({
    weddings: { data: { id: 'uuid-lab', slug: 'agent-lab-test' } },
    wedding_schedule: { data: { id: 'day-1' } },
    guests: { data: GUEST_ROSTER.map((g, i) => ({ id: `g-${i}`, name: g.name })) },
  });
}

describe('agent lab scenarios', () => {
  it('recognizes lab slugs', () => {
    expect(isLabSlug(`${LAB_SLUG_PREFIX}abc123`)).toBe(true);
    expect(isLabSlug('priya-rahul-2026')).toBe(false);
  });

  it('blank scenario seeds only the wedding row with onboarding TBD placeholders', async () => {
    const fake = fakeForSeed();
    const result = await seedLabWedding(fake.client as never, { scenario: 'blank', ownerId: 'user-1' });

    expect(result.slug.startsWith(LAB_SLUG_PREFIX)).toBe(true);
    expect(fake.inserts['weddings']).toHaveLength(1);
    const wedding = fake.inserts['weddings'][0] as Record<string, unknown>;
    expect(wedding.venue_name).toBe('Venue TBD');
    expect(wedding.wedding_date_display).toBe('Dates TBD');
    expect(wedding.created_by).toBe('user-1');
    expect(fake.inserts['guests']).toBeUndefined();
    expect(fake.inserts['wedding_rooms']).toBeUndefined();
  });

  it('populated scenario seeds the full storyline', async () => {
    const fake = fakeForSeed();
    const result = await seedLabWedding(fake.client as never, { scenario: 'populated', ownerId: 'user-1' });

    expect(result.summary.guests).toBe(GUEST_ROSTER.length);

    const events = fake.inserts['wedding_events'][0] as Array<Record<string, unknown>>;
    expect(events.map((e) => e.name)).toEqual(['Mehndi', 'Sangeet', 'Pheras', 'Reception']);

    const guests = fake.inserts['guests'][0] as Array<Record<string, unknown>>;
    expect(guests).toHaveLength(GUEST_ROSTER.length);
    expect(guests.every((g) => g.wedding_id === result.slug)).toBe(true);

    // RSVPs use the real string convention
    const rsvps = fake.inserts['rsvps'][0] as Array<Record<string, unknown>>;
    expect(rsvps.every((r) => ['yes', 'no', 'maybe'].includes(r.attending as string))).toBe(true);
    expect(rsvps.every((r) => r.event_id === 'general')).toBe(true);

    // Uncle Raj and his wife are in room 204 — the demo storyline
    const rooms = fake.inserts['wedding_rooms'][0] as Array<Record<string, unknown>>;
    const room204 = rooms.find((r) => r.room_number === '204');
    expect(room204).toBeDefined();
    expect((room204!.assigned_guest_ids as string[]).length).toBe(2);
    expect(rooms.filter((r) => (r.assigned_guest_ids as string[]).length === 0).length).toBeGreaterThan(0);

    // Schedule: 3 days, items batched per day
    expect(fake.inserts['wedding_schedule']).toHaveLength(3);
    expect(fake.inserts['schedule_items']).toHaveLength(3);
    expect(result.summary.schedule_items).toBe(8);

    expect((fake.inserts['vendors'][0] as unknown[]).length).toBe(3);
    expect((fake.inserts['wedding_faqs'][0] as unknown[]).length).toBe(2);
    expect((fake.inserts['wedding_tasks'][0] as unknown[]).length).toBe(2);
  });

  it('teardown refuses non-lab slugs', async () => {
    const fake = createFakeSupabase({});
    await expect(teardownLabWedding(fake.client as never, 'priya-rahul-2026')).rejects.toThrow(
      /Refusing/
    );
  });

  it('state dump refuses non-lab slugs', async () => {
    const fake = createFakeSupabase({});
    await expect(dumpLabState(fake.client as never, 'real-wedding')).rejects.toThrow(/Refusing/);
  });

  it('state dump assembles schedule items under their day', async () => {
    const fake = createFakeSupabase({
      weddings: { data: { id: 'uuid-lab', slug: 'agent-lab-x' } },
      wedding_schedule: { data: [{ id: 'day-1', day_name: 'Day 1', date: '2027-01-01', order_index: 0 }] },
      schedule_items: { data: [{ id: 'i1', schedule_id: 'day-1', name: 'Mehndi', time: '4 PM' }] },
      agent_conversations: { data: [{ id: 'conv-1' }] },
      agent_messages: { data: [{ id: 'm1', conversation_id: 'conv-1', role: 'user', content: [] }] },
    });
    const state = await dumpLabState(fake.client as never, 'agent-lab-x');
    expect((state.schedule[0] as { items: unknown[] }).items).toHaveLength(1);
    expect(state.agent.messages).toHaveLength(1);
  });
});
