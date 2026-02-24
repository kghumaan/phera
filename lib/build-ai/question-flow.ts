import { Question, QuestionId } from './types';

// ─── Helper Functions ─────────────────────────────────────────────────────────

export function parseFlexibleDate(input: string): Date | null {
  const cleaned = input.trim();

  const formats = [
    /^(\w+)\s+(\d{1,2}),?\s+(\d{4})$/i,
    /^(\d{1,2})\s+(\w+),?\s+(\d{4})$/i,
    /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/,
    /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/,
  ];

  const monthNames: Record<string, number> = {
    'january': 0, 'jan': 0, 'february': 1, 'feb': 1, 'march': 2, 'mar': 2,
    'april': 3, 'apr': 3, 'may': 4, 'june': 5, 'jun': 5,
    'july': 6, 'jul': 6, 'august': 7, 'aug': 7, 'september': 8, 'sep': 8, 'sept': 8,
    'october': 9, 'oct': 9, 'november': 10, 'nov': 10, 'december': 11, 'dec': 11,
  };

  let match = cleaned.match(formats[0]);
  if (match) {
    const month = monthNames[match[1].toLowerCase()];
    if (month !== undefined) return new Date(parseInt(match[3]), month, parseInt(match[2]));
  }

  match = cleaned.match(formats[1]);
  if (match) {
    const month = monthNames[match[2].toLowerCase()];
    if (month !== undefined) return new Date(parseInt(match[3]), month, parseInt(match[1]));
  }

  match = cleaned.match(formats[2]);
  if (match) return new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));

  match = cleaned.match(formats[3]);
  if (match) return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));

  const parsed = new Date(cleaned);
  return isNaN(parsed.getTime()) ? null : parsed;
}

export function formatDateDisplay(date: Date): string {
  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
  return date.toLocaleDateString('en-US', options).toUpperCase();
}

export function parseEvents(input: string): Array<{ time: string; name: string }> {
  const parts = input.split(/\||\n/).map(p => p.trim()).filter(Boolean);
  return parts.map(part => {
    const dashMatch = part.match(/^([^-]+?)\s*-\s*(.+)$/);
    if (dashMatch) return { time: dashMatch[1].trim(), name: dashMatch[2].trim() };
    const timeMatch = part.match(/^(\d+(?::\d+)?\s*(?:am|pm))\s+(.+)$/i);
    if (timeMatch) return { time: timeMatch[1].trim(), name: timeMatch[2].trim() };
    return { time: '', name: part };
  }).filter(e => e.name);
}

export function parseRegistryItems(input: string): Array<{ fund_name: string; external_url: string; emoji: string }> {
  const lines = input.split('\n').map(l => l.trim()).filter(Boolean);
  return lines.map(line => {
    const urlMatch = line.match(/^(.+?)\s*[|\-]\s*(https?:\/\/.+)$/);
    if (urlMatch) return { fund_name: urlMatch[1].trim(), external_url: urlMatch[2].trim(), emoji: '🎁' };
    const spaceUrlMatch = line.match(/^(.+?)\s+(https?:\/\/.+)$/);
    if (spaceUrlMatch) return { fund_name: spaceUrlMatch[1].trim(), external_url: spaceUrlMatch[2].trim(), emoji: '🎁' };
    const loneUrlMatch = line.match(/^(https?:\/\/)?([\w\-.]+\.[a-z]{2,5})(\/.*)?$/i);
    if (loneUrlMatch) {
      const url = loneUrlMatch[1] ? line : `https://${line}`;
      return { fund_name: loneUrlMatch[2], external_url: url, emoji: '🎁' };
    }
    return { fund_name: line, external_url: '', emoji: '🎁' };
  }).filter(item => item.fund_name);
}

export function getQuestionText(question: Question, data: Record<string, any>): string {
  if (typeof question.question === 'function') return question.question(data);
  return question.question;
}

export function parseBoldText(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const React = require('react');
      return React.createElement('strong', { key: index }, part.slice(2, -2));
    }
    return part;
  });
}

