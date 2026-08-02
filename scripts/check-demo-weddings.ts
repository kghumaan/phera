/**
 * Read-only diagnostic: how many demo weddings exist and how old are they?
 * Confirms the demo-cleanup cron is actually purging per-viewer demo clones.
 * Usage: npx tsx scripts/check-demo-weddings.ts
 */
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const TWO_HOURS = 2 * 60 * 60 * 1000;

async function main() {
  const { count: totalWeddings } = await supabase
    .from('weddings')
    .select('id', { count: 'exact', head: true });

  const { data, error } = await supabase
    .from('weddings')
    .select('slug, created_at')
    .like('slug', 'demo-%')
    .order('created_at', { ascending: true });
  if (error) { console.error('✗', error.message); process.exit(1); }

  const now = Date.now();
  const clones = (data ?? []).filter((w) => w.slug !== 'demo-template');
  const olderThan2h = clones.filter((w) => now - new Date(w.created_at).getTime() > TWO_HOURS);
  const hasTemplate = (data ?? []).some((w) => w.slug === 'demo-template');

  console.log(`\n🧪 Demo wedding check`);
  console.log(`   Total weddings:                ${totalWeddings ?? 0}`);
  console.log(`   demo-template present:         ${hasTemplate ? 'yes ✓' : 'NO ✗ (demos cannot be cloned!)'}`);
  console.log(`   Live demo clones (demo-*):     ${clones.length}`);
  console.log(`   …of which OLDER than 2h:        ${olderThan2h.length}  ${olderThan2h.length === 0 ? '✓ (cleanup healthy)' : '⚠️ lingering — cleanup may be lagging'}`);
  if (clones.length) {
    const oldest = clones[0];
    const ageH = ((now - new Date(oldest.created_at).getTime()) / 3600000).toFixed(1);
    console.log(`   Oldest clone:                  ${oldest.slug} (${ageH}h old)`);
  }
  if (olderThan2h.length) {
    console.log(`\n   Lingering (>2h):`);
    for (const w of olderThan2h.slice(0, 20)) {
      const ageH = ((now - new Date(w.created_at).getTime()) / 3600000).toFixed(1);
      console.log(`     ${w.slug}  —  ${ageH}h`);
    }
    if (olderThan2h.length > 20) console.log(`     …and ${olderThan2h.length - 20} more`);
  }
  console.log('');
}

main().catch((e) => { console.error(e); process.exit(1); });
