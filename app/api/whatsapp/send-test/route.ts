import { NextRequest, NextResponse } from 'next/server';
import { whatsappClient } from '@/lib/whatsapp/client';

/**
 * API Route for testing WhatsApp messaging.
 * This is a simple endpoint to verify the Meta API integration is working.
 */
export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, message } = await request.json();

    // Basic validation
    if (!phoneNumber || !message) {
      return NextResponse.json(
        { error: 'Phone number and message are required' },
        { status: 400 }
      );
    }

    console.log(`📱 Attempting to send test WhatsApp message to: ${phoneNumber}`);

    // Use the existing singleton client
    const response = await whatsappClient.sendMessage(phoneNumber, message);

    if (response && response.messages && response.messages.length > 0) {
      const messageId = response.messages[0].id;
      console.log(`✅ Test message sent successfully. ID: ${messageId}`);
      // After getting the messageId, add this:
      console.log('🔍 Full response:', JSON.stringify(response, null, 2));

      // Try to get message status
      const statusResponse = await whatsappClient.getMessageStatus(messageId);
      console.log('📊 Message status:', statusResponse);
      
      return NextResponse.json({
        success: true,
        messageId,
        data: response,
      });
    }

    console.error('❌ Failed to send test message: No message ID returned in response');
    return NextResponse.json(
      { error: 'Failed to send message: No message ID returned' },
      { status: 500 }
    );
  } catch (error) {
    console.error('💥 Error in WhatsApp test API route:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
