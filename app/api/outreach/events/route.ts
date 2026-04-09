import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/**
 * GET /api/outreach/events?weddingId=<slug>
 *
 * Returns recent activity events. Merges outreach_events (if exists)
 * with coordination_issues to provide a unified activity feed.
 */
export async function GET(request: NextRequest) {
  const weddingId = request.nextUrl.searchParams.get('weddingId');
  const guestId = request.nextUrl.searchParams.get('guestId');
  const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50', 10);

  if (!weddingId) {
    return NextResponse.json({ error: 'weddingId is required' }, { status: 400 });
  }

  const events: any[] = [];

  // Try outreach_events table
  try {
    let query = (supabase as any)
      .from('outreach_events')
      .select('*')
      .eq('wedding_id', weddingId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (guestId) query = query.eq('guest_id', guestId);

    const { data, error } = await query;
    if (!error && data) {
      events.push(...data.map((e: any) => ({
        ...e,
        _source: 'outreach_events',
      })));
    }
  } catch {}

  // Also pull coordination_issues as activity events
  try {
    let query = (supabase as any)
      .from('coordination_issues')
      .select('id, wedding_id, guest_id, category, title, description, priority, status, source, created_at')
      .eq('wedding_id', weddingId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (guestId) query = query.eq('guest_id', guestId);

    const { data, error } = await query;
    if (!error && data) {
      events.push(...data.map((issue: any) => ({
        id: issue.id,
        wedding_id: issue.wedding_id,
        guest_id: issue.guest_id,
        event_type: 'issue_created',
        template_name: null,
        channel: issue.source || 'system',
        details: {
          category: issue.category,
          title: issue.title,
          description: issue.description,
          priority: issue.priority,
          status: issue.status,
        },
        created_at: issue.created_at,
        _source: 'coordination_issues',
      })));
    }
  } catch {}

  // Also pull recent RSVPs as activity
  try {
    const { data: guests } = await supabase
      .from('guests')
      .select('id')
      .eq('wedding_id', weddingId);

    const guestIds = (guests || []).map((g: any) => g.id);
    if (guestIds.length > 0) {
      let query = supabase
        .from('rsvps')
        .select('id, guest_id, attending, guest_count, created_at')
        .in('guest_id', guestId ? [guestId] : guestIds)
        .order('created_at', { ascending: false })
        .limit(limit);

      const { data, error } = await query;
      if (!error && data) {
        events.push(...data.map((r: any) => ({
          id: r.id,
          wedding_id: weddingId,
          guest_id: r.guest_id,
          event_type: 'rsvp_received',
          template_name: null,
          channel: 'system',
          details: {
            attending: r.attending,
            guest_count: r.guest_count,
          },
          created_at: r.created_at,
          _source: 'rsvps',
        })));
      }
    }
  } catch {}

  // Sort all events by created_at descending and limit
  events.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return NextResponse.json({ events: events.slice(0, limit) });
}
