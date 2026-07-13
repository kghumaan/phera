import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedClient } from '@/lib/utils/auth-helpers';
import { checkRateLimit } from '@/lib/utils/rate-limiter';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

interface ClassifyRequest {
  message: string;
  currentQuestionId: string;
  collectedFields: string[];
  availableFields: Record<string, string>;
}

interface ClassifyResponse {
  intent: 'answer' | 'go_back' | 'change_value' | 'question' | 'general_inquiry' | 'unclear';
  targetField?: string;
  extractedValue?: string;
  helpResponse?: string;
}

const SYSTEM_PROMPT = `You are an intent classifier for a wedding website builder chatbot. The user is answering questions to build their wedding site.

Classify the user's message into one of these intents:
- "answer": The user is answering the current question normally
- "go_back": The user wants to go back and change a previous answer (e.g., "change the venue", "go back to colors", "I want to update the date")
- "change_value": The user wants to directly change a specific value without navigating (e.g., "make the color blue" when they're on a different question)
- "question": The user is asking a simple question about the current step or needs help (e.g., "what colors are available?", "how does this work?")
- "general_inquiry": The user is asking a freeform question unrelated to the current builder step (e.g., "how many guests RSVP'd?", "what can Phera do?", "how do PINs work?", "tell me about my wedding setup")
- "unclear": The message doesn't clearly fit any category

If intent is "go_back" or "change_value", identify the targetField from the available fields.
If intent is "change_value", extract the new value.
If intent is "question", provide a brief helpful response.

Respond in JSON only: {"intent":"...","targetField":"...","extractedValue":"...","helpResponse":"..."}`;

export async function POST(request: NextRequest) {
  try {
    const { user } = await getAuthenticatedClient();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const limited = checkRateLimit(request, { maxRequests: 30, windowMs: 60_000, keyPrefix: 'build-ai-classify' });
    if (limited) return limited;

    const body: ClassifyRequest = await request.json();
    const { message, currentQuestionId, collectedFields, availableFields } = body;

    const groqApiKey = process.env.GROQ_API_KEY;

    // Graceful fallback: if no API key, treat as normal answer
    if (!groqApiKey) {
      return NextResponse.json({ intent: 'answer' });
    }

    const userPrompt = `Current question: ${currentQuestionId}
Already answered: ${collectedFields.join(', ')}
Available fields to change: ${JSON.stringify(availableFields)}

User message: "${message}"

Classify this message. JSON only:`;

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.1,
        max_tokens: 150,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      console.error('Groq API error:', response.status, await response.text());
      // Graceful fallback
      return NextResponse.json({ intent: 'answer' });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json({ intent: 'answer' });
    }

    const parsed: ClassifyResponse = JSON.parse(content);

    // Validate intent
    const validIntents = ['answer', 'go_back', 'change_value', 'question', 'general_inquiry', 'unclear'];
    if (!validIntents.includes(parsed.intent)) {
      return NextResponse.json({ intent: 'answer' });
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Classify API error:', error);
    // Always gracefully degrade to treating message as a normal answer
    return NextResponse.json({ intent: 'answer' });
  }
}
