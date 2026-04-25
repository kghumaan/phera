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
    description: 'First-touch announcement. Build anticipation before the formal RSVP ask.',
    category: 'announce',
    icon: CardGiftcard,
    body:
`Hi {{guest_first_name}} 💫

{{couple_names}} are tying the knot on {{wedding_date}} in {{wedding_city}}.

Save the date — formal invite + RSVP details to follow soon!

Can't wait to celebrate with you.`,
    variables: [
      { key: 'guest_first_name', label: 'Guest first name', perGuest: true },
      { key: 'couple_names', label: 'Couple names', placeholder: 'Priya & Rahul' },
      { key: 'wedding_date', label: 'Wedding date', placeholder: 'Feb 14, 2026' },
      { key: 'wedding_city', label: 'City', placeholder: 'Jaipur' },
    ],
    nextStatus: 'save_the_date_sent',
  },
  {
    id: 'rsvp_request',
    title: 'RSVP Request',
    description: 'Formal ask — attach the RSVP link for one-tap response.',
    category: 'rsvp',
    icon: EventAvailable,
    body:
`Hi {{guest_first_name}}!

{{couple_names}} would love to have you at their wedding on {{wedding_date}}.

Please RSVP here: {{rsvp_link}}

Let us know by {{rsvp_deadline}}. Any questions, just reply here 💌`,
    variables: [
      { key: 'guest_first_name', label: 'Guest first name', perGuest: true },
      { key: 'rsvp_link', label: 'RSVP link', perGuest: true },
      { key: 'couple_names', label: 'Couple names', placeholder: 'Priya & Rahul' },
      { key: 'wedding_date', label: 'Wedding date', placeholder: 'Feb 14, 2026' },
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
`Hi {{guest_first_name}}! Just a quick reminder 🙂

{{couple_names}} are still hoping to hear from you about {{wedding_date}}.

Tap to RSVP: {{rsvp_link}}

Even a "maybe" helps us plan. Thanks!`,
    variables: [
      { key: 'guest_first_name', label: 'Guest first name', perGuest: true },
      { key: 'rsvp_link', label: 'RSVP link', perGuest: true },
      { key: 'couple_names', label: 'Couple names', placeholder: 'Priya & Rahul' },
      { key: 'wedding_date', label: 'Wedding date', placeholder: 'Feb 14, 2026' },
    ],
    nextStatus: 'rsvp_requested',
  },
  {
    id: 'travel_collect',
    title: 'Travel & Stay Info',
    description: 'Collect flight + hotel details so you can arrange pickup + rooms.',
    category: 'logistics',
    icon: Flight,
    body:
`Hi {{guest_first_name}}!

To help coordinate airport pickup + hotel stay for {{couple_names}}'s wedding, please share your travel plans here:

{{travel_link}}

Takes ~2 minutes. Thank you 🙏`,
    variables: [
      { key: 'guest_first_name', label: 'Guest first name', perGuest: true },
      { key: 'travel_link', label: 'Travel form link', perGuest: true },
      { key: 'couple_names', label: 'Couple names', placeholder: 'Priya & Rahul' },
    ],
    nextStatus: 'travel_collected',
  },
  {
    id: 'event_reminder',
    title: 'Event Reminder',
    description: 'Day-before or hours-before heads-up with venue + timing.',
    category: 'reminder',
    icon: Mail,
    body:
`Hi {{guest_first_name}}!

Quick reminder — {{event_name}} is {{event_when}} at {{venue}}.

Dress code: {{dress_code}}
Anything urgent, reply here.

See you there 💃🕺`,
    variables: [
      { key: 'guest_first_name', label: 'Guest first name', perGuest: true },
      { key: 'event_name', label: 'Event name', placeholder: 'Sangeet' },
      { key: 'event_when', label: 'Event time', placeholder: 'tomorrow at 7 PM' },
      { key: 'venue', label: 'Venue', placeholder: 'Rambagh Palace' },
      { key: 'dress_code', label: 'Dress code', placeholder: 'Indian festive' },
    ],
  },
  {
    id: 'thank_you',
    title: 'Thank You',
    description: 'Post-wedding thanks. Optional — couples love this one.',
    category: 'followup',
    icon: FavoriteBorder,
    body:
`Hi {{guest_first_name}} ❤️

Thank you for celebrating with {{couple_names}}. It meant the world to have you there.

Photos coming soon — keep an eye out!`,
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
