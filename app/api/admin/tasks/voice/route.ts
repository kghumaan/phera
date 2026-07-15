import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { getAuthenticatedClient } from '@/lib/utils/auth-helpers';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient();
    if (!supabase || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const audioFile = formData.get('audio') as File | null;

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // Step 1: Transcribe with Groq Whisper Large v3 Turbo
    const transcription = await groq.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-large-v3-turbo',
      language: 'en',
    });

    const transcript = transcription.text;

    if (!transcript || transcript.trim().length === 0) {
      return NextResponse.json({ error: 'Could not transcribe audio — no speech detected' }, { status: 422 });
    }

    // Step 2: Extract tasks using Groq LLM
    const extraction = await groq.chat.completions.create({
      model: 'openai/gpt-oss-120b',
      reasoning_format: 'hidden', // gpt-oss reasons; keep CoT out of message.content
      temperature: 0.1,
      messages: [
        {
          role: 'system',
          content: `You extract actionable tasks from voice note transcripts about wedding planning.
Return ONLY a valid JSON array, no markdown, no explanation.
Each item: { "title": "short imperative title", "description": "optional extra detail or empty string", "tag": "one-word category" }
If a task relates to a specific wedding event name, use that as the tag.
Common tags: Vendors, Guests, Venue, Catering, Decor, Photography, Music, Attire, RSVPs, Travel, Budget.
If no clear tasks exist, return an empty array [].`,
        },
        {
          role: 'user',
          content: `Extract actionable tasks from this voice note transcript:\n\n"${transcript}"`,
        },
      ],
    });

    const rawContent = extraction.choices[0]?.message?.content ?? '[]';

    // Parse the JSON from the LLM response (handle possible markdown wrapping)
    let tasks: { title: string; description: string; tag: string }[];
    try {
      const jsonStr = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      tasks = JSON.parse(jsonStr);
    } catch {
      console.error('Failed to parse LLM task extraction:', rawContent);
      tasks = [];
    }

    return NextResponse.json({ transcript, tasks });
  } catch (err: unknown) {
    console.error('Voice task extraction error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
