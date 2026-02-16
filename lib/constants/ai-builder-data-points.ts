/**
 * AI Builder Data Points Reference
 *
 * This file contains all the data points that can be collected from users
 * through the AI Builder chat interface. The AI will ask questions one by one
 * and auto-save responses to build the wedding website.
 *
 * Generated from analysis of admin pages:
 * - /details, /design, /schedule, /travel, /faq, /registry, /shopping, /pins
 */

// ─── Wedding Details ───────────────────────────────────────────────────────────

export interface CoupleInfo {
  partner1_name: string;       // Your first name (required)
  partner2_name: string;       // Partner's first name (required)
  couple_name: string;         // Auto-generated: "Partner1 & Partner2" (editable)
}

export interface WeddingDates {
  wedding_date: string;        // Start date (required, ISO string)
  wedding_date_end?: string;   // End date (optional, for multi-day events)
  wedding_date_display: string; // Auto-generated display format (editable)
}

export interface VenueInfo {
  venue_name: string;          // Venue name (required)
  venue_location: string;      // City/Country (e.g., "Bangkok, Thailand 🇹🇭")
  show_venue_location: boolean; // Whether to display on website
}

export interface RSVPSettings {
  rsvp_deadline?: string;      // Optional RSVP closing date (ISO string)
}

export interface CoupleMedia {
  couple_images: (string | null)[]; // Up to 6 couple photos
  frame_image_url?: string;    // Decorative frame selection
}

// ─── Look & Feel (Design) ─────────────────────────────────────────────────────

export interface MainWebsiteDesign {
  website_layout: 'nested' | 'infinite_scroll';
  welcome_text: string;        // Message displayed below couple names
  background_image: string;    // Main site background (preset or custom URL)
  primary_color: string;       // Theme/accent color (hex)
}

export interface LockScreenDesign {
  pin_entry_text: string;      // Welcome heading (e.g., "You're invited!")
  pin_entry_subtitle_text: string; // Subtitle below heading
  pin_entry_background: string; // Lock screen background (preset or custom URL)
  pin_entry_primary_color: string; // Button color (hex)
  pin_entry_font_color: string;    // Text color (hex)
  pin_entry_button_font_color: string; // Button text color (hex)
}

// ─── Schedule & Events ────────────────────────────────────────────────────────

export interface ScheduleDay {
  id?: string;
  wedding_id?: string;
  day_name: string;            // e.g., "Sunday", "Day 1: Mehendi"
  date: string;                // ISO date (YYYY-MM-DD)
  order_index: number;
  events?: ScheduleItem[];
}

export interface ScheduleItem {
  id?: string;
  schedule_id: string;         // Reference to parent day
  time: string;                // e.g., "11:00 AM" or "11:00 AM - 1:00 PM"
  name: string;                // Event name (required)
  description?: string;        // Event description
  location?: string;           // Event location
  is_major_event: boolean;     // Highlight as major event
  gradient_background?: string; // Background for major events
  linked_event_id?: string;    // Reference to WeddingEvent for slides
  order_index: number;
}

// Carousel slide types for major events
export type SlideType =
  | 'three_lines'    // Header + Title + Description
  | 'two_sections'   // Two sections with custom headers
  | 'outfit_ideas'   // Women/Men outfit suggestions
  | 'dress_code'     // Dress code information
  | 'ritual'         // Ceremony/ritual info
  | 'image';         // Full image slide

export interface CarouselSlide {
  type: SlideType;
  // For 'three_lines':
  top_label?: string;          // Small header text
  main_heading?: string;       // Large italic title
  body_text?: string;          // Description text
  // For 'two_sections':
  section1_header?: string;
  section1_items?: string[];
  section2_header?: string;
  section2_items?: string[];
  // For 'outfit_ideas' (legacy):
  women?: string[];
  men?: string[];
  // For 'dress_code' and 'ritual':
  subtitle?: string;
  heading?: string;
  description?: string;
  // For 'image':
  src?: string;
}

// ─── Travel & Stay ────────────────────────────────────────────────────────────

