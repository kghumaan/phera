'use client';

import React from 'react';
import { Fab, Grow } from '@mui/material';
import { AutoAwesome } from '@mui/icons-material';
import { COLORS } from '@/lib/theme/tokens';

interface AskPheraFabProps {
  onClick: () => void;
  visible: boolean;
}

export default function AskPheraFab({ onClick, visible }: AskPheraFabProps) {
  return (
    <Grow
      in={visible}
      mountOnEnter
      unmountOnExit
      timeout={{ enter: 260, exit: 200 }}
      style={{ transformOrigin: 'bottom right' }}
    >
      <Fab
        onClick={onClick}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          bgcolor: COLORS.brand.primary,
          color: COLORS.text.inverse,
          boxShadow: '0 4px 20px rgba(222,63,94,0.35)',
          '&:hover': { bgcolor: COLORS.brand.primaryHover },
          zIndex: 1200,
        }}
      >
        <AutoAwesome />
      </Fab>
    </Grow>
  );
}
