export type PricingTierId = 'free' | 'paid' | 'white_glove';

export interface PricingTier {
  id: PricingTierId;
  name: string;
  price: string;
  priceSuffix: string;
  description: string;
  inheritsFrom?: string;
  features: string[];
  buttonText: string;
  buttonHref?: string;
  highlight: boolean;
}

export const PRICING_TIERS: PricingTier[] = [
  {
    id: 'free',
    name: 'PHERA FREE',
    price: '$0',
    priceSuffix: '',
    description: '',
    features: [
      'Custom wedding website',
      'Guest list management',
      'Gather RSVPs & responses',
      'Guest-level event access control',
      'Custom RSVP questions',
      'Task manager',
      'Multi-user collaboration',
    ],
    buttonText: 'Start free',
    buttonHref: '/auth/signup',
    highlight: false,
  },
  {
    id: 'paid',
    name: 'PHERA BASE',
    price: '$349',
    priceSuffix: '',
    description: '',
    inheritsFrom: 'Free',
    features: [
      'Everything in Free, plus:',
      'WhatsApp Concierge (Inbound & Outbound)',
      'Room assignments',
      'Transportation management',
      'WhatsApp bot for the couple',
      'Vendor management',
      // 'AI-assisted website design',
    ],
    buttonText: 'Get Base — $349',
    highlight: true,
  },
  {
    id: 'white_glove',
    name: 'PHERA WHITE GLOVE',
    price: '$599',
    priceSuffix: '',
    description:
      'We handle your guests for you. 1-on-1 access to our team for your entire wedding experience.',
    inheritsFrom: 'Base',
    features: [
      'Everything in Base, plus:',
      '1-on-1 onboarding calls',
      'Dedicated wedding coordinator',
      'We manage guest ops for you',
      'Priority support',
    ],
    buttonText: 'Get White Glove — $599',
    highlight: false,
  },
];

export const PLANNER_TIER = {
  id: 'planner' as const,
  name: 'PHERA FOR PLANNERS',
  price: '$249',
  priceSuffix: '/wedding',
  description:
    'For wedding planners managing multiple clients. Pay per wedding. Card on file. Confirm and charge for each new wedding.',
  features: [
    'Unlimited weddings under one account',
    'Everything in Phera Base for each wedding',
    'Card saved after first wedding, one-click for the rest',
    'Resell to your couples at your own rate',
  ],
  buttonText: 'Start as a Planner',
};
