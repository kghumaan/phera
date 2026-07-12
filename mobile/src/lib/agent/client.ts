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

export interface AgentQuestion {
  id: string;
  prompt: string;
  hint?: string;
  type: 'text' | 'textarea' | 'date' | 'date_range' | 'time' | 'single_select' | 'multi_select';
  options?: string[];
  allowOther?: boolean;
  placeholder?: string;
  optional?: boolean;
  inputOnly?: boolean;
}

export type AgentDataPanel =
  | {
      kind: 'table';
      title: string;
      columns: { key: string; label: string }[];
      rows: Record<string, string | number | null>[];
    }
  | { kind: 'stats'; title: string; items: { label: string; value: string; hint?: string }[] };

export interface VenueCard {
  name: string;
  category: string;
  city: string;
  rating: number | null;
  review_count: number | null;
  website: string | null;
}

export interface BroadcastDraft {
  message: string;
  audience: 'all' | 'tags' | 'specific';
  tags: string[];
  count: number;
  sampleNames: string[];
  connected: boolean;
}

export type AgentStreamEvent =
  | { type: 'conversation'; conversationId: string }
  | { type: 'text_delta'; text: string }
  | { type: 'tool_start'; name: string; label: string }
  | { type: 'tool_done'; name: string; ok: boolean; summary?: string; undoable?: boolean }
  | {
      type: 'confirmation_required';
      actionId: string;
      name?: string;
      label: string;
      input?: Record<string, unknown>;
      summary?: string;
    }
  | { type: 'questions_required'; actionId: string; questions: AgentQuestion[] }
  | { type: 'upgrade_required'; feature: string }
  | { type: 'upload_requested'; uploadKind: 'guests' | 'rooms' }
  | { type: 'data_panel'; panel: AgentDataPanel }
  | { type: 'faq_review'; faqs: { id: string; question: string; answer: string }[] }
  | { type: 'venue_cards'; vendors: VenueCard[] }
  | { type: 'broadcast_review'; draft: BroadcastDraft }
  | { type: 'whatsapp_pairing'; status: string }
  | { type: 'error'; message: string }
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

async function* say(text: string): AsyncGenerator<AgentStreamEvent> {
  for (const word of text.split(' ')) {
    yield { type: 'text_delta', text: word + ' ' };
    await sleep(24);
  }
}

async function* mockStream(input: ChatTurnInput): AsyncGenerator<AgentStreamEvent> {
  // Write-ish asks exercise the confirmation card in preview.
  if (/send|draft|nudge|broadcast/i.test(input.message)) {
    await sleep(350);
    yield { type: 'tool_start', name: 'draft_reminder', label: 'draft reminder' };
    await sleep(500);
    yield { type: 'tool_done', name: 'draft_reminder', ok: true };
    yield* say(
      'Here’s the reminder I’d send to your 32 pending guests — approve and it goes out on WhatsApp:',
    );
    yield {
      type: 'confirmation_required',
      actionId: 'preview-action-1',
      name: 'send_whatsapp_broadcast',
      label: 'Send RSVP reminder',
      summary:
        '32 recipients · WhatsApp · "Namaste! A gentle nudge — Priya & Rahul need your RSVP by Sep 30…"',
      input: { reason: 'RSVP deadline is approaching and 32 guests have not replied.' },
    };
    yield { type: 'done' };
    return;
  }
  if (/stats|numbers|summary/i.test(input.message)) {
    await sleep(350);
    yield { type: 'tool_start', name: 'read_rsvps', label: 'read RSVP stats' };
    await sleep(400);
    yield { type: 'tool_done', name: 'read_rsvps', ok: true, summary: '4 stats compiled' };
    yield {
      type: 'data_panel',
      panel: {
        kind: 'stats',
        title: 'RSVP snapshot',
        items: [
          { label: 'Attending (head-count)', value: '9' },
          { label: 'Maybe', value: '1' },
          { label: 'Not attending', value: '1', hint: 'Nisha Reddy' },
          { label: 'No response yet', value: '2' },
        ],
      },
    };
    yield* say('Here’s where your RSVPs stand today.');
    yield { type: 'done' };
    return;
  }
  const script = MOCK_SCRIPTS.find((s) => s.match.test(input.message))!;
  await sleep(350);
  if (script.tool) {
    yield { type: 'tool_start', name: script.tool.replace(/\s+/g, '_'), label: script.tool };
    await sleep(500);
    yield { type: 'tool_done', name: script.tool.replace(/\s+/g, '_'), ok: true };
  }
  yield* say(script.reply);
  yield { type: 'done' };
}

async function* mockConfirmStream(approve: boolean, note?: string): AsyncGenerator<AgentStreamEvent> {
  await sleep(300);
  if (approve) {
    yield { type: 'tool_start', name: 'send_whatsapp_broadcast', label: 'send WhatsApp broadcast' };
    await sleep(600);
    yield {
      type: 'tool_done',
      name: 'send_whatsapp_broadcast',
      ok: true,
      summary: 'queued for 32 guests',
      undoable: false,
    };
    yield* say('Done — the reminder is on its way to 32 guests. I’ll flag replies as they come in.');
  } else if (note) {
    yield* say(`Got it — I’ll rework it: “${note}”. Here’s a new draft shortly.`);
  } else {
    yield* say('No problem — I’ve discarded it. Want me to reword it or wait a few more days?');
  }
  yield { type: 'done' };
}

