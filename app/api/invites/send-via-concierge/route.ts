import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendWhapiText } from '@/lib/whatsapp/whapi-send';
import { renderTemplate, getInviteTemplate } from '@/lib/invites/templates';
import type { BroadcastDataField } from '@/lib/supabase/broadcasts-service';
import { getAuthenticatedClient } from '@/lib/utils/auth-helpers';
import { verifyWeddingAccessBySlug } from '@/lib/utils/verify-wedding-access';

/**
 * Send an invite template through the Concierge WhatsApp number (Whapi),
 * rather than handing off wa.me deep links for the couple to fire from
 * their personal phone.
 *
 * Body:
 *   weddingSlug      (text)
 *   templateId       (string — must match an INVITE_TEMPLATES entry)
 *   sharedVars       (Record<string,string> — couple-supplied variables)
 *   targetType       'all' | 'tags' | 'specific'
 *   targetTags       (string[]) when targetType === 'tags'
 *   targetGuestIds   (uuid[])    when targetType === 'specific'
 *   collectsData     (boolean)   true if the template auto-detected data asks
 *   dataSchema       (BroadcastDataField[])  optional schema of data fields
 *
 * The body is rendered per-guest so per_guest variables (guest_first_name,
 * rsvp_link, travel_link) interpolate correctly. Each send is recorded as an
 * outreach_events row so the Invites page Recent campaigns list picks it up
 * the same way wa.me sends do.
 *
 * When `collectsData` is true and `dataSchema` has at least one field we
 * also create a concierge_broadcasts row + recipient rows so guest replies
 * can be attributed and surfaced in Guest Responses › Collected Data using
 * the same plumbing as Concierge broadcasts.
 */
