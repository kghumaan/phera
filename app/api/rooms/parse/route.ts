import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

const GEMINI_MODEL = 'gemini-2.5-flash';

const SYSTEM_PROMPT = `You are a hotel floorplan and room-list parser.

Given a document (PDF, image, or spreadsheet) describing a hotel's available rooms, extract every room into a structured list.

Rules:
- "room_number" is REQUIRED for every entry. Strings only — preserve any letters or zero-padding (e.g. "1207", "PH-2", "A12").
- "floor" is optional. Use the floor designator as it appears (numeric like "1", "12", or labels like "Lobby", "Mezzanine", "PH").
- "hotel_name" is optional. If the document covers a single hotel and a name is visible, set it on every room. If multiple hotels are described, set the appropriate name per room. If no hotel is mentioned, leave it null.
- "capacity" is optional integer (number of beds or persons).
- "notes" is optional, short. Use only when clearly relevant (e.g. "ADA accessible", "suite").
- Skip non-room entries (lobbies, ballrooms, hallways, elevators) unless they are clearly numbered guest rooms.
- Do not fabricate room numbers. If unclear, skip the entry.

Respond with ONLY valid JSON in this exact shape, no prose, no markdown fences:

{
  "rooms": [
    { "room_number": "string", "floor": "string|null", "hotel_name": "string|null", "capacity": number|null, "notes": "string|null" }
  ]
}`;

interface ParsedRoom {
  room_number: string;
  floor: string | null;
  hotel_name: string | null;
  capacity: number | null;
  notes: string | null;
}

function stripJsonFences(text: string): string {
  return text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
}

function validateRooms(input: any): ParsedRoom[] {
  if (!input || !Array.isArray(input.rooms)) return [];

  const seen = new Set<string>();
  const out: ParsedRoom[] = [];

  for (const r of input.rooms) {
    if (!r || typeof r !== 'object') continue;
    const room_number = typeof r.room_number === 'string' ? r.room_number.trim() : String(r.room_number ?? '').trim();
    if (!room_number) continue;

    const hotel_name = typeof r.hotel_name === 'string' && r.hotel_name.trim() ? r.hotel_name.trim() : null;
    const dedupeKey = `${hotel_name || ''}|${room_number.toLowerCase()}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    const floor = typeof r.floor === 'string' && r.floor.trim() ? r.floor.trim() : r.floor != null ? String(r.floor) : null;
    const capacityNum = typeof r.capacity === 'number' ? Math.floor(r.capacity) : Number.parseInt(r.capacity, 10);
    const capacity = Number.isFinite(capacityNum) && capacityNum > 0 ? capacityNum : null;
    const notes = typeof r.notes === 'string' && r.notes.trim() ? r.notes.trim() : null;

    out.push({ room_number, floor, hotel_name, capacity, notes });
  }

  return out;
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY is not configured' }, { status: 500 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 20MB)' }, { status: 400 });
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString('base64');

    // Gemini supports inline PDF + image data; for spreadsheets/CSV, send as text/plain
    let mimeType = file.type || 'application/octet-stream';
    if (ext === 'csv' || ext === 'tsv' || ext === 'txt') mimeType = 'text/plain';
    else if (ext === 'pdf') mimeType = 'application/pdf';
    else if (ext === 'png') mimeType = 'image/png';
    else if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
    else if (ext === 'webp') mimeType = 'image/webp';
    // For xlsx/xls Gemini doesn't natively parse — convert client-side or warn
    if (ext === 'xlsx' || ext === 'xls') {
      return NextResponse.json(
        { error: 'Excel files are not supported directly. Convert to CSV or PDF first.' },
        { status: 400 },
      );
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [
            {
              role: 'user',
              parts: [
                { text: 'Extract all hotel rooms from this document.' },
                { inline_data: { mime_type: mimeType, data: base64 } },
              ],
            },
          ],
          generationConfig: {
            response_mime_type: 'application/json',
            temperature: 0.1,
          },
        }),
      },
    );

    if (!res.ok) {
      const errText = await res.text();
      console.error('Gemini parse failed:', res.status, errText);
      return NextResponse.json(
        { error: `LLM request failed: ${res.status}` },
        { status: 502 },
      );
    }

    const data = await res.json();
    const textPart = data.candidates?.[0]?.content?.parts?.find((p: any) => typeof p.text === 'string');
    if (!textPart?.text) {
      return NextResponse.json({ error: 'LLM returned no parseable content' }, { status: 502 });
    }

    let parsed: any;
    try {
      parsed = JSON.parse(stripJsonFences(textPart.text));
    } catch (err) {
      console.error('Failed to JSON.parse LLM output:', textPart.text);
      return NextResponse.json({ error: 'LLM returned invalid JSON' }, { status: 502 });
    }

    const rooms = validateRooms(parsed);
    return NextResponse.json({ rooms, count: rooms.length });
  } catch (err: any) {
    console.error('rooms/parse error:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
