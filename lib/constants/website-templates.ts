/**
 * Curated "starting point" website templates for the Look & Feel editor.
 *
 * Each template is a permutation of the design options the editor already
 * exposes — a background, a primary colour, a couple-name font, and a photo
 * frame. Applying one just sets those four fields; the guest site renders it
 * exactly as if the couple had picked each option by hand.
 *
 * IMPORTANT: every value below MUST be a real, selectable option:
 *   - background_image → a url in BACKGROUND_UI_OPTIONS
 *   - frame_image_url  → a url in FRAME_UI_OPTIONS
 *   - couple_name_font → an id in COUPLE_NAME_FONTS
 *   - primary_color    → a value in THEME_COLOR_OPTIONS
 * `tests/website-templates.test.ts` enforces this. Templates intentionally do
 * NOT touch website_layout or the couple's own photos.
 *
 * Templates 1 & 2 are confirmed against the designer's Figma (Phera.io,
 * node 459:991 / 459:1078). Templates 3–6 are tasteful existing-option combos
 * (one per remaining font) pending a visual check of the other Figma frames —
 * see TODO below.
 *
 * TODO(figma): verify combos for templates 3–6 against the designer's
 * remaining mockups (Aboreto / Outfit / Bayon / Cormorant Upright frames) once
 * the Figma MCP rate limit resets. Updating is a pure data change here.
 */

import { BACKGROUNDS, FRAMES } from './images';
import { themeColorValue } from './design-options';

export interface WebsiteTemplateConfig {
  background_image: string;
  primary_color: string;
  couple_name_font: string;
  frame_image_url: string;
}

export interface WebsiteTemplate {
  id: string;
  name: string;
  /** Short, evocative one-liner shown under the template name. */
  description: string;
  config: WebsiteTemplateConfig;
}

export const WEBSITE_TEMPLATES: WebsiteTemplate[] = [
  {
    id: 'timeless',
    name: 'Timeless',
    description: 'Soft blue skies, classic serif, ornate gold frame',
    config: {
      background_image: BACKGROUNDS.BLUE_CLOUDS,
      primary_color: themeColorValue('Rose'),
      couple_name_font: 'instrument-serif',
      frame_image_url: FRAMES.FRAME_4,
    },
  },
  {
    id: 'heritage',
    name: 'Heritage',
    description: 'Pearl ground, block-print frame, deep plum accents',
    config: {
      background_image: BACKGROUNDS.PEARL,
      primary_color: themeColorValue('Plum'),
      couple_name_font: 'cormorant',
      frame_image_url: FRAMES.FRAME_12,
    },
  },
  {
    id: 'royal-gold',
    name: 'Royal Gold',
    description: 'Marble and gold, stately caps serif, maroon highlights',
    config: {
      background_image: BACKGROUNDS.MARBLE_GOLD,
      primary_color: themeColorValue('Maroon'),
      couple_name_font: 'forum',
      frame_image_url: FRAMES.FRAME_11,
    },
  },
  {
    id: 'modern-ivory',
    name: 'Modern Ivory',
    description: 'Moonstone shimmer, clean sans, ivory carved frame',
    config: {
      background_image: BACKGROUNDS.MOONSTONE_SHIMMER,
      primary_color: themeColorValue('Black'),
      couple_name_font: 'tenor-sans',
      frame_image_url: FRAMES.FRAME_7,
    },
  },
  {
    id: 'rose-garden',
    name: 'Rose Garden',
    description: 'Rose quartz, romantic script, pressed-floral frame',
    config: {
      background_image: BACKGROUNDS.ROSE_QUARTZ,
      primary_color: themeColorValue('Rose'),
      couple_name_font: 'ballet',
      frame_image_url: FRAMES.FRAME_5,
    },
  },
  {
    id: 'sage-serenity',
    name: 'Sage Serenity',
    description: 'Jade calm, formal script, painted floral frame',
    config: {
      background_image: BACKGROUNDS.JADE,
      primary_color: themeColorValue('Ocean'),
      couple_name_font: 'petit-formal-script',
      frame_image_url: FRAMES.FRAME_9,
    },
  },
];
