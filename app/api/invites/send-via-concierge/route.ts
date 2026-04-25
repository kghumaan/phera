import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendWhapiText } from '@/lib/whatsapp/whapi-send';
import { renderTemplate, getInviteTemplate } from '@/lib/invites/templates';

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
 *
 * The body is rendered per-guest so per_guest variables (guest_first_name,
 * rsvp_link, travel_link) interpolate correctly. Each send is recorded as an
 * outreach_events row so the Invites page Recent campaigns list picks it up
 * the same way wa.me sends do.
 */
export async function POST(req: NextRequest) {
  let body: {
    weddingSlug: string;
    templateId: string;
    sharedVars?: Record<string, string>;
    targetType: 'all' | 'tags' | 'specific';
    targetTags?: string[];
    targetGuestIds?: string[];
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
  } = body;

  if (!weddingSlug || !templateId || !targetType) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
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
    } else {
      failed += 1;
      errors.push({ guestId: g.id, reason: result.error || 'Send failed' });
    }
  }

  return NextResponse.json({
    template_id: template.id,
    recipients: candidates.length,
    sent,
    failed,
    errors: errors.slice(0, 20),
  });
}
