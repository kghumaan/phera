/**
 * Outreach sender with batch support, rate limiting, frequency cap handling, and quality tracking.
 * Uses the existing WhatsAppClient from client.ts.
 */

import { whatsappClient } from '@/lib/whatsapp/client';
import { checkOptInStatus, handleOptOut } from '@/lib/whatsapp/opt-ins';
import { outreachService } from '@/lib/supabase/outreach-service';
import { buildTemplatePayload, TemplatePayload } from '@/lib/whatsapp/outreach-templates';
import { supabase } from '@/lib/supabase/client';

// WhatsApp error codes
const ERROR_FREQUENCY_CAP = 131049;
const ERROR_OPTED_OUT = 131050;

export interface SendResult {
  phoneNumber: string;
  guestId: string;
  messageId?: string;
  status: 'accepted' | 'frequency_capped' | 'opted_out' | 'failed';
  error?: string;
  errorCode?: number;
}

export interface BatchSendResult {
  delivered: SendResult[];
  accepted: SendResult[];
  retryTomorrow: SendResult[];
  optedOut: SendResult[];
  failed: SendResult[];
  total: number;
}

export interface QualityMetrics {
  sent: number;
  delivered: number;
  read: number;
  blocked: number;
  reported: number;
  deliveryRate: number;
  readRate: number;
  blockRate: number;
  reportRate: number;
  perTemplate: Record<string, { sent: number; delivered: number; read: number; failed: number }>;
}

export interface OutreachMessage {
  phoneNumber: string;
  guestId: string;
  weddingId: string;
  templateKey: string;
  languageCode: string;
  params: Record<string, string>;
  mediaUrl?: string;
}

class OutreachSender {
  /**
   * Send a single template message via WhatsApp Cloud API.
   */
  async sendTemplate(
    phoneNumber: string,
    templateName: string,
    languageCode: string,
    components: any[]
  ): Promise<{ messageId: string; status: string } | null> {
    const response = await whatsappClient.sendTemplate(
      phoneNumber,
      templateName,
      languageCode,
      [] // Components are handled by the template
    );

    if (!response) return null;

    return {
      messageId: response.messages[0].id,
      status: 'accepted',
    };
  }

  /**
   * Send messages in batch with rate limiting.
   * Default rate limit is 80 messages/second (Meta's default throughput).
   */
  async sendBatch(
    messages: OutreachMessage[],
    rateLimit: number = 80
  ): Promise<BatchSendResult> {
    const result: BatchSendResult = {
      delivered: [],
      accepted: [],
      retryTomorrow: [],
      optedOut: [],
      failed: [],
      total: messages.length,
    };

    const delayMs = Math.ceil(1000 / rateLimit);

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];

      try {
        // Check opt-in status first
        const optedIn = await checkOptInStatus(msg.phoneNumber, msg.weddingId);
        if (optedIn === false) {
          result.optedOut.push({
            phoneNumber: msg.phoneNumber,
            guestId: msg.guestId,
            status: 'opted_out',
          });
          continue;
        }

        // Build and send the template payload
        const payload = buildTemplatePayload(
          msg.phoneNumber,
          msg.templateKey,
          msg.languageCode,
          msg.params,
          msg.mediaUrl
        );

        const response = await this.sendTemplatePayload(payload);

        if (response.messageId) {
          const sendResult: SendResult = {
            phoneNumber: msg.phoneNumber,
            guestId: msg.guestId,
            messageId: response.messageId,
            status: 'accepted',
          };
          result.accepted.push(sendResult);

          // Log the outreach event
          await outreachService.logEvent({
            wedding_id: msg.weddingId,
            guest_id: msg.guestId,
            event_type: 'template_sent',
            template_name: msg.templateKey,
            channel: 'whatsapp',
            details: {
              message_id: response.messageId,
              template: msg.templateKey,
              language: msg.languageCode,
            },
          });
        }
      } catch (error: any) {
        const errorCode = this.extractErrorCode(error);

        if (errorCode === ERROR_FREQUENCY_CAP) {
          // Queue for retry tomorrow — do NOT retry immediately
          result.retryTomorrow.push({
            phoneNumber: msg.phoneNumber,
            guestId: msg.guestId,
            status: 'frequency_capped',
            errorCode: ERROR_FREQUENCY_CAP,
            error: 'Frequency cap hit. Queued for next-day retry.',
          });
        } else if (errorCode === ERROR_OPTED_OUT) {
          // Mark as opted out — NEVER retry
          await handleOptOut(msg.phoneNumber, msg.weddingId);
          await supabase
            .from('guests')
            .update({ whatsapp_opted_out: true })
            .eq('id', msg.guestId);

          result.optedOut.push({
            phoneNumber: msg.phoneNumber,
            guestId: msg.guestId,
            status: 'opted_out',
            errorCode: ERROR_OPTED_OUT,
          });
        } else {
          result.failed.push({
            phoneNumber: msg.phoneNumber,
            guestId: msg.guestId,
            status: 'failed',
            error: error.message || 'Unknown error',
            errorCode,
          });
        }
      }

