import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { getAuthenticatedClient } from '@/lib/utils/auth-helpers';
import { checkRateLimit } from '@/lib/utils/rate-limiter';

export const runtime = 'nodejs';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// --- Cartesia (primary, most realistic) ------------------------------------
// Sonic is a low-latency, highly natural neural voice. Set CARTESIA_API_KEY to
// enable it; without the key we fall straight through to Groq Orpheus. Voice +
// model are env-swappable without a deploy. Default voice is Cartesia's public
// "Barbershop Man" id — override CARTESIA_VOICE_ID with a voice you prefer
// (browse them at play.cartesia.ai).
const CARTESIA_API_KEY = process.env.CARTESIA_API_KEY;
const CARTESIA_VOICE_ID = process.env.CARTESIA_VOICE_ID || '694f9389-aac1-45b6-b726-9d9369183238';
const CARTESIA_MODEL = process.env.CARTESIA_MODEL || 'sonic-2';
const CARTESIA_VERSION = '2025-04-16';
// Speaking pace. Number in [-1, 1] (positive = faster) or a step like
// "slow"/"normal"/"fast"/"fastest". Slightly fast by default — the planner
// should feel brisk and conversational, not languid.
const CARTESIA_SPEED_RAW = process.env.CARTESIA_SPEED ?? '0.3';
const CARTESIA_SPEED: string | number = Number.isNaN(Number(CARTESIA_SPEED_RAW))
  ? CARTESIA_SPEED_RAW
  : Number(CARTESIA_SPEED_RAW);

// --- Groq Orpheus (fallback) -----------------------------------------------
// Natural open TTS, ~95ms TTFB. One-time terms acceptance in the Groq console
// before first use. Orpheus English voices: tara, leah, jess, leo, dan, mia,
// zac, zoe.
const DEFAULT_VOICE = process.env.AGENT_TTS_VOICE || 'tara';
const TTS_MODEL = process.env.AGENT_TTS_MODEL || 'canopylabs/orpheus-v1-english';

const MAX_CHARS = 1200;

async function cartesiaSpeak(text: string): Promise<Buffer> {
  const res = await fetch('https://api.cartesia.ai/tts/bytes', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${CARTESIA_API_KEY}`,
      'Cartesia-Version': CARTESIA_VERSION,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model_id: CARTESIA_MODEL,
      transcript: text,
      voice: { mode: 'id', id: CARTESIA_VOICE_ID, __experimental_controls: { speed: CARTESIA_SPEED } },
      language: 'en',
      output_format: { container: 'mp3', sample_rate: 44100, bit_rate: 128000 },
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Cartesia TTS ${res.status}: ${detail.slice(0, 200)}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

async function groqSpeak(text: string): Promise<Buffer> {
  const speech = await groq.audio.speech.create({
    model: TTS_MODEL,
    voice: DEFAULT_VOICE,
    input: text,
    response_format: 'mp3',
  });
  return Buffer.from(await speech.arrayBuffer());
}

/**
 * POST /api/agent/tts  Body: { text: string }
 * Returns audio/mpeg of the agent speaking `text`. Tries Cartesia Sonic first
 * (most realistic), falls back to Groq Orpheus; if both fail the client speaks
 * via the browser voice as a last resort.
 */
export async function POST(request: NextRequest) {
  const limited = checkRateLimit(request, { maxRequests: 80, windowMs: 60_000, keyPrefix: 'agent-tts' });
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
  const input = text.slice(0, MAX_CHARS);

  let audio: Buffer | null = null;
  let lastError: unknown = null;

  if (CARTESIA_API_KEY) {
    try {
      audio = await cartesiaSpeak(input);
    } catch (error) {
      lastError = error;
      console.error('Cartesia TTS failed, falling back to Groq:', error instanceof Error ? error.message : error);
    }
  }

  if (!audio) {
    try {
      audio = await groqSpeak(input);
    } catch (error) {
      lastError = error;
      console.error('Groq TTS failed:', error instanceof Error ? error.message : error);
    }
  }

  if (!audio) {
    return NextResponse.json(
      { error: lastError instanceof Error ? lastError.message : 'TTS failed' },
      { status: 500 }
    );
  }

  return new Response(new Uint8Array(audio), {
    headers: {
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'no-store',
    },
  });
}
