import { describe, it, expect, vi } from 'vitest';
import { generateProfileConfig } from '@/lib/whatsapp/business-profile';

describe('generateProfileConfig', () => {
  it('should generate config from wedding data', () => {
    const config = generateProfileConfig({
      coupleName1: 'Priya',
      coupleName2: 'Rahul',
      weddingDate: 'December 15, 2026',
      venue: 'Udaipur',
      photoUrl: 'https://example.com/photo.jpg',
      websiteUrl: 'https://phera.io/priya-rahul',
    });

    expect(config.displayName).toContain('Priya');
    expect(config.displayName).toContain('Rahul');
    expect(config.about).toContain('Priya');
    expect(config.description).toContain('December 15, 2026');
    expect(config.description).toContain('Udaipur');
    expect(config.profilePhotoUrl).toBe('https://example.com/photo.jpg');
    expect(config.websiteUrl).toBe('https://phera.io/priya-rahul');
  });

  it('should truncate display name to 25 chars max', () => {
    const config = generateProfileConfig({
      coupleName1: 'Alexandrina',
      coupleName2: 'Bartholomew',
      weddingDate: 'Dec 2026',
    });

    expect(config.displayName.length).toBeLessThanOrEqual(25);
  });

  it('should handle short names', () => {
    const config = generateProfileConfig({
      coupleName1: 'Raj',
      coupleName2: 'Sia',
      weddingDate: 'Jan 2027',
    });

    expect(config.displayName).toBe('Raj & Sia Wedding');
  });

  it('should work without optional fields', () => {
    const config = generateProfileConfig({
      coupleName1: 'Priya',
      coupleName2: 'Rahul',
      weddingDate: 'Dec 2026',
    });

    expect(config.displayName).toBeDefined();
    expect(config.profilePhotoUrl).toBeUndefined();
    expect(config.websiteUrl).toBeUndefined();
    expect(config.description).not.toContain('undefined');
  });

  it('should mention Phera in description', () => {
    const config = generateProfileConfig({
      coupleName1: 'A',
      coupleName2: 'B',
      weddingDate: 'Dec',
    });
    expect(config.description).toContain('Phera');
  });
});
