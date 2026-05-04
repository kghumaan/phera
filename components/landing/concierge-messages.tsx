'use client';

/**
 * Shared scripted conversation used by:
 *   - HomePageClient ConciergeShowcase (the dark "24/7 concierge" panel)
 *   - FeatureStepper Step 03 mock (WhatsApp bot)
 *
 * Single source so both surfaces play identical content.
 */

import type { Message } from '@/components/ui/WhatsAppConcierge';

export const CONCIERGE_MESSAGES: Message[] = [
  {
    type: 'guest',
    text: 'What should I wear to the Sangeet tomorrow?',
    time: '10:42 AM',
  },
  {
    type: 'bot',
    text: (
      <>
        Sangeet&apos;s festive - jewel tones, lehengas or anarkalis for women, kurtas in deep colors for men. Skip white &amp; black. Indoor venue, heels are fine 💃
      </>
    ),
    time: '10:42 AM',
    hasCheck: true,
  },
  {
    type: 'guest',
    text: 'Perfect. My flight lands at 11pm - is there a pickup?',
    time: '10:43 AM',
  },
  {
    type: 'bot',
    text: (
      <>
        You&apos;re on the <strong>11:30 PM</strong> shuttle to the <strong>Grand Hyatt</strong>. Driver Rajesh (+91 98xxx 12345) will be at Arrivals Gate 4 with a Phera sign ✈️
      </>
    ),
    time: '10:43 AM',
    hasCheck: true,
  },
  {
    type: 'guest',
    text: 'Free afternoon Friday - anything to do nearby?',
    time: '11:05 AM',
  },
  {
    type: 'bot',
    text: (
      <>
        It&apos;s 28°C and sunny ☀️ <strong>Hauz Khas Village</strong> is 10 min away (cafés, boutiques) or <strong>Lodhi Garden</strong> for a quiet walk. Want me to book a table somewhere?
      </>
    ),
    time: '11:06 AM',
    hasCheck: true,
  },
];
