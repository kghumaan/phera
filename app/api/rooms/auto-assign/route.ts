/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

interface Guest {
  id: string;
  name: string | null;
  wedding_side: 'bride' | 'groom' | 'both' | null;
  logistics_data: Record<string, any> | null;
}

interface Room {
  id: string;
  capacity: number | null;
}

function tagOf(g: Guest): string {
  const t = g.logistics_data?.tag;
  return typeof t === 'string' && t.trim() ? t.trim().toLowerCase() : '';
}

function sortByTag(list: Guest[]): Guest[] {
  return [...list].sort((a, b) => {
    const ta = tagOf(a);
    const tb = tagOf(b);
    if (ta !== tb) return ta.localeCompare(tb);
    return (a.name || '').localeCompare(b.name || '');
  });
}

// Fill rooms with guests in order, respecting each room's capacity.
// Writes to assignments map in-place and returns leftover guests that didn't fit.
function fillRooms(
  rooms: Room[],
  guests: Guest[],
  assignments: Map<string, string[]>,
): Guest[] {
  let cursor = 0;
  for (const room of rooms) {
    const cap = room.capacity ?? 0;
    const existing = assignments.get(room.id) ?? [];
    const take = Math.max(0, cap - existing.length);
    if (take <= 0) continue;
    const chunk = guests.slice(cursor, cursor + take);
    cursor += chunk.length;
    assignments.set(room.id, [...existing, ...chunk.map((g) => g.id)]);
    if (cursor >= guests.length) break;
  }
  return guests.slice(cursor);
}

export async function POST(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ error: 'Supabase env vars missing' }, { status: 500 });
  }
  const supabase = createClient(url, serviceKey);

  try {
    const { weddingSlug } = await request.json();
    if (!weddingSlug || typeof weddingSlug !== 'string') {
      return NextResponse.json({ error: 'weddingSlug is required' }, { status: 400 });
    }

    const [{ data: guestsData, error: guestsErr }, { data: roomsData, error: roomsErr }] = await Promise.all([
      supabase
        .from('guests')
        .select('id, name, wedding_side, logistics_data')
        .eq('wedding_id', weddingSlug),
      supabase
        .from('wedding_rooms')
        .select('id, capacity, floor, hotel_name, room_number')
        .eq('wedding_id', weddingSlug),
    ]);

    if (guestsErr) {
      return NextResponse.json({ error: `Failed to load guests: ${guestsErr.message}` }, { status: 500 });
    }
    if (roomsErr) {
      return NextResponse.json({ error: `Failed to load rooms: ${roomsErr.message}` }, { status: 500 });
    }

    const guests = (guestsData || []) as unknown as Guest[];
    const rooms = (roomsData || []) as unknown as Room[];

    if (rooms.length === 0) {
      return NextResponse.json({ error: 'No rooms to assign' }, { status: 400 });
    }
    if (guests.length === 0) {
      return NextResponse.json({ error: 'No guests to assign' }, { status: 400 });
    }

    // Bucket guests by side. Non-specified side gets treated as flex capacity.
    const brideGuests = sortByTag(guests.filter((g) => g.wedding_side === 'bride'));
    const groomGuests = sortByTag(guests.filter((g) => g.wedding_side === 'groom'));
    const bothGuests = sortByTag(
      guests.filter((g) => g.wedding_side === 'both' || g.wedding_side == null),
    );

    // Sort rooms best-first (capacity desc), stable by room id.
    const sortedRooms = [...rooms].sort((a, b) => (b.capacity ?? 0) - (a.capacity ?? 0));

    // Split rooms alternately between bride and groom so both sides get an
    // equitable mix of big/small rooms. Rooms only flow to a side if that side
    // still has unseated guests — otherwise they stack into the other side's
    // list so nothing is wasted.
    const brideRooms: Room[] = [];
    const groomRooms: Room[] = [];
    let brideNeed = brideGuests.length;
    let groomNeed = groomGuests.length;
    let toggle: 'bride' | 'groom' = brideNeed >= groomNeed ? 'bride' : 'groom';
    for (const room of sortedRooms) {
      const cap = room.capacity ?? 0;
      if (cap <= 0) continue;
      if (toggle === 'bride') {
        if (brideNeed > 0) {
          brideRooms.push(room);
          brideNeed -= cap;
        } else if (groomNeed > 0) {
          groomRooms.push(room);
          groomNeed -= cap;
        }
        toggle = 'groom';
      } else {
        if (groomNeed > 0) {
          groomRooms.push(room);
          groomNeed -= cap;
        } else if (brideNeed > 0) {
          brideRooms.push(room);
          brideNeed -= cap;
        }
        toggle = 'bride';
      }
    }

    const assignments = new Map<string, string[]>();
    rooms.forEach((r) => assignments.set(r.id, []));

    // Fill side-specific rooms first.
    const leftoverBride = fillRooms(brideRooms, brideGuests, assignments);
    const leftoverGroom = fillRooms(groomRooms, groomGuests, assignments);

    // Both-side guests + any leftover side guests fill remaining capacity
    // across all rooms (smallest remaining capacity first so we finish-pack).
    const flexGuests = [...bothGuests, ...leftoverBride, ...leftoverGroom];
    const roomsWithSpace = rooms
      .map((r) => ({
        r,
        remaining: (r.capacity ?? 0) - (assignments.get(r.id)?.length ?? 0),
      }))
      .filter((x) => x.remaining > 0)
      .sort((a, b) => a.remaining - b.remaining);
    fillRooms(
      roomsWithSpace.map((x) => x.r),
      flexGuests,
      assignments,
    );

    // Persist: overwrite assigned_guest_ids for every room.
    const updates = rooms.map((r) => ({
      id: r.id,
      assigned_guest_ids: assignments.get(r.id) ?? [],
    }));

    // Supabase lacks bulk partial updates in one call without upsert-primary
    // gymnastics, so run them in parallel. Volume here is bounded by room
    // count (tens).
    const results = await Promise.all(
      updates.map((u) =>
        supabase
          .from('wedding_rooms')
          .update({ assigned_guest_ids: u.assigned_guest_ids })
          .eq('id', u.id),
      ),
    );
    const failed = results.find((r) => r.error);
    if (failed?.error) {
      return NextResponse.json(
        { error: `Failed to persist assignments: ${failed.error.message}` },
        { status: 500 },
      );
    }

    const totalAssigned = updates.reduce((sum, u) => sum + u.assigned_guest_ids.length, 0);
    return NextResponse.json({
      success: true,
      assignedCount: totalAssigned,
      totalGuests: guests.length,
      roomsUpdated: updates.length,
    });
  } catch (err: any) {
    console.error('rooms/auto-assign error:', err);
    return NextResponse.json({ error: err?.message || 'Internal error' }, { status: 500 });
  }
}
