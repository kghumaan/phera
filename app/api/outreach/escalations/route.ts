import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET(request: NextRequest) {
  const weddingId = request.nextUrl.searchParams.get('weddingId');
  if (!weddingId) {
    return NextResponse.json({ error: 'weddingId is required' }, { status: 400 });
  }

  // Try coordination_issues first, fall back to outreach_escalations
  try {
    const { data, error } = await (supabase as any)
      .from('coordination_issues')
      .select('*')
      .eq('wedding_id', weddingId)
      .order('created_at', { ascending: false });

    if (!error) return NextResponse.json({ escalations: data || [] });
  } catch {}

  try {
    const { data } = await (supabase as any)
      .from('outreach_escalations')
      .select('*')
      .eq('wedding_id', weddingId)
      .order('created_at', { ascending: false });

    return NextResponse.json({ escalations: data || [] });
  } catch {
    return NextResponse.json({ escalations: [] });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { issueId, status, resolution_notes, action, escalationId, resolvedBy } = body;

    // Handle coordination_issues resolve
    if (issueId) {
      const update: any = { status: status || 'resolved', resolved_at: new Date().toISOString() };
      if (resolution_notes) update.resolution_notes = resolution_notes;

      const { error } = await (supabase as any)
        .from('coordination_issues')
        .update(update)
        .eq('id', issueId);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    // Legacy: outreach_escalations resolve
    if (escalationId && action === 'resolve') {
      const { error } = await (supabase as any)
        .from('outreach_escalations')
        .update({ status: 'resolved', resolved_by: resolvedBy, resolved_at: new Date().toISOString() })
        .eq('id', escalationId);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'issueId or escalationId required' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/outreach/escalations — Bulk dismiss all open issues for a wedding
 */
export async function DELETE(request: NextRequest) {
  try {
    const { weddingId } = await request.json();
    if (!weddingId) {
      return NextResponse.json({ error: 'weddingId required' }, { status: 400 });
    }

    let count = 0;
    try {
      const { data } = await (supabase as any)
        .from('coordination_issues')
        .update({ status: 'dismissed' })
        .eq('wedding_id', weddingId)
        .in('status', ['open', 'in_progress'])
        .select('id');

      count = data?.length || 0;
    } catch {}

    return NextResponse.json({ success: true, dismissed: count });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
