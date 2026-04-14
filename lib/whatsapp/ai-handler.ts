import Groq from 'groq-sdk';
import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { buildSystemPrompt, CONCIERGE_TOOLS } from '@/lib/whatsapp/concierge-system-prompt';
import type { WeddingContext, GuestContext } from '@/lib/whatsapp/concierge-system-prompt';
import { dispatchTool } from '@/lib/whatsapp/concierge-tools';
import { logChatMessage } from '@/lib/whatsapp/webhooks';

// Use service role client to bypass RLS for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// LLM providers — initialized lazily, only if API key is set
const gemini = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

const groq = process.env.GROQ_API_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

const deepseek = process.env.DEEPSEEK_API_KEY
  ? new OpenAI({ apiKey: process.env.DEEPSEEK_API_KEY, baseURL: 'https://api.deepseek.com/v1' })
  : null;

const MAX_TOOL_ROUNDS = 5;

/** Tracks which provider handled the last request — for diagnostics only. */
export let lastProvider: string = 'none';

/**
 * Safe query wrapper — returns { data: null } if the table/column doesn't exist.
 * Prevents Promise.all from rejecting when new tables haven't been migrated yet.
 * Accepts Supabase PromiseLike query builders (not just native Promises).
 */
async function safeQuery(queryFn: () => PromiseLike<any>): Promise<{ data: any }> {
  try {
    const result = await queryFn();
    if (result.error) return { data: null };
    return { data: result.data };
  } catch {
    return { data: null };
  }
}

