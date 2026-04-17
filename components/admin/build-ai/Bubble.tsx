'use client';

import React from 'react';
import { Box, Typography, alpha } from '@mui/material';
import { AutoAwesome } from '@mui/icons-material';
import { Message } from '@/lib/build-ai/types';
import { COLORS, RADII } from '@/lib/theme/tokens';

function parseBoldText(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

export default function Bubble({ message }: { message: Message }) {
  const isAI = message.role === 'ai';

  if (isAI) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 3, gap: 2 }}>
        <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: alpha(COLORS.brand.primary, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, mt: 0.5 }}>
          <AutoAwesome sx={{ fontSize: 18, color: COLORS.brand.primary }} />
        </Box>
        <Box sx={{ maxWidth: '85%' }}>
          <Typography sx={{
            fontSize: '1rem',
            lineHeight: 1.6,
            color: COLORS.text.strong,
            whiteSpace: 'pre-line',
          }}>
            {parseBoldText(message.text)}
          </Typography>
          {message.component && (
            <Box sx={{ mt: 2, width: '100%' }}>
              {message.component}
            </Box>
          )}
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
      <Box
        sx={{
          maxWidth: '80%',
          px: 2.5,
          py: 1.5,
          borderRadius: '16px 16px 4px 16px',
          bgcolor: '#eeeeee',
          color: COLORS.text.strong,
          whiteSpace: 'pre-line',
        }}
      >
        <Typography sx={{
          fontSize: '1rem', lineHeight: 1.6,
          color: COLORS.text.strong,
          whiteSpace: 'pre-line',
        }}>
          {parseBoldText(message.text)}
        </Typography>
      </Box>
    </Box>
  );
}
