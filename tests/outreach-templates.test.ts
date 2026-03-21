import { describe, it, expect } from 'vitest';
import {
  OUTREACH_TEMPLATES,
  buildTemplatePayload,
  validateTemplateParams,
} from '@/lib/whatsapp/outreach-templates';

describe('OUTREACH_TEMPLATES', () => {
  it('should define all required templates', () => {
    const expectedTemplates = [
      'SAVE_THE_DATE', 'RSVP_REQUEST', 'MULTI_EVENT_INVITE', 'LOGISTICS_INTRO',
      'NUDGE', 'THANK_YOU', 'RSVP_CONFIRMATION', 'TRAVEL_REQUEST',
      'SHUTTLE_ASSIGNMENT', 'SCHEDULE_REMINDER', 'DAY_BEFORE_SUMMARY', 'CULTURAL_GUIDE',
    ];

    for (const name of expectedTemplates) {
      expect(OUTREACH_TEMPLATES[name]).toBeDefined();
    }
  });

  it('should have both en and hi versions for all templates except CULTURAL_GUIDE', () => {
    for (const [key, template] of Object.entries(OUTREACH_TEMPLATES)) {
      expect(template.languages).toContain('en');
      if (key !== 'CULTURAL_GUIDE') {
        expect(template.languages).toContain('hi');
        expect(template.components['hi']).toBeDefined();
      }
    }
  });

  it('CULTURAL_GUIDE should be English only', () => {
    expect(OUTREACH_TEMPLATES.CULTURAL_GUIDE.languages).toEqual(['en']);
    expect(OUTREACH_TEMPLATES.CULTURAL_GUIDE.components['hi']).toBeUndefined();
  });

  it('every template should have buttons', () => {
    for (const [key, template] of Object.entries(OUTREACH_TEMPLATES)) {
      for (const lang of template.languages) {
        const components = template.components[lang];
        const hasButtons = components.some((c) => c.type === 'BUTTONS' && c.buttons && c.buttons.length > 0);
        expect(hasButtons, `${key} (${lang}) should have buttons`).toBe(true);
      }
    }
  });

  it('quick reply buttons should have max 3 per template', () => {
    for (const [key, template] of Object.entries(OUTREACH_TEMPLATES)) {
      for (const lang of template.languages) {
        const components = template.components[lang];
        const buttonComp = components.find((c) => c.type === 'BUTTONS');
        if (buttonComp?.buttons) {
          const qrButtons = buttonComp.buttons.filter((b) => b.type === 'QUICK_REPLY');
          expect(qrButtons.length, `${key} (${lang}) has too many quick reply buttons`).toBeLessThanOrEqual(3);
        }
      }
    }
  });

  it('marketing templates should include opt-out footer', () => {
    const marketingTemplates = Object.entries(OUTREACH_TEMPLATES).filter(([_, t]) => t.category === 'MARKETING');

    for (const [key, template] of marketingTemplates) {
      for (const lang of template.languages) {
        const components = template.components[lang];
        const hasFooter = components.some(
          (c) => c.type === 'FOOTER' && c.text?.toLowerCase().includes('stop')
        );
        // Marketing first-touch templates should have opt-out footer
        if (['SAVE_THE_DATE', 'RSVP_REQUEST', 'MULTI_EVENT_INVITE', 'LOGISTICS_INTRO', 'NUDGE'].includes(key)) {
          expect(hasFooter, `${key} (${lang}) should have STOP footer`).toBe(true);
        }
      }
    }
  });
});

describe('buildTemplatePayload', () => {
  it('should build payload for SAVE_THE_DATE in English', () => {
    const payload = buildTemplatePayload(
      '+919876543210',
      'SAVE_THE_DATE',
      'en',
      {
        guest_name: 'Raj',
        couple_names: 'Priya & Rahul',
        wedding_date: 'December 15, 2026',
        location: 'Udaipur',
      },
      'https://example.com/image.jpg'
    );

    expect(payload.messaging_product).toBe('whatsapp');
    expect(payload.to).toBe('+919876543210');
    expect(payload.type).toBe('template');
    expect(payload.template.name).toBe('save_the_date_v1');
    expect(payload.template.language.code).toBe('en');
    expect(payload.template.components.length).toBeGreaterThan(0);
  });

  it('should build payload for SAVE_THE_DATE in Hindi', () => {
    const payload = buildTemplatePayload(
      '+919876543210',
      'SAVE_THE_DATE',
      'hi',
      {
        guest_name: 'राज',
        couple_names: 'प्रिया और राहुल',
        wedding_date: '15 दिसंबर, 2026',
        location: 'उदयपुर',
      }
    );

    expect(payload.template.language.code).toBe('hi');
    expect(payload.template.name).toBe('save_the_date_v1');
  });

  it('should throw for unknown template', () => {
    expect(() =>
      buildTemplatePayload('+919876543210', 'NONEXISTENT', 'en', {})
    ).toThrow('Unknown template');
  });

  it('should throw for unavailable language', () => {
    expect(() =>
      buildTemplatePayload('+919876543210', 'CULTURAL_GUIDE', 'hi', {
        guest_name: 'Test',
        couple_names: 'Test',
        destination: 'Test',
      })
    ).toThrow('Language hi not available');
  });

  it('should throw for missing required parameters', () => {
    expect(() =>
      buildTemplatePayload('+919876543210', 'SAVE_THE_DATE', 'en', {
        guest_name: 'Raj',
        // missing couple_names, wedding_date, location
      })
    ).toThrow('Missing required parameters');
  });

  it('should include image header when mediaUrl provided', () => {
    const payload = buildTemplatePayload(
      '+919876543210',
      'SAVE_THE_DATE',
      'en',
      {
        guest_name: 'Raj',
        couple_names: 'Priya & Rahul',
        wedding_date: 'December 15, 2026',
        location: 'Udaipur',
      },
      'https://example.com/wedding-photo.jpg'
    );

    const headerComp = payload.template.components.find((c: any) => c.type === 'header');
    expect(headerComp).toBeDefined();
    expect(headerComp.parameters[0].type).toBe('image');
  });

  it('should build correct body parameters', () => {
    const payload = buildTemplatePayload(
      '+919876543210',
      'NUDGE',
      'en',
      {
        guest_name: 'Raj',
        couple_names: 'Priya & Rahul',
      }
    );

    const bodyComp = payload.template.components.find((c: any) => c.type === 'body');
    expect(bodyComp).toBeDefined();
    expect(bodyComp.parameters).toHaveLength(2);
    expect(bodyComp.parameters[0].text).toBe('Raj');
    expect(bodyComp.parameters[1].text).toBe('Priya & Rahul');
  });
});

describe('validateTemplateParams', () => {
  it('should validate correct params', () => {
    const result = validateTemplateParams('SAVE_THE_DATE', {
      guest_name: 'Raj',
      couple_names: 'Priya & Rahul',
      wedding_date: 'Dec 15',
      location: 'Udaipur',
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should catch missing params', () => {
    const result = validateTemplateParams('SAVE_THE_DATE', {
      guest_name: 'Raj',
    });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should reject unknown template', () => {
    const result = validateTemplateParams('NONEXISTENT', {});
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('Unknown template');
  });
});
