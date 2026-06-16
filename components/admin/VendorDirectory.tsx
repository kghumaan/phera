'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Box, Grid, Typography, Skeleton, Avatar,
  Link, Rating, Stack, Collapse,
} from '@mui/material'
import StarIcon from '@mui/icons-material/Star'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import InstagramIcon from '@mui/icons-material/Instagram'
import FilterListIcon from '@mui/icons-material/FilterList'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { PheraCard } from '@/components/shared/Card'
import { PheraChip } from '@/components/shared/Chip'
import { EmptyState } from '@/components/shared/EmptyState'
import { SectionHeading } from '@/components/shared/PageHeading'
import { PrimaryActionButton, SecondaryActionButton } from '@/components/admin/ActionButton'
import { COLORS, RADII } from '@/lib/theme/tokens'
import {
  VendorRecord,
  VendorCategory,
  VendorFilters,
  VENDOR_CATEGORY_LABELS,
  VENDOR_CITY_CONFIG,
} from '@/lib/vendors/directory/types'

// ─── Filter bar ──────────────────────────────────────────────────────────────

const CATEGORIES: Array<{ value: VendorCategory | ''; label: string }> = [
  { value: '', label: 'All' },
  ...Object.entries(VENDOR_CATEGORY_LABELS).map(([v, l]) => ({
    value: v as VendorCategory,
    label: l,
  })),
]

const PRICE_BUCKETS = [
  { label: 'Any budget', max: undefined },
  { label: 'Under $2K',  max: 2000 },
  { label: 'Under $5K',  max: 5000 },
  { label: 'Under $10K', max: 10000 },
]

interface FilterBarProps {
  city: string
  category: VendorCategory | ''
  maxPrice: number | undefined
  nriOnly: boolean
  onCityChange: (c: string) => void
  onCategoryChange: (c: VendorCategory | '') => void
  onMaxPriceChange: (p: number | undefined) => void
  onNriToggle: () => void
}

function FilterBar({
  city, category, maxPrice, nriOnly,
  onCityChange, onCategoryChange, onMaxPriceChange, onNriToggle,
}: FilterBarProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {/* City row */}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {VENDOR_CITY_CONFIG.map(c => (
          <PheraChip
            key={c.city}
            label={c.city}
            tone={city === c.city ? 'brand' : 'neutral'}
            onClick={() => onCityChange(c.city)}
            sx={{ cursor: 'pointer' }}
          />
        ))}
      </Box>

      {/* Category row */}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {CATEGORIES.map(c => (
          <PheraChip
            key={c.value || 'all'}
            label={c.label}
            tone={category === c.value ? 'brand' : 'neutral'}
            onClick={() => onCategoryChange(c.value as VendorCategory | '')}
            sx={{ cursor: 'pointer' }}
          />
        ))}
      </Box>

      {/* Price + NRI row */}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
        {PRICE_BUCKETS.map(b => (
          <PheraChip
            key={b.label}
            label={b.label}
            tone={maxPrice === b.max ? 'brand' : 'neutral'}
            onClick={() => onMaxPriceChange(b.max)}
            sx={{ cursor: 'pointer' }}
          />
        ))}
        <PheraChip
          label="NRI experience"
          tone={nriOnly ? 'success' : 'neutral'}
          onClick={onNriToggle}
          sx={{ cursor: 'pointer' }}
          icon={nriOnly ? <CheckCircleIcon sx={{ fontSize: 14 }} /> : undefined}
        />
      </Box>
    </Box>
  )
}

// ─── Vendor card ─────────────────────────────────────────────────────────────

