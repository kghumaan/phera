'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  alpha,
} from '@mui/material';

interface ChatTravelFormProps {
  onSave: (travel: { title: string; content: string; button_text?: string; button_url?: string }) => void;
  onCancel?: () => void;
  initialData?: any;
}

export default function ChatTravelForm({ onSave, onCancel, initialData }: ChatTravelFormProps) {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    content: initialData?.content || '',
    button_text: initialData?.button_text || '',
    button_url: initialData?.button_url || '',
  });

  const handleSave = () => {
    if (!formData.title || !formData.content) return;
    onSave(formData);
  };

  const commonFieldSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '12px',
      fontSize: '1rem',
      bgcolor: '#f5f5f5',
      fontWeight: 600,
      '& input, & textarea': {
        py: 1.5,
        px: 2,
        color: '#1a1a1a !important',
        WebkitTextFillColor: '#1a1a1a !important',
      },
      '& fieldset': { border: 'none' },
      '&.Mui-focused fieldset': { border: 'none' },
    },
  };

  const labelSx = {
    color: '#666',
    mb: 1,
    display: 'block',
    fontWeight: 500,
    fontSize: '0.75rem'
  };

  return (
    <Box sx={{
      bgcolor: 'white',
      p: 4,
      borderRadius: '16px',
      border: '2px solid',
      borderColor: alpha('#000', 0.12),
      width: '100%',
      maxWidth: 640,
      mt: 1,
      boxShadow: '0 8px 32px rgba(0,0,0,0.08)'
    }}>
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, color: '#000000' }}>
        Travel & Accommodation
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Box>
          <Typography variant="caption" sx={labelSx}>Title *</Typography>
          <TextField
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            fullWidth
            required
            placeholder="e.g., Hotel Accommodation, Getting There"
            sx={commonFieldSx}
          />
        </Box>

        <Box>
          <Typography variant="caption" sx={labelSx}>Details *</Typography>
          <TextField
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            multiline
            rows={3}
            fullWidth
            required
            placeholder="e.g., We've reserved a block of rooms at The Grand Hotel..."
            sx={commonFieldSx}
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" sx={labelSx}>Button Text (Optional)</Typography>
            <TextField
              value={formData.button_text}
              onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
              fullWidth
              placeholder="e.g., Book Now"
              sx={commonFieldSx}
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" sx={labelSx}>Button Link (Optional)</Typography>
            <TextField
              value={formData.button_url}
              onChange={(e) => setFormData({ ...formData, button_url: e.target.value })}
              fullWidth
              placeholder="e.g., https://hotel.com/book"
              sx={commonFieldSx}
            />
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, mt: 1, width: '100%' }}>
          {onCancel && (
            <Button
              onClick={onCancel}
              size="small"
              variant="outlined"
              fullWidth
              sx={{
                color: '#666',
                fontSize: '0.85rem',
                fontWeight: 700,
                py: 1,
                textTransform: 'none',
                borderRadius: '16px',
                flex: 1,
                border: '2px solid',
                borderColor: 'rgba(0,0,0,0.1)',
                '&:hover': {
                  border: '2px solid',
                  borderColor: 'rgba(0,0,0,0.2)',
                  bgcolor: 'rgba(0,0,0,0.02)'
                }
              }}
            >
              Cancel
            </Button>
          )}
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!formData.title || !formData.content}
            size="small"
            fullWidth
            sx={{
              bgcolor: '#DE3F5E',
              borderRadius: '16px',
              fontSize: '0.85rem',
              fontWeight: 700,
              py: 1,
              textTransform: 'none',
              flex: 1,
              '&:hover': { bgcolor: '#c73552' }
            }}
          >
            Add Travel Card
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
