import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedClient } from '@/lib/utils/auth-helpers';
import { verifyWeddingAccess } from '@/lib/utils/verify-wedding-access';
import { GOALS_TITLE } from '@/lib/agent/tools/goals';
import { HIDDEN_KICKOFF_PREFIX } from '@/lib/agent/message-prefixes';

export const runtime = 'nodejs';

/**
 * GET /api/agent/conversations?weddingSlug=...
 * Returns the latest conversation for the wedding (if any) with its messages,
 * so the chat page can restore history on load. Also returns `hasData` — true
 * if the couple has already provided anything (chat history, planning goals,
 * guests, or a date/venue) — so the planner can decide whether to resume
 * ("let's pick up where we left off") or start a fresh onboarding.
 */
export async function GET(request: NextRequest) {
  const { supabase, user } = await getAuthenticatedClient();
  if (!supabase || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const weddingSlug = request.nextUrl.searchParams.get('weddingSlug');
  if (!weddingSlug) {
    return NextResponse.json({ error: 'Missing weddingSlug' }, { status: 400 });
  }

  const { data: wedding } = await supabase
    .from('weddings')
    .select('id, slug, wedding_date, venue_name')
    .eq('slug', weddingSlug)
    .single();
  if (!wedding) {
    return NextResponse.json({ error: 'Wedding not found' }, { status: 404 });
  }
  const hasAccess = await verifyWeddingAccess(supabase, user.id, wedding.id);
  if (!hasAccess) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Mirrors the snapshot's TBD placeholder conventions (epoch date / "Venue TBD").
  const dateSet = !!wedding.wedding_date && new Date(wedding.wedding_date).getTime() > 0;
  const venueSet = !!wedding.venue_name && !/\bTBD\b/i.test(wedding.venue_name);

  const [conversationRes, goalsRes, guestCountRes] = await Promise.all([
    supabase
      .from('agent_conversations')
      .select('id, created_at, last_message_at')
      .eq('wedding_id', wedding.slug)
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('agent_knowledge')
      .select('id')
      .eq('wedding_id', wedding.slug)
      .eq('scope', 'wedding')
      .eq('title', GOALS_TITLE)
      .maybeSingle(),
    supabase.from('guests').select('id', { count: 'exact', head: true }).eq('wedding_id', wedding.slug),
  ]);
  const conversation = conversationRes.data;
  const baseHasData = dateSet || venueSet || !!goalsRes.data || (guestCountRes.count ?? 0) > 0;

  if (!conversation) {
    return NextResponse.json({ conversation: null, messages: [], pendingActions: [], hasData: baseHasData });
  }

  const [{ data: messages }, { data: pendingActions }] = await Promise.all([
    supabase
      .from('agent_messages')
      .select('id, role, content, created_at')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true })
      .limit(200),
    supabase
      .from('agent_actions')
      // result holds { summary } while pending (describe() output for the
      // Confirm card) — see the gated branch in lib/agent/tools/registry.ts.
      .select('id, tool_name, input, result, created_at')
      .eq('conversation_id', conversation.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: true }),
  ]);

  // A genuine prior conversation (typed messages, answered questions, etc.)
  // also counts as data — but NOT the auto-fired onboarding kickoff, so a couple
  // who opened the welcome flow and immediately left still re-enters fresh.
  const hasGenuineMessage = (messages ?? []).some((m) => {
    if (m.role !== 'user') return false;
    const content = m.content as Array<{ type?: string; text?: string }> | null;
    const firstText = content?.find((b) => b.type === 'text')?.text ?? '';
    return !firstText.startsWith(HIDDEN_KICKOFF_PREFIX);
  });

  return NextResponse.json({
    conversation,
    messages: messages ?? [],
    pendingActions: pendingActions ?? [],
    hasData: baseHasData || hasGenuineMessage,
  });
}