function VendorCard({ vendor }: { vendor: VendorRecord }) {
  const priceLabel = vendor.price_range_min && vendor.price_range_max
    ? `$${vendor.price_range_min.toLocaleString()}–$${vendor.price_range_max.toLocaleString()}`
    : vendor.price_range_min
      ? `From $${vendor.price_range_min.toLocaleString()}`
      : null

  return (
    <PheraCard sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
        <Avatar sx={{ bgcolor: COLORS.brand.primary, width: 40, height: 40, fontSize: 16, flexShrink: 0 }}>
          {vendor.name[0]}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
            {vendor.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {VENDOR_CATEGORY_LABELS[vendor.category]} · {vendor.city}
          </Typography>
        </Box>
        {vendor.is_verified && (
          <CheckCircleIcon sx={{ color: COLORS.accent.success, fontSize: 18, flexShrink: 0 }} />
        )}
      </Box>

      {/* Rating + price */}
      {(vendor.rating || priceLabel) && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {vendor.rating && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <StarIcon sx={{ fontSize: 14, color: '#F59E0B' }} />
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                {vendor.rating.toFixed(1)}
              </Typography>
              {vendor.review_count && (
                <Typography variant="caption" color="text.secondary">
                  ({vendor.review_count})
                </Typography>
              )}
            </Box>
          )}
          {priceLabel && (
            <Typography variant="caption" sx={{ color: COLORS.brand.primary, fontWeight: 600 }}>
              {priceLabel}
            </Typography>
          )}
        </Box>
      )}

      {/* Description */}
      {vendor.description && (
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5, flex: 1 }}>
          {vendor.description}
        </Typography>
      )}

      {/* Specialties */}
      {vendor.specialties.length > 0 && (
        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
          {vendor.specialties.slice(0, 4).map(s => (
            <PheraChip key={s} label={s} tone="neutral" size="small" />
          ))}
        </Box>
      )}

      {/* Languages + NRI badge */}
      <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', alignItems: 'center' }}>
        {vendor.languages.slice(0, 3).map(l => (
          <PheraChip key={l} label={l} tone="info" size="small" />
        ))}
        {vendor.has_nri_experience && (
          <PheraChip label="NRI exp." tone="success" size="small" />
        )}
      </Box>

      {/* Links */}
      <Box sx={{ display: 'flex', gap: 1.5, mt: 'auto', pt: 0.5 }}>
        {vendor.website && (
          <Link href={vendor.website} target="_blank" rel="noopener noreferrer"
            sx={{ display: 'flex', alignItems: 'center', gap: 0.4, fontSize: 12, color: COLORS.brand.primary }}>
            <OpenInNewIcon sx={{ fontSize: 13 }} /> Website
          </Link>
        )}
        {vendor.instagram_handle && (
          <Link
            href={`https://instagram.com/${vendor.instagram_handle}`}
            target="_blank" rel="noopener noreferrer"
            sx={{ display: 'flex', alignItems: 'center', gap: 0.4, fontSize: 12, color: '#E1306C' }}>
            <InstagramIcon sx={{ fontSize: 13 }} /> @{vendor.instagram_handle}
          </Link>
        )}
      </Box>
    </PheraCard>
  )
}