export async function generateAIResponse(params: {
  weddingId: string;
  weddingSlug: string;
  guestId: string;
  guestName: string;
  userMessage: string;
}): Promise<string> {
  const { weddingId, weddingSlug, guestId, guestName, userMessage } = params;

  try {
    // -----------------------------------------------------------------------
    // 1. Update inbound timestamps (best-effort — columns may not exist yet)
    // -----------------------------------------------------------------------
    await safeQuery(() =>
      supabase.from('guests').update({ last_inbound_at: new Date().toISOString() } as any).eq('id', guestId)
    );
    await safeQuery(() =>
      (supabase as any).rpc('increment_unread_count', { guest_uuid: guestId })
    );

    // -----------------------------------------------------------------------
    // 2. Resolve wedding data + UUID
    // -----------------------------------------------------------------------
    // Wedding tables use UUID for wedding_id; guests/rsvps use slug.
    // Resolve the wedding record first so we can use the UUID for content queries.
    const weddingResult = await safeQuery(async () => {
      const byId = await supabase.from('weddings').select('*').eq('id', weddingId).single();
      if (byId.data) return byId;
      return supabase.from('weddings').select('*').eq('slug', weddingId).single();
    });
    const wedding = (weddingResult as any).data as any;
    const weddingUuid = wedding?.id || weddingId; // UUID for content tables
    const weddingSlugForGuests = weddingId; // slug for guests/rsvps tables

    // -----------------------------------------------------------------------
    // 3. Fetch all context in parallel
    // -----------------------------------------------------------------------
    const [
      // Wedding context sources
      eventsResult,
      scheduleResult,
      scheduleItemsResult,
      travelResult,
      travelSectionsResult,
      faqsResult,
      rsvpResult,
      chatResult,
      registryResult,
      shopsResult,
      settingsResult,
      knowledgeResult,
      // Guest context sources (new)
      guestDetailResult,
      flightsResult,
      hotelsResult,
      visasResult,
      issuesResult,
      shuttleResult,
      rsvpCountsResult,
    ] = await Promise.all([
      // Wedding content tables — use UUID
      supabase.from('wedding_events').select('*').eq('wedding_id', weddingUuid).order('order_index'),
      supabase.from('wedding_schedule').select('*').eq('wedding_id', weddingUuid).order('order_index'),
      supabase.from('schedule_items').select('*').order('order_index'),
      supabase.from('wedding_travel_cards').select('*').eq('wedding_id', weddingUuid).order('order_index'),
      (supabase as any).from('travel_sections').select('*').eq('wedding_id', weddingUuid).order('order_index'),
      supabase.from('wedding_faqs').select('*').eq('wedding_id', weddingUuid).order('order_index'),
      // Guest-specific tables — use slug for rsvps, UUID for chat history
      supabase.from('rsvps').select('*').eq('guest_id', guestId),
      (supabase as any)
        .from('whatsapp_chat_history')
        .select('role, content')
        .eq('guest_id', guestId)
        .eq('wedding_id', weddingUuid)
        .order('created_at', { ascending: false })
        .limit(20),
      // More wedding content — UUID
      supabase.from('wedding_registry').select('*').eq('wedding_id', weddingUuid).order('order_index'),
      supabase.from('wedding_shops').select('*').eq('wedding_id', weddingUuid).order('order_index'),
      supabase.from('wedding_settings').select('*').eq('wedding_id', weddingUuid).single(),
      (supabase as any)
        .from('concierge_knowledge_base')
        .select('title, content, category')
        .eq('wedding_id', weddingUuid)
        .eq('is_active', true)
        .order('order_index'),
      // Guest context — safeQuery for tables/columns that may not exist yet
      safeQuery(() =>
        supabase.from('guests').select('id, name, phone, email, wedding_side').eq('id', guestId).single()
      ),
      safeQuery(() =>
        supabase.from('guest_flights').select('airline, flight_number, arrival_datetime, departure_datetime, arrival_airport, departure_airport').eq('guest_id', guestId).eq('wedding_id', weddingSlugForGuests)
      ),
      safeQuery(() =>
        (supabase as any).from('guest_hotels').select('hotel_name, confirmation_number, check_in, check_out, room_type, status').eq('guest_id', guestId).eq('wedding_id', weddingSlugForGuests)
      ),
      safeQuery(() =>
        (supabase as any).from('guest_visas').select('visa_type, status, applied_at, expiry_date').eq('guest_id', guestId).eq('wedding_id', weddingSlugForGuests)
      ),
      safeQuery(() =>
        (supabase as any).from('coordination_issues').select('category, title, priority').eq('guest_id', guestId).not('status', 'in', '("resolved","dismissed")')
      ),
      safeQuery(() =>
        (supabase as any).from('travel_bus_signups').select('*').eq('wedding_id', weddingSlugForGuests).eq('email', '')
      ),
      // RSVP aggregate counts — slug
      supabase
        .from('rsvps')
        .select('attending')
        .eq('wedding_id', weddingSlugForGuests),
    ]);

    // -----------------------------------------------------------------------
    // 4. Unpack results
    // -----------------------------------------------------------------------
    const events = (eventsResult.data as any[]) || [];
    const schedules = (scheduleResult.data as any[]) || [];
    const allScheduleItems = (scheduleItemsResult.data as any[]) || [];
    const travelCards = (travelResult.data as any[]) || [];
    const travelSectionsRaw = (travelSectionsResult.data as any[]) || [];
    const faqs = (faqsResult.data as any[]) || [];
    const rsvps = (rsvpResult.data as any[]) || [];
    const chatHistory = (chatResult.data as any[]) || [];
    const registry = (registryResult.data as any[]) || [];
    const shops = (shopsResult.data as any[]) || [];
    const settings = settingsResult.data as any;
    const knowledgeEntries = (knowledgeResult.data as any[]) || [];

    const guestDetail = (guestDetailResult as any).data as any;
    const flights = ((flightsResult as any).data as any[]) || [];
    const hotels = ((hotelsResult as any).data as any[]) || [];
    const visas = ((visasResult as any).data as any[]) || [];
    const openIssues = ((issuesResult as any).data as any[]) || [];
    const allRsvps = (rsvpCountsResult.data as any[]) || [];

    // Try to read pivot columns separately (they may not exist on the guests table yet)
    let guestPivotData: any = {};
    try {
      const { data } = await supabase
        .from('guests')
        .select('conversation_state, conversation_topic, ai_notes' as any)
        .eq('id', guestId)
        .single();
      if (data) guestPivotData = data;
    } catch {
      // Columns don't exist yet — fine
    }

    // -----------------------------------------------------------------------
    // 4. Assemble WeddingContext
    // -----------------------------------------------------------------------

    // Travel info (prefer travel_sections, fall back to legacy travel_cards)
    let travelInfo: string;
    if (travelSectionsRaw.length > 0) {
      travelInfo = travelSectionsRaw.map((t: any) => {
        let info = `- *${t.title || t.subtitle || t.type}*: `;
        if (t.content) info += t.content;
        if (t.address) info += ` | Address: ${t.address}`;
        if (t.phone) info += ` | Phone: ${t.phone}`;
        return info;
      }).join('\n');
    } else if (travelCards.length) {
      travelInfo = travelCards.map((t: any) => {
        let info = `- *${t.title}*: `;
        if (typeof t.content === 'string') info += t.content;
        else if (t.content && typeof t.content === 'object') info += JSON.stringify(t.content);
        if (t.button_text && t.button_action) info += ` [${t.button_text}: ${t.button_action}]`;
        return info;
      }).join('\n');
    } else {
      travelInfo = 'No travel information available.';
    }

    // Schedule: match items to their parent schedule day
    const scheduleData = schedules.map((s: any) => ({
      day_name: s.day_name || s.date || 'Day',
      items: allScheduleItems
        .filter((item: any) => item.schedule_id === s.id)
        .map((item: any) => ({
          time: item.time || null,
          name: item.name || '',
          description: item.description || null,
          location: item.location || null,
        })),
    }));

    // Registry info
    const registryInfo = registry.length
      ? registry.map((r: any) => `- ${r.emoji || ''} ${r.fund_name}: ${r.description || ''}${r.external_url ? ` (${r.external_url})` : ''}`).join('\n')
      : '';

    // Shops info
    const shopsInfo = shops.length
      ? shops.map((s: any) => `- ${s.name}: ${s.details || ''}${s.url ? ` (${s.url})` : ''}`).join('\n')
      : '';

    // RSVP aggregate counts
    const rsvpCounts = {
      invited: allRsvps.length,
      yes: allRsvps.filter((r: any) => r.attending === 'yes').length,
      no: allRsvps.filter((r: any) => r.attending === 'no').length,
      maybe: allRsvps.filter((r: any) => r.attending === 'maybe').length,
      pending: 0, // can't distinguish pending from not-invited without guest count
    };

    const weddingContext: WeddingContext = {
      couple_name: wedding?.couple_name || 'the couple',
      partner1_name: wedding?.partner1_name || '',
      partner2_name: wedding?.partner2_name || '',
      wedding_date: wedding?.wedding_date_display || wedding?.wedding_date || 'TBD',
      venue_name: wedding?.venue_name || 'TBD',
      venue_location: wedding?.venue_location || 'TBD',
      wedding_slug: weddingSlug,
      rsvp_deadline: wedding?.rsvp_deadline || null,
      rsvp_counts: rsvpCounts,
      events: events.map((e: any) => ({
        name: e.name,
        date: e.date || null,
        time: e.time || null,
        venue: e.venue_name || null,
        dress_code: e.dress_code || null,
        dress_code_description: e.dress_code_description || null,
        ritual_name: e.ritual_name || null,
        ritual_description: e.ritual_description || null,
      })),
      schedule: scheduleData,
      travel_info: travelInfo,
      shuttle_info: '', // TODO: format from transportation tables if needed
      faqs: faqs.map((f: any) => ({ question: f.question, answer: f.answer })),
      knowledge_entries: knowledgeEntries.map((k: any) => ({
        title: k.title,
        category: k.category,
        content: k.content,
      })),
      registry_info: registryInfo,
      shops_info: shopsInfo,
      whatsapp_group_link: settings?.whatsapp_group_link || null,
      welcome_text: wedding?.welcome_text || null,
      special_notes: null,
    };

    // -----------------------------------------------------------------------
    // 5. Assemble GuestContext
    // -----------------------------------------------------------------------

    // Check if we've already greeted in this conversation
    const hasGreeted = chatHistory.some((msg: any) =>
      msg.role === 'assistant' && /hey|hi|hello|welcome/i.test(msg.content?.slice(0, 30) || '')
    );

    const guestContext: GuestContext = {
      guest_id: guestId,
      name: guestName,
      phone: guestDetail?.phone || null,
      email: guestDetail?.email || null,
      wedding_side: guestDetail?.wedding_side || null,
      rsvps: rsvps.map((r: any) => ({
        event_id: r.event_id,
        attending: r.attending,
        guest_count: r.guest_count,
        plus_one: r.plus_one,
        plus_one_name: r.plus_one_name,
        food_preference: r.food_preference,
        dietary_restrictions: r.dietary_restrictions,
        song_request: r.song_request,
        maybe_comment: r.maybe_comment,
      })),
      flights: flights.map((f: any) => ({
        airline: f.airline,
        flight_number: f.flight_number,
        arrival_datetime: f.arrival_datetime,
        departure_datetime: f.departure_datetime,
        arrival_airport: f.arrival_airport,
        departure_airport: f.departure_airport,
      })),
      hotels: hotels.map((h: any) => ({
        hotel_name: h.hotel_name,
        confirmation_number: h.confirmation_number,
        check_in: h.check_in,
        check_out: h.check_out,
        room_type: h.room_type,
        status: h.status,
      })),
      visas: visas.map((v: any) => ({
        visa_type: v.visa_type,
        status: v.status,
        applied_at: v.applied_at,
        expiry_date: v.expiry_date,
      })),
      shuttle_signup: {
        signed_up: false, // TODO: match by guest email in travel_bus_signups
        details: null,
      },
      ai_notes: guestPivotData?.ai_notes || null,
      conversation_state: guestPivotData?.conversation_state || null,
      conversation_topic: guestPivotData?.conversation_topic || null,
      open_issues: openIssues.map((i: any) => ({
        category: i.category,
        title: i.title,
        priority: i.priority,
      })),
      has_been_greeted: hasGreeted,
    };

    // -----------------------------------------------------------------------
    // 6. Build system prompt & message history
    // -----------------------------------------------------------------------
    const systemPrompt = buildSystemPrompt(weddingContext, guestContext);

    const historyMessages: Array<{ role: 'user' | 'assistant'; content: string }> = (chatHistory || [])
      .reverse()
      .filter((msg: any) => msg.role === 'user' || msg.role === 'assistant')
      .map((msg: any) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }));

    // -----------------------------------------------------------------------
    // 7. LLM call with tool use loop
    // -----------------------------------------------------------------------
    const messages: any[] = [
      { role: 'system', content: systemPrompt },
      ...historyMessages,
      { role: 'user', content: userMessage },
    ];

    // -----------------------------------------------------------------------
    // 7. Log inbound message + LLM call
    // -----------------------------------------------------------------------

    // Log the user's message to chat history (use UUID, not slug)
    if (weddingUuid) {
      await logChatMessage({ weddingId: weddingUuid, guestId, role: 'user', content: userMessage }).catch(() => {});
    }

    let finalMessage: string | null = null;

    lastProvider = 'none';

    // Try Gemini first
    if (gemini) {
      try {
        console.log('[ai-handler] Trying Gemini 2.5 Flash...');
        finalMessage = await callGemini(systemPrompt, historyMessages, userMessage, guestId, weddingId);
        if (finalMessage) lastProvider = 'gemini-2.5-flash';
      } catch (err: any) {
        console.warn('[ai-handler] Gemini failed, falling back to Groq:', err.message);
      }
    }

    // Fallback to Groq
    if (!finalMessage && groq) {
      try {
        console.log('[ai-handler] Trying Groq LLaMA 3.3...');
        finalMessage = await callOpenAICompatible(
          groq as any,
          'llama-3.3-70b-versatile',
          messages,
          guestId,
          weddingId,
        );
        if (finalMessage) lastProvider = 'groq-llama-3.3';
      } catch (err: any) {
        console.warn('[ai-handler] Groq failed, falling back to DeepSeek:', err.message);
      }
    }

    // Fallback to DeepSeek
    if (!finalMessage && deepseek) {
      try {
        console.log('[ai-handler] Trying DeepSeek...');
        finalMessage = await callOpenAICompatible(
          deepseek as any,
          'deepseek-chat',
          messages,
          guestId,
          weddingId,
        );
        if (finalMessage) lastProvider = 'deepseek-chat';
      } catch (err: any) {
        console.error('[ai-handler] DeepSeek also failed:', err.message);
      }
    }

    // -----------------------------------------------------------------------
    // 8. Update outbound timestamp
    // -----------------------------------------------------------------------
    await safeQuery(() =>
      supabase.from('guests').update({ last_outbound_at: new Date().toISOString(), unread_count: 0 } as any).eq('id', guestId)
    );

    if (finalMessage) {
      // Log the assistant response to chat history (use UUID, not slug)
      if (weddingUuid) {
        await logChatMessage({ weddingId: weddingUuid, guestId, role: 'assistant', content: finalMessage }).catch(() => {});
      }
      return finalMessage;
    }

    // All providers failed — escalate
    try {
      await dispatchTool(
        'escalate_to_human',
        { reason: 'AI handler error — LLM call failed, guest needs manual response', urgency: 'normal' },
        guestId,
        weddingId,
      );
    } catch {
      // Best-effort
    }

    return getFallbackResponse(guestName, weddingContext.partner1_name, weddingSlug);
  } catch (error) {
    console.error('Error generating AI response:', error);

    // Escalate on LLM failure
    try {
      await dispatchTool(
        'escalate_to_human',
        { reason: 'AI handler error — LLM call failed, guest needs manual response', urgency: 'normal' },
        guestId,
        weddingId,
      );
    } catch {
      // Best-effort escalation
    }

    return getFallbackResponse(guestName, '', weddingSlug);
  }
}

