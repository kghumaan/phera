/**
 * Whapi.Cloud client for outreach messaging (1:1 guest messages).
 * Sends from a regular WhatsApp number, not Meta Business API.
 *
 * Docs: https://whapi.cloud/docs
 * Base URL: https://gate.whapi.cloud
 * Auth: Bearer token via WHAPI_API_TOKEN env var
 * Phone format: country code + number, no + prefix (e.g. "13177302557")
 */

const WHAPI_BASE_URL = process.env.WHAPI_API_URL || 'https://gate.whapi.cloud';

export interface WhapiSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

function getToken(): string {
  return process.env.WHAPI_API_TOKEN || '';
}

/** Strip leading + and all non-digits. Whapi expects "13177302557" format. */
function cleanPhone(phone: string): string {
  return phone.replace(/[^0-9]/g, '');
}

async function whapiRequest(path: string, body: any): Promise<WhapiSendResult> {
  const token = getToken();
  if (!token) {
    return { success: false, error: 'WHAPI_API_TOKEN not configured' };
  }

  try {
    const response = await fetch(`${WHAPI_BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      const errMsg = data?.message || data?.error || `HTTP ${response.status}`;
      console.error(`[Whapi] API error: ${errMsg}`);
      return { success: false, error: errMsg };
    }

    return {
      success: true,
      messageId: data?.message?.id || data?.id || undefined,
    };
  } catch (err: any) {
    console.error('[Whapi] Request failed:', err.message);
    return { success: false, error: err.message };
  }
}

/** Send a plain text message. */
export async function sendTextMessage(to: string, body: string): Promise<WhapiSendResult> {
  return whapiRequest('/messages/text', {
    to: cleanPhone(to),
    body,
  });
}

/** Send an image with optional caption. */
export async function sendImageMessage(to: string, imageUrl: string, caption?: string): Promise<WhapiSendResult> {
  return whapiRequest('/messages/image', {
    to: cleanPhone(to),
    media: { url: imageUrl },
    ...(caption ? { caption } : {}),
  });
}

/**
 * Convenience wrapper: sends image+caption if imageUrl provided, text otherwise.
 */
export async function sendMessage(to: string, body: string, imageUrl?: string): Promise<WhapiSendResult> {
  if (imageUrl) {
    return sendImageMessage(to, imageUrl, body);
  }
  return sendTextMessage(to, body);
}
