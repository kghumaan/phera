'use client';

import { useState, useEffect } from 'react';
import { Box, Drawer, Fab, IconButton, Typography, alpha, Stack, Popover, Button, TextField, Divider, CircularProgress } from '@mui/material';
import { Visibility, Close, DesktopWindows, PhoneAndroid, Publish, ContentCopy, Check, Edit } from '@mui/icons-material';
import { weddingService } from '@/lib/supabase/wedding-service';

interface OnboardingPreviewFABProps {
  weddingSlug: string;
  coupleName?: string;
  weddingStatus?: 'draft' | 'live';
  weddingId?: string;
  onStatusChange?: (status: 'draft' | 'live') => void;
}

export default function OnboardingPreviewFAB({ weddingSlug, coupleName, weddingStatus: initialStatus = 'draft', weddingId, onStatusChange }: OnboardingPreviewFABProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [publishAnchorEl, setPublishAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [weddingStatus, setWeddingStatus] = useState<'draft' | 'live'>(initialStatus);
  const [customSlug, setCustomSlug] = useState(weddingSlug);
  const [editingSlug, setEditingSlug] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);

  const publishOpen = Boolean(publishAnchorEl);

  // Update status when prop changes
  useEffect(() => {
    setWeddingStatus(initialStatus);
  }, [initialStatus]);

  // Update slug when prop changes
  useEffect(() => {
    setCustomSlug(weddingSlug);
  }, [weddingSlug]);

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

  const handlePublishClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setPublishAnchorEl(event.currentTarget);
  };

  const handlePublishClose = () => {
    setPublishAnchorEl(null);
    setEditingSlug(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setUrlCopied(true);
    setTimeout(() => setUrlCopied(false), 2000);
  };

  const handleStatusUpdate = async (newStatus: 'draft' | 'live') => {
    if (!weddingId) return;

    if (newStatus === 'live') {
      const confirmed = window.confirm('Are you sure you want to publish your wedding website? It will be visible to all guests with PINs.');
      if (!confirmed) return;
    }

    setSavingStatus(true);
    try {
      await weddingService.updateWedding(weddingId, { status: newStatus });
      setWeddingStatus(newStatus);
      onStatusChange?.(newStatus);

      // Close popover after successful update
      setTimeout(() => {
        handlePublishClose();
      }, 500);
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update status. Please try again.');
    } finally {
      setSavingStatus(false);
    }
  };

  const handleSlugUpdate = async () => {
    if (!weddingId || !customSlug || customSlug === weddingSlug) {
      setEditingSlug(false);
      return;
    }

    try {
      const isAvailable = await weddingService.checkSlugAvailability(customSlug);
      if (!isAvailable) {
        alert('This wedding ID is already taken. Please choose another.');
        return;
      }

      await weddingService.updateWedding(weddingId, { slug: customSlug });
      // Reload page with new slug
      window.location.href = `/admin/${customSlug}/overview`;
    } catch (error) {
      console.error('Failed to update slug:', error);
      alert('Failed to update wedding ID. Please try again.');
    }
  };

  return (
    <>
      {/* Floating Action Buttons */}
      <Box
        sx={{
          position: 'fixed',
          top: { xs: 16, md: 24 },
          right: { xs: 16, md: 24 },
          zIndex: 1000,
          display: 'flex',
          gap: 2,
        }}
      >
        {/* Preview Button (Outlined) */}
        <Fab
          variant="extended"
          aria-label="preview"
          onClick={() => setPreviewOpen(true)}
          sx={{
            bgcolor: 'white',
            color: '#DE3F5E',
            border: '2px solid #DE3F5E',
            '&:hover': {
              bgcolor: alpha('#DE3F5E', 0.05),
              border: '2px solid #C8365A',
              transform: 'scale(1.05)',
            },
            boxShadow: '0 4px 20px rgba(222, 63, 94, 0.2)',
            transition: 'all 0.2s ease',
            minWidth: { xs: 64, md: 'auto' },
            width: { xs: 64, md: 'auto' },
            height: { xs: 64, md: 56 },
            borderRadius: { xs: '50%', md: '28px' },
            px: { xs: 0, md: 4 },
            fontSize: { xs: '1.1rem', md: '1.1rem' },
            fontWeight: 600,
          }}
        >
          <Visibility sx={{ mr: { xs: 0, md: 1.5 }, fontSize: { xs: 28, md: 28 } }} />
          <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>
            Preview
          </Box>
        </Fab>

        {/* Publish Button (Solid) */}
        <Fab
          variant="extended"
          color="primary"
          aria-label="publish"
          onClick={handlePublishClick}
          sx={{
            bgcolor: '#DE3F5E',
            color: 'white',
            '&:hover': {
              bgcolor: '#C8365A',
              transform: 'scale(1.05)',
            },
            boxShadow: '0 4px 20px rgba(222, 63, 94, 0.4)',
            transition: 'all 0.2s ease',
            minWidth: { xs: 64, md: 'auto' },
            width: { xs: 64, md: 'auto' },
            height: { xs: 64, md: 56 },
            borderRadius: { xs: '50%', md: '28px' },
            px: { xs: 0, md: 4 },
            fontSize: { xs: '1.1rem', md: '1.1rem' },
            fontWeight: 600,
          }}
        >
          <Publish sx={{ mr: { xs: 0, md: 1.5 }, fontSize: { xs: 28, md: 28 } }} />
          <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>
            Publish
          </Box>
        </Fab>
      </Box>

      {/* Publish Popover */}
      <Popover
        open={publishOpen}
        anchorEl={publishAnchorEl}
        onClose={handlePublishClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        sx={{
          mt: 1,
        }}
        PaperProps={{
          sx: {
            width: 500,
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
            p: 3,
            bgcolor: 'white',
          },
        }}
      >
        <Stack spacing={2.5}>
          {/* Title */}
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
            Publish Settings
          </Typography>

          {/* Wedding URL */}
          <Box>
            <Typography variant="caption" sx={{ color: '#6a6a6a', fontWeight: 600, mb: 1, display: 'block' }}>
              Your Wedding URL
            </Typography>
            {!editingSlug ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    flex: 1,
                    bgcolor: alpha('#DE3F5E', 0.05),
                    p: 1.5,
                    borderRadius: '8px',
                    border: '1px solid rgba(222, 63, 94, 0.2)',
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#DE3F5E',
                      fontWeight: 600,
                      fontFamily: 'monospace',
                      fontSize: '0.9rem',
                    }}
                  >
                    phera.io/{weddingSlug}
                  </Typography>
                </Box>
                <IconButton
                  size="small"
                  onClick={() => copyToClipboard(`${window.location.origin}/${weddingSlug}`)}
                  sx={{
                    bgcolor: urlCopied ? '#10B981' : alpha('#DE3F5E', 0.1),
                    color: urlCopied ? 'white' : '#DE3F5E',
                    '&:hover': {
                      bgcolor: urlCopied ? '#059669' : alpha('#DE3F5E', 0.2),
                    },
                  }}
                >
                  {urlCopied ? <Check fontSize="small" /> : <ContentCopy fontSize="small" />}
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => setEditingSlug(true)}
                  sx={{
                    bgcolor: alpha('#DE3F5E', 0.1),
                    color: '#DE3F5E',
                    '&:hover': {
                      bgcolor: alpha('#DE3F5E', 0.2),
                    },
                  }}
                >
                  <Edit fontSize="small" />
                </IconButton>
              </Box>
            ) : (
              <Stack spacing={1}>
                <TextField
                  size="small"
                  value={customSlug}
                  onChange={(e) => setCustomSlug(e.target.value)}
                  placeholder="wedding-id"
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px',
                      '& fieldset': {
                        borderColor: '#1a1a1a',
                        borderWidth: '1px',
                      },
                      '&:hover fieldset': {
                        borderColor: '#1a1a1a',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#DE3F5E',
                      },
                    },
                  }}
                />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      setCustomSlug(weddingSlug);
                      setEditingSlug(false);
                    }}
                    sx={{
                      borderRadius: '8px',
                      textTransform: 'none',
                      borderColor: '#DE3F5E',
                      color: '#DE3F5E',
                      '&:hover': {
                        borderColor: '#C8365A',
                        bgcolor: alpha('#DE3F5E', 0.05),
                      },
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={handleSlugUpdate}
                    disabled={customSlug === weddingSlug || !customSlug}
                    sx={{
                      borderRadius: '8px',
                      textTransform: 'none',
                      bgcolor: '#DE3F5E',
                      color: 'white',
                      '&:hover': {
                        bgcolor: '#C8365A',
                      },
                      '&.Mui-disabled': {
                        bgcolor: alpha('#DE3F5E', 0.5),
                        color: 'rgba(255, 255, 255, 0.7)',
                      },
                    }}
                  >
                    Save
                  </Button>
                </Box>
              </Stack>
            )}
          </Box>

          <Divider />

          {/* Status Controls */}
          <Box>
            <Typography variant="caption" sx={{ color: '#6a6a6a', fontWeight: 600, mb: 1.5, display: 'block' }}>
              Website Status
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              {/* Publish Button - Primary Style */}
              <Button
                fullWidth
                variant="contained"
                startIcon={savingStatus && weddingStatus === 'draft' ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <Publish />}
                onClick={() => handleStatusUpdate('live')}
                disabled={savingStatus}
                sx={{
                  bgcolor: '#DE3F5E',
                  color: 'white',
                  py: 1.5,
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontWeight: 600,
                  '&:hover': {
                    bgcolor: '#C8365A',
                  },
                  '&.Mui-disabled': {
                    bgcolor: alpha('#DE3F5E', 0.5),
                    color: 'rgba(255, 255, 255, 0.7)',
                  },
                }}
              >
                {savingStatus && weddingStatus === 'draft' ? 'Publishing...' : 'Publish'}
              </Button>

              {/* Unpublish Button - Secondary Style */}
              <Button
                fullWidth
                variant="outlined"
                startIcon={savingStatus && weddingStatus === 'live' ? <CircularProgress size={16} sx={{ color: '#DE3F5E' }} /> : null}
                onClick={() => handleStatusUpdate('draft')}
                disabled={savingStatus}
                sx={{
                  borderColor: '#DE3F5E',
                  color: '#DE3F5E',
                  py: 1.5,
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontWeight: 600,
                  '&:hover': {
                    borderColor: '#C8365A',
                    bgcolor: alpha('#DE3F5E', 0.05),
                  },
                  '&.Mui-disabled': {
                    borderColor: alpha('#DE3F5E', 0.5),
                    color: alpha('#DE3F5E', 0.5),
                  },
                }}
              >
                {savingStatus && weddingStatus === 'live' ? 'Unpublishing...' : 'Unpublish'}
              </Button>
            </Box>
            <Typography variant="caption" sx={{ color: '#6a6a6a', textAlign: 'center', display: 'block', mt: 1.5 }}>
              {weddingStatus === 'draft' ? 'Your website is currently private' : '🎉 Your website is live!'}
            </Typography>
          </Box>
        </Stack>
      </Popover>

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

