/**
 * WhatsApp Webhook Handler — processes incoming messages and status updates
 * with HMAC signature verification and context-aware routing.
 */

import { createHmac } from 'crypto';
import { supabase } from '@/lib/supabase/client';
import { GuestCoordinator } from '@/lib/ai/guest-coordinator';
import { outreachService } from '@/lib/supabase/outreach-service';
import { outreachSender } from '@/lib/whatsapp/outreach-sender';
import { handleOptOut } from '@/lib/whatsapp/opt-ins';

const ERROR_FREQUENCY_CAP = 131049;
const ERROR_OPTED_OUT = 131050;

export interface WebhookMessage {
  from: string;
  id: string;
  timestamp: string;
  type: 'text' | 'interactive' | 'image' | 'document' | 'audio' | 'location';
  text?: { body: string };
  interactive?: {
    type: 'button_reply' | 'list_reply';
    button_reply?: { id: string; title: string };
    list_reply?: { id: string; title: string };
  };
}

export interface WebhookStatusUpdate {
  id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  recipient_id: string;
  errors?: Array<{ code: number; title: string }>;
}

export class WebhookHandler {
  /**
   * Verify HMAC SHA-256 signature from Meta webhook.
   */
  verifySignature(rawBody: string, signature: string): boolean {
    const secret = process.env.WHATSAPP_WEBHOOK_SECRET;
    if (!secret) return false;

    const expectedSignature = createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    return signature === `sha256=${expectedSignature}`;
  }

  /**
   * Process an incoming webhook payload from Meta.
   */
  async processWebhook(payload: any): Promise<void> {
    if (!payload?.entry) return;

    for (const entry of payload.entry) {
      for (const change of entry.changes || []) {
        const value = change.value;
        if (!value) continue;

        // Process incoming messages
        if (value.messages) {
          for (const message of value.messages) {
            const senderPhone = message.from;
            const weddingId = await this.resolveWeddingId(senderPhone);
            if (weddingId) {
              await this.routeMessage(senderPhone, message, weddingId);
            }
          }
        }

        // Process status updates
        if (value.statuses) {
          for (const status of value.statuses) {
            await this.handleStatusUpdate(status);
          }
        }
      }
    }
  }

  /**
   * Route incoming message based on sender role.
   */
  async routeMessage(
    senderPhone: string,
    message: WebhookMessage,
    weddingId: string
  ): Promise<{ response: string; handler: string }> {
    // Look up sender in guests table
    const { data: guest } = await supabase
      .from('guests')
      .select('id, name, contact_type, is_family_liaison, wedding_id')
      .eq('phone', senderPhone)
      .eq('wedding_id', weddingId)
      .single();

    if (!guest) {
      return {
        response: 'We couldn\'t find your details. Please check with the couple.',
        handler: 'unknown',
      };
    }

    const g = guest as any;
    const messageText = this.extractMessageText(message);

    // Route based on contact_type
    if (g.contact_type === 'admin') {
      return {
        response: `Admin command received: "${messageText}". Processing...`,
        handler: 'admin',
      };
    }

    // Route to GuestCoordinator for guests and liaisons
    const coordinator = new GuestCoordinator(weddingId, g.id);
    const result = await coordinator.handleIncomingMessage(messageText, senderPhone);

    // Execute actions
    for (const action of result.actions) {
      await this.executeAction(action, g.id, weddingId);
    }

    return {
      response: result.message,
      handler: g.is_family_liaison ? 'liaison' : 'guest',
    };
  }

  /**
   * Handle delivery status updates from Meta.
   */
  async handleStatusUpdate(statusPayload: WebhookStatusUpdate): Promise<void> {
    const errorCode = statusPayload.errors?.[0]?.code;

    await outreachSender.handleDeliveryWebhook(
      statusPayload.id,
      statusPayload.status,
      errorCode
    );

    // Handle specific errors
    if (statusPayload.status === 'failed') {
      if (errorCode === ERROR_FREQUENCY_CAP) {
        // Frequency cap — do not retry immediately
        console.warn(`Frequency cap hit for message ${statusPayload.id}. Will retry in 24+ hours.`);
      } else if (errorCode === ERROR_OPTED_OUT) {
        // User opted out — never retry
        await handleOptOut(statusPayload.recipient_id, '');
      }
    }
  }

  // ─── Private helpers ────────────────────────────────────────────

  private extractMessageText(message: WebhookMessage): string {
    if (message.type === 'text' && message.text?.body) {
      return message.text.body;
    }
    if (message.type === 'interactive') {
      if (message.interactive?.button_reply) {
        return message.interactive.button_reply.title;
      }
      if (message.interactive?.list_reply) {
        return message.interactive.list_reply.title;
      }
    }
    return '';
  }

  private async resolveWeddingId(phone: string): Promise<string | null> {
    const { data } = await supabase
      .from('guests')
      .select('wedding_id')
      .eq('phone', phone)
      .limit(1);

    if (!data || data.length === 0) return null;
    return (data[0] as any).wedding_id;
  }

  private async executeAction(
    action: any,
    guestId: string,
    weddingId: string
  ): Promise<void> {
    switch (action.type) {
      case 'update_status':
        await outreachService.updateGuestStatus(guestId, action.data.status, action.data);
        break;

      case 'record_consent':
        await supabase
          .from('guests')
          .update({
            consent_given_at: action.data.consent_given_at,
            data_retention_until: this.calculateRetentionDate(weddingId),
          })
          .eq('id', guestId);
        break;

      case 'mark_opted_out':
        await supabase
          .from('guests')
          .update({ whatsapp_opted_out: true })
          .eq('id', guestId);
        await outreachService.logEvent({
          wedding_id: weddingId,
          guest_id: guestId,
          event_type: 'opted_out',
          channel: 'whatsapp',
          details: {},
        });
        break;
    }
  }

  private calculateRetentionDate(_weddingId: string): string {
    // Default: 90 days from now (ideally from wedding date)
    const date = new Date();
    date.setDate(date.getDate() + 90);
    return date.toISOString();
  }
}

export const webhookHandler = new WebhookHandler();
