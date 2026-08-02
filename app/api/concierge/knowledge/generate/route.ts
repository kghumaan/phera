import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedClient } from '@/lib/utils/auth-helpers';
import { verifyWeddingAccess } from '@/lib/utils/verify-wedding-access';
import { generateKnowledgeEntries } from '@/lib/concierge/generate-knowledge';

export async function POST(request: NextRequest) {
  try {
    const { supabase: userSupabase, user } = await getAuthenticatedClient();
    if (!userSupabase || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { weddingId } = body;

    if (!weddingId) {
      return NextResponse.json({ error: 'Missing weddingId' }, { status: 400 });
    }

    const hasAccess = await verifyWeddingAccess(userSupabase, user.id, weddingId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const result = await generateKnowledgeEntries(weddingId);

    if (!result.canGenerate) {
      return NextResponse.json(
        { error: 'insufficient_data', missing: result.missing },
        { status: 400 }
      );
    }

    // Use service role to bypass RLS for insert/delete
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Delete existing auto-generated entries
    await (supabase as any)
      .from('concierge_knowledge_base')
      .delete()
      .eq('wedding_id', weddingId)
      .eq('source', 'auto_generated');

    // Get current max order_index for manual entries
    const { data: existing } = await (supabase as any)
      .from('concierge_knowledge_base')
      .select('order_index')
      .eq('wedding_id', weddingId)
      .order('order_index', { ascending: false })
      .limit(1);

    const startIndex = (existing?.[0]?.order_index ?? -1) + 1;
    const now = new Date().toISOString();

    const rows = result.entries.map((entry, i) => ({
      wedding_id: weddingId,
      title: entry.title,
      content: entry.content,
      category: entry.category,
      source: 'auto_generated',
      generated_at: now,
      order_index: startIndex + i,
    }));

    if (rows.length > 0) {
      const { error } = await (supabase as any)
        .from('concierge_knowledge_base')
        .insert(rows);

      if (error) throw error;
    }

    // Fetch the inserted entries to return them
    const { data: entries } = await (supabase as any)
      .from('concierge_knowledge_base')
      .select('*')
      .eq('wedding_id', weddingId)
      .eq('source', 'auto_generated')
      .order('order_index', { ascending: true });

    return NextResponse.json({ entries: entries || [], count: entries?.length || 0 });
  } catch (error: any) {
    console.error('Error generating knowledge base:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
