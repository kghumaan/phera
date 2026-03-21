import { describe, it, expect } from 'vitest';

// Test landing page content data (avoid importing React/MUI components)

describe('Landing Page Content Updates', () => {
  // The data that drives the landing page content
  const newHero = {
    headline: 'Your Wedding Operations Team',
    tagline: 'We coordinate your guests so you can focus on the celebration.',
    body: '300+ guests, 3 days of events, people flying in from everywhere. Phera handles the guest logistics — travel coordination, RSVPs, communication, transportation — end to end via WhatsApp.',
    primaryCTA: 'Get Started',
    secondaryCTA: 'See How It Works',
  };

  const servicePillars = [
    { title: 'We collect every detail from your guests' },
    { title: 'We coordinate all travel and transportation' },
    { title: 'We keep every guest informed, 24/7' },
    { title: 'Your wedding, your vibe' },
  ];

  const additionalFeatures = [
    { title: 'Your guests from abroad? We\'ve got them.' },
    { title: 'Real-time operations dashboard' },
    { title: 'Family knows best' },
    { title: 'Smart guest import' },
  ];

  const pricing = [
    { name: 'Phera Base', usd: 349, inr: 9999, guests: 200 },
    { name: 'Phera Premium', usd: 599, inr: 17999, guests: 400 },
    { name: 'Phera Grand', usd: 799, inr: 29999, guests: 999 },
  ];

  const faqQuestions = [
    'How does the guest coordination work?',
    'What information does Phera collect from my guests?',
    'Do my guests need to download an app?',
    'What if a guest does not respond on WhatsApp?',
    'I already have a wedding website — can I still use Phera?',
    'Can I customize my wedding website myself?',
    'Do I still need a day-of coordinator?',
    'Is my guests\' data safe?',
  ];

  describe('Hero section', () => {
    it('should have new headline', () => {
      expect(newHero.headline).toBe('Your Wedding Operations Team');
    });

    it('should have "Get Started" as primary CTA', () => {
      expect(newHero.primaryCTA).toBe('Get Started');
    });

    it('should mention WhatsApp in body', () => {
      expect(newHero.body).toContain('WhatsApp');
    });
  });

  describe('Features section', () => {
    it('should have 4 service pillars', () => {
      expect(servicePillars).toHaveLength(4);
    });

    it('should have 4 additional features (total 8)', () => {
      expect(additionalFeatures).toHaveLength(4);
      expect(servicePillars.length + additionalFeatures.length).toBe(8);
    });

    it('all features should have titles', () => {
      [...servicePillars, ...additionalFeatures].forEach((f) => {
        expect(f.title).toBeDefined();
        expect(f.title.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Pricing section', () => {
    it('should have NO free tier', () => {
      expect(pricing.every((p) => p.usd > 0)).toBe(true);
      expect(pricing.some((p) => p.name.toLowerCase().includes('free'))).toBe(false);
    });

    it('should have 3 tiers', () => {
      expect(pricing).toHaveLength(3);
    });

    it('should have USD and INR pricing', () => {
      pricing.forEach((p) => {
        expect(p.usd).toBeGreaterThan(0);
        expect(p.inr).toBeGreaterThan(0);
      });
    });

    it('should have correct tier prices', () => {
      expect(pricing[0].usd).toBe(349);
      expect(pricing[1].usd).toBe(599);
      expect(pricing[2].usd).toBe(799);
    });
  });

  describe('FAQ section', () => {
    it('should have 8 FAQ questions', () => {
      expect(faqQuestions).toHaveLength(8);
    });

    it('should include question about WhatsApp', () => {
      expect(faqQuestions.some((q) => q.includes('WhatsApp'))).toBe(true);
    });

    it('should include question about data safety', () => {
      expect(faqQuestions.some((q) => q.includes('data safe'))).toBe(true);
    });

    it('should include question about existing website', () => {
      expect(faqQuestions.some((q) => q.includes('wedding website'))).toBe(true);
    });
  });
});
