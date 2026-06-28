import * as Sentry from "@sentry/nextjs";

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

// ─── Client-side Sentry init ────────────────────────────────────────
// Noise tuning is aggressive on purpose — a wedding-logistics app
// lives inside email clients, webviews, and random 3rd-party scripts.
// Without filters the Issues feed is 90% junk from user environments
// we can't fix.
Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,

    // Drop perf trace sampling from 10% to 5% — we're on the free tier
    // and tracing data isn't driving decisions right now. Re-raise when
    // we need perf answers.
    tracesSampleRate: 0.05,

    // Session Replay — quota-conscious. We do NOT sample general traffic
    // (replaysSessionSampleRate: 0) to stay inside the free tier. Instead:
    //   • Every session that hits an error gets a replay (1.0) — cheap
    //     because errors are rare, and these are the sessions worth watching.
    //   • High-intent flows (e.g. onboarding) opt in explicitly by calling
    //     Sentry.getReplay()?.start() — see lib/analytics/onboarding.ts.
    // Privacy: input VALUES are masked (PII / DPDPA), but on-screen text and
    // layout stay visible so we can see WHERE a user clicked and stalled.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,

    integrations: [
        Sentry.replayIntegration({
            maskAllText: false,
            maskAllInputs: true,
            blockAllMedia: false,
        }),
    ],

    ignoreErrors: [
        // Browser extensions (Grammarly, LastPass, etc.) injecting into the DOM.
        "ResizeObserver loop",
        "ResizeObserver loop completed",
        "Non-Error promise rejection captured",
        "Non-Error exception captured",

        // Network transients — user closed laptop, lost wifi, etc.
        "Failed to fetch",
        "Load failed",
        "NetworkError",
        "NetworkError when attempting to fetch resource",
        "AbortError",
        "The operation was aborted",
        "TypeError: cancelled",
        "TypeError: Load failed",
        "TypeError: NetworkError when attempting to fetch resource",

        // Next.js hydration — usually benign, caused by extensions
        // rewriting DOM between SSR and client render.
        "Hydration failed because the server rendered HTML",
        "Text content does not match server-rendered HTML",
        "There was an error while hydrating",

        // Common 3rd-party SDK chatter we can't do anything about.
        /^chrome-extension:\/\//i,
        /^moz-extension:\/\//i,
        /^safari-extension:\/\//i,
        /ChunkLoadError/i,

        // Mobile Safari PWA quirks.
        "Possible side-effect in debug-evaluate",
        "Script error.",
    ],

    denyUrls: [
        // Browser extensions.
        /chrome-extension:\/\//i,
        /moz-extension:\/\//i,
        /safari-extension:\/\//i,
        // 3rd-party scripts we don't own and can't fix.
        /googletagmanager\.com/i,
        /google-analytics\.com/i,
        /connect\.facebook\.net/i,
        /snap\.licdn\.com/i,
    ],

    // Last-line filter: drop any event that's still junky after the
    // ignore lists. We keep the hook minimal so it's cheap on every send.
    beforeSend(event, hint) {
        const err = hint.originalException;
        const message = err instanceof Error ? err.message : String(err ?? "");

        // Cancelled fetches / aborted requests come through as different
        // error types depending on browser. Catch the shape here.
        if (message.includes("aborted") || message.includes("cancelled")) {
            return null;
        }

        // Drop anything that has no stack — usually cross-origin "Script error."
        if (event.exception?.values?.[0] && !event.exception.values[0].stacktrace) {
            return null;
        }

        return event;
    },
});
