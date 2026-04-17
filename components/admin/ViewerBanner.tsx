'use client';

import { useState } from 'react';
import { Box, Typography, IconButton, alpha } from '@mui/material';
import { Visibility, Close } from '@mui/icons-material';
import { useAdminRole } from '@/lib/contexts/AdminRoleContext';
import { COLORS, RADII } from '@/lib/theme/tokens';

export default function ViewerBanner() {
  const { isViewOnly } = useAdminRole();
  const [dismissed, setDismissed] = useState(false);

  if (!isViewOnly || dismissed) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1300,
        bgcolor: alpha(COLORS.text.strong, 0.92),
        color: COLORS.text.inverse,
        pl: 2.5,
        pr: 1,
        py: 1,
        borderRadius: '40px',
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <Visibility sx={{ fontSize: 18, color: alpha(COLORS.bg.white, 0.8) }} />
      <Typography
        variant="body2"
        sx={{ fontWeight: 600, fontSize: '0.85rem', letterSpacing: '0.02em' }}
      >
        View only — you don&apos;t have permission to edit
      </Typography>
      <IconButton size="small" onClick={() => setDismissed(true)} sx={{ color: alpha(COLORS.bg.white, 0.6), '&:hover': { color: COLORS.text.inverse } }}>
        <Close sx={{ fontSize: 16 }} />
      </IconButton>
    </Box>
  );
}
