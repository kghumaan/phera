import { describe, it, expect } from 'vitest';
import {
  REVERSE_DESTINATION_GUIDE,
  detectInternationalGuest,
  generateCulturalGuideContent,
} from '@/lib/knowledge/reverse-destination';

describe('REVERSE_DESTINATION_GUIDE', () => {
  it('should have all required sections', () => {
    expect(REVERSE_DESTINATION_GUIDE.before_trip).toBeDefined();
    expect(REVERSE_DESTINATION_GUIDE.dress_code).toBeDefined();
    expect(REVERSE_DESTINATION_GUIDE.etiquette).toBeDefined();
    expect(REVERSE_DESTINATION_GUIDE.on_ground).toBeDefined();
    expect(REVERSE_DESTINATION_GUIDE.reassurance).toBeDefined();
  });

  it('should have dress codes for all standard events', () => {
    const dressCodes = REVERSE_DESTINATION_GUIDE.dress_code;
    expect(dressCodes.mehendi).toBeDefined();
    expect(dressCodes.sangeet).toBeDefined();
    expect(dressCodes.ceremony).toBeDefined();
    expect(dressCodes.reception).toBeDefined();
  });

  it('should warn about not wearing black, white, or red to ceremony', () => {
    const ceremony = REVERSE_DESTINATION_GUIDE.dress_code.ceremony.detail;
    expect(ceremony.toLowerCase()).toContain('black');
    expect(ceremony.toLowerCase()).toContain('white');
    expect(ceremony.toLowerCase()).toContain('red');
  });

  it('should include emergency numbers', () => {
    const emergency = REVERSE_DESTINATION_GUIDE.on_ground.emergency.detail;
    expect(emergency).toContain('100');
    expect(emergency).toContain('108');
  });
});

describe('detectInternationalGuest', () => {
  it('should detect US numbers as international', () => {
    expect(detectInternationalGuest('+14165551234')).toBe(true);
    expect(detectInternationalGuest('+12125551234')).toBe(true);
  });

  it('should detect UK numbers as international', () => {
    expect(detectInternationalGuest('+447911123456')).toBe(true);
  });

  it('should detect Australian numbers as international', () => {
    expect(detectInternationalGuest('+61412345678')).toBe(true);
  });

  it('should detect UAE numbers as international', () => {
    expect(detectInternationalGuest('+971501234567')).toBe(true);
  });

  it('should detect Indian numbers as domestic', () => {
    expect(detectInternationalGuest('+919876543210')).toBe(false);
    expect(detectInternationalGuest('919876543210')).toBe(false);
    expect(detectInternationalGuest('9876543210')).toBe(false);
  });

  it('should handle numbers with spaces and dashes', () => {
    expect(detectInternationalGuest('+1 416 555 1234')).toBe(true);
    expect(detectInternationalGuest('+91 98765-43210')).toBe(false);
  });
});

describe('generateCulturalGuideContent', () => {
  const sampleWedding = {
    couple_names: 'Priya & Rahul',
    destination: 'Udaipur, India',
    guest_name: 'Sarah',
    events: [
      { name: 'Mehendi', date: 'Dec 13', venue: 'Taj Lake Palace', dress_code: 'Casual festive' },
      { name: 'Sangeet', date: 'Dec 14', venue: 'Taj Lake Palace' },
      { name: 'Wedding Ceremony', date: 'Dec 15', venue: 'City Palace' },
      { name: 'Reception', date: 'Dec 15', venue: 'City Palace' },
    ],
  };

  it('should generate sections for all guide areas', () => {
    const sections = generateCulturalGuideContent(sampleWedding);
    expect(sections.length).toBeGreaterThanOrEqual(5);
  });

  it('should include guest name', () => {
    const sections = generateCulturalGuideContent(sampleWedding);
    expect(sections[0].title).toContain('Sarah');
  });

  it('should include couple names', () => {
    const sections = generateCulturalGuideContent(sampleWedding);
    expect(sections[0].content).toContain('Priya & Rahul');
  });

  it('should include destination', () => {
    const sections = generateCulturalGuideContent(sampleWedding);
    expect(sections[0].content).toContain('Udaipur');
  });

  it('should map events to dress codes', () => {
    const sections = generateCulturalGuideContent(sampleWedding);
    const dressCodeSection = sections.find((s) => s.title === 'What to Wear');
    expect(dressCodeSection).toBeDefined();
    expect(dressCodeSection!.items).toHaveLength(4);
    expect(dressCodeSection!.items![0].label).toBe('Mehendi');
  });

  it('should include couple dress code notes when available', () => {
    const sections = generateCulturalGuideContent(sampleWedding);
    const dressCodeSection = sections.find((s) => s.title === 'What to Wear');
    expect(dressCodeSection!.items![0].detail).toContain('Casual festive');
  });

  it('should include reassurance message', () => {
    const sections = generateCulturalGuideContent(sampleWedding);
    const lastSection = sections[sections.length - 1];
    expect(lastSection.content).toContain('welcoming');
  });
});
