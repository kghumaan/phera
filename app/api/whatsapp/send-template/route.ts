import { NextRequest, NextResponse } from 'next/server';
import { whatsappClient } from '@/lib/whatsapp/client';
import { formatParametersForAPI, validateTemplateParams } from '@/lib/whatsapp/templates';
import { checkOptInStatus, getOptInPhone } from '@/lib/whatsapp/opt-ins';
import { getAuthenticatedClient } from '@/lib/utils/auth-helpers';
import { verifyWeddingAccess } from '@/lib/utils/verify-wedding-access';

export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient();
    if (!supabase || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { guestId, weddingId, templateName, parameters } = await request.json();

    // Validate required fields
    if (!guestId || !weddingId || !templateName || !parameters) {
      return NextResponse.json(
        { error: 'Missing required fields: guestId, weddingId, templateName, parameters' },
        { status: 400 }
      );
    }

    const hasAccess = await verifyWeddingAccess(supabase, user.id, weddingId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if guest is opted in
    const isOptedIn = await checkOptInStatus(guestId, weddingId);
    if (!isOptedIn) {
      return NextResponse.json(
        { error: 'Guest is not opted in to WhatsApp messaging' },
        { status: 403 }
      );
    }

    // Get guest's phone number
    const phoneNumber = await getOptInPhone(guestId, weddingId);
    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Guest phone number not found' },
        { status: 404 }
      );
    }

    // Fetch template from database
    const { data: template, error: templateError } = await supabase
      .from('whatsapp_templates')
      .select('*')
      .eq('name', templateName)
      .single();

    if (templateError || !template) {
      return NextResponse.json(
        { error: `Template "${templateName}" not found` },
        { status: 404 }
      );
    }

    // Validate template parameters
    try {
      validateTemplateParams(templateName, parameters);
    } catch (validationError: any) {
      return NextResponse.json(
        { error: validationError.message },
        { status: 400 }
      );
    }

    // Format parameters for WhatsApp API
    const formattedParams = formatParametersForAPI(parameters, templateName);

    // Send template via WhatsApp API
    const result = await whatsappClient.sendTemplate(
      phoneNumber,
      templateName,
      template.language || 'en',
      formattedParams
    );

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to send WhatsApp message. Credentials may not be configured.' },
        { status: 500 }
      );
    }

    // Log message to database
    const { error: logError } = await supabase
      .from('whatsapp_messages')
      .insert({
        guest_id: guestId,
        wedding_id: weddingId,
        phone_number: phoneNumber,
        template_name: templateName,
        message_type: 'template',
        wa_message_id: result.messages[0].id,
        status: 'sent',
        sent_at: new Date().toISOString(),
        parameters: parameters,
      });

    if (logError) {
      console.error('Error logging WhatsApp message:', logError);
      // Don't fail the request, message was sent successfully
    }

    return NextResponse.json({
      success: true,
      messageId: result.messages[0].id,
      waId: result.contacts[0].wa_id,
    });
  } catch (error) {
    console.error('Error in send-template API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
