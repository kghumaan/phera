import { NextRequest, NextResponse } from 'next/server';
import { requireLabAccess, isLabAccess } from '@/lib/agent/lab/auth';
import { isLabSlug } from '@/lib/agent/lab/scenarios';
import { resolveAgentAction } from '@/lib/agent/confirm';
import { anthropicProvider } from '@/lib/agent/providers/anthropic';
import type { AgentStreamEvent } from '@/lib/agent/types';

export const runtime = 'nodejs';
export const maxDuration = 120;

/**
 * POST /api/agent/lab/confirm
 * Body: { actionId: string, approve: boolean }
 * Scriptable confirm: resolves a pending gated action on a lab wedding and
 * returns the agent's acknowledgment turn as JSON.
 */
export async function POST(request: NextRequest) {
  const access = await requireLabAccess(request);
  if (!isLabAccess(access)) return access;
  const { supabase, ownerId } = access;

  let body: { actionId?: string; approve?: boolean; anonymous?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  if (!body.actionId || typeof body.approve !== 'boolean') {
    return NextResponse.json({ error: 'Missing actionId or approve' }, { status: 400 });
  }

  const { data: action } = await supabase
    .from('agent_actions')
    .select('id, wedding_id, conversation_id, status')
    .eq('id', body.actionId)
    .single();
  if (!action) return NextResponse.json({ error: 'Action not found' }, { status: 404 });
  if (!isLabSlug(action.wedding_id)) {
    return NextResponse.json({ error: 'Action does not belong to a lab wedding' }, { status: 400 });
  }

  const events: AgentStreamEvent[] = [];
  let reply = '';
  try {
    await resolveAgentAction({
      supabase,
      actionId: body.actionId,
      approve: body.approve,
      isAnonymous: body.anonymous === true,
      userId: ownerId ?? 'lab',
      provider: anthropicProvider,
      onEvent: (event) => {
        events.push(event);
        if (event.type === 'text_delta') reply += event.text;
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Resolution failed', events },
      { status: 500 }
    );
  }

  const { data: resolved } = await supabase
    .from('agent_actions')
    .select('id, tool_name, status, result, resolved_at')
    .eq('id', body.actionId)
    .single();

  return NextResponse.json({
    conversationId: action.conversation_id,
    approve: body.approve,
    action: resolved,
    reply,
    events,
  });
}
