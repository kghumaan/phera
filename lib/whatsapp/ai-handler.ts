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
    // Fetch all wedding context in parallel — separate queries to avoid join issues
    const [
      weddingResult,
      eventsResult,
      scheduleResult,
      scheduleItemsResult,
      travelResult,
      faqsResult,
      rsvpResult,
      chatResult,
      registryResult,
      shopsResult,
      settingsResult,
    ] = await Promise.all([
      supabase.from('weddings').select('*').eq('id', weddingId).single(),
      supabase.from('wedding_events').select('*').eq('wedding_id', weddingId).order('order_index'),
      supabase.from('wedding_schedule').select('*').eq('wedding_id', weddingId).order('order_index'),
      supabase.from('schedule_items').select('*').order('order_index'),
      supabase.from('wedding_travel_cards').select('*').eq('wedding_id', weddingId).order('order_index'),
      supabase.from('wedding_faqs').select('*').eq('wedding_id', weddingId).order('order_index'),
      supabase.from('rsvps').select('*').eq('guest_id', guestId),
      (supabase as any)
        .from('whatsapp_chat_history')
        .select('role, content')
        .eq('guest_id', guestId)
        .eq('wedding_id', weddingId)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase.from('wedding_registry').select('*').eq('wedding_id', weddingId).order('order_index'),
      supabase.from('wedding_shops').select('*').eq('wedding_id', weddingId).order('order_index'),
      supabase.from('wedding_settings').select('*').eq('wedding_id', weddingId).single(),
    ]);

    const wedding = weddingResult.data as any;
    const events = (eventsResult.data as any[]) || [];
    const schedules = (scheduleResult.data as any[]) || [];
    const allScheduleItems = (scheduleItemsResult.data as any[]) || [];
    const travelCards = (travelResult.data as any[]) || [];
    const faqs = (faqsResult.data as any[]) || [];
    const rsvps = (rsvpResult.data as any[]) || [];
    const chatHistory = (chatResult.data as any[]) || [];
    const registry = (registryResult.data as any[]) || [];
    const shops = (shopsResult.data as any[]) || [];
    const settings = settingsResult.data as any;

    // Build context sections
    const weddingInfo = wedding
      ? `Couple: ${wedding.couple_name || 'N/A'}
Partner 1: ${wedding.partner1_name || 'N/A'}
Partner 2: ${wedding.partner2_name || 'N/A'}
Date: ${wedding.wedding_date_display || wedding.wedding_date || 'TBD'}
Venue: ${wedding.venue_name || 'TBD'}
Location: ${wedding.venue_location || 'TBD'}
RSVP Deadline: ${wedding.rsvp_deadline || 'N/A'}
Welcome Message: ${wedding.welcome_text || 'N/A'}`
      : 'No wedding details available.';

    const eventsInfo = events.length
      ? events.map((e: any) => {
          let info = `- *${e.name}*`;
          if (e.date) info += ` | Date: ${e.date}`;
          if (e.time) info += ` | Time: ${e.time}`;
          if (e.venue_name) info += ` | Venue: ${e.venue_name}`;
          if (e.dress_code) info += ` | Dress code: ${e.dress_code}`;
          if (e.dress_code_description) info += ` (${e.dress_code_description})`;
          if (e.ritual_name) info += `\n  Ritual: ${e.ritual_name}`;
          if (e.ritual_description) info += ` — ${e.ritual_description}`;
          return info;
        }).join('\n')
      : 'No events listed yet.';

    // Match schedule items to their schedules
    const scheduleInfo = schedules.length
      ? schedules.map((s: any) => {
          const items = allScheduleItems
            .filter((item: any) => item.schedule_id === s.id)
            .map((item: any) => {
              let line = `  - ${item.time || ''} *${item.name || ''}*`;
              if (item.description) line += `: ${item.description}`;
              if (item.location) line += ` (${item.location})`;
              return line;
            }).join('\n');
          return `${s.day_name || s.date || 'Day'}:\n${items}`;
        }).join('\n\n')
      : 'No schedule available.';

    // Parse travel card content (content is JSON)
    const travelInfo = travelCards.length
      ? travelCards.map((t: any) => {
          let info = `- *${t.title}*: `;
          if (typeof t.content === 'string') {
            info += t.content;
          } else if (t.content && typeof t.content === 'object') {
            // JSON content — extract text fields
            info += JSON.stringify(t.content);
          }
          if (t.button_text && t.button_action) {
            info += ` [${t.button_text}: ${t.button_action}]`;
          }
          return info;
        }).join('\n')
      : 'No travel information available.';

    const faqInfo = faqs.length
      ? faqs.map((f: any) => {
          let info = `Q: ${f.question}\nA: ${f.answer}`;
          if (f.button_text && f.button_link) {
            info += ` [${f.button_text}: ${f.button_link}]`;
          }
          return info;
        }).join('\n\n')
      : 'No FAQs available.';

    const rsvpInfo = rsvps.length
      ? rsvps.map((r: any) => {
          let info = `Event: ${r.event_id} — ${r.attending}`;
          if (r.guest_count) info += `, ${r.guest_count} guests`;
          if (r.food_preference?.length) info += `, Food: ${r.food_preference.join(', ')}`;
          if (r.dietary_restrictions) info += `, Dietary: ${r.dietary_restrictions}`;
          if (r.song_request) info += `, Song request: ${r.song_request}`;
          if (r.arrival_date) info += `, Arriving: ${r.arrival_date}`;
          return info;
        }).join('\n')
      : 'No RSVP on file.';

    const registryInfo = registry.length
      ? registry.map((r: any) => `- ${r.emoji || ''} ${r.fund_name}: ${r.description || ''}${r.external_url ? ` (${r.external_url})` : ''}`).join('\n')
      : '';

    const shopsInfo = shops.length
      ? shops.map((s: any) => `- ${s.name}: ${s.details || ''}${s.url ? ` (${s.url})` : ''}`).join('\n')
      : '';

    const whatsappGroupLink = settings?.whatsapp_group_link || '';

    const coupleName = wedding?.couple_name || 'the couple';
    const siteUrl = `https://phera.io/${weddingSlug}`;

    // Check if we've already greeted in this conversation
    const hasGreeted = chatHistory.some((msg: any) =>
      msg.role === 'assistant' && /hey|hi|hello|welcome/i.test(msg.content?.slice(0, 30) || '')
    );

    const systemPrompt = `You are Phera, a friendly and warm wedding concierge assistant for ${coupleName}'s wedding. You help guests with questions about the wedding over WhatsApp.

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
${registryInfo ? `\n## Gift Registry\n${registryInfo}` : ''}
${shopsInfo ? `\n## Where to Shop\n${shopsInfo}` : ''}
${whatsappGroupLink ? `\n## WhatsApp Group\nGuest group chat link: ${whatsappGroupLink}` : ''}

## Wedding Website
${siteUrl}

## Instructions
- Keep responses concise but helpful (1-4 sentences). This is WhatsApp, not email.
- Be friendly and warm. Use the guest's first name naturally but not in every message.
- Use emojis subtly — one or two per message max (👋 for greetings, 📅 for dates, 💒 for venue, ✨ for excitement, 👗 for dress code, etc).
${hasGreeted ? '- You have ALREADY greeted this guest in the conversation. Do NOT say "Hi {name}" or "Hey {name}" again. Just answer their question directly and conversationally.' : '- This is the first message in the conversation. Greet them warmly.'}
- Answer questions using ALL the context provided above. Be specific — mention actual venue names, dates, times, dress codes, travel details, etc.
- If the context contains the answer, give it directly. Do NOT redirect to the website when you already have the information.
- Only direct to the wedding website (${siteUrl}) when the information genuinely isn't in your context.
- Handle greetings and small talk naturally.
- Format for WhatsApp: use *bold* for emphasis. Do not use markdown links — just paste URLs plainly.
- Do not repeat the guest's message back to them.
- Never make up information not in the context above.`;

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
      max_tokens: 500,
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
