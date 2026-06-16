/**
 * AI enrichment script — visits vendor websites via Claude, extracts pricing/portfolio/specialties
 *
 * Usage:
 *   npx tsx scripts/enrich-vendors.ts [--limit 20] [--dry-run]
 *
 * Requires: ANTHROPIC_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in .env.local
 * Run AFTER ingest-vendors.ts
 */

import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { VendorRecord } from '../lib/vendors/directory/types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const supabase  = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

interface EnrichmentResult {
  description: string | null
  price_range_min: number | null
  price_range_max: number | null
  instagram_handle: string | null
  specialties: string[]
  languages: string[]
  has_nri_experience: boolean
  portfolio_urls: string[]
}

const ENRICHMENT_PROMPT = (vendor: VendorRecord, websiteContent: string) => `
You are a wedding vendor data analyst. Extract structured information from this vendor's website content.

Vendor: ${vendor.name}
City: ${vendor.city}, ${vendor.country_code}
Category: ${vendor.category}

Website content:
${websiteContent.slice(0, 8000)}

Extract the following. If information is not clearly stated, use null or empty array.

Return ONLY valid JSON matching this exact shape:
{
  "description": "2-3 sentence summary focusing on their wedding specialization and style. Mention NRI/Indian wedding experience if present.",
  "price_range_min": <USD integer or null>,
  "price_range_max": <USD integer or null>,
  "instagram_handle": "<handle without @ or null>",
  "specialties": ["candid photography", "destination weddings", ...],
  "languages": ["English", "Hindi", ...],
  "has_nri_experience": <true if they mention NRI, Indian-American, overseas Indian clients, or international weddings>,
  "portfolio_urls": ["<up to 3 direct portfolio/gallery URLs found on the page>"]
}

For price range: look for package pricing, starting price, or price lists. Convert INR to USD at 83:1 if needed. If only ranges like "budget-friendly" appear, use null.
`

async function fetchWebsiteText(url: string): Promise<string | null> {
  try {
    const controller = new AbortController()
    setTimeout(() => controller.abort(), 10000)
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Phera/1.0; +https://phera.io)' },
    })
    if (!res.ok) return null
    const html = await res.text()
    // Strip HTML tags to get readable text
    return html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  } catch {
    return null
  }
}

async function enrichVendor(vendor: VendorRecord, dryRun: boolean): Promise<boolean> {
  if (!vendor.website) return false

  const websiteText = await fetchWebsiteText(vendor.website)
  if (!websiteText) {
    console.log(`  ↷ ${vendor.name}: website unreachable`)
    return false
  }

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{ role: 'user', content: ENRICHMENT_PROMPT(vendor, websiteText) }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  let parsed: EnrichmentResult

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON in response')
    parsed = JSON.parse(jsonMatch[0])
  } catch {
    console.error(`  ✗ ${vendor.name}: failed to parse Claude response`)
    return false
  }

  if (dryRun) {
    console.log(`  [dry-run] ${vendor.name}:`, JSON.stringify(parsed, null, 2))
    return true
  }

  const { error } = await supabase
    .from('vendor_directory')
    .update({
      description:      parsed.description,
      price_range_min:  parsed.price_range_min ?? vendor.price_range_min,
      price_range_max:  parsed.price_range_max ?? vendor.price_range_max,
      instagram_handle: parsed.instagram_handle,
      specialties:      parsed.specialties,
      languages:        parsed.languages,
      has_nri_experience: parsed.has_nri_experience,
      portfolio_urls:   parsed.portfolio_urls,
      enriched_at:      new Date().toISOString(),
    })
    .eq('id', vendor.id)

  if (error) {
    console.error(`  ✗ ${vendor.name}: ${error.message}`)
    return false
  }

  return true
}

async function main() {
  const args    = process.argv.slice(2)
  const limit   = parseInt(args[args.indexOf('--limit') + 1] ?? '20', 10)
  const dryRun  = args.includes('--dry-run')

  console.log(`\n🤖 AI Enrichment${dryRun ? ' (DRY RUN)' : ''} — up to ${limit} vendors\n`)

  const { data: vendors, error } = await supabase
    .from('vendor_directory')
    .select('*')
    .is('enriched_at', null)
    .not('website', 'is', null)
    .limit(limit)

  if (error) { console.error(error); process.exit(1) }
  if (!vendors?.length) { console.log('No unenriched vendors found.'); return }

  console.log(`Found ${vendors.length} vendors to enrich\n`)

  let ok = 0, failed = 0
  for (const vendor of vendors as VendorRecord[]) {
    console.log(`→ ${vendor.name} (${vendor.city})`)
    const success = await enrichVendor(vendor, dryRun)
    if (success) { ok++; console.log(`  ✓ enriched`) }
    else failed++
    // Respect Anthropic rate limits
    await new Promise(r => setTimeout(r, 500))
  }

  console.log(`\n✅ Done. ${ok} enriched, ${failed} failed.`)
  const cost = ok * 0.0002  // rough Haiku estimate
  console.log(`   Estimated cost: ~$${cost.toFixed(3)}`)
}

main().catch(err => { console.error(err); process.exit(1) })
