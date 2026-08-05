import { supabase } from './client';
import { guestTags, guestMatchesTags } from '@/lib/utils/guest-tags';

export interface BroadcastDataField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date';
}

export type BroadcastTargetType = 'all' | 'tags' | 'specific';

export interface ConciergeBroadcast {
  id: string;
  wedding_id: string;
  message: string;
  target_type: BroadcastTargetType;
  target_tags: string[];
  target_guest_ids: string[];
  collects_data: boolean;
  data_schema: BroadcastDataField[];
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed' | 'cancelled';
  sent_at: string | null;
  sent_count: number;
  failed_count: number;
  created_by: string | null;
  created_at: string;
  // Scheduling + approval (20260805_scheduled_broadcasts.sql)
  scheduled_at?: string | null;
  send_timezone?: string | null;
  template_key?: string | null;
  enabled?: boolean;
  approved_by?: string | null;
  approved_at?: string | null;
}

export interface BroadcastRecipient {
  id: string;
  broadcast_id: string;
  guest_id: string;
  wedding_id: string;
  delivery_status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  delivered_at: string | null;
  read_at: string | null;
  whatsapp_message_id: string | null;
  error_message: string | null;
  replied_at: string | null;
  reply_text: string | null;
  collected_data: Record<string, any> | null;
  created_at: string;
}

export interface BroadcastWithProgress extends ConciergeBroadcast {
  recipient_count: number;
  replied_count: number;
  delivered_count: number;
}

const sb = () => supabase as any;

export const broadcastsService = {
  async list(weddingId: string): Promise<BroadcastWithProgress[]> {
    const { data, error } = await sb()
      .from('concierge_broadcasts')
      .select('*, concierge_broadcast_recipients(id, delivery_status, replied_at)')
      .eq('wedding_id', weddingId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('broadcasts list error:', error);
      return [];
    }

    return (data || []).map((row: any) => {
      const recipients = row.concierge_broadcast_recipients || [];
      return {
        ...row,
        recipient_count: recipients.length,
        delivered_count: recipients.filter((r: any) =>
          ['delivered', 'read'].includes(r.delivery_status),
        ).length,
        replied_count: recipients.filter((r: any) => !!r.replied_at).length,
      };
    });
  },

  async get(broadcastId: string): Promise<ConciergeBroadcast | null> {
    const { data, error } = await sb()
      .from('concierge_broadcasts')
      .select('*')
      .eq('id', broadcastId)
      .maybeSingle();

    if (error) {
      console.error('broadcast get error:', error);
      return null;
    }
    return data;
  },

  async getRecipients(broadcastId: string): Promise<Array<BroadcastRecipient & { guest_name: string | null; guest_phone: string | null }>> {
    const { data, error } = await sb()
      .from('concierge_broadcast_recipients')
      .select('*, guests(name, phone)')
      .eq('broadcast_id', broadcastId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('recipients list error:', error);
      return [];
    }
    return (data || []).map((r: any) => ({
      ...r,
      guest_name: r.guests?.name ?? null,
      guest_phone: r.guests?.phone ?? null,
    }));
  },

  /**
   * Resolves a target (all/tags/specific) into a list of guest ids
   * that have a phone number attached.
   */
  async resolveTargets(
    weddingSlug: string,
    targetType: BroadcastTargetType,
    targetTags: string[],
    targetGuestIds: string[],
  ): Promise<Array<{ id: string; phone: string; name: string | null; tag: string | null }>> {
    if (targetType === 'specific') {
      if (!targetGuestIds.length) return [];
      const { data, error } = await sb()
        .from('guests')
        .select('id, phone, name, logistics_data')
        .in('id', targetGuestIds)
        .eq('wedding_id', weddingSlug);
      if (error) return [];
      return (data || [])
        .filter((g: any) => g.phone)
        .map((g: any) => ({
          id: g.id,
          phone: g.phone,
          name: g.name,
          tag: guestTags(g.logistics_data)[0] ?? null,
        }));
    }

    const { data, error } = await sb()
      .from('guests')
      .select('id, phone, name, logistics_data')
      .eq('wedding_id', weddingSlug);

    if (error) return [];

    const guests = (data || []).filter((g: any) => g.phone);

    if (targetType === 'tags') {
      if (!targetTags.length) return [];
      return guests
        .filter((g: any) => guestMatchesTags(g.logistics_data, targetTags))
        .map((g: any) => ({ id: g.id, phone: g.phone, name: g.name, tag: guestTags(g.logistics_data)[0] ?? null }));
    }

    return guests.map((g: any) => ({
      id: g.id,
      phone: g.phone,
      name: g.name,
      tag: g.logistics_data?.tag ?? null,
    }));
  },

  /**
   * Finds the most recent pending broadcast recipient row for a guest.
   * Used by the WhatsApp webhook to attribute an incoming reply.
   */
  async findPendingRecipientForGuest(
    guestId: string,
  ): Promise<(BroadcastRecipient & { collects_data: boolean; data_schema: BroadcastDataField[] }) | null> {
    const { data, error } = await sb()
      .from('concierge_broadcast_recipients')
      .select('*, concierge_broadcasts(collects_data, data_schema)')
      .eq('guest_id', guestId)
      .is('replied_at', null)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error || !data || !data.length) return null;
    const row = data[0];
    return {
      ...row,
      collects_data: row.concierge_broadcasts?.collects_data ?? false,
      data_schema: row.concierge_broadcasts?.data_schema ?? [],
    };
  },

  async recordReply(
    recipientId: string,
    replyText: string,
    collectedData: Record<string, any> | null,
  ): Promise<boolean> {
    const { error } = await sb()
      .from('concierge_broadcast_recipients')
      .update({
        replied_at: new Date().toISOString(),
        reply_text: replyText,
        collected_data: collectedData,
      })
      .eq('id', recipientId);

    if (error) {
      console.error('recordReply error:', error);
      return false;
    }
    return true;
  },

  async delete(broadcastId: string): Promise<boolean> {
    const { error } = await sb()
      .from('concierge_broadcasts')
      .delete()
      .eq('id', broadcastId);
    return !error;
  },
};
