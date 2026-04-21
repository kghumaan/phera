/**
 * Guest behavior personas for WhatsApp simulation.
 */

export interface GuestPersona {
  name: string;
  type: string;
  responseDelay: number; // hours
  respondProbability: number; // 0-1
  messages: string[];
}

export const GUEST_PERSONAS: GuestPersona[] = [
  {
    name: 'Eager Responder',
    type: 'eager',
    responseDelay: 0.5,
    respondProbability: 1.0,
    messages: [
      'Yes! Can\'t wait! 🎉',
      'I\'ll be there!',
      'Count us in — 3 people!',
      'We\'re flying AI302 arriving Dec 13',
      'Staying at Taj Lake Palace',
      'I\'m vegetarian',
    ],
  },
  {
    name: 'Busy Professional',
    type: 'busy',
    responseDelay: 48,
    respondProbability: 0.75,
    messages: [
      'Sorry for the late reply! Yes, attending',
      'Will confirm travel details later',
      '2 people',
    ],
  },
  {
    name: 'Tech-Averse Uncle',
    type: 'tech_averse',
    responseDelay: 24,
    respondProbability: 0.6,
    messages: [
      'haan beta aa rahe hain',
      'ok',
      '?',
    ],
  },
  {
    name: 'Family Liaison',
    type: 'liaison',
    responseDelay: 4,
    respondProbability: 0.9,
    messages: [
      'Auntie Meena and Uncle Raj are both coming, she is vegetarian, they land Thursday 3pm',
      'Chacha Suresh says he can\'t make it but Mami will come with 2 kids',
      'All 8 of us are confirmed for everything',
    ],
  },
  {
    name: 'International Guest',
    type: 'international',
    responseDelay: 12,
    respondProbability: 0.8,
    messages: [
      'Yes! What should I wear to the Mehendi?',
      'Do I need a visa? Flying from San Francisco',
      'Is there vegetarian food available?',
      'What\'s the dress code for the ceremony?',
    ],
  },
  {
    name: 'Ghost',
    type: 'ghost',
    responseDelay: Infinity,
    respondProbability: 0,
    messages: [],
  },
  {
    name: 'Opt-Out',
    type: 'opt_out',
    responseDelay: 1,
    respondProbability: 1.0,
    messages: ['STOP'],
  },
];

export function getPersonaByType(type: string): GuestPersona | undefined {
  return GUEST_PERSONAS.find((p) => p.type === type);
}
