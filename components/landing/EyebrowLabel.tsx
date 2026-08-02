'use client';

/**
 * Section eyebrow used across the landing page.
 *
 * Shape: a single 28×1px hairline dash + uppercase tracked label, optionally
 * tinted with the brand pink. Replaces the duplicate-dash patterns we used
 * to render with `<Typography variant="overline">` plus an extra leading
 * `<span>` separator.
 *
 * ```tsx
 * <EyebrowLabel>Pricing</EyebrowLabel>
 * <EyebrowLabel align="center" tone="strong">FAQ</EyebrowLabel>
 * ```
 */

import { Box, Typography } from '@mui/material';
import { COLORS } from '@/lib/theme/tokens';

export interface EyebrowLabelProps {
  children: React.ReactNode;
  /**
   * `brand` (default) - pink dash + pink label. Use over light backgrounds.
   * `light` - translucent white dash, soft amber label. Use over the dark
   *           concierge section.
   */
  tone?: 'brand' | 'light';
  align?: 'left' | 'center';
  sx?: object;
}

export default function EyebrowLabel({
  children,
  tone = 'brand',
  align = 'left',
  sx,
}: EyebrowLabelProps) {
  const dashColor = tone === 'light' ? 'rgba(255,255,255,0.3)' : COLORS.brand.primary;
  const labelColor = tone === 'light' ? '#FFB347' : COLORS.brand.primary;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        justifyContent: align === 'center' ? 'center' : 'flex-start',
        ...sx,
      }}
    >
      <Box
        component="span"
        sx={{
          display: 'inline-block',
          width: 28,
          height: '1px',
          bgcolor: dashColor,
          flex: 'none',
        }}
      />
      <Typography
        component="span"
        sx={{
          fontFamily: 'var(--font-mono, "DM Mono"), monospace',
          fontSize: { xs: '0.7rem', md: '0.75rem' },
          fontWeight: 500,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: labelColor,
          lineHeight: 1.2,
        }}
      >
        {children}
      </Typography>
    </Box>
  );
}
