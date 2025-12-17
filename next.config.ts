import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  images: {
    // Enable modern image formats
    formats: ['image/webp', 'image/avif'],
    // Configure responsive image sizes for your wedding platform
    deviceSizes: [480, 640, 750, 828, 1080, 1200, 1920],
    imageSizes: [64, 96, 128, 256, 384],
    // Configure allowed quality values (required in Next.js 16+)
    qualities: [75, 85, 90, 100],
    // Enable image optimization
    unoptimized: false,
    // Configure domains for external images if needed
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
