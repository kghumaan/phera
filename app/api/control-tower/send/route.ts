import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getProvider, getRateLimitMs, sendOutreach, sendMetaTemplate, type WhatsAppProvider } from '@/lib/whatsapp/provider';
import { getAuthenticatedClient } from '@/lib/utils/auth-helpers';
import { resolveWeddingAccess } from '@/lib/utils/verify-wedding-access';


const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/**
 * POST /api/control-tower/send
 *
 * Two modes:
 * 1. Template campaign: send a WhatsApp template to a filtered set of guests
 * 2. Direct message: send a free-text message to a specific guest (within 24hr service window)
 *
 * Body:
 * {
 *   weddingId: string (slug),
 *   mode: 'template' | 'direct',
 *
 *   // Template mode:
 *   templateKey?: string,           // e.g. 'RSVP_REQUEST'
 *   templateName?: string,          // e.g. 'rsvp_request_v1' (overrides templateKey mapping)
 *   languageCode?: string,
 *   imageUrl?: string,              // publicly accessible URL for header image
 *   targetFilter?: string,
 *   targetGuestIds?: string[],
 *
 *   // Direct mode:
 *   guestId?: string,
 *   message?: string,
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { supabase: userClient, user } = await getAuthenticatedClient();
    if (!userClient || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { weddingId, mode } = body;

    if (!weddingId) {
      return NextResponse.json({ error: 'weddingId is required' }, { status: 400 });
    }

    const wedding = await resolveWeddingAccess(userClient, user.id, weddingId);
    if (!wedding) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Hand the handlers the CANONICAL slug/id off the authorized row, so nothing
    // downstream re-derives a wedding from an unverified body field.
    const scoped = { ...body, weddingId: wedding.slug, weddingUuid: wedding.id };

    if (mode === 'direct') {
      return handleDirectMessage(scoped);
    }

    return handleTemplateCampaign(scoped);
  } catch (error: any) {
    console.error('[control-tower/send] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─── Template key → Meta template name mapping ─────────────────────

const TEMPLATE_NAME_MAP: Record<string, string> = {
  SAVE_THE_DATE: 'save_the_date_v1',
  RSVP_REQUEST: 'rsvp_request_v1',
  MULTI_EVENT_INVITE: 'multi_event_invite_v1',
  LOGISTICS_INTRO: 'logistics_intro_v1',
  NUDGE: 'gentle_nudge_v1',
  TRAVEL_REQUEST: 'travel_details_request_v1',
  RSVP_CONFIRMATION: 'rsvp_confirmed_v1',
  SCHEDULE_REMINDER: 'schedule_reminder_v1',
  DAY_BEFORE_SUMMARY: 'day_before_summary_v1',
  THANK_YOU: 'thank_you_v1',
  CULTURAL_GUIDE: 'cultural_guide_v1',
  SHUTTLE_ASSIGNMENT: 'shuttle_assignment_v1',
};

// Templates that have an IMAGE header
const IMAGE_HEADER_TEMPLATES = [
  'SAVE_THE_DATE', 'RSVP_REQUEST', 'THANK_YOU',
];

// Status to set on guest after sending template
const STATUS_MAP: Record<string, string> = {
  SAVE_THE_DATE: 'save_the_date_sent',
  RSVP_REQUEST: 'rsvp_requested',
  MULTI_EVENT_INVITE: 'rsvp_requested',
  LOGISTICS_INTRO: 'rsvp_requested',
  TRAVEL_REQUEST: 'travel_collected',
};

// ─── Build WhatsApp Cloud API payload per template ──────────────────

function buildPayload(
  phone: string,
  templateKey: string,
  metaTemplateName: string,
  lang: string,
  wedding: any,
  partner1: string,
  partner2: string,
  imageUrl?: string,
) {
  const websiteUrl = `https://phera.io/${wedding.slug}`;
  const venue = [wedding.venue_name, wedding.venue_location].filter(Boolean).join(', ');
  const dateDisplay = wedding.wedding_date_display || '';
  const cleanPhone = phone.replace(/[^0-9]/g, '');

  const components: any[] = [];

  // 1. Header image (if template supports it and URL provided)
  if (imageUrl && IMAGE_HEADER_TEMPLATES.includes(templateKey)) {
    components.push({
      type: 'header',
      parameters: [{ type: 'image', image: { link: imageUrl } }],
    });
  }

  // 2. Body parameters
  // Standard mapping: {{1}}=partner1, {{2}}=partner2, {{3}}=date, {{4}}=venue, {{5}}=url
  const bodyParams: { type: string; text: string }[] = [];

  switch (templateKey) {
    case 'SAVE_THE_DATE':
      // {{1}}=partner1, {{2}}=partner2, {{3}}=date, {{4}}=venue
      bodyParams.push(
        { type: 'text', text: partner1 },
        { type: 'text', text: partner2 },
        { type: 'text', text: dateDisplay },
        { type: 'text', text: venue },
      );
      break;

    case 'RSVP_REQUEST':
      // {{1}}=partner1, {{2}}=partner2, {{3}}=date, {{4}}=venue, {{5}}=url
      bodyParams.push(
        { type: 'text', text: partner1 },
        { type: 'text', text: partner2 },
        { type: 'text', text: dateDisplay },
        { type: 'text', text: venue },
        { type: 'text', text: websiteUrl },
      );
      break;

    case 'MULTI_EVENT_INVITE':
      // {{1}}=partner1, {{2}}=partner2
      bodyParams.push(
        { type: 'text', text: partner1 },
        { type: 'text', text: partner2 },
      );
      break;

    case 'LOGISTICS_INTRO':
      // {{1}}=partner1, {{2}}=partner2, {{3}}=date
      bodyParams.push(
        { type: 'text', text: partner1 },
        { type: 'text', text: partner2 },
        { type: 'text', text: dateDisplay },
      );
      break;

    case 'NUDGE':
      // {{1}}=partner1, {{2}}=partner2
      bodyParams.push(
        { type: 'text', text: partner1 },
        { type: 'text', text: partner2 },
      );
      break;

    case 'TRAVEL_REQUEST':
      // {{1}}=partner1, {{2}}=partner2
      bodyParams.push(
        { type: 'text', text: partner1 },
        { type: 'text', text: partner2 },
      );
      break;

    case 'RSVP_CONFIRMATION':
      // {{1}}=partner1, {{2}}=partner2, {{3}}=event_list
      bodyParams.push(
        { type: 'text', text: partner1 },
        { type: 'text', text: partner2 },
        { type: 'text', text: 'all events' },
      );
      break;

    case 'SCHEDULE_REMINDER':
      // {{1}}=partner1, {{2}}=partner2, {{3}}=date
      bodyParams.push(
        { type: 'text', text: partner1 },
        { type: 'text', text: partner2 },
        { type: 'text', text: dateDisplay },
      );
      break;

    case 'DAY_BEFORE_SUMMARY':
      // {{1}}=partner1, {{2}}=partner2, {{3}}=events_summary
      bodyParams.push(
        { type: 'text', text: partner1 },
        { type: 'text', text: partner2 },
        { type: 'text', text: 'See your personalized schedule on the wedding website.' },
      );
      break;

    case 'THANK_YOU':
      // {{1}}=partner1, {{2}}=partner2
      bodyParams.push(
        { type: 'text', text: partner1 },
        { type: 'text', text: partner2 },
      );
      break;

    case 'CULTURAL_GUIDE':
      // {{1}}=partner1, {{2}}=partner2, {{3}}=destination
      bodyParams.push(
        { type: 'text', text: partner1 },
        { type: 'text', text: partner2 },
        { type: 'text', text: venue || 'the wedding destination' },
      );
      break;

    default:
      bodyParams.push(
        { type: 'text', text: partner1 },
        { type: 'text', text: partner2 },
      );
  }

  if (bodyParams.length > 0) {
    components.push({ type: 'body', parameters: bodyParams });
  }


  return {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: cleanPhone,
    type: 'template',
    template: {
      name: metaTemplateName,
      language: { code: lang },
      components,
    },
  };
}

// ─── Render plain-text message for Whapi sends ─────────────────────

function renderPlainText(
  templateKey: string,
  partner1: string,
  partner2: string,
  wedding: any,
  guestName: string,
): string {
  const venue = [wedding.venue_name, wedding.venue_location].filter(Boolean).join(', ');
  const dateDisplay = wedding.wedding_date_display || '';
  const url = `https://phera.io/${wedding.slug}`;
  const couple = `${partner1} & ${partner2}`;

  switch (templateKey) {
    case 'SAVE_THE_DATE':
      return `Save the date for ${couple}'s wedding celebration! ${dateDisplay} in ${venue}. More details coming soon.\n\nView details: ${url}`;
    case 'RSVP_REQUEST':
      return `${couple} would love for you to join their wedding celebration on ${dateDisplay} at ${venue}. We're helping them coordinate.\n\nView details & RSVP: ${url}`;
    case 'MULTI_EVENT_INVITE':
      return `Here are the events for ${couple}'s wedding celebration. View each event and RSVP!\n\n${url}`;
    case 'LOGISTICS_INTRO':
      return `${couple} have asked us to help coordinate their wedding on ${dateDisplay}. We'll make sure you have everything you need — travel details, event schedules, and more.\n\nReply to get started!`;
    case 'NUDGE':
      return `Just checking in! We're helping coordinate ${couple}'s wedding and want to make sure everything is sorted for you. Can you share a few details so we can help with your travel and schedule?`;
    case 'TRAVEL_REQUEST':
      return `As ${couple}'s wedding approaches, we'd love to help with your travel. Could you share your flight/travel details? This helps us arrange airport pickups and shuttles.\n\nShare details: ${url}`;
    case 'RSVP_CONFIRMATION':
      return `We've noted that you'll be joining ${couple}'s wedding! We'll be in touch closer to the date to help with travel details and event schedules.\n\nReply anytime if you have questions!`;
    case 'SCHEDULE_REMINDER':
      return `A reminder that ${couple}'s wedding events are on ${dateDisplay}. Check your personalized itinerary with all event details, timings, and venues.\n\n${url}`;
    case 'DAY_BEFORE_SUMMARY':
      return `Tomorrow is the big day for ${couple}! Check the wedding website for the full schedule and venue details.\n\n${url}\n\nReply if you need anything at all!`;
    case 'THANK_YOU':
      return `Thank you so much for celebrating with ${couple}! It meant the world to have you there. Wishing you all the best!`;
    case 'CULTURAL_GUIDE':
      return `We've prepared a cultural guide for ${couple}'s wedding in ${venue}. It covers dress codes, etiquette, what to expect at each ceremony, and practical tips.\n\nReply with any questions!`;
    default:
      return `${couple}'s wedding — view details: ${url}`;
  }
}

// ─── Template Campaign Handler ──────────────────────────────────────

async function handleTemplateCampaign(body: any) {
  const { weddingId, templateKey, templateName: overrideName, languageCode = 'en', imageUrl, targetFilter, targetGuestIds } = body;

  if (!templateKey) {
    return NextResponse.json({ error: 'templateKey is required' }, { status: 400 });
  }

  const provider = getProvider();
  const metaTemplateName = overrideName || TEMPLATE_NAME_MAP[templateKey] || templateKey;
  const delayMs = getRateLimitMs();

  // Get target guests
  const { data: guests, error: guestError } = await supabase
    .from('guests')
    .select('id, name, phone, outreach_status, whatsapp_opted_out')
    .eq('wedding_id', weddingId);

  if (guestError) {
    return NextResponse.json({ error: guestError.message }, { status: 500 });
  }

  let targets = guests || [];

  // Apply filter
  if (targetGuestIds && targetGuestIds.length > 0) {
    const idSet = new Set(targetGuestIds);
    targets = targets.filter((g: any) => idSet.has(g.id));
  } else if (targetFilter && targetFilter !== 'all') {
    targets = targets.filter((g: any) => (g.outreach_status || 'not_contacted') === targetFilter);
  }

  // Filter out opted-out and phoneless guests
  targets = targets.filter((g: any) => g.phone && !g.whatsapp_opted_out);

  if (targets.length === 0) {
    return NextResponse.json({ error: 'No eligible guests to send to', sent: 0 }, { status: 400 });
  }

  // Get wedding details
  const { data: wedding } = await supabase
    .from('weddings')
    .select('id, slug, couple_name, partner1_name, partner2_name, wedding_date_display, venue_name, venue_location')
    .eq('slug', weddingId)
    .single();

  if (!wedding) {
    return NextResponse.json({ error: `Wedding "${weddingId}" not found` }, { status: 404 });
  }

  // Derive partner names
  const w = wedding as any;
  let partner1 = w.partner1_name || '';
  let partner2 = w.partner2_name || '';
  if (!partner1 && w.couple_name) {
    const parts = w.couple_name.split(/\s*[&+]\s*/);
    partner1 = parts[0]?.trim() || '';
    partner2 = parts[1]?.trim() || '';
  }

  const results: any[] = [];
  const errors: any[] = [];

  for (let i = 0; i < targets.length; i++) {
    const guest = targets[i];
    let sendResult: { success: boolean; messageId?: string; error?: string };

    if (provider === 'whapi') {
      // Whapi: send as plain text (+ image if provided)
      const text = renderPlainText(templateKey, partner1, partner2, wedding, guest.name);
      sendResult = await sendOutreach(guest.phone, text, imageUrl);
    } else {
      // Meta: send as template
      const payload = buildPayload(guest.phone, templateKey, metaTemplateName, languageCode, wedding, partner1, partner2, imageUrl);
      sendResult = await sendMetaTemplate(payload);
    }

    if (sendResult.success) {
      await supabase.from('outreach_events').insert({
        wedding_id: weddingId,
        guest_id: guest.id,
        event_type: 'template_sent',
        template_name: provider === 'whapi' ? templateKey : metaTemplateName,
        channel: 'whatsapp',
        details: {
          guest_name: guest.name,
          template: templateKey,
          message_id: sendResult.messageId || null,
          provider,
          image_url: imageUrl || null,
        },
      });

      const newStatus = STATUS_MAP[templateKey];
      if (newStatus) {
        await supabase
          .from('guests')
          .update({
            outreach_status: newStatus,
            outreach_last_contacted_at: new Date().toISOString(),
          } as any)
          .eq('id', guest.id);
      }

      results.push({ guestId: guest.id, name: guest.name, messageId: sendResult.messageId, status: 'accepted' });
    } else {
      errors.push({ guestId: guest.id, name: guest.name, error: sendResult.error });
    }

    // Rate limit
    if (i < targets.length - 1 && delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  const staggerNote = provider === 'whapi' && targets.length > 1
    ? ` Messages are being sent gradually (~1 every 30s).`
    : '';

  return NextResponse.json({
    sent: results.length,
    failed: errors.length,
    total: targets.length,
    provider,
    results,
    errors: errors.length > 0 ? errors : undefined,
    message: errors.length > 0
      ? `Sent to ${results.length}/${targets.length} guests. ${errors.length} failed.${staggerNote}`
      : `Sent to ${results.length} guests via ${provider}.${staggerNote}`,
  });
}

// ─── Direct Message Handler ─────────────────────────────────────────

async function handleDirectMessage(body: any) {
  const { weddingId, weddingUuid, guestId, message } = body;

  if (!guestId || !message) {
    return NextResponse.json({ error: 'guestId and message are required' }, { status: 400 });
  }

  // Scoped to the authorized wedding: a bare id lookup would let any signed-in
  // owner message a guest belonging to someone else's wedding.
  const { data: guest, error: guestError } = await supabase
    .from('guests')
    .select('id, name, phone, whatsapp_opted_out')
    .eq('id', guestId)
    .eq('wedding_id', weddingId)
    .single();

  if (guestError || !guest) {
    return NextResponse.json({ error: 'Guest not found' }, { status: 404 });
  }

  if (!guest.phone) {
    return NextResponse.json({ error: 'Guest has no phone number' }, { status: 400 });
  }

  if (guest.whatsapp_opted_out) {
    return NextResponse.json({ error: 'Guest has opted out of WhatsApp messages' }, { status: 400 });
  }

  // Send the text message via active provider
  const sendResult = await sendOutreach(guest.phone, message);

  if (!sendResult.success) {
    return NextResponse.json({ error: `WhatsApp send failed: ${sendResult.error}`, sent: 0 }, { status: 502 });
  }

  const messageId = sendResult.messageId;

  // Log to chat history
  await supabase.from('whatsapp_chat_history').insert({
    wedding_id: weddingUuid,
    guest_id: guestId,
    role: 'admin',
    content: message,
  });

  // Log outreach event
  await supabase.from('outreach_events').insert({
    wedding_id: weddingId,
    guest_id: guestId,
    event_type: 'template_sent',
    channel: 'whatsapp',
    details: {
      guest_name: guest.name,
      type: 'direct_message',
      message_id: messageId,
      content: message,
      sent_by: 'admin',
    },
  });

  return NextResponse.json({
    sent: 1,
    messageId,
    message: `Message sent to ${guest.name}.`,
  });
}
