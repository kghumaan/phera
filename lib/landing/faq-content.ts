/**
 * Single source of truth for the landing FAQ — consumed by both the visible
 * accordion (components/landing/FAQSection.tsx) and the FAQPage JSON-LD schema
 * (app/HomePageClient.tsx) so the two never drift.
 */
export interface FaqItem {
  q: string;
  a: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    q: 'Can I really run my wedding just by talking to the planner?',
    a: "Yes - chat or voice. Tell it 'my brother lands Tuesday' and it adds him to the shuttle, blocks a room, and updates your guest list. Anything you'd do in a spreadsheet or a WhatsApp group, you just say out loud. Prefer typing? Chat works exactly the same.",
  },
  {
    q: "What if we're just starting - or only weeks away?",
    a: "The planner meets you wherever you are. Just engaged? It helps lock dates and shape the plan. Venue already booked? It jumps straight to the guest list and logistics. Down to the final weeks? It spots the gaps - unconfirmed shuttles, missing dress codes, vendors gone quiet - and chases them. No reset needed; it reads your stage and starts there.",
  },
  {
    q: 'Is there really a free tier?',
    a: "Yes - really free. Beautiful wedding site, guest list, basic RSVPs without paying us a cent. Base ($349) is when you want the heavier lifting: WhatsApp outreach, concierge, travel, rooms.",
  },
  {
    q: 'How does the guest coordination work?',
    a: "Once you're on Base, the chasing comes off your plate. We WhatsApp every guest on your behalf - save-the-dates, RSVP nudges, travel forms, room assignments, shuttle pickups - on a timeline we tuned by living through it.",
  },
  {
    q: 'Do my guests need to download an app?',
    a: "Nope - that was non-negotiable. Everyone has WhatsApp open already, and your wedding site works on any phone or laptop. No new apps for your aunty to figure out.",
  },
  {
    q: "What if a guest doesn't reply on WhatsApp?",
    a: "We follow up a few times - gently, spaced out. If they're still silent, we hand them off to you with their contact info so a family member can call. Some cousins only respond after a phone call.",
  },
  {
    q: 'How does the Concierge know about my wedding?',
    a: "We feed it everything in your dashboard: schedule, dress codes, venue addresses, plus a Knowledge Bank we auto-build for the city - weather, restaurants, cultural context. Anything wrong, you fix in a click.",
  },
  {
    q: 'Do I still need a day-of coordinator?',
    a: "Phera handles the months leading up to the wedding. We don't cue the DJ or fix your dupatta. For day-of, most couples pair us with a local coordinator. White Glove gets you a dedicated person on our side as well.",
  },
  {
    q: "Is my guests' data safe?",
    a: "Yes. Every guest gives explicit consent before we message them, we're DPDPA-2023 compliant, and we delete everything 90 days after the wedding. Guests can pull their data anytime.",
  },
];
