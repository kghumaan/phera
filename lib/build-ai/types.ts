import React from 'react';

// ─── Message Types ───────────────────────────────────────────────────────────

export interface Message {
  id: string;
  role: 'ai' | 'user';
  text: string;
  component?: React.ReactNode;
}

// ─── Question Types ──────────────────────────────────────────────────────────

export type QuestionId =
  | 'partner1_name'
  | 'partner2_name'
  | 'venue_name'
  | 'venue_location'
  | 'welcome_text'
  | 'rsvp_deadline'
  | 'schedule_intro'
  | 'day1_events'
  | 'day2_events'
  | 'day3_events'
  | 'day4_events'
  | 'day5_events'
  | 'day6_events'
  | 'day7_events'
  | 'day8_events'
  | 'day9_events'
  | 'day10_events'
  | 'faq_intro'
  | 'faq_item'
  | 'registry_intro'
  | 'registry_item'
  | 'travel_intro'
  | 'travel_item'
  | 'shopping_intro'
  | 'shopping_item'
  | 'couple_images'
  | 'frame_selection'
  | 'look_feel'
  | 'pin_setup'
  | 'pin_item'
  | 'complete';

export type FormType =
  | 'text'
  | 'date'
  | 'event'
  | 'faq'
  | 'registry'
  | 'count'
  | 'yes_no'
  | 'skip_button'
  | 'background'
  | 'color'
  | 'layout'
  | 'look_feel'
  | 'couple_images'
  | 'frame_selection'
  | 'travel'
  | 'shopping'
  | 'pin'
  | 'none';

export interface Question {
  id: QuestionId;
  question: string | ((data: Record<string, any>) => string);
  field: string | string[];
  parser: (input: string) => Record<string, any>;
  nextQuestion: QuestionId | ((response: any) => QuestionId);
  skipIf?: (collectedData: Record<string, any>) => boolean;
  formType: FormType;
}

// ─── Answer History (for go-back navigation) ─────────────────────────────────

export interface AnswerHistoryEntry {
  questionId: QuestionId;
  answer: string;
  parsedData: Record<string, any>;
}

// ─── Intent Classification (Phase 4) ────────────────────────────────────────

export type IntentType = 'answer' | 'go_back' | 'change_value' | 'question' | 'general_inquiry' | 'unclear';

export interface ClassifyResponse {
  intent: IntentType;
  targetField?: QuestionId;
  extractedValue?: string;
  helpResponse?: string;
}

// ─── Field Labels (for LLM mapping) ─────────────────────────────────────────

export const FIELD_LABELS: Record<string, QuestionId> = {
  'name': 'partner1_name',
  'my name': 'partner1_name',
  'first name': 'partner1_name',
  'partner name': 'partner2_name',
  'partner': 'partner2_name',
  'names': 'partner1_name',
  'couple names': 'partner1_name',
  'our names': 'partner1_name',
  'venue': 'venue_name',
  'venue name': 'venue_name',
  'location': 'venue_location',
  'venue location': 'venue_location',
  'welcome message': 'welcome_text',
  'welcome text': 'welcome_text',
  'background': 'look_feel',
  'background image': 'look_feel',
  'color': 'look_feel',
  'colour': 'look_feel',
  'theme color': 'look_feel',
  'accent color': 'look_feel',
  'layout': 'look_feel',
  'website layout': 'look_feel',
  'design': 'look_feel',
  'look and feel': 'look_feel',
  'rsvp': 'rsvp_deadline',
  'rsvp deadline': 'rsvp_deadline',
  'schedule': 'schedule_intro',
  'events': 'schedule_intro',
  'faq': 'faq_intro',
  'faqs': 'faq_intro',
  'registry': 'registry_intro',
  'gift registry': 'registry_intro',
  'travel': 'travel_intro',
  'accommodation': 'travel_intro',
  'shopping': 'shopping_intro',
  'shops': 'shopping_intro',
  'couple photos': 'couple_images',
  'couple images': 'couple_images',
  'photos': 'couple_images',
  'frame': 'frame_selection',
  'photo frame': 'frame_selection',
  'pin': 'pin_setup',
  'pins': 'pin_setup',
  'access code': 'pin_setup',
};

// ─── Step Labels (for Go Back dropdown) ─────────────────────────────────────

export const STEP_LABELS: Partial<Record<QuestionId, string>> = {
  partner1_name: 'Your Name',
  partner2_name: "Partner's Name",
  venue_name: 'Venue Name',
  venue_location: 'Venue Location',
  welcome_text: 'Welcome Message',
  rsvp_deadline: 'RSVP Deadline',
  schedule_intro: 'Event Schedule',
  faq_intro: 'FAQs',
  registry_intro: 'Gift Registry',
  travel_intro: 'Travel & Accommodation',
  shopping_intro: 'Shopping Recommendations',
  couple_images: 'Couple Photos',
  frame_selection: 'Photo Frame',
  look_feel: 'Look & Feel',
  pin_setup: 'Access PINs',
};
