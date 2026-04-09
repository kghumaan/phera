/**
 * Concierge System Prompt Builder & Tool Definitions
 *
 * Assembles the 4-section system prompt (Identity, Wedding Context, Guest Context, Rules)
 * and defines the 8 tools the concierge LLM can call during conversations.
 *
 * Reference: docs/concierge-prompt-template.md
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WeddingContext {
  // Core
  couple_name: string;
  partner1_name: string;
  partner2_name: string;
  wedding_date: string;
  venue_name: string;
  venue_location: string;
  wedding_slug: string;
  concierge_name?: string; // default "Phera"

  // RSVP aggregate
  rsvp_deadline: string | null;
  rsvp_counts: {
    invited: number;
    yes: number;
    no: number;
    maybe: number;
    pending: number;
  };

  // Events
  events: Array<{
    name: string;
    date: string | null;
    time: string | null;
    venue: string | null;
    dress_code: string | null;
    dress_code_description: string | null;
    ritual_name: string | null;
    ritual_description: string | null;
  }>;

  // Schedule (day → items)
  schedule: Array<{
    day_name: string;
    items: Array<{
      time: string | null;
      name: string;
      description: string | null;
      location: string | null;
    }>;
  }>;

  // Travel
  travel_info: string; // pre-formatted from travel cards/sections
  shuttle_info: string; // pre-formatted shuttle schedule

  // FAQs
  faqs: Array<{ question: string; answer: string }>;

  // Knowledge base
  knowledge_entries: Array<{ title: string; category: string; content: string }>;

  // Optional extras
  registry_info: string;
  shops_info: string;
  whatsapp_group_link: string | null;
  welcome_text: string | null;
  special_notes: string | null;
}

export interface GuestContext {
  // Identity
  guest_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  wedding_side: string | null;

  // RSVP
  rsvps: Array<{
    event_id: string;
    attending: string;
    guest_count: number | null;
    plus_one: boolean | null;
    plus_one_name: string | null;
    food_preference: string[] | null;
    dietary_restrictions: string | null;
    song_request: string | null;
    maybe_comment: string | null;
  }>;

  // Travel logistics
  flights: Array<{
    airline: string | null;
    flight_number: string | null;
    arrival_datetime: string | null;
    departure_datetime: string | null;
    arrival_airport: string | null;
    departure_airport: string | null;
  }>;

  hotels: Array<{
    hotel_name: string | null;
    confirmation_number: string | null;
    check_in: string | null;
    check_out: string | null;
    room_type: string | null;
    status: string | null;
  }>;

  visas: Array<{
    visa_type: string | null;
    status: string | null;
    applied_at: string | null;
    expiry_date: string | null;
  }>;

  // Shuttle
  shuttle_signup: {
    signed_up: boolean;
    details: string | null;
  };

  // AI notes & state
  ai_notes: string | null;
  conversation_state: string | null;
  conversation_topic: string | null;

  // Open issues
  open_issues: Array<{
    category: string;
    title: string;
    priority: string;
  }>;

  // Conversation history
  has_been_greeted: boolean;
}

// ---------------------------------------------------------------------------
// Section A: Identity & Tone (static template)
// ---------------------------------------------------------------------------

function buildIdentitySection(w: WeddingContext): string {
  const name = w.concierge_name || 'Phera';
  return `You are ${name}, the wedding concierge for ${w.partner1_name} & ${w.partner2_name}'s wedding. You communicate via WhatsApp on behalf of the couple.

Tone rules:
- Warm, helpful, culturally aware. Sound like a helpful friend who knows everything about the wedding.
- Mirror the guest's language — if they write in Hindi, respond in Hindi. English stays English. Hinglish is fine.
- Keep messages short. 2-3 sentences max unless the guest asks for detail. This is WhatsApp, not email.
- Use emojis sparingly and naturally (🙏 ✈️ 🎉 are fine, don't overdo it).
- If you don't know something, say "Let me check with ${w.partner1_name} and get back to you" — then call escalate_to_human.

You are NOT:
- A general-purpose AI assistant. Do not answer questions unrelated to this wedding.
- A replacement for the couple. For emotional, family, or sensitive topics, defer to the couple.
- Authorized to make commitments about costs, event changes, or vendor arrangements.`;
}

// ---------------------------------------------------------------------------
// Section B: Wedding Context (dynamic from DB)
// ---------------------------------------------------------------------------

function buildWeddingSection(w: WeddingContext): string {
  const siteUrl = `https://phera.io/${w.wedding_slug}`;

  // Events
  const eventsBlock = w.events.length
    ? w.events
        .map((e) => {
          let line = `- *${e.name}*`;
          if (e.date) line += ` | ${e.date}`;
          if (e.time) line += ` at ${e.time}`;
          if (e.venue) line += ` | ${e.venue}`;
          if (e.dress_code) line += ` | Dress code: ${e.dress_code}`;
          if (e.dress_code_description) line += ` (${e.dress_code_description})`;
          if (e.ritual_name) line += `\n  Ritual: ${e.ritual_name}`;
          if (e.ritual_description) line += ` — ${e.ritual_description}`;
          return line;
        })
        .join('\n')
    : 'No events listed yet.';

  // Schedule
  const scheduleBlock = w.schedule.length
    ? w.schedule
        .map((day) => {
          const items = day.items
            .map((item) => {
              let line = `  - ${item.time || ''} *${item.name}*`;
              if (item.description) line += `: ${item.description}`;
              if (item.location) line += ` (${item.location})`;
              return line;
            })
            .join('\n');
          return `${day.day_name}:\n${items}`;
        })
        .join('\n\n')
    : 'No schedule available.';

  // FAQs
  const faqBlock = w.faqs.length
    ? w.faqs.map((f) => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n')
    : 'No FAQs available.';

  // Knowledge base
  const kbBlock = w.knowledge_entries.length
    ? w.knowledge_entries
        .map((k) => `- *${k.title}* (${k.category}): ${k.content}`)
        .join('\n')
    : '';

  // RSVP counts
  const rc = w.rsvp_counts;
  const rsvpSummary = `Invited: ${rc.invited} | Yes: ${rc.yes} | No: ${rc.no} | Maybe: ${rc.maybe} | Pending: ${rc.pending}`;

  let sections = `## Wedding Details
Couple: ${w.couple_name}
Date: ${w.wedding_date}
Venue: ${w.venue_name}, ${w.venue_location}
RSVP Deadline: ${w.rsvp_deadline || 'Not set'}
RSVP Summary: ${rsvpSummary}
Website: ${siteUrl}
${w.welcome_text ? `Welcome message: ${w.welcome_text}` : ''}

## Events
${eventsBlock}

## Schedule
${scheduleBlock}

## Travel & Accommodation
${w.travel_info || 'No travel information available.'}

## Shuttle Schedule
${w.shuttle_info || 'No shuttle information available.'}

## FAQs
${faqBlock}`;

  if (w.registry_info) sections += `\n\n## Gift Registry\n${w.registry_info}`;
  if (w.shops_info) sections += `\n\n## Where to Shop\n${w.shops_info}`;
  if (w.whatsapp_group_link) sections += `\n\n## WhatsApp Group\nGuest group chat link: ${w.whatsapp_group_link}`;
  if (kbBlock) sections += `\n\n## Local Tips & Recommendations\n${kbBlock}`;
  if (w.special_notes) sections += `\n\n## Special Notes from the Couple\n${w.special_notes}`;

  return sections;
}

// ---------------------------------------------------------------------------
// Section C: Guest Context (dynamic per message)
// ---------------------------------------------------------------------------

function buildGuestSection(g: GuestContext): string {
  // RSVPs
  const rsvpBlock = g.rsvps.length
    ? g.rsvps
        .map((r) => {
          let line = `Event ${r.event_id}: ${r.attending}`;
          if (r.guest_count) line += `, ${r.guest_count} guests`;
          if (r.plus_one && r.plus_one_name) line += `, +1: ${r.plus_one_name}`;
          if (r.food_preference?.length) line += `, Food: ${r.food_preference.join(', ')}`;
          if (r.dietary_restrictions) line += `, Dietary: ${r.dietary_restrictions}`;
          if (r.song_request) line += `, Song: ${r.song_request}`;
          if (r.maybe_comment) line += `, Note: ${r.maybe_comment}`;
          return line;
        })
        .join('\n')
    : 'No RSVP on file.';

  // Flights
  const flightBlock = g.flights.length
    ? g.flights
        .map((f) => {
          let line = '- ';
          if (f.airline) line += `${f.airline}`;
          if (f.flight_number) line += ` ${f.flight_number}`;
          if (f.departure_airport && f.arrival_airport) line += ` (${f.departure_airport} → ${f.arrival_airport})`;
          if (f.arrival_datetime) line += `, Arrives: ${f.arrival_datetime}`;
          if (f.departure_datetime) line += `, Departs: ${f.departure_datetime}`;
          return line;
        })
        .join('\n')
    : 'No flight info on file.';

  // Hotels
  const hotelBlock = g.hotels.length
    ? g.hotels
        .map((h) => {
          let line = `- ${h.hotel_name || 'Hotel TBD'} (${h.status || 'unknown'})`;
          if (h.check_in) line += `, Check-in: ${h.check_in}`;
          if (h.check_out) line += `, Check-out: ${h.check_out}`;
          if (h.confirmation_number) line += `, Conf#: ${h.confirmation_number}`;
          return line;
        })
        .join('\n')
    : 'No hotel info on file.';

  // Visas
  const visaBlock = g.visas.length
    ? g.visas
        .map((v) => {
          let line = `- ${v.visa_type || 'Visa'}: ${v.status || 'unknown'}`;
          if (v.applied_at) line += `, Applied: ${v.applied_at}`;
          if (v.expiry_date) line += `, Expires: ${v.expiry_date}`;
          return line;
        })
        .join('\n')
    : 'No visa info on file.';

  // Open issues
  const issuesBlock = g.open_issues.length
    ? g.open_issues
        .map((i) => `- [${i.priority.toUpperCase()}] ${i.category}: ${i.title}`)
        .join('\n')
    : 'None.';

  return `## This Guest
Name: ${g.name}
Side: ${g.wedding_side || 'Not specified'}
Phone: ${g.phone || 'N/A'}
Email: ${g.email || 'N/A'}

RSVP Status:
${rsvpBlock}

Flights:
${flightBlock}

Hotels:
${hotelBlock}

Visa:
${visaBlock}

Shuttle: ${g.shuttle_signup.signed_up ? `Signed up — ${g.shuttle_signup.details || 'details pending'}` : 'Not signed up'}

${g.ai_notes ? `AI Notes: ${g.ai_notes}` : ''}
${g.conversation_state ? `Conversation State: ${g.conversation_state} (topic: ${g.conversation_topic || 'general'})` : ''}

Open Issues:
${issuesBlock}`;
}

// ---------------------------------------------------------------------------
// Section D: Behavioral Rules (static template)
// ---------------------------------------------------------------------------

function buildRulesSection(g: GuestContext, w: WeddingContext): string {
  const hasRsvpYes = g.rsvps.some((r) => r.attending === 'yes');
  const hasFlights = g.flights.length > 0;
  const hasHotels = g.hotels.length > 0;
  const isMaybe = g.rsvps.some((r) => r.attending === 'maybe');
  const rsvpDeadlineSoon = w.rsvp_deadline
    ? daysUntil(w.rsvp_deadline) <= 7 && daysUntil(w.rsvp_deadline) >= 0
    : false;
  const noRsvp = g.rsvps.length === 0;

  // Proactive nudges — only add the ones relevant to this guest
  const proactiveRules: string[] = [];
  if (hasRsvpYes && !hasFlights) {
    proactiveRules.push('- This guest has RSVPed yes but has NO flight info. After the 2nd interaction, ask if they\'ve booked flights yet.');
  }
  if (hasRsvpYes && !hasHotels) {
    proactiveRules.push('- This guest has RSVPed yes but has NO hotel info. Mention recommended hotels from the wedding context if relevant.');
  }
  if (isMaybe) {
    proactiveRules.push('- This guest RSVPed "maybe". Acknowledge that, and ask if there\'s anything that would help them decide.');
  }
  if (noRsvp && rsvpDeadlineSoon) {
    proactiveRules.push(`- This guest has NOT RSVPed and the deadline is in ${daysUntil(w.rsvp_deadline!)} days. Gently prompt them once this conversation (not every message).`);
  }

  const greetingRule = g.has_been_greeted
    ? '- You have ALREADY greeted this guest. Do NOT say "Hi {name}" again. Answer directly and conversationally.'
    : '- This is the start of the conversation. Greet them warmly.';

  return `## Rules

### Tool Usage
1. ALWAYS use tools to update guest data when you learn new information. Never just acknowledge — save it.
2. When a guest provides travel details (flights, hotels, visa status), IMMEDIATELY call the appropriate update tool.
3. When a guest mentions a problem or concern, call create_coordination_issue with the right priority:
   - urgent: visa denial, medical emergency, cancelled flight within 7 days of wedding
   - high: no hotel within 14 days, family conflict, accessibility need
   - medium: dietary change, travel question, logistics confusion
   - low: song request change, general question, minor preference
4. After every tool call that changes guest state, call update_conversation_state to reflect the current topic.

### Privacy & Safety
5. NEVER share other guests' personal information, travel details, or RSVP status.
6. NEVER make up information. If you don't have an answer, say you'll check and call escalate_to_human.
7. If the guest seems upset, frustrated, or discusses something sensitive (family issues, finances, relationships), call escalate_to_human immediately.
8. For languages you're not confident in, respond in English and note the couple will follow up.

### Escalation Triggers (call escalate_to_human with urgency=urgent + call update_conversation_state with state=needs_escalation)
- Guest explicitly asks to speak to the couple
- Guest mentions visa denial or travel document problems
- Guest says they can no longer attend (after previously confirming)
- Guest mentions medical/accessibility needs not previously captured
- Message you cannot understand or respond to appropriately
- Any mention of money, payments, or costs related to the wedding
- Guest hasn't responded to 3+ outreach attempts

### Conversation Style
${greetingRule}
- Format for WhatsApp: use *bold* for emphasis. No markdown links — paste URLs plainly.
- Do not repeat the guest's message back to them.
- Do not redirect to the wedding website when you already have the answer in context.

### Proactive Behaviors
${proactiveRules.length ? proactiveRules.join('\n') : '- No proactive nudges apply to this guest right now.'}`;
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ---------------------------------------------------------------------------
// Main export: buildSystemPrompt
// ---------------------------------------------------------------------------

export function buildSystemPrompt(
  weddingContext: WeddingContext,
  guestContext: GuestContext,
): string {
  const sections = [
    buildIdentitySection(weddingContext),
    buildWeddingSection(weddingContext),
    buildGuestSection(guestContext),
    buildRulesSection(guestContext, weddingContext),
  ];

  return sections.join('\n\n');
}

// ---------------------------------------------------------------------------
// Tool Definitions (OpenAI-compatible function calling format)
// ---------------------------------------------------------------------------

export interface ConciergeToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, unknown>;
      required: string[];
    };
  };
}

export const CONCIERGE_TOOLS: ConciergeToolDefinition[] = [
  // Tool 1: update_guest_rsvp
  {
    type: 'function',
    function: {
      name: 'update_guest_rsvp',
      description:
        'Update the guest\'s RSVP status. Call this whenever a guest confirms, declines, or changes their attendance. Also use for dietary/food preference changes and plus-one updates.',
      parameters: {
        type: 'object',
        properties: {
          attending: {
            type: 'string',
            enum: ['yes', 'no', 'maybe'],
            description: 'Whether the guest is attending.',
          },
          guest_count: {
            type: 'integer',
            description: 'Total number of guests in this party (including the guest themselves).',
          },
          plus_one: {
            type: 'boolean',
            description: 'Whether the guest is bringing a plus-one.',
          },
          plus_one_name: {
            type: 'string',
            description: 'Name of the plus-one.',
          },
          food_preference: {
            type: 'array',
            items: { type: 'string' },
            description: 'Food preferences (e.g. ["vegetarian", "no nuts"]).',
          },
          dietary_restrictions: {
            type: 'string',
            description: 'Free-text dietary restrictions or allergies.',
          },
          maybe_comment: {
            type: 'string',
            description: 'If attending=maybe, the reason or context the guest gave.',
          },
          song_request: {
            type: 'string',
            description: 'Song the guest would like played at the wedding.',
          },
        },
        required: ['attending'],
      },
    },
  },

  // Tool 2: update_guest_flight
  {
    type: 'function',
    function: {
      name: 'update_guest_flight',
      description:
        'Save or update the guest\'s flight information. Call this when a guest shares any flight details — even partial info (just arrival date is enough to start).',
      parameters: {
        type: 'object',
        properties: {
          airline: {
            type: 'string',
            description: 'Airline name (e.g. "Air India", "Emirates").',
          },
          flight_number: {
            type: 'string',
            description: 'Flight number (e.g. "AI-101").',
          },
          arrival_date: {
            type: 'string',
            description: 'Arrival date in YYYY-MM-DD format.',
          },
          arrival_time: {
            type: 'string',
            description: 'Arrival time in HH:MM format (24-hour).',
          },
          departure_date: {
            type: 'string',
            description: 'Departure date in YYYY-MM-DD format.',
          },
          departure_time: {
            type: 'string',
            description: 'Departure time in HH:MM format (24-hour).',
          },
          arriving_from: {
            type: 'string',
            description: 'City or airport the guest is flying from.',
          },
          passengers: {
            type: 'integer',
            description: 'Number of passengers on this booking (for group/family bookings).',
          },
          needs_pickup: {
            type: 'boolean',
            description: 'Whether the guest needs airport pickup/shuttle.',
          },
        },
        required: ['arrival_date'],
      },
    },
  },

  // Tool 3: update_guest_hotel
  {
    type: 'function',
    function: {
      name: 'update_guest_hotel',
      description:
        'Save or update the guest\'s hotel/accommodation information. Call this when a guest mentions where they\'re staying, books a hotel, or asks about accommodation.',
      parameters: {
        type: 'object',
        properties: {
          hotel_name: {
            type: 'string',
            description: 'Name of the hotel or accommodation.',
          },
          confirmation_number: {
            type: 'string',
            description: 'Hotel booking confirmation/reference number.',
          },
          check_in: {
            type: 'string',
            description: 'Check-in date in YYYY-MM-DD format.',
          },
          check_out: {
            type: 'string',
            description: 'Check-out date in YYYY-MM-DD format.',
          },
          room_type: {
            type: 'string',
            description: 'Room type (e.g. "deluxe", "suite", "standard").',
          },
          status: {
            type: 'string',
            enum: ['looking', 'booked', 'confirmed', 'cancelled'],
            description: 'Current status of the hotel booking.',
          },
          notes: {
            type: 'string',
            description: 'Additional notes (e.g. "staying with family", "need crib").',
          },
        },
        required: ['status'],
      },
    },
  },

  // Tool 4: update_guest_visa
  {
    type: 'function',
    function: {
      name: 'update_guest_visa',
      description:
        'Save or update the guest\'s visa status. Call when a guest mentions visa applications, approvals, denials, or when the destination requires a visa and the guest hasn\'t mentioned it.',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['not_needed', 'not_started', 'applied', 'approved', 'denied', 'expired'],
            description: 'Current visa status.',
          },
          visa_type: {
            type: 'string',
            description: 'Type of visa (e.g. "tourist", "e-visa", "conference").',
          },
          applied_at: {
            type: 'string',
            description: 'Date the visa application was submitted (YYYY-MM-DD).',
          },
          notes: {
            type: 'string',
            description: 'Additional context (e.g. "expedited processing", "appointment on March 5").',
          },
        },
        required: ['status'],
      },
    },
  },

  // Tool 5: create_coordination_issue
  {
    type: 'function',
    function: {
      name: 'create_coordination_issue',
      description:
        'Create a coordination issue when a guest mentions a problem, concern, or need that requires follow-up. The couple\'s admin dashboard will show this. Use appropriate priority levels.',
      parameters: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            enum: [
              'visa',
              'hotel',
              'flight',
              'dietary',
              'accessibility',
              'family_dynamics',
              'attendance_change',
              'events',
              'schedule',
              'general',
              'other',
            ],
            description: 'Category of the issue.',
          },
          title: {
            type: 'string',
            description: 'Short summary of the issue (e.g. "Visa denied — needs couple intervention").',
          },
          description: {
            type: 'string',
            description: 'Detailed description with context from the conversation.',
          },
          priority: {
            type: 'string',
            enum: ['low', 'medium', 'high', 'urgent'],
            description:
              'Priority level. urgent=visa denial/medical/cancelled flight within 7 days. high=no hotel within 14 days/family conflict/accessibility. medium=dietary/travel questions. low=minor preferences.',
          },
        },
        required: ['category', 'title', 'priority'],
      },
    },
  },

  // Tool 6: update_guest_notes
  {
    type: 'function',
    function: {
      name: 'update_guest_notes',
      description:
        'Append a concise observation about this guest. Use for soft signals that don\'t fit structured fields — e.g. "traveling with elderly parent", "first time visiting India", "seems anxious about dress code". These notes persist across conversations and help the concierge (and the couple) provide better service.',
      parameters: {
        type: 'object',
        properties: {
          note: {
            type: 'string',
            description: 'Concise observation to append to guest notes. Keep under 100 characters.',
          },
        },
        required: ['note'],
      },
    },
  },

  // Tool 7: escalate_to_human
  {
    type: 'function',
    function: {
      name: 'escalate_to_human',
      description:
        'Escalate this conversation to the couple or wedding admin. Call this when the guest asks to speak to the couple, mentions something sensitive (family issues, finances, emotions), when you don\'t have the information to answer, or when any escalation trigger is hit.',
      parameters: {
        type: 'object',
        properties: {
          reason: {
            type: 'string',
            description: 'Why this conversation needs human attention. Be specific.',
          },
          urgency: {
            type: 'string',
            enum: ['normal', 'urgent'],
            description:
              'normal=couple can respond when convenient. urgent=needs attention within hours (visa denial, cancellation, medical need).',
          },
        },
        required: ['reason'],
      },
    },
  },

  // Tool 8: update_conversation_state
  {
    type: 'function',
    function: {
      name: 'update_conversation_state',
      description:
        'Update the conversation tracking state for this guest. Call after every meaningful exchange to keep the admin dashboard accurate. Always call alongside other tools to reflect what topic you\'re working on.',
      parameters: {
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            enum: [
              'rsvp',
              'travel',
              'hotel',
              'visa',
              'logistics',
              'events',
              'general',
              'dietary',
              'shuttle',
            ],
            description: 'Current conversation topic.',
          },
          state: {
            type: 'string',
            enum: [
              'idle',
              'awaiting_response',
              'collecting_info',
              'needs_escalation',
              'resolved',
            ],
            description:
              'Current conversation state. idle=no active thread. awaiting_response=waiting for guest reply. collecting_info=actively gathering data. needs_escalation=requires human. resolved=topic handled.',
          },
        },
        required: ['topic', 'state'],
      },
    },
  },
];
