'use client';

import { useState } from 'react';
import { Box, TextField, Stack, IconButton, InputAdornment, CircularProgress } from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import StreamlineIcon from '@/components/ui/StreamlineIcon';
import TimePicker from './TimePicker';
import { COLORS, RADII } from '@/lib/theme/tokens';

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: RADII.sm,
    bgcolor: COLORS.bg.white,
    '& fieldset': { borderColor: COLORS.text.faint },
    '&:hover fieldset': { borderColor: COLORS.text.faint },
    '&.Mui-focused fieldset': { borderColor: COLORS.brand.primary },
  },
  '& .MuiInputLabel-root': {
    color: '#524344',
    fontSize: '0.875rem',
    transform: 'translate(14px, 13px) scale(1)',
    '&.MuiInputLabel-shrink': {
      transform: 'translate(14px, -9px) scale(0.75)',
    },
    '&.Mui-focused': {
      color: COLORS.brand.primary,
    },
  },
  '& .MuiInputBase-input': {
    color: COLORS.text.strong,
    fontSize: '1rem',
    padding: '12.5px 14px',
  },
};

interface InlineMinorFormProps {
  onSave: (data: { name: string; time: string; location: string }) => void;
  onCancel: () => void;
  initialData?: { name?: string; time?: string; location?: string };
  isSaving?: boolean;
}

export default function InlineMinorForm({ onSave, onCancel, initialData, isSaving }: InlineMinorFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [time, setTime] = useState(initialData?.time || '');
  const [location, setLocation] = useState(initialData?.location || '');

  const canSubmit = !!name.trim() && !!time.trim();

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSave({ name: name.trim(), time: time.trim(), location: location.trim() });
  };

  return (
    <Box sx={{
      bgcolor: COLORS.bg.white,
      border: '1px solid #EEE',
      borderRadius: RADII.md,
      px: 1.5, py: 2,
      display: 'flex',
      gap: 2,
      alignItems: 'center',
      position: 'relative',
      opacity: isSaving ? 0.6 : 1,
      pointerEvents: isSaving ? 'none' : 'auto',
      transition: 'opacity 0.15s',
    }}>
      {isSaving && (
        <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
          <CircularProgress size={24} sx={{ color: COLORS.brand.primary }} />
        </Box>
      )}
      <Stack spacing={2} sx={{ flex: 1 }}>
        <TextField
          label="Event name *"
          fullWidth
          size="small"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); if (e.key === 'Escape') onCancel(); }}
          sx={fieldSx}
        />
        <Stack direction="row" spacing={1.5}>
          <TimePicker
            label="Time *"
            value={time}
            onChange={setTime}
          />
          <TextField
            label="Location *"
            size="small"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); if (e.key === 'Escape') onCancel(); }}
            InputProps={{
              startAdornment: <InputAdornment position="start" sx={{ mr: 0.5 }}><StreamlineIcon name="map-pin" size={16} color="#6a6a6a" /></InputAdornment>,
            }}
            sx={{ ...fieldSx, flex: 1 }}
          />
        </Stack>
      </Stack>
      <IconButton
        onClick={handleSubmit}
        disabled={!canSubmit}
        sx={{
          color: canSubmit ? COLORS.brand.primary : COLORS.border.default,
          flexShrink: 0,
        }}
      >
        <CheckCircle sx={{ fontSize: 28 }} />
      </IconButton>
    </Box>
  );
}
