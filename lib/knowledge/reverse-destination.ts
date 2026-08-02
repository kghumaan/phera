/**
 * Reverse-destination cultural guide for non-Indian guests attending Indian weddings.
 * The most defensible feature — no competitor does this.
 */

export interface CulturalGuideSection {
  title: string;
  content: string;
  items?: Array<{ label: string; detail: string }>;
}

export const REVERSE_DESTINATION_GUIDE = {
  before_trip: {
    visa: {
      label: 'Visa',
      detail: 'US/UK/Canadian/Australian citizens need an Indian e-Tourist Visa. Apply at indianvisaonline.gov.in at least 4 weeks before travel. Passport must be valid for 6+ months from arrival date.',
    },
    vaccinations: {
      label: 'Vaccinations',
      detail: 'CDC recommends Hepatitis A and B, Typhoid. Consult your doctor 6-8 weeks before travel. Carry basic medications — anti-diarrheal, antihistamines, and any prescriptions.',
    },
    packing: {
      label: 'Packing',
      detail: 'Pack for 3-5 events with different dress codes. Comfortable shoes are essential. Bring sunscreen, mosquito repellent, antacids, and hand sanitizer. Layers for AC indoors vs heat outdoors.',
    },
    flights: {
      label: 'Flights',
      detail: 'Book 3-4 months ahead during Oct-Mar wedding season. Expect 14-20 hour journey from US/UK. Direct flights to Delhi, Mumbai, Bangalore. Other cities may require domestic connections.',
    },
  },

  dress_code: {
    mehendi: {
      label: 'Mehendi / Haldi',
      detail: 'Casual/festive. For Haldi, wear WHITE or yellow — you WILL get covered in turmeric paste. Bring change of clothes. For Mehendi, bright colors welcome but avoid clothes you love as turmeric stains permanently.',
    },
    sangeet: {
      label: 'Sangeet',
      detail: 'Party wear. Think cocktail attire with Indian flair. Jewel tones, sequins, and embroidery are welcome. This is the dance party — wear something you can move in.',
    },
    ceremony: {
      label: 'Wedding Ceremony',
      detail: 'Formal traditional or jewel-toned formal. NO black (associated with funerals), NO white (associated with mourning), NO red (reserved for the bride). Saree or lehenga available for rent/purchase.',
    },
    reception: {
      label: 'Reception',
      detail: 'Glamorous. Evening gown or formal suit. Most Western-friendly dress code. Indian or Western attire both welcome.',
    },
  },

  etiquette: {
    shoes: {
      label: 'Shoes',
      detail: 'Remove shoes before entering ceremony area or sacred spaces. Wear easy on-off shoes.',
    },
    greetings: {
      label: 'Greetings',
      detail: 'Namaste (hands together, slight bow) or handshake are appropriate. Avoid hugging, especially with elders, unless they initiate.',
    },
    gifts: {
      label: 'Gifts',
      detail: 'Cash gifts in ODD amounts ($51, $101, $201 — even amounts are associated with funerals). Place in a decorative envelope. Gift registries are less common in Indian weddings.',
    },
    food: {
      label: 'Food',
      detail: 'Eat with your right hand if eating by hand. It\'s polite to try a bit of everything. Ask about spice levels — "mild" in India can still be quite spicy for Western palates.',
    },
    photos: {
      label: 'Photos',
      detail: 'Ask before photographing during religious ceremonies. Candid photos at Mehendi and Sangeet are welcome.',
    },
    time: {
      label: 'Timing',
      detail: 'Indian Standard Time is famously flexible. Events rarely start at the published time. Budget 30-60 minutes extra and don\'t stress about it.',
    },
  },

  on_ground: {
    sim_card: {
      label: 'SIM Card',
      detail: 'Get a Jio or Airtel tourist SIM at the airport (requires passport + visa copy). Takes about 30 min for activation. Or use an eSIM service like Airalo or Holafly — set up before landing.',
    },
    transport: {
      label: 'Transportation',
      detail: 'Uber and Ola work in most major cities (NOT Goa — local taxi union monopoly). Always use meter/app-based rides, never negotiate with airport taxi touts.',
    },
    currency: {
      label: 'Currency',
      detail: 'Indian Rupee (INR). ATMs widely available. UPI is the dominant payment method but tourists typically cannot use it — carry cash for small purchases. Major hotels and restaurants accept cards.',
    },
    water: {
      label: 'Water & Food Safety',
      detail: 'Drink only bottled/filtered water. Avoid ice outside major hotels and restaurants. Stick to freshly cooked hot food.',
    },
    emergency: {
      label: 'Emergency Numbers',
      detail: 'Tourist helpline: 1363. Police: 100. Ambulance: 108. Fire: 101.',
    },
  },

  reassurance: 'Indian families are incredibly welcoming to international guests. Don\'t worry about cultural mistakes — your effort to participate will be deeply appreciated. Someone will likely help with your outfit, explain every ritual, and make sure you are well-fed. Just bring an open mind and a sense of adventure.',
};

