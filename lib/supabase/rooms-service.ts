/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from './client';

/**
 * Canonicalize a room number so superficial variants (zero-padding, casing,
 * surrounding whitespace) collapse to the same value. Examples:
 *   "V.09"   → "V.9"
 *   "v.9"    → "V.9"
 *   "PH-02"  → "PH-2"
 *   " 1207 " → "1207"
 *
 * Letters keep their casing only for the FIRST normalization pass; downstream
 * duplicate-checks use the lowercased form. The returned value is what gets
 * stored in the DB so the user sees a single canonical entry per real room.
 */
export function canonicalizeRoomNumber(raw: string): string {
  if (!raw) return '';
  let s = raw.trim();
  // Collapse internal whitespace runs to a single space
  s = s.replace(/\s+/g, ' ');
  // Strip leading zeros from each numeric segment (keep at least one digit)
  s = s.replace(/\d+/g, (digits) => {
    const trimmed = digits.replace(/^0+/, '');
    return trimmed.length === 0 ? '0' : trimmed;
  });
  // Uppercase any leading alpha prefix so "v.9" and "V.9" agree
  s = s.replace(/^[a-z]+/, (m) => m.toUpperCase());
  return s;
}

export interface WeddingRoom {
  id: string;
  wedding_id: string;
  room_number: string;
  floor: string | null;
  hotel_name: string | null;
  bed_type: string | null;
  capacity: number | null;
  notes: string | null;
  source: 'parsed' | 'manual';
  assigned_guest_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface RoomDraft {
  room_number: string;
  floor?: string | null;
  hotel_name?: string | null;
  bed_type?: string | null;
  capacity?: number | null;
  notes?: string | null;
  source?: 'parsed' | 'manual';
}

export const roomsService = {
  async list(weddingSlug: string): Promise<WeddingRoom[]> {
    const { data, error } = await (supabase as any)
      .from('wedding_rooms')
      .select('*')
      .eq('wedding_id', weddingSlug)
      .order('hotel_name', { ascending: true, nullsFirst: true })
      .order('floor', { ascending: true, nullsFirst: false })
      .order('room_number', { ascending: true });

    if (error) {
      console.error('roomsService.list error:', error);
      return [];
    }
    return (data || []) as WeddingRoom[];
  },

  async insertMany(weddingSlug: string, rooms: RoomDraft[]): Promise<WeddingRoom[]> {
    if (rooms.length === 0) return [];

    // Canonicalize + intra-batch dedupe so "V.9" and "V.09" don't both hit
    // the DB as separate rows. Last-write-wins for fields when the same
    // canonical room number appears multiple times in this batch.
    const seen = new Map<string, ReturnType<typeof toRow>>();
    function toRow(r: RoomDraft) {
      return {
        wedding_id: weddingSlug,
        room_number: canonicalizeRoomNumber(r.room_number),
        floor: r.floor || null,
        hotel_name: r.hotel_name || null,
        bed_type: r.bed_type || null,
        capacity: r.capacity ?? null,
        notes: r.notes || null,
        source: r.source || 'parsed',
      };
    }
    for (const r of rooms) {
      if (!r.room_number?.trim()) continue;
      const row = toRow(r);
      if (!row.room_number) continue;
      const key = `${(row.hotel_name || '').toLowerCase()}|${row.room_number.toLowerCase()}`;
      const prior = seen.get(key);
      if (prior) {
        // Merge: prefer non-null values from either source
        seen.set(key, {
          ...prior,
          floor: row.floor || prior.floor,
          capacity: row.capacity ?? prior.capacity,
          notes: row.notes || prior.notes,
          hotel_name: row.hotel_name || prior.hotel_name,
        });
      } else {
        seen.set(key, row);
      }
    }
    const rows = Array.from(seen.values());

    const { data, error } = await (supabase as any)
      .from('wedding_rooms')
      .upsert(rows, {
        onConflict: 'wedding_id,hotel_name,room_number',
        ignoreDuplicates: true,
      })
      .select('*');

    if (error) {
      console.error('roomsService.insertMany error:', error);
      return [];
    }
    return (data || []) as WeddingRoom[];
  },

  async update(id: string, patch: Partial<RoomDraft>): Promise<WeddingRoom | null> {
    const updates: Record<string, any> = {};
    if (patch.room_number !== undefined) updates.room_number = canonicalizeRoomNumber(patch.room_number);
    if (patch.floor !== undefined) updates.floor = patch.floor || null;
    if (patch.hotel_name !== undefined) updates.hotel_name = patch.hotel_name || null;
    if (patch.bed_type !== undefined) updates.bed_type = patch.bed_type || null;
    if (patch.capacity !== undefined) updates.capacity = patch.capacity ?? null;
    if (patch.notes !== undefined) updates.notes = patch.notes || null;

    const { data, error } = await (supabase as any)
      .from('wedding_rooms')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('roomsService.update error:', error);
      return null;
    }
    return data as WeddingRoom;
  },

  async remove(id: string): Promise<boolean> {
    const { error } = await (supabase as any).from('wedding_rooms').delete().eq('id', id);
    if (error) {
      console.error('roomsService.remove error:', error);
      return false;
    }
    return true;
  },

  async insertOne(weddingSlug: string, room: RoomDraft): Promise<WeddingRoom | null> {
    const result = await this.insertMany(weddingSlug, [{ ...room, source: room.source || 'manual' }]);
    return result[0] || null;
  },

  async setAssignments(id: string, guestIds: string[]): Promise<WeddingRoom | null> {
    const { data, error } = await (supabase as any)
      .from('wedding_rooms')
      .update({ assigned_guest_ids: guestIds })
      .eq('id', id)
      .select('*')
      .single();
    if (error) {
      console.error('roomsService.setAssignments error:', error);
      return null;
    }
    return data as WeddingRoom;
  },

  async clearAllAssignments(weddingSlug: string): Promise<boolean> {
    const { error } = await (supabase as any)
      .from('wedding_rooms')
      .update({ assigned_guest_ids: [] })
      .eq('wedding_id', weddingSlug);
    if (error) {
      console.error('roomsService.clearAllAssignments error:', error);
      return false;
    }
    return true;
  },

  async removeAll(weddingSlug: string): Promise<boolean> {
    const { error } = await (supabase as any)
      .from('wedding_rooms')
      .delete()
      .eq('wedding_id', weddingSlug);
    if (error) {
      console.error('roomsService.removeAll error:', error);
      return false;
    }
    return true;
  },
};
