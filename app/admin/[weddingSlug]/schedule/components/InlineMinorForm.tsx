'use client';

import { useState } from 'react';
import { Box, TextField, Stack, IconButton, InputAdornment, CircularProgress } from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import TimePicker from './TimePicker';

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '8px',
    bgcolor: 'white',
    '& fieldset': { borderColor: '#BCBCBC' },
    '&:hover fieldset': { borderColor: '#999' },
    '&.Mui-focused fieldset': { borderColor: '#DE3F5E' },
  },
  '& .MuiInputLabel-root': {
    color: '#524344',
    fontSize: '0.875rem',
  },
  '& .MuiInputBase-input': {
    color: '#1a1a1a',
    fontSize: '1rem',
    py: '12px',
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
      bgcolor: 'white',
      border: '1px solid #EEE',
      borderRadius: '12px',
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
          <CircularProgress size={24} sx={{ color: '#DE3F5E' }} />
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
              startAdornment: <InputAdornment position="start" sx={{ mr: 0.5 }}>{'📍'}</InputAdornment>,
            }}
            sx={{ ...fieldSx, flex: 1 }}
          />
        </Stack>
      </Stack>
      <IconButton
        onClick={handleSubmit}
        disabled={!canSubmit}
        sx={{
          color: canSubmit ? '#DE3F5E' : '#ccc',
          flexShrink: 0,
        }}
      >
        <CheckCircle sx={{ fontSize: 28 }} />
      </IconButton>
    </Box>
  );
}
