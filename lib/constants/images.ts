/**
 * Centralized image constants for Phera wedding platform
 * 
 * ✅ OPTIMIZED: All images have been compressed and resized for optimal web performance
 * Background images: 6-7MB → 130-200KB (98% reduction!)
 * Couple photos: 1.1-1.3MB → 58-75KB (95% reduction!)
 */

// Background Images - EXPANDED COLLECTION ✅
export const BACKGROUNDS = {
  // Legacy paths (DEPRECATED - use optimized versions)
  BLUE_CLOUDS_LEGACY: '/design-reference/backgrounds/BlueClouds.png',
  GREEN_LEGACY: '/design-reference/backgrounds/Green.png',
  
  // OPTIMIZED versions (USE THESE!) - 98% smaller!
  BLUE_CLOUDS: '/images/backgrounds/blue-clouds.jpg', // Optimized watercolor blue sky - 133KB @ 1920x1080
  GREEN: '/images/backgrounds/green.jpg', // 6.0MB → 199KB
  ROSE: '/images/backgrounds/rose.jpg', // Rose background
  
  // Event-specific backgrounds
  HALDI: '/images/backgrounds/haldi-optimized.jpg',
  HALDI_2: '/images/backgrounds/haldi2-optimized.jpg',
  MEHNDI: '/images/backgrounds/mehndi-optimized.jpg',
  JAGGO: '/images/backgrounds/jaggo-optimized.jpg',
  JAGGO_2: '/images/backgrounds/jaggo2-optimized.jpg',
  POOL: '/images/backgrounds/pool-optimized.jpg',
  POOL_2: '/images/backgrounds/pool2-optimized.jpg',
  
  // New AI-generated variations (to be added)
  BLUE_VARIANTS: [
    '/images/backgrounds/blue-clouds-01.jpg',
    '/images/backgrounds/blue-clouds-02.jpg',
    '/images/backgrounds/blue-clouds-03.jpg',
    '/images/backgrounds/blue-clouds-04.jpg',
    '/images/backgrounds/blue-clouds-05.jpg',
    // ... up to 20 variations
  ],
  
  GREEN_VARIANTS: [
    '/images/backgrounds/green-01.jpg',
    '/images/backgrounds/green-02.jpg',
    '/images/backgrounds/green-03.jpg',
    '/images/backgrounds/green-04.jpg',
    '/images/backgrounds/green-05.jpg',
    // ... up to 20 variations
  ],
  
  // Traditional Indian wedding colors
  MARIGOLD_COLLECTION: [
    '/images/backgrounds/marigold-01.jpg',
    '/images/backgrounds/marigold-02.jpg',
    // ... variations
  ],
  
  PURPLE_COLLECTION: [
    '/images/backgrounds/purple-01.jpg',
    '/images/backgrounds/purple-02.jpg',
    // ... variations
  ],
  
  ROSE_GOLD_COLLECTION: [
    '/images/backgrounds/rose-gold-01.jpg',
    '/images/backgrounds/rose-gold-02.jpg',
    // ... variations
  ],
} as const;

// Frame Images - OPTIMIZED ✅
export const FRAMES = {
  // Legacy paths (DEPRECATED)
  FRAME_27_LEGACY: '/design-reference/image-frames/Frame 27.png',
  FRAME_4_LEGACY: '/design-reference/image-frames/Frame 4.png',
  
  // OPTIMIZED versions (USE THESE!)
  FRAME_27: '/images/frames/frame-27.png', // 756KB → 710KB
  FRAME_4: '/images/frames/frame-4.png', // 168KB → 121KB
} as const;

// Couple Images - OPTIMIZED ✅
export const COUPLE_IMAGES = {
  // OPTIMIZED versions (USE THESE!) - 95% smaller!
  COUPLE_1: '/images/couple/couple-1.jpg', // 1.3MB → 75KB
  COUPLE_2: '/images/couple/couple-2.jpg', // 1.1MB → 58KB
} as const;

// Logo and Brand Assets
export const BRAND_ASSETS = {
  LOGO: '/logo.svg',
  LOGO_LOTUS_FLAME: '/logo-lotus-flame.svg',
  LOGO_WHITE: '/logo-white.png',
} as const;

// Default combinations for common use cases
export const DEFAULT_COMBINATIONS = {
  MAIN_BACKGROUND: {
    // Using blue-clouds background as the main default
    background: BACKGROUNDS.BLUE_CLOUDS,
  },
  GUEST_BACKGROUND: {
    // Alternative background for variety
    background: BACKGROUNDS.GREEN,
  },
} as const;

// Helper function to get optimized image path (all paths are now optimized!)
export function getOptimizedImage(imagePath: string): string {
  // All current paths are already optimized - just return as-is
  return imagePath;
}

// Helper to check if image is optimized (all current paths are optimized!)
export function isOptimized(imagePath: string): boolean {
  // All paths in BACKGROUNDS, FRAMES, COUPLE_IMAGES are now optimized
  return !imagePath.includes('/design-reference/');
}

// Helper function to get random background from a collection
export function getRandomBackground(collection: readonly string[]): string {
  return collection[Math.floor(Math.random() * collection.length)];
}

// Helper to get seasonal/theme-appropriate background
export function getThemeBackground(theme: 'romantic' | 'traditional' | 'modern' | 'festive'): string {
  switch (theme) {
    case 'romantic':
      return getRandomBackground(BACKGROUNDS.BLUE_VARIANTS);
    case 'traditional':
      return getRandomBackground(BACKGROUNDS.MARIGOLD_COLLECTION);
    case 'modern':
      return getRandomBackground(BACKGROUNDS.GREEN_VARIANTS);
    case 'festive':
      return getRandomBackground(BACKGROUNDS.PURPLE_COLLECTION);
    default:
      return BACKGROUNDS.BLUE_CLOUDS;
  }
}

// APP-WIDE BACKGROUND CONFIGURATION
// This will be the single source of truth for all background settings
// In the future, this can be loaded from a database/config API
export const APP_BACKGROUND_CONFIG = {
  // Current default - can be changed here to affect entire app
  default: {
    background: BACKGROUNDS.BLUE_CLOUDS,
  },
  
  // Alternative configurations for different contexts
  variants: {
    elegant: {
      background: BACKGROUNDS.ROSE,
    },
    natural: {
      background: BACKGROUNDS.GREEN,
    },
  }
} as const;

// Helper function to get the current app background configuration
export function getAppBackgroundConfig(variant: 'default' | 'elegant' | 'natural' = 'default') {
  if (variant === 'default') {
    return APP_BACKGROUND_CONFIG.default;
  }
  return APP_BACKGROUND_CONFIG.variants[variant];
} 