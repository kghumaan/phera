'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Button,
  IconButton,
  Stack,
} from '@mui/material';
import { Close, AutoAwesome } from '@mui/icons-material';

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
}

export default function UpgradeModal({ open, onClose }: UpgradeModalProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '24px',
          p: { xs: 1, md: 2 },
          bgcolor: 'white',
          overflow: 'visible',
        },
      }}
    >
      <IconButton
        onClick={onClose}
        sx={{
          position: 'absolute',
          right: 16,
          top: 16,
          color: '#666',
          bgcolor: 'rgba(0,0,0,0.03)',
          '&:hover': { bgcolor: 'rgba(0,0,0,0.06)' },
        }}
      >
        <Close />
      </IconButton>

      <DialogContent>
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Stack spacing={4} alignItems="center">
            {/* Icon */}
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: 'rgba(222, 63, 94, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AutoAwesome sx={{ fontSize: 40, color: '#DE3F5E' }} />
            </Box>

            {/* Title & Description */}
            <Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  color: '#1a1a1a',
                  mb: 1.5,
                  fontSize: { xs: '1.75rem', md: '2.25rem' },
                }}
              >
                Upgrade to Pro
              </Typography>
              <Typography
                sx={{
                  color: '#666',
                  fontSize: '1.05rem',
                  lineHeight: 1.6,
                  maxWidth: '400px',
                  mx: 'auto',
                }}
              >
                Unlock premium features including additional backgrounds, theme colors, travel coordination, and Phera Concierge.
              </Typography>
            </Box>

            {/* Placeholder for future upgrade content */}
            <Box
              sx={{
                width: '100%',
                py: 4,
                px: 3,
                bgcolor: '#f8f9fa',
                borderRadius: '16px',
                border: '2px dashed rgba(0,0,0,0.1)',
              }}
            >
              <Typography sx={{ color: '#999', fontSize: '0.95rem' }}>
                Upgrade options coming soon...
              </Typography>
            </Box>

            {/* Close Button */}
            <Button
              variant="outlined"
              onClick={onClose}
              sx={{
                borderRadius: '100px',
                px: 4,
                py: 1.5,
                color: '#1a1a1a',
                borderColor: 'rgba(0,0,0,0.1)',
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': {
                  borderColor: 'rgba(0,0,0,0.2)',
                  bgcolor: 'rgba(0,0,0,0.02)',
                },
              }}
            >
              Close
            </Button>
          </Stack>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
