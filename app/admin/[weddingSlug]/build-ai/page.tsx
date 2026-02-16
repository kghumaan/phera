'use client';

import React, { useState, use, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Container,
  Typography,
  Stack,
  Paper,
  TextField,
  IconButton,
  alpha,
} from '@mui/material';
import {
  AutoAwesome,
  LockOutlined,
  ArrowUpward,
  Check,
  SmartToy,
  Person,
} from '@mui/icons-material';
import { usePlan } from '@/lib/contexts/PlanContext';
import UpgradeModal from '@/components/admin/UpgradeModal';
import { weddingService } from '@/lib/supabase/wedding-service';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: 'ai' | 'user';
  text: string;
}

type QuestionId =
  | 'couple_names'
  | 'wedding_date'
  | 'wedding_date_end'
  | 'venue_name'
  | 'venue_location'
  | 'welcome_text'
  | 'primary_color'
  | 'rsvp_deadline'
  | 'schedule_intro'
  | 'day1_name'
  | 'day1_events'
  | 'day2_name'
  | 'day2_events'
  | 'day3_name'
  | 'day3_events'
  | 'faq_intro'
  | 'faq_item'
  | 'registry_intro'
  | 'registry_item'
  | 'pin_setup'
  | 'complete';

interface Question {
  id: QuestionId;
  question: string | ((data: Record<string, any>) => string);
  field: string | string[];
  parser: (input: string) => Record<string, any>;
  nextQuestion: QuestionId | ((response: any) => QuestionId);
  skipIf?: (collectedData: Record<string, any>) => boolean;
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

function parseFlexibleDate(input: string): Date | null {
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

function formatDateDisplay(date: Date): string {
  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
  return date.toLocaleDateString('en-US', options).toUpperCase();
}

function parseEvents(input: string): Array<{ time: string; name: string }> {
  const parts = input.split(/\||\n/).map(p => p.trim()).filter(Boolean);
  return parts.map(part => {
    // "6pm - Mehendi" or "6:00 PM - Dinner"
    const dashMatch = part.match(/^([^-]+?)\s*-\s*(.+)$/);
    if (dashMatch) return { time: dashMatch[1].trim(), name: dashMatch[2].trim() };
    // "6pm Mehendi" (time pattern at start)
    const timeMatch = part.match(/^(\d+(?::\d+)?\s*(?:am|pm))\s+(.+)$/i);
    if (timeMatch) return { time: timeMatch[1].trim(), name: timeMatch[2].trim() };
    return { time: '', name: part };
  }).filter(e => e.name);
}

function parseFAQItems(input: string): Array<{ question: string; answer: string }> {
  const items: Array<{ question: string; answer: string }> = [];
  // Match "Q: ... | A: ..." pattern (handles multiple on separate lines)
  const lines = input.split('\n').map(l => l.trim()).filter(Boolean);
  for (const line of lines) {
    const match = line.match(/Q:\s*(.+?)\s*\|\s*A:\s*(.+)/i);
    if (match) {
      items.push({ question: match[1].trim(), answer: match[2].trim() });
    }
  }
  // Fallback: single "question | answer" pairs without Q:/A: prefix
  if (items.length === 0) {
    for (const line of lines) {
      const parts = line.split('|').map(p => p.trim());
      if (parts.length >= 2 && parts[0] && parts[1]) {
        items.push({ question: parts[0], answer: parts[1] });
      }
    }
  }
  return items;
}

function parseRegistryItems(input: string): Array<{ fund_name: string; external_url: string; emoji: string }> {
  const lines = input.split('\n').map(l => l.trim()).filter(Boolean);
  return lines.map(line => {
    // "Name | https://..." or "Name - https://..."
    const urlMatch = line.match(/^(.+?)\s*[|\-]\s*(https?:\/\/.+)$/);
    if (urlMatch) return { fund_name: urlMatch[1].trim(), external_url: urlMatch[2].trim(), emoji: '🎁' };
    // "Name https://..."
    const spaceUrlMatch = line.match(/^(.+?)\s+(https?:\/\/.+)$/);
    if (spaceUrlMatch) return { fund_name: spaceUrlMatch[1].trim(), external_url: spaceUrlMatch[2].trim(), emoji: '🎁' };
    return { fund_name: line, external_url: '', emoji: '🎁' };
  }).filter(item => item.fund_name);
}

function getQuestionText(question: Question, data: Record<string, any>): string {
  if (typeof question.question === 'function') return question.question(data);
  return question.question;
}

// ─── Question Flow Definition ─────────────────────────────────────────────────

const QUESTIONS: Record<QuestionId, Question> = {
  couple_names: {
    id: 'couple_names',
    question: "Let's get started — what's your first name and your partner's first name?",
    field: ['partner1_name', 'partner2_name', 'couple_name'],
    parser: (input: string) => {
      const cleaned = input.replace(/[!.,?]/g, '').trim();
      let names: string[] = [];
      if (cleaned.includes('&')) {
        names = cleaned.split('&').map(n => n.trim());
      } else if (cleaned.toLowerCase().includes(' and ')) {
        names = cleaned.toLowerCase().split(' and ').map(n => n.trim());
      } else {
        names = cleaned.split(/\s+/).slice(0, 2);
      }
      const partner1 = names[0] ? names[0].charAt(0).toUpperCase() + names[0].slice(1).toLowerCase() : '';
      const partner2 = names[1] ? names[1].charAt(0).toUpperCase() + names[1].slice(1).toLowerCase() : '';
      return {
        partner1_name: partner1,
        partner2_name: partner2,
        couple_name: partner1 && partner2 ? `${partner1} & ${partner2}` : partner1 || partner2,
      };
    },
    nextQuestion: 'wedding_date',
  },
  wedding_date: {
    id: 'wedding_date',
    question: "When is your wedding? You can say something like 'December 14, 2025' or '14/12/2025'.",
    field: ['wedding_date', 'wedding_date_display'],
    parser: (input: string) => {
      const date = parseFlexibleDate(input);
      return {
        wedding_date: date ? date.toISOString() : null,
        wedding_date_display: date ? formatDateDisplay(date) : input,
      };
    },
    nextQuestion: 'wedding_date_end',
  },
  wedding_date_end: {
    id: 'wedding_date_end',
    question: "Is this a multi-day celebration? If yes, what's the last day? (or say 'no' for a single day)",
    field: ['wedding_date_end'],
    parser: (input: string) => {
      const lower = input.toLowerCase().trim();
      if (['no', 'nope', 'single day', 'just one day', '1 day', 'single', 'one day'].includes(lower)) {
        return { wedding_date_end: null };
      }
      const date = parseFlexibleDate(input);
      return { wedding_date_end: date ? date.toISOString() : null };
    },
    nextQuestion: 'venue_name',
  },
  venue_name: {
    id: 'venue_name',
    question: "What's the name of your venue?",
    field: ['venue_name'],
    parser: (input: string) => ({ venue_name: input.trim() }),
    nextQuestion: 'venue_location',
  },
  venue_location: {
    id: 'venue_location',
    question: "Where is it located? (City, Country — feel free to add a flag emoji!)",
    field: ['venue_location'],
    parser: (input: string) => ({ venue_location: input.trim() }),
    nextQuestion: 'welcome_text',
  },
  welcome_text: {
    id: 'welcome_text',
    question: "What welcome message would you like guests to see? This appears below your names on the homepage. (or say 'skip' to use our default)",
    field: ['welcome_text'],
    parser: (input: string) => {
      const lower = input.toLowerCase().trim();
      if (lower === 'skip' || lower === 'default') {
        return { welcome_text: "Come celebrate with us under the stars. A little romance, a lot of partying. You won't want to miss it." };
      }
      return { welcome_text: input.trim() };
    },
    nextQuestion: 'primary_color',
  },
  primary_color: {
    id: 'primary_color',
    question: "What's your wedding color theme? (e.g., 'rose pink', 'navy blue', 'gold', or a hex code like '#DE3F5E'). Say 'skip' for our default rose pink.",
    field: ['primary_color'],
    parser: (input: string) => {
      const lower = input.toLowerCase().trim();
      if (lower === 'skip' || lower === 'default') return { primary_color: '#DE3F5E' };
      if (input.startsWith('#') && /^#[0-9A-Fa-f]{6}$/.test(input)) return { primary_color: input };
      const colorMap: Record<string, string> = {
        'rose': '#DE3F5E', 'rose pink': '#DE3F5E', 'pink': '#DE3F5E',
        'black': '#141414', 'plum': '#59114D', 'purple': '#AC3FBA',
        'ocean': '#004550', 'navy': '#004550', 'navy blue': '#004550',
        'sky': '#6290C8', 'sky blue': '#6290C8', 'blue': '#6290C8',
        'teal': '#489991', 'maroon': '#941C28', 'red': '#941C28',
        'green': '#76B041', 'forest': '#59814B', 'forest green': '#59814B',
        'orange': '#DF6507', 'amber': '#FA9A00', 'gold': '#FA9A00',
      };
      return { primary_color: colorMap[lower] || '#DE3F5E' };
    },
    nextQuestion: 'rsvp_deadline',
  },
  rsvp_deadline: {
    id: 'rsvp_deadline',
    question: "Would you like to set an RSVP deadline? (e.g., 'November 1, 2025' or 'no')",
    field: ['rsvp_deadline'],
    parser: (input: string) => {
      const lower = input.toLowerCase().trim();
      if (['no', 'nope', 'skip', 'none'].includes(lower)) return { rsvp_deadline: null };
      const date = parseFlexibleDate(input);
      return { rsvp_deadline: date ? date.toISOString() : null };
    },
    nextQuestion: 'schedule_intro',
  },

  // ── Schedule ──────────────────────────────────────────────────────────────
  schedule_intro: {
    id: 'schedule_intro',
    question: "Now let's build your event schedule! How many days is your celebration? (e.g., '1', '2', '3')",
    field: ['_schedule_days_count'],
    parser: (input: string) => {
      const num = parseInt(input.replace(/\D/g, ''), 10);
      return { _schedule_days_count: isNaN(num) || num < 1 ? 1 : Math.min(num, 3) };
    },
    nextQuestion: 'day1_name',
  },
  day1_name: {
    id: 'day1_name',
    question: "What's the name of Day 1? (e.g., 'Mehendi Night', 'Sangeet', 'Wedding Day')",
    field: ['_day1_name'],
    parser: (input: string) => ({ _day1_name: input.trim() }),
    nextQuestion: 'day1_events',
  },
  day1_events: {
    id: 'day1_events',
    question: (data) => `What events are on "${data._day1_name || 'Day 1'}"?\nFormat: time - event (e.g., '6pm - Mehendi Ceremony | 8pm - Dinner')\nSay 'skip' to add events later.`,
    field: ['_day1_events'],
    parser: (input: string) => {
      const lower = input.toLowerCase().trim();
      if (['skip', 'no', 'none', 'later'].includes(lower)) return { _day1_events: [] };
      return { _day1_events: parseEvents(input) };
    },
    nextQuestion: 'day2_name',
  },
  day2_name: {
    id: 'day2_name',
    question: "What's the name of Day 2? (e.g., 'Sangeet Night', 'Wedding Ceremony')",
    field: ['_day2_name'],
    parser: (input: string) => ({ _day2_name: input.trim() }),
    nextQuestion: 'day2_events',
    skipIf: (data) => (data._schedule_days_count || 1) < 2,
  },
  day2_events: {
    id: 'day2_events',
    question: (data) => `What events are on "${data._day2_name || 'Day 2'}"?\nFormat: time - event (e.g., '7pm - Sangeet | 9pm - After-party')\nSay 'skip' to add later.`,
    field: ['_day2_events'],
    parser: (input: string) => {
      const lower = input.toLowerCase().trim();
      if (['skip', 'no', 'none', 'later'].includes(lower)) return { _day2_events: [] };
      return { _day2_events: parseEvents(input) };
    },
    nextQuestion: 'day3_name',
    skipIf: (data) => (data._schedule_days_count || 1) < 2,
  },
  day3_name: {
    id: 'day3_name',
    question: "What's the name of Day 3?",
    field: ['_day3_name'],
    parser: (input: string) => ({ _day3_name: input.trim() }),
    nextQuestion: 'day3_events',
    skipIf: (data) => (data._schedule_days_count || 1) < 3,
  },
  day3_events: {
    id: 'day3_events',
    question: (data) => `What events are on "${data._day3_name || 'Day 3'}"?\nFormat: time - event. Say 'skip' to add later.`,
    field: ['_day3_events'],
    parser: (input: string) => {
      const lower = input.toLowerCase().trim();
      if (['skip', 'no', 'none', 'later'].includes(lower)) return { _day3_events: [] };
      return { _day3_events: parseEvents(input) };
    },
    nextQuestion: 'faq_intro',
    skipIf: (data) => (data._schedule_days_count || 1) < 3,
  },

  // ── FAQ ───────────────────────────────────────────────────────────────────
  faq_intro: {
    id: 'faq_intro',
    question: "Would you like to add FAQs for guests? (e.g., dress code, parking, gifts). Type 'yes' to add some or 'skip'.",
    field: ['_add_faqs'],
    parser: (input: string) => {
      const lower = input.toLowerCase().trim();
      const add = !['no', 'skip', 'nope', 'none', 'n', 'not now'].includes(lower);
      return { _add_faqs: add };
    },
    nextQuestion: (parsedData) => parsedData._add_faqs ? 'faq_item' : 'registry_intro',
  },
  faq_item: {
    id: 'faq_item',
    question: "Add your FAQs below (one per line):\nQ: your question | A: your answer\n\ne.g., Q: What's the dress code? | A: Smart casual",
    field: ['_faq_items'],
    parser: (input: string) => ({ _faq_items: parseFAQItems(input) }),
    nextQuestion: 'registry_intro',
  },

  // ── Registry ──────────────────────────────────────────────────────────────
  registry_intro: {
    id: 'registry_intro',
    question: "Do you have any gift registry or wishlist links to share with guests? Type 'yes' to add them or 'skip'.",
    field: ['_add_registry'],
    parser: (input: string) => {
      const lower = input.toLowerCase().trim();
      const add = !['no', 'skip', 'nope', 'none', 'n', 'not now'].includes(lower);
      return { _add_registry: add };
    },
    nextQuestion: (parsedData) => parsedData._add_registry ? 'registry_item' : 'pin_setup',
  },
  registry_item: {
    id: 'registry_item',
    question: "Enter your registry details (one per line):\nRegistry Name | URL\n\ne.g., Amazon Wishlist | https://amazon.com/...",
    field: ['_registry_items'],
    parser: (input: string) => ({ _registry_items: parseRegistryItems(input) }),
    nextQuestion: 'pin_setup',
  },

  // ── PIN Setup ─────────────────────────────────────────────────────────────
  pin_setup: {
    id: 'pin_setup',
    question: "Almost done! Set a PIN code for guest access to your wedding website. Enter a 4-8 digit number (e.g., '1234'). Say 'skip' to set it up later in PIN Management.",
    field: ['_guest_pin'],
    parser: (input: string) => {
      const lower = input.toLowerCase().trim();
      if (['skip', 'no', 'later', 'not now'].includes(lower)) return { _guest_pin: null };
      const pin = input.replace(/\D/g, '');
      return { _guest_pin: pin.length >= 4 ? pin : null };
    },
    nextQuestion: 'complete',
  },

  complete: {
    id: 'complete',
    question: "Your wedding website is all set up! 🎉 You can fine-tune everything in the dedicated sections on the left — Schedule, Travel, FAQ, Registry, and more. Your guests are going to love it!",
    field: [],
    parser: () => ({}),
    nextQuestion: 'complete',
  },
};

// ─── AI Response Generation ───────────────────────────────────────────────────

function generateAIResponse(question: Question, parsedData: Record<string, any>, collectedData: Record<string, any>): string {
  const responses: Partial<Record<QuestionId, string | ((data: any) => string)>> = {
    couple_names: (data) => `Lovely to meet you, ${data.couple_name}! 💕`,
    wedding_date: (data) => data.wedding_date ? `${data.wedding_date_display} — how exciting! 🎊` : "Got it! I'll note that down.",
    wedding_date_end: (data) => data.wedding_date_end ? "A multi-day celebration — sounds amazing! 🎉" : "A single-day celebration it is! ✨",
    venue_name: (data) => `${data.venue_name} — beautiful choice! 🏛️`,
    venue_location: (data) => `${data.venue_location} — what a stunning location! 📍`,
    welcome_text: () => "Perfect! That message will set the tone beautifully. 💌",
    primary_color: () => "Great choice! Your site will look gorgeous with that color. 🎨",
    rsvp_deadline: (data) => data.rsvp_deadline ? "RSVP deadline set! Guests will see this on their invitation. ⏰" : "No deadline — guests can RSVP anytime! 👍",
    schedule_intro: (data) => {
      const count = data._schedule_days_count || 1;
      return `A ${count}-day celebration — let's plan each day! 📅`;
    },
    day1_name: (data) => `"${data._day1_name}" — love it! Now let's add the events.`,
    day1_events: (data) => {
      const count = (data._day1_events || []).length;
      const dayName = collectedData._day1_name || 'Day 1';
      return count > 0 ? `${count} event${count > 1 ? 's' : ''} added for ${dayName}! ✅` : "No problem — you can add events later in the Schedule section. 📅";
    },
    day2_name: (data) => `"${data._day2_name}" — got it!`,
    day2_events: (data) => {
      const count = (data._day2_events || []).length;
      const dayName = collectedData._day2_name || 'Day 2';
      return count > 0 ? `${count} event${count > 1 ? 's' : ''} added for ${dayName}! ✅` : "You can add events later in the Schedule section. 📅";
    },
    day3_name: (data) => `"${data._day3_name}" — got it!`,
    day3_events: (data) => {
      const count = (data._day3_events || []).length;
      const dayName = collectedData._day3_name || 'Day 3';
      return count > 0 ? `${count} event${count > 1 ? 's' : ''} added for ${dayName}! ✅` : "You can add events later in the Schedule section. 📅";
    },
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
    pin_setup: (data) => data._guest_pin ? `PIN "${data._guest_pin}" set! Guests will use this to access your site. 🔐` : "No PIN set — you can configure access codes in the PIN Management section.",
  };

  const responseTemplate = responses[question.id];
  if (!responseTemplate) return '';
  if (typeof responseTemplate === 'function') return responseTemplate(parsedData);
  return responseTemplate;
}

// ─── Mock chat for blurred preview ───────────────────────────────────────────

const mockMessages: Message[] = [
  { id: '1', role: 'ai', text: "Welcome! 🎉 Let's build your wedding website together. What are the names of the happy couple?" },
  { id: '2', role: 'user', text: 'Priya & Arjun!' },
  { id: '3', role: 'ai', text: 'So lovely! 💕 When is your big day?' },
  { id: '4', role: 'user', text: 'December 14th, 2025' },
  { id: '5', role: 'ai', text: "Wonderful! Where will you be celebrating?" },
  { id: '6', role: 'user', text: 'The Oberoi, Udaipur' },
  { id: '7', role: 'ai', text: "A stunning choice! 🏰 What's your wedding color theme?" },
  { id: '8', role: 'user', text: 'Deep blue and gold' },
  { id: '9', role: 'ai', text: "Beautiful! Now let's plan your event schedule. How many days is your celebration?" },
];

// ─── Chat bubble ─────────────────────────────────────────────────────────────

function Bubble({ message }: { message: Message }) {
  const isAI = message.role === 'ai';

  // AI Message: Free-form text on left with icon
  if (isAI) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 3, gap: 2 }}>
        <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: alpha('#DE3F5E', 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, mt: 0.5 }}>
          <AutoAwesome sx={{ fontSize: 18, color: '#DE3F5E' }} />
        </Box>
        <Box sx={{ maxWidth: '85%' }}>
          <Typography sx={{
            fontSize: '1rem',
            lineHeight: 1.6,
            color: '#1a1a1a',
            whiteSpace: 'pre-line',
          }}>
            {message.text}
          </Typography>
        </Box>
      </Box>
    );
  }

  // User Message: Bubble on right
  return (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
      <Box
        sx={{
          maxWidth: '80%',
          px: 2.5,
          py: 1.5,
          borderRadius: '16px 16px 4px 16px',
          bgcolor: '#f5f5f5', // Light grey for user bubble to differentiate
          color: '#1a1a1a',
          whiteSpace: 'pre-line',
        }}
      >
        <Typography sx={{
          fontSize: '1rem', lineHeight: 1.6,
          color: '#1a1a1a'
        }}>
          {message.text}
        </Typography>
      </Box>
    </Box>
  );
}

