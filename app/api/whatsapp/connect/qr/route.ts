import { NextRequest, NextResponse } from 'next/server';
import { authorizeWhatsAppRequest } from '@/lib/whatsapp/route-auth';
import { getLoginQrForWedding } from '@/lib/whatsapp/groups-service';

export const runtime = 'nodejs';

/**
 * GET /api/whatsapp/connect/qr?weddingSlug=... — base64 login QR for the couple
 * to scan in WhatsApp › Linked Devices. The channel token never leaves the
 * server; only the QR image is returned. Null once paired (status auth).
 */
export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('weddingSlug');
  const auth = await authorizeWhatsAppRequest(slug, { requirePro: true });
  if (!auth.ok) return auth.response;
  try {
    const qrBase64 = await getLoginQrForWedding(auth.ctx.weddingSlug);
    return NextResponse.json({ qrBase64 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'QR fetch failed' }, { status: 500 });
  }
}
