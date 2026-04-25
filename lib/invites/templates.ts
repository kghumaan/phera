/**
 * Built-in invite templates. Couple-authored messages — no Meta template
 * approval path. These are rendered into wa.me deep links that the couple
 * sends from their personal WhatsApp (or later, the Phera Business number).
 *
 * Variable syntax: {{var_name}}. Resolution order:
 *   1. composer form overrides (admin edits)
 *   2. per-guest context (guest_first_name, rsvp_link)
 *   3. wedding-level defaults (couple_names, wedding_date, etc.)
 */

import {
  CardGiftcard,
  EventAvailable,
  Notifications,
  Flight,
  Mail,
  FavoriteBorder,
} from '@mui/icons-material';
import type { ComponentType } from 'react';

export type InviteTemplateCategory = 'announce' | 'rsvp' | 'reminder' | 'logistics' | 'followup';

export interface InviteTemplateVariable {
  key: string;
  label: string;
  placeholder?: string;
  // If present, the composer will not render an input for this — it comes
  // from the per-guest loop at send-time (e.g. guest_first_name).
  perGuest?: boolean;
  multiline?: boolean;
}

export interface InviteTemplate {
  id: string;
  title: string;
  description: string;
  category: InviteTemplateCategory;
  icon: ComponentType;
  body: string;
  variables: InviteTemplateVariable[];
  // Which outreach_status this send should advance the guest to.
  nextStatus?:
    | 'save_the_date_sent'
    | 'rsvp_requested'
    | 'rsvp_confirmed'
    | 'travel_collected'
    | 'logistics_complete';
}

