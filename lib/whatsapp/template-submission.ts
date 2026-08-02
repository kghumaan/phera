/**
 * Template submission helper — generates Meta Business API payloads
 * for submitting WhatsApp message templates for approval.
 */

import { OUTREACH_TEMPLATES, OutreachTemplate } from '@/lib/whatsapp/outreach-templates';

export interface TemplateSubmissionPayload {
  name: string;
  category: string;
  language: string;
  components: any[];
}

export interface TemplateValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// Full body text for Meta submission (English versions)
const TEMPLATE_BODY_TEXT: Record<string, Record<string, string>> = {
  save_the_date_v1: {
    en: "Save the date for {{1}}'s wedding celebration! {{2}} in {{3}}. More details coming soon. Reply to let us know you received this! 💌",
    hi: '{{1}} की शादी का दिन नोट कर लें! {{2}} में {{3}}। जल्द ही और जानकारी आएगी। कृपया जवाब दें कि आपको यह संदेश मिला! 💌',
  },
  rsvp_request_v1: {
    en: "Hi {{1}}! {{2}} would love for you to join their wedding celebration. We're helping them coordinate. View the details and let us know you're coming: {{3}}",
    hi: 'नमस्ते {{1}}! {{2}} की शादी में आपको आने का निमंत्रण है। हम उनकी मदद कर रहे हैं। विवरण देखें और बताएं कि आप आ रहे हैं: {{3}}',
  },
  logistics_intro_v1: {
    en: "Hi {{1}}, {{2}} have asked us to help coordinate their wedding on {{3}}. We'll make sure you have everything you need — travel details, event schedules, and more. Reply to get started, or say STOP to opt out.",
    hi: '{{1}}, {{2}} ने हमसे {{3}} को अपनी शादी के समन्वय में मदद करने का अनुरोध किया है। हम सुनिश्चित करेंगे कि आपके पास सब कुछ हो — यात्रा विवरण, कार्यक्रम सूची, और बहुत कुछ। शुरू करने के लिए जवाब दें, या बंद करने के लिए STOP लिखें।',
  },
  gentle_nudge_v1: {
    en: "Hi {{1}}, just checking in! We're helping coordinate {{2}}'s wedding and want to make sure everything is sorted for you. Can you share a few details so we can help with your travel and schedule?",
    hi: 'नमस्ते {{1}}, बस जानना चाहते थे! हम {{2}} की शादी के समन्वय में मदद कर रहे हैं और यह सुनिश्चित करना चाहते हैं कि आपके लिए सब कुछ ठीक है। क्या आप कुछ विवरण साझा कर सकते हैं ताकि हम आपकी यात्रा और कार्यक्रम में मदद कर सकें?',
  },
  rsvp_confirmed_v1: {
    en: "Thanks {{1}}! We've noted that you'll be joining {{2}}'s wedding. Events: {{3}}. We'll be in touch closer to the date to help with travel details and event schedules. Reply anytime if you have questions! 🎉",
    hi: 'धन्यवाद {{1}}! हमने नोट कर लिया है कि आप {{2}} की शादी में आ रहे हैं। कार्यक्रम: {{3}}। हम तारीख के करीब यात्रा विवरण और कार्यक्रम सूची के लिए संपर्क करेंगे। कोई भी सवाल हो तो कभी भी जवाब दें! 🎉',
  },
  travel_details_request_v1: {
    en: "Hi {{1}}! As {{2}}'s wedding approaches, we'd love to help with your travel. Could you share your flight/travel details? This helps us arrange airport pickups and shuttles. Tap below to fill in your details! ✈️",
    hi: 'नमस्ते {{1}}! {{2}} की शादी करीब आ रही है, हम आपकी यात्रा में मदद करना चाहते हैं। क्या आप अपने फ्लाइट/यात्रा विवरण साझा कर सकते हैं? इससे हमें एयरपोर्ट पिकअप और शटल की व्यवस्था करने में मदद मिलेगी। नीचे टैप करके अपनी जानकारी भरें! ✈️',
  },
  shuttle_assignment_v1: {
    en: 'Hi {{1}}! Your shuttle for {{4}} is confirmed. Pickup: {{3}} at {{2}}. Please be at the pickup point 5 minutes early. See you there! 🚌',
    hi: 'नमस्ते {{1}}! {{4}} के लिए आपकी शटल पक्की है। पिकअप: {{3}} — समय {{2}}। कृपया पिकअप स्थान पर 5 मिनट पहले पहुँचें। वहाँ मिलते हैं! 🚌',
  },
  schedule_reminder_v1: {
    en: "Hi {{1}}! A reminder that {{2}}'s wedding events are on {{3}}. Attached is your personalized itinerary with all event details, timings, and venues. Have a wonderful time! 📋",
    hi: 'नमस्ते {{1}}! याद दिलाना चाहते हैं कि {{2}} की शादी के कार्यक्रम {{3}} को हैं। आपकी व्यक्तिगत कार्यसूची सभी कार्यक्रम विवरण, समय और स्थान के साथ संलग्न है। बहुत मज़ा करें! 📋',
  },
  day_before_summary_v1: {
    en: "Hi {{1}}! Tomorrow is the big day for {{2}}! 🎊 Here's what's happening:\n\n{{3}}\n\nReply if you need anything at all. We're here to help!",
    hi: 'नमस्ते {{1}}! कल {{2}} का बड़ा दिन है! 🎊 कल के कार्यक्रम:\n\n{{3}}\n\nकुछ भी चाहिए हो तो जवाब दें। हम यहाँ मदद के लिए हैं!',
  },
  thank_you_v1: {
    en: "Thank you so much for celebrating with {{2}}, {{1}}! 🙏 It meant the world to have you there. We hope you had a wonderful time. Wishing you all the best! ❤️",
    hi: '{{1}}, {{2}} के साथ जश्न मनाने के लिए बहुत-बहुत धन्यवाद! 🙏 आपका वहाँ होना बहुत खास था। हमें उम्मीद है आपने खूब मज़ा किया। आपको ढेर सारी शुभकामनाएं! ❤️',
  },
  cultural_guide_v1: {
    en: "Hi {{1}}! We've prepared a cultural guide for {{2}}'s wedding in {{3}}. It covers dress codes, etiquette, what to expect at each ceremony, and practical tips for your trip. We want you to feel right at home! 🙏",
  },
  multi_event_invite_v1: {
    en: "Hi {{1}}! Here are the events for {{2}}'s wedding celebration. Swipe through to see each event and RSVP! 🎊",
    hi: 'नमस्ते {{1}}! {{2}} की शादी के कार्यक्रम यहाँ हैं। हर कार्यक्रम देखें और RSVP करें! 🎊',
  },
};

