import { NextRequest, NextResponse } from 'next/server';
import { getOpsSupabaseAdmin } from '@/lib/ops/supabase-admin';
import { deriveFirstName, relativeTime } from '@/lib/ops/outreach-email';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const DAY_MS = 24 * 60 * 60 * 1000;

type User = {
  id: string;
  email: string | null;
  phone: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  provider: string | null;
  firstName: string | null;
  signupRelative: string;
  hasWedding: boolean;
  weddingsOwned: string[];
  guestOfWeddings: string[];
  lastContact: {
    sent_at: string;
    kind: string;
    status: string;
    from_email: string | null;
  } | null;
};

export async function GET(request: NextRequest) {
  const supabase = getOpsSupabaseAdmin();
  const url = new URL(request.url);
  const ageDaysParam = url.searchParams.get('ageDays');
  const ageDays = ageDaysParam ? Math.max(0, Math.min(365, Number(ageDaysParam) || 0)) : 0;
  const now = Date.now();
  const cutoff = ageDays > 0 ? now - ageDays * DAY_MS : null;

  // --- all users (paginated) ---
  const firstPage = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (firstPage.error) {
    return NextResponse.json({ error: firstPage.error.message }, { status: 500 });
  }
  const all = [...firstPage.data.users];
  const pages = Math.ceil((firstPage.data.total ?? all.length) / 200);
  for (let p = 2; p <= Math.min(pages, 10); p += 1) {
    const next = await supabase.auth.admin.listUsers({ page: p, perPage: 200 });
    if (next.error) break;
    all.push(...next.data.users);
  }

  // --- weddings owners ---
  const { data: weddings } = await supabase
    .from('weddings')
    .select('slug, created_by');
  const owners = new Map<string, string[]>(); // user_id -> slugs
  for (const w of (weddings ?? []) as Array<{ slug: string; created_by: string | null }>) {
    if (!w.created_by) continue;
    const arr = owners.get(w.created_by) ?? [];
    arr.push(w.slug);
    owners.set(w.created_by, arr);
  }

  // --- guest appearances: match auth users to guests table by email / phone ---
  // Build email -> Set<slug> and phone -> Set<slug> maps.
  const guestByEmail = new Map<string, Set<string>>();
  const guestByPhone = new Map<string, Set<string>>();
  // Pull in batches because this can be a big table.
  const pageSize = 1000;
  let from = 0;
  // Cap at 10k rows to avoid runaway — more than enough for ops.
  for (let iter = 0; iter < 10; iter += 1) {
    const { data: guestChunk } = await supabase
      .from('guests')
      .select('email, phone, wedding_id')
      .range(from, from + pageSize - 1);
    const chunk = (guestChunk ?? []) as Array<{
      email: string | null;
      phone: string | null;
      wedding_id: string;
    }>;
    for (const g of chunk) {
      if (g.email) {
        const k = g.email.trim().toLowerCase();
        if (k) {
          const set = guestByEmail.get(k) ?? new Set<string>();
          set.add(g.wedding_id);
          guestByEmail.set(k, set);
        }
      }
      if (g.phone) {
        const k = normalizePhone(g.phone);
        if (k) {
          const set = guestByPhone.get(k) ?? new Set<string>();
          set.add(g.wedding_id);
          guestByPhone.set(k, set);
        }
      }
    }
    if (chunk.length < pageSize) break;
    from += pageSize;
  }

  // --- prior outreach log (to show contact chip) ---
  const userIds = all.map((u) => u.id);
  const lastContacts = new Map<string, User['lastContact']>();
  if (userIds.length > 0) {
    const { data: log } = await supabase
      .from('ops_user_outreach')
      .select('user_id, created_at, kind, status, from_email')
      .in('user_id', userIds)
      .order('created_at', { ascending: false });
    for (const row of (log ?? []) as Array<{
      user_id: string;
      created_at: string;
      kind: string;
      status: string;
      from_email: string | null;
    }>) {
      if (lastContacts.has(row.user_id)) continue;
      lastContacts.set(row.user_id, {
        sent_at: row.created_at,
        kind: row.kind,
        status: row.status,
        from_email: row.from_email,
      });
    }
  }

  // --- shape ALL users (filtering is client-side) ---
  const filtered = all
    .filter((u) => (cutoff === null ? true : new Date(u.created_at).getTime() <= cutoff))
    .sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

  const rows: User[] = filtered.map((u) => {
    const emailKey = u.email?.trim().toLowerCase();
    const phoneKey = u.phone ? normalizePhone(u.phone) : '';
    const guestOf = new Set<string>();
    if (emailKey) for (const s of guestByEmail.get(emailKey) ?? []) guestOf.add(s);
    if (phoneKey) for (const s of guestByPhone.get(phoneKey) ?? []) guestOf.add(s);
    const weddingsOwned = owners.get(u.id) ?? [];
    return {
      id: u.id,
      email: u.email ?? null,
      phone: u.phone ?? null,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at ?? null,
      provider:
        (u.app_metadata as { provider?: string } | null)?.provider ??
        (u.identities?.[0]?.provider as string | undefined) ??
        null,
      firstName: deriveFirstName({
        email: u.email ?? null,
        user_metadata: (u.user_metadata as Record<string, unknown> | null) ?? null,
      }),
      signupRelative: relativeTime(u.created_at, now),
      hasWedding: weddingsOwned.length > 0,
      weddingsOwned: weddingsOwned.sort(),
      guestOfWeddings: Array.from(guestOf).sort(),
      lastContact: lastContacts.get(u.id) ?? null,
    };
  });

  // --- collapse duplicate emails into one outreach row ---
  // Multiple auth.users can share the same address (signed up with Google AND
  // email/password, or a stray re-signup). For outreach we only ever want to
  // hit an address once, so group by lowercased email and keep a single
  // representative — preferring the account that owns a wedding — while merging
  // every duplicate's wedding associations + newest contact record onto it.
  const emailGroups = new Map<string, User[]>();
  const noEmail: User[] = [];
  for (const r of rows) {
    const key = r.email?.trim().toLowerCase();
    if (!key) {
      noEmail.push(r); // phone-only / emailless accounts can't be collapsed
      continue;
    }
    const arr = emailGroups.get(key) ?? [];
    arr.push(r);
    emailGroups.set(key, arr);
  }

  const deduped: User[] = [];
  for (const group of emailGroups.values()) {
    const rep = group.find((g) => g.hasWedding) ?? group[0];
    for (const g of group) {
      if (g === rep) continue;
      rep.weddingsOwned = Array.from(
        new Set([...rep.weddingsOwned, ...g.weddingsOwned]),
      ).sort();
      rep.guestOfWeddings = Array.from(
        new Set([...rep.guestOfWeddings, ...g.guestOfWeddings]),
      ).sort();
      rep.hasWedding = rep.hasWedding || g.hasWedding;
      if (
        g.lastContact &&
        (!rep.lastContact ||
          new Date(g.lastContact.sent_at).getTime() >
            new Date(rep.lastContact.sent_at).getTime())
      ) {
        rep.lastContact = g.lastContact;
      }
    }
    deduped.push(rep);
  }
  deduped.push(...noEmail);
  deduped.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  // Outreach targets = admins / account creators only. Never surface someone
  // who is just a guest of a wedding: keep a user only if they own a wedding
  // (an admin) or aren't a guest of any wedding at all (a pure account creator).
  const outreachable = deduped.filter(
    (r) => r.weddingsOwned.length > 0 || r.guestOfWeddings.length === 0,
  );

  const withWedding = outreachable.filter((r) => r.hasWedding).length;

  return NextResponse.json({
    total: outreachable.length,
    totalUsers: all.length,
    withWedding,
    rows: outreachable,
    generatedAt: new Date().toISOString(),
  });
}

// Collapse a phone string to digits-only so "+1 (415) 555…" and "14155550…" match.
function normalizePhone(v: string): string {
  return v.replace(/[^0-9]/g, '');
}
