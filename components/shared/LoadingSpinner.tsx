'use client';

import { Box, CircularProgress, Typography } from '@mui/material';

interface LoadingSpinnerProps {
  message?: string;
  size?: number;
}

export default function LoadingSpinner({ message = 'Loading...', size = 48 }: LoadingSpinnerProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        gap: 2,
      }}
    >
      <CircularProgress
        size={size}
        thickness={4}
        sx={{
          color: '#DE3F5E',
        }}
      />
      {message && (
        <Typography
          variant="body1"
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

