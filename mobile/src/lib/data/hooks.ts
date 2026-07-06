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
  FIXTURE_TRAVEL_SECTIONS,
  FIXTURE_VEHICLES,
  FIXTURE_WEDDING,
} from '@/lib/mock/fixtures';
import { API_BASE } from '@/lib/config';
import { inMockMode, supabase } from '@/lib/supabase/client';
import { generateFallbackColor } from '@/lib/theme/tag-color';
import type {
  Attending,
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
  'id, name, email, phone, wedding_side, logistics_data, initials, avatar_color, created_at, rsvps(attending, guest_count, plus_one, created_at)';

export function useWeddings() {
  return useQuery({
    queryKey: ['weddings'],
    queryFn: async (): Promise<Wedding[]> => {
      if (inMockMode() || !supabase) return [FIXTURE_WEDDING];
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
      if (inMockMode() || !supabase) return FIXTURE_WEDDING;
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
      if (inMockMode() || !supabase) return previewGuests;
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

export function useAddGuest(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: NewGuestInput): Promise<void> => {
      const email = (input.email ?? '').trim().toLowerCase();
      const row = {
        name: input.name.trim(),
        // Web import parity (app/api/guests/import): sentinel email when
        // none given, palette fallback avatar, auth_method 'imported'.
        email: email || `imported-${Date.now()}-m@phera.io`,
        phone: input.phone.trim() || null,
        wedding_id: slug,
        wedding_side: input.wedding_side ?? null,
        avatar_color: generateFallbackColor(input.name.trim()),
        auth_method: 'imported',
      };
      if (inMockMode() || !supabase) {
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
      if (inMockMode() || !supabase) return FIXTURE_RSVPS;
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
      if (inMockMode() || !supabase) return FIXTURE_EVENTS;
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
      if (inMockMode() || !supabase) {
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
      if (inMockMode() || !supabase) return previewFlights;
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
      if (inMockMode() || !supabase) return FIXTURE_VEHICLES;
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
      if (inMockMode() || !supabase) return FIXTURE_RESERVATIONS;
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

// Web travel page parity (travel/page.tsx): travel_sections is the primary
// source; legacy wedding_travel_cards convert to 'travel' sections.
export interface TravelSection {
  id: string;
  type: 'travel' | 'flight' | 'travel_note' | 'accommodation' | 'hotel';
  title: string | null;
  subtitle: string | null;
  content: string | null;
  image_url: string | null;
  more_details: string | null;
  address: string | null;
  phone: string | null;
  price_level: number | null;
  visible: boolean | null;
}

export function useTravelSections(weddingId: string | undefined) {
  return useQuery({
    queryKey: ['travel-sections', weddingId],
    enabled: !!weddingId,
    queryFn: async (): Promise<TravelSection[]> => {
      if (inMockMode() || !supabase) return FIXTURE_TRAVEL_SECTIONS;
      const { data, error } = await supabase
        .from('travel_sections')
        .select('*')
        .eq('wedding_id', weddingId!) // UUID
        .order('order_index', { ascending: true });
      if (error) throw error;
      if (data && data.length > 0) return data as TravelSection[];
      // Legacy fallback: wedding_travel_cards → 'travel' sections.
      const { data: cards } = await supabase
        .from('wedding_travel_cards')
        .select('*')
        .eq('wedding_id', weddingId!)
        .order('order_index', { ascending: true });
      return ((cards ?? []) as { id: string; title: string | null; content: unknown; image_url: string | null }[]).map(
        (c) => ({
          id: c.id,
          type: 'travel' as const,
          title: c.title,
          subtitle: null,
          content: Array.isArray(c.content)
            ? (c.content as ({ p?: string } | string)[])
                .map((p) => (typeof p === 'string' ? p : (p?.p ?? '')))
                .filter(Boolean)
                .join('\n\n')
            : typeof c.content === 'string'
              ? c.content
              : null,
          image_url: c.image_url,
          more_details: null,
          address: null,
          phone: null,
          price_level: null,
          visible: true,
        }),
      );
    },
  });
}

/** The picked guest's own RSVP answer (gates "Travel Details" in the hub). */
export function useGuestRsvp(slug: string, guestId: string | null | undefined) {
  return useQuery({
    queryKey: ['guest-rsvp', slug, guestId],
    enabled: !!guestId,
    queryFn: async (): Promise<Attending | null> => {
      if (inMockMode() || !supabase) return 'yes';
      const { data } = await supabase
        .from('rsvps')
        .select('attending, created_at')
        .eq('wedding_id', slug)
        .eq('guest_id', guestId!)
        .eq('event_id', 'general')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return ((data as { attending?: string } | null)?.attending as Attending) ?? null;
    },
  });
}

/** Web overview QuickLinks parity: per-step setup completion detection. */
export interface RoadmapStatus {
  guests: boolean;
  details: boolean;
  whatsappBot: boolean;
  rooms: boolean;
  transportation: boolean;
  vendors: boolean;
}

export function useRoadmap(slug: string, wedding: Wedding | null | undefined) {
  return useQuery({
    queryKey: ['roadmap', slug, wedding?.id],
    enabled: !!wedding,
    queryFn: async (): Promise<RoadmapStatus> => {
      const details = !!(
        wedding!.couple_name &&
        wedding!.venue_name &&
        wedding!.wedding_date_display
      );
      if (inMockMode() || !supabase) {
        return { guests: true, details, whatsappBot: true, rooms: true, transportation: true, vendors: false };
      }
      const wid = wedding!.id;
      const [g, r, t, v, s] = await Promise.all([
        supabase.from('guests').select('id', { count: 'exact', head: true }).eq('wedding_id', slug),
        supabase.from('wedding_rooms').select('id', { count: 'exact', head: true }).eq('wedding_id', slug),
        supabase
          .from('transportation_vehicles')
          .select('id', { count: 'exact', head: true })
          .eq('wedding_id', wid),
        supabase.from('vendors').select('id', { count: 'exact', head: true }).eq('wedding_id', wid),
        supabase.from('wedding_settings').select('concierge_enabled').eq('wedding_id', wid).maybeSingle(),
      ]);
      return {
        guests: (g.count ?? 0) > 0,
        details,
        whatsappBot: !!(s.data as { concierge_enabled?: boolean } | null)?.concierge_enabled,
        rooms: (r.count ?? 0) > 0,
        transportation: (t.count ?? 0) > 0,
        vendors: (v.count ?? 0) > 0,
      };
    },
  });
}

export function useRooms(slug: string) {
  return useQuery({
    queryKey: ['rooms', slug],
    queryFn: async (): Promise<WeddingRoom[]> => {
      if (inMockMode() || !supabase) return FIXTURE_ROOMS;
      // Same ordering as web roomsService.list (rooms-service.ts:57).
      const { data, error } = await supabase
        .from('wedding_rooms')
        .select('*')
        .eq('wedding_id', slug) // slug, not UUID
        .order('hotel_name', { ascending: true, nullsFirst: true })
        .order('floor', { ascending: true, nullsFirst: false })
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
      if (inMockMode() || !supabase) return previewTasks;
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
      if (inMockMode() || !supabase) {
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
      if (inMockMode() || !supabase) return FIXTURE_BROADCASTS;
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
      if (inMockMode() || !supabase) return FIXTURE_CONCIERGE;
      // Web parity: the conversations API uses the service role because RLS
      // truncates direct reads. Prefer it (bearer-authed); fall back to the
      // direct read if the API is unreachable.
      try {
        const { data: sess } = await supabase.auth.getSession();
        const token = sess.session?.access_token;
        if (token) {
          const res = await fetch(
            `${API_BASE}/api/concierge/conversations?weddingId=${encodeURIComponent(weddingId!)}`,
            { headers: { Authorization: `Bearer ${token}` } },
          );
          if (res.ok) {
            const json = (await res.json()) as {
              conversations?: {
                guestId: string;
                guestName: string;
                lastMessageAt: string;
                lastMessagePreview: string;
                messageCount: number;
                messages?: { role: string }[];
              }[];
            };
            const convs = json.conversations ?? [];
            const assistantCount = convs.reduce(
              (sum, c) => sum + (c.messages?.filter((m) => m.role === 'assistant').length ?? 0),
              0,
            );
            return {
              guestsReached: convs.length,
              messagesHandled: assistantCount,
              avgResponseTimeSec: null,
              conversations: convs.map((c) => ({
                guestId: c.guestId,
                guestName: c.guestName,
                lastMessageAt: c.lastMessageAt,
                lastMessagePreview: c.lastMessagePreview,
                messageCount: c.messageCount,
              })),
            };
          }
        }
      } catch {
        // fall through to the direct read
      }
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

export interface Collaborator {
  id: string;
  email: string; // 'Team Member' when unresolvable (web has the same limit)
  role: 'owner' | 'admin' | 'viewer';
  pending?: boolean;
}

export function useCollaborators(weddingId: string | undefined, ownerId?: string | null) {
  return useQuery({
    queryKey: ['collaborators', weddingId],
    enabled: !!weddingId,
    queryFn: async (): Promise<Collaborator[]> => {
      if (inMockMode() || !supabase) {
        return [
          { id: 'c1', email: 'preview@phera.io', role: 'owner' },
          { id: 'c2', email: 'Team Member', role: 'admin' },
          { id: 'c3', email: 'mom@example.com', role: 'viewer', pending: true },
        ];
      }
      // Mirrors web getTeamMembers + getWeddingInvites (wedding-service.ts:977).
      const { data: auth } = await supabase.auth.getUser();
      const me = auth.user;
      const [adminsRes, invitesRes] = await Promise.all([
        supabase.from('wedding_admins').select('*').eq('wedding_id', weddingId!),
        supabase
          .from('wedding_invites')
          .select('*')
          .eq('wedding_id', weddingId!)
          .order('created_at', { ascending: false }),
      ]);
      const list: Collaborator[] = [];
      if (me && ownerId && me.id === ownerId) {
        list.push({ id: 'owner', email: me.email ?? 'Owner', role: 'owner' });
      } else if (ownerId) {
        list.push({ id: 'owner', email: 'Owner', role: 'owner' });
      }
      type AdminRow = { id: string; user_id: string | null; role: string };
      for (const a of (adminsRes.data ?? []) as AdminRow[]) {
        if (a.user_id && a.user_id === ownerId) continue;
        list.push({
          id: a.id,
          email: me && a.user_id === me.id ? (me.email ?? 'You') : 'Team Member',
          role: (a.role as Collaborator['role']) ?? 'admin',
        });
      }
      type InviteRow = { id: string; email: string; role: string | null; accepted_at?: string | null };
      for (const inv of (invitesRes.data ?? []) as InviteRow[]) {
        if (inv.accepted_at) continue;
        list.push({
          id: inv.id,
          email: inv.email,
          role: (inv.role as Collaborator['role']) ?? 'admin',
          pending: true,
        });
      }
      return list;
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
      if (inMockMode() || !supabase) return { wedding_password: 'udaipur2026', concierge_enabled: true };
      // Password lives in wedding_secrets (admin-only RLS); settings holds
      // the benign flags. Legacy-column fallback until 20260705b drops it.
      const [settingsRes, secretRes, legacyRes] = await Promise.all([
        supabase
          .from('wedding_settings')
          .select('concierge_enabled')
          .eq('wedding_id', weddingId!) // UUID
          .maybeSingle(),
        supabase
          .from('wedding_secrets')
          .select('wedding_password')
          .eq('wedding_id', weddingId!)
          .maybeSingle(),
        // Errors once 20260705b drops the column — ignored below.
        supabase
          .from('wedding_settings')
          .select('wedding_password')
          .eq('wedding_id', weddingId!)
          .maybeSingle(),
      ]);
      if (settingsRes.error) throw settingsRes.error;
      return {
        concierge_enabled:
          (settingsRes.data as { concierge_enabled: boolean | null } | null)?.concierge_enabled ??
          null,
        wedding_password:
          (secretRes.data as { wedding_password: string | null } | null)?.wedding_password ??
          (legacyRes.data as { wedding_password: string | null } | null)?.wedding_password ??
          null,
      };
    },
  });
}

export interface WeddingFaq {
  id: string;
  question: string;
  answer: string;
  button_text?: string | null;
  button_link?: string | null;
}

export function useFaqs(weddingId: string | undefined) {
  return useQuery({
    queryKey: ['faqs', weddingId],
    enabled: !!weddingId,
    queryFn: async (): Promise<WeddingFaq[]> => {
      if (inMockMode() || !supabase) return FIXTURE_FAQS;
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
  name?: string;
  phone?: string;
  attending: 'yes' | 'no' | 'maybe';
  guestCount: number;
  plusOne?: boolean;
  plusOneName?: string;
  foodPreference: string[];
  dietaryRestrictions: string;
  songRequest?: string;
  specialMessage: string;
  maybeComment?: string;
  side?: 'bride' | 'groom' | 'both' | '';
  consentGiven?: boolean;
}

export function useSubmitGuestRsvp(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: GuestRsvpInput) => {
      // Web submitRSVP parity: guest_count is 0 unless attending==='yes'.
      const guestCount = input.attending === 'yes' ? input.guestCount || 1 : 0;
      if (inMockMode() || !supabase) {
        previewGuests = previewGuests.map((g) =>
          g.id === input.guestId
            ? {
                ...g,
                rsvps: [
                  {
                    attending: input.attending,
                    guest_count: guestCount,
                    created_at: new Date().toISOString(),
                  },
                ],
              }
            : g,
        );
        return;
      }
      // 1. Guest row update (web rsvp-service.ts:submitRSVP step 2): name,
      //    phone, side, and DPDPA consent stamps (never cleared).
      const guestUpdate: Record<string, unknown> = {};
      if (input.name?.trim()) guestUpdate.name = input.name.trim();
      if (input.phone?.trim()) guestUpdate.phone = input.phone.trim();
      if (input.side) guestUpdate.wedding_side = input.side;
      if (input.consentGiven) {
        guestUpdate.consent_given_at = new Date().toISOString();
        guestUpdate.consent_language = 'en';
      }
      if (Object.keys(guestUpdate).length > 0) {
        await supabase.from('guests').update(guestUpdate).eq('id', input.guestId);
      }
      // 2. Same upsert contract as web submitRSVP: one row per guest,
      //    event_id 'general', slug-keyed, full payload.
      const { error } = await supabase.from('rsvps').upsert(
        {
          guest_id: input.guestId,
          wedding_id: slug,
          event_id: 'general',
          attending: input.attending,
          guest_count: guestCount,
          plus_one: input.plusOne ?? false,
          plus_one_name: input.plusOne ? input.plusOneName || null : null,
          food_preference: input.foodPreference.length ? input.foodPreference : null,
          dietary_restrictions: input.dietaryRestrictions || null,
          song_request: input.songRequest || null,
          special_message: input.specialMessage || null,
          maybe_comment: input.maybeComment || null,
        },
        { onConflict: 'guest_id,event_id,wedding_id' },
      );
      if (error) throw error;
      // 3. Guest-book comment (web step 4): only when there's a message and
      //    the guest hasn't left one already.
      if (input.specialMessage?.trim()) {
        const { data: existing } = await supabase
          .from('comments')
          .select('id')
          .eq('guest_id', input.guestId)
          .eq('wedding_id', slug)
          .maybeSingle();
        if (!existing) {
          await supabase.from('comments').insert({
            guest_id: input.guestId,
            wedding_id: slug,
            message: input.specialMessage.trim(),
          });
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rsvps', slug] });
      qc.invalidateQueries({ queryKey: ['guests', slug] });
      qc.invalidateQueries({ queryKey: ['guest-rsvp', slug] });
    },
  });
}

export function useSchedule(weddingId: string | undefined) {
  return useQuery({
    queryKey: ['schedule', weddingId],
    enabled: !!weddingId,
    queryFn: async (): Promise<ScheduleDay[]> => {
      if (inMockMode() || !supabase) return FIXTURE_SCHEDULE;
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