      // Rate limiting delay (skip on last message)
      if (i < messages.length - 1 && delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    return result;
  }

  /**
   * Check if a guest is within the 24-hour free service window.
   */
  async isInServiceWindow(guestPhone: string, weddingId: string): Promise<boolean> {
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const { data, error } = await supabase
      .from('outreach_events')
      .select('id')
      .eq('wedding_id', weddingId)
      .eq('event_type', 'message_received')
      .gte('created_at', twentyFourHoursAgo.toISOString())
      .limit(1);

    if (error) return false;
    return (data?.length || 0) > 0;
  }

  /**
   * Handle delivery status webhook from Meta.
   */
  async handleDeliveryWebhook(
    messageId: string,
    status: 'sent' | 'delivered' | 'read' | 'failed',
    errorCode?: number
  ): Promise<void> {
    // Find the event by message_id in details
    const { data: events } = await supabase
      .from('outreach_events')
      .select('*')
      .contains('details', { message_id: messageId })
      .limit(1);

    if (!events || events.length === 0) return;

    const event = events[0] as any;

    // Log the delivery status as a new event
    await outreachService.logEvent({
      wedding_id: event.wedding_id,
      guest_id: event.guest_id,
      event_type: 'status_changed',
      channel: 'whatsapp',
      details: {
        message_id: messageId,
        delivery_status: status,
        error_code: errorCode,
        original_event_id: event.id,
      },
    });

    // Handle failure with specific error codes
    if (status === 'failed' && errorCode === ERROR_OPTED_OUT) {
      await handleOptOut(event.guest_id, event.wedding_id);
      await supabase
        .from('guests')
        .update({ whatsapp_opted_out: true })
        .eq('id', event.guest_id);
    }
  }

  /**
   * Get quality metrics for outreach messages.
   */
  async getQualityMetrics(weddingId?: string): Promise<QualityMetrics> {
    let query = supabase
      .from('outreach_events')
      .select('event_type, template_name, details');

    if (weddingId) {
      query = query.eq('wedding_id', weddingId);
    }

    const { data: events, error } = await query;
    if (error) throw new Error(`Failed to get quality metrics: ${error.message}`);

    let sent = 0;
    let delivered = 0;
    let read = 0;
    let blocked = 0;
    let reported = 0;
    const perTemplate: Record<string, { sent: number; delivered: number; read: number; failed: number }> = {};

    for (const event of (events || []) as any[]) {
      const templateName = event.template_name || 'unknown';
      if (!perTemplate[templateName]) {
        perTemplate[templateName] = { sent: 0, delivered: 0, read: 0, failed: 0 };
      }

      if (event.event_type === 'template_sent') {
        sent++;
        perTemplate[templateName].sent++;
      } else if (event.event_type === 'status_changed') {
        const details = event.details || {};
        if (details.delivery_status === 'delivered') {
          delivered++;
          perTemplate[templateName].delivered++;
        } else if (details.delivery_status === 'read') {
          read++;
          perTemplate[templateName].read++;
        } else if (details.delivery_status === 'failed') {
          perTemplate[templateName].failed++;
          if (details.error_code === ERROR_OPTED_OUT) {
            blocked++;
          }
        }
      } else if (event.event_type === 'opted_out') {
        blocked++;
      }
    }

    return {
      sent,
      delivered,
      read,
      blocked,
      reported,
      deliveryRate: sent > 0 ? delivered / sent : 0,
      readRate: delivered > 0 ? read / delivered : 0,
      blockRate: sent > 0 ? blocked / sent : 0,
      reportRate: sent > 0 ? reported / sent : 0,
      perTemplate,
    };
  }

  // ─── Private helpers ────────────────────────────────────────────

  private async sendTemplatePayload(payload: TemplatePayload): Promise<{ messageId: string }> {
    const apiVersion = process.env.WHATSAPP_API_VERSION || 'v23.0';
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';

    const response = await fetch(
      `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      const err = new Error(
        `WhatsApp API error: ${error.error?.message || 'Unknown'} (Code: ${error.error?.code})`
      );
      (err as any).code = error.error?.code;
      throw err;
    }

    const data = await response.json();
    return { messageId: data.messages[0].id };
  }

  private extractErrorCode(error: any): number | undefined {
    if (error.code) return error.code;
    const match = error.message?.match(/Code:\s*(\d+)/);
    return match ? parseInt(match[1]) : undefined;
  }
}

export const outreachSender = new OutreachSender();