export async function POST(req: NextRequest) {
  let body: {
    weddingSlug: string;
    templateId: string;
    sharedVars?: Record<string, string>;
    targetType: 'all' | 'tags' | 'specific';
    targetTags?: string[];
    targetGuestIds?: string[];
    collectsData?: boolean;
    dataSchema?: BroadcastDataField[];
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const {
    weddingSlug,
    templateId,
    sharedVars = {},
    targetType,
    targetTags = [],
    targetGuestIds = [],
    collectsData = false,
    dataSchema = [],
  } = body;

  if (!weddingSlug || !templateId || !targetType) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const { supabase: userClient, user } = await getAuthenticatedClient();
  if (!userClient || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const hasAccess = await verifyWeddingAccessBySlug(userClient, user.id, weddingSlug);
  if (!hasAccess) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const template = getInviteTemplate(templateId);
  if (!template) {
    return NextResponse.json({ error: `Unknown template: ${templateId}` }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json(
      { error: 'Supabase service credentials not configured' },
      { status: 500 },
    );
  }
  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  // Fetch candidate guests for this wedding. We filter to phone-only after.
  const { data: guests, error: guestErr } = await supabase
    .from('guests')
    .select('id, name, phone, logistics_data, outreach_status')
    .eq('wedding_id', weddingSlug);
  if (guestErr) {
    return NextResponse.json({ error: guestErr.message }, { status: 500 });
  }

  let candidates = (guests || []).filter((g: { phone: string | null }) => !!g.phone);

  if (targetType === 'specific') {
    if (!targetGuestIds.length) {
      return NextResponse.json({ error: 'No guests selected' }, { status: 400 });
    }
    const allowed = new Set(targetGuestIds);
    candidates = candidates.filter((g: { id: string }) => allowed.has(g.id));
  } else if (targetType === 'tags') {
    if (!targetTags.length) {
      return NextResponse.json({ error: 'No tags selected' }, { status: 400 });
    }
    const wanted = new Set(targetTags);
    candidates = candidates.filter((g: { logistics_data: { tag?: string; tags?: string[] } | null }) => {
      const ld = g.logistics_data;
      if (!ld) return false;
      if (Array.isArray(ld.tags) && ld.tags.some((t) => wanted.has(t))) return true;
      if (typeof ld.tag === 'string' && wanted.has(ld.tag)) return true;
      return false;
    });
  }

  if (!candidates.length) {
    return NextResponse.json({ error: 'No guests with phone numbers match that target' }, { status: 400 });
  }

  // Render the body once with default placeholders so we can store a useful
  // reference message on the broadcast row (per-guest interpolation happens
  // below). Strips out perGuest tokens since they'd leak as "{{key}}" here.
  const broadcastReferenceMessage = renderTemplate(template.body, {
    ...sharedVars,
    guest_first_name: '',
    rsvp_link: sharedVars.rsvp_link || '',
    travel_link: sharedVars.travel_link || '',
  });

  // If the composer detected data the couple is asking for, mirror this run
  // into concierge_broadcasts so replies attribute back to it and show up in
  // Guest Responses › Collected Data alongside Concierge broadcasts.
  const trackingEnabled = !!collectsData && Array.isArray(dataSchema) && dataSchema.length > 0;
  let broadcastId: string | null = null;
  const recipientIdByGuest = new Map<string, string>();

  if (trackingEnabled) {
    const { data: broadcast, error: bErr } = await supabase
      .from('concierge_broadcasts')
      .insert({
        wedding_id: weddingSlug,
        message: broadcastReferenceMessage.trim(),
        target_type: targetType,
        target_tags: targetTags,
        target_guest_ids: targetGuestIds,
        collects_data: true,
        data_schema: dataSchema,
        status: 'sending',
      })
      .select()
      .single();

    if (bErr || !broadcast) {
      return NextResponse.json(
        { error: bErr?.message || 'Failed to create broadcast for tracking' },
        { status: 500 },
      );
    }
    broadcastId = broadcast.id as string;

    const recipientRows = candidates.map((g: { id: string }) => ({
      broadcast_id: broadcastId,
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
    (inserted || []).forEach((r: { id: string; guest_id: string }) =>
      recipientIdByGuest.set(r.guest_id, r.id),
    );
  }

  // Render + dispatch per guest. Failures are recorded but don't abort the run.
  let sent = 0;
  let failed = 0;
  const errors: Array<{ guestId: string; reason: string }> = [];

  for (const g of candidates as Array<{ id: string; name: string; phone: string }>) {
    const firstName = (g.name || '').split(/\s+/)[0] || 'there';
    const perGuestVars: Record<string, string> = {
      ...sharedVars,
      guest_first_name: firstName,
      rsvp_link: sharedVars.rsvp_link || `https://phera.io/${weddingSlug}/rsvp`,
      travel_link: sharedVars.travel_link || `https://phera.io/${weddingSlug}/travel`,
    };
    const message = renderTemplate(template.body, perGuestVars);

    const result = await sendWhapiText(g.phone, message);
    const recipientId = trackingEnabled ? recipientIdByGuest.get(g.id) : undefined;
    if (result.id) {
      sent += 1;
      await supabase.from('outreach_events').insert({
        wedding_id: weddingSlug,
        guest_id: g.id,
        event_type: 'template_sent',
        template_name: template.id,
        channel: 'whatsapp',
        details: { sent_via: 'concierge', whatsapp_message_id: result.id, template_title: template.title },
      });
      if (template.nextStatus) {
        await supabase
          .from('guests')
          .update({ outreach_status: template.nextStatus })
          .eq('id', g.id);
      }
      if (recipientId) {
        await supabase
          .from('concierge_broadcast_recipients')
          .update({ delivery_status: 'sent', whatsapp_message_id: result.id })
          .eq('id', recipientId);
      }
    } else {
      failed += 1;
      const reason = result.error || 'Send failed';
      errors.push({ guestId: g.id, reason });
      // Log failure to outreach_events so the Recent campaigns list surfaces
      // it with the failure reason. Same shape as success rows.
      await supabase.from('outreach_events').insert({
        wedding_id: weddingSlug,
        guest_id: g.id,
        event_type: 'template_send_failed',
        template_name: template.id,
        channel: 'whatsapp',
        details: { sent_via: 'concierge', template_title: template.title, error_reason: reason },
      });
      if (recipientId) {
        await supabase
          .from('concierge_broadcast_recipients')
          .update({ delivery_status: 'failed', error_message: reason })
          .eq('id', recipientId);
      }
    }
  }

  if (trackingEnabled && broadcastId) {
    await supabase
      .from('concierge_broadcasts')
      .update({
        status: failed && !sent ? 'failed' : 'sent',
        sent_at: new Date().toISOString(),
        sent_count: sent,
        failed_count: failed,
      })
      .eq('id', broadcastId);
  }

  return NextResponse.json({
    template_id: template.id,
    recipients: candidates.length,
    sent,
    failed,
    errors: errors.slice(0, 20),
    broadcast_id: broadcastId,
  });
}
