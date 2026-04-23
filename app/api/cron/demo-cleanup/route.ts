import { NextRequest, NextResponse } from 'next/server';
import { cleanupExpiredDemoWeddings } from '@/lib/demo/clone-demo-wedding';

/**
 * GET /api/cron/demo-cleanup
 *
 * Purges demo weddings older than DEMO_MAX_AGE_MS (2h).
 * Scheduled daily at 04:00 UTC via vercel.json (Vercel Hobby plan caps crons at once/day).
 * On-demand cleanup in /api/demo/clone also runs whenever a new demo is created.
 * Protected by CRON_SECRET in production.
 *
 * Exists because the on-demand cleanup in /api/demo/clone only fires when
 * someone creates a new demo. Without it, demos linger indefinitely in
 * quiet windows.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startedAt = new Date().toISOString();
  const t0 = Date.now();
  try {
    await cleanupExpiredDemoWeddings();
    return NextResponse.json({
      ok: true,
      startedAt,
      durationMs: Date.now() - t0,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { ok: false, error: msg, startedAt, durationMs: Date.now() - t0 },
      { status: 500 },
    );
  }
}
