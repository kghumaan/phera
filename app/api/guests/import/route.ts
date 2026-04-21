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
  group?: string;
  notes?: string;
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
      (existing || []).map((g: any) => g.email?.toLowerCase()).filter(Boolean),
    );
    const existingPhones = new Set(
      (existing || []).map((g: any) => g.phone?.replace(/[^\d+]/g, '')).filter(Boolean),
    );

    const toInsert: any[] = [];
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

      toInsert.push({
        name,
        email: email || `imported-${Date.now()}-${i}@phera.io`,
        phone,
        wedding_id,
        wedding_side: weddingSide,
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
        importedIds.push(...(data || []).map((r: any) => r.id));
      }
    }

    return NextResponse.json({
      imported,
      duplicates: duplicates.length,
      errors,
      total_submitted: guests.length,
      imported_ids: importedIds,
    });
  } catch (error: any) {
    console.error('[guests/import] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
