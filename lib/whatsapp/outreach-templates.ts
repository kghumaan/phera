/**
 * WhatsApp outreach template definitions for the Phera pivot.
 * Each template has English (en) and Hindi (hi) versions (except CULTURAL_GUIDE which is en only).
 * Every template includes interactive buttons per Meta best practices.
 */

export type TemplateCategory = 'MARKETING' | 'UTILITY';
export type ComponentType = 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
export type HeaderType = 'IMAGE' | 'DOCUMENT' | 'LOCATION' | 'TEXT' | 'NONE';
export type ButtonType = 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER';

export interface TemplateButton {
  type: ButtonType;
  text: string;
  url?: string; // For URL buttons — {{1}} placeholder for dynamic URLs
  phone_number?: string;
}

export interface TemplateComponent {
  type: ComponentType;
  text?: string;
  header_type?: HeaderType;
  buttons?: TemplateButton[];
  example?: Record<string, string[]>;
}

export interface OutreachTemplate {
  name: string;
  category: TemplateCategory;
  languages: string[];
  components: Record<string, TemplateComponent[]>; // keyed by language code
  params: string[]; // required parameter names
}

// ─── Template Definitions ─────────────────────────────────────────

export const OUTREACH_TEMPLATES: Record<string, OutreachTemplate> = {
  SAVE_THE_DATE: {
    name: 'save_the_date_v1',
    category: 'MARKETING',
    languages: ['en', 'hi'],
    params: ['guest_name', 'couple_names', 'wedding_date', 'location'],
    components: {
      en: [
        { type: 'HEADER', header_type: 'IMAGE' },
        {
          type: 'BODY',
          text: 'Save the date for {{1}}\'s wedding celebration! {{2}} in {{3}}. More details coming soon. Reply to let us know you received this! 💌',
        },
        { type: 'FOOTER', text: 'Reply STOP to opt out. Privacy: phera.io/privacy' },
        {
          type: 'BUTTONS',
          buttons: [
            { type: 'QUICK_REPLY', text: 'I\'ll be there! 🎉' },
            { type: 'QUICK_REPLY', text: 'Tell me more' },
          ],
        },
      ],
      hi: [
        { type: 'HEADER', header_type: 'IMAGE' },
        {
          type: 'BODY',
          text: '{{1}} की शादी का दिन नोट कर लें! {{2}} में {{3}}। जल्द ही और जानकारी आएगी। कृपया जवाब दें कि आपको यह संदेश मिला! 💌',
        },
        { type: 'FOOTER', text: 'बंद करने के लिए STOP लिखें। गोपनीयता: phera.io/privacy' },
        {
          type: 'BUTTONS',
          buttons: [
            { type: 'QUICK_REPLY', text: 'मैं आऊँगा/आऊँगी! 🎉' },
            { type: 'QUICK_REPLY', text: 'और बताइए' },
          ],
        },
      ],
    },
  },

  RSVP_REQUEST: {
    name: 'rsvp_request_v1',
    category: 'MARKETING',
    languages: ['en', 'hi'],
    params: ['guest_name', 'couple_names', 'website_url'],
    components: {
      en: [
        { type: 'HEADER', header_type: 'IMAGE' },
        {
          type: 'BODY',
          text: 'Hi {{1}}! {{2}} would love for you to join their wedding celebration. We\'re helping them coordinate. View the details and let us know you\'re coming: {{3}}',
        },
        { type: 'FOOTER', text: 'Reply STOP to opt out. Privacy: phera.io/privacy' },
        {
          type: 'BUTTONS',
          buttons: [
            { type: 'QUICK_REPLY', text: 'Yes, attending! ✅' },
            { type: 'QUICK_REPLY', text: 'Can\'t make it 😔' },
            { type: 'URL', text: 'View Details & RSVP', url: '{{1}}' },
          ],
        },
      ],
      hi: [
        { type: 'HEADER', header_type: 'IMAGE' },
        {
          type: 'BODY',
          text: 'नमस्ते {{1}}! {{2}} की शादी में आपको आने का निमंत्रण है। हम उनकी मदद कर रहे हैं। विवरण देखें और बताएं कि आप आ रहे हैं: {{3}}',
        },
        { type: 'FOOTER', text: 'बंद करने के लिए STOP लिखें। गोपनीयता: phera.io/privacy' },
        {
          type: 'BUTTONS',
          buttons: [
            { type: 'QUICK_REPLY', text: 'हाँ, आ रहे हैं! ✅' },
            { type: 'QUICK_REPLY', text: 'नहीं आ पाएँगे 😔' },
            { type: 'URL', text: 'विवरण देखें और RSVP करें', url: '{{1}}' },
          ],
        },
      ],
    },
  },

  MULTI_EVENT_INVITE: {
    name: 'multi_event_invite_v1',
    category: 'MARKETING',
    languages: ['en', 'hi'],
    params: ['guest_name', 'couple_names'],
    components: {
      en: [
        {
          type: 'BODY',
          text: 'Hi {{1}}! Here are the events for {{2}}\'s wedding celebration. Swipe through to see each event and RSVP! 🎊',
        },
        { type: 'FOOTER', text: 'Reply STOP to opt out. Privacy: phera.io/privacy' },
        {
          type: 'BUTTONS',
          buttons: [
            { type: 'URL', text: 'RSVP Now', url: '{{1}}' },
          ],
        },
      ],
      hi: [
        {
          type: 'BODY',
          text: 'नमस्ते {{1}}! {{2}} की शादी के कार्यक्रम यहाँ हैं। हर कार्यक्रम देखें और RSVP करें! 🎊',
        },
        { type: 'FOOTER', text: 'बंद करने के लिए STOP लिखें। गोपनीयता: phera.io/privacy' },
        {
          type: 'BUTTONS',
          buttons: [
            { type: 'URL', text: 'RSVP करें', url: '{{1}}' },
          ],
        },
      ],
    },
  },

  LOGISTICS_INTRO: {
    name: 'logistics_intro_v1',
    category: 'MARKETING',
    languages: ['en', 'hi'],
    params: ['guest_name', 'couple_names', 'wedding_date'],
    components: {
      en: [
        {
          type: 'BODY',
          text: 'Hi {{1}}, {{2}} have asked us to help coordinate their wedding on {{3}}. We\'ll make sure you have everything you need — travel details, event schedules, and more. Reply to get started, or say STOP to opt out.',
        },
        { type: 'FOOTER', text: 'Reply STOP to opt out. Your data is handled per DPDPA 2023. Privacy: phera.io/privacy' },
        {
          type: 'BUTTONS',
          buttons: [
            { type: 'QUICK_REPLY', text: 'Let\'s go! 🚀' },
            { type: 'QUICK_REPLY', text: 'Tell me more' },
          ],
        },
      ],
      hi: [
        {
          type: 'BODY',
          text: 'नमस्ते {{1}}, {{2}} ने हमसे {{3}} को अपनी शादी के समन्वय में मदद करने का अनुरोध किया है। हम सुनिश्चित करेंगे कि आपके पास सब कुछ हो — यात्रा विवरण, कार्यक्रम सूची, और बहुत कुछ। शुरू करने के लिए जवाब दें, या बंद करने के लिए STOP लिखें।',
        },
        { type: 'FOOTER', text: 'बंद करने के लिए STOP लिखें। आपका डेटा DPDPA 2023 के अनुसार सुरक्षित है। गोपनीयता: phera.io/privacy' },
        {
          type: 'BUTTONS',
          buttons: [
            { type: 'QUICK_REPLY', text: 'चलिए शुरू करें! 🚀' },
            { type: 'QUICK_REPLY', text: 'और बताइए' },
          ],
        },
      ],
    },
  },

  NUDGE: {
    name: 'gentle_nudge_v1',
    category: 'MARKETING',
    languages: ['en', 'hi'],
    params: ['guest_name', 'couple_names'],
    components: {
      en: [
        {
          type: 'BODY',
          text: 'Hi {{1}}, just checking in! We\'re helping coordinate {{2}}\'s wedding and want to make sure everything is sorted for you. Can you share a few details so we can help with your travel and schedule?',
        },
        { type: 'FOOTER', text: 'Reply STOP to opt out. Privacy: phera.io/privacy' },
        {
          type: 'BUTTONS',
          buttons: [
            { type: 'QUICK_REPLY', text: 'Sure, let\'s do it! 👍' },
            { type: 'QUICK_REPLY', text: 'Remind me later' },
          ],
        },
      ],
      hi: [
        {
          type: 'BODY',
          text: 'नमस्ते {{1}}, बस जानना चाहते थे! हम {{2}} की शादी के समन्वय में मदद कर रहे हैं और यह सुनिश्चित करना चाहते हैं कि आपके लिए सब कुछ ठीक है। क्या आप कुछ विवरण साझा कर सकते हैं ताकि हम आपकी यात्रा और कार्यक्रम में मदद कर सकें?',
        },
        { type: 'FOOTER', text: 'बंद करने के लिए STOP लिखें। गोपनीयता: phera.io/privacy' },
        {
          type: 'BUTTONS',
          buttons: [
            { type: 'QUICK_REPLY', text: 'हाँ, चलिए! 👍' },
            { type: 'QUICK_REPLY', text: 'बाद में याद दिलाएं' },
          ],
        },
      ],
    },
  },

  THANK_YOU: {
    name: 'thank_you_v1',
    category: 'MARKETING',
    languages: ['en', 'hi'],
    params: ['guest_name', 'couple_names'],
    components: {
      en: [
        { type: 'HEADER', header_type: 'IMAGE' },
        {
          type: 'BODY',
          text: 'Thank you so much for celebrating with {{2}}, {{1}}! 🙏 It meant the world to have you there. We hope you had a wonderful time. Wishing you all the best! ❤️',
        },
        {
          type: 'BUTTONS',
          buttons: [
            { type: 'QUICK_REPLY', text: 'Congratulations! 🎉' },
          ],
        },
      ],
      hi: [
        { type: 'HEADER', header_type: 'IMAGE' },
        {
          type: 'BODY',
          text: '{{1}}, {{2}} के साथ जश्न मनाने के लिए बहुत-बहुत धन्यवाद! 🙏 आपका वहाँ होना बहुत खास था। हमें उम्मीद है आपने खूब मज़ा किया। आपको ढेर सारी शुभकामनाएं! ❤️',
        },
        {
          type: 'BUTTONS',
          buttons: [
            { type: 'QUICK_REPLY', text: 'बधाई हो! 🎉' },
          ],
        },
      ],
    },
  },

  RSVP_CONFIRMATION: {
    name: 'rsvp_confirmed_v1',
    category: 'UTILITY',
    languages: ['en', 'hi'],
    params: ['guest_name', 'couple_names', 'event_list'],
    components: {
      en: [
        {
          type: 'BODY',
          text: 'Thanks {{1}}! We\'ve noted that you\'ll be joining {{2}}\'s wedding. Events: {{3}}. We\'ll be in touch closer to the date to help with travel details and event schedules. Reply anytime if you have questions! 🎉',
        },
        {
          type: 'BUTTONS',
          buttons: [
            { type: 'QUICK_REPLY', text: 'Thanks! 🙌' },
          ],
        },
      ],
      hi: [
        {
          type: 'BODY',
          text: 'धन्यवाद {{1}}! हमने नोट कर लिया है कि आप {{2}} की शादी में आ रहे हैं। कार्यक्रम: {{3}}। हम तारीख के करीब यात्रा विवरण और कार्यक्रम सूची के लिए संपर्क करेंगे। कोई भी सवाल हो तो कभी भी जवाब दें! 🎉',
        },
        {
          type: 'BUTTONS',
          buttons: [
            { type: 'QUICK_REPLY', text: 'धन्यवाद! 🙌' },
          ],
        },
      ],
    },
  },

  TRAVEL_REQUEST: {
    name: 'travel_details_request_v1',
    category: 'UTILITY',
    languages: ['en', 'hi'],
    params: ['guest_name', 'couple_names'],
    components: {
      en: [
        {
          type: 'BODY',
          text: 'Hi {{1}}! As {{2}}\'s wedding approaches, we\'d love to help with your travel. Could you share your flight/travel details? This helps us arrange airport pickups and shuttles. Tap below to fill in your details! ✈️',
        },
        {
          type: 'BUTTONS',
          buttons: [
            { type: 'URL', text: 'Share Travel Details', url: '{{1}}' },
          ],
        },
      ],
      hi: [
        {
          type: 'BODY',
          text: 'नमस्ते {{1}}! {{2}} की शादी करीब आ रही है, हम आपकी यात्रा में मदद करना चाहते हैं। क्या आप अपने फ्लाइट/यात्रा विवरण साझा कर सकते हैं? इससे हमें एयरपोर्ट पिकअप और शटल की व्यवस्था करने में मदद मिलेगी। नीचे टैप करके अपनी जानकारी भरें! ✈️',
        },
        {
          type: 'BUTTONS',
          buttons: [
            { type: 'URL', text: 'यात्रा विवरण भरें', url: '{{1}}' },
          ],
        },
      ],
    },
  },

  SHUTTLE_ASSIGNMENT: {
    name: 'shuttle_assignment_v1',
    category: 'UTILITY',
    languages: ['en', 'hi'],
    params: ['guest_name', 'shuttle_time', 'pickup_location', 'event_name'],
    components: {
      en: [
        { type: 'HEADER', header_type: 'LOCATION' },
        {
          type: 'BODY',
          text: 'Hi {{1}}! Your shuttle for {{4}} is confirmed. Pickup: {{3}} at {{2}}. Please be at the pickup point 5 minutes early. See you there! 🚌',
        },
        {
          type: 'BUTTONS',
          buttons: [
            { type: 'QUICK_REPLY', text: 'Got it! ✅' },
          ],
        },
      ],
      hi: [
        { type: 'HEADER', header_type: 'LOCATION' },
        {
          type: 'BODY',
          text: 'नमस्ते {{1}}! {{4}} के लिए आपकी शटल पक्की है। पिकअप: {{3}} — समय {{2}}। कृपया पिकअप स्थान पर 5 मिनट पहले पहुँचें। वहाँ मिलते हैं! 🚌',
        },
        {
          type: 'BUTTONS',
          buttons: [
            { type: 'QUICK_REPLY', text: 'समझ गए! ✅' },
          ],
        },
      ],
    },
  },

  SCHEDULE_REMINDER: {
    name: 'schedule_reminder_v1',
    category: 'UTILITY',
    languages: ['en', 'hi'],
    params: ['guest_name', 'couple_names', 'event_date'],
    components: {
      en: [
        { type: 'HEADER', header_type: 'DOCUMENT' },
        {
          type: 'BODY',
          text: 'Hi {{1}}! A reminder that {{2}}\'s wedding events are on {{3}}. Attached is your personalized itinerary with all event details, timings, and venues. Have a wonderful time! 📋',
        },
        {
          type: 'BUTTONS',
          buttons: [
            { type: 'QUICK_REPLY', text: 'Thanks! 🎉' },
          ],
        },
      ],
      hi: [
        { type: 'HEADER', header_type: 'DOCUMENT' },
        {
          type: 'BODY',
          text: 'नमस्ते {{1}}! याद दिलाना चाहते हैं कि {{2}} की शादी के कार्यक्रम {{3}} को हैं। आपकी व्यक्तिगत कार्यसूची सभी कार्यक्रम विवरण, समय और स्थान के साथ संलग्न है। बहुत मज़ा करें! 📋',
        },
        {
          type: 'BUTTONS',
          buttons: [
            { type: 'QUICK_REPLY', text: 'धन्यवाद! 🎉' },
          ],
        },
      ],
    },
  },

  DAY_BEFORE_SUMMARY: {
    name: 'day_before_summary_v1',
    category: 'UTILITY',
    languages: ['en', 'hi'],
    params: ['guest_name', 'couple_names', 'tomorrow_events_summary'],
    components: {
      en: [
        { type: 'HEADER', header_type: 'LOCATION' },
        {
          type: 'BODY',
          text: 'Hi {{1}}! Tomorrow is the big day for {{2}}! 🎊 Here\'s what\'s happening:\n\n{{3}}\n\nReply if you need anything at all. We\'re here to help!',
        },
        {
          type: 'BUTTONS',
          buttons: [
            { type: 'QUICK_REPLY', text: 'Can\'t wait! 🥳' },
            { type: 'QUICK_REPLY', text: 'I have a question' },
          ],
        },
      ],
      hi: [
        { type: 'HEADER', header_type: 'LOCATION' },
        {
          type: 'BODY',
          text: 'नमस्ते {{1}}! कल {{2}} का बड़ा दिन है! 🎊 कल के कार्यक्रम:\n\n{{3}}\n\nकुछ भी चाहिए हो तो जवाब दें। हम यहाँ मदद के लिए हैं!',
        },
        {
          type: 'BUTTONS',
          buttons: [
            { type: 'QUICK_REPLY', text: 'बेसब्री से इंतज़ार है! 🥳' },
            { type: 'QUICK_REPLY', text: 'मेरा एक सवाल है' },
          ],
        },
      ],
    },
  },

  CULTURAL_GUIDE: {
    name: 'cultural_guide_v1',
    category: 'UTILITY',
    languages: ['en'], // English only — for non-Indian guests
    params: ['guest_name', 'couple_names', 'destination'],
    components: {
      en: [
        { type: 'HEADER', header_type: 'DOCUMENT' },
        {
          type: 'BODY',
          text: 'Hi {{1}}! We\'ve prepared a cultural guide for {{2}}\'s wedding in {{3}}. It covers dress codes, etiquette, what to expect at each ceremony, and practical tips for your trip. We want you to feel right at home! 🙏',
        },
        {
          type: 'BUTTONS',
          buttons: [
            { type: 'QUICK_REPLY', text: 'This is great, thanks!' },
            { type: 'QUICK_REPLY', text: 'I have questions' },
          ],
        },
      ],
    },
  },
};

