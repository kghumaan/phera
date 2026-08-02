/**
 * Whapi.Cloud webhook adapter.
 *
 * Normalizes Whapi's webhook payload format into the same structure
 * that the existing Meta webhook handler expects, so we can reuse
 * the AI concierge routing without duplicating logic.
 *
 * Whapi webhook payload (incoming message):
 * {
 *   "messages": [{
 *     "id": "msg-id",
 *     "from": "13177302557@s.whatsapp.net",
 *     "from_name": "John",
 *     "to": "19876543210@s.whatsapp.net",
 *     "body": "Hello!",
 *     "type": "text",
 *     "timestamp": 1712345678,
 *     ...
 *   }]
 * }
 *
 * We convert to Meta-compatible format:
 * {
 *   "entry": [{
 *     "changes": [{
 *       "value": {
 *         "messages": [{
 *           "from": "13177302557",
 *           "id": "msg-id",
 *           "timestamp": "1712345678",
 *           "type": "text",
 *           "text": { "body": "Hello!" }
 *         }],
 *         "contacts": [{ "profile": { "name": "John" }, "wa_id": "13177302557" }]
 *       }
 *     }]
 *   }]
 * }
 */

export interface WhapiIncomingMessage {
  id: string;
  from: string;       // "13177302557@s.whatsapp.net"
  from_name?: string;
  to?: string;
  body?: string;
  type: string;        // "text", "image", "document", etc.
  timestamp: number;
  chat_id?: string;
  [key: string]: unknown;
}

export interface WhapiWebhookPayload {
  messages?: WhapiIncomingMessage[];
  [key: string]: unknown;
}

/** Extract phone number from Whapi's JID format ("13177302557@s.whatsapp.net" → "13177302557") */
function extractPhone(jid: string): string {
  return jid.split('@')[0].replace(/[^0-9]/g, '');
}

/**
 * Convert a Whapi webhook payload to Meta-compatible format
 * so we can feed it directly to the existing webhook handler.
 */
export function normalizeWhapiPayload(payload: WhapiWebhookPayload): any {
  const messages = payload.messages || [];

  if (messages.length === 0) {
    return { entry: [] };
  }

  const normalizedMessages = messages
    .filter((msg) => {
      // Skip outgoing messages (from us) — only process incoming
      // Whapi marks outgoing with from_me: true
      return !(msg as any).from_me;
    })
    .map((msg) => {
      const phone = extractPhone(msg.from);

      const normalized: any = {
        from: phone,
        id: msg.id,
        timestamp: String(msg.timestamp),
        type: msg.type || 'text',
      };

      // Map message body based on type
      if (msg.type === 'text' && msg.body) {
        normalized.text = { body: msg.body };
      } else if (msg.type === 'interactive') {
        // Whapi sends button clicks differently — normalize
        normalized.interactive = {
          type: 'button_reply',
          button_reply: { id: msg.body || '', title: msg.body || '' },
        };
      }

      return normalized;
    });

  if (normalizedMessages.length === 0) {
    return { entry: [] };
  }

  const contacts = normalizedMessages.map((msg: any) => {
    const original = messages.find((m) => extractPhone(m.from) === msg.from);
    return {
      profile: { name: original?.from_name || 'Guest' },
      wa_id: msg.from,
    };
  });

  return {
    entry: [{
      changes: [{
        value: {
          messages: normalizedMessages,
          contacts,
        },
      }],
    }],
  };
}

/**
 * Verify Whapi webhook authenticity.
 * Whapi uses a simple token check — the webhook URL includes a token parameter,
 * or the Authorization header matches the API token.
 */
export function verifyWhapiWebhookAuth(authHeader: string | null): boolean {
  const token = process.env.WHAPI_API_TOKEN;
  if (!token) return false;

  // Whapi can send the token as Bearer or as a query parameter
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7) === token;
  }

  return authHeader === token;
}
