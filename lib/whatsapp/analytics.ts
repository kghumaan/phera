/**
 * WhatsApp Analytics
 * Query functions for tracking opt-ins and message engagement
 */

import { supabase } from '../supabase/client';

export interface OptInStats {
  total_opted_in: number;
  total_opted_out: number;
  opt_out_rate: number;
}

export interface MessageStats {
  total_sent: number;
  delivered_count: number;
  read_count: number;
  failed_count: number;
  delivery_rate: number;
  read_rate: number;
}

export interface RecentMessage {
  id: string;
  guest_name: string;
  template_name: string;
  status: string;
  sent_at: string;
  delivered_at: string | null;
  read_at: string | null;
  phone_number: string;
}

/**
 * Get opt-in statistics for a wedding
 */
export async function getOptInStats(weddingId: string): Promise<OptInStats> {
  try {
    // Get total opted in (opted_in = true)
    const { count: optedInCount } = await supabase
      .from('whatsapp_opt_ins')
      .select('*', { count: 'exact', head: true })
      .eq('wedding_id', weddingId)
      .eq('opted_in', true);

    // Get total opted out (opted_in = false)
    const { count: optedOutCount } = await supabase
      .from('whatsapp_opt_ins')
      .select('*', { count: 'exact', head: true })
      .eq('wedding_id', weddingId)
      .eq('opted_in', false);

    const totalOptedIn = optedInCount || 0;
    const totalOptedOut = optedOutCount || 0;
    const total = totalOptedIn + totalOptedOut;
    const optOutRate = total > 0 ? (totalOptedOut / total) * 100 : 0;

    return {
      total_opted_in: totalOptedIn,
      total_opted_out: totalOptedOut,
      opt_out_rate: Math.round(optOutRate * 10) / 10, // Round to 1 decimal
    };
  } catch (error) {
    console.error('Error fetching opt-in stats:', error);
    return {
      total_opted_in: 0,
      total_opted_out: 0,
      opt_out_rate: 0,
    };
  }
}

/**
 * Get message statistics for a wedding
 */
export async function getMessageStats(weddingId: string): Promise<MessageStats> {
  try {
    // Get all messages for this wedding
    const { data: messages, error } = await supabase
      .from('whatsapp_messages')
      .select('status')
      .eq('wedding_id', weddingId);

    if (error) {
      console.error('Error fetching message stats:', error);
      throw error;
    }

    const totalSent = messages?.length || 0;
    const deliveredCount = messages?.filter(m => m.status === 'delivered' || m.status === 'read').length || 0;
    const readCount = messages?.filter(m => m.status === 'read').length || 0;
    const failedCount = messages?.filter(m => m.status === 'failed').length || 0;

    const deliveryRate = totalSent > 0 ? (deliveredCount / totalSent) * 100 : 0;
    const readRate = totalSent > 0 ? (readCount / totalSent) * 100 : 0;

    return {
      total_sent: totalSent,
      delivered_count: deliveredCount,
      read_count: readCount,
      failed_count: failedCount,
      delivery_rate: Math.round(deliveryRate * 10) / 10,
      read_rate: Math.round(readRate * 10) / 10,
    };
  } catch (error) {
    console.error('Error fetching message stats:', error);
    return {
      total_sent: 0,
      delivered_count: 0,
      read_count: 0,
      failed_count: 0,
      delivery_rate: 0,
      read_rate: 0,
    };
  }
}

/**
 * Get recent messages with guest information
 */
export async function getRecentMessages(
  weddingId: string,
  limit: number = 20
): Promise<RecentMessage[]> {
  try {
    const { data: messages, error } = await supabase
      .from('whatsapp_messages')
      .select(`
        id,
        template_name,
        status,
        sent_at,
        delivered_at,
        read_at,
        phone_number,
        guest_id,
        guests (
          name
        )
      `)
      .eq('wedding_id', weddingId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent messages:', error);
      throw error;
    }

    return (messages || []).map(msg => ({
      id: msg.id,
      guest_name: (msg.guests as any)?.name || 'Unknown',
      template_name: msg.template_name || 'N/A',
      status: msg.status || 'unknown',
      sent_at: msg.sent_at || '',
      delivered_at: msg.delivered_at,
      read_at: msg.read_at,
      phone_number: msg.phone_number,
    }));
  } catch (error) {
    console.error('Error fetching recent messages:', error);
    return [];
  }
}
