import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  FIXTURE_BROADCASTS,
  FIXTURE_CONCIERGE,
  FIXTURE_EVENTS,
  FIXTURE_FAQS,
  FIXTURE_FLIGHTS,
  FIXTURE_GUESTS,
  FIXTURE_RESERVATIONS,
  FIXTURE_ROOMS,
  FIXTURE_RSVPS,
  FIXTURE_SCHEDULE,
  FIXTURE_TASKS,
  FIXTURE_VEHICLES,
  FIXTURE_WEDDING,
} from '@/lib/mock/fixtures';
import { supabase } from '@/lib/supabase/client';
import type {
  Broadcast,
  ConciergeConversation,
  ConciergeStats,
  Guest,
  GuestFlight,
  Reservation,
  Rsvp,
  ScheduleDay,
  ScheduleItem,
  TaskColumn,
  Vehicle,
  Wedding,
  WeddingEvent,
  WeddingRoom,
  WeddingTask,
} from './types';

/**
 * TanStack Query hooks — the ONLY way screens read wedding data.
 * With Supabase configured they run the same queries as the web app;
 * in preview mode they resolve mock fixtures through the same interface,
 * so screens are agnostic. In-memory mutation of fixtures keeps preview
 * interactions (add guest, etc.) feeling real within a session.
 */

// Mutable copies so preview-mode writes show up in subsequent reads.
let previewGuests: Guest[] = [...FIXTURE_GUESTS];
let previewTasks: WeddingTask[] = [...FIXTURE_TASKS];
let previewFlights: GuestFlight[] = [...FIXTURE_FLIGHTS];

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

export interface FlightInput {
  guestId: string;
  airline: string;
  flightNumber: string;
  departureAirport: string;
  arrivalAirport: string;
  arrivalDate: string; // YYYY-MM-DD
  arrivalTime: string; // HH:mm
  shuttlePreferenceTime: string | null;
}

export function useUpsertGuestFlight(weddingId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: FlightInput) => {
      const arrival = `${input.arrivalDate}T${input.arrivalTime}:00`;
      if (!supabase) {
        const flight: GuestFlight = {
          id: `pf-${input.guestId}`,
          guest_id: input.guestId,
          airline: input.airline,
          flight_number: input.flightNumber,
          departure_airport: input.departureAirport.toUpperCase(),
          arrival_airport: input.arrivalAirport.toUpperCase(),
          departure_datetime: null,
          arrival_datetime: arrival,
          shuttle_preference_time: input.shuttlePreferenceTime,
          guest: {
            id: input.guestId,
            name: previewGuests.find((g) => g.id === input.guestId)?.name ?? 'Guest',
          },
        };
        previewFlights = [...previewFlights.filter((f) => f.guest_id !== input.guestId), flight];
        return;
      }
      // Same upsert contract as web upsertGuestFlight (travel-service.ts:201).
      const { error } = await supabase.from('guest_flights').upsert(
        {
          guest_id: input.guestId,
          wedding_id: weddingId!,
          airline: input.airline,
          flight_number: input.flightNumber,
          departure_airport: input.departureAirport.toUpperCase(),
          arrival_airport: input.arrivalAirport.toUpperCase(),
          arrival_datetime: arrival,
          shuttle_preference_time: input.shuttlePreferenceTime,
        },
        { onConflict: 'guest_id,wedding_id' },
      );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['guest-flights', weddingId] }),
  });
}

export function useGuestFlights(weddingId: string | undefined) {
  return useQuery({
    queryKey: ['guest-flights', weddingId],
    enabled: !!weddingId,
    queryFn: async (): Promise<GuestFlight[]> => {
      if (!supabase) return previewFlights;
      // Same join as web getAllGuestFlights (travel-service.ts:255).
      const { data, error } = await supabase
        .from('guest_flights')
        .select('*, guest:guests(id, name, email, phone)')
        .eq('wedding_id', weddingId!) // UUID
        .order('arrival_datetime', { ascending: true });
      if (error) throw error;
      return data as unknown as GuestFlight[];
    },
  });
}

