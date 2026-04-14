/**
 * Centralized image constants for Phera wedding platform
 */

import blurPlaceholders from '@/lib/generated/blur-placeholders.json';

// Background Images
export const BACKGROUNDS = {
  BLUE_CLOUDS: '/images/backgrounds/blue-clouds.webp',

  // Premium Collection
  PEARL: '/images/backgrounds/pearl.webp',
  JADE: '/images/backgrounds/jade.webp',
  ROSE_QUARTZ: '/images/backgrounds/rose-quartz.webp',
  LAVENDER: '/images/backgrounds/lavender.webp',
  SUNSET: '/images/backgrounds/sunset.webp',
  TROPICAL_SAGE: '/images/backgrounds/tropical-sage.webp',
  MARBLE_GOLD: '/images/backgrounds/marble-gold.webp',
  PRESSED_FLOWERS_SUBTLE: '/images/backgrounds/pressed-flowers-subtle.webp',
  PRESSED_FLOWERS_FADED: '/images/backgrounds/pressed-flowers-faded.webp',
  HANDMADE_PAPER_FLORAL: '/images/backgrounds/handmade-paper-floral.webp',
  SANDSTONE_BEIGE: '/images/backgrounds/sandstone-beige.webp',
  CITRINE_QUARTZ: '/images/backgrounds/citrine-quartz.webp',
  AVENTURINE_GREEN: '/images/backgrounds/aventurine-green.webp',
  PRESSED_FLOWERS_TEXTURED: '/images/backgrounds/pressed-flowers-textured.webp',
  LOTUS_PETALS: '/images/backgrounds/lotus-petals.webp',
  OCEAN_WAVES: '/images/backgrounds/ocean-waves.webp',
  AMETHYST_LAVENDER: '/images/backgrounds/amethyst-lavender.webp',
  MOONSTONE_SHIMMER: '/images/backgrounds/moonstone-shimmer.webp',
  SAGE_WATERCOLOR: '/images/backgrounds/sage-watercolor.webp',
  BAMBOO_SAGE: '/images/backgrounds/bamboo-sage.webp',
  WATERCOLOR_BLUE_SKY: '/images/backgrounds/watercolor-blue-sky.webp',
  PERIWINKLE_PINK_SUNSET: '/images/backgrounds/periwinkle-pink-sunset.webp',

  // Fabric Textures
  PAISLEY_CREAM: '/images/backgrounds/paisley-cream.webp',
  ROYAL_PURPLE: '/images/backgrounds/royal-purple.webp',
  IVORY_LINEN: '/images/backgrounds/ivory-linen.webp',
  BURGUNDY_SILK: '/images/backgrounds/burgundy-silk.webp',
  PAISLEY_BLUE: '/images/backgrounds/paisley-blue.webp',

  // Pro Mesh Collection
  PRO_MESH_1: '/images/backgrounds/pro-bg-mesh-1.webp',
  PRO_MESH_2: '/images/backgrounds/pro-bg-mesh-2.webp',
  PRO_MESH_3: '/images/backgrounds/pro-bg-mesh-3.webp',
  PRO_MESH_4: '/images/backgrounds/pro-bg-mesh-4.webp',
  PRO_MESH_5: '/images/backgrounds/pro-bg-mesh-5.webp',

  // Collections
  PREMIUM_COLLECTION: [
    '/images/backgrounds/tropical-sage.webp',
    '/images/backgrounds/marble-gold.webp',
    '/images/backgrounds/pressed-flowers-subtle.webp',
    '/images/backgrounds/pressed-flowers-faded.webp',
    '/images/backgrounds/handmade-paper-floral.webp',
    '/images/backgrounds/sandstone-beige.webp',
    '/images/backgrounds/citrine-quartz.webp',
    '/images/backgrounds/aventurine-green.webp',
    '/images/backgrounds/pressed-flowers-textured.webp',
    '/images/backgrounds/lotus-petals.webp',
    '/images/backgrounds/rose-quartz.webp',
    '/images/backgrounds/ocean-waves.webp',
    '/images/backgrounds/jade.webp',
    '/images/backgrounds/amethyst-lavender.webp',
    '/images/backgrounds/lavender.webp',
    '/images/backgrounds/moonstone-shimmer.webp',
    '/images/backgrounds/pearl.webp',
    '/images/backgrounds/sunset.webp',
    '/images/backgrounds/sage-watercolor.webp',
    '/images/backgrounds/bamboo-sage.webp',
    '/images/backgrounds/watercolor-blue-sky.webp',
    '/images/backgrounds/periwinkle-pink-sunset.webp',
    '/images/backgrounds/pro-bg-mesh-1.webp',
    '/images/backgrounds/pro-bg-mesh-2.webp',
    '/images/backgrounds/pro-bg-mesh-3.webp',
    '/images/backgrounds/pro-bg-mesh-4.webp',
    '/images/backgrounds/pro-bg-mesh-5.webp'
  ],

  BLUE_VARIANTS: [
    '/images/backgrounds/blue-clouds-01.jpg',
    '/images/backgrounds/blue-clouds-02.jpg',
    '/images/backgrounds/blue-clouds-03.jpg',
    '/images/backgrounds/blue-clouds-04.jpg',
    '/images/backgrounds/blue-clouds-05.jpg',
  ],

  GREEN_VARIANTS: [
    '/images/backgrounds/green-01.jpg',
    '/images/backgrounds/green-02.jpg',
    '/images/backgrounds/green-03.jpg',
    '/images/backgrounds/green-04.jpg',
    '/images/backgrounds/green-05.jpg',
  ],

  MARIGOLD_COLLECTION: [
    '/images/backgrounds/marigold-01.jpg',
    '/images/backgrounds/marigold-02.jpg',
  ],

  PURPLE_COLLECTION: [
    '/images/backgrounds/purple-01.jpg',
    '/images/backgrounds/purple-02.jpg',
  ],

  ROSE_GOLD_COLLECTION: [
    '/images/backgrounds/rose-gold-01.jpg',
    '/images/backgrounds/rose-gold-02.jpg',
  ],
} as const;