/**
 * Generate the JSON payload for submitting a template to Meta Business API.
 */
export function generateTemplatePayload(
  templateKey: string,
  language: string
): TemplateSubmissionPayload {
  const template = OUTREACH_TEMPLATES[templateKey];
  if (!template) {
    throw new Error(`Unknown template: ${templateKey}`);
  }

  if (!template.languages.includes(language)) {
    throw new Error(`Language ${language} not available for ${templateKey}`);
  }

  const components = template.components[language];
  const apiComponents: any[] = [];

  for (const comp of components) {
    switch (comp.type) {
      case 'HEADER':
        if (comp.header_type === 'IMAGE') {
          apiComponents.push({
            type: 'HEADER',
            format: 'IMAGE',
            example: { header_handle: ['https://example.com/placeholder.jpg'] },
          });
        } else if (comp.header_type === 'DOCUMENT') {
          apiComponents.push({
            type: 'HEADER',
            format: 'DOCUMENT',
            example: { header_handle: ['https://example.com/placeholder.pdf'] },
          });
        } else if (comp.header_type === 'LOCATION') {
          apiComponents.push({ type: 'HEADER', format: 'LOCATION' });
        }
        break;

      case 'BODY': {
        const bodyText = TEMPLATE_BODY_TEXT[template.name]?.[language] || comp.text || '';
        apiComponents.push({
          type: 'BODY',
          text: bodyText,
          example: {
            body_text: [template.params.map((_, i) => `Example ${i + 1}`)],
          },
        });
        break;
      }

      case 'FOOTER':
        apiComponents.push({ type: 'FOOTER', text: comp.text });
        break;

      case 'BUTTONS':
        if (comp.buttons) {
          const buttons = comp.buttons.map((btn) => {
            if (btn.type === 'QUICK_REPLY') {
              return { type: 'QUICK_REPLY', text: btn.text };
            }
            if (btn.type === 'URL') {
              return {
                type: 'URL',
                text: btn.text,
                url: btn.url?.includes('{{') ? 'https://phera.io/w/{{1}}' : btn.url,
                example: btn.url?.includes('{{') ? ['https://phera.io/w/example-wedding'] : undefined,
              };
            }
            return { type: btn.type, text: btn.text };
          });
          apiComponents.push({ type: 'BUTTONS', buttons });
        }
        break;
    }
  }

  return {
    name: template.name,
    category: template.category,
    language,
    components: apiComponents,
  };
}

