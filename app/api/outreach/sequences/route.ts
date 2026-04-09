import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/**
 * GET /api/outreach/sequences?weddingId=<slug>
 *
 * Returns pending outreach sequences + open coordination issues as action items.
 */
export async function GET(request: NextRequest) {
  const weddingId = request.nextUrl.searchParams.get('weddingId');
  if (!weddingId) {
    return NextResponse.json({ error: 'weddingId is required' }, { status: 400 });
  }

  const sequences: any[] = [];

  // Try outreach_sequences table
  try {
    const { data, error } = await (supabase as any)
      .from('outreach_sequences')
      .select('*')
      .eq('wedding_id', weddingId)
      .in('status', ['pending', 'scheduled'])
      .order('scheduled_at', { ascending: true });

    if (!error && data) sequences.push(...data);
  } catch {}

  // Also surface open coordination issues as action items
  // Convert them to a sequence-like shape so ActionQueue can render them
  try {
    const { data: issues, error } = await (supabase as any)
      .from('coordination_issues')
      .select('id, wedding_id, category, title, priority, status, created_at')
      .eq('wedding_id', weddingId)
      .in('status', ['open', 'in_progress'])
      .order('created_at', { ascending: true });

    if (!error && issues) {
      for (const issue of issues) {
        sequences.push({
          id: `issue-${issue.id}`,
          wedding_id: issue.wedding_id,
          sequence_type: `${issue.priority}_${issue.category}`,
          template_name: issue.title,
          days_before_wedding: 0,
          status: 'pending',
          scheduled_at: issue.created_at,
          sent_at: null,
          target_statuses: [issue.priority],
          created_at: issue.created_at,
          _is_issue: true,
          _priority: issue.priority,
          _category: issue.category,
          _title: issue.title,
        });
      }
    }
  } catch {}

  return NextResponse.json({ sequences });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { weddingId, weddingDate } = body;

    if (!weddingId || !weddingDate) {
      return NextResponse.json({ error: 'weddingId and weddingDate are required' }, { status: 400 });
    }

    // Try to use outreach service
    try {
      const { outreachService } = await import('@/lib/supabase/outreach-service');
      const sequences = await outreachService.generateSequence(weddingId, new Date(weddingDate));
      return NextResponse.json({ sequences });
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
