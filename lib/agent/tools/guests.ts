import { generateFallbackColor } from '@/lib/utils/avatar-generator';
import { guestTags } from '@/lib/utils/guest-tags';
import { humanizeFields } from './humanize';
import type { AgentToolContext, AgentToolDefinition } from '../types';

type GuestRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  wedding_side: string | null;
  logistics_data: Record<string, unknown> | null;
  outreach_status: string | null;
  whatsapp_opted_out: boolean | null;
};

const GUEST_COLUMNS =
  'id, name, email, phone, wedding_side, logistics_data, outreach_status, whatsapp_opted_out';

const PAGE_SIZE = 1000;

/**
 * Read EVERY row for a wedding, paging past PostgREST's 1000-row ceiling.
 * Aggregates (headcounts, missing-phone counts) must never be computed off a
 * silently truncated page — a wrong total reads as authoritative.
 */
async function fetchAllRows<T = Record<string, unknown>>(
  supabase: AgentToolContext['supabase'],
  table: 'guests' | 'rsvps',
  columns: string,
  weddingSlug: string
): Promise<{ rows: T[]; count: number }> {
  const rows: T[] = [];
  let total = 0;
  for (let page = 0; ; page++) {
    const { data, count, error } = await supabase
      .from(table)
      .select(columns, { count: 'exact' })
      .eq('wedding_id', weddingSlug)
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    if (typeof count === 'number') total = count;
    const batch = (data ?? []) as T[];
    rows.push(...batch);
    if (batch.length < PAGE_SIZE || rows.length >= total) break;
  }
  return { rows, count: total };
}

function compactGuest(g: GuestRow) {
  const logistics = (g.logistics_data ?? {}) as Record<string, unknown>;
  return {
    id: g.id,
    name: g.name,
    email: g.email,
    phone: g.phone,
    side: g.wedding_side,
    party_size: logistics.party_size ?? 1,
    tags: guestTags(g.logistics_data),
    plus_one_name: logistics.plus_one_name ?? null,
    outreach_status: g.outreach_status,
  };
}

/**
 * Resolve a requested tag against the tags actually in use. Tags are free
 * text typed by couples, so the agent's query rarely matches byte-for-byte:
 * try exact (case-insensitive) first, then a loose form that ignores case,
 * punctuation, and a trailing plural "s" ("bridesmaids" → "Bridesmaid").
 * A loose hit is only auto-used when it's unambiguous — otherwise the caller
 * should hand the candidates back to the user to confirm.
 */
export function matchTagQuery(
  requested: string,
  tagsInUse: string[]
):
  | { kind: 'exact' | 'loose'; tag: string }
  | { kind: 'none' | 'ambiguous'; candidates: string[] } {
  const wanted = requested.trim().toLowerCase();
  const exact = tagsInUse.find((t) => t.toLowerCase() === wanted);
  if (exact) return { kind: 'exact', tag: exact };

  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '').replace(/s$/, '');
  const nWanted = norm(requested);
  if (!nWanted) return { kind: 'none', candidates: [] };
  const loose = tagsInUse.filter((t) => {
    const nt = norm(t);
    return nt === nWanted || nt.includes(nWanted) || nWanted.includes(nt);
  });
  if (loose.length === 1) return { kind: 'loose', tag: loose[0] };
  if (loose.length > 1) return { kind: 'ambiguous', candidates: loose };
  return { kind: 'none', candidates: [] };
}

/** rsvps.attending is 'yes' | 'no' | 'maybe' today, but legacy rows may hold booleans. */
export function normalizeAttending(value: unknown): 'yes' | 'no' | 'maybe' | null {
  if (typeof value === 'boolean') return value ? 'yes' : 'no';
  if (value === 'yes' || value === 'no' || value === 'maybe') return value;
  return null;
}

async function fetchGuestRsvps(ctx: AgentToolContext, guestIds: string[]) {
  if (guestIds.length === 0) return new Map<string, unknown[]>();
  const { data } = await ctx.supabase
    .from('rsvps')
    .select('guest_id, event_id, attending, guest_count, dietary_restrictions, song_request')
    .eq('wedding_id', ctx.weddingSlug)
    .in('guest_id', guestIds);
  const byGuest = new Map<string, unknown[]>();
  for (const r of data ?? []) {
    const list = byGuest.get(r.guest_id) ?? [];
    list.push({
      event_id: r.event_id,
      attending: normalizeAttending(r.attending),
      guest_count: r.guest_count,
      dietary: r.dietary_restrictions,
      song_request: r.song_request,
    });
    byGuest.set(r.guest_id, list);
  }
  return byGuest;
}