async function* mockAnswersStream(): AsyncGenerator<AgentStreamEvent> {
  await sleep(300);
  yield* say('Got that — saved. Anything else you want to adjust?');
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
              yield {
                type: 'tool_start',
                name: String(event.name ?? ''),
                label: String(event.label ?? event.name ?? 'working'),
              };
              break;
            case 'tool_done':
              yield {
                type: 'tool_done',
                name: String(event.name ?? ''),
                ok: event.ok !== false,
                summary: typeof event.summary === 'string' ? event.summary : undefined,
                undoable: event.undoable === true,
              };
              break;
            case 'confirmation_required':
              yield {
                type: 'confirmation_required',
                actionId: String(event.actionId),
                name: typeof event.name === 'string' ? event.name : undefined,
                label: String(event.label ?? event.name ?? 'Confirm action'),
                input:
                  event.input && typeof event.input === 'object'
                    ? (event.input as Record<string, unknown>)
                    : undefined,
                summary: typeof event.summary === 'string' ? event.summary : undefined,
              };
              break;
            case 'questions_required':
              yield {
                type: 'questions_required',
                actionId: String(event.actionId),
                questions: Array.isArray(event.questions)
                  ? (event.questions as AgentQuestion[])
                  : [],
              };
              break;
            case 'upgrade_required':
              yield { type: 'upgrade_required', feature: String(event.feature ?? 'This') };
              break;
            case 'upload_requested':
              yield {
                type: 'upload_requested',
                uploadKind: event.uploadKind === 'rooms' ? 'rooms' : 'guests',
              };
              break;
            case 'data_panel':
              if (event.panel && typeof event.panel === 'object') {
                yield { type: 'data_panel', panel: event.panel as AgentDataPanel };
              }
              break;
            case 'faq_review':
              yield {
                type: 'faq_review',
                faqs: Array.isArray(event.faqs)
                  ? (event.faqs as { id: string; question: string; answer: string }[])
                  : [],
              };
              break;
            case 'venue_cards':
              yield {
                type: 'venue_cards',
                vendors: Array.isArray(event.vendors) ? (event.vendors as VenueCard[]) : [],
              };
              break;
            case 'broadcast_review':
              if (event.draft && typeof event.draft === 'object') {
                yield { type: 'broadcast_review', draft: event.draft as BroadcastDraft };
              }
              break;
            case 'whatsapp_pairing':
              yield { type: 'whatsapp_pairing', status: String(event.status ?? '') };
              break;
            case 'error':
              yield { type: 'error', message: String(event.message ?? 'Something went wrong.') };
              break;
            // done handled by stream close; unknown types ignored.
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

export interface ConfirmOptions {
  note?: string;
  alwaysAllow?: boolean;
}

async function* liveConfirmStream(
  actionId: string,
  approve: boolean,
  opts?: ConfirmOptions,
): AsyncGenerator<AgentStreamEvent> {
  const body: Record<string, unknown> = { actionId, approve };
  if (opts?.note) body.note = opts.note;
  if (opts?.alwaysAllow) body.alwaysAllow = true;
  const res = await authedSse('/api/agent/confirm', body);
  yield* readSse(res);
}

async function* liveAnswersStream(
  actionId: string,
  answers: Record<string, string | string[]>,
): AsyncGenerator<AgentStreamEvent> {
  const res = await authedSse('/api/agent/answer', { actionId, answers });
  yield* readSse(res);
}

export function streamChat(input: ChatTurnInput): AsyncGenerator<AgentStreamEvent> {
  return inMockMode() ? mockStream(input) : liveStream(input);
}

/** Resolve a parked gated action; the agent's follow-up streams back. */
export function streamConfirm(
  actionId: string,
  approve: boolean,
  opts?: ConfirmOptions,
): AsyncGenerator<AgentStreamEvent> {
  return inMockMode() ? mockConfirmStream(approve, opts?.note) : liveConfirmStream(actionId, approve, opts);
}

/** Answer a parked ask_user question set (POST /api/agent/answer). */
export function streamAnswers(
  actionId: string,
  answers: Record<string, string | string[]>,
): AsyncGenerator<AgentStreamEvent> {
  return inMockMode() ? mockAnswersStream() : liveAnswersStream(actionId, answers);
}

// Web AgentChatPanel parity (DEFAULT_STARTERS / WELCOME_PLACEHOLDER).
export const PLANNER_STARTERS = [
  'Help me create my wedding website.',
  'Can we refine my wedding schedule?',
  'Help me find a photographer.',
  "What's still missing from my setup?",
];

export const WELCOME_PLACEHOLDER =
  "Tell me what's happening — guests, schedule, rooms, vendors & more";

export const PLANNER_EMPTY_COPY =
  "I'm your wedding planner. I can read and update your guest list, schedule, rooms, vendors, and more — just tell me what's happening.";
