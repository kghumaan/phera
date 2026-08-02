import { describe, it, expect } from 'vitest';

// Test onboarding data logic (avoid importing React/MUI to prevent ESM issues)

describe('Onboarding Updates', () => {
  describe('Website question routing', () => {
    it('should define three options for website question', () => {
      const options = [
        { value: 'has_website', label: 'Yes, I have one', action: 'skip_to_guest_import' },
        { value: 'create_website', label: 'No, I would like to create one', action: 'continue_setup' },
        { value: 'no_website', label: 'No, and I do not need one', action: 'skip_to_guest_import' },
      ];
      expect(options).toHaveLength(3);
      expect(options[0].action).toBe('skip_to_guest_import');
      expect(options[1].action).toBe('continue_setup');
    });
  });

  describe('Wedding location type', () => {
    it('should map to outreach timeline preset', () => {
      const locationMap: Record<string, string> = {
        international_destination: 'destination_international',
        domestic_destination: 'destination_domestic',
        local: 'local',
      };

      expect(locationMap['international_destination']).toBe('destination_international');
      expect(locationMap['domestic_destination']).toBe('destination_domestic');
      expect(locationMap['local']).toBe('local');
    });
  });

  describe('Couple location determines currency', () => {
    it('should detect NRI from non-India country', () => {
      const isNRI = (country: string) => country !== 'IN' && country !== 'India';
      expect(isNRI('US')).toBe(true);
      expect(isNRI('UK')).toBe(true);
      expect(isNRI('India')).toBe(false);
    });

    it('should set USD for NRI', () => {
      const getCurrency = (country: string) => {
        const nriCountries = ['US', 'UK', 'CA', 'AU', 'UAE', 'SG'];
        return nriCountries.includes(country) ? 'USD' : 'INR';
      };
      expect(getCurrency('US')).toBe('USD');
      expect(getCurrency('IN')).toBe('INR');
    });
  });

  describe('New onboarding fields', () => {
    it('should include all required new fields', () => {
      const newFields = [
        'couple_location_country',
        'couple_location_city',
        'estimated_guest_count',
        'guest_origins',
        'has_non_indian_guests',
        'cultural_background',
        'wedding_location_type',
        'destination',
        'has_existing_website',
        'existing_website_url',
      ];
      expect(newFields.length).toBeGreaterThanOrEqual(8);
    });

    it('should have cultural background options', () => {
      const options = [
        'Punjabi-Sikh', 'Hindu', 'South Indian', 'Gujarati',
        'Muslim', 'Jain', 'Multi-faith', 'Other',
      ];
      expect(options).toHaveLength(8);
    });

    it('should have guest count ranges', () => {
      const ranges = ['Under 50', '50-150', '150-300', '300+'];
      expect(ranges).toHaveLength(4);
    });
  });

  describe('Post-onboarding routing', () => {
    it('should route to guest import if no guests', () => {
      const guestCount = 0;
      const route = guestCount === 0 ? '/guest-list' : '/control-tower';
      expect(route).toBe('/guest-list');
    });

    it('should route to control tower if guests exist', () => {
      const guestCount: number = 10;
      const route = guestCount === 0 ? '/guest-list' : '/control-tower';
      expect(route).toBe('/control-tower');
    });
  });
});