export interface TravelCard {
  id?: string;
  wedding_id?: string;
  title: string;               // Card title (required)
  content: string[];           // Array of paragraphs
  image_url: string;           // Card image (required)
  button_text?: string;        // Optional button text
  button_action?: string;      // URL or route
  is_whatsapp_button?: boolean; // Style as WhatsApp button
  is_disabled?: boolean;       // Disable button
  order_index: number;
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

export interface FAQItem {
  id?: string;
  wedding_id?: string;
  question: string;            // Question text (required)
  answer: string;              // Answer text (required)
  button_text?: string;        // Optional button text
  button_link?: string;        // Optional button link
  order_index: number;
}

// ─── Registry ─────────────────────────────────────────────────────────────────

export interface RegistryItem {
  id?: string;
  wedding_id?: string;
  fund_name: string;           // Registry name (required)
  emoji: string;               // Icon/emoji (required)
  external_url: string;        // Full URL to registry site (required)
  order_index: number;
}

// ─── Shopping Guide ───────────────────────────────────────────────────────────

export interface ShopItem {
  id?: string;
  wedding_id?: string;
  name: string;                // Store name (required)
  details?: string;            // Description/shipping info
  url: string;                 // Website URL (required)
  order_index: number;
}

// ─── PIN Management ───────────────────────────────────────────────────────────

export interface PINCode {
  pin: string;                 // Unique PIN code (required)
  type: string;                // Category: 'guest', 'family', 'vip', 'vendor', etc.
  allows_plus_one: boolean;    // Can bring a plus one
  skip_rsvp: boolean;          // Skip RSVP process
}

// ─── Complete Wedding Data ────────────────────────────────────────────────────

export interface CompleteWeddingData {
  // Core details
  couple: CoupleInfo;
  dates: WeddingDates;
  venue: VenueInfo;
  rsvp: RSVPSettings;
  media: CoupleMedia;

  // Design
  mainDesign: MainWebsiteDesign;
  lockScreenDesign: LockScreenDesign;

  // Content sections
  schedule: ScheduleDay[];
  travel: TravelCard[];
  faq: FAQItem[];
  registry: RegistryItem[];
  shopping: ShopItem[];

