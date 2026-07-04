import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  FIXTURE_EVENTS,
  FIXTURE_GUESTS,
  FIXTURE_RSVPS,
  FIXTURE_SCHEDULE,
  FIXTURE_WEDDING,
} from '@/lib/mock/fixtures';
import { supabase } from '@/lib/supabase/client';
import type {
  Guest,
  Rsvp,
  ScheduleDay,
  ScheduleItem,
  Wedding,
  WeddingEvent,
} from './types';

/**
 * TanStack Query hooks — the ONLY way screens read wedding data.
 * With Supabase configured they run the same queries as the web app;
 * in preview mode they resolve mock fixtures through the same interface,
 * so screens are agnostic. In-memory mutation of fixtures keeps preview
 * interactions (add guest, etc.) feeling real within a session.
 */

// Mutable copy so preview-mode writes show up in subsequent reads.
let previewGuests: Guest[] = [...FIXTURE_GUESTS];

const GUEST_SELECT =
  'id, name, email, phone, wedding_side, logistics_data, initials, avatar_color, created_at, rsvps(attending, guest_count, created_at)';

export function useWeddings() {
  return useQuery({
    queryKey: ['weddings'],
    queryFn: async (): Promise<Wedding[]> => {
      if (!supabase) return [FIXTURE_WEDDING];
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) return [];
      // Owned weddings + collaborator weddings (wedding_admins), matching
      // web weddingService.getUserWeddings.
      const { data: adminEntries } = await supabase
        .from('wedding_admins')
        .select('wedding_id')
        .eq('user_id', userId);
      const adminIds = (adminEntries ?? []).map((e) => e.wedding_id as string);
      const orFilter =
        adminIds.length > 0
          ? `created_by.eq.${userId},id.in.(${adminIds.join(',')})`
          : `created_by.eq.${userId}`;
      const { data, error } = await supabase
        .from('weddings')
        .select('*')
        .or(orFilter)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as Wedding[]).filter((w) => !w.slug.startsWith('demo-'));
    },
  });
}

export function useWedding(slug: string) {
  return useQuery({
    queryKey: ['wedding', slug],
    queryFn: async (): Promise<Wedding | null> => {
      if (!supabase) return FIXTURE_WEDDING;
      const { data, error } = await supabase.from('weddings').select('*').eq('slug', slug).single();
      if (error) throw error;
      return data as Wedding;
    },
  });
}

export function useGuests(slug: string) {
  return useQuery({
    queryKey: ['guests', slug],
    queryFn: async (): Promise<Guest[]> => {
      if (!supabase) return previewGuests;
      const { data, error } = await supabase
        .from('guests')
        .select(GUEST_SELECT)
        .eq('wedding_id', slug) // slug, not UUID — guests key on the slug
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as Guest[];
    },
  });
}

export interface NewGuestInput {
  name: string;
  phone: string;
  email?: string;
  wedding_side?: Guest['wedding_side'];
}

const AVATAR_PALETTE = ['#DE3F5E', '#3b82f6', '#20C997', '#6C5CE7', '#FF9933', '#D4AF37', '#FF6B6B'];

function avatarColorFor(name: string): string {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length]!;
}

export function useAddGuest(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: NewGuestInput): Promise<void> => {
      const row = {
        name: input.name.trim(),
        email: (input.email ?? '').trim().toLowerCase(),
        phone: input.phone.trim(),
        wedding_id: slug,
        wedding_side: input.wedding_side ?? null,
        avatar_color: avatarColorFor(input.name),
      };
      if (!supabase) {
        previewGuests = [
          {
            id: `preview-${previewGuests.length + 1}`,
            ...row,
            initials: null,
            logistics_data: null,
            created_at: new Date().toISOString(),
            rsvps: [],
          },
          ...previewGuests,
        ];
        return;
      }
      const { error } = await supabase.from('guests').insert(row);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['guests', slug] }),
  });
}

export function useRsvps(slug: string) {
  return useQuery({
    queryKey: ['rsvps', slug],
    queryFn: async (): Promise<Rsvp[]> => {
      if (!supabase) return FIXTURE_RSVPS;
      // Same join as web getAllRSVPs (rsvp-service.ts:383).
      const { data, error } = await supabase
        .from('rsvps')
        .select('*, guest:guests(id, name, avatar_color, wedding_side)')
        .eq('wedding_id', slug)
        .eq('event_id', 'general')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as Rsvp[];
    },
  });
}

export function useEvents(weddingId: string | undefined) {
  return useQuery({
    queryKey: ['events', weddingId],
    enabled: !!weddingId,
    queryFn: async (): Promise<WeddingEvent[]> => {
      if (!supabase) return FIXTURE_EVENTS;
      const { data, error } = await supabase
        .from('wedding_events')
        .select('*')
        .eq('wedding_id', weddingId!) // UUID, not slug
        .order('order_index', { ascending: true });
      if (error) throw error;
      return data as WeddingEvent[];
    },
  });
}

export function useSchedule(weddingId: string | undefined) {
  return useQuery({
    queryKey: ['schedule', weddingId],
    enabled: !!weddingId,
    queryFn: async (): Promise<ScheduleDay[]> => {
      if (!supabase) return FIXTURE_SCHEDULE;
      // Two-step fetch matching web getWeddingSchedule (wedding-service.ts:374).
      const { data: days, error } = await supabase
        .from('wedding_schedule')
        .select('*')
        .eq('wedding_id', weddingId!) // UUID
        .order('order_index', { ascending: true });
      if (error) throw error;
      const dayIds = (days ?? []).map((d) => d.id as string);
      if (dayIds.length === 0) return [];
      const { data: items, error: itemsError } = await supabase
        .from('schedule_items')
        .select('*')
        .in('schedule_id', dayIds)
        .order('order_index', { ascending: true });
      if (itemsError) throw itemsError;
      return (days ?? []).map((d) => ({
        ...(d as Omit<ScheduleDay, 'events'>),
        events: ((items ?? []) as ScheduleItem[]).filter((i) => i.schedule_id === d.id),
      }));
    },
  });
}
