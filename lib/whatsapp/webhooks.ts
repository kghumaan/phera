/**
 * WhatsApp Webhook Utilities
 * Handles parsing and processing of WhatsApp webhook payloads
 */

import { createClient } from '@supabase/supabase-js';

// Use service role client to bypass RLS for server-side webhook operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface WebhookStatus {
  id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  recipient_id?: string;
  error?: {
    code: number;
    title: string;
    message: string;
  };
}

export interface IncomingMessage {
  id: string;
  from: string;
  senderName: string;
  timestamp: string;
  type: 'text' | 'interactive' | 'other';
  text?: string;
  interactive?: {
    type: 'button_reply' | 'list_reply';
    id: string;
    title: string;
  };
}

/**
 * Parse WhatsApp webhook payload to extract incoming messages
 */
export function parseIncomingMessage(payload: any): IncomingMessage[] {
  const messages: IncomingMessage[] = [];

  try {
    if (!payload.entry || !Array.isArray(payload.entry)) {
      return messages;
    }

    for (const entry of payload.entry) {
      if (!entry.changes || !Array.isArray(entry.changes)) {
        continue;
      }

      for (const change of entry.changes) {
        if (change.field !== 'messages') {
          continue;
        }

        const value = change.value;

        // Parse profile name (optional)
        const contact = value.contacts?.[0];
        const senderName = contact?.profile?.name || 'Guest';

        if (value.messages && Array.isArray(value.messages)) {
          for (const message of value.messages) {
            const incoming: IncomingMessage = {
              id: message.id,
              from: message.from,
              senderName,
              timestamp: new Date(parseInt(message.timestamp) * 1000).toISOString(),
              type: 'other',
            };

            if (message.type === 'text') {
              incoming.type = 'text';
              incoming.text = message.text?.body;
            } else if (message.type === 'interactive') {
              incoming.type = 'interactive';
              const interactive = message.interactive;

              if (interactive.type === 'button_reply') {
                incoming.interactive = {
                  type: 'button_reply',
                  id: interactive.button_reply?.id,
                  title: interactive.button_reply?.title,
                };
              } else if (interactive.type === 'list_reply') {
                incoming.interactive = {
                  type: 'list_reply',
                  id: interactive.list_reply?.id,
                  title: interactive.list_reply?.title,
                };
              }
            }

            messages.push(incoming);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error parsing incoming messages:', error);
  }

  return messages;
}

/**
 * Parse WhatsApp webhook payload to extract status updates
 */
export function parseStatusUpdate(payload: any): WebhookStatus[] {
  const statuses: WebhookStatus[] = [];

  try {
    // WhatsApp webhook structure: entry > changes > value > statuses
    if (!payload.entry || !Array.isArray(payload.entry)) {
      return statuses;
    }

    for (const entry of payload.entry) {
      if (!entry.changes || !Array.isArray(entry.changes)) {
        continue;
      }

      for (const change of entry.changes) {
        if (change.field !== 'messages') {
          continue;
        }

        const value = change.value;

        // Parse status updates
        if (value.statuses && Array.isArray(value.statuses)) {
          for (const status of value.statuses) {
            statuses.push({
              id: status.id,
              status: status.status as 'sent' | 'delivered' | 'read' | 'failed',
              timestamp: new Date(parseInt(status.timestamp) * 1000).toISOString(),
              recipient_id: status.recipient_id,
              error: status.errors?.[0] ? {
                code: status.errors[0].code,
                title: status.errors[0].title,
                message: status.errors[0].message,
              } : undefined,
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('Error parsing webhook payload:', error);
  }

  return statuses;
}

/**
 * Update message status in database
 */
export async function updateMessageStatus(
  waMessageId: string,
  status: 'sent' | 'delivered' | 'read' | 'failed',
  timestamp: string,
  error?: { code: number; title: string; message: string }
): Promise<boolean> {
  try {
    const updateData: any = {
      status,
    };

    // Set appropriate timestamp field
    switch (status) {
      case 'sent':
        updateData.sent_at = timestamp;
        break;
      case 'delivered':
        updateData.delivered_at = timestamp;
        break;
      case 'read':
        updateData.read_at = timestamp;
        break;
      case 'failed':
        updateData.failed_at = timestamp;
        if (error) {
          updateData.error_code = error.code;
          updateData.error_message = `${error.title}: ${error.message}`;
        }
        break;
    }

    const { error: dbError } = await supabase
      .from('whatsapp_messages')
      .update(updateData)
      .eq('wa_message_id', waMessageId);

    if (dbError) {
      console.error('Error updating message status:', dbError);
      return false;
    }

    console.log(`✅ Updated message ${waMessageId} to status: ${status}`);
    return true;
  } catch (error) {
    console.error('Failed to update message status:', error);
    return false;
  }
}

/**
 * Log a message to the chat history for AI memory
 */
export async function logChatMessage({
  weddingId,
  guestId,
  role,
  content,
  waMessageId,
  metadata = {}
}: {
  weddingId: string;
  guestId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  waMessageId?: string | null;
  metadata?: any;
}): Promise<void> {
  try {
    const { error } = await (supabase as any)
      .from('whatsapp_chat_history')
      .insert({
        wedding_id: weddingId,
        guest_id: guestId,
        role,
        content,
        wa_message_id: waMessageId,
        metadata,
      });

    if (error) {
      console.error('Error logging chat message:', error);
    }
  } catch (err) {
    console.error('Failed to log chat message:', err);
  }
}

/**
 * Verify WhatsApp webhook signature
 */
export async function verifySignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    // Signature format: "sha256=<hash>"
    if (!signature.startsWith('sha256=')) {
      return false;
    }

    const expectedHash = signature.substring(7);

    // Create HMAC SHA256 hash of payload
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(payload)
    );

    // Convert to hex string
    const hashArray = Array.from(new Uint8Array(signatureBuffer));
    const actualHash = hashArray
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return actualHash === expectedHash;
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
}
