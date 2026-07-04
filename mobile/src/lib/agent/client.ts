/**
 * Streaming client for the Phera Agent chat.
 *
 * `streamChat` yields events the UI renders incrementally. In preview mode
 * (no env) a scripted mock streams canned replies so the chat UX is fully
 * exercisable offline. The real implementation POSTs to
 * `${EXPO_PUBLIC_API_BASE_URL}/api/agent/chat` (SSE) with the Supabase
 * bearer token — wired in Phase 2 once the route accepts bearer auth.
 */

export type AgentStreamEvent =
  | { type: 'text_delta'; text: string }
  | { type: 'tool'; label: string }
  | { type: 'done' };

export interface ChatTurnInput {
  weddingSlug: string;
  message: string;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

interface MockScript {
  match: RegExp;
  tool?: string;
  reply: string;
}

// Replies mirror the tone of the web planner and reference the same mock
// fixtures the rest of preview mode shows (142 guests, 98 attending…).
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

export function streamChat(input: ChatTurnInput): AsyncGenerator<AgentStreamEvent> {
  // TODO(Phase 2): real SSE against /api/agent/chat when env is configured.
  return mockStream(input);
}

export const PLANNER_STARTERS = [
  'Help me create my wedding website.',
  'Can we refine my wedding schedule?',
  'Help me find a photographer.',
  "What's still missing from my setup?",
];

export const WELCOME_PLACEHOLDER =
  "Tell me what's happening — guests, schedule, rooms, vendors & more";
