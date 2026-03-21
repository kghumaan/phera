/**
 * AI Guest Coordinator — conversation state machine for managing guest outreach.
 * Routes conversations based on guest outreach status and extracts structured data.
 */

import { supabase } from '@/lib/supabase/client';
import { outreachService } from '@/lib/supabase/outreach-service';
import { OutreachStatus } from '@/lib/types/outreach';

export interface GuestContext {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  wedding_id: string;
  outreach_status: OutreachStatus;
  outreach_last_contacted_at: string | null;
  outreach_attempt_count: number;
  whatsapp_opted_out: boolean;
  contact_type: string;
  is_family_liaison: boolean;
  liaison_for: string[] | null;
  logistics_data: Record<string, any> | null;
  consent_given_at: string | null;
}

export interface ExtractedData {
  rsvp_attending?: boolean;
  guest_count?: number;
  dietary_preferences?: string[];
  flight_number?: string;
  arrival_date?: string;
  departure_date?: string;
  hotel_name?: string;
  special_requests?: string;
  names?: string[];
  confidence: number;
}

export interface CoordinatorResponse {
  message: string;
  actions: CoordinatorAction[];
  extractedData?: ExtractedData;
}

export interface CoordinatorAction {
  type: 'update_status' | 'update_rsvp' | 'update_travel' | 'create_escalation' | 'record_consent' | 'mark_opted_out';
  data: Record<string, any>;
}

export class GuestCoordinator {
  private weddingId: string;
  private guestId: string;

  constructor(weddingId: string, guestId: string) {
    this.weddingId = weddingId;
    this.guestId = guestId;
  }

  /**
   * Handle an incoming message from a guest.
   */
  async handleIncomingMessage(
    message: string,
    senderPhone: string
  ): Promise<CoordinatorResponse> {
    // Fetch guest context
    const guest = await this.getGuestContext();
    if (!guest) {
      return {
        message: 'We couldn\'t find your details. Please check with the couple.',
        actions: [],
      };
    }

    // Handle opt-out
    if (this.isOptOutMessage(message)) {
      return {
        message: 'You\'ve been opted out. You won\'t receive any more messages from us. If you change your mind, reply START.',
        actions: [{ type: 'mark_opted_out', data: { guest_id: guest.id } }],
      };
    }

    // Record consent on first reply
    const actions: CoordinatorAction[] = [];
    if (!guest.consent_given_at) {
      actions.push({
        type: 'record_consent',
        data: {
          guest_id: guest.id,
          consent_given_at: new Date().toISOString(),
        },
      });
    }

    // Log the incoming message
    await outreachService.logEvent({
      wedding_id: this.weddingId,
      guest_id: this.guestId,
      event_type: 'message_received',
      channel: 'whatsapp',
      details: { message, sender_phone: senderPhone },
    });

    // Route based on outreach status
    const response = await this.routeByStatus(guest, message);

    return {
      ...response,
      actions: [...actions, ...response.actions],
    };
  }

  /**
   * Build context-aware system prompt for the LLM.
   */
  getSystemPrompt(guest: GuestContext, weddingData?: any): string {
    const missingInfo = this.getMissingInfo(guest);

    let prompt = `You are Phera, a friendly wedding coordination assistant for ${guest.wedding_id.replace(/-/g, ' ')}. `;
    prompt += `You are chatting with ${guest.name}. `;
    prompt += `Their current status: ${guest.outreach_status}. `;

    if (missingInfo.length > 0) {
      prompt += `We still need: ${missingInfo.join(', ')}. `;
    }

    if (guest.is_family_liaison && guest.liaison_for?.length) {
      prompt += `This person is a family liaison who can provide info for ${guest.liaison_for.length} other guests. `;
      prompt += `If they mention other people's details, extract and attribute correctly. `;
    }

    prompt += `\nTone: warm, helpful, personal — not corporate. `;
    prompt += `Keep messages concise. Use the guest's name. `;
    prompt += `If they ask a question, answer it first, then gently pivot to collecting missing info. `;
    prompt += `If they give info, confirm it back to them. `;

    return prompt;
  }

