'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import { AutoAwesome } from '@mui/icons-material';

interface ProBadgeProps {
  size?: 'small' | 'medium';
  position?: 'corner' | 'inline';
}

export default function ProBadge({ size = 'small', position = 'inline' }: ProBadgeProps) {
  const isSmall = size === 'small';
  const isCorner = position === 'corner';

  if (isCorner) {
    return (
      <Box
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          bgcolor: 'white',
          color: '#DE3F5E',
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
        <AutoAwesome sx={{ fontSize: 12, color: '#DE3F5E' }} />
        <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.5px', color: '#DE3F5E' }}>
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
        gap: 0.5,
        bgcolor: 'white',
        color: '#DE3F5E',
        borderRadius: isSmall ? '4px' : '6px',
        px: isSmall ? 0.75 : 1,
        py: isSmall ? 0.25 : 0.5,
        ml: 1,
        border: '1px solid #DE3F5E',
      }}
    >
      <AutoAwesome sx={{ fontSize: isSmall ? 12 : 14, color: '#DE3F5E' }} />
      <Typography
        sx={{
          fontSize: isSmall ? '0.65rem' : '0.75rem',
          fontWeight: 700,
          letterSpacing: '0.5px',
          color: '#DE3F5E',
        }}
      >
        PRO
      </Typography>
    </Box>
  );
}
