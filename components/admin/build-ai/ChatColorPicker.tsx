'use client';

import { useState } from 'react';
import { Box, Typography, alpha, Tooltip } from '@mui/material';
import { Check } from '@mui/icons-material';

const COLOR_OPTIONS = [
  { name: 'Black', value: '#141414' },
  { name: 'Rose', value: '#DE3F5E' },
  { name: 'Plum', value: '#59114D' },
  { name: 'Purple', value: '#AC3FBA' },
  { name: 'Ocean', value: '#004550' },
  { name: 'Sky', value: '#6290C8' },
  { name: 'Teal', value: '#489991' },
  { name: 'Maroon', value: '#941C28' },
  { name: 'Green', value: '#76B041' },
  { name: 'Forest', value: '#59814B' },
  { name: 'Orange', value: '#DF6507' },
  { name: 'Amber', value: '#FA9A00' },
];

interface ChatColorPickerProps {
  onSave: (colorHex: string) => void;
  currentValue?: string;
}

export default function ChatColorPicker({ onSave, currentValue }: ChatColorPickerProps) {
  const [selected, setSelected] = useState<string>(currentValue || '#DE3F5E');

  return (
    <Box sx={{
      bgcolor: 'white',
      p: 3,
      borderRadius: '16px',
      border: '2px solid',
      borderColor: alpha('#000', 0.12),
      width: '100%',
      maxWidth: 480,
      mt: 1,
      boxShadow: '0 8px 32px rgba(0,0,0,0.08)'
    }}>
      <Typography variant="caption" sx={{ color: '#666', mb: 2, display: 'block', fontWeight: 500, fontSize: '0.75rem' }}>
        Choose Your Accent Color
      </Typography>

      <Box sx={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 1.5,
      }}>
        {COLOR_OPTIONS.map((color) => (
          <Tooltip key={color.value} title={color.name} arrow>
            <Box
              onClick={() => {
                setSelected(color.value);
                onSave(color.value);
              }}
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                bgcolor: color.value,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: selected === color.value ? '3px solid' : '2px solid transparent',
                borderColor: selected === color.value ? alpha(color.value, 0.4) : 'transparent',
                boxShadow: selected === color.value ? `0 0 0 3px ${alpha(color.value, 0.25)}` : '0 2px 4px rgba(0,0,0,0.15)',
                transition: 'all 0.15s',
                '&:hover': { transform: 'scale(1.1)' },
              }}
            >
              {selected === color.value && (
                <Check sx={{ fontSize: 18, color: 'white', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }} />
              )}
            </Box>
          </Tooltip>
        ))}
      </Box>
    </Box>
  );
}
