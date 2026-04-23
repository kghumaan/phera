import { getOpsSupabaseAdmin } from './supabase-admin';

/**
 * Tables keyed on `guest_id` that must be cleared before deleting the guest row.
 * Excludes views (rsvps_with_names).
 */
const GUEST_CHILD_TABLES = [
  'comments',
  'concierge_broadcast_recipients',
  'coordination_issues',
  'guest_checklist_items',
  'guest_flights',
  'guest_hotels',
  'guest_visas',
  'outreach_escalations',
  'outreach_events',
  'rsvps',
  'transportation_reservations',
  'whatsapp_channel_clicks',
  'whatsapp_chat_history',
  'whatsapp_messages',
  'whatsapp_opt_ins',
];

export async function previewGuestDelete(guestId: string): Promise<{
  guestId: string;
  exists: boolean;
  rows: Array<{ table: string; count: number }>;
  total: number;
}> {
  const supabase = getOpsSupabaseAdmin();
  const { data: g } = await supabase
    .from('guests')
    .select('id, name, email, wedding_id')
    .eq('id', guestId)
    .maybeSingle();

  const rows: Array<{ table: string; count: number }> = [];
  for (const t of GUEST_CHILD_TABLES) {
    const { count } = await supabase
      .from(t)
      .select('*', { count: 'exact', head: true })
      .eq('guest_id', guestId);
    rows.push({ table: t, count: count ?? 0 });
  }
  rows.push({ table: 'guests', count: g ? 1 : 0 });
  const total = rows.reduce((a, r) => a + r.count, 0);
  return { guestId, exists: !!g, rows, total };
}

export async function deleteGuest(guestId: string): Promise<{
  guestId: string;
  deleted: Array<{ table: string; deleted: number; error?: string }>;
}> {
  const supabase = getOpsSupabaseAdmin();
  const results: Array<{ table: string; deleted: number; error?: string }> = [];

  for (const t of GUEST_CHILD_TABLES) {
    try {
      const { count, error } = await supabase
        .from(t)
        .delete({ count: 'exact' })
        .eq('guest_id', guestId);
      if (error) throw error;
      results.push({ table: t, deleted: count ?? 0 });
    } catch (e) {
      results.push({ table: t, deleted: 0, error: (e as Error).message });
    }
  }

  try {
    const { count, error } = await supabase
      .from('guests')
      .delete({ count: 'exact' })
      .eq('id', guestId);
    if (error) throw error;
    results.push({ table: 'guests', deleted: count ?? 0 });
  } catch (e) {
    results.push({ table: 'guests', deleted: 0, error: (e as Error).message });
  }

  return { guestId, deleted: results };
}