function VendorCardSkeleton() {
  return (
    <PheraCard sx={{ p: 2.5 }}>
      <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
        <Skeleton variant="circular" width={40} height={40} />
        <Box sx={{ flex: 1 }}>
          <Skeleton width="60%" height={20} />
          <Skeleton width="40%" height={16} />
        </Box>
      </Box>
      <Skeleton height={16} sx={{ mb: 0.5 }} />
      <Skeleton width="80%" height={16} sx={{ mb: 1.5 }} />
      <Skeleton width="90%" height={60} sx={{ mb: 1 }} />
    </PheraCard>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface VendorDirectoryProps {
  /** The wedding city — pre-fills the city filter. */
  defaultCity?: string
  /** If true, shows the "Do you already have a X?" prompt before showing results. */
  showVendorCheckPrompt?: boolean
}

export function VendorDirectory({ defaultCity, showVendorCheckPrompt = true }: VendorDirectoryProps) {
  const [city, setCity]           = useState(defaultCity ?? VENDOR_CITY_CONFIG[0].city)
  const [category, setCategory]   = useState<VendorCategory | ''>('')
  const [maxPrice, setMaxPrice]   = useState<number | undefined>(undefined)
  const [nriOnly, setNriOnly]     = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const [vendors, setVendors]     = useState<VendorRecord[]>([])
  const [total, setTotal]         = useState(0)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)

  // "Do you already have a X?" prompt state
  const [vendorCheckDismissed, setVendorCheckDismissed] = useState(!showVendorCheckPrompt)
  const [hasVendor, setHasVendor] = useState<boolean | null>(null)

  const fetchVendors = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ city, limit: '12' })
      if (category) params.set('category', category)
      if (maxPrice) params.set('max_price', String(maxPrice))
      if (nriOnly)  params.set('nri', 'true')

      const res = await fetch(`/api/vendors/directory?${params}`)
      if (!res.ok) throw new Error('Failed to load vendors')
      const data = await res.json()
      setVendors(data.vendors)
      setTotal(data.total)
    } catch {
      setError('Could not load vendor suggestions. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [city, category, maxPrice, nriOnly])

  useEffect(() => {
    if (vendorCheckDismissed && hasVendor !== true) {
      fetchVendors()
    }
  }, [fetchVendors, vendorCheckDismissed, hasVendor])

  // ── Vendor check prompt ──
  if (!vendorCheckDismissed) {
    const categoryLabel = category ? VENDOR_CATEGORY_LABELS[category] : 'vendors'
    return (
      <PheraCard variant="muted" sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Do you already have a {categoryLabel}?
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          If you have someone in mind, we can help coordinate with them. Otherwise, we can suggest options in {city}.
        </Typography>
        <Stack direction="row" spacing={2} justifyContent="center">
          <SecondaryActionButton onClick={() => { setHasVendor(true); setVendorCheckDismissed(true) }}>
            Yes, I have one
          </SecondaryActionButton>
          <PrimaryActionButton onClick={() => { setHasVendor(false); setVendorCheckDismissed(true) }}>
            Show me options
          </PrimaryActionButton>
        </Stack>
      </PheraCard>
    )
  }

  if (hasVendor === true) {
    return (
      <PheraCard variant="muted" sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Great! You can add their contact details in the vendor section, and we&apos;ll coordinate with them directly.
        </Typography>
        <SecondaryActionButton sx={{ mt: 2 }} onClick={() => { setHasVendor(null); setVendorCheckDismissed(true) }}>
          Browse options anyway
        </SecondaryActionButton>
      </PheraCard>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
        <Box>
          <SectionHeading title="Vendor Suggestions" />
          <Typography variant="body2" color="text.secondary">
            {total > 0 ? `${total} vendors in ${city}` : `Vendors in ${city}`}
          </Typography>
        </Box>
        <SecondaryActionButton
          startIcon={<FilterListIcon />}
          onClick={() => setShowFilters((f: boolean) => !f)}
          sx={{ flexShrink: 0 }}
        >
          Filter
        </SecondaryActionButton>
      </Box>

      {/* Filters */}
      <Collapse in={showFilters}>
        <PheraCard variant="muted" sx={{ p: 2 }}>
          <FilterBar
            city={city}
            category={category}
            maxPrice={maxPrice}
            nriOnly={nriOnly}
            onCityChange={setCity}
            onCategoryChange={setCategory}
            onMaxPriceChange={setMaxPrice}
            onNriToggle={() => setNriOnly((n: boolean) => !n)}
          />
        </PheraCard>
      </Collapse>

      {/* Error */}
      {error && (
        <Typography variant="body2" color="error">{error}</Typography>
      )}

      {/* Grid */}
      {loading ? (
        <Grid container spacing={2}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
              <VendorCardSkeleton />
            </Grid>
          ))}
        </Grid>
      ) : vendors.length === 0 ? (
        <EmptyState
          title="No vendors found"
          subtitle="Try adjusting your filters or city selection."
        />
      ) : (
        <Grid container spacing={2}>
          {vendors.map((v: VendorRecord) => (
            <Grid key={v.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <VendorCard vendor={v} />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Attribution (required by Google ToS) */}
      {vendors.some((v: VendorRecord) => v.source === 'google_places') && (
        <Typography variant="caption" color="text.disabled" sx={{ textAlign: 'right' }}>
          Some listings sourced from Google Places
        </Typography>
      )}
    </Box>
  )
}
