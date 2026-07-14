import { NextRequest, NextResponse } from 'next/server';
import { requireLabAccess, isLabAccess } from '@/lib/agent/lab/auth';
import { isLabSlug } from '@/lib/agent/lab/scenarios';
import { generateFallbackColor } from '@/lib/utils/avatar-generator';

export const runtime = 'nodejs';

interface PatchGuest {
  name: string;
  side?: string;
  party?: number;
  tags?: string[];
}
interface PatchRoom {
  room_number: string;
  hotel_name?: string;
  capacity?: number;
  /** Resolved to guest ids by name — the eval writes names, not UUIDs. */
  assign?: string[];
}

/**
 * POST /api/agent/lab/patch  (agent-lab only — 404 in production)
 * Body: { weddingSlug, wedding?: {...}, guests?: PatchGuest[], rooms?: PatchRoom[] }
 *
 * Simulates the couple going off and DOING THE WORK in a rich section — filling
 * the website details, importing and tagging the guest list, placing people in
 * rooms — so an eval can test what the agent NOTICES when they come back.
 * Without this a scenario can only pretend the work happened, which is precisely
 * the gap production UAT exposed.
 */
export async function POST(request: NextRequest) {
  const access = await requireLabAccess(request);
  if (!isLabAccess(access)) return access;

  let body: {
    weddingSlug?: string;
    wedding?: Record<string, unknown>;
    guests?: PatchGuest[];
    rooms?: PatchRoom[];
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const { weddingSlug, wedding, guests, rooms } = body;
  if (!weddingSlug || !isLabSlug(weddingSlug)) {
    return NextResponse.json({ error: 'weddingSlug must be an agent-lab-* slug' }, { status: 400 });
  }
  const patched: string[] = [];
  const supabase = access.supabase;

  if (wedding && typeof wedding === 'object' && !Array.isArray(wedding)) {
    // .select() so a write that matches NO rows is an error, not a silent
    // no-op — an eval that thinks it simulated the couple's work but didn't is
    // worse than no eval at all.
    const { data, error } = await supabase
      .from('weddings')
      .update(wedding)
      .eq('slug', weddingSlug)
      .select('id');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data || data.length === 0) {
      return NextResponse.json({ error: `Patch matched no wedding for ${weddingSlug}` }, { status: 500 });
    }
    patched.push(...Object.keys(wedding));
  }

  if (Array.isArray(guests) && guests.length > 0) {
    const rows = guests.map((g, i) => ({
      wedding_id: weddingSlug,
      name: g.name,
      // (email, wedding_id) is unique — blank emails collide on the 2nd guest.
      email: `${g.name.toLowerCase().replace(/[^a-z]+/g, '.')}@example.com`,
      phone: `+1415555${String(2000 + i)}`,
      wedding_side: g.side ?? 'both',
      avatar_color: generateFallbackColor(g.name),
      logistics_data: { party_size: g.party ?? 1, tags: g.tags ?? [] },
    }));
    const { error } = await supabase.from('guests').insert(rows);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    patched.push(`${rows.length} guests`);
  }

  if (Array.isArray(rooms) && rooms.length > 0) {
    const { data: existing } = await supabase.from('guests').select('id, name').eq('wedding_id', weddingSlug);
    const idByName = new Map<string, string>(
      ((existing ?? []) as Array<{ id: string; name: string }>).map((g) => [g.name, g.id])
    );
    const rows = rooms.map((r) => ({
      wedding_id: weddingSlug,
      room_number: r.room_number,
      hotel_name: r.hotel_name ?? 'Rambagh Palace',
      capacity: r.capacity ?? 2,
      source: 'manual',
      assigned_guest_ids: (r.assign ?? []).map((n) => idByName.get(n)).filter(Boolean),
    }));
    const { error } = await supabase.from('wedding_rooms').insert(rows);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    patched.push(`${rows.length} rooms`);
  }

  if (patched.length === 0) return NextResponse.json({ error: 'Nothing to patch' }, { status: 400 });
  return NextResponse.json({ patched });
}
