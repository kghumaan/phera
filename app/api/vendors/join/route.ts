import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { VendorCategory } from '@/lib/vendors/directory/types'

export const dynamic = 'force-dynamic'

const VALID_CATEGORIES: VendorCategory[] = [
  'photographer','videographer','dj','live_band','mehendi_artist',
  'makeup_hair','decorator_florist','wedding_planner','catering','designer',
]

export async function POST(req: NextRequest) {
  const body = await req.json()

  const {
    business_name, contact_name, email, phone, website,
    instagram_handle, category, cities, logo_url,
    price_range_min, price_range_max, bio,
  } = body

  const cityList: string[] = Array.isArray(cities) ? cities : (cities ? [cities] : [])
  const primaryCity = cityList[0] ?? ''

  if (!business_name?.trim() || !email?.trim() || !category || !primaryCity) {
    return NextResponse.json({ error: 'business_name, email, category, and at least one city are required' }, { status: 400 })
  }

  if (!VALID_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
  }

  // Basic email format check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const portfolioUrls: string[] = logo_url?.trim() ? [logo_url.trim()] : []

  const { error } = await supabase.from('vendor_directory').insert({
    name:             business_name.trim(),
    description:      bio?.trim() || null,
    email:            email.trim().toLowerCase(),
    phone:            phone?.trim() || null,
    website:          website?.trim() || null,
    instagram_handle: instagram_handle?.trim() || null,
    category,
    city:             primaryCity.trim(),
    country_code:     'IN',
    price_range_min:  price_range_min ?? null,
    price_range_max:  price_range_max ?? null,
    portfolio_urls:   portfolioUrls,
    source:           'self_submitted',
    is_active:        true,               // auto-approve; admin can deactivate
    is_verified:      false,
    is_claimed:       true,
  })

  if (error) {
    console.error('[vendor-join]', error)
    return NextResponse.json({ error: 'Failed to save submission' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