// ─── Color Mapping ───────────────────────────────────────────────────────────

const COLOR_MAP: Record<string, string> = {
  'rose': '#DE3F5E', 'rose pink': '#DE3F5E', 'pink': '#DE3F5E',
  'black': '#141414', 'plum': '#59114D', 'purple': '#AC3FBA',
  'ocean': '#004550', 'navy': '#004550', 'navy blue': '#004550',
  'sky': '#6290C8', 'sky blue': '#6290C8', 'blue': '#6290C8',
  'teal': '#489991', 'maroon': '#941C28', 'red': '#941C28',
  'green': '#76B041', 'forest': '#59814B', 'forest green': '#59814B',
  'orange': '#DF6507', 'amber': '#FA9A00', 'gold': '#FA9A00',
};

// ─── Question Flow Definition ─────────────────────────────────────────────────

export const QUESTIONS: Record<QuestionId, Question> = {
  partner1_name: {
    id: 'partner1_name',
    question: "Let's get started — what's your first name?",
    field: ['partner1_name'],
    parser: (input: string) => {
      const cleaned = input.replace(/[!.,?]/g, '').trim();
      const name = cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
      return { partner1_name: name };
    },
    nextQuestion: 'partner2_name',
    formType: 'text',
  },
  partner2_name: {
    id: 'partner2_name',
    question: "And your partner's first name?",
    field: ['partner2_name', 'couple_name'],
    parser: (input: string) => {
      const cleaned = input.replace(/[!.,?]/g, '').trim();
      const name = cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
      return { partner2_name: name };
    },
    nextQuestion: 'venue_name',
    formType: 'text',
  },
  venue_name: {
    id: 'venue_name',
    question: "What's the name of your venue?",
    field: ['venue_name'],
    parser: (input: string) => ({ venue_name: input.trim() }),
    nextQuestion: 'venue_location',
    formType: 'text',
  },
  venue_location: {
    id: 'venue_location',
    question: "Where is it located? (City, Country — feel free to add a flag emoji!)",
    field: ['venue_location'],
    parser: (input: string) => ({ venue_location: input.trim() }),
    nextQuestion: 'welcome_text',
    formType: 'text',
  },
  welcome_text: {
    id: 'welcome_text',
    question: "What welcome message would you like guests to see? This appears below your names on the homepage.",
    field: ['welcome_text'],
    parser: (input: string) => {
      const lower = input.toLowerCase().trim();
      if (lower === 'skip' || lower === 'default') return { welcome_text: "" };
      return { welcome_text: input.trim() };
    },
    nextQuestion: 'rsvp_deadline',
    formType: 'skip_button',
  },
  rsvp_deadline: {
    id: 'rsvp_deadline',
    question: "Would you like to set an RSVP deadline? ⏰",
    field: ['rsvp_deadline'],
    parser: (input: string) => {
      const lower = input.toLowerCase().trim();
      if (['no', 'nope', 'skip', 'none'].includes(lower)) return { rsvp_deadline: null };
      const date = parseFlexibleDate(input);
      return { rsvp_deadline: date ? date.toISOString() : null };
    },
    nextQuestion: 'schedule_intro',
    formType: 'date',
  },

  // ── Schedule ──────────────────────────────────────────────────────────────
  schedule_intro: {
    id: 'schedule_intro',
    question: "Now let's build your event schedule! **How many days is your celebration?** (e.g., '1', '2', '3')",
    field: ['_schedule_days_count'],
    parser: (input: string) => {
      const num = parseInt(input.replace(/\D/g, ''), 10);
      return { _schedule_days_count: isNaN(num) || num < 1 ? 1 : Math.min(num, 10) };
    },
    nextQuestion: 'day1_events',
    formType: 'count',
  },
  day1_events: {
    id: 'day1_events',
    question: () => `Let's list the events for **Day 1**.`,
    field: ['_day1_events'],
    parser: () => ({}),
    nextQuestion: 'day2_events',
    skipIf: (data) => (data._schedule_days_count || 1) < 1,
    formType: 'event',
  },
  day2_events: {
    id: 'day2_events',
    question: () => `Now for **Day 2**. Let's add events.`,
    field: ['_day2_events'],
    parser: () => ({}),
    nextQuestion: 'day3_events',
    skipIf: (data) => (data._schedule_days_count || 1) < 2,
    formType: 'event',
  },
  day3_events: {
    id: 'day3_events',
    question: () => `And **Day 3** events.`,
    field: ['_day3_events'],
    parser: () => ({}),
    nextQuestion: 'day4_events',
    skipIf: (data) => (data._schedule_days_count || 1) < 3,
    formType: 'event',
  },
  day4_events: {
    id: 'day4_events',
    question: () => `Now for **Day 4**.`,
    field: ['_day4_events'],
    parser: () => ({}),
    nextQuestion: 'day5_events',
    skipIf: (data) => (data._schedule_days_count || 1) < 4,
    formType: 'event',
  },
  day5_events: {
    id: 'day5_events',
    question: () => `And **Day 5**.`,
    field: ['_day5_events'],
    parser: () => ({}),
    nextQuestion: 'day6_events',
    skipIf: (data) => (data._schedule_days_count || 1) < 5,
    formType: 'event',
  },
  day6_events: {
    id: 'day6_events',
    question: () => `Events for **Day 6**.`,
    field: ['_day6_events'],
    parser: () => ({}),
    nextQuestion: 'day7_events',
    skipIf: (data) => (data._schedule_days_count || 1) < 6,
    formType: 'event',
  },
  day7_events: {
    id: 'day7_events',
    question: () => `Moving to **Day 7**.`,
    field: ['_day7_events'],
    parser: () => ({}),
    nextQuestion: 'day8_events',
    skipIf: (data) => (data._schedule_days_count || 1) < 7,
    formType: 'event',
  },
  day8_events: {
    id: 'day8_events',
    question: () => `**Day 8** schedule items?`,
    field: ['_day8_events'],
    parser: () => ({}),
    nextQuestion: 'day9_events',
    skipIf: (data) => (data._schedule_days_count || 1) < 8,
    formType: 'event',
  },
  day9_events: {
    id: 'day9_events',
    question: () => `Almost through the schedule! **Day 9**.`,
    field: ['_day9_events'],
    parser: () => ({}),
    nextQuestion: 'day10_events',
    skipIf: (data) => (data._schedule_days_count || 1) < 9,
    formType: 'event',
  },
  day10_events: {
    id: 'day10_events',
    question: () => `And finally, **Day 10** events.`,
    field: ['_day10_events'],
    parser: () => ({}),
    nextQuestion: 'faq_intro',
    skipIf: (data) => (data._schedule_days_count || 1) < 10,
    formType: 'event',
  },

  // ── FAQ ───────────────────────────────────────────────────────────────────
  faq_intro: {
    id: 'faq_intro',
    question: "Would you like to add FAQs for guests? (e.g., dress code, parking, gifts).",
    field: ['_add_faqs'],
    parser: (input: string) => {
      const lower = input.toLowerCase().trim();
      const add = !['no', 'skip', 'nope', 'none', 'n', 'not now'].includes(lower);
      return { _add_faqs: add };
    },
    nextQuestion: (parsedData) => parsedData._add_faqs ? 'faq_item' : 'registry_intro',
    formType: 'yes_no',
  },
  faq_item: {
    id: 'faq_item',
    question: "Add your FAQs below",
    field: ['_faq_items'],
    parser: () => ({}),
    nextQuestion: 'registry_intro',
    formType: 'faq',
  },

  // ── Registry ──────────────────────────────────────────────────────────────
  registry_intro: {
    id: 'registry_intro',
    question: "Do you have any gift registry or wishlist links to share with guests?",
    field: ['_add_registry'],
    parser: (input: string) => {
      const lower = input.toLowerCase().trim();
      const add = !['no', 'skip', 'nope', 'none', 'n', 'not now'].includes(lower);
      return { _add_registry: add };
    },
    nextQuestion: (parsedData) => parsedData._add_registry ? 'registry_item' : 'travel_intro',
    formType: 'yes_no',
  },
  registry_item: {
    id: 'registry_item',
    question: "Enter your registry link details below.",
    field: ['_registry_items'],
    parser: () => ({}),
    nextQuestion: 'travel_intro',
    formType: 'registry',
  },

  // ── Travel ────────────────────────────────────────────────────────────────
  travel_intro: {
    id: 'travel_intro',
    question: "Would you like to add travel & accommodation info for your guests?",
    field: ['_add_travel'],
    parser: (input: string) => {
      const lower = input.toLowerCase().trim();
      const add = !['no', 'skip', 'nope', 'none', 'n', 'not now'].includes(lower);
      return { _add_travel: add };
    },
    nextQuestion: (parsedData) => parsedData._add_travel ? 'travel_item' : 'shopping_intro',
    formType: 'yes_no',
  },
  travel_item: {
    id: 'travel_item',
    question: "Add a travel card below — include details about hotels, flights, or local transport.",
    field: ['_travel_items'],
    parser: () => ({}),
    nextQuestion: 'shopping_intro',
    formType: 'travel',
  },

  // ── Shopping ──────────────────────────────────────────────────────────────
  shopping_intro: {
    id: 'shopping_intro',
    question: "Would you like to recommend any shops for guest outfits?",
    field: ['_add_shopping'],
    parser: (input: string) => {
      const lower = input.toLowerCase().trim();
      const add = !['no', 'skip', 'nope', 'none', 'n', 'not now'].includes(lower);
      return { _add_shopping: add };
    },
    nextQuestion: (parsedData) => parsedData._add_shopping ? 'shopping_item' : 'couple_images',
    formType: 'yes_no',
  },
  shopping_item: {
    id: 'shopping_item',
    question: "Add a shop recommendation below.",
    field: ['_shopping_items'],
    parser: () => ({}),
    nextQuestion: 'couple_images',
    formType: 'shopping',
  },

  // ── Couple Images ───────────────────────────────────────────────────────
  couple_images: {
    id: 'couple_images',
    question: "Would you like to upload photos of the couple? These appear on your wedding homepage.",
    field: ['couple_images', 'couple_image_url'],
    parser: () => ({}), // Handled by form component
    nextQuestion: 'frame_selection',
    formType: 'couple_images',
  },

  // ── Frame Selection ─────────────────────────────────────────────────────
  frame_selection: {
    id: 'frame_selection',
    question: "Pick a decorative frame for your couple photos!",
    field: ['frame_image_url'],
    parser: () => ({}), // Handled by form component
    nextQuestion: 'look_feel',
    formType: 'frame_selection',
  },

  // ── Look & Feel ─────────────────────────────────────────────────────────
  look_feel: {
    id: 'look_feel',
    question: "Now let's make your website look stunning! Customize the design below. 🎨",
    field: ['background_image', 'primary_color', 'font_color', 'button_font_color', 'website_layout', 'lock_screen_background', 'lock_screen_primary_color', 'lock_screen_font_color', 'lock_screen_button_font_color'],
    parser: () => ({}), // Handled by form component
    nextQuestion: 'pin_setup',
    formType: 'look_feel',
  },

  // ── PIN Setup ─────────────────────────────────────────────────────────────
  pin_setup: {
    id: 'pin_setup',
    question: "Almost done! Would you like to set up access PINs for your guests?",
    field: ['_add_pins'],
    parser: (input: string) => {
      const lower = input.toLowerCase().trim();
      if (['skip', 'no', 'later', 'not now', 'nope', 'n'].includes(lower)) return { _add_pins: false };
      return { _add_pins: true };
    },
    nextQuestion: (parsedData) => parsedData._add_pins ? 'pin_item' : 'complete',
    formType: 'yes_no',
  },
  pin_item: {
    id: 'pin_item',
    question: "Add a PIN code for your guests below.",
    field: ['_pin_items'],
    parser: () => ({}),
    nextQuestion: 'complete',
    formType: 'pin',
  },

  complete: {
    id: 'complete',
    question: "Your wedding website is all set up! 🎉 You can fine-tune everything in the dedicated sections on the left — Schedule, Travel, FAQ, Registry, and more. Your guests are going to love it!",
    field: [],
    parser: () => ({}),
    nextQuestion: 'complete',
    formType: 'none',
  },
};

