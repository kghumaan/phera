'use client'

import {
  Box, Drawer, Grid, IconButton, Stack, Typography,
  Divider, CircularProgress, Tooltip,
} from '@mui/material'
import React, { useState, useEffect, useCallback, useRef } from 'react'
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder'
import BookmarkIcon from '@mui/icons-material/Bookmark'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import InstagramIcon from '@mui/icons-material/Instagram'
import LanguageIcon from '@mui/icons-material/Language'
import CloseIcon from '@mui/icons-material/Close'
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined'
import CameraAltOutlinedIcon from '@mui/icons-material/CameraAltOutlined'
import VideocamOutlinedIcon from '@mui/icons-material/VideocamOutlined'
import HeadsetOutlinedIcon from '@mui/icons-material/HeadsetOutlined'
import LibraryMusicOutlinedIcon from '@mui/icons-material/LibraryMusicOutlined'
import BrushOutlinedIcon from '@mui/icons-material/BrushOutlined'
import SpaOutlinedIcon from '@mui/icons-material/SpaOutlined'
import LocalFloristOutlinedIcon from '@mui/icons-material/LocalFloristOutlined'
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined'
import RestaurantOutlinedIcon from '@mui/icons-material/RestaurantOutlined'
import StyleOutlinedIcon from '@mui/icons-material/StyleOutlined'
import { COLORS, RADII, FONTS } from '@/lib/theme/tokens'
import { PheraCard } from '@/components/shared/Card'
import { PheraChip } from '@/components/shared/Chip'
import { PageHeading } from '@/components/shared/PageHeading'
import { EmptyState } from '@/components/shared/EmptyState'
import { PrimaryActionButton, SecondaryActionButton } from '@/components/admin/ActionButton'
import UpgradeModal from '@/components/admin/UpgradeModal'
import { usePlan } from '@/lib/contexts/PlanContext'
import type { VendorRecord, VendorCategory } from '@/lib/vendors/directory/types'
import { VENDOR_CATEGORY_LABELS, VENDOR_CITY_CONFIG } from '@/lib/vendors/directory/types'

/* ─── constants ──────────────────────────────────────────────────────────────── */

const CATEGORY_COLORS: Record<VendorCategory, string> = {
  photographer:      '#DE3F5E',
  videographer:      '#7C3AED',
  dj:                '#0E7C5B',
  live_band:         '#D97706',
  mehendi_artist:    '#B45309',
  makeup_hair:       '#BE185D',
  decorator_florist: '#059669',
  wedding_planner:   '#1D4ED8',
  catering:          '#92400E',
  designer:          '#6B21A8',
}

const COUNTRY_FLAGS: Record<string, string> = {
  IN: '🇮🇳', TH: '🇹🇭', ID: '🇮🇩', AE: '🇦🇪',
}

const CATEGORY_ICONS: Record<VendorCategory, React.ReactNode> = {
  photographer:      <CameraAltOutlinedIcon sx={{ fontSize: 18 }} />,
  videographer:      <VideocamOutlinedIcon sx={{ fontSize: 18 }} />,
  dj:                <HeadsetOutlinedIcon sx={{ fontSize: 18 }} />,
  live_band:         <LibraryMusicOutlinedIcon sx={{ fontSize: 18 }} />,
  mehendi_artist:    <BrushOutlinedIcon sx={{ fontSize: 18 }} />,
  makeup_hair:       <SpaOutlinedIcon sx={{ fontSize: 18 }} />,
  decorator_florist: <LocalFloristOutlinedIcon sx={{ fontSize: 18 }} />,
  wedding_planner:   <EventNoteOutlinedIcon sx={{ fontSize: 18 }} />,
  catering:          <RestaurantOutlinedIcon sx={{ fontSize: 18 }} />,
  designer:          <StyleOutlinedIcon sx={{ fontSize: 18 }} />,
}

const PAGE_SIZE = 24

