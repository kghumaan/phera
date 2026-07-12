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

// ─── Color scales ───────────────────────────────────────────────────
// Mirror of the designer's Figma "Color Styles" (Phera.io file, exported
// 2026-07-05). These are the raw ramps; the semantic COLORS below resolve
// to steps in these scales. Reach for a scale directly only when a
// component needs a specific step (e.g. tag pills = 100 bg + 700/800 text).

export const SCALES = {
  /** Primary — Rani Pink. 500 is the brand pink. */
  raniPink: {
    50: '#FFF7F9',
    100: '#F8D8DE',
    200: '#F2B1BE',
    300: '#EA8599',
    400: '#E45E78',
    500: '#DE3F5E',
    600: '#C71F51',
    700: '#9D174D',
    800: '#70103D',
    900: '#4C0A2C',
    950: '#360721',
  },
  /** Secondary — Sky Blue. */
  skyBlue: {
    50: '#EEF9FB',
    100: '#DAF1F6',
    200: '#B5E2EE',
    300: '#8BD2E4',
    400: '#66C4DB',
    500: '#49B9D4',
    600: '#2C9DBA',
    700: '#227A91',
    800: '#185767',
    900: '#103B46',
    950: '#0C2A32',
  },
  /** Secondary — Plum. */
  plum: {
    50: '#F5F3F6',
    100: '#EAE5EB',
    200: '#D4CAD8',
    300: '#BCADC2',
    400: '#A792AF',
    500: '#967EA0',
    600: '#805591',
    700: '#663C77',
    800: '#4B2759',
    900: '#33193E',
    950: '#25112D',
  },
  /** Secondary — Butter Yellow. */
  butterYellow: {
    50: '#FEF9EC',
    100: '#FCF1D4',
    200: '#F9E2A9',
    300: '#F6D079',
    400: '#F4BC4E',
    500: '#F4AA2A',
    600: '#DC8409',
    700: '#AC6206',
    800: '#7C4204',
    900: '#552A02',
    950: '#3C1D02',
  },
  /** Primary neutrals — "Black" ramp. `base` is the full-strength ink. */
  black: {
    base: '#141414',
    900: '#1F1F1F',
    800: '#303030',
    700: '#474747',
    600: '#686868',
    500: '#858585',
    400: '#969696',
    300: '#A8A8A8',
    200: '#BCBCBC',
    100: '#D6D6D6',
    50: '#EBEBEB',
  },
  /** White/warm-cream opacities for dark or photo backgrounds. */
  whiteAlpha: {
    100: 'rgba(255, 255, 255, 1)',
    80: 'rgba(255, 255, 255, 0.8)',
    72: 'rgba(247, 244, 236, 0.7)',
    56: 'rgba(247, 244, 236, 0.56)',
    32: 'rgba(247, 244, 236, 0.32)',
    24: 'rgba(247, 244, 236, 0.24)',
    12: 'rgba(247, 244, 236, 0.12)',
    8: 'rgba(247, 244, 236, 0.08)',
    4: 'rgba(247, 244, 236, 0.04)',
  },
} as const;

// ─── Colors ─────────────────────────────────────────────────────────

export const COLORS = {
  brand: {
    primary: SCALES.raniPink[500],
    primaryHover: SCALES.raniPink[600],
    primaryDisabled: 'rgba(222, 63, 94, 0.35)',
    primarySubtle: 'rgba(222, 63, 94, 0.08)',
    primaryWash: 'rgba(222, 63, 94, 0.04)',
    primaryBorder: 'rgba(222, 63, 94, 0.18)',
  },
  text: {
    strong: SCALES.black.base,
    muted: SCALES.black[700],
    subtle: SCALES.black[600],
    faint: SCALES.black[400],
    placeholder: SCALES.black[200],
    inverse: '#ffffff',
  },
  bg: {
    white: '#ffffff',
    muted: '#FAFAFA',
    subtle: '#F8F8F8',
    wash: 'rgba(0, 0, 0, 0.03)',
    // Warm cream "paper" — the scales' warm-white base (whiteAlpha stops
    // 72↓ are this color at opacity). Base for textured sections.
    paper: '#F7F4EC',
  },
  border: {
    faint: 'rgba(0, 0, 0, 0.06)',
    light: 'rgba(0, 0, 0, 0.08)',
    default: 'rgba(0, 0, 0, 0.15)',
    strong: 'rgba(0, 0, 0, 0.23)',
  },
  accent: {
    // success/danger stay semantic red/green — the brand scales have no
    // green, and danger is reserved for status dots (never buttons).
    success: '#10B981',
    successBg: '#E8F5E9',
    successText: '#2E7D32',
    warning: SCALES.butterYellow[500],
    warningBg: SCALES.butterYellow[50],
    warningText: SCALES.butterYellow[700],
    danger: '#EF4444',
    dangerBg: '#FFEBEE',
    dangerText: '#C62828',
    info: SCALES.skyBlue[600],
    infoBg: SCALES.skyBlue[50],
    infoText: SCALES.skyBlue[700],
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
    bride: SCALES.raniPink[500],   // brand pink
    groom: SCALES.skyBlue[600],    // sky blue (designer secondary)
    both: SCALES.plum[600],        // plum (designer secondary)
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

// ─── External brand marks ───────────────────────────────────────────

/** Third-party brand colors we render verbatim (the Google "G" on OAuth
 *  buttons). These are THEIR palettes, not ours — never use for Phera UI. */
export const EXTERNAL_BRAND = {
  googleBlue: '#4285F4',
  googleGreen: '#34A853',
  googleYellow: '#FBBC05',
  googleRed: '#EA4335',
} as const;

// ─── Convenience re-exports for common patterns ─────────────────────

/** Pink focus ring used across all inputs. */
export const INPUT_FOCUS_BORDER = {
  borderColor: COLORS.brand.primary,
  borderWidth: '2px',
};
