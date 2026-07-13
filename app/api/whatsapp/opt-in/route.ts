import { NextRequest, NextResponse } from 'next/server';
import { createOptIn, handleOptOut } from '@/lib/whatsapp/opt-ins';
import { whatsappClient } from '@/lib/whatsapp/client';
import { formatParametersForAPI } from '@/lib/whatsapp/templates';
import { getOpsSupabaseAdmin } from '@/lib/ops/supabase-admin';

/**
 * Best-effort RSVP confirmation template, sent server-side right after a
 * guest opts in from the RSVP form. Guests are unauthenticated, so this
 * can't go through /api/whatsapp/send-template (admin-gated). Couple name
 * and date come from the wedding row — never hardcoded. Failures are
 * swallowed: the opt-in itself must never fail because of this.
 */
async function sendRsvpConfirmation(
  weddingSlug: string,
  phoneNumber: string,
  guestName: string
): Promise<boolean> {
  try {
    const admin = getOpsSupabaseAdmin();
    const { data: wedding } = await admin
      .from('weddings')
      .select('couple_name, wedding_date_display')
      .eq('slug', weddingSlug)
      .single();
    if (!wedding?.couple_name) return false;

    const { data: template } = await admin
      .from('whatsapp_templates')
      .select('language')
      .eq('name', 'rsvp_confirmation')
      .single();

    const params = formatParametersForAPI(
      {
        guest_name: guestName,
        couple_names: wedding.couple_name,
        wedding_date: wedding.wedding_date_display || 'your wedding date',
      },
      'rsvp_confirmation'
    );
    const result = await whatsappClient.sendTemplate(
      phoneNumber,
      'rsvp_confirmation',
      template?.language || 'en',
      params
    );
    return result !== null;
  } catch (error) {
    console.error('RSVP confirmation send failed (non-fatal):', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, guestId, weddingId, phoneNumber, method, guestName } = await request.json();

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

      let confirmationSent = false;
      if (method === 'rsvp_form') {
        confirmationSent = await sendRsvpConfirmation(
          weddingId,
          phoneNumber,
          typeof guestName === 'string' && guestName.trim() ? guestName.trim() : 'Guest'
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Successfully opted in to WhatsApp messaging',
        optInId: result.id,
        confirmationSent,
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
