'use client';

import { useState } from 'react';
import { Box, Typography, alpha } from '@mui/material';
import { BACKGROUND_UI_OPTIONS } from '@/lib/constants/images';
import { COLORS, RADII } from '@/lib/theme/tokens';

interface ChatBackgroundPickerProps {
  onSave: (backgroundUrl: string) => void;
  currentValue?: string;
}

export default function ChatBackgroundPicker({ onSave, currentValue }: ChatBackgroundPickerProps) {
  const [selected, setSelected] = useState<string>(currentValue || BACKGROUND_UI_OPTIONS[0].url);

  return (
    <Box sx={{
      bgcolor: COLORS.bg.white,
      p: 3,
      borderRadius: RADII.lg,
      border: '2px solid',
      borderColor: alpha(COLORS.text.strong, 0.12),
      width: '100%',
      maxWidth: 640,
      mt: 1,
      boxShadow: '0 8px 32px rgba(0,0,0,0.08)'
    }}>
      <Typography variant="caption" sx={{ color: COLORS.text.subtle, mb: 2, display: 'block', fontWeight: 500, fontSize: '0.75rem' }}>
        Choose a Background
      </Typography>

      <Box sx={{
        display: 'flex',
        gap: 1.5,
        overflowX: 'auto',
        pb: 1.5,
        WebkitOverflowScrolling: 'touch',
        '&::-webkit-scrollbar': { height: 4 },
        '&::-webkit-scrollbar-thumb': { bgcolor: alpha(COLORS.text.strong, 0.15), borderRadius: 2 },
      }}>
        {BACKGROUND_UI_OPTIONS.map((bg) => (
          <Box
            key={bg.url}
            onClick={() => {
              setSelected(bg.url);
              onSave(bg.url);
            }}
            sx={{
              flexShrink: 0,
              width: 80,
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'transform 0.15s',
              '&:hover': { transform: 'scale(1.05)' },
            }}
          >
            <Box
              sx={{
                width: 80,
                height: 120,
                borderRadius: RADII.md,
                overflow: 'hidden',
                border: selected === bg.url ? '3px solid #DE3F5E' : '2px solid transparent',
                boxShadow: selected === bg.url ? '0 0 0 2px rgba(222,63,94,0.3)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              <Box
                component="img"
                src={bg.thumbUrl}
                alt={bg.name}
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </Box>
            <Typography sx={{
              fontSize: '0.65rem',
              color: selected === bg.url ? COLORS.brand.primary : COLORS.text.subtle,
              fontWeight: selected === bg.url ? 700 : 500,
              mt: 0.5,
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {bg.name}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
