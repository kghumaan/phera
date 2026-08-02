'use client';

import { Box, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useState } from 'react';
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded';
import { PheraCard } from '@/components/shared/Card';
import { PheraChip } from '@/components/shared/Chip';
import { PrimaryActionButton, SecondaryActionButton } from '@/components/admin/ActionButton';
import { EstimateInfo } from '@/components/shared/EstimateInfo';
import { COLORS } from '@/lib/theme/tokens';
import { formatCapacity, formatCostBand } from '@/lib/vendors/estimates';
import type { VenueCard } from '@/lib/agent/types';

export interface VenueCardsPanelProps {
  vendors: VenueCard[];
  onSelect: (vendor: VenueCard) => void;
  onSkip: () => void;
  disabled?: boolean;
}

/** Country code → flag emoji for the destination cities we cover. */
const COUNTRY_FLAGS: Record<string, string> = {
  IN: '🇮🇳',
  TH: '🇹🇭',
  ID: '🇮🇩',
  AE: '🇦🇪',
};

/** "$2K", "$2.5K", "$800" — compact USD for the price-range chip. */
function formatUsd(value: number): string {
  if (value >= 1000) {
    const k = value / 1000;
    return `$${Number.isInteger(k) ? k : k.toFixed(1)}K`;
  }
  return `$${value}`;
}

/** "$2K–$5K", "From $2K", "Up to $5K", or null when neither bound is set. */
function priceRangeLabel(min: number | null, max: number | null): string | null {
  if (min == null && max == null) return null;
  if (min != null && max != null) {
    return min === max ? formatUsd(min) : `${formatUsd(min)}–${formatUsd(max)}`;
  }
  if (min != null) return `From ${formatUsd(min)}`;
  return `Up to ${formatUsd(max as number)}`;
}

/** A single Airbnb-style listing card. Holds its own image-fallback state so a
 *  broken portfolio URL degrades to the category placeholder header. */
