import { defaultConfig } from '@tamagui/config/v5';
import { createFont, createTamagui } from 'tamagui';

import { FONT } from './src/lib/theme/tokens';

// Phera is light-only. Colors come from src/lib/theme/tokens (never theme
// dark-mode swaps), so we keep the default token/theme set for layout
// primitives and register our two brand fonts: Outfit (body, everything
// < 32px) and Instrument Serif (display, ≥ 32px).

const sizes = {
  1: 12,
  2: 14,
  3: 15,
  4: 16,
  5: 18,
  6: 20,
  7: 24,
  8: 28,
  9: 32,
  10: 40,
  11: 48,
  12: 56,
  true: 16,
} as const;

const lineHeights = Object.fromEntries(
  Object.entries(sizes).map(([k, v]) => [k, Math.round(v * 1.4)]),
) as Record<keyof typeof sizes, number>;

const bodyFont = createFont({
  family: FONT.regular,
  size: sizes,
  lineHeight: lineHeights,
  weight: { 4: '400', 5: '500', 6: '600', 7: '700', true: '400' },
  face: {
    400: { normal: FONT.regular },
    500: { normal: FONT.medium },
    600: { normal: FONT.semibold },
    700: { normal: FONT.bold },
  },
});

const displayFont = createFont({
  family: FONT.display,
  size: sizes,
  lineHeight: Object.fromEntries(
    Object.entries(sizes).map(([k, v]) => [k, Math.round(v * 1.15)]),
  ) as Record<keyof typeof sizes, number>,
  weight: { 4: '400', true: '400' },
  face: {
    400: { normal: FONT.display, italic: FONT.displayItalic },
  },
});

export const config = createTamagui({
  ...defaultConfig,
  defaultTheme: 'light',
  fonts: {
    body: bodyFont,
    heading: displayFont,
  },
});

export type AppConfig = typeof config;

declare module 'tamagui' {
  // Tamagui's documented module-augmentation pattern for typed tokens.
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface TamaguiCustomConfig extends AppConfig {}
}

export default config;
