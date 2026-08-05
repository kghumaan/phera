import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { getAuthenticatedClient } from '@/lib/utils/auth-helpers';
import { verifyWeddingAccess } from '@/lib/utils/verify-wedding-access';
import { checkRateLimit } from '@/lib/utils/rate-limiter';
import { runAgentTurn, TurnInProgressError } from '@/lib/agent/loop';
import { anthropicProvider } from '@/lib/agent/providers/anthropic';
import type { AgentStreamEvent } from '@/lib/agent/types';

export const runtime = 'nodejs';
export const maxDuration = 120;

/** Free allowance for anonymous (pre-signup) sessions, counted in user-role
 *  message rows (real turns + tool-result rows — roughly 10-14 typed turns).
 *  The client locks the composer earlier; this is the server-side backstop. */
const ANON_USER_ROW_CAP = 20;

/** A user-facing message tuned to the actual failure cause, so we don't cry
 *  "something went wrong" when the model provider is simply overloaded (the far
 *  more common transient case) or the API key is misconfigured. */
function agentTurnErrorMessage(error: unknown): string {
  const status =
    error && typeof (error as { status?: unknown }).status === 'number'
      ? (error as { status: number }).status
      : undefined;
  if (status === 429 || status === 529 || (status !== undefined && status >= 500)) {
    return "Phera's AI is briefly overloaded — give it a few seconds and try again.";
  }
  if (status === 401 || status === 403) {
    return "Phera's AI isn't reachable right now (we're on it) — please try again shortly.";
  }
  return 'Something went wrong on my end — please try that again.';
}

/**
 * POST /api/agent/chat
 * Body: { weddingSlug: string, message: string, conversationId?: string }
 * Streams AgentStreamEvent objects as SSE (`data: {...}\n\n`).
 */
export async function POST(request: NextRequest) {
  // Each turn costs real model tokens — cap bursts per IP before any work.
  const limited = checkRateLimit(request, { maxRequests: 20, windowMs: 60_000, keyPrefix: 'agent-chat' });
  if (limited) return limited;

  const { supabase, user } = await getAuthenticatedClient();
  if (!supabase || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // Anonymous (pre-signup) landing-page sessions get a tighter per-IP budget on
  // top of the shared one — they're the only unauthenticated path to the model.
  const isAnonymous = (user as { is_anonymous?: boolean }).is_anonymous === true;
  if (isAnonymous) {
    const anonLimited = checkRateLimit(request, { maxRequests: 10, windowMs: 60_000, keyPrefix: 'agent-chat-anon' });
    if (anonLimited) return anonLimited;
  }

  let body: { weddingSlug?: string; message?: string; conversationId?: string; voice?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const { weddingSlug, message, conversationId, voice } = body;
  if (!weddingSlug || !message?.trim()) {
    return NextResponse.json({ error: 'Missing weddingSlug or message' }, { status: 400 });
  }
  if (message.length > 4000) {
    return NextResponse.json({ error: 'Message too long' }, { status: 400 });
  }

  const { data: wedding } = await supabase
    .from('weddings')
    .select('id, slug, created_by')
    .eq('slug', weddingSlug)
    .single();
  if (!wedding) {
    return NextResponse.json({ error: 'Wedding not found' }, { status: 404 });
  }

  // Owners skip the extra round-trip; only non-owners (collaborators) need the
  // wedding_admins lookup inside verifyWeddingAccess.
  const hasAccess =
    wedding.created_by === user.id || (await verifyWeddingAccess(supabase, user.id, wedding.id));
  if (!hasAccess) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Resolve or create the conversation.
  let convId = conversationId ?? null;
  let isNewConversation = false;
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
    isNewConversation = true;
  }

  // Server-side backstop on the anonymous free allowance: past the cap the turn
  // doesn't run — the stream just (re-)renders the required signup card.
  let anonCapReached = false;
  if (isAnonymous && !isNewConversation) {
    const { count } = await supabase
      .from('agent_messages')
      .select('id', { count: 'exact', head: true })
      .eq('conversation_id', convId)
      .eq('role', 'user');
    anonCapReached = (count ?? 0) >= ANON_USER_ROW_CAP;
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: AgentStreamEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };
      send({ type: 'conversation', conversationId: convId as string });
      if (anonCapReached) {
        send({ type: 'signup_required', required: true });
        send({
          type: 'text_delta',
          text: "You've reached the free preview limit — create your account above (it takes about 20 seconds) and we'll pick up right where we left off. Everything we've set up is saved.",
        });
        send({ type: 'done' });
        controller.close();
        return;
      }
      try {
        await runAgentTurn({
          supabase,
          weddingSlug: wedding.slug,
          weddingUuid: wedding.id,
          userId: user.id,
          userEmail: user.email,
          conversationId: convId as string,
          userMessage: message.trim(),
          provider: anthropicProvider,
          voice: voice === true,
          isAnonymous,
          isNewConversation,
          onEvent: send,
        });
      } catch (error) {
        if (error instanceof TurnInProgressError) {
          send({ type: 'error', message: 'I\'m still working on your last message — give me a few seconds and try again.' });
          return; // finally closes the stream
        }
        console.error('Agent turn failed:', error);
        Sentry.captureException(error, { tags: { surface: 'agent-chat' } });
        send({ type: 'error', message: agentTurnErrorMessage(error) });
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
