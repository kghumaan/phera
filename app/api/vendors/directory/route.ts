import { NextRequest, NextResponse } from 'next/server'
import { queryVendors, countVendors } from '@/lib/vendors/directory/service'
import { VendorCategory, VendorFilters } from '@/lib/vendors/directory/types'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams

  const filters: VendorFilters = {
    city:               p.get('city') ?? undefined,
    country_code:       p.get('country_code') ?? undefined,
    category:           (p.get('category') as VendorCategory) ?? undefined,
    max_price:          p.get('max_price') ? parseInt(p.get('max_price')!) : undefined,
    min_rating:         p.get('min_rating') ? parseFloat(p.get('min_rating')!) : undefined,
    has_nri_experience: p.get('nri') === 'true' ? true : undefined,
    languages:          p.get('languages') ? p.get('languages')!.split(',') : undefined,
    limit:              p.get('limit') ? parseInt(p.get('limit')!) : 20,
    offset:             p.get('offset') ? parseInt(p.get('offset')!) : 0,
  }

  try {
    const [vendors, total] = await Promise.all([
      queryVendors(filters),
      countVendors({ city: filters.city, category: filters.category }),
    ])

    return NextResponse.json({ vendors, total, offset: filters.offset, limit: filters.limit })
  } catch (err) {
    console.error('[vendor-directory]', err)
    return NextResponse.json({ error: 'Failed to fetch vendors' }, { status: 500 })
  }
}
