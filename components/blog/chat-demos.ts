/**
 * Scripted Planner conversations used by <ChatDemo /> in blog posts.
 *
 * These are REPLAYS, not live sessions — the blog is public and the agent
 * requires an authenticated wedding. Every transcript here must stay honest
 * about what the Planner actually does:
 *   - tool names are real (see lib/agent/tools/*)
 *   - `broadcast_message` DRAFTS only; a human taps send
 *   - gated tools (assign_guests_to_room, create_guest_whatsapp_group) show
 *     a Confirm card, because that is what the product does
 * If the agent's behaviour changes, change these too.
 */

export type DemoTurn =
  | { kind: 'user'; text: string }
  | { kind: 'assistant'; text: string; tools?: string[] }
  | {
      kind: 'confirm';
      text: string;
      tools?: string[];
      confirmLabel?: string;
      declineLabel?: string;
      /** What the card collapses to once the reader taps Confirm. */
      resolved: string;
    }
  | { kind: 'panel'; title: string; rows: string[] };

export interface ChatDemo {
  /** Caption above the chat surface. */
  caption: string;
  turns: DemoTurn[];
}

export const CHAT_DEMOS: Record<string, ChatDemo> = {
  /* ── 1. Onboarding: fuzzy human input, no invented facts ─────────────── */
  onboarding: {
    caption: 'First message — no account yet',
    turns: [
      {
        kind: 'user',
        text: "Hi! We're Anaya and Vikram — thinking the second weekend of March 2027, in Goa near Anjuna, but no venue yet.",
      },
      {
        kind: 'assistant',
        tools: ['update_wedding_details', 'search_knowledge'],
        text: "Got it — Anaya & Vikram, Goa, Fri 12–Sun 14 Mar 2027. Venue left as TBD. March in Goa is dry and 32°C, so a good pick. Want me to draft the three-day schedule?",
      },
      { kind: 'user', text: 'Yes please. Standard sangeet, haldi, wedding.' },
      {
        kind: 'assistant',
        tools: ['create_schedule_day', 'create_event', 'create_event', 'create_event'],
        text: 'Done. Sangeet Fri evening, Haldi Sat morning, Wedding Sun. All editable.',
      },
      {
        kind: 'panel',
        title: 'Schedule · 3 events',
        rows: [
          'Fri 12 Mar · 7:00 PM · Sangeet',
          'Sat 13 Mar · 10:00 AM · Haldi',
          'Sun 14 Mar · 5:00 PM · Wedding Ceremony',
        ],
      },
    ],
  },

  /* ── 2. The messy real-world change: one guest → room overflow ───────── */
  rooms: {
    caption: 'Six weeks out — a guest count changes',
    turns: [
      {
        kind: 'user',
        text: "Anaya's masi just told me she's bringing her two sons after all.",
      },
      {
        kind: 'assistant',
        tools: ['list_guests', 'update_guest', 'list_rooms'],
        text: "Updated Sunita Desai to 4 attending. That pushes the Taj block to 102 beds against 100 booked — two guests have nowhere to sleep.",
      },
      { kind: 'user', text: 'Ugh. Can you sort it?' },
      {
        kind: 'confirm',
        tools: ['assign_guests_to_room'],
        text: "I can move the two Sharma cousins to the twin on floor 3 and put the masi's family together in 214. That reshuffles 4 guests across 2 rooms.",
        confirmLabel: 'Confirm',
        declineLabel: 'Decline',
        resolved: 'Confirmed — 4 guests moved. Everyone has a bed. You can undo this.',
      },
    ],
  },

  /* ── 3. Honest WhatsApp story: the agent drafts, the human sends ─────── */
  broadcast: {
    caption: 'Chasing the guests who never replied',
    turns: [
      { kind: 'user', text: "Who still hasn't RSVP'd?" },
      {
        kind: 'assistant',
        tools: ['get_rsvp_summary', 'list_guests'],
        text: '41 of 187 guests are still silent. 28 of them are on the groom’s side.',
      },
      { kind: 'user', text: 'Nudge them on WhatsApp.' },
      {
        kind: 'assistant',
        tools: ['broadcast_message'],
        text: "I've drafted this to the 41 who haven't replied. Read it, edit it, and send it yourself when you're happy — I don't message your guests without you.",
      },
      {
        kind: 'panel',
        title: 'Draft · 41 recipients · not sent',
        rows: [
          '“Hi {{name}}! Anaya & Vikram here 💐 We’re finalising',
          'headcount for Goa in March — could you let us know if',
          'you can make it? Takes 10 seconds: {{rsvp_link}}”',
          '',
          '→ You tap send. Never us.',
        ],
      },
    ],
  },

  /* ── 4. Vendor sourcing from the curated directory ───────────────────── */
  vendors: {
    caption: 'Finding a photographer who has actually shot in Goa',
    turns: [
      {
        kind: 'user',
        text: 'We need a photographer. Budget is around ₹2L, and we want candid, not posed.',
      },
      {
        kind: 'assistant',
        tools: ['search_vendor_directory'],
        text: 'Three in the Goa directory match candid work in that range. Tap one to add them to your vendor list.',
      },
      {
        // Illustrative names — the live directory returns real listings.
        kind: 'panel',
        title: 'Photographers · Goa',
        rows: [
          'Saltwater Studio — candid, ₹1.8–2.5L',
          'Third Light Collective — documentary, ₹1.5–2L',
          'Ochre & Salt — candid, ₹1.6–2.2L',
        ],
      },
      { kind: 'user', text: "What if we'd wanted someone in Tuscany?" },
      {
        kind: 'assistant',
        tools: ['submit_request'],
        text: "Tuscany isn't in our directory, so I won't pretend to have options. I've passed it to the Phera team — a human will come back to you with real names.",
      },
    ],
  },
};
