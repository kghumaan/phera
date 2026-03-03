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

/**
 * Extract insights from vendor conversation messages.
 * Returns structured vendor info + insights array.
 */
export async function extractVendorInsights(
  messages: Array<{ sender_name: string; content: string; message_timestamp: string }>
): Promise<ExtractionResult> {
  const transcript = messages
    .map((m) => `[${m.message_timestamp}] ${m.sender_name}: ${m.content}`)
    .join('\n');

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

Rules:
- Always produce exactly ONE "summary" insight that captures the overall conversation state.
- Extract ALL action items, decisions, price quotes, and deadlines mentioned.
- For price_quote, include the amount and what it covers in "content".
- For deadline/action_item, set due_date if a date is mentioned.
- Priority: urgent = within 48h or overdue, high = this week, medium = default, low = nice-to-have.
- If you can't determine the vendor name, use "Unknown Vendor".`,
      },
      {
        role: 'user',
        content: `Analyze this vendor conversation and extract insights:\n\n${transcript}`,
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
// "Ask Phera" — Q&A across all vendor conversations
// ------------------------------------------------------------------

export async function askPhera(params: {
  weddingId: string;
  question: string;
}): Promise<string> {
  const { weddingId, question } = params;

  // Load all vendor messages for this wedding
  const { data: messages, error } = await supabase
    .from('vendor_messages')
    .select('sender_name, content, message_timestamp, conversation_id')
    .eq('wedding_id', weddingId)
    .order('message_timestamp', { ascending: true })
    .limit(500);

  if (error) {
    console.error('Error loading vendor messages for Ask Phera:', error);
    throw error;
  }

  // Load vendor info
  const { data: vendors } = await supabase
    .from('vendors')
    .select('id, name, category, status')
    .eq('wedding_id', weddingId);

  // Load existing insights
  const { data: insights } = await supabase
    .from('vendor_insights')
    .select('insight_type, content, due_date, priority')
    .eq('wedding_id', weddingId);

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
        content: `You are Phera, a wedding coordination assistant. Answer questions about vendor conversations accurately and concisely.

## Vendors
${vendorSummary || 'No vendors registered yet.'}

## Key Insights
${insightSummary || 'No insights extracted yet.'}

## Conversation Transcript
${transcript || 'No messages yet.'}

Rules:
- Answer based ONLY on the data above. Never make up information.
- Be concise (2-4 sentences).
- If the answer isn't in the data, say so.
- Reference specific vendors, dates, and amounts when relevant.`,
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
        content: `You are Phera, a helpful wedding coordinator assistant added to a vendor WhatsApp group chat.
${wedding ? `Wedding: ${wedding.couple_name}, Date: ${wedding.wedding_date_display}, Venue: ${wedding.venue_name}` : ''}

Recent conversation:
${transcript}

Rules:
- Reply naturally as a helpful coordinator in a group chat.
- Be concise (1-3 sentences). This is WhatsApp.
- Help with scheduling, decisions, and coordination.
- If asked something you don't know, say you'll check with the couple.
- Use *bold* for emphasis. No markdown links.`,
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
