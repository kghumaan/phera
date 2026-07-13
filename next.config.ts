import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Type errors fail the build. This was flipped off for a while and 100
    // silent errors accumulated (fixed 2026-07-13) — keep it on.
    ignoreBuildErrors: false,
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
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'media.giphy.com',
      },
      {
        protocol: 'https',
        hostname: 'media*.giphy.com',
      },
    ],
  },
  async redirects() {
    return [
      { source: '/auth/signup', destination: '/auth/login', permanent: true },
      { source: '/pricing', destination: '/#pricing', permanent: true },
      { source: '/features', destination: '/#features', permanent: true },
    ];
  },
  async headers() {
    return [
      {
        // Cache static assets aggressively (images, fonts, etc.)
        source: '/images/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // Security headers for all routes
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'Content-Security-Policy', value: process.env.NODE_ENV === 'development'
            ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' http: https:; style-src 'self' 'unsafe-inline' http: https:; img-src 'self' data: blob: http: https:; font-src 'self' data: http: https:; connect-src 'self' http: https: ws: wss:; frame-src 'self' http: https:; media-src 'self' http: https: blob:; object-src 'none'; base-uri 'self'"
            : "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: blob: https:; font-src 'self' data: https:; connect-src 'self' https: wss:; frame-src 'self' https:; media-src 'self' https: blob:; object-src 'none'; base-uri 'self'" },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(self), geolocation=()' },
        ],
      },
    ];
  },
};

// Skip Sentry wrapper in dev to avoid ETIMEDOUT / middleware-manifest race conditions
const isDev = process.env.NODE_ENV === 'development';

export default isDev
  ? nextConfig
  : withSentryConfig(nextConfig, {
      silent: true,
      tunnelRoute: "/monitoring",
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
    });
