'use client';

import { useState, useEffect } from 'react';
import { Box, Drawer, Fab, IconButton, Typography, alpha, Stack } from '@mui/material';
import { Visibility, Close, DesktopWindows, PhoneAndroid } from '@mui/icons-material';

interface OnboardingPreviewFABProps {
  weddingSlug: string;
  coupleName?: string;
}

export default function OnboardingPreviewFAB({ weddingSlug, coupleName }: OnboardingPreviewFABProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');

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
        onClose={() => {
          setPreviewOpen(false);
          setViewMode('desktop'); // Reset to desktop view when closing
        }}
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
            <Stack direction="row" alignItems="center" spacing={1} sx={{ flex: 1, overflow: 'hidden' }}>
              <Visibility sx={{ color: '#DE3F5E', fontSize: '1.25rem', flexShrink: 0 }} />
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a1a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                PREVIEW MODE - This is how your wedding website will look to guests
              </Typography>
            </Stack>
            <IconButton 
              onClick={() => {
                setPreviewOpen(false);
                setViewMode('desktop'); // Reset to desktop view when closing
              }} 
              sx={{ color: '#1a1a1a' }}
            >
              <Close />
            </IconButton>
          </Box>
          <Box 
            sx={{ 
              flex: 1, 
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: viewMode === 'mobile' ? '#e5e5e5' : 'transparent',
              overflow: 'auto',
            }}
          >
            {/* Floating View Mode Toggle Buttons */}
            <Box
              sx={{
                position: 'absolute',
                top: 16,
                right: 16,
                zIndex: 10,
                display: 'flex',
                gap: 1,
                bgcolor: alpha('#fff', 0.95),
                backdropFilter: 'blur(10px)',
                borderRadius: 2,
                p: 0.5,
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              }}
            >
              <IconButton
                onClick={() => setViewMode('desktop')}
                size="small"
                sx={{
                  bgcolor: viewMode === 'desktop' ? alpha('#DE3F5E', 0.1) : 'transparent',
                  color: viewMode === 'desktop' ? '#DE3F5E' : '#666',
                  '&:hover': {
                    bgcolor: viewMode === 'desktop' ? alpha('#DE3F5E', 0.15) : alpha('#DE3F5E', 0.05),
                  },
                }}
                title="Desktop View"
              >
                <DesktopWindows />
              </IconButton>
              <IconButton
                onClick={() => setViewMode('mobile')}
                size="small"
                sx={{
                  bgcolor: viewMode === 'mobile' ? alpha('#DE3F5E', 0.1) : 'transparent',
                  color: viewMode === 'mobile' ? '#DE3F5E' : '#666',
                  '&:hover': {
                    bgcolor: viewMode === 'mobile' ? alpha('#DE3F5E', 0.15) : alpha('#DE3F5E', 0.05),
                  },
                }}
                title="Mobile View"
              >
                <PhoneAndroid />
              </IconButton>
            </Box>

            {/* Preview Container */}
            <Box
              sx={{
                width: viewMode === 'mobile' ? '480px' : '100%',
                height: viewMode === 'mobile' ? '800px' : '100%',
                maxWidth: viewMode === 'mobile' ? '480px' : 'none',
                maxHeight: viewMode === 'mobile' ? '800px' : 'none',
                transition: 'all 0.3s ease',
                boxShadow: viewMode === 'mobile' ? '0 4px 20px rgba(0,0,0,0.2)' : 'none',
                borderRadius: viewMode === 'mobile' ? 2 : 0,
                overflow: 'hidden',
                border: viewMode === 'mobile' ? '8px solid #1a1a1a' : 'none',
              }}
            >
              <iframe
                src={`/preview/${weddingSlug}`}
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  border: 'none',
                }}
                title="Wedding Preview"
              />
            </Box>
          </Box>
        </Box>
      </Drawer>
    </>
  );
}

