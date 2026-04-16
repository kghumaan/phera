import Groq from 'groq-sdk';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------

export interface VendorInsight {
  insight_type: 'summary' | 'action_item' | 'decision' | 'price_quote' | 'deadline';
  content: string;
  due_date?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  metadata?: Record<string, unknown>;
}

export interface ExtractionResult {
  vendor_name: string;
  vendor_category: string;
  insights: VendorInsight[];
}

// ------------------------------------------------------------------
// Conversation Analysis
// ------------------------------------------------------------------

export interface VendorContext {
  vendorMembers: string[];
  adminMembers: string[];
}

/**
 * Extract insights from vendor conversation messages.
 * Returns structured vendor info + insights array.
 * When vendorContext is provided, only extracts couple/planner/admin-side action items.
 */
export async function extractVendorInsights(
  messages: Array<{ sender_name: string; content: string; message_timestamp: string }>,
  vendorContext?: VendorContext
): Promise<ExtractionResult> {
  const transcript = messages
    .map((m) => `[${m.message_timestamp}] ${m.sender_name}: ${m.content}`)
    .join('\n');

  const vendorContextBlock = vendorContext
    ? `\n\nVendor-side participants: ${vendorContext.vendorMembers.join(', ') || 'unknown'}
Admin/couple-side participants: ${vendorContext.adminMembers.join(', ') || 'unknown'}`
    : '';

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    temperature: 0.1,
    messages: [
      {
        role: 'system',
        content: `You analyze WhatsApp vendor conversations for wedding planning. Extract structured insights.

Return ONLY valid JSON, no markdown, no explanation. Use this exact schema:
{
  "vendor_name": "name of the vendor/business",
  "vendor_category": "one of: Venue, Catering, Photography, Videography, Florist, DJ/Music, Decor, Makeup, Mehndi, Priest, Invitations, Cake, Rental, Transportation, Planner, Other",
  "insights": [
    {
      "insight_type": "summary | action_item | decision | price_quote | deadline",
      "content": "clear description",
      "due_date": "YYYY-MM-DD or null",
      "priority": "low | medium | high | urgent"
    }
  ]
}

## Vendor Name Detection
- Use the BUSINESS name, not a person's first name. E.g. "Raj's Catering" not "Raj", "Elite Photography" not "Priya".
- If the group chat name contains a business name, prefer that.
- If you can't determine a business name, use "Unknown Vendor".

## Summary (exactly ONE, insight_type: "summary")
- NEVER start with "The conversation is about...", "This conversation covers...", or similar preamble.
- Jump directly into the topic. E.g. "Transportation for 200 wedding guests, including shuttle service from hotel to venue."
- Write TWO paragraphs separated by \\n\\n:
  - Paragraph 1: What this vendor provides — services discussed, scope, key details.
  - Paragraph 2: Recent activity — what happened in the last 1-2 weeks, latest discussions, open questions, pending decisions.

## Action Items (insight_type: "action_item")
- ONLY extract items pending on the couple/planner/admin side. Do NOT include tasks the vendor needs to do.${vendorContext ? ` The vendor participants are: [${vendorContext.vendorMembers.join(', ')}]. Any tasks assigned to them should NOT appear as action items.` : ''}
- Each action item must be SPECIFIC and ACTIONABLE: "Send $500 deposit to Elite Catering by March 15" not "Follow up on catering".
- Include WHO needs to do WHAT by WHEN wherever possible.

## Price Quotes (insight_type: "price_quote")
- Include the exact amount, what it covers, and any conditions (e.g. "per plate", "including setup").

## Decisions (insight_type: "decision")
- Only confirmed decisions, not proposals. Include who decided and when.

## Deadlines (insight_type: "deadline")
- Set due_date in YYYY-MM-DD format if a date is mentioned or can be inferred.

## Priority Guidelines
- urgent: within 48 hours or overdue
- high: this week or blocking other tasks
- medium: this month, standard follow-ups
- low: nice-to-have, no time pressure`,
      },
      {
        role: 'user',
        content: `Analyze this vendor conversation and extract insights:${vendorContextBlock}\n\n${transcript}`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? '{}';

  try {
    const jsonStr = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(jsonStr) as ExtractionResult;
  } catch {
    console.error('Failed to parse AI extraction:', raw);
    return {
      vendor_name: 'Unknown Vendor',
      vendor_category: 'Other',
      insights: [
        {
          insight_type: 'summary',
          content: 'Could not automatically analyze this conversation. Please review manually.',
          priority: 'medium',
        },
      ],
    };
  }
}

// ------------------------------------------------------------------
// Save insights to database
// ------------------------------------------------------------------

export async function saveInsights(params: {
  conversationId: string;
  weddingId: string;
  vendorId: string;
  insights: VendorInsight[];
}) {
  const { conversationId, weddingId, vendorId, insights } = params;

  // Delete old insights for this conversation before inserting fresh ones
  await supabase
    .from('vendor_insights')
    .delete()
    .eq('conversation_id', conversationId);

  if (insights.length === 0) return;

  const rows = insights.map((i) => ({
    conversation_id: conversationId,
    wedding_id: weddingId,
    vendor_id: vendorId,
    insight_type: i.insight_type,
    content: i.content,
    due_date: i.due_date || null,
    priority: i.priority || 'medium',
    metadata: i.metadata || {},
  }));

  const { error } = await supabase.from('vendor_insights').insert(rows);
  if (error) {
    console.error('Failed to save vendor insights:', error);
    throw error;
  }
}

// ------------------------------------------------------------------
// Smart Member Role Prediction
// ------------------------------------------------------------------

export interface RolePrediction {
  phone: string;
  predicted_role: 'vendor' | 'admin' | 'member';
  confidence: 'low' | 'medium' | 'high';
}

/**
 * Analyze message samples per participant to predict their role
 * (vendor, admin/couple, or regular member).
 */
export async function predictMemberRoles(
  members: Array<{ phone: string; name: string | null }>,
  messages: Array<{ sender_phone?: string; sender_name: string; content: string }>,
): Promise<RolePrediction[]> {
  // Build per-participant message samples (up to 10 messages each)
  const samplesByPhone = new Map<string, string[]>();
  for (const m of messages) {
    const key = m.sender_phone || m.sender_name;
    if (!key) continue;
    const existing = samplesByPhone.get(key) || [];
    if (existing.length < 10) {
      existing.push(m.content);
      samplesByPhone.set(key, existing);
    }
  }

  // Build participant list for the prompt
  const participantList = members.map((m) => {
    const key = m.phone || m.name || '';
    const samples = samplesByPhone.get(key) || samplesByPhone.get(m.name || '') || [];
    return {
      phone: m.phone,
      name: m.name || 'Unknown',
      sample_messages: samples.slice(0, 8),
    };
  }).filter((p) => p.sample_messages.length > 0);

  if (participantList.length === 0) return [];

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    temperature: 0.1,
    messages: [
      {
        role: 'system',
        content: `You classify participants in a wedding vendor WhatsApp group chat.

Return ONLY valid JSON array, no markdown, no explanation:
[
  { "phone": "...", "predicted_role": "vendor | admin | member", "confidence": "low | medium | high" }
]

## Classification Rules

**vendor**: Provides services, quotes prices, discusses deliverables, uses business language, offers options/packages, sends invoices or payment details.
**admin**: The couple or wedding planner. Asks questions, requests quotes, makes decisions, approves/rejects proposals, discusses budget.
**member**: Other participants (family, friends, assistants) who don't fit vendor or admin patterns.

## Signals
- Quoting prices, "we offer", "our package", "per plate" → vendor
- "We'd like", "can you", "what's the cost", "we've decided" → admin
- Short replies, emoji-only, forwarded messages → member (low confidence)
- If unsure, classify as "member" with "low" confidence.`,
      },
      {
        role: 'user',
        content: `Classify these participants:\n${JSON.stringify(participantList, null, 2)}`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? '[]';
  try {
    const jsonStr = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(jsonStr) as RolePrediction[];
  } catch {
    console.error('Failed to parse role predictions:', raw);
    return [];
  }
}

// ------------------------------------------------------------------
// "Ask Phera" — Q&A across all vendor conversations
// ------------------------------------------------------------------

export async function askPhera(params: {
  weddingId: string;
  question: string;
  conversationId?: string;
}): Promise<string> {
  const { weddingId, question, conversationId } = params;

  // Load vendor messages — scoped to conversation if provided
  let messagesQuery = supabase
    .from('vendor_messages')
    .select('sender_name, content, message_timestamp, conversation_id')
    .eq('wedding_id', weddingId)
    .order('message_timestamp', { ascending: true })
    .limit(500);

  if (conversationId) {
    messagesQuery = messagesQuery.eq('conversation_id', conversationId);
  }

  const { data: messages, error } = await messagesQuery;

  if (error) {
    console.error('Error loading vendor messages for Ask Phera:', error);
    throw error;
  }

  // Load vendor info
  const { data: vendors } = await supabase
    .from('vendors')
    .select('id, name, category, status')
    .eq('wedding_id', weddingId);

  // Load existing insights — scoped to conversation if provided
  let insightsQuery = supabase
    .from('vendor_insights')
    .select('insight_type, content, due_date, priority')
    .eq('wedding_id', weddingId);

  if (conversationId) {
    insightsQuery = insightsQuery.eq('conversation_id', conversationId);
  }

  const { data: insights } = await insightsQuery;

  const vendorSummary = (vendors || [])
    .map((v) => `- ${v.name} (${v.category || 'Unknown'}) — ${v.status}`)
    .join('\n');

  const insightSummary = (insights || [])
    .map((i) => `[${i.insight_type}] ${i.content}${i.due_date ? ` (due: ${i.due_date})` : ''}`)
    .join('\n');

  const transcript = (messages || [])
    .map((m) => `[${m.message_timestamp}] ${m.sender_name}: ${m.content}`)
    .join('\n');

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    temperature: 0.4,
    messages: [
      {
        role: 'system',
        content: `You are Phera, a professional yet warm wedding coordination assistant. Answer questions about vendor conversations accurately.

## Vendors
${vendorSummary || 'No vendors registered yet.'}

## Key Insights
${insightSummary || 'No insights extracted yet.'}

## Conversation Transcript
${transcript || 'No messages yet.'}

## Response Rules
- Answer based ONLY on the data above. Never make up information.
- Use **bold** for vendor names, amounts, and dates.
- Use bullet points (- ) for lists of items, vendors, or options.
- Use numbered lists (1. ) for sequential steps or ranked recommendations.
- Length: 2-5 sentences depending on complexity. Simple factual questions get 2 sentences; comparisons or multi-vendor answers get up to 5.
- When comparing vendors, use this format:
  **Vendor A** — $X,000 for [service]. [Key detail].
  **Vendor B** — $Y,000 for [service]. [Key detail].
- If the answer isn't in the data, say "I don't have that information in your vendor conversations" — don't guess.
- Reference specific vendors, dates, and amounts when relevant.
- Tone: professional but warm, like a knowledgeable friend helping with wedding planning.`,
      },
      {
        role: 'user',
        content: question,
      },
    ],
  });

  return (
    completion.choices[0]?.message?.content ||
    "I couldn't find an answer to that in your vendor conversations."
  );
}

// ------------------------------------------------------------------
// Generate coordinator reply for @Phera mentions in group chats
// ------------------------------------------------------------------

export async function generateCoordinatorReply(params: {
  weddingId: string;
  conversationId: string;
  senderName: string;
  message: string;
}): Promise<string> {
  const { weddingId, conversationId, senderName, message } = params;

  // Load recent messages from this conversation for context
  const { data: recentMessages } = await supabase
    .from('vendor_messages')
    .select('sender_name, content, message_timestamp')
    .eq('conversation_id', conversationId)
    .order('message_timestamp', { ascending: false })
    .limit(30);

  const transcript = (recentMessages || [])
    .reverse()
    .map((m) => `${m.sender_name}: ${m.content}`)
    .join('\n');

  // Load wedding details for context
  const { data: wedding } = await supabase
    .from('weddings')
    .select('couple_name, wedding_date_display, venue_name')
    .eq('id', weddingId)
    .single();

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    temperature: 0.5,
    max_tokens: 300,
    messages: [
      {
        role: 'system',
        content: `You are Phera, a helpful wedding coordinator assistant in a vendor WhatsApp group chat.
${wedding ? `Wedding: ${wedding.couple_name}, Date: ${wedding.wedding_date_display}, Venue: ${wedding.venue_name}` : ''}

Recent conversation:
${transcript}

## Reply Rules
- Be concise (1-3 sentences). This is WhatsApp, not email.
- Match the tone of the conversation — casual if casual, professional if professional.
- Use *bold* for emphasis (WhatsApp formatting). No markdown links or headers.
- Use line breaks for readability if listing 2+ items.

## Boundaries
- NEVER make decisions on behalf of the couple (budget approvals, vendor selection, design choices). Instead say "Let me check with [couple name] and get back to you."
- NEVER discuss or confirm payment details. Redirect: "I'll have the couple reach out about payment directly."
- You CAN help with: scheduling, sharing logistics info, confirming timelines, answering factual questions about the wedding.
- If asked something you don't know, say you'll check and follow up.`,
      },
      {
        role: 'user',
        content: `${senderName} said: ${message}`,
      },
    ],
  });

  return (
    completion.choices[0]?.message?.content ||
    "I'll check with the couple and get back to you!"
  );
}
