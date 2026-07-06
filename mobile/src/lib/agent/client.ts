import { fetch as expoFetch } from 'expo/fetch';

import { API_BASE } from '@/lib/config';
import { inMockMode, supabase } from '@/lib/supabase/client';

/**
 * Streaming client for the Phera Agent chat.
 *
 * Live mode POSTs to `${API_BASE}/api/agent/chat` (config.ts) with the
 * Supabase bearer token and reads the SSE stream via expo/fetch (streaming
 * bodies work on native + web). Event shapes mirror the server's
 * AgentStreamEvent union (lib/agent/types.ts on web) — unknown types are
 * ignored so the UI degrades gracefully as the agent grows.
 *
 * Preview mode streams a scripted mock so the chat is exercisable offline.
 */

export type AgentStreamEvent =
  | { type: 'conversation'; conversationId: string }
  | { type: 'text_delta'; text: string }
  | { type: 'tool'; label: string }
  | { type: 'confirmation_required'; actionId: string; label: string; summary?: string }
  | { type: 'done' };

export interface ChatTurnInput {
  weddingSlug: string;
  message: string;
  conversationId?: string;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// ── Preview: scripted replies referencing the same fixtures the rest of
// preview mode shows (142 guests, 98 attending…). ──

interface MockScript {
  match: RegExp;
  tool?: string;
  reply: string;
}

const MOCK_SCRIPTS: MockScript[] = [
  {
    match: /rsvp|respond|pending/i,
    tool: 'read guest list',
    reply:
      "You have 32 guests who haven't RSVP'd yet — most from the groom's side. The last reminder went out 6 days ago, so a WhatsApp nudge is safe to send now. Want me to draft it?",
  },
  {
    match: /travel|flight|arriv/i,
    tool: 'read travel data',
    reply:
      '61 of your 98 confirmed guests have shared travel details. 24 land the day before the sangeet, so one airport shuttle that evening would cover most of them. Shall I plan the pickups?',
  },
  {
    match: /schedule|event|sangeet|haldi/i,
    tool: 'read schedule',
    reply:
      'Your celebration runs Nov 18–20 in Udaipur: Haldi, Sangeet, then the wedding and reception. The Sangeet still has "Venue TBD" — want me to list what the couple before you booked nearby?',
  },
  {
    match: /.*/,
    reply:
      "I'm your wedding planner — I can check RSVPs, chase travel details, adjust the schedule, and draft guest messages. What's on your mind?",
  },
];

async function* mockStream(input: ChatTurnInput): AsyncGenerator<AgentStreamEvent> {
  // Write-ish asks exercise the confirmation card in preview.
  if (/send|draft|nudge|broadcast/i.test(input.message)) {
    await sleep(350);
    yield { type: 'tool', label: 'draft reminder' };
    await sleep(500);
    for (const word of 'Here\u2019s the reminder I\u2019d send to your 32 pending guests \u2014 approve and it goes out on WhatsApp:'.split(' ')) {
      yield { type: 'text_delta', text: word + ' ' };
      await sleep(24);
    }
    yield {
      type: 'confirmation_required',
      actionId: 'preview-action-1',
      label: 'Send RSVP reminder',
      summary: '32 recipients \u00b7 WhatsApp \u00b7 "Namaste! A gentle nudge \u2014 Priya & Rahul need your RSVP by Sep 30\u2026"',
    };
    yield { type: 'done' };
    return;
  }
  const script = MOCK_SCRIPTS.find((s) => s.match.test(input.message))!;
  await sleep(350);
  if (script.tool) {
    yield { type: 'tool', label: script.tool };
    await sleep(500);
  }
  for (const word of script.reply.split(' ')) {
    yield { type: 'text_delta', text: word + ' ' };
    await sleep(24);
  }
  yield { type: 'done' };
}

async function* mockConfirmStream(approve: boolean): AsyncGenerator<AgentStreamEvent> {
  await sleep(300);
  if (approve) {
    yield { type: 'tool', label: 'send WhatsApp broadcast' };
    await sleep(600);
    for (const word of 'Done \u2014 the reminder is on its way to 32 guests. I\u2019ll flag replies as they come in.'.split(' ')) {
      yield { type: 'text_delta', text: word + ' ' };
      await sleep(24);
    }
  } else {
    for (const word of 'No problem \u2014 I\u2019ve discarded it. Want me to reword it or wait a few more days?'.split(' ')) {
      yield { type: 'text_delta', text: word + ' ' };
      await sleep(24);
    }
  }
  yield { type: 'done' };
}

// ── Live: real SSE against the deployed agent routes. ──

async function authedSse(path: string, body: Record<string, unknown>) {
  const { data } = await supabase!.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Not signed in');
  const res = await expoFetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok || !res.body) {
    throw new Error(`Planner unavailable (${res.status})`);
  }
  return res;
}

async function* readSse(res: Awaited<ReturnType<typeof authedSse>>): AsyncGenerator<AgentStreamEvent> {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      // SSE frames are separated by a blank line; each carries `data: {json}`.
      let sep: number;
      while ((sep = buffer.indexOf('\n\n')) !== -1) {
        const frame = buffer.slice(0, sep);
        buffer = buffer.slice(sep + 2);
        for (const line of frame.split('\n')) {
          if (!line.startsWith('data:')) continue;
          let event: Record<string, unknown>;
          try {
            event = JSON.parse(line.slice(5).trim());
          } catch {
            continue;
          }
          switch (event.type) {
            case 'conversation':
              yield { type: 'conversation', conversationId: String(event.conversationId) };
              break;
            case 'text_delta':
              yield { type: 'text_delta', text: String(event.text ?? '') };
              break;
            case 'tool_start':
              yield { type: 'tool', label: String(event.label ?? event.name ?? 'working') };
              break;
            case 'confirmation_required':
              yield {
                type: 'confirmation_required',
                actionId: String(event.actionId),
                label: String(event.label ?? event.name ?? 'Confirm action'),
                summary: typeof event.summary === 'string' ? event.summary : undefined,
              };
              break;
            // tool_done / question panels: rendered in a later phase; ignored.
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
  yield { type: 'done' };
}

async function* liveStream(input: ChatTurnInput): AsyncGenerator<AgentStreamEvent> {
  const res = await authedSse('/api/agent/chat', {
    weddingSlug: input.weddingSlug,
    message: input.message,
    conversationId: input.conversationId,
  });
  yield* readSse(res);
}

async function* liveConfirmStream(actionId: string, approve: boolean): AsyncGenerator<AgentStreamEvent> {
  const res = await authedSse('/api/agent/confirm', { actionId, approve });
  yield* readSse(res);
}

export function streamChat(input: ChatTurnInput): AsyncGenerator<AgentStreamEvent> {
  return inMockMode() ? mockStream(input) : liveStream(input);
}

/** Resolve a parked gated action; the agent's follow-up streams back. */
export function streamConfirm(actionId: string, approve: boolean): AsyncGenerator<AgentStreamEvent> {
  return inMockMode() ? mockConfirmStream(approve) : liveConfirmStream(actionId, approve);
}

export const PLANNER_STARTERS = [
  'Help me create my wedding website.',
  'Can we refine my wedding schedule?',
  'Help me find a photographer.',
  "What's still missing from my setup?",
];

export const WELCOME_PLACEHOLDER =
  "Tell me what's happening — guests, schedule, rooms, vendors & more";