// ─── AI Response Generation ───────────────────────────────────────────────────

export function generateAIResponse(question: Question, parsedData: Record<string, any>, collectedData: Record<string, any>): string {
  const responses: Partial<Record<QuestionId, string | ((data: any, collected?: any) => string)>> = {
    partner1_name: (data) => `Nice to meet you, ${data.partner1_name}! 👋`,
    partner2_name: (data, collected) => {
      const couple = `${collected?.partner1_name || ''} & ${data.partner2_name}`;
      return `Love it — ${couple}! 💕`;
    },
    venue_name: (data) => `${data.venue_name} — beautiful choice! 🏛️`,
    venue_location: (data) => `${data.venue_location} — what a stunning location! 📍`,
    welcome_text: () => "Perfect! That message will set the tone beautifully. 💌",
    rsvp_deadline: (data) => data.rsvp_deadline ? "RSVP deadline set! Guests will see this on their invitation. ⏰" : "No deadline — guests can RSVP anytime! 👍",
    schedule_intro: (data) => {
      const count = data._schedule_days_count || 1;
      return `A **${count}-day celebration** — let's plan each day! 📅`;
    },
    day1_events: () => "Use the form below to add events for **Day 1**.",
    day2_events: () => "Use the form below to add events for **Day 2**.",
    day3_events: () => "Use the form below to add events for **Day 3**.",
    faq_intro: (data) => data._add_faqs ? "Let's add those FAQs!" : "No problem — you can always add FAQs later.",
    faq_item: (data) => {
      const count = (data._faq_items || []).length;
      return count > 0 ? `${count} FAQ${count > 1 ? 's' : ''} added! Your guests will appreciate it. 📋` : "No FAQs parsed — you can add them in the FAQ section anytime.";
    },
    registry_intro: (data) => data._add_registry ? "Great, let's add your registry links!" : "No problem — you can add registry links anytime.",
    registry_item: (data) => {
      const count = (data._registry_items || []).filter((r: any) => r.external_url).length;
      return count > 0 ? `${count} registry link${count > 1 ? 's' : ''} added! 🎁` : "No valid registry links found — make sure to include the full URL (https://...).";
    },
    travel_intro: (data) => data._add_travel ? "Let's add travel info for your guests!" : "No problem — you can add travel details anytime.",
    travel_item: () => "Travel card added! Your guests will find this super helpful. ✈️",
    shopping_intro: (data) => data._add_shopping ? "Great, let's add some shop recommendations!" : "No problem — you can add shops anytime.",
    shopping_item: () => "Shop added! 🛍️",
    couple_images: (data) => {
      const count = (data.couple_images || []).length;
      return count > 0 ? `${count} photo${count > 1 ? 's' : ''} uploaded! Looking great! 📸` : "No photos added — you can upload them anytime in the Design section.";
    },
    frame_selection: (data) => data.frame_image_url ? "Beautiful frame choice! 🖼️" : "No frame selected — you can add one anytime in the Design section.",
    look_feel: () => "Looking gorgeous! Your design choices are saved. ✨",
    pin_setup: (data) => data._add_pins ? "Let's set up your guest access PINs!" : "No PIN set — you can configure access codes in the PIN Management section.",
    pin_item: () => "PIN added! Your guests will use this to access your site. 🔐",
  };

  const responseTemplate = responses[question.id];
  if (!responseTemplate) return '';
  if (typeof responseTemplate === 'function') return responseTemplate(parsedData, collectedData);
  return responseTemplate;
}

