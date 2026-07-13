import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendWhapiText } from '@/lib/whatsapp/whapi-send';
import type { BroadcastDataField, BroadcastTargetType } from '@/lib/supabase/broadcasts-service';
import { guestMatchesTags } from '@/lib/utils/guest-tags';
import { getAuthenticatedClient } from '@/lib/utils/auth-helpers';
import { verifyWeddingAccess } from '@/lib/utils/verify-wedding-access';

/**
 * Create + send a broadcast.
 *
 * Body:
 *   weddingId (uuid)
 *   weddingSlug (text)
 *   message (text)
 *   targetType: 'all' | 'tags' | 'specific'
 *   targetTags: string[]
 *   targetGuestIds: uuid[]
 *   collectsData: boolean
 *   dataSchema: BroadcastDataField[]
 *
 * Creates one concierge_broadcasts row + one concierge_broadcast_recipients
 * row per targeted guest with a phone number, then fires WhatsApp sends.
 *
 * NOTE: this sends free-form messages via the existing WhatsAppClient.
 * Free-form outbound only works to guests inside the 24-hour service
 * window OR who have opted in. Guests outside that window will fail and
 * are recorded with delivery_status='failed'.
 */
export async function POST(req: NextRequest) {
  const { supabase: userClient, user } = await getAuthenticatedClient();
  if (!userClient || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const {
    weddingId,
    weddingSlug,
    message,
    targetType,
    targetTags = [],
    targetGuestIds = [],
    collectsData = false,
    dataSchema = [],
  }: {
    weddingId: string;
    weddingSlug: string;
    message: string;
    targetType: BroadcastTargetType;
    targetTags?: string[];
    targetGuestIds?: string[];
    collectsData?: boolean;
    dataSchema?: BroadcastDataField[];
  } = body;

  if (!weddingId || !weddingSlug || !message?.trim() || !targetType) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const hasAccess = await verifyWeddingAccess(userClient, user.id, weddingId);
  if (!hasAccess) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Supabase service credentials not configured' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  // Resolve target guests (must have phone)
  let guestQuery = supabase
    .from('guests')
    .select('id, phone, name, logistics_data')
    .eq('wedding_id', weddingSlug);

  if (targetType === 'specific') {
    if (!targetGuestIds.length) return NextResponse.json({ error: 'No guests selected' }, { status: 400 });
    guestQuery = guestQuery.in('id', targetGuestIds);
  }

  const { data: guests, error: guestErr } = await guestQuery;
  if (guestErr) return NextResponse.json({ error: guestErr.message }, { status: 500 });

  let recipients = (guests || []).filter((g) => g.phone);

  if (targetType === 'tags') {
    if (!targetTags.length) return NextResponse.json({ error: 'No tags selected' }, { status: 400 });
    recipients = recipients.filter((g: any) => guestMatchesTags(g.logistics_data, targetTags));
  }

  if (!recipients.length) {
    return NextResponse.json({ error: 'No guests match that target' }, { status: 400 });
  }

  // Create the broadcast row.
  const { data: broadcast, error: bErr } = await supabase
    .from('concierge_broadcasts')
    .insert({
      wedding_id: weddingSlug,
      message: message.trim(),
      target_type: targetType,
      target_tags: targetTags,
      target_guest_ids: targetGuestIds,
      collects_data: collectsData,
      data_schema: dataSchema,
      status: 'sending',
    })
    .select()
    .single();

  if (bErr || !broadcast) {
    return NextResponse.json({ error: bErr?.message || 'Failed to create broadcast' }, { status: 500 });
  }

  // Create recipient rows up-front (bulk insert)
  const recipientRows = recipients.map((g: any) => ({
    broadcast_id: broadcast.id,
    guest_id: g.id,
    wedding_id: weddingSlug,
    delivery_status: 'pending',
  }));

  const { data: inserted, error: rErr } = await supabase
    .from('concierge_broadcast_recipients')
    .insert(recipientRows)
    .select('id, guest_id');

  if (rErr) {
    return NextResponse.json({ error: rErr.message }, { status: 500 });
  }

  const recipientIdByGuest = new Map<string, string>();
  (inserted || []).forEach((r: any) => recipientIdByGuest.set(r.guest_id, r.id));

  // All outbound WhatsApp goes through Whapi (our SIM-connected number).
  // No Meta fallback — that's not our strategy.
  let sentCount = 0;
  let failedCount = 0;

  for (const g of recipients as any[]) {
    const recipientId = recipientIdByGuest.get(g.id);
    if (!recipientId) continue;

    const result = await sendWhapiText(g.phone, message.trim());

    if (result.id) {
      sentCount += 1;
      await supabase
        .from('concierge_broadcast_recipients')
        .update({
          delivery_status: 'sent',
          whatsapp_message_id: result.id,
        })
        .eq('id', recipientId);
    } else {
      failedCount += 1;
      await supabase
        .from('concierge_broadcast_recipients')
        .update({
          delivery_status: 'failed',
          error_message: result.error || 'Send failed (no message id returned)',
        })
        .eq('id', recipientId);
    }
  }

  // Finalize broadcast.
  await supabase
    .from('concierge_broadcasts')
    .update({
      status: failedCount && !sentCount ? 'failed' : 'sent',
      sent_at: new Date().toISOString(),
      sent_count: sentCount,
      failed_count: failedCount,
    })
    .eq('id', broadcast.id);

  return NextResponse.json({
    broadcast_id: broadcast.id,
    recipients: recipients.length,
    sent: sentCount,
    failed: failedCount,
  });
}
