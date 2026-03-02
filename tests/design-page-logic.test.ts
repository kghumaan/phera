import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Design page logic', () => {
  // ─── Dirty tracking ─────────────────────────────────────────────────

  describe('dirty tracking', () => {
    // Replicate the dirty-check logic from the design page useEffect
    function isDirty(current: Record<string, any>, initial: Record<string, any> | null): boolean {
      if (!initial) return false;
      return JSON.stringify(current) !== JSON.stringify(initial);
    }

    const baseData = {
      pin_entry_text: "You're invited!",
      pin_entry_subtitle_text: 'Enter your code',
      pin_entry_background: '/bg.jpg',
      pin_entry_primary_color: '#141414',
      pin_entry_font_color: '#000000',
      pin_entry_button_font_color: '#FFFFFF',
      background_image: '/main-bg.jpg',
      primary_color: '#DE3F5E',
      website_layout: 'nested',
      frame_image_url: null,
      couple_images: [],
    };

    it('should not be dirty when initialDesignData is null', () => {
      expect(isDirty(baseData, null)).toBe(false);
    });

    it('should not be dirty when data matches initial', () => {
      expect(isDirty({ ...baseData }, { ...baseData })).toBe(false);
    });

    it('should detect dirty when a text field changes', () => {
      const changed = { ...baseData, pin_entry_text: 'Welcome!' };
      expect(isDirty(changed, baseData)).toBe(true);
    });

    it('should detect dirty when primary color changes', () => {
      const changed = { ...baseData, primary_color: '#FF0000' };
      expect(isDirty(changed, baseData)).toBe(true);
    });

    it('should detect dirty when couple_images changes', () => {
      const changed = { ...baseData, couple_images: ['https://example.com/photo.jpg'] };
      expect(isDirty(changed, baseData)).toBe(true);
    });

    it('should detect dirty when frame_image_url changes', () => {
      const changed = { ...baseData, frame_image_url: '/frames/frame-2.png' };
      expect(isDirty(changed, baseData)).toBe(true);
    });

    it('should detect dirty when website_layout changes', () => {
      const changed = { ...baseData, website_layout: 'infinite_scroll' };
      expect(isDirty(changed, baseData)).toBe(true);
    });

    it('should NOT detect dirty for same couple_images content in different array refs', () => {
      const initial = { ...baseData, couple_images: ['img1.jpg', 'img2.jpg'] };
      const current = { ...baseData, couple_images: ['img1.jpg', 'img2.jpg'] };
      expect(isDirty(current, initial)).toBe(false);
    });
  });

  // ─── Couple image array compaction on delete ────────────────────────

  describe('couple image delete and compaction', () => {
    // Replicate the delete handler logic from the design page
    function deleteAndCompact(coupleImages: (string | null)[], deleteIndex: number): (string | null)[] {
      const remaining = coupleImages.filter((_, i) => i !== deleteIndex).filter(i => i);
      while (remaining.length < 6) remaining.push(null);
      return remaining;
    }

    it('should remove image at specified index', () => {
      const images: (string | null)[] = ['img1.jpg', 'img2.jpg', null, null, null, null];
      const result = deleteAndCompact(images, 0);
      expect(result[0]).toBe('img2.jpg');
      expect(result.filter(img => img !== null)).toHaveLength(1);
    });

    it('should shift remaining images forward (new Main)', () => {
      const images: (string | null)[] = ['img1.jpg', 'img2.jpg', 'img3.jpg', null, null, null];
      const result = deleteAndCompact(images, 0);
      expect(result[0]).toBe('img2.jpg');
      expect(result[1]).toBe('img3.jpg');
    });

    it('should always return exactly 6 slots', () => {
      const images: (string | null)[] = ['img1.jpg', null, null, null, null, null];
      const result = deleteAndCompact(images, 0);
      expect(result).toHaveLength(6);
    });

    it('should handle deleting the last remaining image', () => {
      const images: (string | null)[] = ['img1.jpg', null, null, null, null, null];
      const result = deleteAndCompact(images, 0);
      expect(result.every(img => img === null)).toBe(true);
    });

    it('should handle deleting a middle image', () => {
      const images: (string | null)[] = ['img1.jpg', 'img2.jpg', 'img3.jpg', null, null, null];
      const result = deleteAndCompact(images, 1);
      expect(result[0]).toBe('img1.jpg');
      expect(result[1]).toBe('img3.jpg');
      expect(result[2]).toBeNull();
    });

    it('should compact sparse arrays (skip nulls)', () => {
      const images: (string | null)[] = ['img1.jpg', null, 'img3.jpg', null, 'img5.jpg', null];
      const result = deleteAndCompact(images, 0);
      // After removing index 0 and compacting: img3, img5, null, null, null, null
      expect(result[0]).toBe('img3.jpg');
      expect(result[1]).toBe('img5.jpg');
      expect(result[2]).toBeNull();
    });
  });

  // ─── Load data: couple images hydration ─────────────────────────────

  describe('couple images hydration from wedding data', () => {
    // Replicate the loadData logic for couple_images
    function hydrateCoupleImages(wedding: {
      couple_images?: any;
      couple_image_url?: string | null;
    }): (string | null)[] {
      let loadedCoupleImages: (string | null)[] = Array(6).fill(null);
      if (wedding.couple_images && Array.isArray(wedding.couple_images)) {
        const images: (string | null)[] = [...wedding.couple_images];
        while (images.length < 6) images.push(null);
        loadedCoupleImages = images.slice(0, 6);
      } else if (wedding.couple_image_url) {
        loadedCoupleImages = [wedding.couple_image_url, null, null, null, null, null];
      }
      return loadedCoupleImages;
    }

    it('should return 6 null slots when no images exist', () => {
      const result = hydrateCoupleImages({});
      expect(result).toHaveLength(6);
      expect(result.every(img => img === null)).toBe(true);
    });

    it('should load couple_images array and pad to 6', () => {
      const result = hydrateCoupleImages({ couple_images: ['a.jpg', 'b.jpg'] });
      expect(result).toHaveLength(6);
      expect(result[0]).toBe('a.jpg');
      expect(result[1]).toBe('b.jpg');
      expect(result[2]).toBeNull();
    });

    it('should truncate couple_images to 6 slots', () => {
      const images = ['1.jpg', '2.jpg', '3.jpg', '4.jpg', '5.jpg', '6.jpg', '7.jpg', '8.jpg'];
      const result = hydrateCoupleImages({ couple_images: images });
      expect(result).toHaveLength(6);
      expect(result[5]).toBe('6.jpg');
    });

    it('should fallback to couple_image_url when couple_images is undefined', () => {
      const result = hydrateCoupleImages({ couple_image_url: 'single.jpg' });
      expect(result[0]).toBe('single.jpg');
      expect(result.filter(img => img !== null)).toHaveLength(1);
    });

    it('should prefer couple_images over couple_image_url', () => {
      const result = hydrateCoupleImages({
        couple_images: ['array.jpg'],
        couple_image_url: 'single.jpg',
      });
      expect(result[0]).toBe('array.jpg');
    });

    it('should ignore non-array couple_images and fallback to url', () => {
      const result = hydrateCoupleImages({
        couple_images: 'not-an-array' as any,
        couple_image_url: 'fallback.jpg',
      });
      expect(result[0]).toBe('fallback.jpg');
    });
  });

  // ─── initialDesignData shape ────────────────────────────────────────

  describe('initialDesignData construction', () => {
    function buildInitialDesignData(wedding: any) {
      const defaultText = "You're invited!";
      const defaultSubtitle = 'Enter your invitation code to see all the details and RSVP for our celebration';
      const DEFAULT_BG = '/images/backgrounds/blue-clouds.jpg';

      const loadedCoupleImages: (string | null)[] = Array(6).fill(null);
      if (wedding.couple_images && Array.isArray(wedding.couple_images)) {
        const images = [...wedding.couple_images];
        while (images.length < 6) images.push(null);
        loadedCoupleImages.splice(0, 6, ...images.slice(0, 6));
      }

      return {
        pin_entry_text: wedding.pin_entry_text || defaultText,
        pin_entry_subtitle_text: wedding.pin_entry_subtitle_text || defaultSubtitle,
        pin_entry_background: wedding.pin_entry_background || DEFAULT_BG,
        pin_entry_primary_color: wedding.pin_entry_primary_color || '#141414',
        pin_entry_font_color: wedding.pin_entry_font_color || '#000000',
        pin_entry_button_font_color: wedding.pin_entry_button_font_color || '#FFFFFF',
        background_image: wedding.background_image || DEFAULT_BG,
        primary_color: wedding.primary_color || '#DE3F5E',
        website_layout: wedding.website_layout || 'nested',
        frame_image_url: wedding.frame_image_url || null,
        couple_images: loadedCoupleImages.filter(img => img),
      };
    }

    it('should apply defaults for empty wedding data', () => {
      const result = buildInitialDesignData({});
      expect(result.pin_entry_text).toBe("You're invited!");
      expect(result.primary_color).toBe('#DE3F5E');
      expect(result.website_layout).toBe('nested');
      expect(result.frame_image_url).toBeNull();
      expect(result.couple_images).toEqual([]);
    });

    it('should use wedding values when present', () => {
      const result = buildInitialDesignData({
        pin_entry_text: 'Custom text',
        primary_color: '#FF0000',
        website_layout: 'infinite_scroll',
        frame_image_url: '/frame.png',
      });
      expect(result.pin_entry_text).toBe('Custom text');
      expect(result.primary_color).toBe('#FF0000');
      expect(result.website_layout).toBe('infinite_scroll');
      expect(result.frame_image_url).toBe('/frame.png');
    });

    it('should filter nulls from couple_images in initial data', () => {
      const result = buildInitialDesignData({
        couple_images: ['a.jpg', null, 'b.jpg'],
      });
      expect(result.couple_images).toEqual(['a.jpg', 'b.jpg']);
    });

    it('dirty check should pass after loadData sets initialDesignData', () => {
      const wedding = {
        pin_entry_text: 'Hello',
        primary_color: '#123456',
        couple_images: ['photo.jpg'],
      };
      const initial = buildInitialDesignData(wedding);
      // Simulate identical current state
      const current = { ...initial };
      expect(JSON.stringify(current)).toBe(JSON.stringify(initial));
    });
  });
});