// ─── Payload Builder ──────────────────────────────────────────────

export interface TemplatePayload {
  messaging_product: 'whatsapp';
  to: string;
  type: 'template';
  template: {
    name: string;
    language: { code: string };
    components: any[];
  };
}

/**
 * Build the WhatsApp Cloud API payload for sending a template message.
 */
export function buildTemplatePayload(
  phoneNumber: string,
  templateKey: string,
  languageCode: string,
  params: Record<string, string>,
  mediaUrl?: string
): TemplatePayload {
  const template = OUTREACH_TEMPLATES[templateKey];
  if (!template) {
    throw new Error(`Unknown template: ${templateKey}`);
  }

  if (!template.languages.includes(languageCode)) {
    throw new Error(`Language ${languageCode} not available for ${templateKey}. Available: ${template.languages.join(', ')}`);
  }

  // Validate required params
  const missingParams = template.params.filter((p) => !(p in params));
  if (missingParams.length > 0) {
    throw new Error(`Missing required parameters: ${missingParams.join(', ')}`);
  }

  const templateComponents = template.components[languageCode];
  const apiComponents: any[] = [];

  for (const comp of templateComponents) {
    if (comp.type === 'HEADER' && comp.header_type === 'IMAGE' && mediaUrl) {
      apiComponents.push({
        type: 'header',
        parameters: [{ type: 'image', image: { link: mediaUrl } }],
      });
    } else if (comp.type === 'HEADER' && comp.header_type === 'DOCUMENT' && mediaUrl) {
      apiComponents.push({
        type: 'header',
        parameters: [{ type: 'document', document: { link: mediaUrl } }],
      });
    } else if (comp.type === 'HEADER' && comp.header_type === 'LOCATION') {
      // Location headers are set at template level, not dynamically
    } else if (comp.type === 'BODY') {
      // Extract param indices from body text and map to values
      const paramMatches = comp.text?.match(/\{\{(\d+)\}\}/g) || [];
      const bodyParams = paramMatches.map((match: string) => {
        const index = parseInt(match.replace(/[{}]/g, ''));
        const paramName = template.params[index - 1];
        return { type: 'text', text: params[paramName] || '' };
      });

      if (bodyParams.length > 0) {
        apiComponents.push({
          type: 'body',
          parameters: bodyParams,
        });
      }
    } else if (comp.type === 'BUTTONS' && comp.buttons) {
      comp.buttons.forEach((btn: TemplateButton, idx: number) => {
        if (btn.type === 'URL' && btn.url?.includes('{{')) {
          apiComponents.push({
            type: 'button',
            sub_type: 'url',
            index: idx,
            parameters: [{ type: 'text', text: params.website_url || params.couple_names || '' }],
          });
        }
      });
    }
  }

  return {
    messaging_product: 'whatsapp',
    to: phoneNumber,
    type: 'template',
    template: {
      name: template.name,
      language: { code: languageCode },
      components: apiComponents,
    },
  };
}

/**
 * Validate template parameters
 */
export function validateTemplateParams(
  templateKey: string,
  params: Record<string, string>
): { valid: boolean; errors: string[] } {
  const template = OUTREACH_TEMPLATES[templateKey];
  if (!template) {
    return { valid: false, errors: [`Unknown template: ${templateKey}`] };
  }

  const errors: string[] = [];
  for (const param of template.params) {
    if (!params[param] || typeof params[param] !== 'string') {
      errors.push(`Missing or invalid parameter: ${param}`);
    }
  }

  return { valid: errors.length === 0, errors };
}
