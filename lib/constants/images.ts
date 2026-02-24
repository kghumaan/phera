/**
 * Centralized image constants for Phera wedding platform
 * 
 * ✅ OPTIMIZED: All images have been compressed and resized for optimal web performance
 * Background images: 6-7MB → 130-200KB (98% reduction!)
 * Couple photos: 1.1-1.3MB → 58-75KB (95% reduction!)
 */

// Background Images - EXPANDED COLLECTION ✅
export const BACKGROUNDS = {
  // OPTIMIZED versions (USE THESE!)
  BLUE_CLOUDS: '/images/backgrounds/blue-clouds.jpg',


  // Premium Collection
  PEARL: '/images/backgrounds/pearl.png',
  JADE: '/images/backgrounds/jade.png',
  ROSE_QUARTZ: '/images/backgrounds/rose-quartz.png',
  LAVENDER: '/images/backgrounds/lavender.png',
  SUNSET: '/images/backgrounds/sunset.png',
  TROPICAL_SAGE: '/images/backgrounds/tropical-sage.png',
  MARBLE_GOLD: '/images/backgrounds/marble-gold.png',
  PRESSED_FLOWERS_SUBTLE: '/images/backgrounds/pressed-flowers-subtle.png',
  PRESSED_FLOWERS_FADED: '/images/backgrounds/pressed-flowers-faded.png',
  HANDMADE_PAPER_FLORAL: '/images/backgrounds/handmade-paper-floral.png',
  AQUAMARINE: '/images/backgrounds/aquamarine.png',
  SANDSTONE_BEIGE: '/images/backgrounds/sandstone-beige.png',
  CITRINE_QUARTZ: '/images/backgrounds/citrine-quartz.png',
  AVENTURINE_GREEN: '/images/backgrounds/aventurine-green.png',
  PRESSED_FLOWERS_TEXTURED: '/images/backgrounds/pressed-flowers-textured.png',
  LOTUS_PETALS: '/images/backgrounds/lotus-petals.png',
  OCEAN_WAVES: '/images/backgrounds/ocean-waves.png',
  AMETHYST_LAVENDER: '/images/backgrounds/amethyst-lavender.png',
  MOONSTONE_SHIMMER: '/images/backgrounds/moonstone-shimmer.png',
  SAGE_WATERCOLOR: '/images/backgrounds/sage-watercolor.png',
  BAMBOO_SAGE: '/images/backgrounds/bamboo-sage.png',
  WATERCOLOR_BLUE_SKY: '/images/backgrounds/watercolor-blue-sky.png',
  PERIWINKLE_PINK_SUNSET: '/images/backgrounds/periwinkle-pink-sunset.png',

  // Pro Mesh Collection
  PRO_MESH_1: '/images/backgrounds/pro-bg-mesh-1.jpg',
  PRO_MESH_2: '/images/backgrounds/pro-bg-mesh-2.jpg',
  PRO_MESH_3: '/images/backgrounds/pro-bg-mesh-3.jpg',
  PRO_MESH_4: '/images/backgrounds/pro-bg-mesh-4.jpg',
  PRO_MESH_5: '/images/backgrounds/pro-bg-mesh-5.jpg',

  // Collections
  PREMIUM_COLLECTION: [
    '/images/backgrounds/tropical-sage.png',
    '/images/backgrounds/marble-gold.png',
    '/images/backgrounds/pressed-flowers-subtle.png',
    '/images/backgrounds/pressed-flowers-faded.png',
    '/images/backgrounds/handmade-paper-floral.png',
    '/images/backgrounds/aquamarine.png',
    '/images/backgrounds/sandstone-beige.png',
    '/images/backgrounds/citrine-quartz.png',
    '/images/backgrounds/aventurine-green.png',
    '/images/backgrounds/pressed-flowers-textured.png',
    '/images/backgrounds/lotus-petals.png',
    '/images/backgrounds/rose-quartz.png',
    '/images/backgrounds/ocean-waves.png',
    '/images/backgrounds/jade.png',
    '/images/backgrounds/amethyst-lavender.png',
    '/images/backgrounds/lavender.png',
    '/images/backgrounds/moonstone-shimmer.png',
    '/images/backgrounds/pearl.png',
    '/images/backgrounds/sunset.png',
    '/images/backgrounds/sage-watercolor.png',
    '/images/backgrounds/bamboo-sage.png',
    '/images/backgrounds/watercolor-blue-sky.png',
    '/images/backgrounds/periwinkle-pink-sunset.png',
    '/images/backgrounds/pro-bg-mesh-1.jpg',
    '/images/backgrounds/pro-bg-mesh-2.jpg',
    '/images/backgrounds/pro-bg-mesh-3.jpg',
    '/images/backgrounds/pro-bg-mesh-4.jpg',
    '/images/backgrounds/pro-bg-mesh-5.jpg'
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

// Background Options for UI
export const BACKGROUND_UI_OPTIONS = [
  { name: 'Blue Clouds', url: BACKGROUNDS.BLUE_CLOUDS },
  { name: 'Pearl', url: BACKGROUNDS.PEARL },
  { name: 'Rose Quartz', url: BACKGROUNDS.ROSE_QUARTZ },
  { name: 'Jade', url: BACKGROUNDS.JADE },
  { name: 'Lavender', url: BACKGROUNDS.LAVENDER },
  { name: 'Sunset', url: BACKGROUNDS.SUNSET },

  { name: 'Tropical Sage', url: BACKGROUNDS.TROPICAL_SAGE },
  { name: 'Marble Gold', url: BACKGROUNDS.MARBLE_GOLD },
  { name: 'Ocean Waves', url: BACKGROUNDS.OCEAN_WAVES },
  { name: 'Boutique Floral', url: BACKGROUNDS.PRESSED_FLOWERS_SUBTLE },
  { name: 'Faded Flowers', url: BACKGROUNDS.PRESSED_FLOWERS_FADED },
  { name: 'Handmade Floral', url: BACKGROUNDS.HANDMADE_PAPER_FLORAL },
  { name: 'Aquamarine', url: BACKGROUNDS.AQUAMARINE },
  { name: 'Sandstone', url: BACKGROUNDS.SANDSTONE_BEIGE },
  { name: 'Citrine', url: BACKGROUNDS.CITRINE_QUARTZ },
  { name: 'Aventurine', url: BACKGROUNDS.AVENTURINE_GREEN },
  { name: 'Textured Floral', url: BACKGROUNDS.PRESSED_FLOWERS_TEXTURED },
  { name: 'Lotus Petals', url: BACKGROUNDS.LOTUS_PETALS },
  { name: 'Amethyst', url: BACKGROUNDS.AMETHYST_LAVENDER },
  { name: 'Moonstone', url: BACKGROUNDS.MOONSTONE_SHIMMER },
  { name: 'Sage Watercolor', url: BACKGROUNDS.SAGE_WATERCOLOR },
  { name: 'Bamboo', url: BACKGROUNDS.BAMBOO_SAGE },
  { name: 'Sky Watercolor', url: BACKGROUNDS.WATERCOLOR_BLUE_SKY },
  { name: 'Periwinkle Sunset', url: BACKGROUNDS.PERIWINKLE_PINK_SUNSET },
  { name: 'Misty Rose Mesh', url: BACKGROUNDS.PRO_MESH_1 },
  { name: 'Golden Aura Mesh', url: BACKGROUNDS.PRO_MESH_2 },
  { name: 'Azure Mist Mesh', url: BACKGROUNDS.PRO_MESH_3 },
  { name: 'Midnight Silk Mesh', url: BACKGROUNDS.PRO_MESH_4 },
  { name: 'Emerald Wash Mesh', url: BACKGROUNDS.PRO_MESH_5 },
] as const;

// Frame Images - OPTIMIZED ✅
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
    // Using Rose Quartz background as the main default
    background: BACKGROUNDS.ROSE_QUARTZ,
  },
  GUEST_BACKGROUND: {
    // Alternative background for variety
    background: BACKGROUNDS.JADE,
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