/**
 * Stable, deterministic tag → color mapping. The same tag string always resolves
 * to the same palette entry so family/side/group tags read consistently across
 * the guest list, room assignments, broadcasts, and anywhere else tags surface.
 *
 * Palette is soft pastels tuned to sit next to the Phera brand pink without
 * clashing. We keep foreground text dark enough for AA contrast on the tint.
 */

export interface TagColor {
  bg: string;
  fg: string;
  border: string;
}

const TAG_PALETTE: TagColor[] = [
  { bg: 'rgba(244, 63, 94, 0.12)',  fg: '#9F1239', border: 'rgba(244, 63, 94, 0.28)' },   // rose
  { bg: 'rgba(59, 130, 246, 0.12)', fg: '#1E40AF', border: 'rgba(59, 130, 246, 0.28)' },  // blue
  { bg: 'rgba(16, 185, 129, 0.12)', fg: '#065F46', border: 'rgba(16, 185, 129, 0.28)' },  // emerald
  { bg: 'rgba(168, 85, 247, 0.12)', fg: '#6B21A8', border: 'rgba(168, 85, 247, 0.28)' },  // violet
  { bg: 'rgba(245, 158, 11, 0.12)', fg: '#92400E', border: 'rgba(245, 158, 11, 0.28)' },  // amber
  { bg: 'rgba(14, 165, 233, 0.12)', fg: '#0C4A6E', border: 'rgba(14, 165, 233, 0.28)' },  // sky
  { bg: 'rgba(236, 72, 153, 0.12)', fg: '#9D174D', border: 'rgba(236, 72, 153, 0.28)' },  // pink
  { bg: 'rgba(20, 184, 166, 0.12)', fg: '#134E4A', border: 'rgba(20, 184, 166, 0.28)' },  // teal
];

const NEUTRAL: TagColor = {
  bg: 'rgba(0, 0, 0, 0.05)',
  fg: '#1a1a1a',
  border: 'rgba(0, 0, 0, 0.12)',
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