// Background Options for UI (with thumbnail URLs for selectors)
export const BACKGROUND_UI_OPTIONS = [
  { name: 'Blue Clouds', url: BACKGROUNDS.BLUE_CLOUDS, thumbUrl: '/images/backgrounds/thumbs/blue-clouds.thumb.webp' },
  { name: 'Pearl', url: BACKGROUNDS.PEARL, thumbUrl: '/images/backgrounds/thumbs/pearl.thumb.webp' },
  { name: 'Rose Quartz', url: BACKGROUNDS.ROSE_QUARTZ, thumbUrl: '/images/backgrounds/thumbs/rose-quartz.thumb.webp' },
  { name: 'Jade', url: BACKGROUNDS.JADE, thumbUrl: '/images/backgrounds/thumbs/jade.thumb.webp' },
  { name: 'Lavender', url: BACKGROUNDS.LAVENDER, thumbUrl: '/images/backgrounds/thumbs/lavender.thumb.webp' },
  { name: 'Sunset', url: BACKGROUNDS.SUNSET, thumbUrl: '/images/backgrounds/thumbs/sunset.thumb.webp' },

  { name: 'Tropical Sage', url: BACKGROUNDS.TROPICAL_SAGE, thumbUrl: '/images/backgrounds/thumbs/tropical-sage.thumb.webp' },
  { name: 'Marble Gold', url: BACKGROUNDS.MARBLE_GOLD, thumbUrl: '/images/backgrounds/thumbs/marble-gold.thumb.webp' },
  { name: 'Ocean Waves', url: BACKGROUNDS.OCEAN_WAVES, thumbUrl: '/images/backgrounds/thumbs/ocean-waves.thumb.webp' },
  { name: 'Boutique Floral', url: BACKGROUNDS.PRESSED_FLOWERS_SUBTLE, thumbUrl: '/images/backgrounds/thumbs/pressed-flowers-subtle.thumb.webp' },
  { name: 'Faded Flowers', url: BACKGROUNDS.PRESSED_FLOWERS_FADED, thumbUrl: '/images/backgrounds/thumbs/pressed-flowers-faded.thumb.webp' },
  { name: 'Handmade Floral', url: BACKGROUNDS.HANDMADE_PAPER_FLORAL, thumbUrl: '/images/backgrounds/thumbs/handmade-paper-floral.thumb.webp' },
  { name: 'Sandstone', url: BACKGROUNDS.SANDSTONE_BEIGE, thumbUrl: '/images/backgrounds/thumbs/sandstone-beige.thumb.webp' },
  { name: 'Citrine', url: BACKGROUNDS.CITRINE_QUARTZ, thumbUrl: '/images/backgrounds/thumbs/citrine-quartz.thumb.webp' },
  { name: 'Aventurine', url: BACKGROUNDS.AVENTURINE_GREEN, thumbUrl: '/images/backgrounds/thumbs/aventurine-green.thumb.webp' },
  { name: 'Textured Floral', url: BACKGROUNDS.PRESSED_FLOWERS_TEXTURED, thumbUrl: '/images/backgrounds/thumbs/pressed-flowers-textured.thumb.webp' },
  { name: 'Lotus Petals', url: BACKGROUNDS.LOTUS_PETALS, thumbUrl: '/images/backgrounds/thumbs/lotus-petals.thumb.webp' },
  { name: 'Amethyst', url: BACKGROUNDS.AMETHYST_LAVENDER, thumbUrl: '/images/backgrounds/thumbs/amethyst-lavender.thumb.webp' },
  { name: 'Moonstone', url: BACKGROUNDS.MOONSTONE_SHIMMER, thumbUrl: '/images/backgrounds/thumbs/moonstone-shimmer.thumb.webp' },
  { name: 'Sage Watercolor', url: BACKGROUNDS.SAGE_WATERCOLOR, thumbUrl: '/images/backgrounds/thumbs/sage-watercolor.thumb.webp' },
  { name: 'Bamboo', url: BACKGROUNDS.BAMBOO_SAGE, thumbUrl: '/images/backgrounds/thumbs/bamboo-sage.thumb.webp' },
  { name: 'Periwinkle Sunset', url: BACKGROUNDS.PERIWINKLE_PINK_SUNSET, thumbUrl: '/images/backgrounds/thumbs/periwinkle-pink-sunset.thumb.webp' },
] as const;

