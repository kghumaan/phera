'use client';

import { Box, Paper, Typography } from '@mui/material';
import { ReactNode } from 'react';
import { COLORS, RADII } from '@/lib/theme/tokens';

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
        bgcolor: COLORS.bg.white,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <Box sx={{ color: COLORS.brand.primary, display: 'flex', alignItems: 'center' }}>
          {icon}
        </Box>
        <Typography variant="body2" sx={{ color: COLORS.text.subtle, fontWeight: 500 }}>
          {label}
        </Typography>
      </Box>
      <Typography sx={{ fontSize: '2rem', fontWeight: 700, color: COLORS.text.strong, lineHeight: 1 }}>
        {value}
      </Typography>
      {subtitle && (
        <Typography variant="caption" sx={{ color: COLORS.text.faint, mt: 0.5, display: 'block' }}>
          {subtitle}
        </Typography>
      )}
    </Paper>
  );
}
