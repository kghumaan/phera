import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { whapiClient } from '@/lib/vendors/whapi-client';
import { extractVendorInsights, saveInsights, generateCoordinatorReply } from '@/lib/vendors/ai-extractor';
import { generateAIResponse } from '@/lib/whatsapp/ai-handler';
import { sendMessage as whapiSend } from '@/lib/whatsapp/whapi-client';
import { recordBroadcastReplyForGuest } from '@/lib/whatsapp/broadcast-replies';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST handler — receives incoming group messages from Whapi.Cloud
 * Always returns 200 to avoid retries.
 */
export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret if configured
    const webhookSecret = process.env.VENDOR_WEBHOOK_SECRET;
    if (webhookSecret) {
      const tokenParam = request.nextUrl.searchParams.get('token');
      const headerSecret = request.headers.get('x-webhook-secret');
      if (tokenParam !== webhookSecret && headerSecret !== webhookSecret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const payload = await request.json();
    console.log('📨 Vendor webhook received:', JSON.stringify(payload).slice(0, 500));

    // Whapi.Cloud sends an array of messages
    const messages: any[] = Array.isArray(payload.messages)
      ? payload.messages
      : payload.message
        ? [payload.message]
        : [];

    if (messages.length === 0) {
      return NextResponse.json({ success: true });
    }

    for (const msg of messages) {
      // Process both group (@g.us) and direct (@s.whatsapp.net) messages
      const chatId = msg.chat_id;
      if (!chatId) continue;
      const isGroup = chatId.endsWith('@g.us');
      const isDirect = chatId.endsWith('@s.whatsapp.net');
      if (!isGroup && !isDirect) continue;

      const senderPhone = msg.from?.replace('@s.whatsapp.net', '') || '';
      const senderName = msg.from_name || senderPhone;
      const content = msg.text?.body || msg.body || '';
      const messageId = msg.id;
      const timestamp = msg.timestamp
        ? new Date(msg.timestamp * 1000).toISOString()
        : new Date().toISOString();

      if (!content) continue;

      // 1. Find or create conversation by group ID or chat ID
      let { data: conversation } = isGroup
        ? await supabase
            .from('vendor_conversations')
            .select('*')
            .eq('whatsapp_group_id', chatId)
            .single()
        : await supabase
            .from('vendor_conversations')
            .select('*')
            .eq('whatsapp_chat_id', chatId)
            .single();

      let weddingId: string | null = null;

      if (conversation) {
        weddingId = conversation.wedding_id;
      } else {
        // Try to match by participant phones → vendors table
        const { data: vendorMatch } = await supabase
          .from('vendors')
          .select('wedding_id, id')
          .eq('phone', senderPhone)
          .limit(1)
          .single();

        if (vendorMatch) {
          weddingId = vendorMatch.wedding_id;
        } else {
          // Also try with whatsapp_group_id on vendors
          const { data: groupMatch } = await supabase
            .from('vendors')
            .select('wedding_id, id')
            .eq('whatsapp_group_id', chatId)
            .limit(1)
            .single();

          if (groupMatch) {
            weddingId = groupMatch.wedding_id;
          }
        }

        if (!weddingId) {
          // No vendor match. If this is a direct chat, try Concierge:
          // look up sender as a guest and run the AI response flow.
          if (isDirect) {
            const handled = await tryConciergeFlow(senderPhone, content, msg);
            if (handled) continue;
          }
          console.log(`⚠️ No wedding or guest match for chat ${chatId}, skipping`);
          continue;
        }

        // Create new conversation
        const insertData: any = {
          wedding_id: weddingId,
          source: isDirect ? 'whapi_direct' : 'whapi_webhook',
          chat_type: isDirect ? 'direct' : 'group',
          title: msg.chat_name || `Vendor Chat`,
          status: 'ready',
          first_message_at: timestamp,
          last_message_at: timestamp,
        };
        if (isGroup) insertData.whatsapp_group_id = chatId;
        if (isDirect) insertData.whatsapp_chat_id = chatId;

        const { data: newConvo, error: convoError } = await supabase
          .from('vendor_conversations')
          .insert(insertData)
          .select()
          .single();

        if (convoError) {
          console.error('Failed to create conversation:', convoError);
          continue;
        }
        conversation = newConvo;
      }

      // 2. Determine sender type
      let senderType = 'unknown';
      const { data: vendorRecord } = await supabase
        .from('vendors')
        .select('id')
        .eq('wedding_id', weddingId)
        .eq('phone', senderPhone)
        .limit(1)
        .single();

      if (vendorRecord) {
        senderType = 'vendor';
      }

      // 3. Store message
      const { error: msgError } = await supabase.from('vendor_messages').insert({
        conversation_id: conversation.id,
        wedding_id: weddingId,
        sender_name: senderName,
        sender_phone: senderPhone,
        sender_type: senderType,
        content,
        message_timestamp: timestamp,
        has_media: !!msg.media,
        media_type: msg.media?.type || null,
        media_url: msg.media?.link || null,
        whapi_message_id: messageId,
      });

      if (msgError) {
        console.error('Failed to store vendor message:', msgError);
      }

      // 4. Update conversation counters
      await supabase
        .from('vendor_conversations')
        .update({
          message_count: (conversation.message_count || 0) + 1,
          last_message_at: timestamp,
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversation.id);

      // 5. Check if coordinator is tagged — reply if so
      const lowerContent = content.toLowerCase();
      if (
        lowerContent.includes('@phera') ||
        lowerContent.includes('hey phera') ||
        lowerContent.includes('hi phera')
      ) {
        try {
          const reply = await generateCoordinatorReply({
            weddingId: weddingId!,
            conversationId: conversation.id,
            senderName,
            message: content,
          });

          await whapiClient.sendMessage(chatId, reply);

          // Store coordinator reply
          await supabase.from('vendor_messages').insert({
            conversation_id: conversation.id,
            wedding_id: weddingId,
            sender_name: 'Phera Coordinator',
            sender_type: 'coordinator',
            content: reply,
            message_timestamp: new Date().toISOString(),
          });
        } catch (replyError) {
          console.error('Failed to send coordinator reply:', replyError);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Vendor webhook error:', error);
    // Always return 200 to avoid retries
    return NextResponse.json({ success: true }, { status: 200 });
  }
}

/**
 * Concierge fallback: if an incoming direct message didn't match a vendor,
 * look the sender up in the guest list and run the AI response flow so the
 * same Whapi number powers both Coordinator (vendor groups) and Concierge
 * (guest DMs). Returns true if the flow handled the message.
 */
async function tryConciergeFlow(senderPhone: string, content: string, msg: any): Promise<boolean> {
  try {
    const rawDigits = senderPhone.replace(/\D/g, '');
    const phoneVariants = [`+${rawDigits}`, rawDigits, `+${rawDigits.slice(-10)}`];

    let guest: any = null;
    for (const phone of phoneVariants) {
      const { data } = await supabase.from('guests').select('*').eq('phone', phone);
      if (data && data.length > 0) { guest = data[0]; break; }
    }
    if (!guest) {
      const last10 = rawDigits.slice(-10);
      const { data } = await supabase.from('guests').select('*').ilike('phone', `%${last10}`);
      if (data && data.length > 0) guest = data[0];
    }
    if (!guest) return false;

    // Resolve wedding (guests.wedding_id is a slug)
    let wedding: any = null;
    const { data: wBySlug } = await supabase
      .from('weddings').select('*').eq('slug', guest.wedding_id).single();
    if (wBySlug) wedding = wBySlug;
    if (!wedding) {
      const { data: wById } = await supabase
        .from('weddings').select('*').eq('id', guest.wedding_id).single();
      if (wById) wedding = wById;
    }
    if (!wedding) return false;

    const guestName = guest.name?.split(' ')[0] || 'Guest';
    console.log(`[concierge] Message from ${guest.name} (${senderPhone}): ${content.slice(0, 80)}`);

    // If the guest has a pending broadcast awaiting reply, attribute this
    // message to that broadcast (reply text + optional structured data).
    // Non-blocking: AI flow still runs below.
    try {
      await recordBroadcastReplyForGuest(guest.id, content);
    } catch (err) {
      console.error('[concierge] broadcast reply record error:', err);
    }

    // Note: generateAIResponse logs both the inbound user message and the
    // outbound assistant reply to whatsapp_chat_history internally. We skip
    // webhook-side logging to avoid duplicate rows in the conversation view.
    const rawAi = await generateAIResponse({
      weddingId: wedding.id,
      weddingSlug: wedding.slug,
      guestId: guest.id,
      guestName,
      userMessage: content,
    });

    const aiResponse = sanitizeAIResponse(rawAi, guestName);
    await whapiSend(senderPhone, aiResponse);

    console.log(`[concierge] Replied to ${guestName}: ${aiResponse.slice(0, 80)}`);
    return true;
  } catch (err) {
    console.error('[concierge] Flow error:', err);
    return false;
  }
}

/**
 * Guard against empty / broken AI responses. When the model loses structure
 * (e.g. emits orphan markdown bullets with no content, or comes back empty),
 * we swap in a graceful fallback so the guest never receives garbage. The
 * raw response is logged so we can diagnose prompt/data issues.
 */
function sanitizeAIResponse(raw: string | null | undefined, guestName: string): string {
  const trimmed = (raw || '').trim();
  const plain = trimmed.replace(/[\s*_\-•·—]+/g, '');
  const looksBroken = !trimmed || trimmed.length < 15 || plain.length < 5;

  // Catch raw function-call syntax leaking into chat text. This happens when
  // the fallback model (e.g. Groq) doesn't execute tools and instead emits
  // <function/name{...}></function> tokens as plain text.
  const hasFunctionTag = /<function\/?[\w_]+/i.test(trimmed) || /<\/function>/i.test(trimmed);

  if (looksBroken || hasFunctionTag) {
    console.warn(`[concierge] Rejected AI response (broken=${looksBroken}, fn_tag=${hasFunctionTag}). raw="${trimmed.slice(0, 200)}"`);
    return `Got it, ${guestName} — noted. I've saved that on my end. Anything else?`;
  }
  return trimmed;
}
