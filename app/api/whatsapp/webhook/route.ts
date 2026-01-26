import { NextRequest, NextResponse } from 'next/server';
import { parseStatusUpdate, updateMessageStatus, verifySignature, parseIncomingMessage, logChatMessage } from '@/lib/whatsapp/webhooks';
import { supabase } from '@/lib/supabase/client';
import { whatsappClient } from '@/lib/whatsapp/client';

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
    // Get raw body for signature verification
    const rawBody = await request.text();
    const payload = JSON.parse(rawBody);

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
        console.error('❌ Invalid webhook signature');
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
        // Phone from WhatsApp is usually like "1234567890" (no +)
        const recipientPhone = `+${msg.from}`;
        
        const { data: guestData } = await supabase
          .from('guests')
          .select('*, weddings(*)')
          .eq('phone', recipientPhone)
          .maybeSingle();

        const guest = guestData as any;

        if (!guest || !guest.weddings) {
          console.log(`⚠️ No guest or wedding found for phone ${recipientPhone}`);
          continue;
        }

        const wedding = guest.weddings;
        const guestName = guest.name?.split(' ')[0] || 'Guest';

        // 📝 Log incoming message to history
        await logChatMessage({
          weddingId: wedding.id,
          guestId: guest.id,
          role: 'user',
          content: msg.text || (msg.type === 'interactive' ? `[Interactive: ${msg.interactive?.id}]` : '[Unsupported message type]'),
          metadata: { 
            type: msg.type,
            button_id: msg.interactive?.id,
            timestamp: msg.timestamp 
          }
        });

        // 2. Handle based on message type
        if (msg.type === 'interactive' && msg.interactive) {
          const buttonId = msg.interactive.id;
          console.log(`🔘 Button click: ${buttonId}`);

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
          
          // 📝 Log response to history
          await logChatMessage({
            weddingId: wedding.id,
            guestId: guest.id,
            role: 'assistant',
            content: responseText,
            metadata: { trigger_button_id: buttonId }
          });

        } else if (msg.type === 'text') {
          console.log(`💬 Text message: ${msg.text}`);

          // Generic placeholder for AI/LLM
          const genericResponse = `Hi ${guestName}! I've received your message: "${msg.text}". Our wedding assistant is processing this and will get back to you shortly! In the meantime, you can check the wedding site here: ${process.env.NEXT_PUBLIC_APP_URL}/${wedding.slug}`;
          
          await whatsappClient.sendMessage(msg.from, genericResponse);

          // 📝 Log response to history
          await logChatMessage({
            weddingId: wedding.id,
            guestId: guest.id,
            role: 'assistant',
            content: genericResponse,
            metadata: { trigger_text: msg.text }
          });
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
