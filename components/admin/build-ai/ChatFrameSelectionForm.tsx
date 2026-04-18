'use client';

import { useState } from 'react';
import { Box, Typography, alpha } from '@mui/material';
import { Check } from '@mui/icons-material';
import { FRAME_UI_OPTIONS } from '@/lib/constants/images';
import { PrimaryActionButton, SecondaryActionButton } from '@/components/admin/ActionButton';
import { COLORS, RADII } from '@/lib/theme/tokens';

interface ChatFrameSelectionFormProps {
  onSave: (frameUrl: string | null) => void;
  onCancel: () => void;
  currentFrame?: string | null;
}

export default function ChatFrameSelectionForm({ onSave, onCancel, currentFrame = null }: ChatFrameSelectionFormProps) {
  const [selected, setSelected] = useState<string | null>(currentFrame);

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
      boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
    }}>
      <Typography variant="h6" sx={{ mb: 1, fontWeight: 700, color: COLORS.text.strong, fontSize: '1rem' }}>
        Photo Frame
      </Typography>
      <Typography variant="caption" sx={{ color: COLORS.text.subtle, mb: 2, display: 'block' }}>
        Choose a decorative frame for your couple photos
      </Typography>

      <Box sx={{
        display: 'flex',
        gap: 1.5,
        flexWrap: 'wrap',
        mb: 2,
      }}>
        {/* No frame option */}
        <Box
          onClick={() => setSelected(null)}
          sx={{
            width: 72,
            height: 72,
            borderRadius: RADII.sm,
            border: selected === null ? '3px solid #DE3F5E' : '2px solid #e0e0e0',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: '#f9f9f9',
            transition: 'all 0.15s',
            '&:hover': { transform: 'scale(1.05)', borderColor: COLORS.brand.primary },
          }}
        >
          <Typography sx={{ fontSize: '0.875rem', color: COLORS.text.faint, fontWeight: 600, textAlign: 'center' }}>
            No Frame
          </Typography>
        </Box>

        {FRAME_UI_OPTIONS.map((frame) => (
          <Box
            key={frame.id}
            onClick={() => setSelected(frame.url)}
            sx={{
              width: 72,
              height: 72,
              borderRadius: RADII.sm,
              border: selected === frame.url ? '3px solid #DE3F5E' : '2px solid #e0e0e0',
              cursor: 'pointer',
              overflow: 'hidden',
              position: 'relative',
              transition: 'all 0.15s',
              '&:hover': { transform: 'scale(1.05)', borderColor: COLORS.brand.primary },
            }}
          >
            <Box
              component="img"
              src={frame.thumbUrl}
              alt={frame.name}
              sx={{ width: '100%', height: '100%', objectFit: 'contain', p: 0.75 }}
            />
            {selected === frame.url && (
              <Box sx={{
                position: 'absolute',
                top: 3,
                right: 3,
                bgcolor: COLORS.brand.primary,
                borderRadius: '50%',
                p: 0.2,
                display: 'flex',
              }}>
                <Check sx={{ color: COLORS.text.inverse, fontSize: 14 }} />
              </Box>
            )}
          </Box>
        ))}
      </Box>

      {/* Action buttons */}
      <Box sx={{ display: 'flex', gap: 1.5, mt: 1, width: '100%' }}>
        <SecondaryActionButton
          onClick={onCancel}
          size="small"
          fullWidth
          sx={{
            color: COLORS.text.subtle,
            fontSize: '0.875rem',
            py: 1,
            borderRadius: RADII.lg,
            flex: 1,
            border: '2px solid',
            borderColor: 'rgba(0,0,0,0.1)',
            '&:hover': { border: '2px solid', borderColor: 'rgba(0,0,0,0.2)', bgcolor: 'rgba(0,0,0,0.02)' },
          }}
        >
          Skip
        </SecondaryActionButton>
        <PrimaryActionButton
          onClick={() => onSave(selected)}
          size="small"
          fullWidth
          sx={{
            borderRadius: RADII.lg,
            fontSize: '0.875rem',
            py: 1,
            flex: 1,
          }}
        >
          Save Frame
        </PrimaryActionButton>
      </Box>
    </Box>
  );
}
