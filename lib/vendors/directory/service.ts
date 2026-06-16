import { createClient } from '@supabase/supabase-js'
import { VendorRecord, VendorInsert, VendorFilters } from './types'

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing Supabase env vars')
  return createClient(url, key)
}

export async function queryVendors(filters: VendorFilters): Promise<VendorRecord[]> {
  const supabase = getServiceClient()
  let q = supabase
    .from('vendor_directory')
    .select('*')
    .eq('is_active', true)
    .order('has_nri_experience', { ascending: false })
    .order('rating', { ascending: false, nullsFirst: false })

  if (filters.city) q = q.ilike('city', filters.city)
  if (filters.country_code) q = q.eq('country_code', filters.country_code)
  if (filters.category) q = q.eq('category', filters.category)
  if (filters.max_price) q = q.or(`price_range_min.lte.${filters.max_price},price_range_min.is.null`)
  if (filters.min_rating) q = q.gte('rating', filters.min_rating)
  if (filters.has_nri_experience) q = q.eq('has_nri_experience', true)
  if (filters.languages?.length) q = q.overlaps('languages', filters.languages)

  q = q.limit(filters.limit ?? 20).range(filters.offset ?? 0, (filters.offset ?? 0) + (filters.limit ?? 20) - 1)

  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as VendorRecord[]
}

export async function getVendorById(id: string): Promise<VendorRecord | null> {
  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('vendor_directory')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return null
  return data as VendorRecord
}

export async function upsertVendor(vendor: VendorInsert): Promise<VendorRecord> {
  const supabase = getServiceClient()

  if (vendor.source_id) {
    const { data: existing } = await supabase
      .from('vendor_directory')
      .select('id')
      .eq('source', vendor.source)
      .eq('source_id', vendor.source_id)
      .maybeSingle()

    if (existing) {
      const { data, error } = await supabase
        .from('vendor_directory')
        .update(vendor)
        .eq('id', existing.id)
        .select()
        .single()
      if (error) throw error
      return data as VendorRecord
    }
  }

  const { data, error } = await supabase
    .from('vendor_directory')
    .insert(vendor)
    .select()
    .single()
  if (error) throw error
  return data as VendorRecord
}

export async function markEnriched(id: string, updates: Partial<VendorInsert>): Promise<void> {
  const supabase = getServiceClient()
  const { error } = await supabase
    .from('vendor_directory')
    .update({ ...updates, enriched_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function getUnenrichedVendors(limit = 50): Promise<VendorRecord[]> {
  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('vendor_directory')
    .select('*')
    .is('enriched_at', null)
    .not('website', 'is', null)
    .limit(limit)
  if (error) throw error
  return (data ?? []) as VendorRecord[]
}

export async function countVendors(filters: Pick<VendorFilters, 'city' | 'category'>): Promise<number> {
  const supabase = getServiceClient()
  let q = supabase.from('vendor_directory').select('id', { count: 'exact', head: true }).eq('is_active', true)
  if (filters.city) q = q.ilike('city', filters.city)
  if (filters.category) q = q.eq('category', filters.category)
  const { count, error } = await q
  if (error) throw error
  return count ?? 0
}
