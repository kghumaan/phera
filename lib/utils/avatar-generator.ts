import { createAvatar } from '@dicebear/core';
import { notionists, personas, funEmoji, shapes } from '@dicebear/collection';

// Available avatar styles - simplified for type safety
export const AVATAR_STYLES = [
  'notionists',
  'personas', 
  'funEmoji',
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
}

/**
 * Generate a unique avatar using DiceBear
 */
export function generateAvatar({ 
  seed, 
  style = 'notionists', 
  size = 128 
}: AvatarOptions): GeneratedAvatar {
  let avatar;

  // Handle each style explicitly to avoid TypeScript issues
  switch (style) {
    case 'notionists':
      avatar = createAvatar(notionists, {
        seed,
        size,
        backgroundColor: ['transparent'],
      });
      break;
    case 'personas':
      avatar = createAvatar(personas, {
        seed,
        size,
        backgroundColor: ['transparent'],
      });
      break;
    case 'funEmoji':
      avatar = createAvatar(funEmoji, {
        seed,
        size,
        backgroundColor: ['transparent'],
      });
      break;
    case 'shapes':
      avatar = createAvatar(shapes, {
        seed,
        size,
        backgroundColor: ['transparent'],
      });
      break;
    default:
      avatar = createAvatar(notionists, {
        seed,
        size,
        backgroundColor: ['transparent'],
      });
  }

  const svg = avatar.toString();
  const dataUri = avatar.toDataUri();

  return {
    svg,
    dataUri,
    style,
    seed
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
  
  // Choose style based on name characteristics or default to notionists
  const style = preferredStyle || chooseStyleForGuest(name, email);
  
  return generateAvatar({ seed, style });
}

/**
 * Intelligently choose avatar style based on guest data
 */
function chooseStyleForGuest(name?: string, email?: string): AvatarStyleKey {
  if (!name && !email) return 'notionists';
  
  const identifier = (name || email || '').toLowerCase();
  
  // Simple hashing to distribute styles
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    const char = identifier.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  const index = Math.abs(hash) % AVATAR_STYLES.length;
  
  return AVATAR_STYLES[index];
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
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#FFA07A', '#98D8C8', '#6C5CE7', '#FDCB6E'
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
} 