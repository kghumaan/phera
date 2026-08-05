/**
 * Page-specific suggested questions for the docked sidebar Planner
 * (components/admin/AssistantSidebar.tsx). Keyed by the last URL segment of
 * an admin page (e.g. /admin/[slug]/guest-list → 'guest-list').
 *
 * Unlike lib/agent/starters.ts (ranked by wedding-completeness/urgency, used
 * on the full Planner page), these are static and about the page itself —
 * "what can I do here," not "what should I do next." The sidebar always
 * shows these instead of the ranked starters when the couple is on a page
 * that has a curated set — the point is relevance to what's on screen right
 * now, not the wedding overall.
 */
export const PAGE_QUESTIONS: Record<string, string[]> = {
  'guest-list': [
    'How do I tag guests by side or family?',
    'How do I add plus-ones?',
    'Can I import my guest list from a spreadsheet?',
    'How do households work?',
  ],
  'guest-responses': [
    "Who hasn't RSVP'd yet?",
    'How do I set an RSVP deadline?',
    'Can I export my RSVP list?',
    'How do I nudge guests who haven’t responded?',
  ],
  'room-assignments': [
    'Can you auto-assign rooms for me?',
    'How do I set room capacity?',
    'How do I keep families in the same room block?',
    'What happens if a room is over capacity?',
  ],
  schedule: [
    'How do I add a new event?',
    'Can I reorder my schedule?',
    'How do I set dress codes per event?',
    'How does the day-by-day timeline work?',
  ],
  travel: [
    'How do I add travel info for guests?',
    'How does shuttle sign-up work?',
    'Can guests submit their flight details?',
    'How do I add hotel recommendations?',
  ],
  transportation: [
    'How do I collect guest flight info?',
    'Can you assign guests to shuttles automatically?',
    'How do I set shuttle capacity?',
    'How do guests see their pickup details?',
  ],
  'rsvp-form': [
    'How do I add a custom RSVP question?',
    'Can I collect dietary preferences?',
    'How do I make a question required?',
    'How does the plus-one question work?',
  ],
  faq: [
    'How do I add a guest FAQ?',
    'Can I reorder my FAQs?',
    'What FAQs should I include?',
    'Are FAQs visible to all guests?',
  ],
  registry: [
    'How do I set up cash gifts?',
    'Can I link an external registry?',
    'How do guests send a gift?',
    'How do I see who’s contributed?',
  ],
  'where-to-shop': [
    'How do I add outfit ideas for guests?',
    'Can I recommend specific vendors here?',
    'How do guests see shopping suggestions?',
  ],
  'event-access': [
    "What's the difference between a family and individual PIN?",
    'How does a bypass PIN work?',
    'How do I customize the PIN entry screen?',
    'Can I regenerate a guest’s PIN?',
  ],
  'whatsapp-bot': [
    'How do I send a broadcast to all guests?',
    'How does guest opt-in work?',
    'Can guests ask the WhatsApp bot questions directly?',
    'How do I see message history?',
  ],
  'vendor-management': [
    'How do I add a vendor?',
    'How does the WhatsApp group coordination work?',
    'Can you help me find vendors in my city?',
  ],
  'vendor-marketplace': [
    'How do I browse vendors?',
    'Can you recommend vendors for my wedding?',
    'How do I save a vendor for later?',
  ],
  'task-manager': [
    'How do I add a task?',
    'Can I assign a task to a collaborator?',
    'How do I mark a task done?',
  ],
  'knowledge-bank': [
    'What is the knowledge bank for?',
    'How do I add a knowledge entry?',
    'Does this help the WhatsApp concierge answer guest questions?',
  ],
  details: [
    'How do I add our love story?',
    'Can I add more photos?',
    'What details do guests actually see?',
  ],
  'look-and-feel': [
    'How do I change my theme colors?',
    'Can I pick a different background?',
    'How do I change the font?',
  ],
  collaborators: [
    'How do I invite a parent or planner?',
    'What can collaborators see or edit?',
    'How do I remove a collaborator?',
  ],
  settings: [
    'How do I publish my website?',
    'Can I change my wedding URL?',
    'How do I preview before publishing?',
  ],
};
