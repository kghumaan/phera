import { NextRequest, NextResponse } from 'next/server';
import { authorizeWhatsAppRequest } from '@/lib/whatsapp/route-auth';
import { provisionChannel, refreshAndGetStatus } from '@/lib/whatsapp/groups-service';

export const runtime = 'nodejs';

/**
 * POST /api/whatsapp/connect  — provision (or reuse) the couple's Whapi channel.
 * Body: { weddingSlug, name? }. Paid feature. Returns the safe status view.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const auth = await authorizeWhatsAppRequest(body?.weddingSlug, { requirePro: true });
  if (!auth.ok) return auth.response;
  try {
    const name = (body?.name as string) || `Phera – ${auth.ctx.weddingSlug}`;
    const view = await provisionChannel(auth.ctx.weddingSlug, name);
    return NextResponse.json(view);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Provision failed' }, { status: 500 });
  }
}

/**
 * GET /api/whatsapp/connect?weddingSlug=... — current pairing status (safe view).
 * Polled by the pairing panel until status === 'auth'. Not pro-gated (read only).
 */
export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('weddingSlug');
  const auth = await authorizeWhatsAppRequest(slug);
  if (!auth.ok) return auth.response;
  const view = await refreshAndGetStatus(auth.ctx.weddingSlug);
  return NextResponse.json(view);
}