function VenueListingCard({ vendor, onSelect, disabled }: { vendor: VenueCard; onSelect: () => void; disabled?: boolean }) {
  const [imgFailed, setImgFailed] = useState(false);
  const flag = COUNTRY_FLAGS[vendor.country_code] ?? '';
  const price = priceRangeLabel(vendor.price_min, vendor.price_max);
  // Prefer a portfolio image; otherwise fall back to the business's own Google
  // photo via the server-side proxy (keeps the API key off the client).
  const imageSrc =
    vendor.image ??
    (vendor.place_id ? `/api/vendors/photo?placeId=${encodeURIComponent(vendor.place_id)}` : null);
  const showImage = !!imageSrc && !imgFailed;
  const specialties = vendor.specialties?.slice(0, 3) ?? [];

  return (
    <PheraCard variant="feature" sx={{ p: 0, overflow: 'hidden' }}>
      {/* Top image / placeholder header (~140px). */}
      <Box sx={{ position: 'relative', height: 140, width: '100%' }}>
        {showImage ? (
          <Box
            component="img"
            src={imageSrc as string}
            alt={vendor.name}
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
              gap: 0.75,
              background: `linear-gradient(135deg, ${alpha(COLORS.brand.primary, 0.14)} 0%, ${alpha(
                COLORS.cultural.gold,
                0.14
              )} 100%)`,
            }}
          >
            <StorefrontRoundedIcon sx={{ color: COLORS.brand.primary, fontSize: 30 }} />
            <Typography variant="body2" sx={{ color: COLORS.text.strong, fontWeight: 600 }}>
              {vendor.category}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Body. */}
      <Stack spacing={1} sx={{ p: 1.75 }}>
        <Typography
          variant="body1"
          sx={{
            color: COLORS.text.strong,
            fontWeight: 700,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {vendor.name}
        </Typography>

        {/* Rating · location · price meta row. */}
        <Stack direction="row" spacing={1.25} alignItems="center" flexWrap="wrap" sx={{ rowGap: 0.5 }}>
          {vendor.rating != null && (
            <Stack direction="row" spacing={0.25} alignItems="center">
              <StarRoundedIcon sx={{ color: COLORS.cultural.gold, fontSize: 18 }} />
              <Typography variant="body2" sx={{ color: COLORS.text.strong, fontWeight: 600 }}>
                {vendor.rating.toFixed(1)}
              </Typography>
              {vendor.review_count != null && (
                <Typography variant="body2" sx={{ color: COLORS.text.subtle }}>
                  ({vendor.review_count})
                </Typography>
              )}
            </Stack>
          )}
          <Stack direction="row" spacing={0.25} alignItems="center">
            <PlaceRoundedIcon sx={{ color: COLORS.text.faint, fontSize: 16 }} />
            <Typography variant="body2" sx={{ color: COLORS.text.muted }}>
              {vendor.city}
              {flag ? ` ${flag}` : ''}
            </Typography>
          </Stack>
          {/* Per-night price only for non-venues; venues show the wedding-cost
              estimate row below instead. */}
          {price && !vendor.costEstimate && (
            <Typography variant="body2" sx={{ color: COLORS.text.strong, fontWeight: 600 }}>
              {price}
            </Typography>
          )}
        </Stack>

        {/* Estimated guest capacity + all-in 3-day wedding cost (venues/hotels).
            Placeholders — always behind the info icon so they read as ballparks. */}
        {(vendor.capacity || vendor.costEstimate) && (
          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 0.5 }}>
            {vendor.capacity && (
              <Stack direction="row" spacing={0.4} alignItems="center">
                <GroupsRoundedIcon sx={{ color: COLORS.text.faint, fontSize: 17 }} />
                <Typography variant="body2" sx={{ color: COLORS.text.muted }}>
                  {formatCapacity(vendor.capacity)}
                </Typography>
              </Stack>
            )}
            {vendor.costEstimate && (
              <Stack direction="row" spacing={0.4} alignItems="center">
                <PaymentsRoundedIcon sx={{ color: COLORS.text.faint, fontSize: 16 }} />
                <Typography variant="body2" sx={{ color: COLORS.text.strong, fontWeight: 600 }}>
                  ~{formatCostBand(vendor.costEstimate)}
                </Typography>
              </Stack>
            )}
            <EstimateInfo />
          </Stack>
        )}

        {/* Tags: a few specialties + an NRI badge. */}
        {(specialties.length > 0 || vendor.nri_experienced) && (
          <Stack direction="row" spacing={0.75} flexWrap="wrap" sx={{ rowGap: 0.75 }}>
            {vendor.nri_experienced && (
              <PheraChip
                size="small"
                tone="brand"
                icon={<VerifiedRoundedIcon />}
                label="NRI-experienced"
              />
            )}
            {specialties.map((s) => (
              <PheraChip key={s} size="small" tone="neutral" label={s} />
            ))}
          </Stack>
        )}

        {/* Only action on the card — opens the listing's website. */}
        {vendor.website && (
          <Typography
            component="a"
            variant="body2"
            href={vendor.website}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              color: COLORS.brand.primary,
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.25,
              alignSelf: 'flex-start',
              '&:hover': { textDecoration: 'underline' },
            }}
          >
            View website
            <OpenInNewRoundedIcon sx={{ fontSize: 16 }} />
          </Typography>
        )}

        <PrimaryActionButton size="small" fullWidth disabled={disabled} onClick={onSelect} sx={{ mt: 0.5 }}>
          Choose this
        </PrimaryActionButton>
      </Stack>
    </PheraCard>
  );
}

/**
 * Right-pane panel that renders vendor-directory matches as a vertical,
 * scrollable list of Airbnb-style listing cards. A preview surface — cards
 * aren't clickable to navigate; the per-card website link is the only action.
 * Scrolls within the right pane's own overflow container.
 */
export function VenueCardsPanel({ vendors, onSelect, onSkip, disabled }: VenueCardsPanelProps) {
  return (
    <Stack spacing={2} sx={{ width: '100%' }}>
      <Stack direction="row" spacing={0.75} alignItems="center">
        <PlaceRoundedIcon sx={{ color: COLORS.brand.primary, fontSize: 20 }} />
        <Typography variant="body1" sx={{ color: COLORS.text.strong, fontWeight: 700 }}>
          Options for you — {vendors.length} {vendors.length === 1 ? 'place' : 'places'}
        </Typography>
      </Stack>
      <Typography variant="body2" sx={{ color: COLORS.text.muted, mt: -1 }}>
        Pick one to go with, or keep browsing — no rush.
      </Typography>

      <Stack spacing={1.5}>
        {vendors.map((vendor, index) => (
          <VenueListingCard
            key={`${vendor.name}-${index}`}
            vendor={vendor}
            disabled={disabled}
            onSelect={() => onSelect(vendor)}
          />
        ))}
      </Stack>

      <SecondaryActionButton fullWidth disabled={disabled} onClick={onSkip}>
        None of these — keep browsing
      </SecondaryActionButton>
    </Stack>
  );
}

export default VenueCardsPanel;
