/**
 * Mirror of web `lib/utils/tag-color.ts` (main's designer version) —
 * deterministic tag → color mapping, same hash, same four entries, so a
 * tag renders the same color on web and mobile.
 * `tests/token-sync.test.ts` enforces the outputs stay identical.
 */

import { COLORS, PALETTE } from '@/lib/theme/tokens';

export interface TagColor {
  bg: string;
  fg: string;
  border: string;
}

export const TAG_PALETTE: TagColor[] = [
  { bg: PALETTE.raniPink[100], fg: PALETTE.raniPink[700], border: PALETTE.raniPink[200] },
  { bg: PALETTE.skyBlue[100], fg: PALETTE.skyBlue[800], border: PALETTE.skyBlue[200] },
  { bg: PALETTE.plum[100], fg: PALETTE.plum[800], border: PALETTE.plum[200] },
  { bg: PALETTE.butterYellow[100], fg: PALETTE.butterYellow[600], border: PALETTE.butterYellow[200] },
];

const NEUTRAL: TagColor = {
  bg: PALETTE.black[50],
  fg: COLORS.text.strong,
  border: PALETTE.black[100],
};

export function getTagColor(tag: string | null | undefined): TagColor {
  if (!tag) return NEUTRAL;
  const key = tag.trim().toLowerCase();
  if (!key) return NEUTRAL;
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return TAG_PALETTE[hash % TAG_PALETTE.length]!;
}

/** Web avatar-generator parity: same 10 palette stops, same hash. */
export const AVATAR_COLORS = [
  '#E45E78', '#2C9DBA', '#805591', '#DC8409', '#C71F51',
  '#185767', '#A792AF', '#F4AA2A', '#70103D', '#4B2759',
] as const;

export function generateFallbackColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]!;
}
