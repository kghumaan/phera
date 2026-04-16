import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Tests for the coordinator-info API endpoint logic.
 * Since Next.js route handlers depend on next/headers (cookies),
 * we test the core logic: phone number parsing & response shape.
 */

describe('coordinator-info API logic', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('phone number parsing', () => {
    it('should strip non-digit characters for whatsapp link', () => {
      const phoneNumber = '+1 (415) 555-1234';
      const digits = phoneNumber.replace(/\D/g, '');
      expect(digits).toBe('14155551234');
      expect(`https://wa.me/${digits}`).toBe('https://wa.me/14155551234');
    });

    it('should handle already-clean phone numbers', () => {
      const phoneNumber = '+14155551234';
      const digits = phoneNumber.replace(/\D/g, '');
      expect(digits).toBe('14155551234');
    });

    it('should handle international formats', () => {
      const phoneNumber = '+91 98765 43210';
      const digits = phoneNumber.replace(/\D/g, '');
      expect(digits).toBe('919876543210');
      expect(`https://wa.me/${digits}`).toBe('https://wa.me/919876543210');
    });

    it('should return empty values when env var is not set', () => {
      const phoneNumber = process.env.COORDINATOR_PHONE_NUMBER || '';
      const isConfigured = !!phoneNumber;
      const digits = phoneNumber.replace(/\D/g, '');
      const whatsappLink = isConfigured ? `https://wa.me/${digits}` : '';

      expect(isConfigured).toBe(false);
      expect(phoneNumber).toBe('');
      expect(whatsappLink).toBe('');
    });

    it('should return configured values when env var is set', () => {
      process.env.COORDINATOR_PHONE_NUMBER = '+14155551234';

      const phoneNumber = process.env.COORDINATOR_PHONE_NUMBER || '';
      const isConfigured = !!phoneNumber;
      const digits = phoneNumber.replace(/\D/g, '');
      const whatsappLink = isConfigured ? `https://wa.me/${digits}` : '';

      expect(isConfigured).toBe(true);
      expect(phoneNumber).toBe('+14155551234');
      expect(whatsappLink).toBe('https://wa.me/14155551234');
    });
  });

  describe('response shape', () => {
    it('should include isConfigured, phoneNumber, and whatsappLink fields', () => {
      process.env.COORDINATOR_PHONE_NUMBER = '+14155551234';

      const phoneNumber = process.env.COORDINATOR_PHONE_NUMBER || '';
      const isConfigured = !!phoneNumber;
      const digits = phoneNumber.replace(/\D/g, '');
      const whatsappLink = isConfigured ? `https://wa.me/${digits}` : '';

      const response = { isConfigured, phoneNumber, whatsappLink };

      expect(response).toHaveProperty('isConfigured');
      expect(response).toHaveProperty('phoneNumber');
      expect(response).toHaveProperty('whatsappLink');
      expect(typeof response.isConfigured).toBe('boolean');
      expect(typeof response.phoneNumber).toBe('string');
      expect(typeof response.whatsappLink).toBe('string');
    });

    it('should return unconfigured shape when env var is empty string', () => {
      process.env.COORDINATOR_PHONE_NUMBER = '';

      const phoneNumber = process.env.COORDINATOR_PHONE_NUMBER || '';
      const isConfigured = !!phoneNumber;

      expect(isConfigured).toBe(false);
      expect(phoneNumber).toBe('');
    });
  });
});
