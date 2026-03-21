/**
 * WhatsApp Flows — Native RSVP inside WhatsApp.
 * Multi-screen forms for collecting RSVP data without leaving WhatsApp.
 */

import { supabase } from '@/lib/supabase/client';
import { outreachService } from '@/lib/supabase/outreach-service';

export interface WeddingEvent {
  id: string;
  name: string;
  date: string;
  time: string;
  venue: string;
  dress_code?: string;
}

export interface FlowScreen {
  id: string;
  title: string;
  data?: Record<string, any>;
  layout: {
    type: string;
    children: any[];
  };
}

export interface FlowDefinition {
  version: string;
  screens: FlowScreen[];
}

export interface FlowResponseData {
  events_attending: string[];
  guest_count: number;
  additional_guest_names?: string;
  dietary_preferences: string[];
  allergies?: string;
}

/**
 * Build a WhatsApp Flows RSVP definition for a wedding.
 */
export function buildFlowDefinition(weddingData: {
  couple_names: string;
  events: WeddingEvent[];
}): FlowDefinition {
  const { couple_names, events } = weddingData;

  return {
    version: '3.0',
    screens: [
      // Screen 1 — Welcome
      {
        id: 'WELCOME',
        title: 'Wedding Invitation',
        layout: {
          type: 'SingleColumnLayout',
          children: [
            {
              type: 'TextHeading',
              text: `You're invited to ${couple_names}'s wedding!`,
            },
            {
              type: 'TextBody',
              text: 'Let us know your plans so we can coordinate everything for you.',
            },
            {
              type: 'Footer',
              label: 'Continue',
              'on-click-action': {
                name: 'navigate',
                next: { type: 'screen', name: 'ATTENDANCE' },
              },
            },
          ],
        },
      },

      // Screen 2 — Attendance
      {
        id: 'ATTENDANCE',
        title: 'Which events can you attend?',
        data: {
          events: events.map((e) => ({
            id: e.id,
            title: `${e.name} — ${e.date}`,
            description: `${e.time} at ${e.venue}${e.dress_code ? ` | ${e.dress_code}` : ''}`,
          })),
        },
        layout: {
          type: 'SingleColumnLayout',
          children: [
            {
              type: 'CheckboxGroup',
              name: 'events_attending',
              required: true,
              'data-source': '${data.events}',
            },
            {
              type: 'Footer',
              label: 'Next',
              'on-click-action': {
                name: 'navigate',
                next: { type: 'screen', name: 'GUEST_COUNT' },
              },
            },
          ],
        },
      },

      // Screen 3 — Guest Count
      {
        id: 'GUEST_COUNT',
        title: 'Your party',
        layout: {
          type: 'SingleColumnLayout',
          children: [
            {
              type: 'TextInput',
              name: 'guest_count',
              label: 'How many people in your party?',
              'input-type': 'number',
              required: true,
              'min-value': 1,
              'max-value': 10,
            },
            {
              type: 'TextInput',
              name: 'additional_guest_names',
              label: 'Names of additional guests (optional)',
              required: false,
            },
            {
              type: 'Footer',
              label: 'Next',
              'on-click-action': {
                name: 'navigate',
                next: { type: 'screen', name: 'DIETARY' },
              },
            },
          ],
        },
      },

      // Screen 4 — Dietary & Preferences
      {
        id: 'DIETARY',
        title: 'Dietary requirements',
        data: {
          dietary_options: [
            { id: 'vegetarian', title: 'Vegetarian' },
            { id: 'vegan', title: 'Vegan' },
            { id: 'jain', title: 'Jain' },
            { id: 'halal', title: 'Halal' },
            { id: 'gluten_free', title: 'Gluten-free' },
            { id: 'none', title: 'None' },
          ],
        },
        layout: {
          type: 'SingleColumnLayout',
          children: [
            {
              type: 'CheckboxGroup',
              name: 'dietary_preferences',
              'data-source': '${data.dietary_options}',
            },
            {
              type: 'TextInput',
              name: 'allergies',
              label: 'Any allergies or special needs? (optional)',
              required: false,
            },
            {
              type: 'Footer',
              label: 'Next',
              'on-click-action': {
                name: 'navigate',
                next: { type: 'screen', name: 'CONFIRMATION' },
              },
            },
          ],
        },
      },

      // Screen 5 — Confirmation
      {
        id: 'CONFIRMATION',
        title: 'All set!',
        layout: {
          type: 'SingleColumnLayout',
          children: [
            {
              type: 'TextBody',
              text: `Thanks! We'll be in touch with travel and logistics details closer to the date.`,
            },
            {
              type: 'Footer',
              label: 'Submit',
              'on-click-action': {
                name: 'complete',
                payload: {},
              },
            },
          ],
        },
      },
    ],
  };
}

/**
 * Handle a completed RSVP flow response.
 */
export async function handleFlowResponse(
  flowData: FlowResponseData,
  guestId: string,
  weddingId: string
): Promise<void> {
  // Create/update RSVP records for each selected event
  for (const eventId of flowData.events_attending) {
    const { error } = await supabase
      .from('rsvps')
      .upsert(
        {
          guest_id: guestId,
          wedding_id: weddingId,
          event_id: eventId,
          attending: 'yes',
          guest_count: flowData.guest_count || 1,
          dietary: flowData.dietary_preferences?.join(', ') || '',
        },
        { onConflict: 'guest_id,event_id' }
      );

    if (error) {
      console.error(`Failed to upsert RSVP for event ${eventId}:`, error);
    }
  }

  // Update guest outreach status
  await outreachService.updateGuestStatus(guestId, 'rsvp_confirmed', {
    source: 'whatsapp_flow',
    events_count: flowData.events_attending.length,
    guest_count: flowData.guest_count,
    dietary: flowData.dietary_preferences,
  });

  // Log the event
  await outreachService.logEvent({
    wedding_id: weddingId,
    guest_id: guestId,
    event_type: 'info_collected',
    channel: 'whatsapp',
    details: {
      source: 'whatsapp_flow',
      flow_data: flowData,
    },
  });
}
