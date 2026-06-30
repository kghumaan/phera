import { NextRequest, NextResponse } from 'next/server';
import { authorizeWhatsAppRequest } from '@/lib/whatsapp/route-auth';
import { sendDirectFromCouple } from '@/lib/whatsapp/groups-service';
import { sendWhapiText } from '@/lib/whatsapp/whapi-send';
import { guestMatchesTags } from '@/lib/utils/guest-tags';

export const runtime = 'nodejs';
export const maxDuration = 120;

type GuestRow = { id: string; name: string; phone: string | null; logistics_data: unknown };

/**
 * POST /api/whatsapp/send — send a guest broadcast the couple confirmed in the
 * review panel. Body: { weddingSlug, message, audience: 'all'|'tags'|'specific',
 * tags?, guestIds?, via: 'couple'|'phera' }. ('wa.me' is handled client-side via
 * deep links — it never hits this route.) Paid feature.
 *
 * via 'couple' = from the couple's OWN paired number; 'phera' = Phera's number.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const auth = await authorizeWhatsAppRequest(body?.weddingSlug, { requirePro: true });
  if (!auth.ok) return auth.response;

  const message = ((body?.message as string) || '').trim();
  if (!message) return NextResponse.json({ error: 'Empty message' }, { status: 400 });
  const audience = (body?.audience as 'all' | 'tags' | 'specific') || 'all';
  const tags: string[] = Array.isArray(body?.tags) ? body.tags : [];
  const guestIds: string[] = Array.isArray(body?.guestIds) ? body.guestIds : [];
  const via = body?.via === 'couple' ? 'couple' : 'phera';

  const { data, error } = await auth.ctx.supabase
    .from('guests')
    .select('id, name, phone, logistics_data')
    .eq('wedding_id', auth.ctx.weddingSlug);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let recipients = ((data ?? []) as GuestRow[]).filter((g) => g.phone);
  if (audience === 'tags') {
    if (!tags.length) return NextResponse.json({ error: 'No tags provided' }, { status: 400 });
    recipients = recipients.filter((g) => guestMatchesTags(g.logistics_data, tags));
  } else if (audience === 'specific') {
    const wanted = new Set(guestIds);
    recipients = recipients.filter((g) => wanted.has(g.id));
  }
  if (!recipients.length) return NextResponse.json({ error: 'No guests match that audience' }, { status: 400 });

  const phones = recipients.map((g) => g.phone as string);

  try {
    if (via === 'couple') {
      const { sent, failed } = await sendDirectFromCouple(auth.ctx.weddingSlug, phones, message);
      return NextResponse.json({ sent, failed, total: phones.length, via });
    }
    // Phera's shared number — one text per recipient.
    let sent = 0;
    let failed = 0;
    for (const phone of phones) {
      const { id, error: sendErr } = await sendWhapiText(phone, message);
      if (id && !sendErr) sent++;
      else failed++;
    }
    return NextResponse.json({ sent, failed, total: phones.length, via });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Send failed' }, { status: 500 });
  }
}
