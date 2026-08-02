import * as Sentry from "@sentry/nextjs";

// ─── Server-side Sentry init ────────────────────────────────────────
// Server errors are almost always actionable — real uncaught exceptions
// in API routes, bad DB queries, Stripe webhook failures. We're much
// stricter about noise filters here than on the client.
// Production-only: skip local dev and Vercel preview deploys.
Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    enabled: process.env.VERCEL_ENV === "production" && !!process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV,

    // 5% trace sampling — matches client, keeps us under free-tier caps.
    tracesSampleRate: 0.05,

    ignoreErrors: [
        // Expected 401/403/404 paths — these aren't bugs. Next.js throws
        // specific sentinel errors we want to drop.
        "NEXT_NOT_FOUND",
        "NEXT_REDIRECT",
        "DYNAMIC_SERVER_USAGE",

        // Supabase returns Error for empty .single() lookups. Treat as
        // application logic, not a server error.
        "PGRST116",
        "The result contains 0 rows",

        // User-cancelled uploads / aborted requests reach the server too.
        "AbortError",
        "The operation was aborted",
    ],

    beforeSend(event, hint) {
        const err = hint.originalException;
        const message = err instanceof Error ? err.message : String(err ?? "");

        // Drop expected 4xx responses thrown as errors.
        if (event.contexts?.response) {
            const status = (event.contexts.response as { status_code?: number }).status_code;
            if (status && status >= 400 && status < 500 && status !== 429) {
                return null;
            }
        }

        // Rate-limit errors are noisy but expected — keep them only if
        // they repeat (Sentry's own dedup handles that).
        if (message.includes("rate limit")) {
            return null;
        }

        return event;
    },
});
