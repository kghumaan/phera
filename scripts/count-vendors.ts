/**
 * Read-only count of the vendor_directory table — confirms how many vendors
 * are actually live (vs the 26-row seed). Touches nothing; safe to run anytime.
 *
 * Usage: npx tsx scripts/count-vendors.ts
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

async function main() {
  const { count: total, error } = await supabase
    .from('vendor_directory')
    .select('id', { count: 'exact', head: true })
  if (error) { console.error('✗', error.message); process.exit(1) }

  console.log(`\n📇 vendor_directory total: ${total ?? 0}\n`)

  // Supabase caps a single select at 1000 rows, so page through all of them
  // for accurate per-city/category breakdowns (not just the first 1000).
  const rows: Array<Record<string, string>> = []
  const PAGE = 1000
  for (let from = 0; ; from += PAGE) {
    const { data, error: rowsErr } = await supabase
      .from('vendor_directory')
      .select('city, category, source')
      .range(from, from + PAGE - 1)
    if (rowsErr) { console.error('✗', rowsErr.message); process.exit(1) }
    if (!data || data.length === 0) break
    rows.push(...(data as Array<Record<string, string>>))
    if (data.length < PAGE) break
  }

  const tally = (key: 'city' | 'category' | 'source') => {
    const m = new Map<string, number>()
    for (const r of rows ?? []) {
      const k = (r as Record<string, string>)[key] ?? '(none)'
      m.set(k, (m.get(k) ?? 0) + 1)
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1])
  }

  console.log('By city:');     for (const [k, n] of tally('city'))     console.log(`  ${n.toString().padStart(4)}  ${k}`)
  console.log('\nBy category:'); for (const [k, n] of tally('category')) console.log(`  ${n.toString().padStart(4)}  ${k}`)
  console.log('\nBy source:');   for (const [k, n] of tally('source'))   console.log(`  ${n.toString().padStart(4)}  ${k}`)
  console.log('')
}

main().catch(err => { console.error(err); process.exit(1) })