export const INVITE_TEMPLATES: InviteTemplate[] = [
  {
    id: 'save_the_date',
    title: 'Save the Date',
    description: 'First-touch announcement. Build anticipation before the formal shaadi card.',
    category: 'announce',
    icon: CardGiftcard,
    body:
`Namaste {{guest_first_name}} 🪷

We are thrilled to share that {{couple_names}} are getting married on {{wedding_date}} in {{wedding_city}}.

Please save the dates for our mehendi, sangeet, and wedding ceremonies. Formal shaadi card and full schedule to follow soon!

We can't imagine celebrating without you.`,
    variables: [
      { key: 'guest_first_name', label: 'Guest first name', perGuest: true },
      { key: 'couple_names', label: 'Couple names', placeholder: 'Priya & Rahul' },
      { key: 'wedding_date', label: 'Wedding dates', placeholder: 'Feb 14–16, 2026' },
      { key: 'wedding_city', label: 'City', placeholder: 'Jaipur' },
    ],
    nextStatus: 'save_the_date_sent',
  },
  {
    id: 'rsvp_request',
    title: 'RSVP Request',
    description: 'Formal ask — share the RSVP link so guests can respond per ceremony.',
    category: 'rsvp',
    icon: EventAvailable,
    body:
`Namaste {{guest_first_name}}!

{{couple_names}} would be honoured to have you and your family join the wedding celebrations from {{wedding_date}}.

Please RSVP for each ceremony here: {{rsvp_link}}

Kindly respond by {{rsvp_deadline}}. For any questions, simply reply to this message 💌`,
    variables: [
      { key: 'guest_first_name', label: 'Guest first name', perGuest: true },
      { key: 'rsvp_link', label: 'RSVP link', perGuest: true },
      { key: 'couple_names', label: 'Couple names', placeholder: 'Priya & Rahul' },
      { key: 'wedding_date', label: 'Wedding dates', placeholder: 'Feb 14–16, 2026' },
      { key: 'rsvp_deadline', label: 'RSVP deadline', placeholder: 'Jan 15, 2026' },
    ],
    nextStatus: 'rsvp_requested',
  },
  {
    id: 'rsvp_reminder',
    title: 'RSVP Reminder',
    description: 'Warm nudge for guests who haven\'t responded yet.',
    category: 'rsvp',
    icon: Notifications,
    body:
`Namaste {{guest_first_name}}! A small reminder 🙏

{{couple_names}} are still hoping to hear from you for the wedding celebrations from {{wedding_date}}.

Please RSVP here: {{rsvp_link}}

Even a "maybe" helps us plan rooms and meals. Dhanyavaad!`,
    variables: [
      { key: 'guest_first_name', label: 'Guest first name', perGuest: true },
      { key: 'rsvp_link', label: 'RSVP link', perGuest: true },
      { key: 'couple_names', label: 'Couple names', placeholder: 'Priya & Rahul' },
      { key: 'wedding_date', label: 'Wedding dates', placeholder: 'Feb 14–16, 2026' },
    ],
    nextStatus: 'rsvp_requested',
  },
  {
    id: 'travel_collect',
    title: 'Travel & Stay Info',
    description: 'Collect flight + hotel details so you can arrange airport pickup and rooms.',
    category: 'logistics',
    icon: Flight,
    body:
`Namaste {{guest_first_name}}!

To help coordinate airport pickup, hotel rooms, and shuttle service for {{couple_names}}'s wedding, please share your travel plans here:

{{travel_link}}

Takes about 2 minutes. Dhanyavaad 🙏`,
    variables: [
      { key: 'guest_first_name', label: 'Guest first name', perGuest: true },
      { key: 'travel_link', label: 'Travel form link', perGuest: true },
      { key: 'couple_names', label: 'Couple names', placeholder: 'Priya & Rahul' },
    ],
    nextStatus: 'travel_collected',
  },
  {
    id: 'event_reminder',
    title: 'Ceremony Reminder',
    description: 'Day-before or hours-before heads-up for a specific function.',
    category: 'reminder',
    icon: Mail,
    body:
`Namaste {{guest_first_name}}!

Quick reminder — {{event_name}} is {{event_when}} at {{venue}}.

Dress code: {{dress_code}}
For anything urgent, please reply here.

See you there 💃🕺`,
    variables: [
      { key: 'guest_first_name', label: 'Guest first name', perGuest: true },
      { key: 'event_name', label: 'Ceremony', placeholder: 'Sangeet' },
      { key: 'event_when', label: 'When', placeholder: 'tomorrow at 7 PM' },
      { key: 'venue', label: 'Venue', placeholder: 'Rambagh Palace' },
      { key: 'dress_code', label: 'Dress code', placeholder: 'Indian festive' },
    ],
  },
  {
    id: 'thank_you',
    title: 'Dhanyavaad',
    description: 'Post-wedding thanks. Optional — couples love this one.',
    category: 'followup',
    icon: FavoriteBorder,
    body:
`Namaste {{guest_first_name}} ❤️

Thank you for blessing {{couple_names}} with your presence. Your love and aashirwaad meant the world.

Photos and videos from the ceremonies will follow soon — keep an eye out!`,
    variables: [
      { key: 'guest_first_name', label: 'Guest first name', perGuest: true },
      { key: 'couple_names', label: 'Couple names', placeholder: 'Priya & Rahul' },
    ],
  },
];

export function getInviteTemplate(id: string): InviteTemplate | undefined {
  return INVITE_TEMPLATES.find((t) => t.id === id);
}

export const CATEGORY_LABELS: Record<InviteTemplateCategory, string> = {
  announce: 'Announcements',
  rsvp: 'RSVP',
  reminder: 'Reminders',
  logistics: 'Logistics',
  followup: 'Follow-up',
};

/**
 * Render a template body with per-guest + shared variables substituted.
 * Missing variables are left as `{{key}}` so they show up in preview as
 * placeholders rather than disappearing silently.
 */
export function renderTemplate(body: string, vars: Record<string, string>): string {
  return body.replace(/\{\{([a-z_]+)\}\}/g, (_, key) => {
    const v = vars[key];
    return v && v.trim() ? v : `{{${key}}}`;
  });
}
