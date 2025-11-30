'use client';

import { useState, useEffect } from 'react';
import { Box, Drawer, Fab, IconButton, Typography, alpha } from '@mui/material';
import { Visibility, Close } from '@mui/icons-material';

interface OnboardingPreviewFABProps {
  weddingSlug: string;
  coupleName?: string;
}

export default function OnboardingPreviewFAB({ weddingSlug, coupleName }: OnboardingPreviewFABProps) {
  const [previewOpen, setPreviewOpen] = useState(false);

  // Listen for messages from preview iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'CLOSE_PREVIEW') {
        setPreviewOpen(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <>
      {/* Floating Action Button */}
      <Fab
        variant="extended"
        color="primary"
        aria-label="preview"
        onClick={() => setPreviewOpen(true)}
        sx={{
          position: 'fixed',
          top: { xs: 16, md: 24 },
          right: { xs: 16, md: 24 },
          zIndex: 1000,
          bgcolor: '#DE3F5E',
          color: 'white',
          '&:hover': {
            bgcolor: '#C8365A',
            transform: 'scale(1.05)',
          },
          boxShadow: '0 4px 20px rgba(222, 63, 94, 0.4)',
          transition: 'all 0.2s ease',
          // Larger sizes
          minWidth: { xs: 64, md: 'auto' },
          width: { xs: 64, md: 'auto' },
          height: { xs: 64, md: 56 },
          borderRadius: { xs: '50%', md: '28px' },
          px: { xs: 0, md: 4 },
          fontSize: { xs: '1.1rem', md: '1.15rem' },
          fontWeight: 600,
        }}
      >
        <Visibility sx={{ mr: { xs: 0, md: 1.5 }, fontSize: { xs: 28, md: 32 } }} />
        <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>
          Preview
        </Box>
      </Fab>

      {/* Preview Drawer */}
      <Drawer
        anchor="right"
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: { xs: '100%', md: '80%' },
            maxWidth: 1200,
          },
        }}
      >
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box
            sx={{
              p: 2,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: 1,
              borderColor: 'divider',
              bgcolor: alpha('#fff', 0.95),
              backdropFilter: 'blur(10px)',
            }}
          >
            <Typography variant="h6" sx={{ fontFamily: 'var(--font-instrument-serif)', fontWeight: 700, color: '#1a1a1a' }}>
              Preview: {coupleName || weddingSlug}
            </Typography>
            <IconButton onClick={() => setPreviewOpen(false)}>
              <Close />
            </IconButton>
          </Box>
          <Box sx={{ flex: 1 }}>
            <iframe
              src={`/preview/${weddingSlug}`}
              style={{ width: '100%', height: '100%', border: 'none' }}
              title="Wedding Preview"
            />
          </Box>
        </Box>
      </Drawer>
    </>
  );
}