/**
 * Detect if a phone number belongs to an international (non-Indian) guest.
 */
export function detectInternationalGuest(phoneNumber: string): boolean {
  const cleaned = phoneNumber.replace(/[^0-9+]/g, '');

  // Indian numbers: +91 or starts with 91 (10 digits after code)
  if (cleaned.startsWith('+91') || cleaned.startsWith('91')) {
    const afterCode = cleaned.startsWith('+91') ? cleaned.substring(3) : cleaned.substring(2);
    // Indian mobile numbers are 10 digits
    if (afterCode.length === 10 && /^[6-9]/.test(afterCode)) {
      return false; // Indian number
    }
  }

  // Bare 10-digit Indian number (no country code)
  if (cleaned.length === 10 && /^[6-9]/.test(cleaned)) {
    return false; // Likely Indian
  }

  return true; // Non-Indian
}

/**
 * Generate a personalized cultural guide (returns structured data for PDF generation).
 */
export function generateCulturalGuideContent(weddingData: {
  couple_names: string;
  destination: string;
  guest_name: string;
  events: Array<{ name: string; date: string; venue: string; dress_code?: string }>;
}): CulturalGuideSection[] {
  const { couple_names, destination, guest_name, events } = weddingData;
  const guide = REVERSE_DESTINATION_GUIDE;

  const sections: CulturalGuideSection[] = [
    {
      title: `Welcome, ${guest_name}!`,
      content: `You're invited to ${couple_names}'s wedding in ${destination}. This guide will help you prepare for an unforgettable celebration.`,
    },
    {
      title: 'Before You Travel',
      content: 'Essential preparations for your trip to India.',
      items: Object.values(guide.before_trip),
    },
    {
      title: 'What to Wear',
      content: 'Indian weddings have different dress codes for each event. Here\'s your guide:',
      items: events.map((event) => ({
        label: event.name,
        detail: getEventDressCode(event.name) + (event.dress_code ? ` Couple\'s note: ${event.dress_code}` : ''),
      })),
    },
    {
      title: 'Cultural Etiquette',
      content: 'A few tips to help you feel comfortable and show respect.',
      items: Object.values(guide.etiquette),
    },
    {
      title: 'On the Ground',
      content: 'Practical tips for your stay.',
      items: Object.values(guide.on_ground),
    },
    {
      title: 'You\'ll Be Great!',
      content: guide.reassurance,
    },
  ];

  return sections;
}

function getEventDressCode(eventName: string): string {
  const guide = REVERSE_DESTINATION_GUIDE.dress_code;
  const name = eventName.toLowerCase();

  if (name.includes('mehendi') || name.includes('haldi') || name.includes('mehndi')) {
    return guide.mehendi.detail;
  }
  if (name.includes('sangeet')) {
    return guide.sangeet.detail;
  }
  if (name.includes('ceremony') || name.includes('wedding') || name.includes('shaadi')) {
    return guide.ceremony.detail;
  }
  if (name.includes('reception')) {
    return guide.reception.detail;
  }
  return 'Smart festive attire. Bright colors welcome!';
}