  /**
   * Extract structured data from a natural language message.
   */
  extractStructuredData(message: string, context: GuestContext): ExtractedData {
    const data: ExtractedData = { confidence: 0 };
    const lowerMsg = message.toLowerCase();

    // RSVP detection
    const positiveWords = ['yes', 'attending', 'coming', 'i\'ll be there', 'count me in', 'sure', 'definitely', 'haan', 'ha ji'];
    const negativeWords = ['no', 'can\'t', 'cannot', 'won\'t', 'not coming', 'unable', 'nahi'];

    if (positiveWords.some((w) => lowerMsg.includes(w))) {
      data.rsvp_attending = true;
      data.confidence = 0.8;
    } else if (negativeWords.some((w) => lowerMsg.includes(w))) {
      data.rsvp_attending = false;
      data.confidence = 0.8;
    }

    // Guest count extraction
    const countMatch = message.match(/(\d+)\s*(people|guests|persons|of us|members)/i);
    if (countMatch) {
      data.guest_count = parseInt(countMatch[1]);
      data.confidence = Math.max(data.confidence, 0.7);
    }

    // Flight number extraction
    const flightMatch = message.match(/([A-Z]{2}\d{3,4}|[A-Z]{3}\d{3,4})/);
    if (flightMatch) {
      data.flight_number = flightMatch[1];
      data.confidence = Math.max(data.confidence, 0.9);
    }

    // Date extraction (simple patterns)
    const datePatterns = [
      /(?:arriving|arrival|landing|reach|coming)\s*(?:on)?\s*(\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*)/i,
      /(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)/,
    ];
    for (const pattern of datePatterns) {
      const match = message.match(pattern);
      if (match) {
        data.arrival_date = match[1];
        data.confidence = Math.max(data.confidence, 0.7);
        break;
      }
    }

    // Dietary preferences
    const dietaryKeywords = ['vegetarian', 'vegan', 'jain', 'halal', 'gluten-free', 'gluten free', 'no pork', 'no beef', 'nut allergy'];
    const foundDietary = dietaryKeywords.filter((d) => lowerMsg.includes(d));
    if (foundDietary.length > 0) {
      data.dietary_preferences = foundDietary;
      data.confidence = Math.max(data.confidence, 0.8);
    }

    // Hotel extraction
    const hotelMatch = message.match(/(?:staying at|hotel|resort|staying in)\s+(.+?)(?:\.|$)/i);
    if (hotelMatch) {
      data.hotel_name = hotelMatch[1].trim();
      data.confidence = Math.max(data.confidence, 0.6);
    }

    // Names extraction (for family liaison)
    if (context.is_family_liaison) {
      const names: string[] = [];

      // Match "Auntie Meena", "Uncle Raj" etc.
      const titlePattern = /(?:auntie|uncle|aunt|bhaiya|bhabhi|didi|chacha|chachi|mama|mami)\s+(\w+)/gi;
      const titleMatches = message.matchAll(titlePattern);
      for (const match of titleMatches) {
        if (match[1]) names.push(match[1]);
      }

      // Match "X and Y" pattern
      const andMatch = message.match(/(\w+)\s+(?:and|&|aur)\s+(\w+)/i);
      if (andMatch) {
        if (andMatch[1]) names.push(andMatch[1]);
        if (andMatch[2]) names.push(andMatch[2]);
      }

      if (names.length > 0) {
        data.names = [...new Set(names)];
        data.confidence = Math.max(data.confidence, 0.6);
      }
    }

    return data;
  }

  // ─── Private methods ────────────────────────────────────────────

  private async getGuestContext(): Promise<GuestContext | null> {
    const { data, error } = await supabase
      .from('guests')
      .select('id, name, phone, email, wedding_id, outreach_status, outreach_last_contacted_at, outreach_attempt_count, whatsapp_opted_out, contact_type, is_family_liaison, liaison_for, logistics_data, consent_given_at')
      .eq('id', this.guestId)
      .single();

    if (error || !data) return null;
    return data as unknown as GuestContext;
  }

