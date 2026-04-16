import { NextRequest, NextResponse } from 'next/server';
import { parseStatusUpdate, updateMessageStatus, verifySignature, parseIncomingMessage, logChatMessage } from '@/lib/whatsapp/webhooks';
import { createClient } from '@supabase/supabase-js';
import { whatsappClient } from '@/lib/whatsapp/client';
import { generateAIResponse } from '@/lib/whatsapp/ai-handler';

// Use service role client to bypass RLS for server-side webhook processing
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET handler for webhook verification
 * Meta sends a challenge when setting up the webhook
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  // Verify the token matches our configured verify token
  const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === 'subscribe' && token === expectedToken) {
    console.log('✅ Webhook verified successfully');
    return new NextResponse(challenge, { status: 200 });
  }

  console.error('❌ Webhook verification failed');
  return NextResponse.json(
    { error: 'Forbidden' },
    { status: 403 }
  );
}

/**
 * POST handler for receiving webhook events
 * Processes message status updates from WhatsApp
 */
export async function POST(request: NextRequest) {
  try {
    console.log('📨 WhatsApp webhook POST received');

    // Get raw body for signature verification
    const rawBody = await request.text();
    const payload = JSON.parse(rawBody);

    console.log('📦 Webhook payload:', JSON.stringify(payload).slice(0, 500));

    // Verify webhook signature (if secret is configured)
    const webhookSecret = process.env.WHATSAPP_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = request.headers.get('x-hub-signature-256');

      if (!signature) {
        console.error('❌ No signature provided in webhook');
        return NextResponse.json(
          { error: 'No signature' },
          { status: 401 }
        );
      }

      const isValid = await verifySignature(rawBody, signature, webhookSecret);
      if (!isValid) {
        console.error('❌ Invalid webhook signature — check that WHATSAPP_WEBHOOK_SECRET matches your Meta App Secret');
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
    }

    // Parse status updates from payload
    const statuses = parseStatusUpdate(payload);

    if (statuses.length > 0) {
      // Update each message status in database
      const updatePromises = statuses.map(status =>
        updateMessageStatus(
          status.id,
          status.status,
          status.timestamp,
          status.error
        )
      );
      await Promise.all(updatePromises);
      console.log(`✅ Processed ${statuses.length} status updates`);
    }

    // Parse incoming messages from payload
    const incomingMessages = parseIncomingMessage(payload);

    if (incomingMessages.length > 0) {
      for (const msg of incomingMessages) {
        console.log(`📩 Incoming message from ${msg.senderName} (${msg.from}):`, msg.type);

        // 1. Find the guest by phone number to get wedding context
        // Strip to just digits for flexible matching
        const rawDigits = msg.from.replace(/\D/g, '');
        // Try multiple phone formats to find the guest
        const phoneVariants = [
          `+${rawDigits}`,           // +13177302557
          rawDigits,                  // 13177302557
          `+${rawDigits.slice(-10)}`, // +3177302557 (last 10 digits with +)
        ];

        let guestRows: any[] = [];
        for (const phone of phoneVariants) {
          const { data, error } = await supabase
            .from('guests')
            .select('*')
            .eq('phone', phone);
          console.log(`🔍 Lookup phone="${phone}" → found=${data?.length || 0}, error=${error?.message || 'none'}`);
          if (data && data.length > 0) {
            guestRows = data;
            break;
          }
        }

        // Fallback: fuzzy match on last 10 digits using ilike
        if (guestRows.length === 0) {
          const last10 = rawDigits.slice(-10);
          const { data, error } = await supabase
            .from('guests')
            .select('*')
            .ilike('phone', `%${last10}`);
          console.log(`🔍 Fuzzy lookup last10="${last10}" → found=${data?.length || 0}, error=${error?.message || 'none'}`);
          if (data && data.length > 0) {
            guestRows = data;
          }
        }

        // Fetch weddings separately for each guest
        const guests: any[] = [];
        for (const g of guestRows) {
          const { data: weddingData } = await supabase
            .from('weddings')
            .select('*')
            .eq('id', g.wedding_id)
            .single();
          if (weddingData) {
            guests.push({ ...g, weddings: weddingData });
          }
        }

        if (guests.length === 0) {
          console.log(`⚠️ No guest found for phone ${msg.from}`);
          await whatsappClient.sendMessage(msg.from, `Hi there! I couldn't find your number in our guest list. Please make sure you RSVP with this phone number first, or contact the couple directly.`);
          continue;
        }

        // If guest appears in multiple weddings, check for an active wedding preference
        let guest: any;
        let wedding: any;

        if (guests.length > 1 && msg.type === 'text') {
          // Check if there's a stored wedding preference for this phone
          const { data: pref } = await (supabase as any)
            .from('whatsapp_chat_history')
            .select('metadata')
            .eq('guest_id', guests[0].id)
            .eq('role', 'system')
            .ilike('content', '%active_wedding%')
            .order('created_at', { ascending: false })
            .limit(1);

          const activeWeddingId = pref?.[0]?.metadata?.active_wedding_id;
          const matchedGuest = activeWeddingId
            ? guests.find((g: any) => g.wedding_id === activeWeddingId)
            : null;

          if (matchedGuest) {
            guest = matchedGuest;
            wedding = matchedGuest.weddings;
          } else {
            // Ask the user which wedding they mean
            const weddingList = guests
              .map((g: any, i: number) => `${i + 1}. ${g.weddings?.couple_name || 'Wedding'}`)
              .join('\n');
            await whatsappClient.sendMessage(
              msg.from,
              `Hi! It looks like you're a guest at multiple weddings:\n\n${weddingList}\n\nPlease reply with the number of the wedding you'd like to ask about.`
            );

            // Store the pending selection so we can resolve it on next message
            await logChatMessage({
              weddingId: guests[0].wedding_id,
              guestId: guests[0].id,
              role: 'system',
              content: 'pending_wedding_selection',
              metadata: {
                guest_ids: guests.map((g: any) => g.id),
                wedding_ids: guests.map((g: any) => g.wedding_id),
                wedding_names: guests.map((g: any) => g.weddings?.couple_name),
              }
            });
            continue;
          }
        } else if (guests.length > 1) {
          // For non-text (button clicks etc.), use the first wedding
          guest = guests[0];
          wedding = guests[0].weddings;
        } else {
          guest = guests[0];
          wedding = guests[0].weddings;
        }

        if (!wedding) {
          console.log(`⚠️ Guest found but no wedding linked for phone ${msg.from}`);
          continue;
        }

        const guestName = guest.name?.split(' ')[0] || 'Guest';

        // Check if this is a wedding selection response (user replying with a number)
        if (msg.type === 'text' && /^[1-9]$/.test((msg.text || '').trim())) {
          const { data: pendingSelection } = await (supabase as any)
            .from('whatsapp_chat_history')
            .select('metadata')
            .eq('guest_id', guest.id)
            .eq('role', 'system')
            .eq('content', 'pending_wedding_selection')
            .order('created_at', { ascending: false })
            .limit(1);

          if (pendingSelection?.[0]) {
            const meta = pendingSelection[0].metadata;
            const choice = parseInt((msg.text || '').trim()) - 1;
            if (choice >= 0 && choice < meta.wedding_ids.length) {
              const selectedWeddingId = meta.wedding_ids[choice];
              const selectedGuest = guests.find((g: any) => g.wedding_id === selectedWeddingId) || guest;

              // Store the preference
              await logChatMessage({
                weddingId: selectedWeddingId,
                guestId: selectedGuest.id,
                role: 'system',
                content: 'active_wedding',
                metadata: { active_wedding_id: selectedWeddingId }
              });

              await whatsappClient.sendMessage(
                msg.from,
                `Got it! I'll help you with ${meta.wedding_names[choice]}'s wedding. What would you like to know?`
              );
              continue;
            }
          }
        }

        // NOTE: generateAIResponse (called below for text messages) writes
        // the inbound + outbound chat history itself. We only need to log
        // here for the interactive-button branch, which doesn't go through
        // the AI handler. Text branch deduplication is handled by the
        // ai-handler internal log + the idempotency guard in logChatMessage.

        // 2. Handle based on message type
        if (msg.type === 'interactive' && msg.interactive) {
          const buttonId = msg.interactive.id;
          console.log(`🔘 Button click: ${buttonId}`);

          // Log the interactive (button) click manually since this branch
          // bypasses the ai-handler.
          await logChatMessage({
            weddingId: wedding.id,
            guestId: guest.id,
            role: 'user',
            content: `[Interactive: ${buttonId}]`,
            waMessageId: msg.id,
            metadata: { type: msg.type, button_id: buttonId, timestamp: msg.timestamp },
          });

          let responseText = '';

          // Tailored responses based on button IDs
          if (buttonId === 'GET_SCHEDULE') {
            responseText = `Hi ${guestName}! Here is the schedule for ${wedding.couple_name}'s wedding: ${process.env.NEXT_PUBLIC_APP_URL}/go/schedule/${wedding.slug}`;
          } else if (buttonId === 'GET_DETAILS') {
            responseText = `Sure ${guestName}! You can find all the wedding details here: ${process.env.NEXT_PUBLIC_APP_URL}/go/details/${wedding.slug}`;
          } else {
            responseText = `Hi ${guestName}, thanks for your interest! You can find everything you need here: ${process.env.NEXT_PUBLIC_APP_URL}/${wedding.slug}`;
          }

          await whatsappClient.sendMessage(msg.from, responseText);

          // 📝 Log response to history (button branch — not routed through ai-handler)
          await logChatMessage({
            weddingId: wedding.id,
            guestId: guest.id,
            role: 'assistant',
            content: responseText,
            metadata: { trigger_button_id: buttonId }
          });

        } else if (msg.type === 'text') {
          console.log(`💬 Text message: ${msg.text}`);

          // generateAIResponse logs both the user message and its reply to
          // whatsapp_chat_history internally — no explicit log calls here.
          const aiResponse = await generateAIResponse({
            weddingId: wedding.id,
            weddingSlug: wedding.slug,
            guestId: guest.id,
            guestName,
            userMessage: msg.text || '',
          });

          await whatsappClient.sendMessage(msg.from, aiResponse);
        }
      }
      console.log(`✅ Processed ${incomingMessages.length} incoming messages`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    
    // Always return 200 to Meta to avoid retries on our errors
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 200 }
    );
  }
}
