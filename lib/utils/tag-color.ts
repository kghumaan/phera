/**
 * Stable, deterministic tag → color mapping. The same tag string always resolves
 * to the same palette entry so family/side/group tags read consistently across
 * the guest list, room assignments, broadcasts, and anywhere else tags surface.
 *
 * Palette mirrors the Figma guest-list tag pills: bg = scale 100, text = the
 * step the designer picked per scale for AA contrast (pink 700, sky 800,
 * plum 800, butter 600). Pills render borderless; `border` is kept for hover
 * accents (e.g. TagPicker suggestions).
 */

import { COLORS, SCALES } from '@/lib/theme/tokens';

export interface TagColor {
  bg: string;
  fg: string;
  border: string;
}

const TAG_PALETTE: TagColor[] = [
  { bg: SCALES.raniPink[100],     fg: SCALES.raniPink[700],     border: SCALES.raniPink[200] },
  { bg: SCALES.skyBlue[100],      fg: SCALES.skyBlue[800],      border: SCALES.skyBlue[200] },
  { bg: SCALES.plum[100],         fg: SCALES.plum[800],         border: SCALES.plum[200] },
  { bg: SCALES.butterYellow[100], fg: SCALES.butterYellow[600], border: SCALES.butterYellow[200] },
];

const NEUTRAL: TagColor = {
  bg: SCALES.black[50],
  fg: COLORS.text.strong,
  border: SCALES.black[100],
};

export function getTagColor(tag: string | null | undefined): TagColor {
  if (!tag) return NEUTRAL;
  const key = tag.trim().toLowerCase();
  if (!key) return NEUTRAL;
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return TAG_PALETTE[hash % TAG_PALETTE.length];
}