export const guestTools: AgentToolDefinition[] = [
  {
    name: 'list_guests',
    label: 'Looking up guests',
    risk: 'read',
    description:
      'List guests for this wedding, optionally filtered by a name search, wedding side, RSVP status, or tag. Guests can carry free-text tags set in the Guest List UI (e.g. "bridesmaid", "groomsman", "family", a side or household label) — pass `tag` to find everyone carrying one, or just read the `tags` field on each returned guest. Tag matching is forgiving (case + plural), and if nothing matches the result comes back with `tag_not_found: true` plus `available_tags` — when that happens, confirm with the user via ask_user (single_select over available_tags) instead of reporting zero guests. Returns up to `limit` guests (default 40) plus the total count. Call this when the user asks about their guest list, who is attending, who has a given tag/role, or before updating a specific guest whose ID you do not know.',
    inputSchema: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Case-insensitive name fragment' },
        side: { type: 'string', enum: ['bride', 'groom', 'both'] },
        rsvp_status: {
          type: 'string',
          enum: ['attending', 'not_attending', 'maybe', 'no_response'],
          description: 'Filter by overall RSVP state',
        },
        tag: {
          type: 'string',
          description:
            'Tag to filter by, e.g. "bridesmaid". Case- and plural-insensitive; an unambiguous close match is used automatically, otherwise the result lists available_tags for you to confirm with the user.',
        },
        limit: { type: 'integer', description: 'Max guests to return (default 40, max 100)' },
        offset: { type: 'integer' },
      },
      additionalProperties: false,
    },
    execute: async (input, ctx) => {
      const limit = Math.min(Number(input.limit) || 40, 100);
      const offset = Number(input.offset) || 0;
      // rsvp_status and tag live outside what PostgREST can filter directly
      // (derived from a joined table / free-text JSONB), so when either is
      // set we page through every row and filter in JS before slicing —
      // otherwise a match past the requested page would be silently missed.
      const needsFullScan = Boolean(input.rsvp_status) || Boolean(input.tag);
      let guests: GuestRow[];
      let dbTotal: number;
      if (needsFullScan) {
        let query = ctx.supabase
          .from('guests')
          .select(GUEST_COLUMNS, { count: 'exact' })
          .eq('wedding_id', ctx.weddingSlug)
          .order('name');
        if (input.search) query = query.ilike('name', `%${input.search}%`);
        if (input.side) query = query.eq('wedding_side', input.side as string);
        const { data, error } = await query;
        if (error) throw new Error(error.message);
        guests = (data ?? []) as GuestRow[];
        dbTotal = guests.length;
      } else {
        let query = ctx.supabase
          .from('guests')
          .select(GUEST_COLUMNS, { count: 'exact' })
          .eq('wedding_id', ctx.weddingSlug)
          .order('name')
          .range(offset, offset + limit - 1);
        if (input.search) query = query.ilike('name', `%${input.search}%`);
        if (input.side) query = query.eq('wedding_side', input.side as string);
        const { data, count, error } = await query;
        if (error) throw new Error(error.message);
        guests = (data ?? []) as GuestRow[];
        dbTotal = count ?? guests.length;
      }

      const rsvps = await fetchGuestRsvps(ctx, guests.map((g) => g.id));
      let rows = guests.map((g) => {
        const guestRsvps = (rsvps.get(g.id) ?? []) as Array<{ attending: string | null }>;
        const status = guestRsvps.some((r) => r.attending === 'yes')
          ? 'attending'
          : guestRsvps.some((r) => r.attending === 'maybe')
            ? 'maybe'
            : guestRsvps.some((r) => r.attending === 'no')
              ? 'not_attending'
              : 'no_response';
        return { ...compactGuest(g), rsvp_status: status };
      });
      if (input.rsvp_status) rows = rows.filter((r) => r.rsvp_status === input.rsvp_status);
      let tagNote = '';
      if (input.tag) {
        const requested = String(input.tag);
        const tagCounts = new Map<string, number>();
        for (const r of rows) {
          for (const t of r.tags) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
        }
        const match = matchTagQuery(requested, Array.from(tagCounts.keys()));
        if (match.kind === 'exact' || match.kind === 'loose') {
          rows = rows.filter((r) => r.tags.includes(match.tag));
          if (match.kind === 'loose') {
            tagNote = ` (no exact "${requested}" tag — matched "${match.tag}")`;
          }
        } else {
          // No usable match. Return the tag inventory and make the model
          // confirm with the user instead of guessing or answering "0 guests".
          const availableTags = Array.from(tagCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 25)
            .map(([tag, count]) => ({ tag, guests: count }));
          const candidateNote =
            match.kind === 'ambiguous'
              ? ` Closest candidates: ${match.candidates.map((c) => `"${c}"`).join(', ')}.`
              : '';
          return {
            tag_not_found: true,
            requested_tag: requested,
            available_tags: availableTags,
            total: 0,
            returned: 0,
            guests: [],
            // summary is user-visible in the chat's tool-status line — keep it
            // human-safe; the model-facing instruction goes in next_step.
            summary: `No "${requested}" tag found${availableTags.length > 0 ? ` · ${availableTags.length} other tag${availableTags.length === 1 ? '' : 's'} in use` : ''}`,
            next_step:
              availableTags.length > 0
                ? `Do NOT answer "0 guests" — the user may have meant a different label.${candidateNote} Call ask_user with ONE single_select (allowOther: true), prompt like "I couldn't find a '${requested}' tag — which of these did you mean?", options = ONLY the available_tags names above (do not add tags from memory), then call list_guests again with their choice.`
                : 'This guest list has no tags at all yet. Tell the user, and offer to help tag guests (they can tag in the Guest List section, or you can update_guest specific people).',
          };
        }
      }
      const total = needsFullScan ? rows.length : dbTotal;
      if (needsFullScan) rows = rows.slice(offset, offset + limit);
      // Server-shaped right-pane table (generic dataPanel directive) — the
      // model frames it in one line instead of re-typing rows as prose.
      // Capped at 60 rows to stay well inside the tool-result serialization cap.
      const panelRows = rows.slice(0, 60);
      return {
        total,
        returned: rows.length,
        guests: rows,
        summary: `${total} guest${total === 1 ? '' : 's'}${input.search ? ` matching "${input.search}"` : ''}${input.tag ? ` tagged "${input.tag}"${tagNote}` : ''}${input.rsvp_status ? ` · ${rows.length} ${String(input.rsvp_status).replace(/_/g, ' ')}` : ''}`,
        ...(rows.length > 0
          ? {
              dataPanel: {
                kind: 'table' as const,
                title: `Guests${rows.length > panelRows.length ? ` (first ${panelRows.length} of ${rows.length})` : ''}`,
                columns: [
                  { key: 'name', label: 'Name' },
                  { key: 'party', label: 'Party' },
                  { key: 'side', label: 'Side' },
                  { key: 'phone', label: 'Phone' },
                  { key: 'rsvp_status', label: 'RSVP' },
                  ...(input.tag || panelRows.some((r) => r.tags.length > 0)
                    ? [{ key: 'tags', label: 'Tags' }]
                    : []),
                ],
                rows: panelRows.map((r) => ({
                  name: r.name,
                  party: Number(r.party_size) || 1,
                  side: r.side,
                  phone: r.phone,
                  rsvp_status: r.rsvp_status,
                  tags: r.tags.join(', '),
                })),
              },
            }
          : {}),
      };
    },
  },
  {
    name: 'get_guest',
    label: 'Reading guest profile',
    risk: 'read',
    description:
      'Get one guest\'s full profile by guest ID: contact info, party details, all RSVP responses per event, and flight info if any. Call this when the conversation focuses on a specific guest.',
    inputSchema: {
      type: 'object',
      properties: { guest_id: { type: 'string' } },
      required: ['guest_id'],
      additionalProperties: false,
    },
    execute: async (input, ctx) => {
      const { data: guest, error } = await ctx.supabase
        .from('guests')
        .select('*')
        .eq('wedding_id', ctx.weddingSlug)
        .eq('id', input.guest_id as string)
        .single();
      if (error || !guest) throw new Error('Guest not found');
      const [rsvps, flight] = await Promise.all([
        fetchGuestRsvps(ctx, [guest.id]),
        ctx.supabase
          .from('guest_flights')
          .select('airline, flight_number, arrival_datetime, departure_datetime')
          .eq('guest_id', guest.id)
          .maybeSingle(),
      ]);
      return {
        ...compactGuest(guest as GuestRow),
        is_family_liaison: guest.is_family_liaison,
        whatsapp_opted_out: guest.whatsapp_opted_out,
        logistics_data: guest.logistics_data,
        rsvps: rsvps.get(guest.id) ?? [],
        flight: flight.data ?? null,
      };
    },
  },
  {
    name: 'get_rsvp_summary',
    label: 'Tallying RSVPs',
    risk: 'read',
    description:
      'Get RSVP totals for the wedding: per event, how many parties said yes/no and the total expected headcount, plus how many guests have not responded — AND the invite-list totals (invites, expected people summing all party sizes, guests missing a phone number). Call this for questions like "how many people are coming?" or "how many are we expecting?" — never page through list_guests to add these up yourself.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    execute: async (_input, ctx) => {
      // PostgREST caps a plain select at 1000 rows, so these MUST page: a
      // 1,200-guest wedding would otherwise quietly report the headcount of
      // its first 1,000 guests while total_guests (an exact count) stayed right.
      const [{ rows: guestRows, count: guestCount }, { rows: rsvps }, { data: events }] = await Promise.all([
        fetchAllRows<{ id: string; phone: string | null; logistics_data: unknown }>(
          ctx.supabase,
          'guests',
          'id, phone, logistics_data',
          ctx.weddingSlug
        ),
        fetchAllRows<{
          event_id: string | null;
          attending: unknown;
          guest_count: number | null;
          guest_id: string | null;
        }>(ctx.supabase, 'rsvps', 'event_id, attending, guest_count, guest_id', ctx.weddingSlug),
        // Event names for the stats panel — by_event is keyed by event_id UUID.
        ctx.supabase.from('wedding_events').select('id, name').eq('wedding_id', ctx.weddingUuid),
      ]);
      const expectedPeople = (guestRows ?? []).reduce((sum, g) => {
        const party = (g.logistics_data as { party_size?: number } | null)?.party_size;
        return sum + (typeof party === 'number' && party > 0 ? party : 1);
      }, 0);
      const missingPhone = (guestRows ?? []).filter((g) => !g.phone).length;
      const eventNames = new Map((events ?? []).map((e) => [e.id as string, e.name as string]));
      const byEvent = new Map<
        string,
        { yes: number; no: number; maybe: number; headcount: number }
      >();
      const responded = new Set<string>();
      for (const r of rsvps ?? []) {
        if (r.guest_id) responded.add(r.guest_id);
        const key = r.event_id ?? 'general';
        const entry = byEvent.get(key) ?? { yes: 0, no: 0, maybe: 0, headcount: 0 };
        const attending = normalizeAttending(r.attending);
        if (attending === 'yes') {
          entry.yes += 1;
          entry.headcount += r.guest_count ?? 1;
        } else if (attending === 'no') entry.no += 1;
        else if (attending === 'maybe') entry.maybe += 1;
        byEvent.set(key, entry);
      }
      const totalGuests = guestCount ?? 0;
      const noResponse = Math.max(0, totalGuests - responded.size);
      return {
        total_guests: totalGuests,
        expected_people: expectedPeople,
        guests_missing_phone: missingPhone,
        responded: responded.size,
        no_response: noResponse,
        by_event: Object.fromEntries(byEvent),
        summary: `${totalGuests} invites (~${expectedPeople} people incl. plus-ones) · ${responded.size} responded · ${noResponse} no reply`,
        dataPanel: {
          kind: 'stats' as const,
          title: 'RSVPs',
          items: [
            { label: 'Invites', value: String(totalGuests) },
            { label: 'Expected people', value: `~${expectedPeople}` },
            { label: 'Responded', value: String(responded.size) },
            { label: 'No reply', value: String(noResponse) },
            ...[...byEvent.entries()].map(([key, e]) => ({
              label: key === 'general' ? 'Overall' : (eventNames.get(key) ?? 'Event'),
              value: `${e.yes} yes`,
              hint: `${e.headcount} people · ${e.no} no · ${e.maybe} maybe`,
            })),
          ],
        },
      };
    },
  },
  {
    name: 'add_guest',
    label: 'Adding a guest',
    risk: 'write',
    description:
      'Add a single guest to the guest list. Call this when the user names someone to invite. A phone number is REQUIRED (it is how Phera reaches guests on WhatsApp) — if the user did not give one, ask for it before calling this. Email is optional. For bulk imports, point the user to the Guest List import wizard instead.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        phone: { type: 'string', description: 'Required. Include country code, e.g. +1415...' },
        email: { type: 'string', description: 'Optional' },
        side: { type: 'string', enum: ['bride', 'groom', 'both'] },
        party_size: { type: 'integer', description: 'Total people in this party including the guest (default 1)' },
        tags: { type: 'array', items: { type: 'string' } },
      },
      required: ['name', 'phone'],
      additionalProperties: false,
    },
    // Undo for a create = delete the created row, matched by natural key. The
    // undo tool refuses unless the match hits exactly one row, so a same-name
    // same-phone duplicate can never be deleted by mistake.
    captureBefore: async (input, ctx) => ({
      restore: 'delete',
      table: 'guests',
      match: { wedding_id: ctx.weddingSlug, name: input.name as string, phone: input.phone as string },
    }),
    execute: async (input, ctx) => {
      if (!input.phone || !String(input.phone).trim()) {
        throw new Error('A phone number is required to add a guest — ask the user for it.');
      }
      const logistics: Record<string, unknown> = {};
      if (input.party_size) logistics.party_size = input.party_size;
      if (input.tags) logistics.tags = input.tags;
      const { data, error } = await ctx.supabase
        .from('guests')
        .insert({
          wedding_id: ctx.weddingSlug,
          name: input.name as string,
          // guests.email is NOT NULL — the app convention for "no email" is ''
          email: (input.email as string) ?? '',
          phone: (input.phone as string) ?? null,
          wedding_side: (input.side as string) ?? null,
          avatar_color: generateFallbackColor(input.name as string),
          ...(Object.keys(logistics).length > 0 ? { logistics_data: logistics } : {}),
        })
        .select('id, name')
        .single();
      if (error) throw new Error(error.message);
      return { created: data, summary: `${data.name} added to the guest list` };
    },
  },
  {
    name: 'record_rsvp',
    label: 'Recording an RSVP',
    risk: 'write',
    description:
      'Record or change a guest\'s RSVP on the couple\'s behalf — e.g. when the user says someone confirmed, cancelled, or is unsure. attending is yes/no/maybe; guest_count is how many people from their party are coming (defaults to their party size for yes, 0 for no). Use list_guests first if you only have a name.',
    inputSchema: {
      type: 'object',
      properties: {
        guest_id: { type: 'string' },
        attending: { type: 'string', enum: ['yes', 'no', 'maybe'] },
        guest_count: { type: 'integer', description: 'People attending from this party' },
        event_id: { type: 'string', description: "Event identifier; omit for the wedding overall ('general')" },
      },
      required: ['guest_id', 'attending'],
      additionalProperties: false,
    },
    // Undo: restore the prior RSVP values if a row existed; delete the row this
    // write is about to insert if none did (wedding+guest+event is the natural
    // unique key, so the delete-matcher is exact).
    captureBefore: async (input, ctx) => {
      const eventId = (input.event_id as string) || 'general';
      const match = {
        wedding_id: ctx.weddingSlug,
        guest_id: input.guest_id as string,
        event_id: eventId,
      };
      const { data: existing } = await ctx.supabase
        .from('rsvps')
        .select('attending, guest_count')
        .match(match)
        .maybeSingle();
      if (existing) return { restore: 'update', table: 'rsvps', match, values: existing };
      return { restore: 'delete', table: 'rsvps', match };
    },
    execute: async (input, ctx) => {
      const eventId = (input.event_id as string) || 'general';
      const { data: guest } = await ctx.supabase
        .from('guests')
        .select('id, name, logistics_data')
        .eq('wedding_id', ctx.weddingSlug)
        .eq('id', input.guest_id as string)
        .single();
      if (!guest) throw new Error('Guest not found');

      const partySize =
        Number((guest.logistics_data as Record<string, unknown> | null)?.party_size) || 1;
      const guestCount =
        input.guest_count !== undefined
          ? Number(input.guest_count)
          : input.attending === 'yes'
            ? partySize
            : 0;

      const { data: existing } = await ctx.supabase
        .from('rsvps')
        .select('id')
        .eq('wedding_id', ctx.weddingSlug)
        .eq('guest_id', guest.id)
        .eq('event_id', eventId)
        .maybeSingle();

      if (existing) {
        const { error } = await ctx.supabase
          .from('rsvps')
          .update({ attending: input.attending as string, guest_count: guestCount })
          .eq('id', existing.id);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await ctx.supabase.from('rsvps').insert({
          wedding_id: ctx.weddingSlug,
          guest_id: guest.id,
          event_id: eventId,
          attending: input.attending as string,
          guest_count: guestCount,
        });
        if (error) throw new Error(error.message);
      }
      return {
        guest: guest.name,
        attending: input.attending,
        guest_count: guestCount,
        event_id: eventId,
        summary: `${guest.name}: ${input.attending}${guestCount ? `, party of ${guestCount}` : ''}`,
      };
    },
  },
  {
    name: 'update_guest',
    label: 'Updating a guest',
    risk: 'write',
    description:
      'Update one guest\'s contact info, side, party size, or tags. Call this when the user corrects or adds guest details. Use list_guests first if you only have a name. logistics fields are merged, not replaced.',
    inputSchema: {
      type: 'object',
      properties: {
        guest_id: { type: 'string' },
        name: { type: 'string' },
        email: { type: 'string' },
        phone: { type: 'string' },
        side: { type: 'string', enum: ['bride', 'groom', 'both'] },
        party_size: { type: 'integer' },
        tags: { type: 'array', items: { type: 'string' } },
        notes: { type: 'string', description: 'Free-form planning note stored on the guest' },
      },
      required: ['guest_id'],
      additionalProperties: false,
    },
    captureBefore: async (input, ctx) => {
      const { data: guest } = await ctx.supabase
        .from('guests')
        .select('name, email, phone, wedding_side, logistics_data')
        .eq('wedding_id', ctx.weddingSlug)
        .eq('id', input.guest_id as string)
        .maybeSingle();
      if (!guest) return null;
      return {
        restore: 'update',
        table: 'guests',
        match: { wedding_id: ctx.weddingSlug, id: input.guest_id as string },
        values: guest,
      };
    },
    execute: async (input, ctx) => {
      const updates: Record<string, unknown> = {};
      if (input.name !== undefined) updates.name = input.name;
      if (input.email !== undefined) updates.email = input.email;
      if (input.phone !== undefined) updates.phone = input.phone;
      if (input.side !== undefined) updates.wedding_side = input.side;

      if (input.party_size !== undefined || input.tags !== undefined || input.notes !== undefined) {
        const { data: current } = await ctx.supabase
          .from('guests')
          .select('logistics_data')
          .eq('wedding_id', ctx.weddingSlug)
          .eq('id', input.guest_id as string)
          .single();
        const logistics = { ...((current?.logistics_data as Record<string, unknown>) ?? {}) };
        if (input.party_size !== undefined) logistics.party_size = input.party_size;
        if (input.tags !== undefined) logistics.tags = input.tags;
        if (input.notes !== undefined) logistics.agent_notes = input.notes;
        updates.logistics_data = logistics;
      }
      if (Object.keys(updates).length === 0) throw new Error('No updatable fields provided');

      const { data, error } = await ctx.supabase
        .from('guests')
        .update(updates)
        .eq('wedding_id', ctx.weddingSlug)
        .eq('id', input.guest_id as string)
        .select('id, name')
        .single();
      if (error) throw new Error(error.message);
      return {
        updated: data,
        fields: Object.keys(updates),
        summary: `${data.name} — ${humanizeFields(Object.keys(updates))} updated`,
      };
    },
  },
];
