'use client';

import { Box, CircularProgress, Typography } from '@mui/material';
import { COLORS, RADII } from '@/lib/theme/tokens';

interface LoadingSpinnerProps {
  message?: string;
  size?: number;
  color?: string;
  minHeight?: string | number;
}

export default function LoadingSpinner({ 
  message = 'Loading...', 
  size = 48,
  color = COLORS.brand.primary,
  minHeight = '400px'
}: LoadingSpinnerProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: minHeight,
        gap: 2,
      }}
    >
      <CircularProgress
        size={size}
        thickness={4}
        sx={{
          color: color,
        }}
      />
      {message && (
        <Typography
          variant="body2"
          sx={{
            color: COLORS.text.subtle,
            fontWeight: 500,
          }}
        >
          {message}
        </Typography>
      )}
    </Box>
  );
}
