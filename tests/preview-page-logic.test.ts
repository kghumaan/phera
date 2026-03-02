import { describe, it, expect } from 'vitest';

// ─── Preview view types and options ──────────────────────────────────

type PreviewView = 'pin_entry' | 'no_rsvp' | 'rsvp_submitted';

const PREVIEW_VIEW_OPTIONS: { value: PreviewView; label: string }[] = [
  { value: 'pin_entry', label: 'Pin Entry Screen' },
  { value: 'no_rsvp', label: 'No RSVP Submitted' },
  { value: 'rsvp_submitted', label: 'RSVP Submitted' },
];

describe('Preview page logic', () => {
  // ─── Preview view rendering decisions ───────────────────────────────

  describe('preview view rendering', () => {
    // Replicate the rendering decision logic from PreviewContent
    function getRenderedComponents(previewView: PreviewView, websiteLayout: string, isMobile: boolean) {
      const showPinEntry = previewView === 'pin_entry';
      const useInfiniteScroll = !isMobile && websiteLayout === 'infinite_scroll';
      const showViewDetails = previewView === 'rsvp_submitted';
      const showRSVPButton = previewView === 'no_rsvp';
      const showComments = previewView === 'rsvp_submitted';
      const buttonText = previewView === 'rsvp_submitted' ? 'View Details' : 'RSVP';

      return {
        showPinEntry,
        useInfiniteScroll: !showPinEntry && useInfiniteScroll,
        showViewDetails,
        showRSVPButton,
        showComments,
        buttonText,
      };
    }

    it('should show pin entry and nothing else for pin_entry view', () => {
      const result = getRenderedComponents('pin_entry', 'nested', false);
      expect(result.showPinEntry).toBe(true);
      expect(result.useInfiniteScroll).toBe(false);
      expect(result.showComments).toBe(false);
    });

    it('should show RSVP button and hide comments for no_rsvp view', () => {
      const result = getRenderedComponents('no_rsvp', 'nested', false);
      expect(result.showPinEntry).toBe(false);
      expect(result.showRSVPButton).toBe(true);
      expect(result.showViewDetails).toBe(false);
      expect(result.showComments).toBe(false);
      expect(result.buttonText).toBe('RSVP');
    });

    it('should show View Details and comments for rsvp_submitted view', () => {
      const result = getRenderedComponents('rsvp_submitted', 'nested', false);
      expect(result.showPinEntry).toBe(false);
      expect(result.showViewDetails).toBe(true);
      expect(result.showRSVPButton).toBe(false);
      expect(result.showComments).toBe(true);
      expect(result.buttonText).toBe('View Details');
    });

    it('should use infinite scroll on desktop when layout is infinite_scroll', () => {
      const result = getRenderedComponents('rsvp_submitted', 'infinite_scroll', false);
      expect(result.useInfiniteScroll).toBe(true);
    });

    it('should NOT use infinite scroll on mobile even with infinite_scroll layout', () => {
      const result = getRenderedComponents('rsvp_submitted', 'infinite_scroll', true);
      expect(result.useInfiniteScroll).toBe(false);
    });

    it('should NOT use infinite scroll when layout is nested', () => {
      const result = getRenderedComponents('rsvp_submitted', 'nested', false);
      expect(result.useInfiniteScroll).toBe(false);
    });

    it('should NOT use infinite scroll when showing pin entry', () => {
      const result = getRenderedComponents('pin_entry', 'infinite_scroll', false);
      expect(result.useInfiniteScroll).toBe(false);
    });
  });

  // ─── Infinite scroll props based on preview view ────────────────────

  describe('infinite scroll props based on preview view', () => {
    function getInfiniteScrollProps(previewView: PreviewView) {
      return {
        hasRSVPed: previewView === 'rsvp_submitted',
        user: previewView === 'no_rsvp' ? null : { id: 'preview-user' },
        isBypassPin: true,
      };
    }

    it('should pass hasRSVPed=true and user for rsvp_submitted', () => {
      const props = getInfiniteScrollProps('rsvp_submitted');
      expect(props.hasRSVPed).toBe(true);
      expect(props.user).toEqual({ id: 'preview-user' });
    });

    it('should pass hasRSVPed=false and user=null for no_rsvp', () => {
      const props = getInfiniteScrollProps('no_rsvp');
      expect(props.hasRSVPed).toBe(false);
      expect(props.user).toBeNull();
    });

    it('should always pass isBypassPin=true', () => {
      expect(getInfiniteScrollProps('rsvp_submitted').isBypassPin).toBe(true);
      expect(getInfiniteScrollProps('no_rsvp').isBypassPin).toBe(true);
      expect(getInfiniteScrollProps('pin_entry').isBypassPin).toBe(true);
    });
  });

  // ─── ViewSwitcher visibility ────────────────────────────────────────

  describe('ViewSwitcher visibility (iframe detection)', () => {
    function shouldShowViewSwitcher(isInIframe: boolean): boolean {
      return !isInIframe;
    }

    it('should show view switcher when NOT in iframe (standalone preview)', () => {
      expect(shouldShowViewSwitcher(false)).toBe(true);
    });

    it('should hide view switcher when in iframe (admin preview panel)', () => {
      expect(shouldShowViewSwitcher(true)).toBe(false);
    });
  });

  // ─── Preview view options ───────────────────────────────────────────

  describe('PREVIEW_VIEW_OPTIONS', () => {
    it('should have exactly 3 options', () => {
      expect(PREVIEW_VIEW_OPTIONS).toHaveLength(3);
    });

    it('should include all preview view types', () => {
      const values = PREVIEW_VIEW_OPTIONS.map(o => o.value);
      expect(values).toContain('pin_entry');
      expect(values).toContain('no_rsvp');
      expect(values).toContain('rsvp_submitted');
    });

    it('should have descriptive labels', () => {
      const labels = PREVIEW_VIEW_OPTIONS.map(o => o.label);
      expect(labels).toContain('Pin Entry Screen');
      expect(labels).toContain('No RSVP Submitted');
      expect(labels).toContain('RSVP Submitted');
    });
  });

  // ─── CoupleImageDisplay logic ───────────────────────────────────────

  describe('CoupleImageDisplay image cycling', () => {
    const defaultImages = [
      '/images/couple/couple-1.jpg',
      '/images/couple/couple-2.jpg',
      '/images/couple/couple-3.jpeg',
    ];

    function getCoupleImages(coupleImageUrl: string | null): string[] {
      return coupleImageUrl ? [coupleImageUrl] : defaultImages;
    }

    function shouldCycle(images: string[]): boolean {
      return images.length > 1;
    }

    it('should use uploaded image when provided', () => {
      const images = getCoupleImages('https://example.com/my-photo.jpg');
      expect(images).toEqual(['https://example.com/my-photo.jpg']);
    });

    it('should fallback to default images when no upload', () => {
      const images = getCoupleImages(null);
      expect(images).toEqual(defaultImages);
      expect(images).toHaveLength(3);
    });

    it('should cycle when multiple images exist', () => {
      expect(shouldCycle(defaultImages)).toBe(true);
    });

    it('should NOT cycle when single uploaded image', () => {
      const images = getCoupleImages('https://example.com/photo.jpg');
      expect(shouldCycle(images)).toBe(false);
    });
  });
});
