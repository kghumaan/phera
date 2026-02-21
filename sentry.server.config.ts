import * as Sentry from "@sentry/nextjs";

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Only initialize if DSN is set
    enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Sample 10% of transactions to stay within the free 10K quota
    tracesSampleRate: 0.1,
});
