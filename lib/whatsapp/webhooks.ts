/**
 * WhatsApp Webhook Utilities
 * Handles parsing and processing of WhatsApp webhook payloads
 */

import { supabase } from '../supabase/client';

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
 * Verify WhatsApp webhook signature
 * Meta signs webhook payloads with SHA256 HMAC
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
