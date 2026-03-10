import { NextRequest, NextResponse } from 'next/server';
import { createOptIn, handleOptOut } from '@/lib/whatsapp/opt-ins';

export async function POST(request: NextRequest) {
  try {
    const { action, guestId, weddingId, phoneNumber, method } = await request.json();

    // Validate required fields
    if (!action || !guestId || !weddingId) {
      return NextResponse.json(
        { error: 'Missing required fields: action, guestId, weddingId' },
        { status: 400 }
      );
    }

    // Handle opt-in (guests call this unauthenticated during RSVP)
    if (action === 'opt-in') {
      if (!phoneNumber) {
        return NextResponse.json(
          { error: 'Phone number is required for opt-in' },
          { status: 400 }
        );
      }

      const result = await createOptIn(
        guestId,
        weddingId,
        phoneNumber,
        method || 'api'
      );

      if (!result) {
        return NextResponse.json(
          { error: 'Failed to create opt-in record' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Successfully opted in to WhatsApp messaging',
        optInId: result.id,
      });
    }

    // Handle opt-out
    if (action === 'opt-out') {
      const success = await handleOptOut(guestId, weddingId);

      if (!success) {
        return NextResponse.json(
          { error: 'Failed to process opt-out' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Successfully opted out of WhatsApp messaging',
      });
    }

    // Invalid action
    return NextResponse.json(
      { error: 'Invalid action. Must be "opt-in" or "opt-out"' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in opt-in API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
