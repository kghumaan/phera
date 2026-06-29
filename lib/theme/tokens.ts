/**
 * Phera design tokens — single source of truth.
 *
 * Every hex literal, font family, radius, or spacing scalar in the app
 * should resolve back to something in this file. If a value doesn't exist
 * here yet, add it — don't inline.
 *
 * Guidelines:
 *   ✅  import { COLORS } from '@/lib/theme/tokens'
 *   ❌  color: '#DE3F5E'
 */

// ─── Colors ─────────────────────────────────────────────────────────

export const COLORS = {
  brand: {
    primary: '#DE3F5E',
    primaryHover: '#C8365A',
    primaryDisabled: 'rgba(222, 63, 94, 0.35)',
    primarySubtle: 'rgba(222, 63, 94, 0.08)',
    primaryWash: 'rgba(222, 63, 94, 0.04)',
    primaryBorder: 'rgba(222, 63, 94, 0.18)',
  },
  text: {
    strong: '#1a1a1a',
    muted: '#4a4a4a',
    subtle: '#6a6a6a',
    faint: '#9a9a9a',
    placeholder: '#C2C2C2',
    inverse: '#ffffff',
  },
  bg: {
    white: '#ffffff',
    muted: '#FAFAFA',
    subtle: '#F8F8F8',
    wash: 'rgba(0, 0, 0, 0.03)',
    // Warm cream "paper" — matches landing CSS var(--paper). Used as the
    // base for textured sections (e.g. landing 'full kit', vertical-scroll
    // left content panel).
    paper: '#FBF7F1',
  },
  border: {
    faint: 'rgba(0, 0, 0, 0.06)',
    light: 'rgba(0, 0, 0, 0.08)',
    default: 'rgba(0, 0, 0, 0.15)',
    strong: 'rgba(0, 0, 0, 0.23)',
  },
  accent: {
    success: '#10B981',
    successBg: '#E8F5E9',
    successText: '#2E7D32',
    warning: '#F59E0B',
    warningBg: '#FFF3E0',
    warningText: '#E65100',
    danger: '#EF4444',
    dangerBg: '#FFEBEE',
    dangerText: '#C62828',
    info: '#3B82F6',
    infoBg: 'rgba(59, 130, 246, 0.08)',
    infoText: '#1d4ed8',
  },
  cultural: {
    gold: '#D4AF37',
    champagne: '#D1B99F',   // warm beige accent for decorative dividers
    maroon: '#800020',
    saffron: '#FF9933',
    coral: '#FF6B6B',
    teal: '#20C997',
    purple: '#6C5CE7',
  },
  side: {
    bride: '#DE3F5E',   // brand pink
    groom: '#3b82f6',   // blue
    both: '#8b5cf6',   // purple
  },
  // Brand-accurate WhatsApp palette. Used ONLY in the WhatsApp message
  // preview component so the mockup looks true to what guests will see.
  whatsapp: {
    bg: '#EFE7DE',              // chat background base (shows under doodle image)
    bubble: '#DCF8C6',          // outgoing message bubble (not used in guest-POV preview)
    header: '#075E54',          // legacy light-teal header
    headerDark: '#202C33',      // dark header — matches landing concierge mockup
    headerSubtext: '#8696a0',   // "online" status text
    bubbleText: '#0b141a',      // bubble body text
    timestampText: '#667781',   // bubble timestamp + checkmark text
    dateText: '#54656F',        // "Today" separator text
    verifiedBlue: '#2979FF',    // blue verified badge next to sender name
    readCheck: '#53bdeb',       // blue double-check (read receipt)
  },
  // Vendor-directory category accents (avatars/badges on the admin marketplace
  // and public /vendors). A content palette, not admin chrome.
  vendorCategory: {
    venue: '#D4AF37',
    hotel: '#3B82F6',
    photographer: '#DE3F5E',
    videographer: '#7C3AED',
    dj: '#0E7C5B',
    live_band: '#D97706',
    mehendi_artist: '#B45309',
    makeup_hair: '#BE185D',
    decorator_florist: '#059669',
    wedding_planner: '#1D4ED8',
    catering: '#92400E',
    designer: '#6B21A8',
  },
  // Social brand colours, for outbound links.
  social: {
    instagram: '#E1306C',
  },
} as const;

// ─── Radii ──────────────────────────────────────────────────────────

export const RADII = {
  sm: '8px',
  md: '12px',      // buttons, inputs, small cards — admin default
  lg: '16px',      // feature cards
  xl: '20px',      // hero / highlight cards
  cta: '24px',     // pronounced CTAs (mobile guest "View Details", "RSVP")
  dialog: '24px',  // modals / popovers
  pill: '999px',
} as const;

// ─── Fonts ──────────────────────────────────────────────────────────

export const FONTS = {
  body: 'var(--font-outfit), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  display: 'var(--font-instrument-serif), serif',
} as const;

// ─── Type scale ─────────────────────────────────────────────────────
// 14px (0.875rem) is the MINIMUM size for any readable text in the app.
// Do not inline a fontSize smaller than TEXT.sm. For one-off numeric
// ornaments (badges, dots) it's acceptable to go smaller — but treat
// that as an exception, not the default.

export const TEXT = {
  sm: '0.875rem',   // 14px — floor for body copy, labels, captions
  base: '1rem',     // 16px — default body
  lg: '1.125rem',   // 18px — emphasised body
  xl: '1.25rem',    // 20px — small headings
  '2xl': '1.5rem',  // 24px — medium headings (still Outfit)
  '3xl': '2rem',    // 32px — USE Instrument Serif at this size and above
  '4xl': '2.5rem',
  '5xl': '3rem',
} as const;

/** Any size ≥ this threshold must use `FONTS.display` (Instrument Serif). */
export const DISPLAY_SIZE_THRESHOLD_REM = 2;

// ─── Shadows ────────────────────────────────────────────────────────

export const SHADOWS = {
  none: 'none',
  card: '0 1px 2px rgba(0, 0, 0, 0.04)',
  popover: '0 8px 24px rgba(0, 0, 0, 0.08)',
  dialog: '0 8px 32px rgba(0, 0, 0, 0.08)',
} as const;

// ─── Section layout ─────────────────────────────────────────────────
// Mirrors the design package's `--section-pad` CSS var: 140px standard,
// 80px on small viewports. Used as the canonical `py` for every landing
// section so vertical rhythm stays uniform without per-component magic
// numbers.

export const SECTION = {
  py: { xs: '80px', md: '140px' },
  /** Container max-width — design's `--container-max`. */
  maxWidth: 1280,
  /** Container side padding — design's `.container { padding: 0 32px }`,
   *  with the `@media (max-width: 768px) { padding: 0 20px }` override. */
  px: { xs: '20px', md: '32px' },
} as const;

// ─── Transitions ────────────────────────────────────────────────────

export const TRANSITIONS = {
  fast: '0.15s ease',
  default: '0.2s ease',
  slow: '0.3s ease',
} as const;

// ─── Convenience re-exports for common patterns ─────────────────────

/** Pink focus ring used across all inputs. */
export const INPUT_FOCUS_BORDER = {
  borderColor: COLORS.brand.primary,
  borderWidth: '2px',
};
