import Groq from 'groq-sdk';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

interface GeneratedTravelContent {
  travel_intro: string;
  flight_info: string;
  image_url?: string;
}

type GenerateResult =
  | { canGenerate: true; content: GeneratedTravelContent }
  | { canGenerate: false; missing: string[] };

/**
 * Extract the city/region name from a full location string.
 */
async function extractCityName(location: string): Promise<string> {
  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0,
      max_tokens: 50,
      messages: [
        {
          role: 'system',
          content: 'Extract ONLY the city or town name from the given location. Return just the city name, nothing else. For example: "The Ritz-Carlton, Hua Hin, Thailand" → "Hua Hin". "Tuscany, Italy" → "Tuscany". "Paris, France" → "Paris".',
        },
        { role: 'user', content: location },
      ],
    });
    return (completion.choices[0]?.message?.content ?? location).trim();
  } catch {
    return location.split(',')[0].trim();
  }
}

/**
 * Generate a city skyline image using Gemini Imagen and upload to Supabase Storage.
 */
async function generateCityImage(location: string, weddingId: string): Promise<string | undefined> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return undefined;

  try {
    const city = await extractCityName(location);
    const prompt = `A beautiful panoramic skyline photograph of ${city}, golden hour lighting, high quality travel photography, wide angle cityscape view`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }],
          }],
          generationConfig: {
            responseModalities: ['TEXT', 'IMAGE'],
          },
        }),
      }
    );

    if (!res.ok) {
      console.error('Gemini image generation failed:', res.status, await res.text());
      return undefined;
    }

    const data = await res.json();
    const parts = data.candidates?.[0]?.content?.parts;
    if (!parts) return undefined;

    // Find the inline image data
    const imagePart = parts.find((p: any) => p.inlineData?.mimeType?.startsWith('image/'));
    if (!imagePart?.inlineData) return undefined;

    const { mimeType, data: base64Data } = imagePart.inlineData;
    const ext = mimeType === 'image/png' ? 'png' : 'jpg';
    const fileName = `travel-${city.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.${ext}`;
    const filePath = `weddings/${weddingId}/travel/${fileName}`;

    // Decode base64 and upload to Supabase Storage
    const buffer = Buffer.from(base64Data, 'base64');
    const { error: uploadError } = await supabase.storage
      .from('wedding-assets')
      .upload(filePath, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) {
      console.error('Failed to upload generated image:', uploadError);
      return undefined;
    }

    const { data: urlData } = supabase.storage
      .from('wedding-assets')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  } catch (err) {
    console.error('Failed to generate city image:', err);
    return undefined;
  }
}

export async function generateTravelContent(weddingId: string): Promise<GenerateResult> {
  const { data: wedding, error } = await supabase
    .from('weddings')
    .select('venue_name, venue_location')
    .eq('id', weddingId)
    .single();

  if (error || !wedding) {
    return { canGenerate: false, missing: ['wedding'] };
  }

  if (!wedding.venue_location) {
    return { canGenerate: false, missing: ['venue_location'] };
  }

  const venueName = wedding.venue_name || 'the wedding venue';
  const location = wedding.venue_location;

  // Run text generation and image generation in parallel
  const [textResult, imageUrl] = await Promise.all([
    groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.6,
      max_tokens: 1000,
      messages: [
        {
          role: 'system',
          content: `You write warm, helpful travel information for wedding guests. Return ONLY valid JSON, no markdown, no explanation.

Return a JSON object with this schema:
{ "travel_intro": "string", "flight_info": "string" }

- "travel_intro": 2-3 warm, welcoming sentences about traveling to the wedding destination. Mention the location and what makes it special. This is the intro paragraph for the Travel section.
- "flight_info": 2-3 helpful sentences about getting to the destination by air. Mention the nearest major airport(s) and any useful tips for booking flights. Keep it practical and friendly.

Write in a warm, personal tone — like a friend sharing travel tips with wedding guests.`,
        },
        {
          role: 'user',
          content: `Generate travel information for wedding guests attending a wedding at ${venueName} in ${location}.`,
        },
      ],
    }),
    generateCityImage(location, weddingId),
  ]);

  const raw = textResult.choices[0]?.message?.content ?? '{}';

  try {
    const jsonStr = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const content = JSON.parse(jsonStr) as GeneratedTravelContent;
    if (imageUrl) content.image_url = imageUrl;
    return { canGenerate: true, content };
  } catch {
    console.error('Failed to parse travel generation response:', raw);
    return {
      canGenerate: true,
      content: { travel_intro: '', flight_info: '', image_url: imageUrl },
    };
  }
}