// ---------------------------------------------------------------------------
// LLM Provider: Gemini 2.5 Flash
// ---------------------------------------------------------------------------

async function callGemini(
  systemPrompt: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  userMessage: string,
  guestId: string,
  weddingId: string,
): Promise<string | null> {
  if (!gemini) return null;

  // Convert CONCIERGE_TOOLS to Gemini function declarations
  const functionDeclarations = CONCIERGE_TOOLS.map((t) => ({
    name: t.function.name,
    description: t.function.description,
    parameters: t.function.parameters as any,
  }));

  // Build Gemini contents array (system instruction is separate)
  const contents: Array<{ role: string; parts: any[] }> = [];
  for (const msg of history) {
    contents.push({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    });
  }
  contents.push({ role: 'user', parts: [{ text: userMessage }] });

  let rounds = 0;
  let currentContents = [...contents];

  while (rounds < MAX_TOOL_ROUNDS) {
    rounds++;

    const response = await gemini.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: currentContents,
      config: {
        systemInstruction: systemPrompt,
        tools: [{ functionDeclarations }],
        temperature: 0.7,
        maxOutputTokens: 500,
      },
    });

    const functionCalls = response.functionCalls;

    // No tool calls — return text
    if (!functionCalls || functionCalls.length === 0) {
      const text = response.text || '';
      const { cleanText, parsedCalls } = extractTextToolCalls(text);
      if (parsedCalls.length > 0) {
        for (const call of parsedCalls) {
          await dispatchTool(call.tool, call.params, guestId, weddingId);
        }
        return cleanText.trim() || null;
      }
      return text || null;
    }

    // Execute tool calls
    const functionResponses: Array<{ name: string; response: any }> = [];
    for (const fc of functionCalls) {
      const result = await dispatchTool(fc.name!, fc.args as Record<string, any> || {}, guestId, weddingId);
      functionResponses.push({ name: fc.name!, response: result });
    }

    // Append the model's function call + our function responses to the conversation
    currentContents.push({
      role: 'model',
      parts: functionCalls.map((fc) => ({ functionCall: { name: fc.name, args: fc.args } })),
    });
    currentContents.push({
      role: 'user',
      parts: functionResponses.map((fr) => ({
        functionResponse: { name: fr.name, response: fr.response },
      })),
    });
  }

  return null;
}

