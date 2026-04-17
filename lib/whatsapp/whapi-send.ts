import { whapiClient } from '@/lib/vendors/whapi-client';

/**
 * Phera's outbound WhatsApp path: Whapi.Cloud only.
 *
 * We do NOT use Meta WhatsApp Business Cloud API for outbound. Every
 * outbound text — bot replies, broadcasts, reminders — goes through our
 * Whapi-connected SIM so the sender number is consistent and Meta's
 * template / 24-hr window restrictions don't apply.
 *
 * Phone is normalized to digits and formatted as a Whapi chat id.
 */
export async function sendWhapiText(
  phone: string,
  body: string,
): Promise<{ id: string | null; error?: string }> {
  const digits = (phone || '').replace(/\D/g, '');
  if (!digits) return { id: null, error: 'Invalid phone' };
  const chatId = `${digits}@s.whatsapp.net`;
  try {
    const resp = await whapiClient.sendMessage(chatId, body);
    const id = (resp as any)?.message?.id ?? null;
    return { id };
  } catch (err: any) {
    return { id: null, error: err?.message || 'Whapi send failed' };
  }
}