export function useVehiclesWithCapacity(weddingId: string | undefined) {
  return useQuery({
    queryKey: ['vehicles', weddingId],
    enabled: !!weddingId,
    queryFn: async (): Promise<Vehicle[]> => {
      if (!supabase) return FIXTURE_VEHICLES;
      // Mirrors web getAllVehiclesWithCapacity (transportation-service.ts:649):
      // embed reservations, sum non-cancelled party sizes client-side.
      const { data, error } = await supabase
        .from('transportation_vehicles')
        .select('*, transportation_reservations(party_size, status)')
        .eq('wedding_id', weddingId!) // UUID
        .order('order_index', { ascending: true });
      if (error) throw error;
      type Row = Omit<Vehicle, 'booked' | 'available'> & {
        transportation_reservations: { party_size: number | null; status: string | null }[];
      };
      return (data as unknown as Row[]).map(({ transportation_reservations, ...v }) => {
        const booked = transportation_reservations
          .filter((r) => r.status !== 'cancelled')
          .reduce((sum, r) => sum + (r.party_size ?? 1), 0);
        return { ...v, booked, available: Math.max(0, v.capacity - booked) };
      });
    },
  });
}

export function useReservations(weddingId: string | undefined) {
  return useQuery({
    queryKey: ['reservations', weddingId],
    enabled: !!weddingId,
    queryFn: async (): Promise<Reservation[]> => {
      if (!supabase) return FIXTURE_RESERVATIONS;
      const { data, error } = await supabase
        .from('transportation_reservations')
        .select('*, guest:guests(id, name)')
        .eq('wedding_id', weddingId!) // UUID
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as unknown as Reservation[];
    },
  });
}

export function useRooms(slug: string) {
  return useQuery({
    queryKey: ['rooms', slug],
    queryFn: async (): Promise<WeddingRoom[]> => {
      if (!supabase) return FIXTURE_ROOMS;
      // Same ordering as web roomsService.list (rooms-service.ts:57).
      const { data, error } = await supabase
        .from('wedding_rooms')
        .select('*')
        .eq('wedding_id', slug) // slug, not UUID
        .order('hotel_name', { ascending: true })
        .order('floor', { ascending: true })
        .order('room_number', { ascending: true });
      if (error) throw error;
      return data as WeddingRoom[];
    },
  });
}

export function useTasks(weddingId: string | undefined) {
  return useQuery({
    queryKey: ['tasks', weddingId],
    enabled: !!weddingId,
    queryFn: async (): Promise<WeddingTask[]> => {
      if (!supabase) return previewTasks;
      const { data, error } = await supabase
        .from('wedding_tasks')
        .select('*')
        .eq('wedding_id', weddingId!) // UUID
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as WeddingTask[];
    },
  });
}

export function useMoveTask(weddingId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, column }: { id: string; column: TaskColumn }) => {
      if (!supabase) {
        previewTasks = previewTasks.map((t) => (t.id === id ? { ...t, column } : t));
        return;
      }
      const { error } = await supabase.from('wedding_tasks').update({ column }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', weddingId] }),
  });
}

export function useBroadcasts(slug: string) {
  return useQuery({
    queryKey: ['broadcasts', slug],
    queryFn: async (): Promise<Broadcast[]> => {
      if (!supabase) return FIXTURE_BROADCASTS;
      // Same rollup as web broadcastsService.list (broadcasts-service.ts:54).
      const { data, error } = await supabase
        .from('concierge_broadcasts')
        .select('*, concierge_broadcast_recipients(id, delivery_status, replied_at)')
        .eq('wedding_id', slug) // slug
        .order('created_at', { ascending: false });
      if (error) throw error;
      type Row = Broadcast & {
        concierge_broadcast_recipients: { delivery_status: string; replied_at: string | null }[];
      };
      return (data as unknown as Row[]).map(({ concierge_broadcast_recipients: r, ...b }) => ({
        ...b,
        recipient_count: r.length,
        delivered_count: r.filter((x) => x.delivery_status === 'delivered' || x.delivery_status === 'read').length,
        replied_count: r.filter((x) => !!x.replied_at).length,
      }));
    },
  });
}

