'use client';

/**
 * Standard Phera card surfaces.
 *
 * Every Paper/Card in the app should use one of these so we stop
 * hand-rolling `borderRadius + border + bgcolor` combos inline.
 *
 * Variants:
 *   - `default`: RADII.md, white bg, faint border — lists, tables, form sections
 *   - `muted`:   RADII.md, muted bg, no border — backgrounds behind nested content
 *   - `feature`: RADII.lg, white bg, elevated shadow — stat cards, upgrade CTAs
 *   - `hero`:    RADII.xl, brand-tinted gradient — high-attention callouts
 *
 * ```tsx
 * <PheraCard>…list…</PheraCard>
 * <PheraCard variant="feature">…stat…</PheraCard>
 * ```
 */

import { Paper, type PaperProps } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { forwardRef } from 'react';
import { COLORS, RADII, SHADOWS } from '@/lib/theme/tokens';

export type PheraCardVariant = 'default' | 'muted' | 'feature' | 'hero';

export interface PheraCardProps extends Omit<PaperProps, 'variant' | 'elevation'> {
  variant?: PheraCardVariant;
}

const VARIANT_SX: Record<PheraCardVariant, object> = {
  default: {
    borderRadius: RADII.md,
    border: `1px solid ${COLORS.border.faint}`,
    bgcolor: COLORS.bg.white,
    boxShadow: 'none',
  },
  muted: {
    borderRadius: RADII.md,
    bgcolor: COLORS.bg.muted,
    boxShadow: 'none',
  },
  feature: {
    borderRadius: RADII.lg,
    border: `1px solid ${COLORS.border.faint}`,
    bgcolor: COLORS.bg.white,
    boxShadow: SHADOWS.card,
  },
  hero: {
    borderRadius: RADII.xl,
    border: `1px solid ${alpha(COLORS.brand.primary, 0.15)}`,
    background: `linear-gradient(135deg, ${alpha(COLORS.brand.primary, 0.08)} 0%, ${alpha(COLORS.brand.primary, 0.02)} 60%, ${COLORS.bg.white} 100%)`,
    boxShadow: 'none',
  },
};

export const PheraCard = forwardRef<HTMLDivElement, PheraCardProps>(
  function PheraCard({ variant = 'default', sx, ...rest }, ref) {
    return (
      <Paper
        ref={ref}
        elevation={0}
        {...rest}
        sx={{ ...VARIANT_SX[variant], ...sx }}
      />
    );
  },
);

export default PheraCard;
