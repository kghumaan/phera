'use client';

import { Box, CircularProgress, Typography } from '@mui/material';

interface LoadingSpinnerProps {
  message?: string;
  size?: number;
  color?: string;
  minHeight?: string | number;
}

export default function LoadingSpinner({ 
  message = 'Loading...', 
  size = 48,
  color = '#DE3F5E',
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
            color: '#6a6a6a',
            fontWeight: 500,
          }}
        >
          {message}
        </Typography>
      )}
    </Box>
  );
}
