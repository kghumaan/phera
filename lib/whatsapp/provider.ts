/**
 * WhatsApp provider abstraction.
 *
 * Auto-selects between Whapi.Cloud (unofficial, regular number) and
 * Meta Business API (official, business number) based on environment variables.
 *
 * WHAPI_API_TOKEN set  → Whapi is primary
 * WHAPI_API_TOKEN unset → Meta Business API
 */

import { sendMessage as whapiSend, type WhapiSendResult } from '@/lib/whatsapp/whapi-client';

export type WhatsAppProvider = 'whapi' | 'meta';

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: WhatsAppProvider;
}

/** Which provider is active based on env vars. */
export function getProvider(): WhatsAppProvider {
  if (process.env.WHAPI_API_TOKEN) return 'whapi';
  return 'meta';
}

/** Rate limit delay (ms) per provider. */
export function getRateLimitMs(): number {
  return getProvider() === 'whapi' ? 30_000 : 80;
}

/**
 * Send a message via the active provider.
 *
 * - Whapi: sends as free-form text (or image+caption). No templates.
 * - Meta: sends via the Cloud API using template payloads.
 *
 * For Meta template sends, callers should use sendMetaTemplate() directly since
 * the payload structure is fundamentally different. This function is for
 * plain-text / image outreach that both providers handle identically.
 */
export async function sendOutreach(
  to: string,
  message: string,
  imageUrl?: string,
): Promise<SendResult> {
  const provider = getProvider();

  if (provider === 'whapi') {
    console.log(`[provider:whapi] Sending to ${to.slice(0, 6)}...`);
    const result = await whapiSend(to, message, imageUrl);
    return { ...result, provider: 'whapi' };
  }

  // Meta Business API — send as text via existing client
  console.log(`[provider:meta] Sending to ${to.slice(0, 6)}...`);
  return sendViaMeta(to, message);
}

/**
 * Send a Meta Business API template message.
 * Only used when provider is 'meta'. Callers pass the full Cloud API payload.
 */
export async function sendMetaTemplate(payload: any): Promise<SendResult> {
  const apiVersion = process.env.WHATSAPP_API_VERSION || 'v23.0';
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';

  if (!phoneNumberId || !accessToken) {
    return { success: false, error: 'Meta WhatsApp credentials not configured', provider: 'meta' };
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      const errCode = data?.error?.code || null;
      const errMsg = data?.error?.message || 'Unknown Meta API error';
      return { success: false, error: errMsg, messageId: undefined, provider: 'meta' };
    }

    return {
      success: true,
      messageId: data.messages?.[0]?.id || undefined,
      provider: 'meta',
    };
  } catch (err: any) {
    return { success: false, error: err.message, provider: 'meta' };
  }
}

/** Send plain text via Meta Cloud API. */
async function sendViaMeta(to: string, body: string): Promise<SendResult> {
  const apiVersion = process.env.WHATSAPP_API_VERSION || 'v23.0';
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';

  if (!phoneNumberId || !accessToken) {
    return { success: false, error: 'Meta WhatsApp credentials not configured', provider: 'meta' };
  }

  const cleanPhone = to.replace(/[^0-9]/g, '');

  try {
    const response = await fetch(
      `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: cleanPhone,
          type: 'text',
          text: { preview_url: false, body },
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data?.error?.message || 'Meta API error', provider: 'meta' };
    }

    return { success: true, messageId: data.messages?.[0]?.id, provider: 'meta' };
  } catch (err: any) {
    return { success: false, error: err.message, provider: 'meta' };
  }
}