// Frame Images
export const FRAMES = {
  FRAME_1: '/images/frames/frame-1.png',
  FRAME_2: '/images/frames/frame-2.png',
  FRAME_3: '/images/frames/frame-3.png',
  FRAME_4: '/images/frames/frame-4.png',
  FRAME_5: '/images/frames/frame-5.png',
  FRAME_6: '/images/frames/frame-6.png',
  FRAME_7: '/images/frames/frame-7.png',
  FRAME_8: '/images/frames/frame-8.png',
  FRAME_9: '/images/frames/frame-9.png',
  FRAME_10: '/images/frames/frame-10.png',
  FRAME_11: '/images/frames/frame-11.png',
  FRAME_12: '/images/frames/frame-12.png',
} as const;

// Frame UI Options (with thumbnail URLs for selectors)
export const FRAME_UI_OPTIONS = [
  // Free frames (corner frames) — first row
  { id: 'frame-1', url: '/images/frames/frame-1.png', thumbUrl: '/images/frames/frame-1.png', name: 'Frame 1' },
  { id: 'frame-4', url: '/images/frames/frame-4.png', thumbUrl: '/images/frames/frame-4.png', name: 'Frame 4' },
  { id: 'frame-9', url: '/images/frames/frame-9.png', thumbUrl: '/images/frames/frame-9.png', name: 'Frame 9' },
  { id: 'frame-12', url: '/images/frames/frame-12.png', thumbUrl: '/images/frames/frame-12.png', name: 'Frame 12' },
  // Pro frames
  { id: 'frame-2', url: '/images/frames/frame-2.png', thumbUrl: '/images/frames/frame-2.png', name: 'Frame 2' },
  { id: 'frame-3', url: '/images/frames/frame-3.png', thumbUrl: '/images/frames/frame-3.png', name: 'Frame 3' },
  { id: 'frame-5', url: '/images/frames/frame-5.png', thumbUrl: '/images/frames/frame-5.png', name: 'Frame 5' },
  { id: 'frame-6', url: '/images/frames/frame-6.png', thumbUrl: '/images/frames/frame-6.png', name: 'Frame 6' },
  { id: 'frame-7', url: '/images/frames/frame-7.png', thumbUrl: '/images/frames/frame-7.png', name: 'Frame 7' },
  { id: 'frame-8', url: '/images/frames/frame-8.png', thumbUrl: '/images/frames/frame-8.png', name: 'Frame 8' },
  { id: 'frame-10', url: '/images/frames/frame-10.png', thumbUrl: '/images/frames/frame-10.png', name: 'Frame 10' },
  { id: 'frame-11', url: '/images/frames/frame-11.png', thumbUrl: '/images/frames/frame-11.png', name: 'Frame 11' },
] as const;

