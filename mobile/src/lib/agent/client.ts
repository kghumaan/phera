import { fetch as expoFetch } from 'expo/fetch';

import { isPreviewMode, supabase } from '@/lib/supabase/client';

/**
 * Streaming client for the Phera Agent chat.
 *
 * Live mode POSTs to `${EXPO_PUBLIC_API_BASE_URL}/api/agent/chat` with the
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
  | { type: 'done' };

export interface ChatTurnInput {
  weddingSlug: string;
  message: string;
  conversationId?: string;
}

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://phera.io';

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

// ── Live: real SSE against the deployed agent route. ──

async function* liveStream(input: ChatTurnInput): AsyncGenerator<AgentStreamEvent> {
  const { data } = await supabase!.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Not signed in');

  const res = await expoFetch(`${API_BASE}/api/agent/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      weddingSlug: input.weddingSlug,
      message: input.message,
      conversationId: input.conversationId,
    }),
  });
  if (!res.ok || !res.body) {
    throw new Error(`Planner unavailable (${res.status})`);
  }

  const reader = res.body.getReader();
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
            // tool_done / confirmation_required / question rendering comes
            // with the confirmation UI phase — safely ignored until then.
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
  yield { type: 'done' };
}

export function streamChat(input: ChatTurnInput): AsyncGenerator<AgentStreamEvent> {
  return isPreviewMode ? mockStream(input) : liveStream(input);
}

export const PLANNER_STARTERS = [
  'Help me create my wedding website.',
  'Can we refine my wedding schedule?',
  'Help me find a photographer.',
  "What's still missing from my setup?",
];

export const WELCOME_PLACEHOLDER =
  "Tell me what's happening — guests, schedule, rooms, vendors & more";
