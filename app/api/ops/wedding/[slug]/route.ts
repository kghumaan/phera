import { NextResponse } from 'next/server';
import { getOpsSupabaseAdmin } from '@/lib/ops/supabase-admin';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const supabase = getOpsSupabaseAdmin();

  const { data: wedding } = await supabase
    .from('weddings')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  const { data: guests } = await supabase
    .from('guests')
    .select('id, name, email, phone, avatar_color, initials, avatar_svg, outreach_status, contact_type, created_at')
    .eq('wedding_id', slug)
    .order('created_at', { ascending: false })
    .limit(50);

  const { count: guestsTotal } = await supabase
    .from('guests')
    .select('*', { count: 'exact', head: true })
    .eq('wedding_id', slug);

  const { count: rsvpsTotal } = await supabase
    .from('rsvps')
    .select('*', { count: 'exact', head: true })
    .eq('wedding_id', slug);

  const { count: outreachTotal } = await supabase
    .from('outreach_events')
    .select('*', { count: 'exact', head: true })
    .eq('wedding_id', slug);

  const { count: whatsappTotal } = await supabase
    .from('whatsapp_messages')
    .select('*', { count: 'exact', head: true })
    .eq('wedding_id', slug);

  const { data: recentOutreach } = await supabase
    .from('outreach_events')
    .select('id, event_type, template_name, channel, created_at')
    .eq('wedding_id', slug)
    .order('created_at', { ascending: false })
    .limit(15);

  return NextResponse.json({
    slug,
    wedding: wedding ?? null,
    counts: {
      guests: guestsTotal ?? 0,
      rsvps: rsvpsTotal ?? 0,
      outreachEvents: outreachTotal ?? 0,
      whatsappMessages: whatsappTotal ?? 0,
    },
    recentGuests: guests ?? [],
    recentOutreach: recentOutreach ?? [],
  });
}
