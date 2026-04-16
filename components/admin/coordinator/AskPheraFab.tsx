'use client';

import React from 'react';
import { Fab } from '@mui/material';
import { AutoAwesome } from '@mui/icons-material';

interface AskPheraFabProps {
  onClick: () => void;
  visible: boolean;
}

export default function AskPheraFab({ onClick, visible }: AskPheraFabProps) {
  if (!visible) return null;

  return (
    <Fab
      onClick={onClick}
      sx={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        bgcolor: '#DE3F5E',
        color: 'white',
        boxShadow: '0 4px 20px rgba(222,63,94,0.35)',
        '&:hover': { bgcolor: '#c73552' },
        zIndex: 1200,
      }}
    >
      <AutoAwesome />
    </Fab>
  );
}
