/**
 * Admin command handler — Gemini-driven router that turns a free-form
 * WhatsApp message from a registered admin into a concrete action
 * (insert a knowledge bank entry, file a task, query a status, etc.).
 *
 * Tools defined here intentionally start small. The Admin tab's activity
 * log captures every attempt, so the moment we add a new tool the
 * surface to debug it is already there.
 *
 * Returns a structured result the router will use to:
 *   - send `replyText` back over WhatsApp
 *   - close the `bot_admin_log` row with `{actionType, summary, status, errorMessage?}`
 */
/* eslint-disable @typescript-eslint/no-explicit-any -- tables not in generated supabase types */

import type { SupabaseClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

const gemini = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

export interface AdminHandlerResult {
  replyText: string;
  /** Short human-readable line for the activity feed. */
  summary: string;
  /**
   * Tool/intent name. Free-form on purpose so we can extend without
   * needing migrations — surfaces directly in the Admin tab UI.
   */
  actionType: string;
  status: 'success' | 'failed' | 'pending';
  errorMessage?: string;
  details?: Record<string, unknown>;
}

interface HandlerArgs {
  weddingSlug: string;
  adminName: string;
  adminPhone: string;
  messageText: string;
  supabase: SupabaseClient;
}

// ─── Tool schema ─────────────────────────────────────────────────────────
//
// Kept intentionally small — every tool maps to a concrete Supabase
// write/read. Extending the surface = add a tool here + a case in
// `executeTool()` below.
const ADMIN_TOOLS = [
  {
    name: 'add_knowledge_entry',
    description:
      'Add a new entry to the wedding knowledge bank. Use when the admin says things like "add to knowledge", "save this", "remember", or otherwise tells the bot a fact the WhatsApp Concierge should answer with later.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Short title for the entry.' },
        content: { type: 'string', description: 'Body of the entry — full content the AI should know.' },
        category: {
          type: 'string',
          enum: [
            'dining',
            'activities',
            'transportation',
            'accommodation',
            'local_tips',
            'weather',
            'emergency',
            'nightlife',
            'shopping',
            'cultural_etiquette',
            'other',
          ],
          description: 'Best-fit category for the entry.',
        },
      },
      required: ['title', 'content'],
    },
  },
  {
    name: 'add_task',
    description:
      'Create a new task on the planning Kanban board. Use when the admin asks the bot to "add to-do", "remind me to", "task", "I need to", or similar.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Short, imperative task title.' },
        description: { type: 'string', description: 'Optional longer body or context.' },
        column: {
          type: 'string',
          enum: ['todo', 'doing', 'done'],
          description: 'Which column to land the task in. Default to "todo".',
        },
      },
      required: ['title'],
    },
  },
  {
    name: 'get_status',
    description:
      'Pull a quick status digest of the wedding (guest counts, RSVPs, knowledge bank entries, open tasks). Use when the admin asks "how are we doing", "give me a summary", "status", etc.',
    parameters: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'respond_only',
    description:
      'Use when no action is needed — pure conversation, capability questions, clarifying questions, or anything you want to say without changing data.',
    parameters: {
      type: 'object',
      properties: {
        message: { type: 'string', description: 'Message to send back to the admin.' },
      },
      required: ['message'],
    },
  },
] as const;

const SYSTEM_PROMPT = `You are Phera's Admin Bot. The person texting you is a verified wedding admin (the bride, groom, planner, or someone they've explicitly authorized).

Your job is to take their natural-language WhatsApp messages and either:
  - call exactly one tool from the available set to update wedding data, or
  - reply conversationally via the respond_only tool.

Rules:
- Always pick exactly one tool per turn.
- Prefer concrete tool calls (add_knowledge_entry, add_task, get_status) when the admin clearly wants something done.
- Use respond_only for greetings, clarifying questions, capability queries, or when input is too ambiguous to act on.
- Keep replies short and confident — admins are coordinating live, not chatting for fun.
- Never apologize unnecessarily or explain that you "are an AI". Just be useful.`;

// ─── Public entry point ──────────────────────────────────────────────────

export async function handleAdminCommand(args: HandlerArgs): Promise<AdminHandlerResult> {
  const trimmed = args.messageText.trim();
  if (!trimmed) {
    return {
      replyText: 'Got an empty message — try sending what you want to update.',
      summary: 'Inbound was empty',
      actionType: 'noop',
      status: 'success',
    };
  }

  // No LLM configured → fall back to a polite "we received it" so the admin
  // doesn't think the bot is silently dead. The log row will still record it.
  if (!gemini) {
    return {
      replyText:
        'Got it — but the admin bot isn\'t fully wired up to take actions yet. We logged your request.',
      summary: `(LLM unavailable) ${trimmed.slice(0, 200)}`,
      actionType: 'queued',
      status: 'pending',
    };
  }

  const toolCall = await classifyWithGemini(trimmed);
  if (!toolCall) {
    return {
      replyText: `I heard you, but I couldn't decide what to do with: "${truncate(trimmed, 80)}". Try rephrasing — for example, "add knowledge: …" or "task: …".`,
      summary: 'Could not classify inbound message',
      actionType: 'unclassified',
      status: 'failed',
      errorMessage: 'LLM returned no tool call',
    };
  }

  return executeTool(toolCall.name, toolCall.args, args);
}