  // Access
  pins: PINCode[];
}

// ─── AI Builder Question Flow ─────────────────────────────────────────────────

export type QuestionCategory =
  | 'couple_info'
  | 'dates'
  | 'venue'
  | 'rsvp'
  | 'design'
  | 'schedule'
  | 'travel'
  | 'faq'
  | 'registry'
  | 'shopping'
  | 'pins';

export interface AIQuestion {
  id: string;
  category: QuestionCategory;
  question: string;
  field: string;               // Path to data field (e.g., "couple.partner1_name")
  type: 'text' | 'date' | 'boolean' | 'select' | 'multiline' | 'image';
  required: boolean;
  placeholder?: string;
  options?: string[];          // For select type
  validation?: (value: any) => boolean;
  followUp?: string;           // ID of next question (for conditional flow)
}

/**
 * Ordered list of questions the AI should ask
 * The AI will iterate through these, skipping optional ones if user declines
 */
export const AI_QUESTION_FLOW: AIQuestion[] = [
  // ── Couple Info ──
  {
    id: 'partner1_name',
    category: 'couple_info',
    question: "What's your first name?",
    field: 'couple.partner1_name',
    type: 'text',
    required: true,
    placeholder: 'e.g., Simran',
  },
  {
    id: 'partner2_name',
    category: 'couple_info',
    question: "And what's your partner's first name?",
    field: 'couple.partner2_name',
    type: 'text',
    required: true,
    placeholder: 'e.g., Karanvir',
  },

  // ── Dates ──
  {
    id: 'wedding_date',
    category: 'dates',
    question: "When is your wedding? (Start date)",
    field: 'dates.wedding_date',
    type: 'date',
    required: true,
  },
  {
    id: 'wedding_date_end',
    category: 'dates',
    question: "Is it a multi-day celebration? If so, what's the end date?",
    field: 'dates.wedding_date_end',
    type: 'date',
    required: false,
  },

  // ── Venue ──
  {
    id: 'venue_name',
    category: 'venue',
    question: "What's the name of your venue?",
    field: 'venue.venue_name',
    type: 'text',
    required: true,
    placeholder: 'e.g., The Oberoi, Udaipur',
  },
  {
    id: 'venue_location',
    category: 'venue',
    question: "Where is it located? (City, Country)",
    field: 'venue.venue_location',
    type: 'text',
    required: false,
    placeholder: 'e.g., Udaipur, India 🇮🇳',
  },

  // ── RSVP ──
  {
    id: 'rsvp_deadline',
    category: 'rsvp',
    question: "Would you like to set an RSVP deadline?",
    field: 'rsvp.rsvp_deadline',
    type: 'date',
    required: false,
  },

  // ── Design ──
  {
    id: 'website_layout',
    category: 'design',
    question: "How would you like guests to navigate your website?",
    field: 'mainDesign.website_layout',
    type: 'select',
    required: true,
    options: ['nested', 'infinite_scroll'],
  },
  {
    id: 'welcome_text',
    category: 'design',
    question: "What welcome message would you like to display?",
    field: 'mainDesign.welcome_text',
    type: 'multiline',
    required: false,
    placeholder: "Come celebrate with us under the stars. A little romance, a lot of partying. You won't want to miss it.",
  },
  {
    id: 'primary_color',
    category: 'design',
    question: "What's your wedding color? (We'll use this as the accent color)",
    field: 'mainDesign.primary_color',
    type: 'text',
    required: false,
    placeholder: '#DE3F5E (Rose Pink)',
  },

  // ── Schedule ──
  {
    id: 'schedule_overview',
    category: 'schedule',
    question: "Let's build your schedule! How many days is your celebration?",
    field: 'schedule',
    type: 'text',
    required: true,
  },

  // Additional questions will be dynamically generated based on number of days
  // Each day will ask for: day_name, date, and events

  // ── Travel ──
  {
    id: 'travel_info',
    category: 'travel',
    question: "Would you like to add travel & accommodation info for your guests?",
    field: 'travel',
    type: 'boolean',
    required: false,
  },

  // ── FAQ ──
  {
    id: 'faq_items',
    category: 'faq',
    question: "Any frequently asked questions you'd like to address? (e.g., parking, dress code, gifts)",
    field: 'faq',
    type: 'boolean',
    required: false,
  },

  // ── Registry ──
  {
    id: 'registry_items',
    category: 'registry',
    question: "Do you have any registry links you'd like to share?",
    field: 'registry',
    type: 'boolean',
    required: false,
  },

  // ── Shopping ──
  {
    id: 'shopping_guide',
    category: 'shopping',
    question: "Would you like to recommend any shops for guest outfits?",
    field: 'shopping',
    type: 'boolean',
    required: false,
  },

  // ── PINs ──
  {
    id: 'pin_setup',
    category: 'pins',
    question: "Finally, let's set up access PINs for your guests. Would you like a single shared PIN or individual PINs?",
    field: 'pins',
    type: 'select',
    required: true,
    options: ['single_shared', 'individual'],
  },
];

// ─── Default Values ───────────────────────────────────────────────────────────

export const DEFAULT_WEDDING_DATA: Partial<CompleteWeddingData> = {
  mainDesign: {
    website_layout: 'nested',
    welcome_text: "Come celebrate with us under the stars. A little romance, a lot of partying. You won't want to miss it.",
    background_image: '/images/backgrounds/pearl.png',
    primary_color: '#DE3F5E',
  },
  lockScreenDesign: {
    pin_entry_text: "You're invited!",
    pin_entry_subtitle_text: 'Enter your invitation code to see all the details and RSVP for our celebration',
    pin_entry_background: '/images/backgrounds/pearl.png',
    pin_entry_primary_color: '#141414',
    pin_entry_font_color: '#000000',
    pin_entry_button_font_color: '#FFFFFF',
  },
  venue: {
    venue_name: '',
    venue_location: '',
    show_venue_location: true,
  },
  schedule: [],
  travel: [],
  faq: [],
  registry: [],
  shopping: [],
  pins: [],
};

// ─── Color Options ────────────────────────────────────────────────────────────

export const COLOR_OPTIONS = [
  { name: 'Black', value: '#141414' },
  { name: 'Rose', value: '#DE3F5E' },
  { name: 'Plum', value: '#59114D' },
  { name: 'Purple', value: '#AC3FBA' },
  { name: 'Ocean', value: '#004550' },
  { name: 'Sky', value: '#6290C8' },
  { name: 'Teal', value: '#489991' },
  { name: 'Maroon', value: '#941C28' },
  { name: 'Green', value: '#76B041' },
  { name: 'Forest', value: '#59814B' },
  { name: 'Orange', value: '#DF6507' },
  { name: 'Amber', value: '#FA9A00' },
];

// ─── Background Options ───────────────────────────────────────────────────────

export const BACKGROUND_OPTIONS = [
  { name: 'Pearl White', value: 'pearl.png' },
  { name: 'Sunny Yellow', value: 'GradientYellow.png' },
  { name: 'Crimson Red', value: 'GradientJaggo.png' },
  { name: 'Royal Purple', value: 'GradientReception.png' },
  { name: 'Pool Blue', value: 'GradientPoolParty.png' },
];
