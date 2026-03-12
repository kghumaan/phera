import * as Sentry from "@sentry/nextjs";

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Only initialize if DSN is set (skip in development without DSN)
    enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Sample 10% of transactions to stay within the free 10K quota
    tracesSampleRate: 0.1,

    // Disable session replay to save quota (not needed yet)
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,

    // Filter out noisy errors that aren't actionable
    ignoreErrors: [
        // Browser extensions and third-party scripts
        "ResizeObserver loop",
        "Non-Error promise rejection captured",
        // Network errors the user can't control
        "Failed to fetch",
        "Load failed",
        "NetworkError",
    ],
});
