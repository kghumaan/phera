import { NextRequest, NextResponse } from 'next/server';
import { requireLabAccess, isLabAccess } from '@/lib/agent/lab/auth';
import { isLabSlug } from '@/lib/agent/lab/scenarios';
import { runAgentTurn } from '@/lib/agent/loop';
import { anthropicProvider } from '@/lib/agent/providers/anthropic';
import type { AgentStreamEvent } from '@/lib/agent/types';

export const runtime = 'nodejs';
export const maxDuration = 120;

/**
 * POST /api/agent/lab/chat
 * Body: { weddingSlug: 'agent-lab-...', message: string, conversationId?: string }
 *
 * Scriptable (non-streaming) version of the chat route: runs one full agent
 * turn and returns the whole thing as JSON — the assistant's reply, every
 * stream event, and the audit-log rows for tool calls made during the turn
 * (with inputs and results) so callers can assert input → output → mutation.
 */
export async function POST(request: NextRequest) {
  const access = await requireLabAccess(request);
  if (!isLabAccess(access)) return access;
  const { supabase, ownerId } = access;

  let body: { weddingSlug?: string; message?: string; conversationId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const { weddingSlug, message, conversationId } = body;
  if (!weddingSlug || !isLabSlug(weddingSlug)) {
    return NextResponse.json({ error: 'weddingSlug must be an agent-lab-* slug' }, { status: 400 });
  }
  if (!message?.trim()) {
    return NextResponse.json({ error: 'Missing message' }, { status: 400 });
  }

  const { data: wedding } = await supabase
    .from('weddings')
    .select('id, slug')
    .eq('slug', weddingSlug)
    .single();
  if (!wedding) {
    return NextResponse.json({ error: 'Lab wedding not found' }, { status: 404 });
  }

  let convId = conversationId ?? null;
  if (convId) {
    const { data: conv } = await supabase
      .from('agent_conversations')
      .select('id')
      .eq('id', convId)
      .eq('wedding_id', wedding.slug)
      .single();
    if (!conv) convId = null;
  }
  if (!convId) {
    const { data: created, error } = await supabase
      .from('agent_conversations')
      .insert({ wedding_id: wedding.slug, created_by: ownerId, channel: 'web' })
      .select('id')
      .single();
    if (error || !created) {
      return NextResponse.json({ error: 'Could not create conversation' }, { status: 500 });
    }
    convId = created.id;
  }

  const turnStartedAt = new Date().toISOString();
  const events: AgentStreamEvent[] = [];
  let reply = '';

  try {
    await runAgentTurn({
      supabase,
      weddingSlug: wedding.slug,
      weddingUuid: wedding.id,
      userId: ownerId ?? 'lab',
      conversationId: convId as string,
      userMessage: message.trim(),
      provider: anthropicProvider,
      onEvent: (event) => {
        events.push(event);
        if (event.type === 'text_delta') reply += event.text;
      },
    });
  } catch (error) {
    console.error('Lab agent turn failed:', error);
    return NextResponse.json(
      {
        error: 'Agent turn failed',
        detail: error instanceof Error ? error.message : String(error),
        conversationId: convId,
        events,
      },
      { status: 500 }
    );
  }

  const { data: actions } = await supabase
    .from('agent_actions')
    .select('tool_name, input, result, status, risk, created_at')
    .eq('conversation_id', convId)
    .gte('created_at', turnStartedAt)
    .order('created_at');

  return NextResponse.json({
    conversationId: convId,
    reply,
    events,
    actions: actions ?? [],
  });
}
