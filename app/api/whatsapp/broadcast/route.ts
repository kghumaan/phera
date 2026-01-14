import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { WhatsAppClient } from '@/lib/whatsapp/client';
import { formatParametersForAPI } from '@/lib/whatsapp/templates';

export async function POST(request: NextRequest) {
  try {
    const { weddingId, templateName, parameters, filters } = await request.json();

    if (!weddingId || !templateName) {
      return NextResponse.json(
        { error: 'Missing required fields: weddingId, templateName' },
        { status: 400 }
      );
    }

    // Get template from database
    const { data: template, error: templateError } = await supabase
      .from('whatsapp_templates')
      .select('*')
      .eq('name', templateName)
      .single();

    if (templateError || !template) {
      return NextResponse.json(
        { error: 'Template not found or not approved' },
        { status: 404 }
      );
    }

    // Query guests based on filters
    let query = supabase
      .from('whatsapp_opt_ins')
      .select(`
        guest_id,
        phone_number,
        guests (
          id,
          name,
          email,
          wedding_side,
          rsvps (
            attending
          )
        )
      `)
      .eq('wedding_id', weddingId)
      .eq('opted_in', true);

    // Apply filters
    if (filters) {
      if (filters.rsvpStatus) {
        // Note: This requires joining through guests -> rsvps
        // We'll filter in the application logic below
      }
      if (filters.weddingSide) {
        // Similarly, we'll filter this in application logic
      }
    }

    const { data: optIns, error: optInsError } = await query;

    if (optInsError) {
      console.error('Error querying opted-in guests:', optInsError);
      return NextResponse.json(
        { error: 'Failed to query guests' },
        { status: 500 }
      );
    }

    // Apply filters in application logic
    let filteredOptIns = optIns || [];
    if (filters) {
      filteredOptIns = filteredOptIns.filter((optIn: any) => {
        const guest = optIn.guests;
        if (!guest) return false;

        // Filter by RSVP status
        if (filters.rsvpStatus) {
          const rsvp = guest.rsvps?.[0];
          if (!rsvp || rsvp.attending !== filters.rsvpStatus) {
            return false;
          }
        }

        // Filter by wedding side
        if (filters.weddingSide) {
          if (guest.wedding_side !== filters.weddingSide) {
            return false;
          }
        }

        return true;
      });
    }

    const totalRecipients = filteredOptIns.length;

    if (totalRecipients === 0) {
      return NextResponse.json(
        { error: 'No eligible recipients found with the specified filters' },
        { status: 400 }
      );
    }

    // Create broadcast record
    const { data: broadcast, error: broadcastError } = await supabase
      .from('whatsapp_broadcasts')
      .insert({
        wedding_id: weddingId,
        name: `Broadcast - ${templateName} - ${new Date().toLocaleDateString()}`,
        template_name: templateName,
        filters: filters || {},
        total_recipients: totalRecipients,
        status: 'sending',
      })
      .select()
      .single();

    if (broadcastError) {
      console.error('Error creating broadcast:', broadcastError);
      return NextResponse.json(
        { error: 'Failed to create broadcast record' },
        { status: 500 }
      );
    }

    // Initialize WhatsApp client
    const whatsappClient = new WhatsAppClient();
    const formattedParams = formatParametersForAPI(parameters);

    // Send messages to all recipients
    let successfulSends = 0;
    let failedSends = 0;
    const results: any[] = [];

    for (const optIn of filteredOptIns) {
      try {
        const result = await whatsappClient.sendTemplate(
          optIn.phone_number,
          templateName,
          template.language || 'en',
          formattedParams
        );

        if (result && result.messages?.[0]?.id) {
          successfulSends++;

          // Log message to database
          await supabase.from('whatsapp_messages').insert({
            guest_id: optIn.guest_id,
            wedding_id: weddingId,
            phone_number: optIn.phone_number,
            template_name: templateName,
            message_type: 'template',
            wa_message_id: result.messages[0].id,
            status: 'sent',
            sent_at: new Date().toISOString(),
            parameters: parameters,
          });

          results.push({
            guest_id: optIn.guest_id,
            phone: optIn.phone_number,
            status: 'sent',
            messageId: result.messages[0].id,
          });
        } else {
          throw new Error('No message ID returned');
        }
      } catch (error) {
        console.error(`Failed to send to ${optIn.phone_number}:`, error);
        failedSends++;
        results.push({
          guest_id: optIn.guest_id,
          phone: optIn.phone_number,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Update broadcast record with results
    await supabase
      .from('whatsapp_broadcasts')
      .update({
        successful_sends: successfulSends,
        failed_sends: failedSends,
        sent_at: new Date().toISOString(),
        status: failedSends === 0 ? 'completed' : 'completed',
      })
      .eq('id', broadcast.id);

    return NextResponse.json({
      success: true,
      broadcastId: broadcast.id,
      totalRecipients,
      successfulSends,
      failedSends,
      results,
    });
  } catch (error) {
    console.error('Error in broadcast API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
