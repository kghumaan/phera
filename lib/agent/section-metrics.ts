import type { SupabaseClient } from '@supabase/supabase-js';
import { DRAFT_COUPLE_NAME } from '@/lib/constants/wedding-placeholders';
import { guestTags } from '@/lib/utils/guest-tags';
import type { SectionMetrics } from './sections';

/**
 * One read of everything the rich sections are measured by. Used twice:
 * as the BASELINE stamped when the agent hands off, and as the CURRENT
 * state on every later turn — the difference is how the agent knows they
 * actually did the work.
 */
export async function readSectionMetrics(
  supabase: SupabaseClient,
  weddingSlug: string,
  weddingUuid: string
): Promise<SectionMetrics> {
  const [weddingRes, guestsRes, roomsRes, eventsRes, faqsRes] = await Promise.all([
    supabase
      .from('weddings')
      .select('couple_name, wedding_date, venue_name, venue_location, welcome_text, status')
      .eq('id', weddingUuid)
      .maybeSingle(),
    supabase.from('guests').select('id, logistics_data').eq('wedding_id', weddingSlug),
    // wedding_rooms is slug-keyed; wedding_faqs/wedding_events are UUID-keyed.
    supabase.from('wedding_rooms').select('assigned_guest_ids').eq('wedding_id', weddingSlug),
    supabase.from('wedding_events').select('id', { count: 'exact', head: true }).eq('wedding_id', weddingUuid),
    supabase.from('wedding_faqs').select('id', { count: 'exact', head: true }).eq('wedding_id', weddingUuid),
  ]);

  // A failed READ must never masquerade as "nothing is filled in" — that is how
  // a blip turns into the agent telling a couple their finished site is empty,
  // or publish refusing a site that is in fact complete. Fail loudly instead.
  if (weddingRes.error) throw new Error(`Could not read the wedding: ${weddingRes.error.message}`);

  const wedding = (weddingRes.data ?? {}) as {
    couple_name?: string | null;
    wedding_date?: string | null;
    venue_name?: string | null;
    venue_location?: string | null;
    welcome_text?: string | null;
    status?: string | null;
  };

  const guests = (guestsRes.data ?? []) as Array<{ id: string; logistics_data: unknown }>;
  const rooms = (roomsRes.data ?? []) as Array<{ assigned_guest_ids: string[] | null }>;

  // A guest is "organised" once they carry at least one tag (side, family, etc.).
  const taggedGuests = guests.filter((g) => guestTags(g.logistics_data).length > 0).length;
  const assignedGuests = new Set(rooms.flatMap((r) => r.assigned_guest_ids ?? [])).size;

  // The website is "filled in" when it would no longer show placeholders to a
  // guest: real names, a real date, a real venue, and something written.
  const nameSet = !!wedding.couple_name && wedding.couple_name !== DRAFT_COUPLE_NAME;
  const dateSet = !!wedding.wedding_date && !wedding.wedding_date.startsWith('1970-01-01');
  const venueSet = !!wedding.venue_name && wedding.venue_name !== 'Venue TBD';
  const storySet = !!wedding.welcome_text?.trim();

  return {
    guests: guests.length,
    taggedGuests,
    rooms: rooms.length,
    assignedGuests,
    events: eventsRes.count ?? 0,
    faqs: faqsRes.count ?? 0,
    detailsComplete: nameSet && dateSet && venueSet && storySet,
    published: wedding.status === 'live',
  };
}
