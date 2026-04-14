import { supabase } from './client';

export interface WeddingRoom {
  id: string;
  wedding_id: string;
  room_number: string;
  floor: string | null;
  hotel_name: string | null;
  capacity: number | null;
  notes: string | null;
  source: 'parsed' | 'manual';
  created_at: string;
  updated_at: string;
}

export interface RoomDraft {
  room_number: string;
  floor?: string | null;
  hotel_name?: string | null;
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

    const rows = rooms.map((r) => ({
      wedding_id: weddingSlug,
      room_number: r.room_number,
      floor: r.floor || null,
      hotel_name: r.hotel_name || null,
      capacity: r.capacity ?? null,
      notes: r.notes || null,
      source: r.source || 'parsed',
    }));

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
    if (patch.room_number !== undefined) updates.room_number = patch.room_number;
    if (patch.floor !== undefined) updates.floor = patch.floor || null;
    if (patch.hotel_name !== undefined) updates.hotel_name = patch.hotel_name || null;
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
};
