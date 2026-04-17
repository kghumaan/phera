/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@supabase/supabase-js';
import { extractBroadcastData } from './extract-broadcast-data';

interface ReplyContext {
  mediaUrl?: string | null;
  mediaType?: string | null;
}

/**
 * Aggregation window — any incoming message from a guest within this many
 * minutes of their most recent broadcast recipient row gets merged into
 * that row (reply_text appended, collected_data merged) rather than
 * creating a new orphaned response. Covers the common pattern where a
 * guest replies across several rapid WhatsApp messages (text + image).
 */
const AGGREGATION_WINDOW_MINUTES = 30;

/**
 * Heuristic: does this schema field want a media URL rather than text?
 * Looks at the field `type` (not currently constrained to text/image) and
 * falls back to keywords in key/label so admin-authored schemas work.
 */
function fieldExpectsMedia(field: { key: string; label: string; type: string }): boolean {
  const t = (field.type || '').toLowerCase();
  if (t === 'image' || t === 'photo' || t === 'file' || t === 'document') return true;
  const hint = `${field.key} ${field.label}`.toLowerCase();
  return /image|photo|picture|passport|doc|scan|id|visa|ticket|upload/.test(hint);
}

export async function recordBroadcastReplyForGuest(
  guestId: string,
  replyText: string,
  context?: ReplyContext,
): Promise<void> {
  const trimmed = (replyText || '').trim();
  const mediaUrl = context?.mediaUrl ?? null;
  const mediaType = context?.mediaType ?? null;
  if (!trimmed && !mediaUrl) return;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return;

  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

  // Find the most recent broadcast recipient for this guest within the
  // aggregation window. Includes already-replied rows so follow-up
  // messages (text after image, or vice versa) merge in.
  const windowIso = new Date(Date.now() - AGGREGATION_WINDOW_MINUTES * 60_000).toISOString();

  const { data, error } = await supabase
    .from('concierge_broadcast_recipients')
    .select('id, broadcast_id, reply_text, collected_data, concierge_broadcasts(collects_data, data_schema)')
    .eq('guest_id', guestId)
    .gte('created_at', windowIso)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error || !data || !data.length) return;

  const row: any = data[0];
  const collectsData: boolean = row.concierge_broadcasts?.collects_data ?? false;
  const schema: Array<{ key: string; label: string; type: string }> =
    row.concierge_broadcasts?.data_schema ?? [];

  // Start from whatever we already collected for this broadcast recipient.
  const merged: Record<string, any> = { ...(row.collected_data || {}) };

  // 1) Media → fill any still-empty schema field that expects media.
  if (mediaUrl && collectsData && schema.length > 0) {
    const mediaField = schema.find(
      (f) => fieldExpectsMedia(f) && (merged[f.key] == null || merged[f.key] === ''),
    );
    if (mediaField) {
      merged[mediaField.key] = mediaUrl;
    }
  }

  // 2) Text → AI extract what we can map to remaining schema keys.
  if (trimmed && collectsData && schema.length > 0) {
    // Only ask the AI for keys we still don't have.
    const missingSchema = schema.filter(
      (f) => merged[f.key] == null || merged[f.key] === '',
    );
    if (missingSchema.length > 0) {
      try {
        const extracted = await extractBroadcastData(trimmed, missingSchema);
        if (extracted) {
          for (const [k, v] of Object.entries(extracted)) {
            if (v != null && String(v).trim() !== '') merged[k] = v;
          }
        } else if (missingSchema.length === 1) {
          // Single unfilled field + AI failed → last-ditch: raw reply value.
          merged[missingSchema[0].key] = trimmed;
        }
      } catch (err) {
        console.error('[broadcast-replies] extract failed:', err);
      }
    }
  }

  // 3) Append this message to reply_text so the Reply column shows the
  //    full conversation when a guest answered across several messages.
  const existingReply = (row.reply_text || '').trim();
  const newSegment = trimmed || (mediaType ? `[${mediaType}]` : '');
  const nextReplyText = existingReply
    ? `${existingReply}\n${newSegment}`
    : newSegment;

  // Only mark replied_at on the first message — later merges preserve it.
  const update: Record<string, any> = {
    reply_text: nextReplyText,
    collected_data: Object.keys(merged).length > 0 ? merged : null,
  };
  // Use a separate select to know if replied_at was already set.
  const { data: existingRow } = await supabase
    .from('concierge_broadcast_recipients')
    .select('replied_at')
    .eq('id', row.id)
    .maybeSingle();
  if (!existingRow?.replied_at) {
    update.replied_at = new Date().toISOString();
  }

  await supabase
    .from('concierge_broadcast_recipients')
    .update(update)
    .eq('id', row.id);
}
