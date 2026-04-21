import { NextRequest, NextResponse } from 'next/server';
import { sendWhapiText } from '@/lib/whatsapp/whapi-send';

/**
 * Test WhatsApp send endpoint. Routes through Whapi (our SIM-connected number).
 */
export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, message } = await request.json();

    if (!phoneNumber || !message) {
      return NextResponse.json(
        { error: 'Phone number and message are required' },
        { status: 400 },
      );
    }

    console.log(`📱 Sending test WhatsApp message via Whapi to: ${phoneNumber}`);

    const result = await sendWhapiText(phoneNumber, message);

    if (result.id) {
      console.log(`✅ Test message sent. Whapi id: ${result.id}`);
      return NextResponse.json({ success: true, messageId: result.id });
    }

    console.error(`❌ Test message failed: ${result.error}`);
    return NextResponse.json(
      { error: result.error || 'Send failed' },
      { status: 500 },
    );
  } catch (error) {
    console.error('💥 Error in WhatsApp test API route:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
