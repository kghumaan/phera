/**
 * Phera design tokens — React Native port of `lib/theme/tokens.ts` (web).
 *
 * Same rules as the web app: every color, radius, font family, or shadow in
 * mobile code resolves back to this file. Never inline hex.
 *
 * Color values MUST stay byte-identical to the web token file —
 * `tests/token-sync.test.ts` enforces this by parsing both files.
 * RN-specific differences: radii are numbers (not '12px'), fonts are the
 * expo-google-fonts family names (not CSS vars), shadows are style objects.
 */

// ─── Colors (mirror of web COLORS — keep in sync) ───────────────────

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
    champagne: '#D1B99F',
    maroon: '#800020',
    saffron: '#FF9933',
    coral: '#FF6B6B',
    teal: '#20C997',
    purple: '#6C5CE7',
  },
  side: {
    bride: '#DE3F5E',
    groom: '#3b82f6',
    both: '#8b5cf6',
  },
} as const;

// ─── Radii (numbers, RN-style) ──────────────────────────────────────

export const RADII = {
  sm: 8,
  md: 12, // buttons, inputs, small cards — admin default
  lg: 16, // feature cards
  xl: 20, // hero / highlight cards
  cta: 24, // pronounced guest CTAs ("View Details", "RSVP")
  dialog: 24, // modals / sheets
  pill: 999,
} as const;

// ─── Fonts ──────────────────────────────────────────────────────────
// Family names match the exports of @expo-google-fonts/outfit and
// @expo-google-fonts/instrument-serif loaded in the root layout.
// RN needs an explicit family per weight (no synthetic bolding for
// custom fonts) — use `fontForWeight()` or <PheraText weight=…>.

export const FONT = {
  regular: 'Outfit_400Regular',
  medium: 'Outfit_500Medium',
  semibold: 'Outfit_600SemiBold',
  bold: 'Outfit_700Bold',
  display: 'InstrumentSerif_400Regular',
  displayItalic: 'InstrumentSerif_400Regular_Italic',
} as const;

export type FontWeight = 400 | 500 | 600 | 700;

export function fontForWeight(weight: FontWeight): string {
  switch (weight) {
    case 700:
      return FONT.bold;
    case 600:
      return FONT.semibold;
    case 500:
      return FONT.medium;
    default:
      return FONT.regular;
  }
}

// ─── Type scale (numbers = RN points; 14 is the readable minimum) ───

export const TEXT = {
  sm: 14, // floor for body copy, labels, captions
  base: 16, // default body
  lg: 18,
  xl: 20, // small headings
  '2xl': 24, // medium headings (still Outfit)
  '3xl': 32, // USE Instrument Serif at this size and above
  '4xl': 40,
  '5xl': 48,
} as const;

/** Any size ≥ this must use FONT.display (Instrument Serif). */
export const DISPLAY_SIZE_THRESHOLD = 32;

// ─── Shadows (RN style objects; work on iOS + Android + web) ────────

export const SHADOWS = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  popover: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
  },
  dialog: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 32,
    elevation: 8,
  },
} as const;

// ─── Layout ─────────────────────────────────────────────────────────

export const SPACING = {
  /** Default horizontal screen padding (matches web mobile container 20px). */
  screenX: 20,
  /** Minimum touch target (Apple HIG). */
  touchTarget: 44,
} as const;
