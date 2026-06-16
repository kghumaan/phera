import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { getAuthenticatedClient } from '@/lib/utils/auth-helpers';
import { checkRateLimit } from '@/lib/utils/rate-limiter';

export const runtime = 'nodejs';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Orpheus is a very natural-sounding open TTS model (Groq-hosted). One-time
// terms acceptance required in the Groq console before first use. Both model
// and voice are swappable via env without a deploy.
// Orpheus English voices: tara, leah, jess, leo, dan, mia, zac, zoe.
const DEFAULT_VOICE = process.env.AGENT_TTS_VOICE || 'tara';
const TTS_MODEL = process.env.AGENT_TTS_MODEL || 'canopylabs/orpheus-v1-english';
const MAX_CHARS = 1200;

/**
 * POST /api/agent/tts  Body: { text: string }
 * Returns audio/mpeg of the agent speaking `text` (Groq PlayAI TTS).
 */
export async function POST(request: NextRequest) {
  const limited = checkRateLimit(request, { maxRequests: 40, windowMs: 60_000, keyPrefix: 'agent-tts' });
  if (limited) return limited;

  const { supabase, user } = await getAuthenticatedClient();
  if (!supabase || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { text?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const text = body.text?.trim();
  if (!text) {
    return NextResponse.json({ error: 'Missing text' }, { status: 400 });
  }

  try {
    const speech = await groq.audio.speech.create({
      model: TTS_MODEL,
      voice: DEFAULT_VOICE,
      input: text.slice(0, MAX_CHARS),
      response_format: 'mp3',
    });
    const audio = Buffer.from(await speech.arrayBuffer());
    return new Response(audio, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Agent TTS failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'TTS failed' },
      { status: 500 }
    );
  }
}
