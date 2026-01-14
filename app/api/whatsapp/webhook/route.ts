import { NextRequest, NextResponse } from 'next/server';
import { parseStatusUpdate, updateMessageStatus, verifySignature } from '@/lib/whatsapp/webhooks';

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

    if (statuses.length === 0) {
      // Not a status update webhook, might be a message received event
      console.log('ℹ️ Webhook received but no status updates found');
      return NextResponse.json({ success: true });
    }

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
