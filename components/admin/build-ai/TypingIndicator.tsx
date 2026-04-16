'use client';

import React from 'react';
import { Box, alpha } from '@mui/material';
import { AutoAwesome } from '@mui/icons-material';

export default function TypingIndicator() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 3 }}>
      <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: alpha('#DE3F5E', 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <AutoAwesome sx={{ fontSize: 18, color: '#DE3F5E' }} />
      </Box>
      <Box sx={{ py: 0.5, display: 'flex', gap: 0.6, alignItems: 'center' }}>
        {[0, 1, 2].map(i => (
          <Box
            key={i}
            sx={{
              width: 8, height: 8, borderRadius: '50%', bgcolor: '#DE3F5E',
              animation: 'bounce 1.2s infinite', animationDelay: `${i * 0.2}s`,
              '@keyframes bounce': { '0%, 60%, 100%': { transform: 'translateY(0)' }, '30%': { transform: 'translateY(-5px)' } },
              opacity: 0.7
            }}
          />
        ))}
      </Box>
    </Box>
  );
}
