/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export const runtime = 'nodejs';
export const maxDuration = 60;

const GEMINI_MODEL = 'gemini-2.5-flash';

const SYSTEM_PROMPT = `You are a hotel floorplan and room-list parser.

Given a document (PDF, image, or spreadsheet) describing a hotel's available rooms, extract every room into a structured list.

Rules:
- "room_number" is REQUIRED for every entry. Strings only — preserve any letters or zero-padding (e.g. "1207", "PH-2", "A12").
- "floor" is optional. Use the floor designator as it appears (numeric like "1", "12", or labels like "Lobby", "Mezzanine", "PH").
- "hotel_name" is optional. If the document covers a single hotel and a name is visible, set it on every room. If multiple hotels are described, set the appropriate name per room. If no hotel is mentioned, leave it null.
- "bed_type" is optional short string describing the bed configuration as stated or implied. Normalize to a concise phrase in Title Case. Examples: "King", "Queen", "1 King", "2 Queens", "2 Doubles", "Twin", "1 King + Sofa Bed", "Junior Suite", "2 Twins", "Connecting Suite". If nothing is visible, leave null — never guess.
- "capacity" is optional integer. Estimate it from any of these clues:
    * An explicit column ("Capacity", "Sleeps", "Max Occupancy", "Pax", "Beds").
    * Bed type ("King" → 2, "Queen" → 2, "Twin" → 2, "Double" → 2, "Single" → 1, "Suite" → 4, "Connecting Suite" → 4, "2 Queens" → 4, "2 Doubles" → 4, "2 Twins" → 2, "1 King + Sofa Bed" → 3).
    * Room type ("Standard" → 2, "Deluxe" → 2, "Family Room" → 4, "Junior Suite" → 3).
    * Number of repeated rows for the same room number (each row may represent one occupant — use the row count as capacity in that case).
    * Floorplan shapes implying bed counts.
  When uncertain, prefer 2 over null for typical hotel rooms; only leave null when there's no signal at all.
- "notes" is optional, short. Use only when clearly relevant (e.g. "ADA accessible", "suite", "connecting").
- Skip non-room entries (lobbies, ballrooms, hallways, elevators) unless they are clearly numbered guest rooms.
- Do not fabricate room numbers. If unclear, skip the entry.
- If the same room appears multiple times in the input, output it ONCE with the best-known fields merged (highest-confidence floor, max capacity seen, etc.).

Respond with ONLY valid JSON in this exact shape, no prose, no markdown fences:

{
  "rooms": [
    { "room_number": "string", "floor": "string|null", "hotel_name": "string|null", "bed_type": "string|null", "capacity": number|null, "notes": "string|null" }
  ]
}`;

interface ParsedRoom {
  room_number: string;
  floor: string | null;
  hotel_name: string | null;
  bed_type: string | null;
  capacity: number | null;
  notes: string | null;
}

function stripJsonFences(text: string): string {
  return text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
}

// Mirror of lib/supabase/rooms-service.canonicalizeRoomNumber. Kept inline
// to avoid pulling the supabase client into this server route's bundle.
function canonicalize(raw: string): string {
  if (!raw) return '';
  let s = raw.trim().replace(/\s+/g, ' ');
  s = s.replace(/\d+/g, (digits) => {
    const trimmed = digits.replace(/^0+/, '');
    return trimmed.length === 0 ? '0' : trimmed;
  });
  s = s.replace(/^[a-z]+/, (m) => m.toUpperCase());
  return s;
}

function validateRooms(input: any): ParsedRoom[] {
  if (!input || !Array.isArray(input.rooms)) return [];

  const merged = new Map<string, ParsedRoom>();

  for (const r of input.rooms) {
    if (!r || typeof r !== 'object') continue;
    const rawNumber = typeof r.room_number === 'string' ? r.room_number : String(r.room_number ?? '');
    const room_number = canonicalize(rawNumber);
    if (!room_number) continue;

    const hotel_name = typeof r.hotel_name === 'string' && r.hotel_name.trim() ? r.hotel_name.trim() : null;
    const dedupeKey = `${(hotel_name || '').toLowerCase()}|${room_number.toLowerCase()}`;

    const floor = typeof r.floor === 'string' && r.floor.trim() ? r.floor.trim() : r.floor != null ? String(r.floor) : null;
    const bed_type = typeof r.bed_type === 'string' && r.bed_type.trim() ? r.bed_type.trim() : null;
    const capacityNum = typeof r.capacity === 'number' ? Math.floor(r.capacity) : Number.parseInt(r.capacity, 10);
    const capacity = Number.isFinite(capacityNum) && capacityNum > 0 ? capacityNum : null;
    const notes = typeof r.notes === 'string' && r.notes.trim() ? r.notes.trim() : null;

    const incoming: ParsedRoom = { room_number, floor, hotel_name, bed_type, capacity, notes };

    const existing = merged.get(dedupeKey);
    if (existing) {
      // Merge: keep the highest-confidence values from either occurrence.
      merged.set(dedupeKey, {
        room_number, // canonical form is identical for both
        floor: existing.floor || incoming.floor,
        hotel_name: existing.hotel_name || incoming.hotel_name,
        bed_type: existing.bed_type || incoming.bed_type,
        capacity: Math.max(existing.capacity ?? 0, incoming.capacity ?? 0) || null,
        notes: existing.notes || incoming.notes,
      });
    } else {
      merged.set(dedupeKey, incoming);
    }
  }

  return Array.from(merged.values());
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
    let buffer = Buffer.from(await file.arrayBuffer());
    let mimeType = file.type || 'application/octet-stream';

    // Gemini handles PDF + image natively, but doesn't parse Excel. Convert
    // .xlsx/.xls to CSV here so Gemini sees the raw rows; CSV/TSV/TXT pass
    // through as text. If the workbook has multiple sheets, concatenate
    // them with a sheet-name marker so the LLM sees structure.
    if (ext === 'xlsx' || ext === 'xls') {
      try {
        const wb = XLSX.read(buffer, { type: 'buffer' });
        const parts: string[] = [];
        for (const name of wb.SheetNames) {
          const ws = wb.Sheets[name];
          const csv = XLSX.utils.sheet_to_csv(ws);
          if (csv.trim()) {
            parts.push(`### Sheet: ${name}\n${csv}`);
          }
        }
        const text = parts.join('\n\n');
        if (!text.trim()) {
          return NextResponse.json({ error: 'Excel file is empty' }, { status: 400 });
        }
        buffer = Buffer.from(text, 'utf8');
        mimeType = 'text/plain';
      } catch (err: any) {
        return NextResponse.json({ error: `Failed to read Excel: ${err.message}` }, { status: 400 });
      }
    } else if (ext === 'csv' || ext === 'tsv' || ext === 'txt') {
      mimeType = 'text/plain';
    } else if (ext === 'pdf') mimeType = 'application/pdf';
    else if (ext === 'png') mimeType = 'image/png';
    else if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
    else if (ext === 'webp') mimeType = 'image/webp';

    const base64 = buffer.toString('base64');

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
    } catch {
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