// ─── Skip Logic Helper ───────────────────────────────────────────────────────

export function getNextQuestion(currentId: QuestionId, parsedData: Record<string, any>, collectedData: Record<string, any>): QuestionId {
  const currentQuestion = QUESTIONS[currentId];
  let nextQuestionId: QuestionId;

  if (typeof currentQuestion.nextQuestion === 'function') {
    nextQuestionId = currentQuestion.nextQuestion(parsedData);
  } else {
    nextQuestionId = currentQuestion.nextQuestion;
  }

  // Walk through skipIf chain
  let safetyCount = 0;
  while (QUESTIONS[nextQuestionId].skipIf?.(collectedData) && nextQuestionId !== 'complete' && safetyCount < 20) {
    const tempQuestion = QUESTIONS[nextQuestionId];
    nextQuestionId = typeof tempQuestion.nextQuestion === 'function'
      ? tempQuestion.nextQuestion({})
      : tempQuestion.nextQuestion;
    safetyCount++;
  }

  return nextQuestionId;
}

// ─── Determine resume start question ─────────────────────────────────────────

export function determineStartQuestion(existingData: Record<string, any>): QuestionId {
  let startQuestion: QuestionId = 'partner1_name';
  if (existingData.partner1_name) startQuestion = 'partner2_name';
  if (existingData.partner2_name) startQuestion = 'venue_name';
  if (existingData.venue_name) startQuestion = 'venue_location';
  if (existingData.venue_location) startQuestion = 'welcome_text';
  if (existingData.welcome_text) startQuestion = 'rsvp_deadline';
  if (existingData.rsvp_deadline) startQuestion = 'schedule_intro';
  if (existingData._has_schedule) startQuestion = 'faq_intro';
  if (existingData._has_faqs) startQuestion = 'registry_intro';
  if (existingData._has_registry) startQuestion = 'travel_intro';
  if (existingData._has_travel) startQuestion = 'shopping_intro';
  if (existingData._has_shopping) startQuestion = 'couple_images';
  if (existingData._has_couple_images) startQuestion = 'frame_selection';
  if (existingData._has_frame_selection) startQuestion = 'look_feel';
  if (existingData._has_look_feel) startQuestion = 'pin_setup';
  if (existingData._has_pins) startQuestion = 'complete';
  return startQuestion;
}

