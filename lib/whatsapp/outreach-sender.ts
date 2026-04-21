/**
 * Outreach sender with batch support, rate limiting, frequency cap handling, and quality tracking.
 * Supports both Meta Business API (templates) and Whapi.Cloud (free-form text).
 */

import { checkOptInStatus, handleOptOut } from '@/lib/whatsapp/opt-ins';
import { outreachService } from '@/lib/supabase/outreach-service';
import { buildTemplatePayload, TemplatePayload } from '@/lib/whatsapp/outreach-templates';
import { getProvider, getRateLimitMs, sendOutreach, sendMetaTemplate, type WhatsAppProvider } from '@/lib/whatsapp/provider';
import { supabase } from '@/lib/supabase/client';

// WhatsApp error codes (Meta-specific)
const ERROR_FREQUENCY_CAP = 131049;
const ERROR_OPTED_OUT = 131050;

export interface SendResult {
  phoneNumber: string;
  guestId: string;
  messageId?: string;
  status: 'accepted' | 'frequency_capped' | 'opted_out' | 'failed';
  error?: string;
  errorCode?: number;
  provider?: WhatsAppProvider;
}

export interface BatchSendResult {
  delivered: SendResult[];
  accepted: SendResult[];
  retryTomorrow: SendResult[];
  optedOut: SendResult[];
  failed: SendResult[];
  total: number;
  provider: WhatsAppProvider;
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
  /** Pre-rendered plain text for Whapi sends. */
  renderedText?: string;
}

class OutreachSender {
  /**
   * Send a single template message via WhatsApp Cloud API (Meta only).
   */
  async sendTemplate(
    phoneNumber: string,
    templateName: string,
    languageCode: string,
    components: any[]
  ): Promise<{ messageId: string; status: string } | null> {
    const provider = getProvider();

    if (provider === 'whapi') {
      // Whapi doesn't support templates — caller should use sendBatch with renderedText
      console.warn('[outreach-sender] sendTemplate called with Whapi provider — skipping. Use sendBatch with renderedText.');
      return null;
    }

    const payload = {
      messaging_product: 'whatsapp',
      to: phoneNumber.replace(/[^0-9]/g, ''),
      type: 'template',
      template: {
        name: templateName,
        language: { code: languageCode },
        components,
      },
    };

    const result = await sendMetaTemplate(payload);
    if (!result.success) return null;

    return {
      messageId: result.messageId || '',
      status: 'accepted',
    };
  }

  /**
   * Send messages in batch with provider-aware rate limiting.
   *
   * Meta:  80 msg/sec (default)
   * Whapi: 1 msg/30sec (to avoid blocks on unofficial API)
   *
   * @param staggerMinutes If set, spread messages evenly over this many minutes.
   */
  async sendBatch(
    messages: OutreachMessage[],
    rateLimit?: number,
    staggerMinutes?: number,
  ): Promise<BatchSendResult> {
    const provider = getProvider();

    const result: BatchSendResult = {
      delivered: [],
      accepted: [],
      retryTomorrow: [],
      optedOut: [],
      failed: [],
      total: messages.length,
      provider,
    };

    // Calculate delay between messages
    let delayMs: number;
    if (staggerMinutes && staggerMinutes > 0 && messages.length > 1) {
      delayMs = Math.ceil((staggerMinutes * 60 * 1000) / messages.length);
    } else if (rateLimit) {
      delayMs = Math.ceil(1000 / rateLimit);
    } else {
      delayMs = getRateLimitMs();
    }

    console.log(`[outreach-sender] Sending ${messages.length} messages via ${provider}, delay=${delayMs}ms`);

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
            provider,
          });
          continue;
        }

        let sendResult: { success: boolean; messageId?: string; error?: string };

        if (provider === 'whapi') {
          // Whapi: send as plain text (or image+caption)
          const text = msg.renderedText || this.renderFallbackText(msg);
          sendResult = await sendOutreach(msg.phoneNumber, text, msg.mediaUrl);
        } else {
          // Meta: send as template
          const payload = buildTemplatePayload(
            msg.phoneNumber,
            msg.templateKey,
            msg.languageCode,
            msg.params,
            msg.mediaUrl
          );
          const metaResult = await sendMetaTemplate(payload);
          sendResult = metaResult;
        }

        if (sendResult.success && sendResult.messageId) {
          const sr: SendResult = {
            phoneNumber: msg.phoneNumber,
            guestId: msg.guestId,
            messageId: sendResult.messageId,
            status: 'accepted',
            provider,
          };
          result.accepted.push(sr);

          // Log the outreach event
          await outreachService.logEvent({
            wedding_id: msg.weddingId,
            guest_id: msg.guestId,
            event_type: 'template_sent',
            template_name: msg.templateKey,
            channel: 'whatsapp',
            details: {
              message_id: sendResult.messageId,
              template: msg.templateKey,
              language: msg.languageCode,
              provider,
            },
          });
        } else {
          result.failed.push({
            phoneNumber: msg.phoneNumber,
            guestId: msg.guestId,
            status: 'failed',
            error: sendResult.error || 'Send failed',
            provider,
          });
        }
      } catch (error: any) {
        const errorCode = this.extractErrorCode(error);

        if (errorCode === ERROR_FREQUENCY_CAP) {
          result.retryTomorrow.push({
            phoneNumber: msg.phoneNumber,
            guestId: msg.guestId,
            status: 'frequency_capped',
            errorCode: ERROR_FREQUENCY_CAP,
            error: 'Frequency cap hit. Queued for next-day retry.',
            provider,
          });
        } else if (errorCode === ERROR_OPTED_OUT) {
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
            provider,
          });
        } else {
          result.failed.push({
            phoneNumber: msg.phoneNumber,
            guestId: msg.guestId,
            status: 'failed',
            error: error.message || 'Unknown error',
            errorCode,
            provider,
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
    const { data: events } = await supabase
      .from('outreach_events')
      .select('*')
      .contains('details', { message_id: messageId })
      .limit(1);

    if (!events || events.length === 0) return;

    const event = events[0] as any;

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

  /** Render a basic fallback text when renderedText is not provided (Whapi sends). */
  private renderFallbackText(msg: OutreachMessage): string {
    const p = msg.params;
    const partner1 = p.partner1_name || p.guest_name || '';
    const partner2 = p.partner2_name || p.couple_names || '';
    const date = p.wedding_date || '';
    const venue = p.location || '';
    const url = p.website_url || '';

    return `${partner1} & ${partner2} would love for you to join their wedding celebration${date ? ` on ${date}` : ''}${venue ? ` at ${venue}` : ''}.\n\nView details & RSVP: ${url}`;
  }

  private extractErrorCode(error: any): number | undefined {
    if (error.code) return error.code;
    const match = error.message?.match(/Code:\s*(\d+)/);
    return match ? parseInt(match[1]) : undefined;
  }
}

export const outreachSender = new OutreachSender();
