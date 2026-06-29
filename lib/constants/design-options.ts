/**
 * Centralized design-option metadata shared by the Look & Feel editor and the
 * Website Template gallery.
 *
 * Historically the colour list and the free-tier counts lived inline inside
 * `app/admin/[weddingSlug]/look-and-feel/page.tsx`. They now live here so the
 * template gallery can compute pro-tier gating with the *exact* same rules the
 * editor uses — one source of truth, no drift.
 */

import { BACKGROUND_UI_OPTIONS, FRAME_UI_OPTIONS } from './images';
import { COLORS } from '@/lib/theme/tokens';

// Number of free (non-Pro) options for the basic plan. Options beyond these
// indices in their respective UI arrays are Pro-only.
export const FREE_BACKGROUND_COUNT = 4;
export const FREE_COLOR_COUNT = 5;
export const FREE_FRAME_COUNT = 4;

export interface ThemeColorOption {
  name: string;
  value: string;
}

// Primary theme colours, in display order. First FREE_COLOR_COUNT are free.
//
// NOTE: these are guest-website palette VALUES the couple picks for their own
// site (RSVP buttons, accents) — a content catalog, not Phera admin chrome.
// The raw hex literals are intentional and live here (not in lib/theme/tokens)
// for that reason; only Rose/Black happen to coincide with brand tokens.
export const THEME_COLOR_OPTIONS: ThemeColorOption[] = [
  { name: 'Rose', value: COLORS.brand.primary },
  { name: 'Black', value: COLORS.text.strong },
  { name: 'Plum', value: '#59114D' },
  { name: 'Ocean', value: '#004550' },
  { name: 'Maroon', value: '#941C28' },
  { name: 'Purple', value: '#AC3FBA' },
  { name: 'Sky', value: '#6290C8' },
  { name: 'Teal', value: '#489991' },
  { name: 'Green', value: '#76B041' },
  { name: 'Forest', value: '#59814B' },
  { name: 'Orange', value: '#DF6507' },
  { name: 'Amber', value: '#FA9A00' },
];

/** Look up a theme colour value by its display name. Throws if unknown. */
export function themeColorValue(name: string): string {
  const found = THEME_COLOR_OPTIONS.find((c) => c.name === name);
  if (!found) throw new Error(`Unknown theme color: ${name}`);
  return found.value;
}

export interface DesignTierInput {
  background_image?: string | null;
  primary_color?: string | null;
  frame_image_url?: string | null;
  /** True when the user uploaded their own background (always allowed). */
  hasCustomBackground?: boolean;
}

/**
 * Returns true when a design selection uses any Pro-tier asset (a background,
 * colour, or frame past the free cutoff). A custom uploaded background never
 * counts as Pro. Mirrors the gating logic in the Look & Feel editor.
 */
export function designUsesProAssets(input: DesignTierInput): boolean {
  const bgIndex = BACKGROUND_UI_OPTIONS.findIndex((b) => b.url === input.background_image);
  const colorIndex = THEME_COLOR_OPTIONS.findIndex((c) => c.value === input.primary_color);
  const frameIndex = FRAME_UI_OPTIONS.findIndex((f) => f.url === input.frame_image_url);

  return (
    (bgIndex >= FREE_BACKGROUND_COUNT && !input.hasCustomBackground) ||
    colorIndex >= FREE_COLOR_COUNT ||
    frameIndex >= FREE_FRAME_COUNT
  );
}
