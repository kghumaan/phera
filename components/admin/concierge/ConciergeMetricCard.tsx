'use client';

import { Box, Paper, Typography } from '@mui/material';
import { ReactNode } from 'react';

interface ConciergeMetricCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  subtitle?: string;
}

export default function ConciergeMetricCard({ icon, label, value, subtitle }: ConciergeMetricCardProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        flex: 1,
        minWidth: 160,
        p: 2.5,
        borderRadius: 1,
        border: '1px solid rgba(0,0,0,0.07)',
        bgcolor: 'white',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <Box sx={{ color: '#DE3F5E', display: 'flex', alignItems: 'center' }}>
          {icon}
        </Box>
        <Typography variant="body2" sx={{ color: '#6a6a6a', fontWeight: 500 }}>
          {label}
        </Typography>
      </Box>
      <Typography sx={{ fontSize: '2rem', fontWeight: 700, color: '#1a1a1a', lineHeight: 1 }}>
        {value}
      </Typography>
      {subtitle && (
        <Typography variant="caption" sx={{ color: '#9a9a9a', mt: 0.5, display: 'block' }}>
          {subtitle}
        </Typography>
      )}
    </Paper>
  );
}
