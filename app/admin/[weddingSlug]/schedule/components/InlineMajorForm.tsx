'use client';

import { useState } from 'react';
import { Box, TextField, Stack, Button, InputAdornment } from '@mui/material';
import { Add } from '@mui/icons-material';
import TimePicker from './TimePicker';

const COLOR_PALETTE = [
  '#DE3F5E',
  '#FA9A00',
  '#941C28',
  '#59114D',
  '#489991',
  '#004550',
  '#59814B',
];

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '8px',
    bgcolor: 'white',
    height: 48,
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
  },
};

interface InlineMajorFormProps {
  onSave: (data: {
    name: string;
    time: string;
    location: string;
    description: string;
    dress_code: string;
    gradient_background: string;
    is_major_event: true;
  }) => void;
  onCancel: () => void;
  onToast?: (message: string) => void;
  onMoreDetails?: (formData: { name: string; time: string; location: string; description: string; dress_code: string; gradient_background: string }) => void;
  initialData?: {
    name?: string;
    time?: string;
    location?: string;
    description?: string;
    dress_code?: string;
    gradient_background?: string;
  };
}

export default function InlineMajorForm({ onSave, onCancel, onToast, onMoreDetails, initialData }: InlineMajorFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [time, setTime] = useState(initialData?.time || '');
  const [location, setLocation] = useState(initialData?.location || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [dressCode, setDressCode] = useState(initialData?.dress_code || '');
  const [color, setColor] = useState(
    initialData?.gradient_background && initialData.gradient_background.startsWith('#')
      ? initialData.gradient_background
      : COLOR_PALETTE[0]
  );

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      time: time.trim(),
      location: location.trim(),
      description: description.trim(),
      dress_code: dressCode.trim(),
      gradient_background: color,
      is_major_event: true,
    });
  };

  return (
    <Box sx={{
      bgcolor: 'white',
      border: '1px solid #EEE',
      borderRadius: '12px',
      px: 1.5, py: 2,
      display: 'flex',
      alignItems: 'stretch',
      overflow: 'hidden',
    }}>
      {/* Color bar on the left */}
      <Box sx={{ width: 8, bgcolor: color, borderRadius: '4px', flexShrink: 0, mr: 2 }} />

      {/* Form content */}
      <Stack spacing={2} sx={{ flex: 1 }}>
        {/* Row 1: Event Name + Time */}
        <Stack direction="row" spacing={1.5}>
          <TextField
            label="Event Name *"
            size="small"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            sx={{ ...fieldSx, flex: 1 }}
          />
          <TimePicker
            label="Time *"
            value={time}
            onChange={setTime}
          />
        </Stack>

        {/* Row 2: Short Description */}
        <TextField
          label="Short Description"
          size="small"
          fullWidth
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          sx={fieldSx}
        />

        {/* Row 3: Location + Dress Code */}
        <Stack direction="row" spacing={1.5}>
          <TextField
            label="Location *"
            size="small"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start" sx={{ mr: 0.5 }}>{'📍'}</InputAdornment>,
            }}
            sx={{ ...fieldSx, flex: 1 }}
          />
          <TextField
            label="Dress Code"
            size="small"
            value={dressCode}
            onChange={(e) => setDressCode(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start" sx={{ mr: 0.5 }}>{'👗'}</InputAdornment>,
            }}
            sx={{ ...fieldSx, flex: 1 }}
          />
        </Stack>

        {/* Row 4: Color picker + Buttons */}
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          {/* Color swatches */}
          <Stack direction="row" spacing={1} alignItems="center">
            {COLOR_PALETTE.map((c) => (
              <Box
                key={c}
                onClick={() => setColor(c)}
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: '4px',
                  bgcolor: c,
                  cursor: 'pointer',
                  border: color === c ? '2px solid #DE3F5E' : '2px solid transparent',
                  flexShrink: 0,
                  transition: 'border-color 0.15s',
                  '&:hover': { opacity: 0.85 },
                }}
              />
            ))}
            {/* Custom color "+" button */}
            <Box
              sx={{
                width: 24,
                height: 24,
                borderRadius: '4px',
                border: '1px solid #dbdbdb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                '&:hover': { borderColor: '#999' },
              }}
            >
              <Add sx={{ fontSize: 16, color: '#999' }} />
            </Box>
          </Stack>

          {/* Buttons */}
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined"
              disabled={!name.trim()}
              onClick={handleSubmit}
              sx={{
                borderColor: '#DE3F5E',
                color: '#DE3F5E',
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '1rem',
                px: 2, py: 0.75,
                '&:hover': { borderColor: '#C8365A', bgcolor: 'rgba(222,63,94,0.04)' },
                '&:disabled': { borderColor: '#ddd', color: '#ccc' },
              }}
            >
              Done
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                if (!name.trim()) {
                  onToast?.('Event name is required');
                  return;
                }
                if (onMoreDetails) {
                  onMoreDetails({
                    name: name.trim(),
                    time: time.trim(),
                    location: location.trim(),
                    description: description.trim(),
                    dress_code: dressCode.trim(),
                    gradient_background: color,
                  });
                } else {
                  onToast?.('More details editing coming soon!');
                }
              }}
              sx={{
                bgcolor: '#DE3F5E',
                color: 'white',
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '1rem',
                px: 2, py: 0.75,
                '&:hover': { bgcolor: '#C8365A' },
              }}
            >
              Add More Details
            </Button>
          </Stack>
        </Stack>
      </Stack>
    </Box>
  );
}
