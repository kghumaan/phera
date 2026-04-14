import { NextRequest, NextResponse } from 'next/server';
import { normalizeWhapiPayload, verifyWhapiWebhookAuth } from '@/lib/whatsapp/whapi-webhook';
import { createClient } from '@supabase/supabase-js';
import { whatsappClient } from '@/lib/whatsapp/client';
import { generateAIResponse } from '@/lib/whatsapp/ai-handler';
import { logChatMessage } from '@/lib/whatsapp/webhooks';
import { sendMessage as whapiSend } from '@/lib/whatsapp/whapi-client';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/**
 * GET — Whapi webhook verification.
 * Whapi may send a verification request on setup.
 */
export async function GET(request: NextRequest) {
  // Whapi doesn't use Meta's challenge flow; just return 200
  return NextResponse.json({ status: 'ok' }, { status: 200 });
}

/**
 * POST — Incoming messages from Whapi.Cloud webhook.
 *
 * Receives Whapi-format payload, normalizes it, then routes to
 * the AI concierge using the same logic as the Meta webhook.
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const payload = JSON.parse(rawBody);

    // Optional auth check (Whapi token verification)
    const authHeader = request.headers.get('authorization');
    if (process.env.WHAPI_WEBHOOK_SECRET) {
      // If a separate webhook secret is configured, verify it
      const token = request.headers.get('x-webhook-token') || authHeader;
      if (token !== process.env.WHAPI_WEBHOOK_SECRET && token !== `Bearer ${process.env.WHAPI_WEBHOOK_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Normalize Whapi payload to Meta-compatible format
    const normalized = normalizeWhapiPayload(payload);

    if (!normalized.entry?.length || !normalized.entry[0]?.changes?.[0]?.value?.messages?.length) {
      // No incoming messages (could be a status update or outgoing echo)
      return NextResponse.json({ status: 'ok' }, { status: 200 });
    }

    // Process each incoming message
    const messages = normalized.entry[0].changes[0].value.messages;
    const contacts = normalized.entry[0].changes[0].value.contacts || [];

    for (const msg of messages) {
      const senderPhone = msg.from;
      const senderName = contacts.find((c: any) => c.wa_id === senderPhone)?.profile?.name || 'Guest';
      const messageText = msg.text?.body || msg.interactive?.button_reply?.title || '';

      if (!messageText) continue;

      console.log(`[whapi-webhook] Message from ${senderName} (${senderPhone}): ${messageText.slice(0, 100)}`);

      // Look up guest by phone (try multiple formats)
      const rawDigits = senderPhone.replace(/\D/g, '');
      const phoneVariants = [
        `+${rawDigits}`,
        rawDigits,
        `+${rawDigits.slice(-10)}`,
      ];

      let guest: any = null;
      let wedding: any = null;

      for (const phone of phoneVariants) {
        const { data } = await supabase
          .from('guests')
          .select('*')
          .eq('phone', phone);

        if (data && data.length > 0) {
          guest = data[0];
          // Look up wedding
          const { data: weddingData } = await supabase
            .from('weddings')
            .select('*')
            .eq('id', guest.wedding_id)
            .single();

          if (!weddingData) {
            // Try by slug
            const { data: wBySlug } = await supabase
              .from('weddings')
              .select('*')
              .eq('slug', guest.wedding_id)
              .single();
            if (wBySlug) wedding = wBySlug;
          } else {
            wedding = weddingData;
          }
          break;
        }
      }

      // Fuzzy fallback: last 10 digits
      if (!guest) {
        const last10 = rawDigits.slice(-10);
        const { data } = await supabase
          .from('guests')
          .select('*')
          .ilike('phone', `%${last10}`);

        if (data && data.length > 0) {
          guest = data[0];
          const { data: wData } = await supabase
            .from('weddings')
            .select('*')
            .eq('id', guest.wedding_id)
            .single();
          if (wData) wedding = wData;
        }
      }

      if (!guest || !wedding) {
        console.log(`[whapi-webhook] No guest found for phone ${senderPhone}`);
        await whapiSend(senderPhone, `Hi! I couldn't find your number in our guest list. Please make sure the couple has added your phone number, or contact them directly.`);
        continue;
      }

      const guestName = guest.name?.split(' ')[0] || 'Guest';

      // Log incoming message to chat history
      await logChatMessage({
        weddingId: wedding.id,
        guestId: guest.id,
        role: 'user',
        content: messageText,
        waMessageId: msg.id,
        metadata: { type: msg.type, provider: 'whapi', timestamp: msg.timestamp },
      });

      // Generate AI response
      const aiResponse = await generateAIResponse({
        weddingId: wedding.id,
        weddingSlug: wedding.slug,
        guestId: guest.id,
        guestName,
        userMessage: messageText,
      });

      // Send response via Whapi (same number the message came from)
      const sendResult = await whapiSend(senderPhone, aiResponse);

      // Log outgoing response
      await logChatMessage({
        weddingId: wedding.id,
        guestId: guest.id,
        role: 'assistant',
        content: aiResponse,
        waMessageId: sendResult.messageId,
        metadata: { provider: 'whapi' },
      });

      console.log(`[whapi-webhook] Replied to ${guestName}: ${aiResponse.slice(0, 80)}...`);
    }

    return NextResponse.json({ status: 'ok' }, { status: 200 });
  } catch (error) {
    console.error('[whapi-webhook] Error:', error);
    // Always return 200 to avoid Whapi retries
    return NextResponse.json({ status: 'error', error: error instanceof Error ? error.message : 'Unknown' }, { status: 200 });
  }
}
