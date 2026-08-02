/* eslint-disable @typescript-eslint/no-explicit-any */
import { GoogleGenAI } from '@google/genai';

interface SchemaField {
  key: string;
  label: string;
  type: string;
}

const gemini = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

/**
 * Map a guest's free-form broadcast reply to the structured data_schema
 * the admin asked for. Returns null if extraction fails or no fields found.
 *
 * Uses Gemini 2.5 Flash — cheap text-only call, no tools needed.
 */
export async function extractBroadcastData(
  replyText: string,
  schema: SchemaField[],
): Promise<Record<string, string> | null> {
  if (!replyText.trim() || schema.length === 0) return null;

  const fieldList = schema.map((f) => `- ${f.key} (${f.label}, type: ${f.type})`).join('\n');

  const prompt = `You are extracting structured data from a wedding guest's WhatsApp reply.

The admin asked for these fields:
${fieldList}

Guest's reply:
"""${replyText}"""

Return a compact JSON object mapping each field key to the value you can extract from the reply. If a field can't be extracted, omit it. Only include keys from the schema. No commentary — JSON only.

Example output: {"flight_number": "AA123", "arrival_date": "Jan 5"}`;

  // Try Gemini first
  if (gemini) {
    try {
      const resp = await gemini.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: { temperature: 0, responseMimeType: 'application/json' } as any,
      });
      const text = (resp as any)?.text || '';
      const parsed = tryParseJson(text);
      if (parsed) return filterToSchema(parsed, schema);
    } catch (err) {
      console.warn('[broadcast-extract] Gemini failed:', err);
    }
  }

  return null;
}

function tryParseJson(text: string): Record<string, any> | null {
  if (!text) return null;
  // Strip accidental code fences / prose
  const cleaned = text
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // Find first {...} block
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

function filterToSchema(
  parsed: Record<string, any>,
  schema: SchemaField[],
): Record<string, string> | null {
  const keys = new Set(schema.map((f) => f.key));
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(parsed)) {
    if (keys.has(k) && v != null && String(v).trim()) {
      out[k] = String(v).trim();
    }
  }
  return Object.keys(out).length > 0 ? out : null;
}
