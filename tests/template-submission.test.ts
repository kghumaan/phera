import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateTemplatePayload,
  validateTemplateContent,
} from '@/lib/whatsapp/template-submission';
import { OUTREACH_TEMPLATES } from '@/lib/whatsapp/outreach-templates';

describe('generateTemplatePayload', () => {
  it('should generate payload for each template in each language', () => {
    for (const [key, template] of Object.entries(OUTREACH_TEMPLATES)) {
      for (const lang of template.languages) {
        const payload = generateTemplatePayload(key, lang);
        expect(payload.name).toBe(template.name);
        expect(payload.category).toBe(template.category);
        expect(payload.language).toBe(lang);
        expect(payload.components.length).toBeGreaterThan(0);
      }
    }
  });

  it('should include BODY component with text', () => {
    const payload = generateTemplatePayload('SAVE_THE_DATE', 'en');
    const body = payload.components.find((c: any) => c.type === 'BODY');
    expect(body).toBeDefined();
    expect(body.text).toContain('Save the date');
  });

  it('should include BUTTONS component', () => {
    const payload = generateTemplatePayload('SAVE_THE_DATE', 'en');
    const buttons = payload.components.find((c: any) => c.type === 'BUTTONS');
    expect(buttons).toBeDefined();
    expect(buttons.buttons.length).toBeGreaterThan(0);
  });

  it('should include IMAGE header for templates with image', () => {
    const payload = generateTemplatePayload('SAVE_THE_DATE', 'en');
    const header = payload.components.find((c: any) => c.type === 'HEADER');
    expect(header).toBeDefined();
    expect(header.format).toBe('IMAGE');
  });

  it('should include DOCUMENT header for schedule reminder', () => {
    const payload = generateTemplatePayload('SCHEDULE_REMINDER', 'en');
    const header = payload.components.find((c: any) => c.type === 'HEADER');
    expect(header).toBeDefined();
    expect(header.format).toBe('DOCUMENT');
  });

  it('should include FOOTER for marketing templates', () => {
    const payload = generateTemplatePayload('NUDGE', 'en');
    const footer = payload.components.find((c: any) => c.type === 'FOOTER');
    expect(footer).toBeDefined();
    expect(footer.text).toContain('STOP');
  });

  it('should throw for unknown template', () => {
    expect(() => generateTemplatePayload('NONEXISTENT', 'en')).toThrow('Unknown template');
  });

  it('should throw for unavailable language', () => {
    expect(() => generateTemplatePayload('CULTURAL_GUIDE', 'hi')).toThrow('Language hi not available');
  });

  it('should generate Hindi payloads with Devanagari script', () => {
    const payload = generateTemplatePayload('SAVE_THE_DATE', 'hi');
    const body = payload.components.find((c: any) => c.type === 'BODY');
    expect(body.text).toMatch(/[\u0900-\u097F]/); // Contains Devanagari characters
  });
});

describe('validateTemplateContent', () => {
  it('should validate all templates as valid', () => {
    for (const key of Object.keys(OUTREACH_TEMPLATES)) {
      const result = validateTemplateContent(key);
      expect(result.valid, `${key} should be valid. Errors: ${result.errors.join(', ')}`).toBe(true);
    }
  });

  it('should return errors for unknown template', () => {
    const result = validateTemplateContent('NONEXISTENT');
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('Unknown template');
  });

  it('should detect that all templates have buttons', () => {
    for (const key of Object.keys(OUTREACH_TEMPLATES)) {
      const result = validateTemplateContent(key);
      const buttonErrors = result.errors.filter((e) => e.includes('Missing buttons'));
      expect(buttonErrors).toHaveLength(0);
    }
  });
});
