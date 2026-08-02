import { createAvatar } from '@dicebear/core';
import { shapes } from '@dicebear/collection';

// Available avatar styles - switched exclusively to 'shapes'
export const AVATAR_STYLES = [
  'shapes'
] as const;

export type AvatarStyleKey = typeof AVATAR_STYLES[number];

interface AvatarOptions {
  seed: string;
  style?: AvatarStyleKey;
  size?: number;
}

interface GeneratedAvatar {
  svg: string;
  dataUri: string;
  style: AvatarStyleKey;
  seed: string;
  color: string;
}

/**
 * Generate a unique avatar using DiceBear
 */
export function generateAvatar({
  seed,
  style = 'shapes',
  size = 128
}: AvatarOptions): GeneratedAvatar {
  const avatar = createAvatar(shapes, {
    seed,
    size,
    backgroundColor: ['transparent'],
  });

  const svg = avatar.toString();
  const dataUri = avatar.toDataUri();
  const color = generateFallbackColor(seed);

  return {
    svg,
    dataUri,
    style,
    seed,
    color
  };
}

/**
 * Generate avatar for a guest based on their data
 */
export function generateGuestAvatar(
  email: string,
  name?: string,
  preferredStyle?: AvatarStyleKey
): GeneratedAvatar {
  // Use email as primary seed for consistency
  const seed = email.toLowerCase().trim();

  // We only use 'shapes' now
  const style = 'shapes';

  return generateAvatar({ seed, style });
}

/**
 * Intelligently choose avatar style based on guest data
 */
function chooseStyleForGuest(name?: string, email?: string): AvatarStyleKey {
  return 'shapes';
}

/**
 * Get avatar data URI from stored SVG
 */
export function svgToDataUri(svg: string): string {
  const base64 = btoa(unescape(encodeURIComponent(svg)));
  return `data:image/svg+xml;base64,${base64}`;
}

/**
 * Validate if stored avatar data is still valid
 */
export function isValidAvatarData(avatarSvg?: string, avatarSeed?: string): boolean {
  return !!(avatarSvg && avatarSeed && avatarSvg.includes('<svg'));
}

/**
 * Generate fallback initials-based background color (for backup)
 */
export function generateFallbackColor(name: string): string {
  // Brand PALETTE mid/deep stops (rani/sky/plum/butter) — dark enough for
  // white initials. Keep in sync with mobile AVATAR_COLORS (hooks.ts).
  const colors = [
    '#E45E78', '#2C9DBA', '#805591', '#DC8409', '#C71F51',
    '#185767', '#A792AF', '#F4AA2A', '#70103D', '#4B2759'
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}