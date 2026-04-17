import { createClient } from '@supabase/supabase-js';

/**
 * When a guest replies to WhatsApp, check if they have a pending broadcast
 * recipient row and attribute the message to it.
 *
 * For broadcasts with `collects_data=true`, we store the raw reply under
 * `reply_text` for now. Structured data extraction (mapping free-form
 * reply → schema fields) is intentionally left as a follow-up — a
 * dedicated AI pass can parse reply_text against data_schema later.
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

  // Naive extraction: when there is exactly one schema field, store the
  // whole reply under that key. Otherwise leave collected_data null
  // until a proper AI parser runs.
  let collected: Record<string, any> | null = null;
  if (collectsData && schema.length === 1) {
    collected = { [schema[0].key]: replyText.trim() };
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