/**
 * Validate template content against Meta rules.
 */
export function validateTemplateContent(templateKey: string): TemplateValidationResult {
  const template = OUTREACH_TEMPLATES[templateKey];
  if (!template) {
    return { valid: false, errors: [`Unknown template: ${templateKey}`], warnings: [] };
  }

  const errors: string[] = [];
  const warnings: string[] = [];

  for (const lang of template.languages) {
    const components = template.components[lang];

    // Check for buttons
    const hasButtons = components.some((c) => c.type === 'BUTTONS' && c.buttons?.length);
    if (!hasButtons) {
      errors.push(`${templateKey} (${lang}): Missing buttons`);
    }

    // Check quick reply button count (max 3)
    const buttonComp = components.find((c) => c.type === 'BUTTONS');
    if (buttonComp?.buttons) {
      const qrButtons = buttonComp.buttons.filter((b: any) => b.type === 'QUICK_REPLY');
      if (qrButtons.length > 3) {
        errors.push(`${templateKey} (${lang}): Too many quick reply buttons (max 3)`);
      }
    }

    // Check body text exists
    const bodyComp = components.find((c) => c.type === 'BODY');
    if (!bodyComp?.text) {
      errors.push(`${templateKey} (${lang}): Missing body text`);
    }

    // Check for mixed-language content (Hinglish detection)
    if (lang === 'hi' && bodyComp?.text) {
      const latinChars = (bodyComp.text.match(/[a-zA-Z]/g) || []).length;
      const totalChars = bodyComp.text.replace(/[^a-zA-Z\u0900-\u097F]/g, '').length;
      if (totalChars > 0 && latinChars / totalChars > 0.3) {
        warnings.push(`${templateKey} (hi): Possible mixed-language content (Hinglish). Meta may reject.`);
      }
    }

    // Marketing templates should have opt-out
    if (template.category === 'MARKETING') {
      const hasFooter = components.some(
        (c) => c.type === 'FOOTER' && c.text?.toLowerCase().includes('stop')
      );
      if (!hasFooter) {
        warnings.push(`${templateKey} (${lang}): Marketing template without STOP footer`);
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Check template approval status via Meta API.
 */
export async function getSubmissionStatus(templateName: string): Promise<{
  name: string;
  status: string;
  category: string;
  language: string;
} | null> {
  const wabaId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!wabaId || !accessToken) {
    throw new Error('Missing WHATSAPP_BUSINESS_ACCOUNT_ID or WHATSAPP_ACCESS_TOKEN');
  }

  const response = await fetch(
    `https://graph.facebook.com/v23.0/${wabaId}/message_templates?name=${templateName}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get template status: ${response.statusText}`);
  }

  const data = await response.json();
  if (!data.data || data.data.length === 0) return null;

  const tmpl = data.data[0];
  return {
    name: tmpl.name,
    status: tmpl.status,
    category: tmpl.category,
    language: tmpl.language,
  };
}

/**
 * List all submitted templates and their statuses.
 */
export async function listAllTemplates(): Promise<Array<{
  name: string;
  status: string;
  category: string;
  language: string;
}>> {
  const wabaId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!wabaId || !accessToken) {
    throw new Error('Missing WHATSAPP_BUSINESS_ACCOUNT_ID or WHATSAPP_ACCESS_TOKEN');
  }

  const response = await fetch(
    `https://graph.facebook.com/v23.0/${wabaId}/message_templates?limit=100`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to list templates: ${response.statusText}`);
  }

  const data = await response.json();
  return (data.data || []).map((t: any) => ({
    name: t.name,
    status: t.status,
    category: t.category,
    language: t.language,
  }));
}
