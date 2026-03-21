/**
 * Destination-specific knowledge for top 6 Indian wedding destinations.
 * Pre-populates Concierge with practical info guests actually need.
 */

export interface DestinationInfo {
  name: string;
  country: string;
  visa?: string;
  currency: string;
  transport: string;
  connectivity: string;
  food?: string;
  weather: string;
  noise_curfew?: string;
  legal?: string;
  airports?: string;
  tips?: string;
}

export const DESTINATION_KNOWLEDGE: Record<string, DestinationInfo> = {
  thailand: {
    name: 'Thailand',
    country: 'Thailand',
    visa: '60-day visa-free for Indian passport holders. TDAC (Thailand Digital Arrival Card) required 72 hours before arrival at tdac.immigration.go.th.',
    currency: 'Thai Baht (THB). INR exchangeable at most places. Airport exchange rates are 3-5% worse than SuperRich city center offices.',
    transport: 'Grab works everywhere except inside airport terminals. Pre-arranged hotel transfers recommended for groups. Tuk-tuks are fun but always negotiate fare first.',
    connectivity: 'Tourist SIM approximately ₹600 INR for 8 days with good data. eSIM available via Airalo or Holafly.',
    food: 'Fish sauce is in almost everything. True vegetarian food is hard to find outside Indian restaurants. Inform your resort/venue at least 1 week ahead for dietary needs.',
    weather: 'Wedding season: November to March only. Monsoon season May to October — avoid.',
    noise_curfew: 'Most venues enforce 10:00-10:30 PM noise curfew.',
  },

  bali: {
    name: 'Bali',
    country: 'Indonesia',
    visa: 'Visa on Arrival (VoA): IDR 500,000 (~$30 USD) + Bali Tourism Levy IDR 150,000 (~$10 USD). e-VoA available at evisa.imigrasi.go.id — apply 48 hours before arrival.',
    currency: 'Indonesian Rupiah (IDR). IMPORTANT: Most money changers do NOT accept Indian Rupees. Convert to USD in India first, then exchange USD to IDR in Bali.',
    transport: 'Grab and Gojek work but Seminyak/Kuta traffic can be terrible. Pre-arranged transfers essential for groups. Scooter rental popular but risky without experience.',
    connectivity: 'Tourist SIM approximately ₹1,100 INR. eSIM available.',
    weather: 'Dry season (best): April to October. May to September is peak. Rainy season November to March — afternoon showers are common.',
  },

  sri_lanka: {
    name: 'Sri Lanka',
    country: 'Sri Lanka',
    visa: 'Free ETA (Electronic Travel Authorization) for Indian passport holders via eta.gov.lk. Processing takes 24-72 hours. 30-day tourist visa.',
    currency: 'Sri Lankan Rupee (LKR). Indian Rupee exchange available at major banks and exchange offices.',
    transport: 'Colombo airport to southern wedding venues is a 2-3 hour drive. Uber works in Colombo. Tuk-tuks available everywhere else — use PickMe app.',
    connectivity: 'Tourist SIM approximately ₹250 INR for 15GB with calls. Best value destination for connectivity.',
    food: 'Sri Lankan cuisine closely resembles South Indian food. Smoothest culinary transition for Indian guests. Coconut-heavy — flag coconut allergies.',
    weather: 'West coast: December to March. East coast: May to September. Hill country: January to April.',
  },

  goa: {
    name: 'Goa',
    country: 'India',
    currency: 'Indian Rupee (INR). UPI widely accepted. ATMs available but can run out of cash during peak season.',
    transport: 'CRITICAL: No Ola or Uber in Goa. Local taxi union monopoly. GoaMiles app exists but is inconsistent. Budget dedicated guest transport as mandatory for wedding logistics.',
    connectivity: 'Good 4G/5G coverage. Most hotels have WiFi. Jio and Airtel work well.',
    weather: 'Wedding season: November to February. Monsoon: June to September — avoid. Humidity can be high even in season.',
    airports: 'Two airports: Mopa (GOX, newer, north Goa) and Dabolim (GOI, south Goa). Check which is closer to your venue.',
    legal: 'Marriage registration in Goa requires a 15-day Edital Period under the Goa civil code (Portuguese-origin law). Plan ahead.',
  },

  udaipur: {
    name: 'Udaipur',
    country: 'India',
    currency: 'Indian Rupee (INR). UPI widely accepted. Carry some cash for old city markets.',
    transport: 'Airport to venues: 20-40 min. Narrow old city roads make large vehicles tricky. Auto-rickshaws are the best way to navigate the old city.',
    connectivity: 'Heritage palaces have weak indoor signals due to thick stone walls. Ask venue about WiFi. Consider a portable WiFi device for the group.',
    weather: 'Season: October to March. November to February is peak. Morning fog in December-January can delay Delhi flights.',
    airports: 'Only about 20 daily flights connecting 9 Indian cities. No international flights. Many NRI guests fly to Ahmedabad (260 km, 4.5-hour drive) or Jaipur (400 km, 5.5-hour drive).',
    noise_curfew: 'NGT (National Green Tribunal) restrictions near Fateh Sagar Lake — no DJ, fireworks, or amplified music in eco-sensitive zones.',
  },

  jaipur: {
    name: 'Jaipur',
    country: 'India',
    currency: 'Indian Rupee (INR). UPI widely accepted. Plenty of ATMs.',
    transport: 'Best connectivity of all Rajasthan wedding destinations — 74 flights/day, 10 airlines. Vande Bharat from Delhi: 3 hours 37 minutes (₹740 INR). Airport to venues: 15-75 min depending on location.',
    connectivity: 'Good 4G/5G coverage throughout the city. Heritage properties may have thicker walls but generally better than Udaipur.',
    weather: 'Season: October to March. November to February is peak. Can get chilly at night in December-January.',
    legal: 'Hindu Marriage Act registration: ₹100. Special Marriage Act: ₹150 + 30-day notice period.',
  },
};

