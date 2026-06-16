/**
 * Seeds the vendor_directory table with manually curated records.
 * Run this before ingest-vendors.ts to have demo data immediately.
 *
 * Usage: npx tsx scripts/seed-vendors.ts [--dry-run]
 */

import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
import { createClient } from '@supabase/supabase-js'
import { SEED_VENDORS } from '../lib/vendors/directory/seed-data'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  console.log(`\n🌱 Seeding ${SEED_VENDORS.length} vendors${dryRun ? ' (DRY RUN)' : ''}...\n`)

  for (const vendor of SEED_VENDORS) {
    if (dryRun) {
      console.log(`  [dry-run] ${vendor.name} (${vendor.city}) — ${vendor.category}`)
      continue
    }

    // Idempotency check: skip if name+city already exists
    const { data: existing } = await supabase
      .from('vendor_directory')
      .select('id')
      .eq('name', vendor.name)
      .eq('city', vendor.city)
      .maybeSingle()

    if (existing) {
      console.log(`  ⟳ ${vendor.name} (already exists)`)
      continue
    }

    const { error } = await supabase
      .from('vendor_directory')
      .insert({ ...vendor, enriched_at: new Date().toISOString() })

    if (error) console.error(`  ✗ ${vendor.name}: ${error.message}`)
    else console.log(`  ✓ ${vendor.name}`)
  }

  console.log('\n✅ Seed complete.')
}

main().catch(err => { console.error(err); process.exit(1) })
