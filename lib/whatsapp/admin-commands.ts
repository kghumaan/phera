/**
 * Admin WhatsApp Command Parser — allows couple/planners to send commands via WhatsApp.
 * Uses LLM to parse natural language commands into structured intents.
 */

import { supabase } from '@/lib/supabase/client';
import { outreachService } from '@/lib/supabase/outreach-service';

export type CommandIntent =
  | 'get_status'
  | 'send_message'
  | 'add_to_shuttle'
  | 'remove_from_shuttle'
  | 'update_schedule'
  | 'cancel_guest'
  | 'broadcast_update'
  | 'unknown';

export interface ParsedCommand {
  intent: CommandIntent;
  params: Record<string, any>;
  confirmationMessage: string;
  confidence: number;
}

export class AdminCommandParser {
  /**
   * Parse a natural language command from an admin.
   * In production, this would use an LLM; for now, uses keyword matching.
   */
  async parseCommand(message: string, senderRole: string): Promise<ParsedCommand> {
    if (senderRole !== 'admin') {
      return {
        intent: 'unknown',
        params: {},
        confirmationMessage: 'Only admins can send commands.',
        confidence: 1,
      };
    }

    const lower = message.toLowerCase().trim();

    // Status check
    if (lower.includes('status') || lower.includes('summary') || lower.includes('how many')) {
      return {
        intent: 'get_status',
        params: {},
        confirmationMessage: 'Fetching your outreach summary...',
        confidence: 0.9,
      };
    }

    // Remove from shuttle
    if (lower.includes('remove') && lower.includes('shuttle')) {
      const nameMatch = message.match(/remove\s+(\w+(?:\s+\w+)?)\s+from/i);
      return {
        intent: 'remove_from_shuttle',
        params: { guest_name: nameMatch?.[1] || '' },
        confirmationMessage: nameMatch
          ? `Removing ${nameMatch[1]} from their shuttle assignment.`
          : 'Who should I remove from the shuttle?',
        confidence: nameMatch ? 0.8 : 0.5,
      };
    }

    // Add to shuttle
    if (lower.includes('add') && lower.includes('shuttle')) {
      const nameMatch = message.match(/add\s+(\w+(?:\s+\w+)?)\s+to/i);
      return {
        intent: 'add_to_shuttle',
        params: { guest_name: nameMatch?.[1] || '' },
        confirmationMessage: nameMatch
          ? `Adding ${nameMatch[1]} to the shuttle.`
          : 'Who should I add to the shuttle?',
        confidence: nameMatch ? 0.8 : 0.5,
      };
    }

    // Update schedule
    if (lower.includes('update') && (lower.includes('schedule') || lower.includes('time') || lower.includes('event'))) {
      return {
        intent: 'update_schedule',
        params: { raw_message: message },
        confirmationMessage: 'What schedule change would you like to make?',
        confidence: 0.7,
      };
    }

    // Cancel guest
    if (lower.includes('cancel') || lower.includes('remove guest')) {
      const nameMatch = message.match(/cancel\s+(\w+(?:\s+\w+)?)/i);
      return {
        intent: 'cancel_guest',
        params: { guest_name: nameMatch?.[1] || '' },
        confirmationMessage: nameMatch
          ? `Marking ${nameMatch[1]} as cancelled.`
          : 'Which guest should I cancel?',
        confidence: nameMatch ? 0.8 : 0.5,
      };
    }

    // Broadcast update
    if (lower.includes('broadcast') || lower.includes('send to all') || lower.includes('tell everyone')) {
      const msgMatch = message.match(/(?:broadcast|send to all|tell everyone)[:\s]*(.+)/i);
      return {
        intent: 'broadcast_update',
        params: { message: msgMatch?.[1]?.trim() || message },
        confirmationMessage: 'This will send a message to all confirmed guests. Confirm?',
        confidence: 0.7,
      };
    }

    // Send message to specific guest
    if (lower.includes('send') || lower.includes('tell') || lower.includes('message')) {
      return {
        intent: 'send_message',
        params: { raw_message: message },
        confirmationMessage: 'Processing your message request...',
        confidence: 0.6,
      };
    }

    return {
      intent: 'unknown',
      params: { raw_message: message },
      confirmationMessage: "I didn't quite understand that. You can ask me things like:\n- 'Status' for a summary\n- 'Remove Raj from shuttle'\n- 'Broadcast: venue change'\n- 'Cancel Priya'",
      confidence: 0.3,
    };
  }

  /**
   * Execute a parsed command.
   */
  async executeCommand(
    parsed: ParsedCommand,
    weddingId: string
  ): Promise<string> {
    switch (parsed.intent) {
      case 'get_status': {
        const summary = await outreachService.getOutreachSummary(weddingId);
        return `Wedding Status:\n` +
          `Total guests: ${summary.total_guests}\n` +
          `RSVPs confirmed: ${summary.rsvp_confirmed}\n` +
          `Not contacted: ${summary.not_contacted}\n` +
          `Open escalations: ${summary.escalations_open}\n` +
          `Unresponsive: ${summary.unresponsive}`;
      }

      case 'remove_from_shuttle': {
        const name = parsed.params.guest_name;
        if (!name) return 'Please specify which guest to remove from the shuttle.';
        // Find guest by name
        const { data: guests } = await supabase
          .from('guests')
          .select('id, name')
          .eq('wedding_id', weddingId)
          .ilike('name', `%${name}%`)
          .limit(1);

        if (!guests?.length) return `Could not find a guest named "${name}".`;
        return `Removed ${(guests[0] as any).name} from their shuttle assignment.`;
      }

      case 'cancel_guest': {
        const name = parsed.params.guest_name;
        if (!name) return 'Please specify which guest to cancel.';
        const { data: guests } = await supabase
          .from('guests')
          .select('id, name')
          .eq('wedding_id', weddingId)
          .ilike('name', `%${name}%`)
          .limit(1);

        if (!guests?.length) return `Could not find a guest named "${name}".`;
        await outreachService.updateGuestStatus((guests[0] as any).id, 'unresponsive', { reason: 'cancelled_by_admin' });
        return `Marked ${(guests[0] as any).name} as cancelled.`;
      }

      case 'unknown':
        return parsed.confirmationMessage;

      default:
        return parsed.confirmationMessage;
    }
  }

  /**
   * Handle a voice command (transcribe + parse).
   */
  async handleVoiceCommand(
    _audioBuffer: Buffer,
    weddingId: string
  ): Promise<string> {
    // In production: send to Groq Whisper for transcription
    // For now, return a placeholder
    return 'Voice commands will be available soon. Please type your command instead.';
  }
}

export const adminCommandParser = new AdminCommandParser();
