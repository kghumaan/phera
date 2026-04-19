import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

/**
 * GET /api/health — shallow uptime check.
 *
 * Confirms the three external dependencies Phera can't run without are
 * reachable and the server-side Supabase key works. Returns 200 when
 * everything is green, 503 when anything critical fails.
 *
 * Query params:
 *   ?alert=1 — when present, a failure also pushes an event to
 *   Sentry so Sentry's own email alert rules will notify us. The
 *   Vercel daily cron hits this path.
 *
 * Intentionally lightweight: no deep queries, no Stripe account ping
 * (those burn API quota). We check credentials and basic connectivity
 * only — an uptime monitor on top of this gives finer coverage.
 */
export async function GET(request: NextRequest) {
  const checks: Record<string, { ok: boolean; error?: string }> = {
    supabase: { ok: false },
    whatsapp: { ok: false },
    stripe: { ok: false },
  };

  // Supabase — confirm service-role key is set and REST endpoint reachable.
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');

    const res = await fetch(`${url}/rest/v1/`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`Supabase REST returned ${res.status}`);
    checks.supabase.ok = true;
  } catch (err: unknown) {
    checks.supabase.error = err instanceof Error ? err.message : String(err);
  }

  // WhatsApp via Whapi — token + channel reachable.
  try {
    const token = process.env.WHAPI_API_TOKEN;
    const base = process.env.WHAPI_API_URL || 'https://gate.whapi.cloud';
    if (!token) throw new Error('Missing WHAPI_API_TOKEN');

    const res = await fetch(`${base}/health`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`Whapi health returned ${res.status}`);
    checks.whatsapp.ok = true;
  } catch (err: unknown) {
    checks.whatsapp.error = err instanceof Error ? err.message : String(err);
  }

  // Stripe — confirm secret key present + short-lived account fetch.
  try {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('Missing STRIPE_SECRET_KEY');

    const res = await fetch('https://api.stripe.com/v1/account', {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`Stripe account returned ${res.status}`);
    checks.stripe.ok = true;
  } catch (err: unknown) {
    checks.stripe.error = err instanceof Error ? err.message : String(err);
  }

  const allOk = Object.values(checks).every((c) => c.ok);
  const body = {
    status: allOk ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    checks,
  };

  // If the cron asked for alerting and something's red, send to Sentry
  // so Sentry's email alert rule fires. We fire a single aggregated
  // event with the full check payload so it stays one alert, not three.
  const shouldAlert = request.nextUrl.searchParams.get('alert') === '1';
  if (shouldAlert && !allOk) {
    Sentry.captureMessage('Phera health check degraded', {
      level: 'error',
      extra: body,
    });
  }

  return NextResponse.json(body, { status: allOk ? 200 : 503 });
}
