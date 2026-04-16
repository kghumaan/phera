import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

interface InquiryRequest {
  message: string;
  weddingData: {
    couple_name?: string;
    venue_name?: string;
    venue_location?: string;
    wedding_date?: string;
    event_names?: string[];
    rsvp_stats?: { total: number; yes: number; no: number; maybe: number; plusOnes: number };
    pin_count?: number;
    primary_color?: string;
    website_layout?: string;
    has_faqs?: boolean;
    has_registry?: boolean;
    has_travel?: boolean;
    has_shopping?: boolean;
  };
}

const SYSTEM_PROMPT = `You are Phera, a friendly AI wedding website builder assistant. You help couples create beautiful wedding websites.

You have access to the couple's wedding data provided below. Answer their questions helpfully and concisely.

About Phera:
- Phera is a wedding website platform that lets couples create beautiful, personalized wedding websites
- Features include: event schedules, RSVP management, FAQs, gift registry links, travel info, shopping recommendations, and guest access PINs
- PINs are access codes given to guests. Different PINs can have different permissions (allow plus ones, skip RSVP, restrict event access)
- The website supports two layouts: "Nested" (tap into sections) and "Infinite Scroll" (all content on one page)
- Couples can customize backgrounds, colors, fonts, and layouts for both the main site and the lock screen

Keep responses brief (2-3 sentences max). Be warm and helpful. Use emojis sparingly.`;

export async function POST(request: NextRequest) {
  try {
    const body: InquiryRequest = await request.json();
    const { message, weddingData } = body;

    const groqApiKey = process.env.GROQ_API_KEY;

    if (!groqApiKey) {
      return NextResponse.json({
        response: "I'm not sure about that — you can check the admin dashboard for details."
      });
    }

    const contextParts: string[] = [];
    if (weddingData.couple_name) contextParts.push(`Couple: ${weddingData.couple_name}`);
    if (weddingData.venue_name) contextParts.push(`Venue: ${weddingData.venue_name}`);
    if (weddingData.venue_location) contextParts.push(`Location: ${weddingData.venue_location}`);
    if (weddingData.wedding_date) contextParts.push(`Date: ${weddingData.wedding_date}`);
    if (weddingData.event_names?.length) contextParts.push(`Events: ${weddingData.event_names.join(', ')}`);
    if (weddingData.rsvp_stats) {
      const s = weddingData.rsvp_stats;
      contextParts.push(`RSVPs: ${s.total} total (${s.yes} yes, ${s.no} no, ${s.maybe} maybe, ${s.plusOnes} plus-ones)`);
    }
    if (weddingData.pin_count !== undefined) contextParts.push(`PINs configured: ${weddingData.pin_count}`);
    if (weddingData.primary_color) contextParts.push(`Theme color: ${weddingData.primary_color}`);
    if (weddingData.website_layout) contextParts.push(`Layout: ${weddingData.website_layout}`);

    const weddingContext = contextParts.length > 0
      ? `\n\nWedding context:\n${contextParts.join('\n')}`
      : '';

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT + weddingContext },
          { role: 'user', content: message },
        ],
        temperature: 0.7,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      console.error('Groq inquiry API error:', response.status);
      return NextResponse.json({
        response: "I'm not sure about that — you can check the admin dashboard for details."
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json({
        response: "I'm not sure about that — you can check the admin dashboard for details."
      });
    }

    return NextResponse.json({ response: content.trim() });
  } catch (error) {
    console.error('Inquiry API error:', error);
    return NextResponse.json({
      response: "I'm not sure about that — you can check the admin dashboard for details."
    });
  }
}
