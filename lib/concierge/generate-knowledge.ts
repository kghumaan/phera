import Groq from 'groq-sdk';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

interface GeneratedEntry {
  title: string;
  content: string;
  category: string;
}

type GenerateResult =
  | { canGenerate: true; entries: GeneratedEntry[] }
  | { canGenerate: false; missing: string[] };

export async function generateKnowledgeEntries(weddingId: string): Promise<GenerateResult> {
  const { data: wedding, error } = await supabase
    .from('weddings')
    .select('venue_name, venue_location, wedding_date, wedding_date_display, wedding_date_end')
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
  const dateInfo = wedding.wedding_date_display || wedding.wedding_date || 'upcoming';
  const dateEnd = wedding.wedding_date_end ? ` to ${wedding.wedding_date_end}` : '';

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    temperature: 0.6,
    max_tokens: 4000,
    messages: [
      {
        role: 'system',
        content: `You generate a city/local knowledge guide for wedding guests. Return ONLY valid JSON, no markdown, no explanation.

Return a JSON array of 8-12 objects with this schema:
[{ "title": "string", "content": "string", "category": "string" }]

Each entry should have 150-300 words of content in a warm, helpful tone — like a friend who knows the area well giving tips to visiting wedding guests.

Categories to cover (use these exact category values):
- "dining" — Restaurants near the venue. Include vegetarian, vegan, halal, and gluten-free options where relevant. Mention price ranges and reservation tips.
- "activities" — Things to do: museums, landmarks, parks, day trips. Mix tourist highlights with local favorites.
- "transportation" — Getting around: ride-share, taxi, public transit, airport transfers. Include approximate costs.
- "weather" — Expected weather for the wedding dates. What to pack, outdoor event considerations.
- "emergency" — Nearest hospitals, 24hr pharmacies, police near venue. Include addresses and phone numbers where possible.
- "nightlife" — Bars, lounges, clubs near venue. Note which are walkable.
- "shopping" — Shopping areas, markets, malls near venue. Souvenirs and last-minute needs.
- "cultural_etiquette" — Local customs, tipping norms, currency, dress expectations, useful phrases.
- "local_tips" — Insider tips: best coffee, hidden gems, things to avoid, useful local apps.

You may produce 1-2 entries for a single category if there's enough to cover (e.g., separate "Fine Dining" and "Casual Eats" under dining). Aim for 8-12 entries total.`,
      },
      {
        role: 'user',
        content: `Generate a local knowledge guide for wedding guests attending a wedding at ${venueName} in ${location}. The wedding dates are ${dateInfo}${dateEnd}.`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? '[]';

  try {
    const jsonStr = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const entries = JSON.parse(jsonStr) as GeneratedEntry[];
    return { canGenerate: true, entries };
  } catch {
    console.error('Failed to parse knowledge generation response:', raw);
    return { canGenerate: true, entries: [] };
  }
}

export async function autoGenerateForUser(userId: string, serviceSupabase: SupabaseClient) {
  const { data: weddings } = await serviceSupabase
    .from('weddings')
    .select('id, venue_location')
    .eq('user_id', userId);

  if (!weddings?.length) return;

  for (const wedding of weddings) {
    if (!wedding.venue_location) continue;

    // Check if auto-generated entries already exist
    const { data: existing } = await (serviceSupabase as any)
      .from('concierge_knowledge_base')
      .select('id')
      .eq('wedding_id', wedding.id)
      .eq('source', 'auto_generated')
      .limit(1);

    if (existing?.length) continue;

    const result = await generateKnowledgeEntries(wedding.id);
    if (!result.canGenerate) continue;

    const now = new Date().toISOString();
    const rows = result.entries.map((entry, i) => ({
      wedding_id: wedding.id,
      title: entry.title,
      content: entry.content,
      category: entry.category,
      source: 'auto_generated',
      generated_at: now,
      order_index: i,
    }));

    if (rows.length > 0) {
      await (serviceSupabase as any)
        .from('concierge_knowledge_base')
        .insert(rows);
    }
  }
}
