import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { getAuthenticatedClient } from '@/lib/utils/auth-helpers';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const CTA_REGEX = /<div class="phera-cta" data-text="([^"]*)" data-url="([^"]*)"><\/div>/;

const SYSTEM_PROMPT = `You are a copy editor that rewrites wedding travel info for guest-facing display.

Input: raw HTML from a rich-text editor (may be one long paragraph, sloppy line breaks, or unstructured prose).

Output: clean, well-organized HTML that is easy to scan on mobile. Rules:
- Split long paragraphs into short ones (2–3 sentences max).
- Convert lists of items, steps, or options into <ul><li> bullets.
- Use <strong> to highlight key items (hotel names, dates, times, prices, booking codes).
- Preserve all factual content — never invent details, URLs, prices, dates, or names.
- Preserve every <a href="...">...</a> link exactly as-is.
- Allowed tags: <p>, <ul>, <ol>, <li>, <strong>, <em>, <a>, <br>. No other tags. No <div>, <span>, <h1>, <h2>, <h3>, <h4>, <img>, <script>, no inline styles, no class/id attributes.
- Tone: warm, friendly, informative. American English.
- If the input is already well-organized, return it essentially unchanged.
- Return ONLY the HTML. No markdown fences. No explanation. No leading/trailing commentary.`;

function sanitizeHtml(html: string): string {
  let out = html.trim();
  out = out.replace(/^```html\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '');
  out = out.replace(/<script[\s\S]*?<\/script>/gi, '');
  out = out.replace(/<style[\s\S]*?<\/style>/gi, '');
  out = out.replace(/\son\w+="[^"]*"/gi, '');
  out = out.replace(/\son\w+='[^']*'/gi, '');
  return out.trim();
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient();
    if (!supabase || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: 'AI service unavailable' }, { status: 503 });
    }

    const body = await request.json();
    const html = typeof body?.html === 'string' ? body.html : '';

    if (!html.trim()) {
      return NextResponse.json({ error: 'Missing html' }, { status: 400 });
    }

    if (html.length > 20000) {
      return NextResponse.json({ error: 'Content too long' }, { status: 413 });
    }

    // Strip CTA block before sending to AI — re-append after polish
    const ctaMatch = html.match(CTA_REGEX);
    const ctaBlock = ctaMatch ? ctaMatch[0] : '';
    const bodyHtml = ctaMatch ? html.replace(CTA_REGEX, '').trim() : html;

    const completion = await groq.chat.completions.create({
      model: 'openai/gpt-oss-120b',
      reasoning_format: 'hidden', // gpt-oss reasons; keep CoT out of message.content
      temperature: 0.3,
      max_tokens: 2000,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: bodyHtml },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? '';
    const polished = sanitizeHtml(raw);

    if (!polished) {
      return NextResponse.json({ error: 'Empty AI response' }, { status: 502 });
    }

    return NextResponse.json({ html: ctaBlock ? `${polished}${ctaBlock}` : polished });
  } catch (error) {
    console.error('Error polishing travel details:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
