'use client';

import { useState } from 'react';
import { Box, Typography, alpha } from '@mui/material';
import { ViewModule, ViewStream } from '@mui/icons-material';

interface ChatLayoutPickerProps {
  onSave: (layout: 'nested' | 'infinite_scroll') => void;
  currentValue?: string;
}

export default function ChatLayoutPicker({ onSave, currentValue }: ChatLayoutPickerProps) {
  const [selected, setSelected] = useState<string>(currentValue || 'nested');

  const options = [
    {
      value: 'nested' as const,
      label: 'Nested',
      subtitle: 'View Details',
      description: 'Guests tap into each section to see details. Clean and organized.',
      icon: ViewModule,
    },
    {
      value: 'infinite_scroll' as const,
      label: 'Infinite Scroll',
      subtitle: 'All Content',
      description: 'All content flows on one page. Guests scroll through everything.',
      icon: ViewStream,
    },
  ];

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
        Website Navigation Style
      </Typography>

      <Box sx={{ display: 'flex', gap: 2 }}>
        {options.map((opt) => {
          const Icon = opt.icon;
          const isSelected = selected === opt.value;

          return (
            <Box
              key={opt.value}
              onClick={() => {
                setSelected(opt.value);
                onSave(opt.value);
              }}
              sx={{
                flex: 1,
                p: 2.5,
                borderRadius: '14px',
                border: '2px solid',
                borderColor: isSelected ? '#DE3F5E' : alpha('#000', 0.12),
                bgcolor: isSelected ? alpha('#DE3F5E', 0.04) : 'white',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.15s',
                '&:hover': {
                  borderColor: isSelected ? '#DE3F5E' : alpha('#000', 0.25),
                  bgcolor: isSelected ? alpha('#DE3F5E', 0.06) : alpha('#000', 0.02),
                },
              }}
            >
              <Icon sx={{
                fontSize: 32,
                color: isSelected ? '#DE3F5E' : '#666',
                mb: 1,
              }} />
              <Typography sx={{
                fontWeight: 700,
                fontSize: '0.9rem',
                color: isSelected ? '#DE3F5E' : '#1a1a1a',
                mb: 0.25,
              }}>
                {opt.label}
              </Typography>
              <Typography sx={{
                fontSize: '0.7rem',
                color: '#999',
                lineHeight: 1.4,
              }}>
                {opt.description}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
