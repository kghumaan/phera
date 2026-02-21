import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

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

export default withSentryConfig(nextConfig, {
  // Suppresses Sentry build logs for cleaner output
  silent: true,

  // Reduces client-side bundle size by tree-shaking logger statements
  disableLogger: true,

  // Routes Sentry events through a Next.js rewrite so ad-blockers don't block them
  tunnelRoute: "/monitoring",

  // Automatically upload source maps when SENTRY_AUTH_TOKEN is set
  // When the token is not set (e.g. local dev), this silently skips
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
});

