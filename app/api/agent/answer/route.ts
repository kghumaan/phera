import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { getAuthenticatedClient } from '@/lib/utils/auth-helpers';
import { verifyWeddingAccess } from '@/lib/utils/verify-wedding-access';
import { resolveAgentAnswers } from '@/lib/agent/answer';
import { anthropicProvider } from '@/lib/agent/providers/anthropic';
import type { AgentStreamEvent } from '@/lib/agent/types';

export const runtime = 'nodejs';
export const maxDuration = 120;

/**
 * POST /api/agent/answer
 * Body: { actionId: string, answers: Record<string, string | string[]> }
 * Resolves a parked ask_user action and streams the agent's follow-up turn.
 */
export async function POST(request: NextRequest) {
  const { supabase, user } = await getAuthenticatedClient();
  if (!supabase || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { actionId?: string; answers?: Record<string, string | string[]> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  if (!body.actionId || typeof body.answers !== 'object' || body.answers === null) {
    return NextResponse.json({ error: 'Missing actionId or answers' }, { status: 400 });
  }
  const { actionId, answers } = body;

  const { data: action } = await supabase
    .from('agent_actions')
    .select('id, wedding_id, status')
    .eq('id', actionId)
    .single();
  if (!action) {
    return NextResponse.json({ error: 'Action not found' }, { status: 404 });
  }
  const { data: wedding } = await supabase
    .from('weddings')
    .select('id')
    .eq('slug', action.wedding_id)
    .single();
  if (!wedding || !(await verifyWeddingAccess(supabase, user.id, wedding.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (action.status !== 'pending') {
    return NextResponse.json({ error: `Already answered (${action.status})` }, { status: 409 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: AgentStreamEvent) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      try {
        await resolveAgentAnswers({
          supabase,
          actionId,
          answers,
          userId: user.id,
          provider: anthropicProvider,
          onEvent: send,
        });
      } catch (error) {
        console.error('Answer resolution failed:', error);
        Sentry.captureException(error, { tags: { surface: 'agent-answer' } });
        send({ type: 'error', message: 'Something went wrong saving those answers — please try again.' });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
