import { NextRequest, NextResponse } from 'next/server';
import { sanitizeColumnAnalysis } from '@/lib/admin/smart-column-mapping';
import { checkRateLimit } from '@/lib/utils/rate-limiter';

export const runtime = 'nodejs';
export const maxDuration = 30;

const GEMINI_MODEL = 'gemini-2.5-flash';

const SYSTEM_PROMPT = `You are a wedding guest-list spreadsheet column classifier.

Given the column headers and a few sample rows from an uploaded guest list, classify EVERY header into exactly one field:

- "name" — the primary guest's full name.
- "first_name" / "last_name" — split name columns.
- "email" — the primary guest's email.
- "phone" — the primary guest's phone / WhatsApp number.
- "wedding_side" — bride/groom/both side.
- "tags" — grouping labels (family, friends, categories, table groups).
- "plus_one_name" — a column holding the plus one's actual NAME.
- "plus_one_flag" — a column saying WHETHER the guest brings/is allowed a plus one (yes/no, Y/N, checkmarks, 1/0) without naming them.
- "plus_one_phone" — the plus one's phone number.
- "additional_guest_name" — a column naming an EXTRA companion beyond the primary guest ("Guest 2", "Spouse", "Partner", "Additional Guest", "Kids' names"). Several columns may all be additional_guest_name.
- "additional_guest_phone" — phone for an extra companion column.
- "party_size" — total expected attendees for the row (headcount, "number of guests", seats).
- "ignore" — anything else: serial/row numbers, addresses, RSVP status, dietary, notes, dates, blank columns.

Rules:
- Classify by the VALUES, not just the header. A "Plus One" column holding names is plus_one_name; holding Yes/No it is plus_one_flag; holding counts it is party-related → plus_one_flag if 0/1, party_size only if it counts the WHOLE party.
- A "No."/"#"/"S.No" column counting 1,2,3… is a serial index → ignore.
- Never classify two different headers as the same field, EXCEPT additional_guest_name / additional_guest_phone which may repeat.
- Exactly one of name or first_name should identify the primary guest — do not drop it.
- When genuinely unsure, prefer "ignore" over a wrong guess.

Respond with ONLY valid JSON, no prose, no markdown fences:

{ "columns": [ { "header": "exact header text", "field": "one of the fields above" } ] }`;

function stripJsonFences(text: string): string {
  return text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
}

const MAX_HEADERS = 60;
const MAX_ROWS = 20;
const MAX_HEADER_CHARS = 200;
const MAX_CELL_CHARS = 120;
const MAX_BODY_BYTES = 256 * 1024;

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY is not configured' }, { status: 500 });
  }

  // Every request costs Gemini tokens — cap the blast radius per IP.
  const limited = checkRateLimit(request, { maxRequests: 20, windowMs: 60_000, keyPrefix: 'guest-import-analyze' });
  if (limited) return limited;

  try {
    const rawBody = await request.text();
    if (rawBody.length > MAX_BODY_BYTES) {
      return NextResponse.json({ error: 'Request body too large' }, { status: 413 });
    }
    const body = JSON.parse(rawBody);
    const headers: unknown = body?.headers;
    const sampleRows: unknown = body?.sample_rows;

    if (
      !Array.isArray(headers) ||
      headers.length === 0 ||
      headers.length > MAX_HEADERS ||
      !headers.every((h) => typeof h === 'string' && h.length <= MAX_HEADER_CHARS)
    ) {
      return NextResponse.json({ error: 'headers must be a non-empty string array' }, { status: 400 });
    }
    // Rebuild rows server-side: only declared headers, strings only,
    // truncated — never trust the client-provided shape.
    const rows: Array<Record<string, string>> = (Array.isArray(sampleRows) ? sampleRows : [])
      .slice(0, MAX_ROWS)
      .map((row: unknown) => {
        const clean: Record<string, string> = {};
        if (row && typeof row === 'object') {
          for (const h of headers as string[]) {
            const v = (row as Record<string, unknown>)[h];
            if (typeof v === 'string' && Object.prototype.hasOwnProperty.call(row, h)) {
              clean[h] = v.slice(0, MAX_CELL_CHARS);
            }
          }
        }
        return clean;
      });

    const userText = [
      'Column headers:',
      JSON.stringify(headers),
      '',
      `Sample rows (${rows.length}):`,
      JSON.stringify(rows, null, 1),
    ].join('\n');

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: 'user', parts: [{ text: userText }] }],
          generationConfig: {
            response_mime_type: 'application/json',
            temperature: 0.1,
          },
        }),
      },
    );

    if (!res.ok) {
      const errText = await res.text();
      console.error('Gemini column analysis failed:', res.status, errText);
      return NextResponse.json({ error: `LLM request failed: ${res.status}` }, { status: 502 });
    }

    const data = await res.json();
    const textPart = data.candidates?.[0]?.content?.parts?.find(
      (p: { text?: unknown }) => typeof p.text === 'string',
    );
    if (!textPart?.text) {
      return NextResponse.json({ error: 'LLM returned no parseable content' }, { status: 502 });
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(stripJsonFences(textPart.text));
    } catch {
      console.error('Failed to JSON.parse LLM column analysis:', textPart.text);
      return NextResponse.json({ error: 'LLM returned invalid JSON' }, { status: 502 });
    }

    const mapping = sanitizeColumnAnalysis(parsed, headers);
    return NextResponse.json({
      columns: Object.entries(mapping).map(([header, field]) => ({ header, field })),
    });
  } catch (err: unknown) {
    console.error('guests/import/analyze error:', err);
    const msg = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
