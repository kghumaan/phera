'use client';

/**
 * Public, no-login vendor directory. Reads the live `vendor_directory` table
 * (~1,259 vendors) through the public /api/vendors/directory route. City,
 * category, and NRI filters are server-backed; "Load more" pages through.
 * Contact details (phone/email) are intentionally gated behind signup — the
 * public card shows name, rating, price, specialties, and the vendor's own
 * website, with a "Sign up to save & contact" CTA.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Stack, Typography, CircularProgress } from '@mui/material';
import Link from 'next/link';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded';
import { COLORS, RADII, FONTS, SHADOWS } from '@/lib/theme/tokens';
import { EmptyState } from '@/components/shared/EmptyState';
import { EstimateInfo } from '@/components/shared/EstimateInfo';
import { supabase } from '@/lib/supabase/client';
import {
  estimateGuestCapacity,
  estimateWeddingCostUsd,
  formatCapacity,
  formatCostBand,
} from '@/lib/vendors/estimates';
import {
  VendorRecord,
  VendorCategory,
  VENDOR_CATEGORY_LABELS,
  VENDOR_CITY_CONFIG,
} from '@/lib/vendors/directory/types';

const PAGE = 24;

const FLAG: Record<string, string> = { IN: '🇮🇳', TH: '🇹🇭', ID: '🇮🇩', AE: '🇦🇪' };

// Stable per-category accent (token-backed) so cards in a category share a
// color family.
const CATEGORY_COLOR: Record<VendorCategory, string> = {
  venue: COLORS.cultural.gold,
  hotel: COLORS.accent.info,
  photographer: COLORS.brand.primary,
  videographer: COLORS.cultural.purple,
  dj: COLORS.cultural.teal,
  live_band: COLORS.accent.warning,
  mehendi_artist: COLORS.cultural.maroon,
  makeup_hair: COLORS.side.both,
  decorator_florist: COLORS.accent.success,
  wedding_planner: COLORS.accent.info,
  catering: COLORS.cultural.saffron,
  designer: COLORS.cultural.coral,
};

function formatPrice(min: number | null, max: number | null, currency = 'USD'): string | null {
  if (!min && !max) return null;
  const sym = currency === 'INR' ? '₹' : '$';
  const fmt = (v: number) => (v >= 1000 ? `${sym}${Math.round(v / 1000)}K` : `${sym}${v}`);
  if (min && max) return `${fmt(min)}–${fmt(max)}`;
  if (min) return `from ${fmt(min)}`;
  return `up to ${fmt(max!)}`;
}

function vendorInitial(name: string) {
  return name.trim()[0]?.toUpperCase() ?? '?';
}

/* ─── filter chip ─────────────────────────────────────────────────────────── */

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      sx={{
        cursor: 'pointer',
        px: 1.5,
        py: 0.5,
        borderRadius: RADII.pill,
        fontFamily: FONTS.body,
        fontSize: '0.875rem',
        fontWeight: active ? 600 : 500,
        lineHeight: 1.4,
        border: '1px solid',
        borderColor: active ? COLORS.brand.primary : 'rgba(0,0,0,0.14)',
        color: active ? 'white' : COLORS.text.muted,
        bgcolor: active ? COLORS.brand.primary : 'white',
        transition: 'all 0.15s ease',
        '&:hover': {
          borderColor: COLORS.brand.primary,
          color: active ? 'white' : COLORS.brand.primary,
        },
      }}
    >
      {children}
    </Box>
  );
}

/* ─── vendor card ─────────────────────────────────────────────────────────── */

/** Best direct-contact link for a logged-in couple (the signup gate is lifted):
 *  Instagram → email → phone. Null when only a website exists (already shown). */
function contactHref(v: VendorRecord): { href: string; label: string; external: boolean } | null {
  if (v.instagram_handle) {
    return { href: `https://instagram.com/${v.instagram_handle.replace(/^@/, '')}`, label: 'Instagram', external: true };
  }
  if (v.email) return { href: `mailto:${v.email}`, label: 'Email', external: false };
  if (v.phone) return { href: `tel:${v.phone}`, label: 'Call', external: false };
  return null;
}