export function useConcierge(weddingId: string | undefined) {
  return useQuery({
    queryKey: ['concierge', weddingId],
    enabled: !!weddingId,
    queryFn: async (): Promise<ConciergeStats> => {
      if (!supabase) return FIXTURE_CONCIERGE;
      // Mirrors /api/concierge/stats + /conversations grouping. Note the web
      // conversations route uses the service role; if RLS blocks this direct
      // read for couple accounts we fall back to the API in Phase 4 wiring.
      const { data, error } = await supabase
        .from('whatsapp_chat_history')
        .select('id, guest_id, role, content, created_at')
        .eq('wedding_id', weddingId!) // UUID
        .in('role', ['user', 'assistant'])
        .order('created_at', { ascending: true });
      if (error) throw error;
      type Msg = { guest_id: string | null; role: string; content: string; created_at: string };
      const msgs = (data ?? []) as Msg[];

      const byGuest = new Map<string, Msg[]>();
      for (const m of msgs) {
        if (!m.guest_id) continue;
        byGuest.set(m.guest_id, [...(byGuest.get(m.guest_id) ?? []), m]);
      }
      const guestIds = [...byGuest.keys()];
      const names = new Map<string, string>();
      if (guestIds.length) {
        const { data: guestRows } = await supabase.from('guests').select('id, name').in('id', guestIds);
        for (const g of (guestRows ?? []) as { id: string; name: string }[]) names.set(g.id, g.name);
      }

      // Avg response time: mean user→next-assistant gap under 5 minutes.
      let gapSum = 0;
      let gapCount = 0;
      for (const list of byGuest.values()) {
        for (let i = 0; i < list.length - 1; i++) {
          if (list[i]!.role === 'user' && list[i + 1]!.role === 'assistant') {
            const gap = (new Date(list[i + 1]!.created_at).getTime() - new Date(list[i]!.created_at).getTime()) / 1000;
            if (gap >= 0 && gap < 300) {
              gapSum += gap;
              gapCount++;
            }
          }
        }
      }

      const conversations: ConciergeConversation[] = [...byGuest.entries()]
        .map(([guestId, list]) => {
          const last = list[list.length - 1]!;
          return {
            guestId,
            guestName: names.get(guestId) ?? 'Unrecognized guest',
            lastMessageAt: last.created_at,
            lastMessagePreview: last.content.slice(0, 120),
            messageCount: list.length,
          };
        })
        .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));

      return {
        guestsReached: new Set(msgs.filter((m) => m.role === 'user' && m.guest_id).map((m) => m.guest_id)).size,
        messagesHandled: msgs.filter((m) => m.role === 'assistant').length,
        avgResponseTimeSec: gapCount ? Math.round(gapSum / gapCount) : null,
        conversations,
      };
    },
  });
}

export interface WeddingSettings {
  wedding_password: string | null;
  concierge_enabled: boolean | null;
}

export function useSettings(weddingId: string | undefined) {
  return useQuery({
    queryKey: ['settings', weddingId],
    enabled: !!weddingId,
    queryFn: async (): Promise<WeddingSettings | null> => {
      if (!supabase) return { wedding_password: 'udaipur2026', concierge_enabled: true };
      const { data, error } = await supabase
        .from('wedding_settings')
        .select('wedding_password, concierge_enabled')
        .eq('wedding_id', weddingId!) // UUID
        .maybeSingle();
      if (error) throw error;
      return data as WeddingSettings | null;
    },
  });
}

export interface WeddingFaq {
  id: string;
  question: string;
  answer: string;
}

export function useFaqs(weddingId: string | undefined) {
  return useQuery({
    queryKey: ['faqs', weddingId],
    enabled: !!weddingId,
    queryFn: async (): Promise<WeddingFaq[]> => {
      if (!supabase) return FIXTURE_FAQS;
      const { data, error } = await supabase
        .from('wedding_faqs')
        .select('*')
        .eq('wedding_id', weddingId!) // UUID
        .order('order_index', { ascending: true });
      if (error) throw error;
      return data as WeddingFaq[];
    },
  });
}

export interface GuestRsvpInput {
  guestId: string;
  attending: 'yes' | 'no' | 'maybe';
  guestCount: number;
  foodPreference: string[];
  dietaryRestrictions: string;
  specialMessage: string;
}

export function useSubmitGuestRsvp(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: GuestRsvpInput) => {
      if (!supabase) {
        previewGuests = previewGuests.map((g) =>
          g.id === input.guestId
            ? {
                ...g,
                rsvps: [
                  {
                    attending: input.attending,
                    guest_count: input.attending === 'no' ? 0 : input.guestCount,
                    created_at: new Date().toISOString(),
                  },
                ],
              }
            : g,
        );
        return;
      }
      // Same upsert contract as web submitRSVP (rsvp-service.ts):
      // one row per guest, event_id 'general', slug-keyed.
      const { error } = await supabase.from('rsvps').upsert(
        {
          guest_id: input.guestId,
          wedding_id: slug,
          event_id: 'general',
          attending: input.attending,
          guest_count: input.attending === 'no' ? 0 : input.guestCount,
          food_preference: input.foodPreference.length ? input.foodPreference : null,
          dietary_restrictions: input.dietaryRestrictions || null,
          special_message: input.specialMessage || null,
        },
        { onConflict: 'guest_id,event_id,wedding_id' },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rsvps', slug] });
      qc.invalidateQueries({ queryKey: ['guests', slug] });
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