// Frame Configurations - Calibrated for perfect fit
export const FRAME_CONFIGS: Record<string, { top: string, left: string, width: string, height: string }> = {
  'frame-1': { top: '13.2%', left: '14.2%', width: '71.8%', height: '72.4%' },
  'frame-2': { top: '12.9%', left: '13.6%', width: '73%', height: '73.2%' },
  'frame-3': { top: '16.4%', left: '17%', width: '66.1%', height: '64.3%' },
  'frame-4': { top: '6.5%', left: '6.3%', width: '87%', height: '86.9%' },
  'frame-5': { top: '15.6%', left: '16.6%', width: '67.2%', height: '66.1%' },
  'frame-6': { top: '12.1%', left: '12.9%', width: '74.5%', height: '74.9%' },
  'frame-7': { top: '14.2%', left: '14.7%', width: '70.5%', height: '71.7%' },
  'frame-8': { top: '14.6%', left: '17.1%', width: '66.3%', height: '65.2%' },
  'frame-9': { top: '17.3%', left: '17.4%', width: '65.1%', height: '65.5%' },
  'frame-10': { top: '12%', left: '13.3%', width: '75.2%', height: '74.9%' },
  'frame-11': { top: '15.1%', left: '15.6%', width: '68.9%', height: '68.6%' },
  'frame-12': { top: '15.2%', left: '16.8%', width: '66.5%', height: '65.4%' },
};

// Helper to get frame configuration from URL
export function getFrameConfig(frameUrl: string | null) {
  if (!frameUrl) return FRAME_CONFIGS['frame-1'];

  // Extract frame filename (e.g., frame-1 from /images/frames/frame-1.png)
  const match = frameUrl.match(/frame-\d+/);
  const frameId = match ? match[0] : 'frame-1';

  return FRAME_CONFIGS[frameId] || FRAME_CONFIGS['frame-1'];
}

// Couple Images
export const COUPLE_IMAGES = {
  COUPLE_1: '/images/couple/couple-1.jpg',
  COUPLE_2: '/images/couple/couple-2.jpg',
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
    background: BACKGROUNDS.ROSE_QUARTZ,
  },
  GUEST_BACKGROUND: {
    background: BACKGROUNDS.JADE,
  },
} as const;

// Helper function to get optimized image path (all paths are now optimized!)
export function getOptimizedImage(imagePath: string): string {
  return imagePath;
}

// Helper to check if image is optimized (all current paths are optimized!)
export function isOptimized(imagePath: string): boolean {
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
export const APP_BACKGROUND_CONFIG = {
  default: {
    background: BACKGROUNDS.BLUE_CLOUDS,
  },

  variants: {
    elegant: {
      background: BACKGROUNDS.PEARL,
    },
    natural: {
      background: BACKGROUNDS.JADE,
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

/**
 * Get a color-accurate blur placeholder data URL for a background image.
 * Falls back to a generic gray pixel if no placeholder exists.
 */
export function getBlurDataUrl(imagePath: string): string {
  const placeholders = blurPlaceholders as Record<string, string>;
  if (placeholders[imagePath]) return placeholders[imagePath];

  // Try .webp version if .png was passed (for DB migration compatibility)
  const webpPath = imagePath.replace(/\.(png|jpg|jpeg)$/, '.webp');
  if (placeholders[webpPath]) return placeholders[webpPath];

  // Fallback: generic gray 1x1 pixel
  return 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';
}