function VendorCard({ v, isLoggedIn }: { v: VendorRecord; isLoggedIn: boolean }) {
  const [imgFailed, setImgFailed] = useState(false);
  const price = formatPrice(v.price_range_min, v.price_range_max, v.currency);
  const color = CATEGORY_COLOR[v.category] ?? COLORS.brand.primary;
  // The business's own Google photo (server-proxied so the API key stays off the
  // client) when we have a place id; otherwise a gradient + initial.
  const photoUrl =
    v.source === 'google_places' && v.source_id
      ? `/api/vendors/photo?placeId=${encodeURIComponent(v.source_id)}`
      : null;
  const showImage = !!photoUrl && !imgFailed;
  // Placeholder estimates (venues/hotels only) — shown behind the info icon.
  const capacity = estimateGuestCapacity(v);
  const costEstimate = estimateWeddingCostUsd(v);
  // Logged-in couples get a real contact link; guests see the signup gate.
  const contact = isLoggedIn ? contactHref(v) : null;
  return (
    <Box
      sx={{
        bgcolor: 'white',
        borderRadius: RADII.lg,
        border: '1px solid rgba(0,0,0,0.07)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'box-shadow 0.2s ease, transform 0.2s ease',
        '&:hover': { boxShadow: SHADOWS.card, transform: 'translateY(-3px)' },
      }}
    >
      {/* Image header — the business's own Google photo, or a gradient + initial. */}
      <Box sx={{ position: 'relative', height: 172, width: '100%' }}>
        {showImage ? (
          <Box
            component="img"
            src={photoUrl as string}
            alt=""
            aria-hidden
            onError={() => setImgFailed(true)}
            sx={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <Box
            sx={{
              height: '100%',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.5,
              background: `linear-gradient(135deg, ${color}1f 0%, ${COLORS.cultural.gold}1f 100%)`,
            }}
          >
            <Typography sx={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: FONTS.body, color }}>
              {vendorInitial(v.name)}
            </Typography>
            <Typography variant="caption" sx={{ color: COLORS.text.muted }}>
              {VENDOR_CATEGORY_LABELS[v.category]}
            </Typography>
          </Box>
        )}
        {v.has_nri_experience && (
          <Box
            sx={{
              position: 'absolute',
              top: 10,
              left: 10,
              px: 1,
              py: 0.3,
              borderRadius: RADII.pill,
              bgcolor: 'white',
              border: '1px solid rgba(0,0,0,0.06)',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: COLORS.brand.primary,
              fontFamily: FONTS.body,
            }}
          >
            NRI exp.
          </Box>
        )}
      </Box>

      {/* Body */}
      <Stack spacing={0.85} sx={{ p: 2, flex: 1 }}>
        <Box>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', fontFamily: FONTS.body, lineHeight: 1.3, color: COLORS.text.strong, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {v.name}
            </Typography>
            {v.is_verified && <VerifiedRoundedIcon sx={{ fontSize: 15, color: COLORS.brand.primary, flexShrink: 0 }} />}
          </Stack>
          <Typography variant="caption" sx={{ color: COLORS.text.subtle }}>
            {VENDOR_CATEGORY_LABELS[v.category]} · {FLAG[v.country_code] ?? ''} {v.city}
          </Typography>
        </Box>

        {/* Rating + price */}
        <Stack direction="row" spacing={1.25} alignItems="center" flexWrap="wrap" sx={{ rowGap: 0.3 }}>
          {v.rating != null && (
            <Stack direction="row" spacing={0.3} alignItems="center">
              <StarRoundedIcon sx={{ fontSize: 15, color: COLORS.accent.warning }} />
              <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, fontFamily: FONTS.body, color: COLORS.text.strong }}>
                {v.rating.toFixed(1)}
              </Typography>
              {v.review_count != null && (
                <Typography sx={{ fontSize: '0.875rem', color: COLORS.text.subtle }}>({v.review_count})</Typography>
              )}
            </Stack>
          )}
          {price && !costEstimate && (
            <Typography sx={{ fontSize: '0.875rem', color: COLORS.brand.primary, fontWeight: 600, fontFamily: FONTS.body }}>
              {price}
            </Typography>
          )}
        </Stack>

        {/* Estimated capacity + all-in wedding cost (venues/hotels) — placeholders. */}
        {(capacity || costEstimate) && (
          <Stack direction="row" spacing={1.25} alignItems="center" flexWrap="wrap" sx={{ rowGap: 0.3 }}>
            {capacity && (
              <Stack direction="row" spacing={0.3} alignItems="center">
                <GroupsRoundedIcon sx={{ fontSize: 15, color: COLORS.text.faint }} />
                <Typography sx={{ fontSize: '0.875rem', color: COLORS.text.muted, fontFamily: FONTS.body }}>
                  {formatCapacity(capacity)}
                </Typography>
              </Stack>
            )}
            {costEstimate && (
              <Stack direction="row" spacing={0.3} alignItems="center">
                <PaymentsRoundedIcon sx={{ fontSize: 14, color: COLORS.text.faint }} />
                <Typography sx={{ fontSize: '0.875rem', color: COLORS.text.strong, fontWeight: 600, fontFamily: FONTS.body }}>
                  ~{formatCostBand(costEstimate)}
                </Typography>
              </Stack>
            )}
            <EstimateInfo size={14} />
          </Stack>
        )}

        {v.specialties?.length > 0 && (
          <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.5 }}>
            {v.specialties.slice(0, 2).map((s) => (
              <Box
                key={s}
                sx={{
                  px: 1,
                  py: 0.25,
                  borderRadius: RADII.pill,
                  bgcolor: COLORS.bg.muted,
                  fontSize: '0.875rem',
                  fontFamily: FONTS.body,
                  color: COLORS.text.muted,
                }}
              >
                {s}
              </Box>
            ))}
          </Stack>
        )}

        <Box sx={{ flex: 1 }} />

        {/* Footer: website + contact (auth-aware). */}
        <Stack direction="row" spacing={1} alignItems="center" sx={{ pt: 1.25, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          {v.website && (
            <Box
              component="a"
              href={v.website}
              target="_blank"
              rel="noopener noreferrer nofollow"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                fontSize: '0.875rem',
                fontFamily: FONTS.body,
                fontWeight: 500,
                color: COLORS.text.muted,
                textDecoration: 'none',
                '&:hover': { color: COLORS.brand.primary },
              }}
            >
              Website <OpenInNewRoundedIcon sx={{ fontSize: 14 }} />
            </Box>
          )}
          {isLoggedIn ? (
            contact && (
              <Box
                component="a"
                href={contact.href}
                target={contact.external ? '_blank' : undefined}
                rel={contact.external ? 'noopener noreferrer' : undefined}
                sx={{
                  ml: 'auto',
                  fontSize: '0.875rem',
                  fontFamily: FONTS.body,
                  fontWeight: 600,
                  color: COLORS.brand.primary,
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                {contact.label} →
              </Box>
            )
          ) : (
            <Box
              component={Link}
              href="/auth/signup"
              sx={{
                ml: 'auto',
                fontSize: '0.875rem',
                fontFamily: FONTS.body,
                fontWeight: 600,
                color: COLORS.brand.primary,
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              Sign up to contact →
            </Box>
          )}
        </Stack>
      </Stack>
    </Box>
  );
}

/* ─── directory ───────────────────────────────────────────────────────────── */

export default function VendorsDirectoryClient({
  initialVendors,
  initialTotal,
}: {
  initialVendors: VendorRecord[];
  initialTotal: number;
}) {
  const [vendors, setVendors] = useState<VendorRecord[]>(initialVendors);
  const [total, setTotal] = useState(initialTotal);
  const [city, setCity] = useState<string | null>(null);
  const [category, setCategory] = useState<VendorCategory | null>(null);
  const [nri, setNri] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialVendors.length >= PAGE);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const didMount = useRef(false);

  // Lift the "sign up to contact" gate for couples who are already signed in.
  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (active) setIsLoggedIn(!!data.user);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const buildQuery = useCallback(
    (offset: number) => {
      const p = new URLSearchParams();
      if (city) p.set('city', city);
      if (category) p.set('category', category);
      if (nri) p.set('nri', 'true');
      p.set('limit', String(PAGE));
      p.set('offset', String(offset));
      return p.toString();
    },
    [city, category, nri],
  );

  // Refetch from scratch whenever a filter changes (skip the initial mount —
  // the server already handed us page 1).
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await fetch(`/api/vendors/directory?${buildQuery(0)}`);
        const data = await res.json();
        if (!cancelled && res.ok) {
          setVendors(data.vendors);
          setTotal(data.total);
          setHasMore(data.vendors.length >= PAGE);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [buildQuery]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/vendors/directory?${buildQuery(vendors.length)}`);
      const data = await res.json();
      if (res.ok) {
        setVendors((prev) => [...prev, ...data.vendors]);
        setHasMore(data.vendors.length >= PAGE);
      }
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 1240, mx: 'auto', px: { xs: 2.5, md: 4 }, pb: 10 }}>
      {/* Filters */}
      <Stack spacing={1.5} sx={{ mb: 4 }}>
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
          <FilterChip active={!city} onClick={() => setCity(null)}>
            All cities
          </FilterChip>
          {VENDOR_CITY_CONFIG.map((c) => (
            <FilterChip key={c.city} active={city === c.city} onClick={() => setCity(c.city)}>
              {FLAG[c.country_code]} {c.city}
            </FilterChip>
          ))}
        </Stack>
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
          <FilterChip active={!category} onClick={() => setCategory(null)}>
            All categories
          </FilterChip>
          {/* Venues + hotels are one bucket (a resort is both) — drop the separate
              "Hotel" chip and let "Venues & Hotels" cover both. */}
          {(Object.keys(VENDOR_CATEGORY_LABELS) as VendorCategory[])
            .filter((c) => c !== 'hotel')
            .map((c) => (
              <FilterChip key={c} active={category === c} onClick={() => setCategory(c)}>
                {c === 'venue' ? 'Venues & Hotels' : VENDOR_CATEGORY_LABELS[c]}
              </FilterChip>
            ))}
          <FilterChip active={nri} onClick={() => setNri((v) => !v)}>
            NRI-experienced only
          </FilterChip>
        </Stack>
      </Stack>

      {/* Result count */}
      <Typography variant="body2" sx={{ color: COLORS.text.subtle, mb: 2.5 }}>
        {loading ? 'Loading…' : `Showing ${vendors.length}${hasMore || vendors.length < total ? ` of ${total.toLocaleString()}` : ''} vendors`}
      </Typography>

      {/* Grid */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: COLORS.brand.primary }} />
        </Box>
      ) : vendors.length === 0 ? (
        <EmptyState
          title="No vendors match those filters"
          subtitle="Try a different city or category — we cover 9 destination-wedding cities across Asia."
          action={
            <Box
              component="button"
              type="button"
              onClick={() => {
                setCity(null);
                setCategory(null);
                setNri(false);
              }}
              sx={{
                cursor: 'pointer',
                px: 3,
                py: 1.25,
                borderRadius: RADII.md,
                border: '1.5px solid rgba(0,0,0,0.14)',
                bgcolor: 'white',
                fontFamily: FONTS.body,
                fontWeight: 600,
                fontSize: '0.9rem',
                color: COLORS.text.strong,
                '&:hover': { borderColor: COLORS.brand.primary, color: COLORS.brand.primary },
              }}
            >
              Clear filters
            </Box>
          }
        />
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
              lg: 'repeat(4, 1fr)',
            },
            gap: 2.5,
          }}
        >
          {vendors.map((v) => (
            <VendorCard key={v.id} v={v} isLoggedIn={isLoggedIn} />
          ))}
        </Box>
      )}

      {/* Load more */}
      {!loading && hasMore && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
          <Box
            component="button"
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            sx={{
              cursor: loadingMore ? 'default' : 'pointer',
              px: 4,
              py: 1.5,
              borderRadius: RADII.md,
              border: '1.5px solid rgba(0,0,0,0.14)',
              bgcolor: 'white',
              fontFamily: FONTS.body,
              fontWeight: 600,
              fontSize: '0.95rem',
              color: COLORS.text.strong,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              transition: 'border-color 0.18s ease, color 0.18s ease',
              '&:hover': { borderColor: COLORS.brand.primary, color: COLORS.brand.primary },
            }}
          >
            {loadingMore ? <CircularProgress size={18} sx={{ color: COLORS.brand.primary }} /> : null}
            {loadingMore ? 'Loading…' : 'Load more vendors'}
          </Box>
        </Box>
      )}
    </Box>
  );
}
