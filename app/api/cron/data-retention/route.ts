import { NextRequest, NextResponse } from 'next/server';
import { runDataRetention } from '@/lib/retention/run-data-retention';

/**
 * GET /api/cron/data-retention
 *
 * Manual / on-demand entry point for the data-retention sweep (the core logic
 * lives in lib/retention/run-data-retention.ts and also runs daily from the
 * cleanup cron, so it doesn't need its own Vercel cron slot).
 *
 * LIVE by default — pass ?dry=1 (or set DATA_RETENTION_DRY_RUN=true) to preview
 * what it WOULD remove without deleting. Protected by CRON_SECRET.
 *
 * See LANDING-REVISION-TRACKER.md + lib/retention/run-data-retention.ts for the
 * policy and the (extensive) safety exclusions.
 */

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  // Fail closed: never callable without the configured secret.
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const dryRun =
    process.env.DATA_RETENTION_DRY_RUN === 'true' || request.nextUrl.searchParams.get('dry') === '1';

  try {
    const summary = await runDataRetention({ dryRun });
    return NextResponse.json({ ok: true, ...summary });
  } catch (err) {
    console.error('[data-retention]', err);
    return NextResponse.json({ error: 'Data retention job failed', detail: String(err) }, { status: 500 });
  }
}
