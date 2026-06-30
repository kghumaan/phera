import { NextRequest, NextResponse } from 'next/server';
import { cleanupExpiredDemoWeddings } from '@/lib/demo/clone-demo-wedding';
import { runDataRetention } from '@/lib/retention/run-data-retention';

/**
 * GET /api/cron/demo-cleanup  — the daily cleanup cron.
 *
 * Two jobs run here so they share one Vercel cron slot (Hobby caps the plan at
 * 2 cron jobs total, both already in use):
 *   1. Purge demo weddings older than DEMO_MAX_AGE_MS (2h).
 *   2. Run the 90-day data-retention sweep (delete expired RSVP responses +
 *      comments, clear guest PII; keeps the base guest record). Live by default;
 *      see lib/retention/run-data-retention.ts for the policy + safety exclusions.
 *
 * Scheduled daily at 04:00 UTC via vercel.json. The on-demand demo cleanup in
 * /api/demo/clone also runs whenever a new demo is created. Retention is also
 * callable on demand (incl. dry-run) at /api/cron/data-retention.
 * Protected by CRON_SECRET in production.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startedAt = new Date().toISOString();
  const t0 = Date.now();

  // Demo purge.
  let demoError: string | null = null;
  try {
    await cleanupExpiredDemoWeddings();
  } catch (error) {
    demoError = error instanceof Error ? error.message : String(error);
    console.error('[demo-cleanup] demo purge failed:', demoError);
  }

  // Data retention — independent of the demo purge so one failing doesn't
  // skip the other. Live (deletes); use /api/cron/data-retention?dry=1 to preview.
  let retention: Awaited<ReturnType<typeof runDataRetention>> | null = null;
  let retentionError: string | null = null;
  try {
    retention = await runDataRetention({ dryRun: false });
  } catch (error) {
    retentionError = error instanceof Error ? error.message : String(error);
    console.error('[demo-cleanup] data retention failed:', retentionError);
  }

  const ok = !demoError && !retentionError;
  return NextResponse.json(
    { ok, startedAt, durationMs: Date.now() - t0, demoError, retention, retentionError },
    { status: ok ? 200 : 500 },
  );
}
