import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateFallbackColor } from '@/lib/utils/avatar-generator';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

interface GuestInput {
  name: string;
  email?: string;
  phone?: string;
  country_code?: string;
  wedding_side?: 'bride' | 'groom' | 'both';
  /** Legacy single-tag field — still accepted for CSV imports. May contain
   *  commas/semicolons for multi-tag cells; they'll be split server-side. */
  group?: string;
  /** Preferred multi-tag field — used by the manual-add form. */
  tags?: string[];
  /** Name the couple plans to invite as a plus one (pre-RSVP planning). */
  plus_one_name?: string;
  /** Optional direct phone for the plus one (for RSVP follow-up). */
  plus_one_phone?: string;
  /** Expected attendees for this invite (primary + companions). */
  party_size?: number;
  notes?: string;
}

/** Split a cell like "family, bride-side" into ["family", "bride-side"].
 *  Accepts comma, semicolon, or pipe as separators so CSV exports from
 *  different tools all parse cleanly. */
function splitTagCell(raw: string): string[] {
  return raw
    .split(/[,;|]/)
    .map((t) => t.trim())
    .filter(Boolean);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizePhone(phone: string, countryCode?: string): string {
  // Strip everything except digits and leading +
  let clean = phone.replace(/[\s\-()./]/g, '');
  if (!clean) return '';

  // Prepend country code if provided and phone doesn't already start with +
  if (countryCode && !clean.startsWith('+')) {
    const cc = countryCode.startsWith('+') ? countryCode : `+${countryCode}`;
    clean = `${cc}${clean}`;
  }

  // Ensure leading +
  if (!clean.startsWith('+')) {
    clean = `+${clean}`;
  }

  // Validate: at least 7 digits after +
  const digits = clean.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) return '';

  return clean;
}

/**
 * POST /api/guests/import — Batch import guests
 */
export async function POST(request: NextRequest) {
  try {
    const { wedding_id, guests } = (await request.json()) as {
      wedding_id: string;
      guests: GuestInput[];
    };

    if (!wedding_id || !Array.isArray(guests) || guests.length === 0) {
      return NextResponse.json({ error: 'wedding_id and non-empty guests array required' }, { status: 400 });
    }

    // Load existing guests for duplicate detection
    const { data: existing } = await supabase
      .from('guests')
      .select('email, phone')
      .eq('wedding_id', wedding_id);

    const existingEmails = new Set(
      (existing || []).map((g: { email: string | null }) => g.email?.toLowerCase()).filter(Boolean),
    );
    const existingPhones = new Set(
      (existing || []).map((g: { phone: string | null }) => g.phone?.replace(/[^\d+]/g, '')).filter(Boolean),
    );

    const toInsert: Record<string, unknown>[] = [];
    const duplicates: number[] = [];
    const errors: Array<{ row: number; reason: string }> = [];

    for (let i = 0; i < guests.length; i++) {
      const g = guests[i];

      // Validate name
      if (!g.name || !g.name.trim()) {
        errors.push({ row: i + 1, reason: 'Name is required' });
        continue;
      }

      // Validate & normalize email
      let email: string | null = null;
      if (g.email) {
        const cleaned = g.email.trim().toLowerCase();
        if (!EMAIL_RE.test(cleaned)) {
          errors.push({ row: i + 1, reason: `Invalid email: ${g.email}` });
          continue;
        }
        email = cleaned;
      }

      // Validate & normalize phone
      let phone: string | null = null;
      if (g.phone) {
        phone = normalizePhone(g.phone, g.country_code);
        if (!phone) {
          errors.push({ row: i + 1, reason: `Invalid phone: ${g.phone}` });
          continue;
        }
      }

      // Duplicate check
      const isDuplicate =
        (email && existingEmails.has(email)) ||
        (phone && existingPhones.has(phone.replace(/[^\d+]/g, '')));

      if (isDuplicate) {
        duplicates.push(i + 1);
        continue;
      }

      // Track for intra-batch dedup
      if (email) existingEmails.add(email);
      if (phone) existingPhones.add(phone.replace(/[^\d+]/g, ''));

      const name = g.name.trim();
      const sideRaw = (g.wedding_side || '').toString().trim().toLowerCase();
      const weddingSide = (['bride', 'groom', 'both'] as const).find((s) => s === sideRaw) || null;

      // Normalize tags. Prefer explicit `tags` array; fall back to legacy
      // `group` (single string) for CSV imports. Either path is split on
      // comma / semicolon / pipe so a single cell with "family, bride-side"
      // imports as distinct tags.
      const rawTagList = Array.isArray(g.tags)
        ? g.tags.flatMap((t) => (typeof t === 'string' ? splitTagCell(t) : []))
        : g.group && g.group.trim()
          ? splitTagCell(g.group)
          : [];
      const uniqueTags = Array.from(new Set(rawTagList));

      const plusOneName = g.plus_one_name && g.plus_one_name.trim() ? g.plus_one_name.trim() : null;
      const plusOnePhone = g.plus_one_phone && g.plus_one_phone.trim() ? g.plus_one_phone.trim() : null;
      const partySize = typeof g.party_size === 'number' && g.party_size > 0
        ? Math.floor(g.party_size)
        : null;

      // Build logistics_data only if at least one field is set.
      const logisticsFields: Record<string, unknown> = {};
      if (uniqueTags.length > 0) {
        logisticsFields.tags = uniqueTags;
        logisticsFields.tag = uniqueTags[0]; // mirror primary into legacy `tag`
      }
      if (plusOneName) logisticsFields.plus_one_name = plusOneName;
      if (plusOnePhone) logisticsFields.plus_one_phone = plusOnePhone;
      if (partySize !== null) logisticsFields.party_size = partySize;
      const logistics_data = Object.keys(logisticsFields).length > 0 ? logisticsFields : null;

      toInsert.push({
        name,
        email: email || `imported-${Date.now()}-${i}@phera.io`,
        phone,
        wedding_id,
        wedding_side: weddingSide,
        ...(logistics_data && { logistics_data }),
        avatar_color: generateFallbackColor(name),
        auth_method: 'imported',
      });
    }

    // Batch insert (Supabase supports up to 1000 rows per insert)
    let imported = 0;
    const BATCH_SIZE = 500;
    const importedIds: string[] = [];

    for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
      const batch = toInsert.slice(i, i + BATCH_SIZE);
      const { data, error } = await supabase
        .from('guests')
        .insert(batch)
        .select('id');

      if (error) {
        errors.push({ row: -1, reason: `Batch insert failed: ${error.message}` });
      } else {
        imported += (data || []).length;
        importedIds.push(...(data || []).map((r: { id: string }) => r.id));
      }
    }

    return NextResponse.json({
      imported,
      duplicates: duplicates.length,
      errors,
      total_submitted: guests.length,
      imported_ids: importedIds,
    });
  } catch (error: unknown) {
    console.error('[guests/import] Error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