/* ─── helpers ────────────────────────────────────────────────────────────────── */

function formatPrice(min: number | null, max: number | null, currency = 'USD'): string | null {
  if (!min && !max) return null
  const sym = currency === 'INR' ? '₹' : '$'
  const fmt = (v: number) => v >= 1000 ? `${sym}${Math.round(v / 1000)}K` : `${sym}${v}`
  if (min && max) return `${fmt(min)}–${fmt(max)}`
  if (min) return `from ${fmt(min)}`
  return `up to ${fmt(max!)}`
}

function vendorInitial(name: string) {
  return name.trim()[0]?.toUpperCase() ?? '?'
}

/* ─── sub-components ─────────────────────────────────────────────────────────── */

function VendorCard({
  vendor,
  saved,
  onSave,
  onClick,
}: {
  vendor: VendorRecord
  saved: boolean
  onSave: (id: string, save: boolean) => void
  onClick: () => void
}) {
  const price = formatPrice(vendor.price_range_min, vendor.price_range_max, vendor.currency)
  const flag  = COUNTRY_FLAGS[vendor.country_code] ?? ''
  const color = CATEGORY_COLORS[vendor.category]

  return (
    <PheraCard
      sx={{
        p: 2.5,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        cursor: 'pointer',
        transition: 'box-shadow 0.18s ease, transform 0.18s ease',
        '&:hover': { boxShadow: '0 6px 24px rgba(0,0,0,0.1)', transform: 'translateY(-2px)' },
      }}
      onClick={onClick}
    >
      {/* Header row */}
      <Stack direction="row" spacing={1.5} alignItems="flex-start">
        <Box
          sx={{
            width: 40, height: 40, borderRadius: RADII.md,
            bgcolor: color, color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {CATEGORY_ICONS[vendor.category]}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{ fontWeight: 600, fontSize: '0.9rem', fontFamily: FONTS.body, lineHeight: 1.3, mb: 0.25, color: COLORS.text.strong }}
            noWrap
          >
            {vendor.name}
          </Typography>
          <Typography variant="caption" sx={{ color: COLORS.text.subtle }}>
            {VENDOR_CATEGORY_LABELS[vendor.category]} · {flag} {vendor.city}
          </Typography>
        </Box>
        <Tooltip title={saved ? 'Remove from shortlist' : 'Add to shortlist'}>
          <IconButton
            size="small"
            onClick={(e) => { e.stopPropagation(); onSave(vendor.id, !saved) }}
            sx={{ mt: -0.5, mr: -0.5, color: saved ? COLORS.brand.primary : COLORS.text.faint }}
          >
            {saved ? <BookmarkIcon fontSize="small" /> : <BookmarkBorderIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
      </Stack>

      {/* Description */}
      {vendor.description && (
        <Typography
          variant="body2"
          sx={{
            color: COLORS.text.muted, lineHeight: 1.5,
            display: '-webkit-box', WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
            wordBreak: 'break-word',
          }}
        >
          {vendor.description}
        </Typography>
      )}

      {/* Specialties */}
      {vendor.specialties?.length > 0 && (
        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
          {vendor.specialties.slice(0, 3).map((s) => (
            <Box
              key={s}
              sx={{
                px: 1, py: 0.25, borderRadius: '999px',
                bgcolor: COLORS.bg.muted, fontSize: '0.72rem',
                color: COLORS.text.muted, fontFamily: FONTS.body,
              }}
            >
              {s}
            </Box>
          ))}
        </Stack>
      )}

      {/* Footer row */}
      <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 'auto', flexWrap: 'wrap' }}>
        {vendor.rating && (
          <Stack direction="row" spacing={0.4} alignItems="center"
            sx={{
              px: 1, py: 0.3, borderRadius: '999px',
              bgcolor: `${COLORS.brand.primary}10`,
              border: `1px solid ${COLORS.brand.primary}22`,
            }}
          >
            <Box component="span" sx={{ fontSize: '0.72rem', color: COLORS.brand.primary }}>★</Box>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, fontFamily: FONTS.body, color: COLORS.brand.primary, lineHeight: 1 }}>
              {vendor.rating.toFixed(1)}
              {vendor.review_count ? ` (${vendor.review_count})` : ''}
            </Typography>
          </Stack>
        )}
        {price && (
          <Tooltip title="Approx. — confirm pricing directly with vendor">
            <Typography sx={{ fontSize: '0.75rem', color: COLORS.text.muted, fontWeight: 500, fontFamily: FONTS.body, cursor: 'default' }}>
              ~{price}
            </Typography>
          </Tooltip>
        )}
        {vendor.has_nri_experience && (
          <Stack direction="row" alignItems="center"
            sx={{
              ml: 'auto', px: 1, py: 0.3, borderRadius: '999px',
              bgcolor: `${COLORS.brand.primary}10`,
              border: `1px solid ${COLORS.brand.primary}22`,
            }}
          >
            <Typography sx={{ fontSize: '0.75rem', color: COLORS.brand.primary, fontWeight: 600, fontFamily: FONTS.body, lineHeight: 1 }}>
              NRI exp.
            </Typography>
          </Stack>
        )}
      </Stack>
    </PheraCard>
  )
}