// ---------------------------------------------------------------------------
// LLM Provider: OpenAI-compatible (Groq / DeepSeek)
// ---------------------------------------------------------------------------

async function callOpenAICompatible(
  client: { chat: { completions: { create: (params: any) => Promise<any> } } },
  model: string,
  messages: any[],
  guestId: string,
  weddingId: string,
): Promise<string | null> {
  const tools = CONCIERGE_TOOLS.map((t) => ({
    type: 'function' as const,
    function: {
      name: t.function.name,
      description: t.function.description,
      parameters: t.function.parameters,
    },
  }));

  const msgs = [...messages];
  let rounds = 0;

  while (rounds < MAX_TOOL_ROUNDS) {
    rounds++;

    const completion = await client.chat.completions.create({
      model,
      messages: msgs,
      tools,
      tool_choice: 'auto',
      temperature: 0.7,
      max_tokens: 500,
    });

    const choice = completion.choices[0];
    if (!choice?.message) break;

    const assistantMessage = choice.message;

    // No tool calls — return text (with text-based tool call extraction)
    if (!assistantMessage.tool_calls || assistantMessage.tool_calls.length === 0) {
      const content = assistantMessage.content || '';
      const { cleanText, parsedCalls } = extractTextToolCalls(content);
      if (parsedCalls.length > 0) {
        for (const call of parsedCalls) {
          await dispatchTool(call.tool, call.params, guestId, weddingId);
        }
        return cleanText.trim() || null;
      }
      return content || null;
    }

    // Execute tool calls
    msgs.push(assistantMessage);
    for (const toolCall of assistantMessage.tool_calls) {
      let toolParams: Record<string, any> = {};
      try {
        toolParams = JSON.parse(toolCall.function.arguments);
      } catch {
        console.error(`[ai-handler] Failed to parse tool args for ${toolCall.function.name}`);
      }
      const result = await dispatchTool(toolCall.function.name, toolParams, guestId, weddingId);
      msgs.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify(result),
      });
    }

    if (choice.finish_reason === 'stop' && assistantMessage.content) {
      return assistantMessage.content;
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Text-based tool call extraction
// ---------------------------------------------------------------------------

/**
 * Extract tool calls that the LLM wrote as text instead of using structured tool_calls.
 * Matches patterns like: <function(tool_name){...json...}</function>
 * or <function=tool_name>{"param": "value"}</function>
 * Returns cleaned text with tool call syntax removed, plus parsed calls.
 */
function extractTextToolCalls(text: string): {
  cleanText: string;
  parsedCalls: Array<{ tool: string; params: Record<string, any> }>;
} {
  const parsedCalls: Array<{ tool: string; params: Record<string, any> }> = [];

  // Match <function(name){json}</function> or <function=name>{json}</function>
  const pattern = /<function[=(]([a-z_]+)[)>]\s*(\{[^}]*\})\s*<\/function>/gi;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    const toolName = match[1];
    try {
      const params = JSON.parse(match[2]);
      parsedCalls.push({ tool: toolName, params });
    } catch {
      console.error(`[ai-handler] Failed to parse text tool call for ${toolName}:`, match[2]);
    }
  }

  // Strip all function tags from text
  const cleanText = text.replace(/<function[=(][^>]*>[\s\S]*?<\/function>/gi, '').trim();

  return { cleanText, parsedCalls };
}

function getFallbackResponse(guestName: string, partnerName: string, weddingSlug: string): string {
  const siteUrl = `https://phera.io/${weddingSlug}`;
  if (partnerName) {
    return `Hey ${guestName}! I'm having a little trouble right now — let me connect you with ${partnerName}. In the meantime, you can find all the wedding details here: ${siteUrl}`;
  }
  return `Hey ${guestName}! 👋\nI'm having a little trouble right now, but you can find all the wedding details here: ${siteUrl}`;
}
