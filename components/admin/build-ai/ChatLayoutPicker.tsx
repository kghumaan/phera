'use client';

import { useState } from 'react';
import { Box, Typography, alpha } from '@mui/material';
import { ViewModule, ViewStream } from '@mui/icons-material';
import { COLORS, RADII } from '@/lib/theme/tokens';

interface ChatLayoutPickerProps {
  onSave: (layout: 'multi_page' | 'vertical_scroll') => void;
  currentValue?: string;
}

export default function ChatLayoutPicker({ onSave, currentValue }: ChatLayoutPickerProps) {
  const [selected, setSelected] = useState<string>(currentValue || 'multi_page');

  const options = [
    {
      value: 'multi_page' as const,
      label: 'Multi-Page',
      subtitle: 'View Details',
      description: 'Guests tap into each section to see details. Clean and organized.',
      icon: ViewModule,
    },
    {
      value: 'vertical_scroll' as const,
      label: 'Vertical Scroll',
      subtitle: 'All Content',
      description: 'All content flows on one page. Guests scroll through everything.',
      icon: ViewStream,
    },
  ];

  return (
    <Box sx={{
      bgcolor: COLORS.bg.white,
      p: 3,
      borderRadius: RADII.lg,
      border: '2px solid',
      borderColor: alpha(COLORS.text.strong, 0.12),
      width: '100%',
      maxWidth: 480,
      mt: 1,
      boxShadow: '0 8px 32px rgba(0,0,0,0.08)'
    }}>
      <Typography variant="caption" sx={{ color: COLORS.text.subtle, mb: 2, display: 'block', fontWeight: 500, fontSize: '0.75rem' }}>
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
                borderRadius: RADII.md,
                border: '2px solid',
                borderColor: isSelected ? COLORS.brand.primary : alpha(COLORS.text.strong, 0.12),
                bgcolor: isSelected ? alpha(COLORS.brand.primary, 0.04) : COLORS.bg.white,
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.15s',
                '&:hover': {
                  borderColor: isSelected ? COLORS.brand.primary : alpha(COLORS.text.strong, 0.25),
                  bgcolor: isSelected ? alpha(COLORS.brand.primary, 0.06) : alpha(COLORS.text.strong, 0.02),
                },
              }}
            >
              <Icon sx={{
                fontSize: 32,
                color: isSelected ? COLORS.brand.primary : COLORS.text.subtle,
                mb: 1,
              }} />
              <Typography sx={{
                fontWeight: 700,
                fontSize: '0.9rem',
                color: isSelected ? COLORS.brand.primary : COLORS.text.strong,
                mb: 0.25,
              }}>
                {opt.label}
              </Typography>
              <Typography sx={{
                fontSize: '0.7rem',
                color: COLORS.text.faint,
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
