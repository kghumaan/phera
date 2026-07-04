/**
 * Preview-mode fixtures. Shape mirrors the real Supabase rows
 * (see CLAUDE.md "Database Schema" + lib/supabase/types.ts on web):
 * wedding_id is a TEXT slug, rsvps.attending is 'yes' | 'no' | 'maybe',
 * guests carry avatar_color and use '' for missing email.
 */

export const MOCK_WEDDING = {
  slug: 'priya-rahul-2026',
  coupleNames: 'Priya & Rahul',
  city: 'Udaipur',
  weddingDate: '2026-11-20',
  eventCount: 5,
} as const;

export interface MockGuest {
  id: string;
  name: string;
  email: string;
  phone: string;
  wedding_side: 'bride' | 'groom' | 'both';
  avatar_color: string;
  outreach_status:
    | 'not_contacted'
    | 'save_the_date_sent'
    | 'rsvp_requested'
    | 'rsvp_confirmed'
    | 'travel_collected'
    | 'logistics_complete'
    | 'unresponsive';
  attending: 'yes' | 'no' | 'maybe' | null;
}

export const MOCK_GUESTS: MockGuest[] = [
  { id: 'g1', name: 'Anita Sharma', email: 'anita@example.com', phone: '+14155550101', wedding_side: 'bride', avatar_color: '#DE3F5E', outreach_status: 'rsvp_confirmed', attending: 'yes' },
  { id: 'g2', name: 'Vikram Mehta', email: '', phone: '+14155550102', wedding_side: 'groom', avatar_color: '#3b82f6', outreach_status: 'travel_collected', attending: 'yes' },
  { id: 'g3', name: 'Sarah Chen', email: 'sarah@example.com', phone: '+14155550103', wedding_side: 'bride', avatar_color: '#20C997', outreach_status: 'rsvp_requested', attending: 'maybe' },
  { id: 'g4', name: 'Dev Patel', email: 'dev@example.com', phone: '+447700900104', wedding_side: 'groom', avatar_color: '#6C5CE7', outreach_status: 'save_the_date_sent', attending: null },
  { id: 'g5', name: 'Meera & Raj Kapoor', email: '', phone: '+919820050105', wedding_side: 'both', avatar_color: '#FF9933', outreach_status: 'logistics_complete', attending: 'yes' },
  { id: 'g6', name: 'James Wilson', email: 'james@example.com', phone: '+14155550106', wedding_side: 'groom', avatar_color: '#D4AF37', outreach_status: 'not_contacted', attending: null },
  { id: 'g7', name: 'Nisha Reddy', email: 'nisha@example.com', phone: '+16135550107', wedding_side: 'bride', avatar_color: '#FF6B6B', outreach_status: 'unresponsive', attending: 'no' },
];

export const MOCK_STATS = {
  totalGuests: 142,
  rsvpYes: 98,
  rsvpNo: 12,
  rsvpPending: 32,
  travelCollected: 61,
} as const;

export const MOCK_NEXT_ACTIONS = [
  { id: 'a1', title: 'Send RSVP reminder to 32 pending guests', detail: 'Last nudge was 6 days ago', icon: 'chatbubbles-outline' },
  { id: 'a2', title: 'Collect travel details from 37 confirmed guests', detail: 'Flights land in 20 weeks', icon: 'airplane-outline' },
  { id: 'a3', title: 'Review 2 escalations from the concierge', detail: "Guests asked about the sangeet dress code", icon: 'alert-circle-outline' },
] as const;

export const MOCK_USER = {
  id: 'preview-user',
  email: 'preview@phera.io',
  name: 'Preview Couple',
} as const;
