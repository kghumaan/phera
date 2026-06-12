import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedClient } from '@/lib/utils/auth-helpers';
import { verifyWeddingAccess } from '@/lib/utils/verify-wedding-access';
import { runAgentTurn } from '@/lib/agent/loop';
import { anthropicProvider } from '@/lib/agent/providers/anthropic';
import type { AgentStreamEvent } from '@/lib/agent/types';

export const runtime = 'nodejs';
export const maxDuration = 120;

/**
 * POST /api/agent/chat
 * Body: { weddingSlug: string, message: string, conversationId?: string }
 * Streams AgentStreamEvent objects as SSE (`data: {...}\n\n`).
 */
export async function POST(request: NextRequest) {
  const { supabase, user } = await getAuthenticatedClient();
  if (!supabase || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { weddingSlug?: string; message?: string; conversationId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const { weddingSlug, message, conversationId } = body;
  if (!weddingSlug || !message?.trim()) {
    return NextResponse.json({ error: 'Missing weddingSlug or message' }, { status: 400 });
  }
  if (message.length > 4000) {
    return NextResponse.json({ error: 'Message too long' }, { status: 400 });
  }

  const { data: wedding } = await supabase
    .from('weddings')
    .select('id, slug')
    .eq('slug', weddingSlug)
    .single();
  if (!wedding) {
    return NextResponse.json({ error: 'Wedding not found' }, { status: 404 });
  }

  const hasAccess = await verifyWeddingAccess(supabase, user.id, wedding.id);
  if (!hasAccess) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Resolve or create the conversation.
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
      .insert({ wedding_id: wedding.slug, created_by: user.id, channel: 'web' })
      .select('id')
      .single();
    if (error || !created) {
      return NextResponse.json({ error: 'Could not create conversation' }, { status: 500 });
    }
    convId = created.id;
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: AgentStreamEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };
      send({ type: 'conversation', conversationId: convId as string });
      try {
        await runAgentTurn({
          supabase,
          weddingSlug: wedding.slug,
          weddingUuid: wedding.id,
          userId: user.id,
          conversationId: convId as string,
          userMessage: message.trim(),
          provider: anthropicProvider,
          onEvent: send,
        });
      } catch (error) {
        console.error('Agent turn failed:', error);
        send({
          type: 'error',
          message: 'Something went wrong on my end — please try that again.',
        });
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