// ─── Gemini call ─────────────────────────────────────────────────────────

interface ToolCall {
  name: string;
  args: Record<string, any>;
}

async function classifyWithGemini(message: string): Promise<ToolCall | null> {
  if (!gemini) return null;
  try {
    const functionDeclarations = ADMIN_TOOLS.map((t) => ({
      name: t.name,
      description: t.description,
      parameters: t.parameters as any,
    }));

    const resp = await (gemini as any).models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { role: 'user', parts: [{ text: message }] },
      ],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        tools: [{ functionDeclarations }],
        toolConfig: {
          functionCallingConfig: { mode: 'ANY' },
        },
        temperature: 0.2,
      } as any,
    });

    const candidate = resp?.candidates?.[0];
    const parts = candidate?.content?.parts || [];
    for (const part of parts) {
      if (part?.functionCall?.name) {
        return {
          name: part.functionCall.name,
          args: part.functionCall.args || {},
        };
      }
    }
    // Plain text response with no tool call → treat as respond_only
    const text = parts.map((p: any) => p?.text || '').join('').trim();
    if (text) return { name: 'respond_only', args: { message: text } };
    return null;
  } catch (err) {
    console.error('[admin-handler] Gemini classify failed:', err);
    return null;
  }
}

// ─── Tool execution ──────────────────────────────────────────────────────

async function executeTool(
  toolName: string,
  toolArgs: Record<string, any>,
  ctx: HandlerArgs,
): Promise<AdminHandlerResult> {
  switch (toolName) {
    case 'add_knowledge_entry':
      return executeAddKnowledge(toolArgs, ctx);
    case 'add_task':
      return executeAddTask(toolArgs, ctx);
    case 'get_status':
      return executeGetStatus(ctx);
    case 'respond_only':
      return {
        replyText: String(toolArgs.message || 'Got it.'),
        summary: truncate(String(toolArgs.message || 'Conversational reply'), 240),
        actionType: 'respond_only',
        status: 'success',
      };
    default:
      return {
        replyText: `Heard you, but I don\'t know how to handle "${toolName}" yet.`,
        summary: `Unknown tool: ${toolName}`,
        actionType: 'unknown_tool',
        status: 'failed',
        errorMessage: `LLM picked tool "${toolName}" which isn\'t implemented`,
      };
  }
}

async function executeAddKnowledge(
  toolArgs: Record<string, any>,
  ctx: HandlerArgs,
): Promise<AdminHandlerResult> {
  const title = String(toolArgs.title || '').trim();
  const content = String(toolArgs.content || '').trim();
  const category = String(toolArgs.category || 'other');
  if (!title || !content) {
    return {
      replyText: 'I need both a title and some content to save a knowledge bank entry.',
      summary: 'add_knowledge_entry rejected: missing title/content',
      actionType: 'add_knowledge_entry',
      status: 'failed',
      errorMessage: 'Missing title or content',
    };
  }

  const weddingUuid = await resolveWeddingUuid(ctx.supabase, ctx.weddingSlug);
  if (!weddingUuid) {
    return {
      replyText: 'I couldn\'t resolve which wedding this is for — flag this to the team.',
      summary: 'add_knowledge_entry failed: wedding lookup',
      actionType: 'add_knowledge_entry',
      status: 'failed',
      errorMessage: 'Wedding lookup returned no row',
    };
  }

  const { data: existing } = await (ctx.supabase as any)
    .from('concierge_knowledge_base')
    .select('order_index')
    .eq('wedding_id', weddingUuid)
    .order('order_index', { ascending: false })
    .limit(1);
  const nextOrder = (existing?.[0]?.order_index ?? -1) + 1;

  const { data, error } = await (ctx.supabase as any)
    .from('concierge_knowledge_base')
    .insert({
      wedding_id: weddingUuid,
      title,
      content,
      category,
      source: 'admin_whatsapp',
      order_index: nextOrder,
    })
    .select('id')
    .single();

  if (error) {
    return {
      replyText: `Couldn\'t save that knowledge entry: ${error.message}`,
      summary: `add_knowledge_entry failed: ${error.message}`,
      actionType: 'add_knowledge_entry',
      status: 'failed',
      errorMessage: error.message,
    };
  }

  return {
    replyText: `Saved "${title}" to your Knowledge Bank — your guests' bot will know this from now on.`,
    summary: `Added knowledge entry "${title}" (${category})`,
    actionType: 'add_knowledge_entry',
    status: 'success',
    details: { entry_id: data?.id, category },
  };
}

