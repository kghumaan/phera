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

// ─── Palette (mirror of web PALETTE — keep in sync) ─────────────────
// The exact brand color ramps. Every COLORS entry resolves to one of
// these stops (or a black/white opacity). Pick from here — never invent.

export const PALETTE = {
  raniPink: {
    50: '#FFF7F9',
    100: '#F8D8DE',
    200: '#F2B1BE',
    300: '#EA8599',
    400: '#E45E78',
    500: '#DE3F5E', // Rani Pink — the brand color
    600: '#C71F51',
    700: '#9D174D',
    800: '#70103D',
    900: '#4C0A2C',
    950: '#360721',
  },
  // Warm-white opacity stops. 100/80 are pure white; 72 and below are the
  // warm base #F7F4EC at decreasing opacity (washes over photos/textures).
  white: {
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
  black: {
    950: '#141414', // primary black
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
  skyBlue: {
    50: '#EEF9FB',
    100: '#DAF1F6',
    200: '#B5E2EE',
    300: '#8BD2E4',
    400: '#66C4DB',
    500: '#49B9D4', // Sky Blue
    600: '#2C9DBA',
    700: '#227A91',
    800: '#185767',
    900: '#103B46',
    950: '#0C2A32',
  },
  plum: {
    50: '#F5F3F6',
    100: '#EAE5EB',
    200: '#D4CAD8',
    300: '#BCADC2',
    400: '#A792AF',
    500: '#967EA0',
    600: '#805591',
    700: '#663C77', // Plum
    800: '#4B2759',
    900: '#33193E',
    950: '#25112D',
  },
  butterYellow: {
    50: '#FEF9EC',
    100: '#FCF1D4', // Butter Yellow
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
} as const;

// ─── Colors (mirror of web COLORS — keep in sync) ───────────────────

export const COLORS = {
  brand: {
    primary: PALETTE.raniPink[500],
    primaryHover: PALETTE.raniPink[600],
    primaryDisabled: 'rgba(222, 63, 94, 0.35)', // raniPink.500 @ 35%
    primarySubtle: 'rgba(222, 63, 94, 0.08)', // raniPink.500 @ 8%
    primaryWash: 'rgba(222, 63, 94, 0.04)', // raniPink.500 @ 4%
    primaryBorder: 'rgba(222, 63, 94, 0.18)', // raniPink.500 @ 18%
  },
  text: {
    strong: PALETTE.black[950],
    muted: PALETTE.black[700],
    subtle: PALETTE.black[600],
    faint: PALETTE.black[400],
    placeholder: PALETTE.black[200],
    inverse: '#ffffff',
  },
  bg: {
    white: '#ffffff',
    muted: '#FAFAFA',
    subtle: '#F8F8F8',
    wash: 'rgba(0, 0, 0, 0.03)',
    paper: '#F7F4EC',
  },
  border: {
    faint: 'rgba(0, 0, 0, 0.06)',
    light: 'rgba(0, 0, 0, 0.08)',
    default: 'rgba(0, 0, 0, 0.15)',
    strong: 'rgba(0, 0, 0, 0.23)',
  },
  accent: {
    // success/danger stay semantic red/green — the brand palette has no
    // green, and danger is reserved for status dots (never buttons).
    success: '#10B981',
    successBg: '#E8F5E9',
    successText: '#2E7D32',
    warning: PALETTE.butterYellow[500],
    warningBg: PALETTE.butterYellow[50],
    warningText: PALETTE.butterYellow[700],
    danger: '#EF4444',
    dangerBg: '#FFEBEE',
    dangerText: '#C62828',
    info: PALETTE.skyBlue[600],
    infoBg: PALETTE.skyBlue[50],
    infoText: PALETTE.skyBlue[700],
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
    bride: PALETTE.raniPink[500],
    groom: PALETTE.skyBlue[600],
    both: PALETTE.plum[600],
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
