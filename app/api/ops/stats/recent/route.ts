import { NextResponse } from 'next/server';
import { getOpsSupabaseAdmin } from '@/lib/ops/supabase-admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const supabase = getOpsSupabaseAdmin();

  const [
    guests,
    rsvps,
    outreach,
    whatsapp,
    vendorMsgs,
    escalations,
    broadcasts,
  ] = await Promise.all([
    supabase
      .from('guests')
      .select('id, name, email, phone, wedding_id, avatar_color, initials, avatar_svg, contact_type, outreach_status, created_at')
      .order('created_at', { ascending: false })
      .limit(25),
    supabase
      .from('rsvps')
      .select('id, guest_id, wedding_id, event_id, attending, guest_count, plus_one, created_at')
      .order('created_at', { ascending: false })
      .limit(25),
    supabase
      .from('outreach_events')
      .select('id, wedding_id, guest_id, event_type, template_name, channel, created_at')
      .order('created_at', { ascending: false })
      .limit(25),
    supabase
      .from('whatsapp_messages')
      .select('id, wedding_id, guest_id, phone_number, template_name, message_type, status, sent_at, created_at, error_message')
      .order('created_at', { ascending: false })
      .limit(25),
    supabase
      .from('vendor_messages')
      .select('id, wedding_id, sender_name, sender_type, content, message_timestamp, created_at')
      .order('created_at', { ascending: false })
      .limit(25),
    supabase
      .from('outreach_escalations')
      .select('id, wedding_id, guest_id, reason, status, created_at, resolved_at')
      .order('created_at', { ascending: false })
      .limit(25),
    supabase
      .from('concierge_broadcasts')
      .select('id, wedding_id, message, target_type, status, sent_count, failed_count, sent_at, created_at')
      .order('created_at', { ascending: false })
      .limit(25),
  ]);

  return NextResponse.json({
    recentGuests: guests.data ?? [],
    recentRsvps: rsvps.data ?? [],
    recentOutreach: outreach.data ?? [],
    recentWhatsapp: whatsapp.data ?? [],
    recentVendorMessages: vendorMsgs.data ?? [],
    recentEscalations: escalations.data ?? [],
    recentBroadcasts: broadcasts.data ?? [],
  });
}