  private async routeByStatus(
    guest: GuestContext,
    message: string
  ): Promise<CoordinatorResponse> {
    const extracted = this.extractStructuredData(message, guest);
    const actions: CoordinatorAction[] = [];

    switch (guest.outreach_status) {
      case 'not_contacted':
      case 'save_the_date_sent': {
        // Guest replied early — great! Treat like RSVP start
        if (extracted.rsvp_attending === true) {
          actions.push({
            type: 'update_status',
            data: { status: 'rsvp_confirmed' },
          });
          return {
            message: `That's wonderful, ${guest.name}! We've noted you're attending. We'll be in touch with travel and schedule details closer to the date. Reply anytime if you have questions! 🎉`,
            actions,
            extractedData: extracted,
          };
        }
        return {
          message: `Hi ${guest.name}! Thanks for getting back to us. We're helping coordinate the wedding. Would you like to confirm your RSVP? Just say "yes" or "attending"!`,
          actions,
          extractedData: extracted,
        };
      }

      case 'rsvp_requested': {
        if (extracted.rsvp_attending === true) {
          actions.push({
            type: 'update_status',
            data: { status: 'rsvp_confirmed' },
          });
          if (extracted.guest_count) {
            actions.push({
              type: 'update_rsvp',
              data: { guest_count: extracted.guest_count },
            });
          }
          return {
            message: `Amazing, ${guest.name}! You're confirmed! ${extracted.guest_count ? `Party of ${extracted.guest_count} — noted! ` : ''}We'll reach out closer to the date about travel details. 🎉`,
            actions,
            extractedData: extracted,
          };
        }
        if (extracted.rsvp_attending === false) {
          actions.push({
            type: 'update_status',
            data: { status: 'rsvp_confirmed' },
          });
          actions.push({
            type: 'update_rsvp',
            data: { attending: false },
          });
          return {
            message: `We understand, ${guest.name}. We'll let the couple know. If your plans change, just message us anytime! 💛`,
            actions,
            extractedData: extracted,
          };
        }
        return {
          message: `Hi ${guest.name}! We're coordinating the wedding logistics. Can you let us know if you'll be attending? Just reply "yes" or "no"!`,
          actions,
          extractedData: extracted,
        };
      }

      case 'rsvp_confirmed': {
        // Collect travel details
        if (extracted.flight_number || extracted.arrival_date || extracted.hotel_name) {
          actions.push({
            type: 'update_travel',
            data: {
              flight_number: extracted.flight_number,
              arrival_date: extracted.arrival_date,
              hotel_name: extracted.hotel_name,
            },
          });
          actions.push({
            type: 'update_status',
            data: { status: 'travel_collected' },
          });
          return {
            message: `Thanks ${guest.name}! Got your travel details. ${extracted.flight_number ? `Flight ${extracted.flight_number} — ` : ''}${extracted.arrival_date ? `arriving ${extracted.arrival_date}` : ''}. We'll send shuttle info closer to the date! ✈️`,
            actions,
            extractedData: extracted,
          };
        }
        return {
          message: `Hi ${guest.name}! Great that you're attending! When you have your travel details (flights, hotel), share them here and we'll coordinate shuttles and pickups for you. ✈️`,
          actions,
          extractedData: extracted,
        };
      }

      case 'travel_collected':
      case 'logistics_complete': {
        // Answer questions, collect any remaining info
        if (extracted.dietary_preferences?.length) {
          actions.push({
            type: 'update_rsvp',
            data: { dietary_preferences: extracted.dietary_preferences },
          });
          return {
            message: `Noted — ${extracted.dietary_preferences.join(', ')}. We'll make sure the caterers know! 🍽️`,
            actions,
            extractedData: extracted,
          };
        }
        return {
          message: `Hi ${guest.name}! Everything is looking great for the wedding. Reply anytime if you have questions about the schedule, venues, or anything else. We're here to help! 🎊`,
          actions,
          extractedData: extracted,
        };
      }

      case 'unresponsive': {
        // They finally replied! Update status based on content
        actions.push({
          type: 'update_status',
          data: { status: extracted.rsvp_attending !== undefined ? 'rsvp_confirmed' : 'rsvp_requested' },
        });
        return {
          message: `${guest.name}, so great to hear from you! We're helping coordinate the wedding. ${extracted.rsvp_attending ? 'Wonderful that you\'re coming! 🎉' : 'Can you let us know if you\'ll be attending?'}`,
          actions,
          extractedData: extracted,
        };
      }

      default:
        return {
          message: `Hi ${guest.name}! Thanks for your message. We're coordinating the wedding and are here to help with anything you need. 😊`,
          actions: [],
          extractedData: extracted,
        };
    }
  }

  private getMissingInfo(guest: GuestContext): string[] {
    const missing: string[] = [];

    if (guest.outreach_status === 'not_contacted' || guest.outreach_status === 'save_the_date_sent') {
      missing.push('RSVP confirmation');
    }
    if (guest.outreach_status === 'rsvp_requested') {
      missing.push('RSVP response');
    }
    if (guest.outreach_status === 'rsvp_confirmed') {
      missing.push('travel details');
    }

    const logistics = guest.logistics_data || {};
    if (!logistics.dietary_preferences) missing.push('dietary preferences');

    return missing;
  }

  private isOptOutMessage(message: string): boolean {
    const optOutKeywords = ['stop', 'unsubscribe', 'opt out', 'opt-out', 'cancel', 'बंद करें'];
    return optOutKeywords.some((k) => message.toLowerCase().trim() === k);
  }
}
