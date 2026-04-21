import { NextRequest, NextResponse } from 'next/server';
import { parseGuestText, ParsedGuest } from '@/lib/utils/guest-parser';

/**
 * POST /api/guests/smart-parse
 * Parses free-text guest data. Uses pattern matching with optional LLM fallback.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, weddingId } = body;

    if (!text || !weddingId) {
      return NextResponse.json({ error: 'text and weddingId are required' }, { status: 400 });
    }

    // First try pattern matching
    let parsed = parseGuestText(text);

    // If pattern matching fails or is low quality, could use LLM here
    // For now, pattern matching handles most common formats

    return NextResponse.json({
      guests: parsed,
      count: parsed.length,
      method: 'pattern_matching',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
