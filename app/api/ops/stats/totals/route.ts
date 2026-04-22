import { NextResponse } from 'next/server';
import { getOpsSupabaseAdmin } from '@/lib/ops/supabase-admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Wedding = {
  id: string;
  slug: string;
  couple_name: string | null;
  wedding_date: string | null;
  venue_name: string | null;
  venue_location: string | null;
  status: string | null;
  created_at: string;
  created_by: string | null;
};

const DAY_MS = 24 * 60 * 60 * 1000;

export async function GET() {
  const supabase = getOpsSupabaseAdmin();
  const now = Date.now();
  const since24h = new Date(now - DAY_MS).toISOString();
  const since7d = new Date(now - 7 * DAY_MS).toISOString();

  // --- weddings ---
  const { data: weddingsRaw, error: wErr } = await supabase
    .from('weddings')
    .select(
      'id, slug, couple_name, wedding_date, venue_name, venue_location, status, created_at, created_by',
    )
    .order('created_at', { ascending: false });
  if (wErr) return NextResponse.json({ error: wErr.message }, { status: 500 });
  const weddings = (weddingsRaw || []) as Wedding[];

  const slugCounts = async (table: string, col: string) => {
    const { data } = await supabase.from(table).select(col);
    const map = new Map<string, number>();
    const rows = (data ?? []) as unknown as Array<Record<string, unknown>>;
    for (const row of rows) {
      const key = row?.[col];
      if (typeof key !== 'string' || !key) continue;
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  };

  const [
    guestsBySlug,
    rsvpsBySlug,
    outreachBySlug,
    whatsappBySlug,
    vendorsBySlug,
  ] = await Promise.all([
    slugCounts('guests', 'wedding_id'),
    slugCounts('rsvps', 'wedding_id'),
    slugCounts('outreach_events', 'wedding_id'),
    slugCounts('whatsapp_messages', 'wedding_id'),
    slugCounts('vendors', 'wedding_id'),
  ]);

  const headCount = async (
    table: string,
    filter?: { col: string; gte: string } | { col: string; eq: string | boolean },
  ): Promise<number> => {
    let q = supabase.from(table).select('*', { count: 'exact', head: true });
    if (filter && 'gte' in filter) q = q.gte(filter.col, filter.gte);
    else if (filter && 'eq' in filter) q = q.eq(filter.col, filter.eq as string);
    const { count } = await q;
    return count ?? 0;
  };

  const [
    totalGuests,
    totalRsvps,
    rsvpsAttending,
    rsvpsDeclined,
    totalOutreach,
    outreach24h,
    outreach7d,
    totalWhatsapp,
    whatsapp24h,
    whatsappOptIns,
    totalVendors,
    vendorMessages24h,
    totalVendorMessages,
    escalationsOpen,
    concierge24h,
    totalConcierge,
  ] = await Promise.all([
    headCount('guests'),
    headCount('rsvps'),
    headCount('rsvps', { col: 'attending', eq: true }),
    headCount('rsvps', { col: 'attending', eq: false }),
    headCount('outreach_events'),
    headCount('outreach_events', { col: 'created_at', gte: since24h }),
    headCount('outreach_events', { col: 'created_at', gte: since7d }),
    headCount('whatsapp_messages'),
    headCount('whatsapp_messages', { col: 'created_at', gte: since24h }),
    headCount('whatsapp_opt_ins'),
    headCount('vendors'),
    headCount('vendor_messages', { col: 'created_at', gte: since24h }),
    headCount('vendor_messages'),
    headCount('outreach_escalations', { col: 'status', eq: 'open' }),
    headCount('concierge_broadcasts', { col: 'created_at', gte: since24h }),
    headCount('concierge_broadcasts'),
  ]);

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    weddings: weddings.map((w) => ({
      ...w,
      counts: {
        guests: guestsBySlug.get(w.slug) ?? 0,
        rsvps: rsvpsBySlug.get(w.slug) ?? 0,
        outreachEvents: outreachBySlug.get(w.slug) ?? 0,
        whatsappMessages: whatsappBySlug.get(w.slug) ?? 0,
        vendors: vendorsBySlug.get(w.slug) ?? 0,
      },
    })),
    totals: {
      guests: totalGuests,
      rsvps: totalRsvps,
      rsvpsAttending,
      rsvpsDeclined,
      outreachEvents: totalOutreach,
      outreach24h,
      outreach7d,
      whatsappMessages: totalWhatsapp,
      whatsapp24h,
      whatsappOptIns,
      vendors: totalVendors,
      vendorMessages24h,
      vendorMessages: totalVendorMessages,
      escalationsOpen,
      conciergeBroadcasts24h: concierge24h,
      conciergeBroadcasts: totalConcierge,
    },
  });
}
