'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import { AutoAwesome } from '@mui/icons-material';
import { COLORS, RADII } from '@/lib/theme/tokens';

interface ProBadgeProps {
  size?: 'tiny' | 'small' | 'medium';
  position?: 'corner' | 'inline';
}

export default function ProBadge({ size = 'small', position = 'inline' }: ProBadgeProps) {
  const isTiny = size === 'tiny';
  const isSmall = size === 'small';
  const isCorner = position === 'corner';

  if (isCorner) {
    return (
      <Box
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          bgcolor: COLORS.bg.white,
          color: COLORS.brand.primary,
          borderRadius: '6px',
          px: 0.75,
          py: 0.25,
          display: 'flex',
          alignItems: 'center',
          gap: 0.25,
          border: '1px solid #DE3F5E',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          zIndex: 1,
        }}
      >
        <AutoAwesome sx={{ fontSize: 12, color: COLORS.brand.primary }} />
        <Typography variant="inherit" sx={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.5px', color: COLORS.brand.primary }}>
          PRO
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: isTiny ? 0.2 : 0.5,
        bgcolor: COLORS.bg.white,
        color: COLORS.brand.primary,
        borderRadius: isTiny ? '3px' : isSmall ? '4px' : '6px',
        px: isTiny ? 0.4 : isSmall ? 0.75 : 1,
        py: isTiny ? 0 : isSmall ? 0.25 : 0.5,
        ml: isTiny ? 0.5 : 1,
        border: '1px solid #DE3F5E',
        flexShrink: 0,
      }}
    >
      <AutoAwesome sx={{ fontSize: isTiny ? 7 : isSmall ? 12 : 14, color: COLORS.brand.primary }} />
      <Typography
        variant="inherit"
        sx={{
          fontSize: isTiny ? '0.5rem' : isSmall ? '0.65rem' : '0.75rem',
          fontWeight: 700,
          letterSpacing: '0.5px',
          color: COLORS.brand.primary,
          lineHeight: 1,
        }}
      >
        PRO
      </Typography>
    </Box>
  );
}
