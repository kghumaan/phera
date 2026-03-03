import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

async function getAuthenticatedClient() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch {}
        },
      },
    }
  );
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { supabase: null, user: null };
  return { supabase, user };
}

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
