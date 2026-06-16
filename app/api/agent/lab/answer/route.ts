import { NextRequest, NextResponse } from 'next/server';
import { requireLabAccess, isLabAccess } from '@/lib/agent/lab/auth';
import { isLabSlug } from '@/lib/agent/lab/scenarios';
import { resolveAgentAnswers } from '@/lib/agent/answer';
import { anthropicProvider } from '@/lib/agent/providers/anthropic';
import type { AgentStreamEvent } from '@/lib/agent/types';

export const runtime = 'nodejs';
export const maxDuration = 120;

/**
 * POST /api/agent/lab/answer
 * Body: { actionId, answers }. Scriptable resolution of a parked ask_user
 * action; returns the agent's follow-up turn as JSON.
 */
export async function POST(request: NextRequest) {
  const access = await requireLabAccess(request);
  if (!isLabAccess(access)) return access;
  const { supabase, ownerId } = access;

  let body: { actionId?: string; answers?: Record<string, string | string[]> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  if (!body.actionId || typeof body.answers !== 'object' || body.answers === null) {
    return NextResponse.json({ error: 'Missing actionId or answers' }, { status: 400 });
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
    await resolveAgentAnswers({
      supabase,
      actionId: body.actionId,
      answers: body.answers,
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

  const { data: actions } = await supabase
    .from('agent_actions')
    .select('tool_name, input, result, status, risk, created_at')
    .eq('conversation_id', action.conversation_id)
    .order('created_at');

  return NextResponse.json({ conversationId: action.conversation_id, reply, events, actions: actions ?? [] });
}
