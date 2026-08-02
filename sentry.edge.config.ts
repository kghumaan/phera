import * as Sentry from "@sentry/nextjs";

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Production-only: skip local dev and Vercel preview deploys.
    enabled: process.env.VERCEL_ENV === "production" && !!process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV,

    // Sample 10% of transactions to stay within the free 10K quota
    tracesSampleRate: 0.1,
});