async function executeAddTask(
  toolArgs: Record<string, any>,
  ctx: HandlerArgs,
): Promise<AdminHandlerResult> {
  const title = String(toolArgs.title || '').trim();
  const description = toolArgs.description ? String(toolArgs.description).trim() : null;
  const column = ['todo', 'doing', 'done'].includes(String(toolArgs.column))
    ? String(toolArgs.column)
    : 'todo';
  if (!title) {
    return {
      replyText: 'I need a title to create a task.',
      summary: 'add_task rejected: missing title',
      actionType: 'add_task',
      status: 'failed',
      errorMessage: 'Missing title',
    };
  }

  const weddingUuid = await resolveWeddingUuid(ctx.supabase, ctx.weddingSlug);
  if (!weddingUuid) {
    return {
      replyText: 'I couldn\'t find the wedding to file that task against.',
      summary: 'add_task failed: wedding lookup',
      actionType: 'add_task',
      status: 'failed',
      errorMessage: 'Wedding lookup returned no row',
    };
  }

  const { data: existing } = await (ctx.supabase as any)
    .from('wedding_tasks')
    .select('order_index')
    .eq('wedding_id', weddingUuid)
    .eq('column', column)
    .order('order_index', { ascending: false })
    .limit(1);
  const nextOrder = (existing?.[0]?.order_index ?? -1) + 1;

  const { data, error } = await (ctx.supabase as any)
    .from('wedding_tasks')
    .insert({
      wedding_id: weddingUuid,
      title,
      description,
      column,
      order_index: nextOrder,
    })
    .select('id')
    .single();

  if (error) {
    return {
      replyText: `Couldn\'t add that task: ${error.message}`,
      summary: `add_task failed: ${error.message}`,
      actionType: 'add_task',
      status: 'failed',
      errorMessage: error.message,
    };
  }

  return {
    replyText: `Filed "${title}" in ${column.toUpperCase()}.`,
    summary: `Added task "${title}" → ${column}`,
    actionType: 'add_task',
    status: 'success',
    details: { task_id: data?.id, column },
  };
}

async function executeGetStatus(ctx: HandlerArgs): Promise<AdminHandlerResult> {
  const weddingUuid = await resolveWeddingUuid(ctx.supabase, ctx.weddingSlug);

  const [guestCountRes, rsvpYesRes, kbRes, taskRes] = await Promise.all([
    (ctx.supabase as any)
      .from('guests')
      .select('id', { count: 'exact', head: true })
      .eq('wedding_id', ctx.weddingSlug),
    (ctx.supabase as any)
      .from('rsvps')
      .select('id', { count: 'exact', head: true })
      .eq('wedding_id', ctx.weddingSlug)
      .eq('attending', 'yes'),
    weddingUuid
      ? (ctx.supabase as any)
          .from('concierge_knowledge_base')
          .select('id', { count: 'exact', head: true })
          .eq('wedding_id', weddingUuid)
      : Promise.resolve({ count: 0 } as any),
    weddingUuid
      ? (ctx.supabase as any)
          .from('wedding_tasks')
          .select('id', { count: 'exact', head: true })
          .eq('wedding_id', weddingUuid)
          .neq('column', 'done')
      : Promise.resolve({ count: 0 } as any),
  ]);

  const guests = guestCountRes.count ?? 0;
  const yes = rsvpYesRes.count ?? 0;
  const kb = kbRes.count ?? 0;
  const openTasks = taskRes.count ?? 0;

  const lines = [
    `*Status for your wedding*`,
    `• Guests: ${guests}`,
    `• Confirmed RSVPs: ${yes}`,
    `• Knowledge bank entries: ${kb}`,
    `• Open tasks: ${openTasks}`,
  ];

  return {
    replyText: lines.join('\n'),
    summary: `Status: ${guests} guests · ${yes} yes · ${kb} kb · ${openTasks} open tasks`,
    actionType: 'get_status',
    status: 'success',
    details: { guests, rsvp_yes: yes, kb_entries: kb, open_tasks: openTasks },
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────

async function resolveWeddingUuid(
  supabase: SupabaseClient,
  weddingSlug: string,
): Promise<string | null> {
  const { data } = await supabase
    .from('weddings')
    .select('id')
    .eq('slug', weddingSlug)
    .single();
  return (data as { id?: string } | null)?.id ?? null;
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}