// ─── Typing indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 3 }}>
      <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: alpha('#DE3F5E', 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <AutoAwesome sx={{ fontSize: 18, color: '#DE3F5E' }} />
      </Box>
      <Box sx={{ py: 0.5, display: 'flex', gap: 0.6, alignItems: 'center' }}>
        {[0, 1, 2].map(i => (
          <Box
            key={i}
            sx={{
              width: 8, height: 8, borderRadius: '50%', bgcolor: '#DE3F5E',
              animation: 'bounce 1.2s infinite', animationDelay: `${i * 0.2}s`,
              '@keyframes bounce': { '0%, 60%, 100%': { transform: 'translateY(0)' }, '30%': { transform: 'translateY(-5px)' } },
              opacity: 0.7
            }}
          />
        ))}
      </Box>
    </Box>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BuildAIPage({ params }: { params: Promise<{ weddingSlug: string }> }) {
  const { weddingSlug } = use(params);
  const { isPro } = usePlan();
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentQuestionId, setCurrentQuestionId] = useState<QuestionId>('couple_names');
  const [collectedData, setCollectedData] = useState<Record<string, any>>({});
  const [weddingId, setWeddingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [scheduleDayIds, setScheduleDayIds] = useState<Record<string, string>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);

  // Initialize BroadcastChannel for preview sync
  useEffect(() => {
    channelRef.current = new BroadcastChannel('phera-design-sync');
    return () => { channelRef.current?.close(); };
  }, []);

  const broadcastUpdate = useCallback((updates: Record<string, any>) => {
    if (channelRef.current && weddingId) {
      channelRef.current.postMessage({ type: 'DESIGN_UPDATE', weddingId, updates });
    }
  }, [weddingId]);

  // Load wedding data and set initial messages
  useEffect(() => {
    const loadWedding = async () => {
      try {
        const wedding = await weddingService.getWeddingBySlug(weddingSlug);
        if (!wedding) return;

        setWeddingId(wedding.id);

        // Build existing data map from wedding record
        const existingData: Record<string, any> = {};
        if (wedding.partner1_name && wedding.partner2_name) {
          existingData.partner1_name = wedding.partner1_name;
          existingData.partner2_name = wedding.partner2_name;
          existingData.couple_name = wedding.couple_name;
        }
        if (wedding.wedding_date) {
          existingData.wedding_date = wedding.wedding_date;
          existingData.wedding_date_display = wedding.wedding_date_display;
        }
        if (wedding.venue_name) existingData.venue_name = wedding.venue_name;
        if (wedding.venue_location) existingData.venue_location = wedding.venue_location;
        if (wedding.welcome_text) existingData.welcome_text = wedding.welcome_text;
        if (wedding.primary_color) existingData.primary_color = wedding.primary_color;
        if (wedding.rsvp_deadline) existingData.rsvp_deadline = wedding.rsvp_deadline;

        // Check complex sections in parallel
        const [scheduleData, faqData, registryData, settingsData] = await Promise.all([
          weddingService.getWeddingSchedule(wedding.id),
          weddingService.getFAQs(wedding.id),
          weddingService.getRegistry(wedding.id),
          weddingService.getSettings(wedding.id),
        ]);

        existingData._has_schedule = scheduleData && scheduleData.length > 0;
        existingData._has_faqs = faqData && faqData.length > 0;
        existingData._has_registry = registryData && registryData.length > 0;
        existingData._has_pins = settingsData?.pin_codes && (settingsData.pin_codes as any[]).length > 0;

        setCollectedData(existingData);

        // Determine where to start based on existing data
        let startQuestion: QuestionId = 'couple_names';
        if (existingData.partner1_name) startQuestion = 'wedding_date';
        if (existingData.wedding_date) startQuestion = 'wedding_date_end';
        if (existingData.venue_name) startQuestion = 'venue_location';
        if (existingData.venue_location) startQuestion = 'welcome_text';
        if (existingData.welcome_text) startQuestion = 'primary_color';
        if (existingData.primary_color) startQuestion = 'rsvp_deadline';
        if (existingData.rsvp_deadline) startQuestion = 'schedule_intro';
        if (existingData._has_schedule) startQuestion = 'faq_intro';
        if (existingData._has_faqs) startQuestion = 'registry_intro';
        if (existingData._has_registry) startQuestion = 'pin_setup';
        if (existingData._has_pins) startQuestion = 'complete';

        setCurrentQuestionId(startQuestion);

        const initialMessages: Message[] = [
          { id: 'init-1', role: 'ai', text: "Hey! 👋 I'm Phera, your AI wedding website builder." },
          { id: 'init-2', role: 'ai', text: getQuestionText(QUESTIONS[startQuestion], existingData) },
        ];
        setMessages(initialMessages);
      } catch (err) {
        console.error('Error loading wedding:', err);
        toast.error('Failed to load wedding data');
      } finally {
        setIsLoading(false);
      }
    };

    loadWedding();
  }, [weddingSlug]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const saveToDatabase = useCallback(async (data: Record<string, any>) => {
    if (!weddingId) return;
    try {
      // Only save fields that go directly to the weddings table (no _ prefix, non-null)
      const dbData = Object.entries(data).reduce((acc, [key, value]) => {
        if (value !== null && !key.startsWith('_')) acc[key] = value;
        return acc;
      }, {} as Record<string, any>);

      if (Object.keys(dbData).length > 0) {
        await weddingService.updateWedding(weddingId, dbData);
        broadcastUpdate(dbData);
      }
    } catch (err) {
      console.error('Error saving to database:', err);
      toast.error('Failed to save changes');
    }
  }, [weddingId, broadcastUpdate]);

  // Save data that goes to separate tables (schedule, FAQ, registry, pins)
  const saveSpecialData = useCallback(async (
    questionId: QuestionId,
    parsedData: Record<string, any>,
    newCollectedData: Record<string, any>,
  ) => {
    if (!weddingId) return;

    const weddingStartDate = newCollectedData.wedding_date
      ? new Date(newCollectedData.wedding_date)
      : new Date();

    try {
      if (questionId === 'day1_name') {
        const date = new Date(weddingStartDate);
        const day = await weddingService.createSchedule({
          wedding_id: weddingId,
          day_name: parsedData._day1_name,
          date: date.toISOString().split('T')[0],
          order_index: 0,
        });
        if (day) setScheduleDayIds(prev => ({ ...prev, day1: day.id }));
      }

      else if (questionId === 'day1_events' && (parsedData._day1_events || []).length > 0) {
        // scheduleDayIds is captured at call time; use ref pattern via callback
        setScheduleDayIds(prev => {
          const dayId = prev.day1;
          if (dayId) {
            (parsedData._day1_events as any[]).forEach((event: any, i: number) => {
              weddingService.createScheduleItem({ schedule_id: dayId, name: event.name, time: event.time, is_major_event: false, order_index: i });
            });
          }
          return prev;
        });
      }

      else if (questionId === 'day2_name') {
        const date = new Date(weddingStartDate);
        date.setDate(date.getDate() + 1);
        const day = await weddingService.createSchedule({
          wedding_id: weddingId,
          day_name: parsedData._day2_name,
          date: date.toISOString().split('T')[0],
          order_index: 1,
        });
        if (day) setScheduleDayIds(prev => ({ ...prev, day2: day.id }));
      }

      else if (questionId === 'day2_events' && (parsedData._day2_events || []).length > 0) {
        setScheduleDayIds(prev => {
          const dayId = prev.day2;
          if (dayId) {
            (parsedData._day2_events as any[]).forEach((event: any, i: number) => {
              weddingService.createScheduleItem({ schedule_id: dayId, name: event.name, time: event.time, is_major_event: false, order_index: i });
            });
          }
          return prev;
        });
      }

      else if (questionId === 'day3_name') {
        const date = new Date(weddingStartDate);
        date.setDate(date.getDate() + 2);
        const day = await weddingService.createSchedule({
          wedding_id: weddingId,
          day_name: parsedData._day3_name,
          date: date.toISOString().split('T')[0],
          order_index: 2,
        });
        if (day) setScheduleDayIds(prev => ({ ...prev, day3: day.id }));
      }

      else if (questionId === 'day3_events' && (parsedData._day3_events || []).length > 0) {
        setScheduleDayIds(prev => {
          const dayId = prev.day3;
          if (dayId) {
            (parsedData._day3_events as any[]).forEach((event: any, i: number) => {
              weddingService.createScheduleItem({ schedule_id: dayId, name: event.name, time: event.time, is_major_event: false, order_index: i });
            });
          }
          return prev;
        });
      }

      else if (questionId === 'faq_item' && (parsedData._faq_items || []).length > 0) {
        for (let i = 0; i < parsedData._faq_items.length; i++) {
          const faq = parsedData._faq_items[i];
          await weddingService.createFAQ({
            wedding_id: weddingId,
            question: faq.question,
            answer: faq.answer,
            order_index: i,
          });
        }
      }

      else if (questionId === 'registry_item') {
        const validItems = (parsedData._registry_items || []).filter((r: any) => r.external_url);
        for (let i = 0; i < validItems.length; i++) {
          const item = validItems[i];
          await weddingService.createRegistryItem({
            wedding_id: weddingId,
            fund_name: item.fund_name,
            emoji: item.emoji || '🎁',
            external_url: item.external_url,
            order_index: i,
          });
        }
      }

      else if (questionId === 'pin_setup' && parsedData._guest_pin) {
        const existingSettings = await weddingService.getSettings(weddingId);
        const newPin = { pin: parsedData._guest_pin, type: 'guest', allows_plus_one: false, skip_rsvp: false };
        if (existingSettings?.id) {
          const currentPins = (existingSettings.pin_codes as any[]) || [];
          await weddingService.updateSettings(weddingId, { pin_codes: [...currentPins, newPin] });
        } else {
          await weddingService.createSettings({ wedding_id: weddingId, pin_codes: [newPin] });
        }
      }
    } catch (err) {
      console.error(`Error saving special data for ${questionId}:`, err);
    }
  }, [weddingId]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || currentQuestionId === 'complete') return;

    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    const currentQuestion = QUESTIONS[currentQuestionId];
    const parsedData = currentQuestion.parser(text);
    const newCollectedData = { ...collectedData, ...parsedData };
    setCollectedData(newCollectedData);

    // Save to wedding table and any special tables
    await saveToDatabase(parsedData);
    await saveSpecialData(currentQuestionId, parsedData, newCollectedData);

    setTimeout(() => {
      const ackResponse = generateAIResponse(currentQuestion, parsedData, newCollectedData);

      // Determine next question
      let nextQuestionId: QuestionId;
      if (typeof currentQuestion.nextQuestion === 'function') {
        nextQuestionId = currentQuestion.nextQuestion(parsedData);
      } else {
        nextQuestionId = currentQuestion.nextQuestion;
      }

      // Walk through skipIf chain
      let safetyCount = 0;
      while (QUESTIONS[nextQuestionId].skipIf?.(newCollectedData) && nextQuestionId !== 'complete' && safetyCount < 10) {
        const tempQuestion = QUESTIONS[nextQuestionId];
        nextQuestionId = typeof tempQuestion.nextQuestion === 'function'
          ? tempQuestion.nextQuestion({})
          : tempQuestion.nextQuestion;
        safetyCount++;
      }

      setCurrentQuestionId(nextQuestionId);

      const newMessages: Message[] = [];
      if (ackResponse) newMessages.push({ id: `ai-ack-${Date.now()}`, role: 'ai', text: ackResponse });

      if (nextQuestionId !== 'complete') {
        newMessages.push({
          id: `ai-q-${Date.now()}`,
          role: 'ai',
          text: getQuestionText(QUESTIONS[nextQuestionId], newCollectedData),
        });
      } else {
        newMessages.push({ id: `ai-complete-${Date.now()}`, role: 'ai', text: QUESTIONS.complete.question as string });
      }

      setIsTyping(false);
      setMessages(prev => [...prev, ...newMessages]);
    }, 800 + Math.random() * 400);
  }, [input, currentQuestionId, collectedData, saveToDatabase, saveSpecialData]);

  // ── Non-pro teaser ──────────────────────────────────────────────────────────

  if (!isPro) {
    return (
      <Container maxWidth="xl">
        <Stack spacing={3}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5, color: '#1a1a1a' }}>
                Build with AI
              </Typography>
              <Typography variant="body2" sx={{ color: '#6a6a6a' }}>
                Answer a few questions and watch your wedding website come to life
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AutoAwesome />}
              onClick={() => setUpgradeModalOpen(true)}
              sx={{ bgcolor: '#DE3F5E', color: 'white', px: 3, py: 1.25, borderRadius: 2, fontWeight: 600, textTransform: 'none', fontSize: '0.9rem', flexShrink: 0, '&:hover': { bgcolor: '#c73552' } }}
            >
              Upgrade to Pro
            </Button>
          </Box>

          <Box sx={{ maxWidth: 640 }}>
            <Typography variant="body2" sx={{ color: '#4a4a4a', lineHeight: 1.75, mb: 1.25 }}>
              Building a wedding website shouldn't mean navigating form after form. <strong>Just have a conversation.</strong> Our AI walks you through every detail — venue, schedule, travel info, FAQs and more — one question at a time. You answer, we build. Your beautiful website takes shape in minutes, not hours.
            </Typography>
            <Stack spacing={0.6}>
              {([
                <><strong>One question at a time</strong> — no forms, no overwhelm, just a natural conversation</>,
                <><strong>Every section covered</strong> automatically — details, schedule, travel, registry and more</>,
                <><strong>Your choices, your style</strong> — the AI tailors the design to what you describe</>,
                <><strong>Lightning fast</strong> — go from blank slate to a fully built website in one sitting</>,
              ] as React.ReactNode[]).map((content, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <Typography variant="body2" sx={{ color: '#DE3F5E', lineHeight: 1.65, flexShrink: 0, fontWeight: 700 }}>•</Typography>
                  <Typography variant="body2" sx={{ color: '#4a4a4a', lineHeight: 1.65 }}>{content}</Typography>
                </Box>
              ))}
            </Stack>
          </Box>

          <Box sx={{ position: 'relative', borderRadius: 3, overflow: 'hidden' }}>
            <Box sx={{ filter: 'blur(3px)', pointerEvents: 'none', userSelect: 'none' }}>
              <Paper elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 3, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: 420 }}>
                <Box sx={{ flex: 1, overflowY: 'auto', px: 2.5, py: 2.5 }}>
                  {mockMessages.map(m => <Bubble key={m.id} message={m} />)}
                </Box>
                <Box sx={{ px: 2, py: 1.5, borderTop: '1px solid rgba(0,0,0,0.07)', display: 'flex', gap: 1 }}>
                  <Box sx={{ flex: 1, bgcolor: '#F8F8F8', borderRadius: 2, px: 2, py: 1 }}>
                    <Typography sx={{ fontSize: '0.875rem', color: '#bbb' }}>Type your answer...</Typography>
                  </Box>
                  <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: '#DE3F5E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ArrowUpward sx={{ fontSize: 18, color: 'white' }} />
                  </Box>
                </Box>
              </Paper>
            </Box>

            <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, bgcolor: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(2px)' }}>
              <Box sx={{ width: 56, height: 56, borderRadius: '50%', bgcolor: 'white', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LockOutlined sx={{ fontSize: 26, color: '#DE3F5E' }} />
              </Box>
              <Button
                variant="contained"
                startIcon={<AutoAwesome />}
                onClick={() => setUpgradeModalOpen(true)}
                sx={{ bgcolor: '#DE3F5E', color: 'white', px: 3.5, py: 1.5, borderRadius: 2, fontWeight: 600, textTransform: 'none', fontSize: '0.95rem', boxShadow: '0 4px 20px rgba(222,63,94,0.35)', '&:hover': { bgcolor: '#c73552' } }}
              >
                Unlock AI Builder
              </Button>
            </Box>
          </Box>
        </Stack>
        <UpgradeModal open={upgradeModalOpen} onClose={() => setUpgradeModalOpen(false)} />
      </Container>
    );
  }

  if (isLoading) {
    return (
      <Box sx={{ height: 'calc(100vh - 100px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Stack alignItems="center" spacing={2}>
          <AutoAwesome sx={{ fontSize: 48, color: '#DE3F5E', animation: 'pulse 1.5s infinite' }} />
          <Typography sx={{ color: '#6a6a6a' }}>Loading your wedding...</Typography>
        </Stack>
      </Box>
    );
  }

  // ── Pro view — chat interface ───────────────────────────────────────────────

  return (
    <Box sx={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{
          flex: 1,
          borderRadius: '8px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          bgcolor: alpha('#DE3F5E', 0.02),
          border: '2px solid',
          borderColor: alpha('#000', 0.12),
        }}
      >
        {/* Messages */}
        <Box sx={{ flex: 1, overflowY: 'auto', px: 4, py: 4, display: 'flex', flexDirection: 'column' }}>
          {messages.map(m => <Bubble key={m.id} message={m} />)}
          {isTyping && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </Box>

        {/* Input area */}
        <Box
          sx={{
            px: 3, py: 2.5,
            borderTop: '2px solid',
            borderColor: alpha('#000', 0.12),
            display: 'flex',
            gap: 1.5,
            alignItems: 'flex-end',
            bgcolor: 'white',
          }}
        >
          {currentQuestionId === 'complete' ? (
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 2, py: 1 }}>
              <Check sx={{ color: '#10B981', fontSize: 24 }} />
              <Typography sx={{ color: '#10B981', fontWeight: 600 }}>
                Website setup complete! Explore the other sections to add more details.
              </Typography>
            </Box>
          ) : (
            <>
              <TextField
                fullWidth
                multiline
                maxRows={4}
                placeholder="Type your answer..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    fontSize: '1rem',
                    bgcolor: 'white',
                    '& fieldset': { border: '2px solid', borderColor: alpha('#000', 0.15) },
                    '&:hover fieldset': { borderColor: alpha('#000', 0.25) },
                    '&.Mui-focused fieldset': { border: '2px solid #DE3F5E' },
                  },
                  '& .MuiOutlinedInput-input': { py: 1.5, px: 2 },
                }}
              />
              <IconButton
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                sx={{
                  width: 48, height: 48,
                  bgcolor: input.trim() ? '#DE3F5E' : alpha('#000', 0.06),
                  color: input.trim() ? 'white' : '#bbb',
                  borderRadius: '12px',
                  flexShrink: 0,
                  transition: 'all 0.15s',
                  border: '2px solid',
                  borderColor: input.trim() ? '#DE3F5E' : alpha('#000', 0.15),
                  '&:hover': { bgcolor: input.trim() ? '#c73552' : alpha('#000', 0.08) },
                  '&.Mui-disabled': { bgcolor: alpha('#000', 0.04), color: '#ccc', borderColor: alpha('#000', 0.1) },
                }}
              >
                <ArrowUpward sx={{ fontSize: 22 }} />
              </IconButton>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
}
