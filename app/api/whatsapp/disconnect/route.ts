import { NextRequest, NextResponse } from 'next/server';
import { authorizeWhatsAppRequest } from '@/lib/whatsapp/route-auth';
import { teardownChannel } from '@/lib/whatsapp/groups-service';

export const runtime = 'nodejs';

/**
 * POST /api/whatsapp/disconnect — delete the couple's Whapi channel (stops
 * billing) and clear the stored token. Body: { weddingSlug }. Use after the
 * wedding, or if the couple wants to unlink.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const auth = await authorizeWhatsAppRequest(body?.weddingSlug, { requirePro: true });
  if (!auth.ok) return auth.response;
  try {
    await teardownChannel(auth.ctx.weddingSlug);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Disconnect failed' }, { status: 500 });
  }
}
