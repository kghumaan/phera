/**
 * Data-retention sweep — the core logic, callable from both the dedicated
 * /api/cron/data-retention route (manual + dry-run) and the daily cleanup cron
 * (so it runs on a schedule without needing a separate Vercel cron slot).
 *
 * Policy: 90 days after the wedding date, delete guest-submitted RSVP responses
 * + comments and clear guest logistics PII (passport/visa/etc.), while KEEPING
 * the base guest record. Backs the FAQ + Privacy Policy promises.
 *
 * NEVER touches: the demo seed (`demo-template`, the clone source), the website
 * template (`TEMPLATE_WEDDING_SLUG`, default simran-karanvir), or any demo-* /
 * agent-lab-* wedding (those have their own cleanup). Skips weddings with no
 * real wedding date (TBD weddings use epoch dates).
 */

import { createClient } from '@supabase/supabase-js';

const RETENTION_DAYS = 90;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface RetentionSummary {
  dryRun: boolean;
  startedAt: string;
  finishedAt: string;
  weddingsScanned: number;
  weddingsExpired: number;
  expiredSlugs: string[];
  wouldRemove: { comments: number; rsvps: number; guestsPiiCleared: number };
  removed: { comments: number; rsvps: number; guestsPiiCleared: number } | null;
}

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase env vars');
  return createClient(url, key);
}

/** A real, past wedding date — guards against null/epoch/placeholder dates. */
function retentionWindowClosed(weddingDate: string | null, weddingDateEnd: string | null): boolean {
  const raw = weddingDateEnd || weddingDate;
  if (!raw) return false;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return false;
  if (d.getUTCFullYear() < 2000) return false; // epoch / TBD placeholder
  return Date.now() > d.getTime() + RETENTION_DAYS * DAY_MS;
}

/** Slugs the retention job must NEVER purge. */
export function isProtectedSlug(slug: string): boolean {
  const templateSlug = process.env.TEMPLATE_WEDDING_SLUG || 'simran-karanvir';
  if (slug === 'demo-template') return true; // demo seed (clone source)
  if (slug === templateSlug) return true; // website/onboarding template
  if (slug.startsWith('demo-')) return true; // per-viewer demo clones
  if (slug.startsWith('agent-lab-')) return true; // agent E2E test weddings
  if (slug.includes('-demo-')) return true;
  return false;
}

export async function runDataRetention(opts: { dryRun: boolean }): Promise<RetentionSummary> {
  const { dryRun } = opts;
  const startedAt = new Date().toISOString();
  const supabase = serviceClient();

  // 1. Weddings whose 90-day window has closed (and that aren't protected).
  const { data: weddings, error: wErr } = await supabase
    .from('weddings')
    .select('slug, wedding_date, wedding_date_end');
  if (wErr) throw wErr;

  const expiredSlugs = (weddings ?? [])
    .filter((w) => w.slug && !isProtectedSlug(w.slug))
    .filter((w) => retentionWindowClosed(w.wedding_date, w.wedding_date_end))
    .map((w) => w.slug as string);

  const empty = { comments: 0, rsvps: 0, guestsPiiCleared: 0 };
  if (expiredSlugs.length === 0) {
    return {
      dryRun,
      startedAt,
      finishedAt: new Date().toISOString(),
      weddingsScanned: weddings?.length ?? 0,
      weddingsExpired: 0,
      expiredSlugs: [],
      wouldRemove: empty,
      removed: dryRun ? null : empty,
    };
  }

  // 2. Count what would be removed.
  const comments = await supabase
    .from('comments')
    .select('id', { count: 'exact', head: true })
    .in('wedding_id', expiredSlugs);
  if (comments.error) throw comments.error;

  const rsvps = await supabase
    .from('rsvps')
    .select('id', { count: 'exact', head: true })
    .in('wedding_id', expiredSlugs);
  if (rsvps.error) throw rsvps.error;

  const guestsPii = await supabase
    .from('guests')
    .select('id', { count: 'exact', head: true })
    .in('wedding_id', expiredSlugs)
    .not('logistics_data', 'is', null);
  if (guestsPii.error) throw guestsPii.error;

  const counts = {
    comments: comments.count ?? 0,
    rsvps: rsvps.count ?? 0,
    guestsPiiCleared: guestsPii.count ?? 0,
  };

  // 3. Execute (unless previewing).
  let removed: RetentionSummary['removed'] = null;
  if (!dryRun) {
    const delComments = await supabase.from('comments').delete().in('wedding_id', expiredSlugs);
    if (delComments.error) throw delComments.error;
    const delRsvps = await supabase.from('rsvps').delete().in('wedding_id', expiredSlugs);
    if (delRsvps.error) throw delRsvps.error;
    const clearPii = await supabase
      .from('guests')
      .update({ logistics_data: null })
      .in('wedding_id', expiredSlugs)
      .not('logistics_data', 'is', null);
    if (clearPii.error) throw clearPii.error;
    removed = counts;
  }

  return {
    dryRun,
    startedAt,
    finishedAt: new Date().toISOString(),
    weddingsScanned: weddings?.length ?? 0,
    weddingsExpired: expiredSlugs.length,
    expiredSlugs,
    wouldRemove: counts,
    removed,
  };
}
