import { describe, it, expect } from 'vitest';
import {
  DESTINATION_KNOWLEDGE,
  getDestinationInfo,
  getAvailableDestinations,
  injectDestinationKnowledge,
} from '@/lib/knowledge/destination-knowledge';

describe('DESTINATION_KNOWLEDGE', () => {
  const requiredFields = ['currency', 'transport', 'weather'];

  it('should have all 6 destinations', () => {
    const destinations = Object.keys(DESTINATION_KNOWLEDGE);
    expect(destinations).toContain('thailand');
    expect(destinations).toContain('bali');
    expect(destinations).toContain('sri_lanka');
    expect(destinations).toContain('goa');
    expect(destinations).toContain('udaipur');
    expect(destinations).toContain('jaipur');
    expect(destinations).toHaveLength(6);
  });

  it('all destinations have required fields', () => {
    for (const [key, info] of Object.entries(DESTINATION_KNOWLEDGE)) {
      for (const field of requiredFields) {
        expect(
          (info as any)[field],
          `${key} missing ${field}`
        ).toBeDefined();
      }
    }
  });

  it('international destinations have visa info', () => {
    expect(DESTINATION_KNOWLEDGE.thailand.visa).toBeDefined();
    expect(DESTINATION_KNOWLEDGE.bali.visa).toBeDefined();
    expect(DESTINATION_KNOWLEDGE.sri_lanka.visa).toBeDefined();
  });

  it('Goa warns about no Uber/Ola', () => {
    expect(DESTINATION_KNOWLEDGE.goa.transport.toLowerCase()).toContain('no ola');
  });

  it('Udaipur mentions limited flights', () => {
    expect(DESTINATION_KNOWLEDGE.udaipur.airports).toBeDefined();
    expect(DESTINATION_KNOWLEDGE.udaipur.airports).toContain('20');
  });
});

describe('getDestinationInfo', () => {
  it('should return info for valid destination', () => {
    const info = getDestinationInfo('thailand');
    expect(info).toBeDefined();
    expect(info!.name).toBe('Thailand');
  });

  it('should be case-insensitive', () => {
    expect(getDestinationInfo('Thailand')).toBeDefined();
    expect(getDestinationInfo('JAIPUR')).toBeDefined();
  });

  it('should handle spaces in destination name', () => {
    expect(getDestinationInfo('sri lanka')).toBeDefined();
  });

  it('should return null for unknown destination', () => {
    expect(getDestinationInfo('mars')).toBeNull();
  });
});

describe('getAvailableDestinations', () => {
  it('should return all 6 destinations', () => {
    expect(getAvailableDestinations()).toHaveLength(6);
  });
});

describe('injectDestinationKnowledge', () => {
  it('should return knowledge entries for known destination', () => {
    const entries = injectDestinationKnowledge('goa');
    expect(entries.length).toBeGreaterThan(0);
    expect(entries.every((e) => e.source === 'destination_preset')).toBe(true);
  });

  it('should include transport and currency entries', () => {
    const entries = injectDestinationKnowledge('jaipur');
    const questions = entries.map((e) => e.question);
    expect(questions.some((q) => q.includes('currency'))).toBe(true);
    expect(questions.some((q) => q.includes('get around'))).toBe(true);
  });

  it('should return empty array for unknown destination', () => {
    const entries = injectDestinationKnowledge('atlantis');
    expect(entries).toHaveLength(0);
  });

  it('should include visa info for international destinations', () => {
    const entries = injectDestinationKnowledge('thailand');
    const visaEntry = entries.find((e) => e.question.includes('visa'));
    expect(visaEntry).toBeDefined();
    expect(visaEntry!.answer).toContain('TDAC');
  });
});
