import { NextRequest, NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getAuthenticatedClient } from '@/lib/utils/auth-helpers';
import { verifyWeddingAccess } from '@/lib/utils/verify-wedding-access';

async function verifyAccessBySlug(
  supabase: SupabaseClient,
  userId: string,
  weddingSlug: string,
): Promise<boolean> {
  const { data } = await supabase
    .from('weddings')
    .select('id')
    .eq('slug', weddingSlug)
    .single();
  if (!data?.id) return false;
  return verifyWeddingAccess(supabase, userId, data.id);
}

/**
 * Admin phones authorized to drive the WhatsApp Bot for a wedding (couple,
 * planner, family liaison, etc.). RLS locks rows to wedding owners/admins
 * via is_wedding_owner_or_admin_by_slug, so the route just enforces the
 * same gate before calling Supabase.
 */

interface AdminInsert {
  weddingSlug: string;
  name: string;
  phone: string;
}

function normalizePhone(input: string): string {
  // Keep an optional leading '+', strip everything else that isn't a digit.
  const trimmed = input.trim();
  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');
  return hasPlus ? `+${digits}` : digits;
}

export async function GET(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient();
    if (!supabase || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const weddingSlug = request.nextUrl.searchParams.get('weddingSlug');
    if (!weddingSlug) {
      return NextResponse.json({ error: 'Missing weddingSlug' }, { status: 400 });
    }

    const hasAccess = await verifyAccessBySlug(supabase, user.id, weddingSlug);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- table not in generated types yet
    const { data, error } = await (supabase as any)
      .from('wedding_bot_admins')
      .select('id, name, phone, created_at')
      .eq('wedding_id', weddingSlug)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ admins: data || [] });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    console.error('GET /api/whatsapp-bot/admins:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient();
    if (!supabase || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: AdminInsert = await request.json();
    const { weddingSlug, name, phone } = body;
    if (!weddingSlug || !name?.trim() || !phone?.trim()) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const normalizedPhone = normalizePhone(phone);
    if (normalizedPhone.replace(/\D/g, '').length < 8) {
      return NextResponse.json({ error: 'Phone number looks too short' }, { status: 400 });
    }

    const hasAccess = await verifyAccessBySlug(supabase, user.id, weddingSlug);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('wedding_bot_admins')
      .insert({
        wedding_id: weddingSlug,
        name: name.trim(),
        phone: normalizedPhone,
      })
      .select('id, name, phone, created_at')
      .single();

    if (error) {
      // Surface unique-violation as a friendly message.
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'That phone number is already an admin.' },
          { status: 409 },
        );
      }
      throw error;
    }
    return NextResponse.json({ admin: data });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    console.error('POST /api/whatsapp-bot/admins:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient();
    if (!supabase || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = request.nextUrl.searchParams.get('id');
    const weddingSlug = request.nextUrl.searchParams.get('weddingSlug');
    if (!id || !weddingSlug) {
      return NextResponse.json({ error: 'Missing id or weddingSlug' }, { status: 400 });
    }

    const hasAccess = await verifyAccessBySlug(supabase, user.id, weddingSlug);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('wedding_bot_admins')
      .delete()
      .eq('id', id)
      .eq('wedding_id', weddingSlug);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    console.error('DELETE /api/whatsapp-bot/admins:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
