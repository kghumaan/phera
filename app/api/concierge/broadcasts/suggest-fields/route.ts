/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { getAuthenticatedClient } from '@/lib/utils/auth-helpers';
import { checkRateLimit } from '@/lib/utils/rate-limiter';

const gemini = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

/**
 * Look at a broadcast message and return an array of data fields the admin
 * is implicitly asking guests to reply with. Used by the composer to
 * auto-populate the data-collection schema.
 */
export async function POST(req: NextRequest) {
  try {
    const { user } = await getAuthenticatedClient();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const limited = checkRateLimit(req, { maxRequests: 30, windowMs: 60_000, keyPrefix: 'broadcast-suggest-fields' });
    if (limited) return limited;

    const { message } = await req.json();
    const trimmed = (message || '').trim();
    if (!trimmed || trimmed.length < 6) {
      return NextResponse.json({ fields: [] });
    }

    if (!gemini) {
      return NextResponse.json({ fields: [] });
    }

    const prompt = `You analyze wedding-admin WhatsApp broadcasts to guests and detect what structured data (if any) the admin is asking the guest to reply with.

Rules:
- If the broadcast is purely informational (announcement, reminder, thank you), return an empty array.
- If the broadcast asks for something, list each distinct piece of data as a field.
- Prefer field \`type\` of "image" when the admin asks for a picture/photo/scan/upload/passport image/screenshot/document image. Otherwise use "text" (or "date" when the value is clearly a date).
- Use short snake_case keys and human-readable labels.
- Max 5 fields.

Return ONLY a JSON object: { "fields": [{ "key": "...", "label": "...", "type": "text" | "image" | "date" }] }

Broadcast:
"""${trimmed}"""`;

    const resp = await gemini.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { temperature: 0, responseMimeType: 'application/json' } as any,
    });

    const text: string = (resp as any)?.text || '';
    const parsed = tryParseJson(text);
    const rawFields: any[] = Array.isArray(parsed?.fields) ? parsed.fields : [];

    // Normalize + filter malformed entries.
    const fields = rawFields
      .map((f) => ({
        key: String(f?.key || '')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '_')
          .replace(/^_+|_+$/g, ''),
        label: String(f?.label || '').trim(),
        type: ['text', 'image', 'date'].includes(String(f?.type)) ? String(f.type) : 'text',
      }))
      .filter((f) => f.key && f.label)
      .slice(0, 5);

    return NextResponse.json({ fields });
  } catch (err: any) {
    console.error('[suggest-fields] error:', err);
    return NextResponse.json({ fields: [] });
  }
}

function tryParseJson(text: string): any {
  if (!text) return null;
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (m) {
      try {
        return JSON.parse(m[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}