// ─── Check if question uses form (disables text input) ──────────────────────

export function isFormQuestion(questionId: QuestionId): boolean {
  const formTypes = ['event', 'faq', 'registry', 'date', 'background', 'color', 'layout', 'look_feel', 'couple_images', 'frame_selection', 'travel', 'shopping', 'pin', 'count'];
  return formTypes.includes(QUESTIONS[questionId]?.formType);
}

// ─── Mock messages for non-pro preview ──────────────────────────────────────

export const mockMessages = [
  { id: '1', role: 'ai' as const, text: "Welcome! 🎉 Let's build your wedding website together. What's your first name?" },
  { id: '2', role: 'user' as const, text: 'Priya' },
  { id: '3', role: 'ai' as const, text: "Nice to meet you, Priya! 👋 And your partner's first name?" },
  { id: '4', role: 'user' as const, text: 'Arjun' },
  { id: '5', role: 'ai' as const, text: "Love it — Priya & Arjun! 💕 What's the name of your venue?" },
  { id: '6', role: 'user' as const, text: 'The Oberoi, Udaipur' },
  { id: '7', role: 'ai' as const, text: "Beautiful choice! 🏰 Where is it located?" },
  { id: '8', role: 'user' as const, text: 'Udaipur, India 🇮🇳' },
  { id: '9', role: 'ai' as const, text: "What a stunning location! 📍 Now let's build your event schedule." },
];
