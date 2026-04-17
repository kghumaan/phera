'use client';

import { useState } from 'react';
import {
  Box,
  TextField,
  Typography,
  alpha,
} from '@mui/material';
import { PrimaryActionButton, SecondaryActionButton } from '@/components/admin/ActionButton';

interface ChatShoppingFormProps {
  onSave: (shop: { name: string; details?: string; url: string }) => void;
  onCancel?: () => void;
  initialData?: any;
}

export default function ChatShoppingForm({ onSave, onCancel, initialData }: ChatShoppingFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    details: initialData?.details || '',
    url: initialData?.url || '',
  });

  const handleSave = () => {
    if (!formData.name || !formData.url) return;
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
        Shop Recommendation
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Box>
          <Typography variant="caption" sx={labelSx}>Shop Name *</Typography>
          <TextField
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            fullWidth
            required
            placeholder="e.g., FabIndia, Sabyasachi"
            sx={commonFieldSx}
          />
        </Box>

        <Box>
          <Typography variant="caption" sx={labelSx}>Details (Optional)</Typography>
          <TextField
            value={formData.details}
            onChange={(e) => setFormData({ ...formData, details: e.target.value })}
            multiline
            rows={2}
            fullWidth
            placeholder="e.g., Ships internationally, 2-week delivery time"
            sx={commonFieldSx}
          />
        </Box>

        <Box>
          <Typography variant="caption" sx={labelSx}>Website URL *</Typography>
          <TextField
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            fullWidth
            required
            placeholder="e.g., https://www.fabindia.com"
            sx={commonFieldSx}
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, mt: 1, width: '100%' }}>
          {onCancel && (
            <SecondaryActionButton
              onClick={onCancel}
              size="small"
              fullWidth
              sx={{
                color: '#666',
                fontSize: '0.85rem',
                py: 1,
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
            </SecondaryActionButton>
          )}
          <PrimaryActionButton
            onClick={handleSave}
            disabled={!formData.name || !formData.url}
            size="small"
            fullWidth
            sx={{
              borderRadius: '16px',
              fontSize: '0.85rem',
              py: 1,
              flex: 1,
            }}
          >
            Add Shop
          </PrimaryActionButton>
        </Box>
      </Box>
    </Box>
  );
}
