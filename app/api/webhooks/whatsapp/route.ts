import { NextRequest, NextResponse } from 'next/server';
import { webhookHandler } from '@/lib/whatsapp/webhook-handler';

/**
 * GET — Webhook verification (Meta sends a challenge token during setup)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === 'subscribe' && token === verifyToken) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

/**
 * POST — Incoming messages and status updates
 */
export async function POST(request: NextRequest) {
  // Verify HMAC signature
  const signature = request.headers.get('x-hub-signature-256') || '';
  const rawBody = await request.text();

  if (!webhookHandler.verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // Return 200 immediately — Meta requires fast response
  const payload = JSON.parse(rawBody);

  // Process asynchronously
  webhookHandler.processWebhook(payload).catch((err) => {
    console.error('Webhook processing error:', err);
  });

  return NextResponse.json({ status: 'ok' }, { status: 200 });
}
