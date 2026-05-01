import { NextRequest, NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getAuthenticatedClient } from '@/lib/utils/auth-helpers';
import { verifyWeddingAccess } from '@/lib/utils/verify-wedding-access';
import { tryHandleAdminMessage } from '@/lib/whatsapp/admin-router';

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
 * POST /api/whatsapp-bot/admins/simulate
 *
 * Run the admin gate against a synthetic inbound — same code path the
 * real WhatsApp webhooks call, no external messaging side-effects. Used
 * by the Admin tab's "Test as admin" panel so the couple can verify
 * their bot wiring before sending an actual WhatsApp.
 *
 * Body: { weddingSlug, adminId, messageText }
 *   - adminId: id of the row in wedding_bot_admins to impersonate
 *   - messageText: what the simulated admin "texted"
 *
 * Returns:
 *   { reply, weddingSlug, adminName, logId, simulated: true }
 */
export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient();
    if (!supabase || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { weddingSlug, adminId, messageText } = body || {};
    if (!weddingSlug || !adminId || !messageText?.trim()) {
      return NextResponse.json(
        { error: 'Missing weddingSlug, adminId, or messageText' },
        { status: 400 },
      );
    }

    const hasAccess = await verifyAccessBySlug(supabase, user.id, weddingSlug);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Pull the admin row so we can hand its phone to the gate. Using the
    // user-scoped client is fine here — RLS already lets the wedding
    // owner read their own admin entries.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- table not in generated types yet
    const { data: admin } = await (supabase as any)
      .from('wedding_bot_admins')
      .select('id, name, phone, wedding_id')
      .eq('id', adminId)
      .eq('wedding_id', weddingSlug)
      .single();
    if (!admin?.phone) {
      return NextResponse.json({ error: 'Admin not found for this wedding' }, { status: 404 });
    }

    const result = await tryHandleAdminMessage({
      senderPhone: admin.phone,
      messageText: messageText.trim(),
      senderProfileName: admin.name,
    });

    if (!result) {
      // The router only returns null when the phone didn't match any
      // admin row — shouldn't happen here since we just resolved the
      // admin by id, but surface it explicitly so the UI can show what
      // went wrong rather than silently succeeding.
      return NextResponse.json(
        { error: 'Admin gate did not match the selected admin\'s phone — check the row hasn\'t been edited mid-request.' },
        { status: 500 },
      );
    }

    return NextResponse.json({ ...result, simulated: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    console.error('POST /api/whatsapp-bot/admins/simulate:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
