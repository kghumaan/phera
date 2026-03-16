import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedClient } from '@/lib/utils/auth-helpers';
import { verifyWeddingAccess } from '@/lib/utils/verify-wedding-access';

/**
 * GET /api/concierge/knowledge?weddingId=xxx
 * List all knowledge base entries for a wedding
 */
export async function GET(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient();
    if (!supabase || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const weddingId = request.nextUrl.searchParams.get('weddingId');
    if (!weddingId) {
      return NextResponse.json({ error: 'Missing weddingId' }, { status: 400 });
    }

    const hasAccess = await verifyWeddingAccess(supabase, user.id, weddingId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: entries, error } = await (supabase as any)
      .from('concierge_knowledge_base')
      .select('*')
      .eq('wedding_id', weddingId)
      .order('order_index', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ entries: entries || [] });
  } catch (error: any) {
    console.error('Error fetching knowledge base:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/concierge/knowledge
 * Create a new knowledge base entry
 */
export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient();
    if (!supabase || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { weddingId, title, content, category } = body;

    if (!weddingId || !title || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const hasAccess = await verifyWeddingAccess(supabase, user.id, weddingId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get next order_index
    const { data: existing } = await (supabase as any)
      .from('concierge_knowledge_base')
      .select('order_index')
      .eq('wedding_id', weddingId)
      .order('order_index', { ascending: false })
      .limit(1);

    const nextOrder = (existing?.[0]?.order_index ?? -1) + 1;

    const { data: entry, error } = await (supabase as any)
      .from('concierge_knowledge_base')
      .insert({
        wedding_id: weddingId,
        title,
        content,
        category: category || 'other',
        order_index: nextOrder,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ entry });
  } catch (error: any) {
    console.error('Error creating knowledge entry:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/concierge/knowledge
 * Update an existing knowledge base entry
 */
export async function PUT(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient();
    if (!supabase || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, weddingId, title, content, category, is_active } = body;

    if (!id || !weddingId) {
      return NextResponse.json({ error: 'Missing id or weddingId' }, { status: 400 });
    }

    const hasAccess = await verifyWeddingAccess(supabase, user.id, weddingId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updateData: any = { updated_at: new Date().toISOString() };
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (category !== undefined) updateData.category = category;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data: entry, error } = await (supabase as any)
      .from('concierge_knowledge_base')
      .update(updateData)
      .eq('id', id)
      .eq('wedding_id', weddingId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ entry });
  } catch (error: any) {
    console.error('Error updating knowledge entry:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/concierge/knowledge?id=xxx&weddingId=xxx
 * Delete a knowledge base entry
 */
export async function DELETE(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient();
    if (!supabase || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = request.nextUrl.searchParams.get('id');
    const weddingId = request.nextUrl.searchParams.get('weddingId');

    if (!id || !weddingId) {
      return NextResponse.json({ error: 'Missing id or weddingId' }, { status: 400 });
    }

    const hasAccess = await verifyWeddingAccess(supabase, user.id, weddingId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { error } = await (supabase as any)
      .from('concierge_knowledge_base')
      .delete()
      .eq('id', id)
      .eq('wedding_id', weddingId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting knowledge entry:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
