/**
 * Vendor ingestion script — Google Places API → Supabase vendor_directory
 *
 * Usage:
 *   npx tsx scripts/ingest-vendors.ts [--city Goa] [--category photographer] [--dry-run]
 *
 * Requires: GOOGLE_PLACES_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
import { createClient } from '@supabase/supabase-js'
import {
  VendorCategory,
  VendorInsert,
  VENDOR_CITY_CONFIG,
  VENDOR_CATEGORY_LABELS,
  GOOGLE_PLACES_SEARCH_TERMS,
} from '../lib/vendors/directory/types'

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ─── Google Places helpers ──────────────────────────────────────────────────

interface PlacesTextSearchResult {
  id: string
  displayName: { text: string }
  formattedAddress?: string
  nationalPhoneNumber?: string
  internationalPhoneNumber?: string
  websiteUri?: string
  rating?: number
  userRatingCount?: number
  priceLevel?: string  // PRICE_LEVEL_INEXPENSIVE | PRICE_LEVEL_MODERATE | PRICE_LEVEL_EXPENSIVE | PRICE_LEVEL_VERY_EXPENSIVE
  photos?: Array<{ name: string }>
  regularOpeningHours?: unknown
}

// Rough USD price buckets from Google's price level
const PRICE_LEVEL_MAP: Record<string, [number, number]> = {
  PRICE_LEVEL_INEXPENSIVE:   [500,  1500],
  PRICE_LEVEL_MODERATE:      [1500, 4000],
  PRICE_LEVEL_EXPENSIVE:     [4000, 10000],
  PRICE_LEVEL_VERY_EXPENSIVE:[10000, 30000],
}

async function searchPlaces(query: string, locationBias: string): Promise<PlacesTextSearchResult[]> {
  const url = 'https://places.googleapis.com/v1/places:searchText'
  const body = {
    textQuery: query,
    locationBias: { circle: { center: { latitude: 0, longitude: 0 }, radius: 50000 } },
    languageCode: 'en',
    maxResultCount: 20,
  }

  // Use location-specific query rather than a coordinate bias — simpler and accurate enough
  const queryWithLocation = `${query} in ${locationBias}`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_API_KEY!,
      'X-Goog-FieldMask': [
        'places.id',
        'places.displayName',
        'places.formattedAddress',
        'places.nationalPhoneNumber',
        'places.internationalPhoneNumber',
        'places.websiteUri',
        'places.rating',
        'places.userRatingCount',
        'places.priceLevel',
        'places.photos',
      ].join(','),
    },
    body: JSON.stringify({ textQuery: queryWithLocation, maxResultCount: 20 }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Places API error ${res.status}: ${err}`)
  }

  const json = await res.json()
  return json.places ?? []
}

function toVendorInsert(
  place: PlacesTextSearchResult,
  city: string,
  countryCode: string,
  category: VendorCategory,
): VendorInsert {
  const [priceMin, priceMax] = place.priceLevel ? (PRICE_LEVEL_MAP[place.priceLevel] ?? [null, null]) : [null, null]
  return {
    city,
    country_code: countryCode,
    category,
    name: place.displayName.text,
    website: place.websiteUri ?? null,
    phone: place.internationalPhoneNumber ?? place.nationalPhoneNumber ?? null,
    rating: place.rating ?? null,
    review_count: place.userRatingCount ?? null,
    price_range_min: priceMin,
    price_range_max: priceMax,
    source: 'google_places',
    source_id: place.id,
    portfolio_urls: [],
    specialties: [],
    languages: [],
  }
}

// ─── Upsert with dedup ──────────────────────────────────────────────────────

async function upsertVendor(vendor: VendorInsert, dryRun: boolean): Promise<'inserted' | 'updated' | 'skipped'> {
  if (dryRun) {
    console.log(`  [dry-run] would upsert: ${vendor.name}`)
    return 'skipped'
  }

  // Check if this Place ID already exists
  const { data: existing } = await supabase
    .from('vendor_directory')
    .select('id')
    .eq('source', 'google_places')
    .eq('source_id', vendor.source_id!)
    .maybeSingle()

  if (existing) {
    // Only refresh volatile fields. NEVER overwrite category/name/city on
    // re-discovery: a single place (esp. a resort) matches several category
    // searches, and overwriting would let the last-run category win — e.g. a
    // venue getting re-tagged as "live_band". Category is set once, on insert.
    const refresh = {
      rating: vendor.rating,
      review_count: vendor.review_count,
      phone: vendor.phone,
      website: vendor.website,
      price_range_min: vendor.price_range_min,
      price_range_max: vendor.price_range_max,
    }
    const { error } = await supabase
      .from('vendor_directory')
      .update(refresh)
      .eq('id', existing.id)
    if (error) { console.error(`  ✗ ${vendor.name}: ${error.message}`); return 'skipped' }
    return 'updated'
  }

  const { error } = await supabase.from('vendor_directory').insert(vendor)
  if (error) {
    console.error(`  ✗ ${vendor.name}: ${error.message}`)
    return 'skipped'
  }
  return 'inserted'
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  if (!GOOGLE_API_KEY) {
    console.error('❌ GOOGLE_PLACES_API_KEY is not set in .env.local')
    console.error('   Get one at https://console.cloud.google.com → Enable "Places API (New)"')
    process.exit(1)
  }

  const args = process.argv.slice(2)
  // Read the value following a flag, or null if the flag is absent. (Using
  // indexOf(flag)+1 directly is wrong when the flag is missing: indexOf returns
  // -1 and args[0] gets misread as the value.)
  const flagValue = (flag: string): string | null => {
    const i = args.indexOf(flag)
    return i >= 0 ? (args[i + 1] ?? null) : null
  }
  const cityFilter = flagValue('--city')
  const catFilter  = flagValue('--category') as VendorCategory | null
  const dryRun     = args.includes('--dry-run')

  const cities     = cityFilter ? VENDOR_CITY_CONFIG.filter(c => c.city.toLowerCase() === cityFilter.toLowerCase()) : VENDOR_CITY_CONFIG
  const categories = catFilter  ? [catFilter] : Object.keys(GOOGLE_PLACES_SEARCH_TERMS) as VendorCategory[]

  console.log(`\n🗺  Vendor Ingestion${dryRun ? ' (DRY RUN)' : ''}`)
  console.log(`   Cities: ${cities.map(c => c.city).join(', ')}`)
  console.log(`   Categories: ${categories.map(c => VENDOR_CATEGORY_LABELS[c]).join(', ')}\n`)

  let total = 0, inserted = 0, skipped = 0

  for (const cityConfig of cities) {
    for (const category of categories) {
      const terms = GOOGLE_PLACES_SEARCH_TERMS[category]
      const searchTerm = terms[0]  // use primary search term; second is a fallback

      console.log(`\n📍 ${cityConfig.city} → ${VENDOR_CATEGORY_LABELS[category]}`)
      console.log(`   Searching: "${searchTerm} in ${cityConfig.search_name}"`)

      try {
        const places = await searchPlaces(searchTerm, cityConfig.search_name)
        console.log(`   Found ${places.length} places`)

        for (const place of places) {
          // The "wedding venue" search surfaces planners/event companies too —
          // they belong in the wedding_planner category, not venue. Skip them.
          if (category === 'venue' && /\bplanner|weddings by\b/i.test(place.displayName.text)) {
            if (!dryRun) console.log(`   – skip (planner): ${place.displayName.text}`)
            continue
          }
          const vendor = toVendorInsert(place, cityConfig.city, cityConfig.country_code, category)
          const result = await upsertVendor(vendor, dryRun)
          total++
          if (result === 'inserted') inserted++
          else skipped++

          if (!dryRun) {
            console.log(`   ${result === 'inserted' ? '✓' : '⟳'} ${vendor.name}`)
          }
        }

        // Respect Google's rate limit — 10 QPS
        await new Promise(r => setTimeout(r, 120))
      } catch (err) {
        console.error(`   ✗ Error: ${err instanceof Error ? err.message : err}`)
      }
    }
  }

  console.log(`\n✅ Done. ${inserted} inserted, ${skipped} skipped/updated, ${total} total processed.`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
