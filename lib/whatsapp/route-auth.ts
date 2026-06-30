import { NextResponse } from 'next/server';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { getAuthenticatedClient } from '@/lib/utils/auth-helpers';
import { verifyWeddingAccess } from '@/lib/utils/verify-wedding-access';
import { getUserIsPro } from '@/lib/agent/plan';

export interface WhatsAppRouteCtx {
  supabase: SupabaseClient;
  user: User;
  weddingSlug: string;
  weddingId: string;
  isPro: boolean;
}

type AuthResult =
  | { ok: true; ctx: WhatsAppRouteCtx }
  | { ok: false; response: NextResponse };

/**
 * Shared auth for /api/whatsapp/* routes: authenticated user → wedding by slug →
 * wedding access → (optionally) paid plan. Returns a ready NextResponse on any
 * failure so each route can `if (!auth.ok) return auth.response;`.
 */
export async function authorizeWhatsAppRequest(
  weddingSlug: string | null | undefined,
  opts: { requirePro?: boolean } = {},
): Promise<AuthResult> {
  const { supabase, user } = await getAuthenticatedClient();
  if (!supabase || !user) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  if (!weddingSlug) {
    return { ok: false, response: NextResponse.json({ error: 'Missing weddingSlug' }, { status: 400 }) };
  }
  const { data: wedding } = await supabase
    .from('weddings')
    .select('id, slug')
    .eq('slug', weddingSlug)
    .single();
  if (!wedding) {
    return { ok: false, response: NextResponse.json({ error: 'Wedding not found' }, { status: 404 }) };
  }
  const hasAccess = await verifyWeddingAccess(supabase, user.id, wedding.id);
  if (!hasAccess) {
    return { ok: false, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  const isPro = await getUserIsPro(supabase, user.id);
  if (opts.requirePro && !isPro) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Guest WhatsApp messaging is a paid feature. Upgrade to use it.', upgradeRequired: true },
        { status: 402 },
      ),
    };
  }
  return { ok: true, ctx: { supabase, user, weddingSlug: wedding.slug, weddingId: wedding.id, isPro } };
}
