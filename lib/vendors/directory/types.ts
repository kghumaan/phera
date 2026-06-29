export type VendorCategory =
  | 'venue'
  | 'hotel'
  | 'photographer'
  | 'videographer'
  | 'dj'
  | 'live_band'
  | 'mehendi_artist'
  | 'makeup_hair'
  | 'decorator_florist'
  | 'wedding_planner'
  | 'catering'
  | 'designer'

export type VendorSource = 'google_places' | 'yelp' | 'self_submitted' | 'manual_curated'

export interface VendorRecord {
  id: string
  city: string
  country_code: string
  category: VendorCategory
  name: string
  description: string | null
  website: string | null
  phone: string | null
  email: string | null
  instagram_handle: string | null
  price_range_min: number | null
  price_range_max: number | null
  currency: string
  rating: number | null
  review_count: number | null
  portfolio_urls: string[]
  specialties: string[]
  languages: string[]
  has_nri_experience: boolean
  source: VendorSource
  source_id: string | null
  is_claimed: boolean
  is_verified: boolean
  is_active: boolean
  last_verified_at: string | null
  enriched_at: string | null
  created_at: string
  updated_at: string
}

export interface VendorInsert {
  city: string
  country_code: string
  category: VendorCategory
  name: string
  description?: string | null
  website?: string | null
  phone?: string | null
  email?: string | null
  instagram_handle?: string | null
  price_range_min?: number | null
  price_range_max?: number | null
  currency?: string
  rating?: number | null
  review_count?: number | null
  portfolio_urls?: string[]
  specialties?: string[]
  languages?: string[]
  has_nri_experience?: boolean
  source: VendorSource
  source_id?: string | null
  is_claimed?: boolean
  is_verified?: boolean
}

export interface VendorFilters {
  city?: string
  country_code?: string
  category?: VendorCategory
  max_price?: number
  min_rating?: number
  has_nri_experience?: boolean
  languages?: string[]
  limit?: number
  offset?: number
}

export const VENDOR_CATEGORY_LABELS: Record<VendorCategory, string> = {
  venue: 'Wedding Venue',
  hotel: 'Hotel',
  photographer: 'Photographer',
  videographer: 'Videographer',
  dj: 'DJ',
  live_band: 'Live Band',
  mehendi_artist: 'Mehendi Artist',
  makeup_hair: 'Makeup & Hair',
  decorator_florist: 'Decorator & Florist',
  wedding_planner: 'Wedding Planner',
  catering: 'Catering',
  designer: 'Designer',
}

export const VENDOR_CITY_CONFIG: Array<{
  city: string
  country_code: string
  country: string
  region: 'India' | 'International'
  search_name: string  // how Google knows the city
}> = [
  { city: 'Goa',       country_code: 'IN', country: 'India',     region: 'India',         search_name: 'Goa, India' },
  { city: 'Udaipur',  country_code: 'IN', country: 'India',     region: 'India',         search_name: 'Udaipur, Rajasthan, India' },
  { city: 'Jaipur',   country_code: 'IN', country: 'India',     region: 'India',         search_name: 'Jaipur, Rajasthan, India' },
  { city: 'Jodhpur',  country_code: 'IN', country: 'India',     region: 'India',         search_name: 'Jodhpur, Rajasthan, India' },
  { city: 'Rishikesh',country_code: 'IN', country: 'India',     region: 'India',         search_name: 'Rishikesh, Uttarakhand, India' },
  { city: 'Kerala',   country_code: 'IN', country: 'India',     region: 'India',         search_name: 'Kochi, Kerala, India' },
  { city: 'Bangkok',  country_code: 'TH', country: 'Thailand',  region: 'International', search_name: 'Bangkok, Thailand' },
  { city: 'Hua Hin',  country_code: 'TH', country: 'Thailand',  region: 'International', search_name: 'Hua Hin, Thailand' },
  { city: 'Bali',     country_code: 'ID', country: 'Indonesia', region: 'International', search_name: 'Bali, Indonesia' },
  { city: 'Dubai',    country_code: 'AE', country: 'UAE',       region: 'International', search_name: 'Dubai, UAE' },
]

export const GOOGLE_PLACES_SEARCH_TERMS: Record<VendorCategory, string[]> = {
  venue:              ['wedding venue', 'banquet hall', 'wedding resort'],
  hotel:              ['luxury hotel', '5 star hotel', 'wedding hotel resort'],
  photographer:       ['Indian wedding photographer', 'wedding photographer'],
  videographer:       ['Indian wedding videographer', 'wedding cinematographer'],
  dj:                 ['DJ for Indian wedding', 'wedding DJ'],
  live_band:          ['Indian wedding band', 'Bollywood live band'],
  mehendi_artist:     ['mehendi artist', 'henna artist wedding'],
  makeup_hair:        ['Indian bridal makeup artist', 'bridal hair makeup'],
  decorator_florist:  ['Indian wedding decorator', 'wedding floral decorator'],
  wedding_planner:    ['Indian wedding planner', 'destination wedding planner'],
  catering:           ['Indian wedding catering', 'wedding caterer'],
  designer:           ['Indian bridal designer', 'lehenga designer'],
}