/**
 * Get destination info by key (case-insensitive).
 */
export function getDestinationInfo(destination: string): DestinationInfo | null {
  const key = destination.toLowerCase().replace(/\s+/g, '_');
  return DESTINATION_KNOWLEDGE[key] || null;
}

/**
 * Get all available destinations.
 */
export function getAvailableDestinations(): string[] {
  return Object.keys(DESTINATION_KNOWLEDGE);
}

/**
 * Inject destination knowledge into Concierge context.
 */
export function injectDestinationKnowledge(
  destination: string
): Array<{ question: string; answer: string; source: string }> {
  const info = getDestinationInfo(destination);
  if (!info) return [];

  const entries: Array<{ question: string; answer: string; source: string }> = [];

  if (info.visa) {
    entries.push({
      question: `What visa do I need for ${info.name}?`,
      answer: info.visa,
      source: 'destination_preset',
    });
  }

  entries.push(
    {
      question: `What currency is used in ${info.name}?`,
      answer: info.currency,
      source: 'destination_preset',
    },
    {
      question: `How do I get around in ${info.name}?`,
      answer: info.transport,
      source: 'destination_preset',
    },
    {
      question: `What about phone/internet in ${info.name}?`,
      answer: info.connectivity,
      source: 'destination_preset',
    },
    {
      question: `What's the weather like in ${info.name}?`,
      answer: info.weather,
      source: 'destination_preset',
    }
  );

  if (info.food) {
    entries.push({
      question: `What about food in ${info.name}?`,
      answer: info.food,
      source: 'destination_preset',
    });
  }

  if (info.airports) {
    entries.push({
      question: `Which airport should I fly into for ${info.name}?`,
      answer: info.airports,
      source: 'destination_preset',
    });
  }

  if (info.noise_curfew) {
    entries.push({
      question: `Are there noise restrictions in ${info.name}?`,
      answer: info.noise_curfew,
      source: 'destination_preset',
    });
  }

  return entries;
}
