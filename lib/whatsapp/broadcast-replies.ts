import { createClient } from '@supabase/supabase-js';
import { extractBroadcastData } from './extract-broadcast-data';

/**
 * When a guest replies to WhatsApp, check if they have a pending broadcast
 * recipient row and attribute the message to it.
 *
 * For broadcasts with `collects_data=true` and a non-empty data_schema,
 * we run an AI extraction pass (Gemini Flash → DeepSeek fallback) that
 * maps the raw reply into the schema's keys. Raw reply_text is always
 * stored alongside for auditability.
 */
export async function recordBroadcastReplyForGuest(guestId: string, replyText: string): Promise<void> {
  if (!replyText.trim()) return;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return;

  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

  // Find most recent pending recipient for this guest.
  const { data, error } = await supabase
    .from('concierge_broadcast_recipients')
    .select('id, broadcast_id, concierge_broadcasts(collects_data, data_schema)')
    .eq('guest_id', guestId)
    .is('replied_at', null)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error || !data || !data.length) return;

  const row: any = data[0];
  const collectsData = row.concierge_broadcasts?.collects_data ?? false;
  const schema: Array<{ key: string; label: string; type: string }> = row.concierge_broadcasts?.data_schema ?? [];

  let collected: Record<string, any> | null = null;
  if (collectsData && schema.length > 0) {
    if (schema.length === 1) {
      // Single-field schema → trivially map the whole reply to that key.
      collected = { [schema[0].key]: replyText.trim() };
    } else {
      // Multi-field schema → run the AI extractor.
      try {
        collected = await extractBroadcastData(replyText.trim(), schema);
      } catch (err) {
        console.error('[broadcast-replies] extract failed:', err);
      }
    }
  }

  await supabase
    .from('concierge_broadcast_recipients')
    .update({
      replied_at: new Date().toISOString(),
      reply_text: replyText.trim(),
      collected_data: collected,
    })
    .eq('id', row.id);
}