function VendorDetailDrawer({
  vendor,
  saved,
  onSave,
  onClose,
}: {
  vendor: VendorRecord | null
  saved: boolean
  onSave: (id: string, save: boolean) => void
  onClose: () => void
}) {
  if (!vendor) return null
  const price = formatPrice(vendor.price_range_min, vendor.price_range_max, vendor.currency)
  const flag  = COUNTRY_FLAGS[vendor.country_code] ?? ''
  const color = CATEGORY_COLORS[vendor.category]

  return (
    <Box sx={{ width: { xs: '100vw', sm: 400 }, p: 0, height: '100%', display: 'flex', flexDirection: 'column', bgcolor: COLORS.bg.white }}>
      {/* Header */}
      <Box sx={{ p: 3, borderBottom: '1px solid rgba(0,0,0,0.07)', bgcolor: COLORS.bg.white }}>
        <Stack direction="row" spacing={2} alignItems="flex-start">
          <Box
            sx={{
              width: 48, height: 48, borderRadius: RADII.md,
              bgcolor: color, color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {CATEGORY_ICONS[vendor.category]}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontWeight: 700, fontSize: '1rem', fontFamily: FONTS.body, lineHeight: 1.3, color: COLORS.text.strong }}>
              {vendor.name}
            </Typography>
            <Typography variant="caption" sx={{ color: COLORS.text.subtle }}>
              {VENDOR_CATEGORY_LABELS[vendor.category]} · {flag} {vendor.city}
            </Typography>
          </Box>
          <IconButton size="small" onClick={onClose} sx={{ mt: -0.5, mr: -0.5 }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Box>

      {/* Body — scrollable */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 3, bgcolor: COLORS.bg.white }}>
        <Stack spacing={3}>

          {/* Badges */}
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {vendor.rating && (
              <Stack direction="row" spacing={0.5} alignItems="center"
                sx={{ px: 1.25, py: 0.5, borderRadius: '999px', bgcolor: `${COLORS.brand.primary}10`, border: `1px solid ${COLORS.brand.primary}30` }}>
                <Box component="span" sx={{ fontSize: '0.8rem', color: COLORS.brand.primary }}>★</Box>
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, fontFamily: FONTS.body, color: COLORS.brand.primary }}>
                  {vendor.rating.toFixed(1)}
                  {vendor.review_count ? ` (${vendor.review_count} reviews)` : ''}
                </Typography>
              </Stack>
            )}
            {vendor.has_nri_experience && (
              <Box sx={{
                px: 1.25, py: 0.5, borderRadius: '999px',
                bgcolor: `${COLORS.brand.primary}10`, border: `1px solid ${COLORS.brand.primary}30`,
                fontSize: '0.78rem', color: COLORS.brand.primary, fontWeight: 600, fontFamily: FONTS.body,
              }}>
                NRI experience
              </Box>
            )}
            {vendor.is_verified && (
              <Box sx={{
                px: 1.25, py: 0.5, borderRadius: '999px',
                bgcolor: '#ECFDF5', border: '1px solid #6EE7B7',
                fontSize: '0.78rem', color: '#065F46', fontWeight: 600, fontFamily: FONTS.body,
              }}>
                ✓ Verified
              </Box>
            )}
          </Stack>

          {/* Pricing */}
          {price && (
            <Box>
              <Typography variant="caption" sx={{ color: COLORS.text.faint, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', mb: 0.5 }}>
                Pricing
              </Typography>
              <Typography sx={{ fontFamily: FONTS.body, fontSize: '0.95rem', color: COLORS.brand.primary, fontWeight: 700 }}>
                ~{price}
              </Typography>
              <Typography variant="caption" sx={{ color: COLORS.text.faint, fontStyle: 'italic', mt: 0.25, display: 'block' }}>
                Approximate — confirm directly with vendor
              </Typography>
            </Box>
          )}

          {/* Bio */}
          {vendor.description && (
            <Box>
              <Typography variant="caption" sx={{ color: COLORS.text.faint, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', mb: 0.75 }}>
                About
              </Typography>
              <Typography variant="body2" sx={{ color: COLORS.text.muted, lineHeight: 1.7 }}>
                {vendor.description}
              </Typography>
            </Box>
          )}

          {/* Specialties */}
          {vendor.specialties?.length > 0 && (
            <Box>
              <Typography variant="caption" sx={{ color: COLORS.text.faint, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', mb: 0.75 }}>
                Specialties
              </Typography>
              <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                {vendor.specialties.map((s) => (
                  <Box key={s} sx={{
                    px: 1.25, py: 0.4, borderRadius: '999px',
                    bgcolor: COLORS.bg.muted, fontSize: '0.8rem',
                    color: COLORS.text.muted, fontFamily: FONTS.body,
                  }}>
                    {s}
                  </Box>
                ))}
              </Stack>
            </Box>
          )}

          {/* Languages */}
          {vendor.languages?.length > 0 && (
            <Box>
              <Typography variant="caption" sx={{ color: COLORS.text.faint, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', mb: 0.75 }}>
                Languages
              </Typography>
              <Typography variant="body2" sx={{ color: COLORS.text.muted }}>
                {vendor.languages.join(', ')}
              </Typography>
            </Box>
          )}

          {/* Links */}
          {(vendor.website || vendor.instagram_handle) && (
            <Box>
              <Typography variant="caption" sx={{ color: COLORS.text.faint, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', mb: 0.75 }}>
                Links
              </Typography>
              <Stack spacing={1}>
                {vendor.website && (
                  <Box
                    component="a"
                    href={vendor.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      display: 'inline-flex', alignItems: 'center', gap: 0.75,
                      color: COLORS.brand.primary, fontSize: '0.875rem', fontFamily: FONTS.body,
                      textDecoration: 'none', '&:hover': { textDecoration: 'underline' },
                    }}
                  >
                    <LanguageIcon sx={{ fontSize: 16 }} />
                    Website
                    <OpenInNewIcon sx={{ fontSize: 12, opacity: 0.6 }} />
                  </Box>
                )}
                {vendor.instagram_handle && (
                  <Box
                    component="a"
                    href={`https://instagram.com/${vendor.instagram_handle.replace(/^@/, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      display: 'inline-flex', alignItems: 'center', gap: 0.75,
                      color: '#E1306C', fontSize: '0.875rem', fontFamily: FONTS.body,
                      textDecoration: 'none', '&:hover': { textDecoration: 'underline' },
                    }}
                  >
                    <InstagramIcon sx={{ fontSize: 16 }} />
                    @{vendor.instagram_handle.replace(/^@/, '')}
                    <OpenInNewIcon sx={{ fontSize: 12, opacity: 0.6 }} />
                  </Box>
                )}
              </Stack>
            </Box>
          )}
        </Stack>
      </Box>

      {/* Footer CTA */}
      <Box sx={{ p: 3, borderTop: '1px solid rgba(0,0,0,0.07)', bgcolor: COLORS.bg.white }}>
        {saved ? (
          <Stack direction="row" spacing={1.5}>
            <SecondaryActionButton
              fullWidth
              onClick={() => onSave(vendor.id, false)}
              startIcon={<BookmarkIcon sx={{ fontSize: '1rem !important' }} />}
            >
              Saved
            </SecondaryActionButton>
            {vendor.website && (
              <PrimaryActionButton
                fullWidth
                onClick={() => { window.open(vendor.website!, '_blank', 'noopener,noreferrer') }}
                endIcon={<OpenInNewIcon sx={{ fontSize: '0.9rem !important' }} />}
              >
                Visit site
              </PrimaryActionButton>
            )}
          </Stack>
        ) : (
          <Stack direction="row" spacing={1.5}>
            <PrimaryActionButton
              fullWidth
              onClick={() => onSave(vendor.id, true)}
              startIcon={<BookmarkBorderIcon sx={{ fontSize: '1rem !important' }} />}
            >
              Save to shortlist
            </PrimaryActionButton>
            {vendor.website && (
              <SecondaryActionButton
                fullWidth
                onClick={() => { window.open(vendor.website!, '_blank', 'noopener,noreferrer') }}
                endIcon={<OpenInNewIcon sx={{ fontSize: '0.9rem !important' }} />}
              >
                Visit site
              </SecondaryActionButton>
            )}
          </Stack>
        )}
      </Box>
    </Box>
  )
}

/* ─── main component ─────────────────────────────────────────────────────────── */

export default function VendorMarketplaceClient({ weddingSlug }: { weddingSlug: string }) {
  const { isPro } = usePlan()
  const [upgradeOpen, setUpgradeOpen] = useState(false)

  // Filter state
  const [cityFilter, setCityFilter]     = useState<string>('')
  const [catFilter,  setCatFilter]      = useState<VendorCategory | ''>('')
  const [nriFilter,  setNriFilter]      = useState(false)

  // Data state
  const [vendors,   setVendors]   = useState<VendorRecord[]>([])
  const [savedIds,  setSavedIds]  = useState<Set<string>>(new Set())
  const [loading,   setLoading]   = useState(false)
  const [hasMore,   setHasMore]   = useState(true)
  const offsetRef                 = useRef(0)

  // Drawer
  const [selected,    setSelected]    = useState<VendorRecord | null>(null)
  const [drawerOpen,  setDrawerOpen]  = useState(false)

  // ── fetch saved ids once ──
  useEffect(() => {
    fetch(`/api/vendors/saved?wedding_id=${weddingSlug}`)
      .then(r => r.json())
      .then(({ saved }) => {
        if (Array.isArray(saved)) {
          setSavedIds(new Set(saved.map((s: { vendor_id: string }) => s.vendor_id)))
        }
      })
      .catch(() => {})
  }, [weddingSlug])

  // ── fetch vendors (reset on filter change) ──
  const fetchVendors = useCallback(async (reset = false) => {
    setLoading(true)
    const offset = reset ? 0 : offsetRef.current
    const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(offset) })
    if (cityFilter)  params.set('city', cityFilter)
    if (catFilter)   params.set('category', catFilter)
    if (nriFilter)   params.set('nri', 'true')

    try {
      const res  = await fetch(`/api/vendors/directory?${params}`)
      const json = await res.json()
      const data: VendorRecord[] = json.vendors ?? []
      if (reset) {
        setVendors(data)
        offsetRef.current = data.length
      } else {
        setVendors(v => {
          const seen = new Set(v.map(x => x.id))
          return [...v, ...data.filter(x => !seen.has(x.id))]
        })
        offsetRef.current = offset + data.length
      }
      setHasMore(data.length === PAGE_SIZE)
    } finally {
      setLoading(false)
    }
  }, [cityFilter, catFilter, nriFilter])

  useEffect(() => {
    offsetRef.current = 0
    fetchVendors(true)
  }, [fetchVendors])

  // ── save / unsave ──
  async function handleSave(vendorId: string, save: boolean) {
    setSavedIds(prev => {
      const next = new Set(prev)
      save ? next.add(vendorId) : next.delete(vendorId)
      return next
    })
    await fetch('/api/vendors/saved', {
      method:  save ? 'POST' : 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ wedding_id: weddingSlug, vendor_id: vendorId }),
    })
  }

  // ── Pro gate ──
  if (!isPro && !weddingSlug.startsWith('demo-')) {
    return (
      <Box sx={{ maxWidth: 960 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'flex-start' }} spacing={2} sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, color: COLORS.text.strong }}>
              Vendor Marketplace
            </Typography>
            <Typography variant="body2" sx={{ color: COLORS.text.subtle }}>
              1,200+ photographers, planners, DJs, and more across 9 destination wedding cities.
            </Typography>
          </Box>
          <PrimaryActionButton onClick={() => setUpgradeOpen(true)} sx={{ whiteSpace: 'nowrap' }}>
            Upgrade to Pro
          </PrimaryActionButton>
        </Stack>

        <Box sx={{ position: 'relative', borderRadius: RADII.md, overflow: 'hidden' }}>
          {/* Blurred mock grid */}
          <Grid container spacing={2} sx={{ filter: 'blur(5px)', pointerEvents: 'none', userSelect: 'none' }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
                <PheraCard sx={{ p: 2.5, height: 160 }}>
                  <Stack spacing={1.5}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Box sx={{ width: 40, height: 40, borderRadius: RADII.md, bgcolor: COLORS.bg.muted }} />
                      <Box>
                        <Box sx={{ width: 100, height: 12, borderRadius: 1, bgcolor: COLORS.bg.muted, mb: 0.75 }} />
                        <Box sx={{ width: 70,  height: 10, borderRadius: 1, bgcolor: COLORS.bg.subtle }} />
                      </Box>
                    </Stack>
                    <Box sx={{ width: '90%', height: 10, borderRadius: 1, bgcolor: COLORS.bg.subtle }} />
                    <Box sx={{ width: '70%', height: 10, borderRadius: 1, bgcolor: COLORS.bg.subtle }} />
                  </Stack>
                </PheraCard>
              </Grid>
            ))}
          </Grid>
          {/* Lock overlay */}
          <Box
            sx={{
              position: 'absolute', inset: 0,
              backdropFilter: 'blur(2px)', bgcolor: 'rgba(255,255,255,0.6)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 2,
            }}
          >
            <StorefrontOutlinedIcon sx={{ fontSize: 40, color: COLORS.text.faint }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: COLORS.text.strong }}>
              Vendor Marketplace
            </Typography>
            <Typography variant="body2" sx={{ color: COLORS.text.muted, textAlign: 'center', maxWidth: 360 }}>
              Browse and shortlist vendors for your destination wedding. Available on Pro.
            </Typography>
            <PrimaryActionButton onClick={() => setUpgradeOpen(true)}>
              Upgrade to Pro
            </PrimaryActionButton>
          </Box>
        </Box>

        <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
      </Box>
    )
  }

  const cities      = VENDOR_CITY_CONFIG.map(c => c.city)
  const categories  = Object.entries(VENDOR_CATEGORY_LABELS) as [VendorCategory, string][]

  return (
    <Box sx={{ maxWidth: 1100 }}>
      <PageHeading
        title="Vendor Marketplace"
        subtitle={`Browse 1,200+ curated vendors across 9 destination wedding cities. ${savedIds.size > 0 ? `${savedIds.size} saved.` : ''}`}
      />

      {/* ── Filter bar ── */}
      <Box sx={{ mt: 3, mb: 4 }}>
        {/* City filter */}
        <Box sx={{ mb: 1.5 }}>
          <Typography variant="caption" sx={{ color: COLORS.text.faint, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', mb: 1 }}>
            City
          </Typography>
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
            <PheraChip
              label="All cities"
              tone={cityFilter === '' ? 'brand' : 'neutral'}
              onClick={() => setCityFilter('')}
              clickable
            />
            {cities.map(c => (
              <PheraChip
                key={c}
                label={c}
                tone={cityFilter === c ? 'brand' : 'neutral'}
                onClick={() => setCityFilter(cityFilter === c ? '' : c)}
                clickable
              />
            ))}
          </Stack>
        </Box>

        {/* Category filter */}
        <Box sx={{ mb: 1.5 }}>
          <Typography variant="caption" sx={{ color: COLORS.text.faint, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', mb: 1 }}>
            Category
          </Typography>
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
            <PheraChip
              label="All types"
              tone={catFilter === '' ? 'brand' : 'neutral'}
              onClick={() => setCatFilter('')}
              clickable
            />
            {categories.map(([val, label]) => (
              <PheraChip
                key={val}
                label={label}
                tone={catFilter === val ? 'brand' : 'neutral'}
                onClick={() => setCatFilter(catFilter === val ? '' : val)}
                clickable
              />
            ))}
          </Stack>
        </Box>

        {/* Filters row */}
        <Stack direction="row" spacing={1} alignItems="center">
          <PheraChip
            label="NRI experience only"
            tone={nriFilter ? 'brand' : 'neutral'}
            onClick={() => setNriFilter(v => !v)}
            clickable
          />
          {savedIds.size > 0 && (
            <PheraChip
              label={`Shortlist (${savedIds.size})`}
              tone="success"
              clickable={false}
            />
          )}
        </Stack>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* ── Results ── */}
      {vendors.length === 0 && !loading ? (
        <EmptyState
          icon={<StorefrontOutlinedIcon sx={{ fontSize: 40 }} />}
          title="No vendors found"
          subtitle="Try changing the city or category filter."
        />
      ) : (
        <>
          <Grid container spacing={2}>
            {vendors.map(v => (
              <Grid key={v.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <VendorCard
                  vendor={v}
                  saved={savedIds.has(v.id)}
                  onSave={handleSave}
                  onClick={() => { setSelected(v); setDrawerOpen(true) }}
                />
              </Grid>
            ))}
          </Grid>

          {hasMore && (
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
              <SecondaryActionButton
                onClick={() => fetchVendors(false)}
                loading={loading}
              >
                Load more
              </SecondaryActionButton>
            </Box>
          )}

          {loading && vendors.length > 0 && (
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
              <CircularProgress size={24} sx={{ color: COLORS.brand.primary }} />
            </Box>
          )}
        </>
      )}

      {loading && vendors.length === 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress sx={{ color: COLORS.brand.primary }} />
        </Box>
      )}

      {/* ── Detail drawer ── */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: '100vw', sm: 420 },
            boxShadow: '-4px 0 24px rgba(0,0,0,0.08)',
            bgcolor: COLORS.bg.white,
            top: { xs: '48px', md: '56px' },
            height: { xs: 'calc(100% - 48px)', md: 'calc(100% - 56px)' },
          },
        }}
      >
        <VendorDetailDrawer
          vendor={selected}
          saved={selected ? savedIds.has(selected.id) : false}
          onSave={handleSave}
          onClose={() => setDrawerOpen(false)}
        />
      </Drawer>
    </Box>
  )
}
