import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateAIResponse, lastProvider } from '@/lib/whatsapp/ai-handler';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/**
 * POST /api/concierge-test — Simulate a guest message through the full AI pipeline
 * Returns the concierge response + updated guest state for the test harness UI
 */
export async function POST(request: NextRequest) {
  try {
    const { weddingId, weddingSlug, guestId, guestName, message } = await request.json();

    if (!weddingId || !guestId || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Call the same handler the WhatsApp webhook uses
    const response = await generateAIResponse({
      weddingId,
      weddingSlug: weddingSlug || weddingId,
      guestId,
      guestName: guestName || 'Test Guest',
      userMessage: message,
    });

    // Fetch updated guest state after tool execution
    // Use safe queries — tables/columns may not exist yet
    const safe = async (fn: () => PromiseLike<any>) => {
      try {
        const r = await fn();
        return r.error ? null : r.data;
      } catch {
        return null;
      }
    };

    const [guestData, flights, hotels, visas, issues] = await Promise.all([
      safe(() => supabase.from('guests').select('conversation_state, conversation_topic, ai_notes' as any).eq('id', guestId).single()),
      safe(() => supabase.from('guest_flights').select('*').eq('guest_id', guestId).eq('wedding_id', weddingId)),
      safe(() => (supabase as any).from('guest_hotels').select('*').eq('guest_id', guestId).eq('wedding_id', weddingId)),
      safe(() => (supabase as any).from('guest_visas').select('*').eq('guest_id', guestId).eq('wedding_id', weddingId)),
      safe(() => (supabase as any).from('coordination_issues').select('*').eq('guest_id', guestId).eq('wedding_id', weddingId).order('created_at', { ascending: false }).limit(10)),
    ]);

    return NextResponse.json({
      response,
      provider: lastProvider,
      guestState: {
        conversation_state: guestData?.conversation_state || null,
        conversation_topic: guestData?.conversation_topic || null,
        ai_notes: guestData?.ai_notes || null,
      },
      flights: flights || [],
      hotels: hotels || [],
      visas: visas || [],
      issues: issues || [],
    });
  } catch (error: any) {
    console.error('[concierge-test] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/concierge-test — Reset a test guest's concierge data
 */
export async function DELETE(request: NextRequest) {
  try {
    const { guestId, weddingId } = await request.json();

    if (!guestId) {
      return NextResponse.json({ error: 'Missing guestId' }, { status: 400 });
    }

    // Clear guest concierge fields
    // Best-effort clear — columns/tables may not exist
    const safeDo = async (fn: () => PromiseLike<any>) => { try { await fn(); } catch {} };

    await safeDo(() =>
      supabase.from('guests').update({ conversation_state: null, conversation_topic: null, ai_notes: null, last_inbound_at: null, last_outbound_at: null, unread_count: 0 } as any).eq('id', guestId)
    );

    await Promise.all([
      safeDo(() => supabase.from('guest_flights').delete().eq('guest_id', guestId)),
      safeDo(() => (supabase as any).from('guest_hotels').delete().eq('guest_id', guestId)),
      safeDo(() => (supabase as any).from('guest_visas').delete().eq('guest_id', guestId)),
      safeDo(() => (supabase as any).from('coordination_issues').delete().eq('guest_id', guestId)),
      ...(weddingId ? [safeDo(() => (supabase as any).from('whatsapp_chat_history').delete().eq('guest_id', guestId).eq('wedding_id', weddingId))] : []),
    ]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[concierge-test] Reset error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
