import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { getAuthenticatedClient } from '@/lib/utils/auth-helpers';
import { verifyWeddingAccess } from '@/lib/utils/verify-wedding-access';
import { resolveAgentAction } from '@/lib/agent/confirm';
import { anthropicProvider } from '@/lib/agent/providers/anthropic';
import type { AgentStreamEvent } from '@/lib/agent/types';

export const runtime = 'nodejs';
export const maxDuration = 120;

/**
 * POST /api/agent/confirm
 * Body: { actionId: string, approve: boolean }
 * Resolves a pending gated action and streams the agent's acknowledgment
 * turn as SSE (same event protocol as /api/agent/chat).
 */
export async function POST(request: NextRequest) {
  const { supabase, user } = await getAuthenticatedClient();
  if (!supabase || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { actionId?: string; approve?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  if (!body.actionId || typeof body.approve !== 'boolean') {
    return NextResponse.json({ error: 'Missing actionId or approve' }, { status: 400 });
  }
  const { actionId, approve } = body;

  // RLS already scopes agent_actions to weddings this user administers,
  // but verify explicitly so a clear 403/404 comes back.
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
    return NextResponse.json({ error: `Action already resolved (${action.status})` }, { status: 409 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: AgentStreamEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };
      try {
        await resolveAgentAction({
          supabase,
          actionId,
          approve,
          userId: user.id,
          provider: anthropicProvider,
          onEvent: send,
        });
      } catch (error) {
        console.error('Confirm resolution failed:', error);
        Sentry.captureException(error, { tags: { surface: 'agent-confirm' } });
        send({ type: 'error', message: 'Something went wrong resolving that action — please try again.' });
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
