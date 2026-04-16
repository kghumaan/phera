import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedClient } from '@/lib/utils/auth-helpers';
import { verifyWeddingAccess } from '@/lib/utils/verify-wedding-access';

/**
 * GET /api/vendors/insights?weddingId=xxx
 * List all insights for a wedding, optionally filtered
 */
export async function GET(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient();
    if (!supabase || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const weddingId = request.nextUrl.searchParams.get('weddingId');
    const type = request.nextUrl.searchParams.get('type');
    const completed = request.nextUrl.searchParams.get('completed');

    if (!weddingId) {
      return NextResponse.json({ error: 'Missing weddingId' }, { status: 400 });
    }

    const hasAccess = await verifyWeddingAccess(supabase, user.id, weddingId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let query = supabase
      .from('vendor_insights')
      .select('*, vendors(name, category)')
      .eq('wedding_id', weddingId)
      .order('created_at', { ascending: false });

    if (type) query = query.eq('insight_type', type);
    if (completed !== null && completed !== undefined) {
      query = query.eq('is_completed', completed === 'true');
    }

    const { data: insights, error } = await query;
    if (error) throw error;

    return NextResponse.json({ insights: insights || [] });
  } catch (error: any) {
    console.error('Error listing insights:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/vendors/insights
 * Update an insight (mark complete, change priority)
 */
export async function PATCH(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient();
    if (!supabase || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { insightId, is_completed, priority } = body;

    if (!insightId) {
      return NextResponse.json({ error: 'Missing insightId' }, { status: 400 });
    }

    // Look up insight to verify wedding access
    const { data: existingInsight } = await supabase
      .from('vendor_insights')
      .select('wedding_id')
      .eq('id', insightId)
      .single();
    if (existingInsight) {
      const hasAccess = await verifyWeddingAccess(supabase, user.id, existingInsight.wedding_id);
      if (!hasAccess) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (is_completed !== undefined) updates.is_completed = is_completed;
    if (priority !== undefined) updates.priority = priority;

    const { data: insight, error } = await supabase
      .from('vendor_insights')
      .update(updates)
      .eq('id', insightId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ insight });
  } catch (error: any) {
    console.error('Error updating insight:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
