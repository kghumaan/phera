import Groq from 'groq-sdk';
import { createClient } from '@supabase/supabase-js';

// Use service role client to bypass RLS for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function generateAIResponse(params: {
  weddingId: string;
  weddingSlug: string;
  guestId: string;
  guestName: string;
  userMessage: string;
}): Promise<string> {
  const { weddingId, weddingSlug, guestId, guestName, userMessage } = params;

  try {
    // Fetch all wedding context in parallel
    const [
      weddingResult,
      eventsResult,
      scheduleResult,
      travelResult,
      faqsResult,
      rsvpResult,
      chatResult,
    ] = await Promise.all([
      supabase.from('weddings').select('couple_name, wedding_date, wedding_date_display, venue_name, venue_location, slug').eq('id', weddingId).single(),
      supabase.from('wedding_events').select('name, description, start_time, end_time, venue_name, dress_code').eq('wedding_id', weddingId),
      (supabase as any).from('wedding_schedule').select('*, schedule_items(*)').eq('wedding_id', weddingId),
      supabase.from('wedding_travel_cards').select('title, content').eq('wedding_id', weddingId),
      supabase.from('wedding_faqs').select('question, answer').eq('wedding_id', weddingId),
      supabase.from('rsvps').select('attending, guest_count').eq('guest_id', guestId),
      (supabase as any)
        .from('whatsapp_chat_history')
        .select('role, content')
        .eq('guest_id', guestId)
        .eq('wedding_id', weddingId)
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    const wedding = weddingResult.data as any;
    const events = eventsResult.data as any[];
    const schedule = scheduleResult.data as any[];
    const travelCards = travelResult.data as any[];
    const faqs = faqsResult.data as any[];
    const rsvp = rsvpResult.data as any[];
    const chatHistory = chatResult.data as any[];

    // Build context sections
    const weddingInfo = wedding
      ? `Couple: ${wedding.couple_name || 'N/A'}
Date: ${wedding.wedding_date_display || wedding.wedding_date || 'TBD'}
Venue: ${wedding.venue_name || 'TBD'}
Location: ${wedding.venue_location || 'TBD'}`
      : 'No wedding details available.';

    const eventsInfo = events?.length
      ? events.map((e: any) => `- ${e.name}${e.start_time ? ` | ${new Date(e.start_time).toLocaleString()}` : ''}${e.end_time ? ` to ${new Date(e.end_time).toLocaleString()}` : ''}${e.venue_name ? ` | Venue: ${e.venue_name}` : ''}${e.dress_code ? ` | Dress code: ${e.dress_code}` : ''}${e.description ? `\n  ${e.description}` : ''}`).join('\n')
      : 'No events listed yet.';

    const scheduleInfo = schedule?.length
      ? schedule.map((s: any) => {
          const items = s.schedule_items?.map((item: any) => `  - ${item.time || ''} ${item.title || ''}: ${item.description || ''}`).join('\n') || '';
          return `${s.name || 'Schedule'}:\n${items}`;
        }).join('\n')
      : 'No schedule available.';

    const travelInfo = travelCards?.length
      ? travelCards.map((t: any) => `- ${t.title}: ${t.content}`).join('\n')
      : 'No travel information available.';

    const faqInfo = faqs?.length
      ? faqs.map((f: any) => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n')
      : 'No FAQs available.';

    const rsvpInfo = rsvp?.length
      ? `RSVP Status: ${rsvp[0].attending ? 'Attending' : 'Not attending'}${rsvp[0].guest_count ? `, ${rsvp[0].guest_count} guests` : ''}`
      : 'No RSVP on file.';

    const coupleName = wedding?.couple_name || 'the couple';
    const siteUrl = `https://phera.io/${weddingSlug}`;

    const systemPrompt = `You are Phera, a friendly and warm wedding concierge assistant for ${coupleName}'s wedding. You help guests with questions about the wedding.

## Guest Info
Name: ${guestName}
${rsvpInfo}

## Wedding Details
${weddingInfo}

## Events
${eventsInfo}

## Schedule
${scheduleInfo}

## Travel & Accommodation
${travelInfo}

## FAQs
${faqInfo}

## Instructions
- Keep responses short (1-3 sentences). This is WhatsApp, not email.
- Be friendly and warm. Use the guest's first name naturally.
- Use emojis subtly to feel warm and human — a 👋 with greetings, 💒 for venue, 📅 for dates, ✨ for excitement, etc. Don't overdo it — one or two per message max.
- Start greetings on a new line after the emoji (e.g. "Hey Kv! 👋\nSo glad you're here!")
- Only answer from the context above. Never make up information.
- If you don't know the answer, say so and direct them to the wedding website: ${siteUrl}
- Handle greetings and small talk naturally (e.g. "Hi!", "Thanks!", "How are you?").
- Format for WhatsApp: use *bold* for emphasis, avoid markdown links.
- Do not repeat the guest's message back to them.`;

    // Build messages array from chat history (reverse to chronological order)
    const historyMessages: { role: 'user' | 'assistant'; content: string }[] = (chatHistory || [])
      .reverse()
      .filter((msg: any) => msg.role === 'user' || msg.role === 'assistant')
      .map((msg: any) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }));

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        ...historyMessages,
        { role: 'user', content: userMessage },
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    return completion.choices[0]?.message?.content || getFallbackResponse(guestName, siteUrl);
  } catch (error) {
    console.error('Error generating AI response:', error);
    return getFallbackResponse(guestName, `https://phera.io/${weddingSlug}`);
  }
}

function getFallbackResponse(guestName: string, siteUrl: string): string {
  return `Hey ${guestName}! 👋\nI'm having a little trouble right now, but you can find all the wedding details here: ${siteUrl}`;
}
