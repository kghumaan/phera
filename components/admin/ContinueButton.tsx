'use client';

import { Box, Button, CircularProgress, Dialog, DialogContent, TextField, IconButton, Stack, Typography } from '@mui/material';
import { ArrowForward, Publish, ContentCopy, Check, Close, OpenInNew } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { PRIMARY_BUTTON_SX } from '@/lib/constants/button-styles';
import { useAutoSaveStatus } from '@/lib/contexts/AutoSaveContext';
import { groups } from '@/components/admin/OnboardingSidebar';
import { weddingService } from '@/lib/supabase/wedding-service';
import { useNavigationGuard } from '@/lib/contexts/NavigationGuardContext';

const websiteItems = groups.find(g => g.id === 'wedding-website')!.items;

interface ContinueButtonProps {
  weddingSlug: string;
  currentSection: string;
  weddingId?: string | null;
}

export default function ContinueButton({ weddingSlug, currentSection, weddingId }: ContinueButtonProps) {
  const router = useRouter();
  const { checkGuard } = useNavigationGuard();
  const { showStatus } = useAutoSaveStatus();
  const [publishing, setPublishing] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [showPublishedModal, setShowPublishedModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const liveUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://phera.io'}/${weddingSlug}`;

  const currentIndex = websiteItems.findIndex(item => item.id === currentSection);
  const nextItem = currentIndex >= 0 && currentIndex < websiteItems.length - 1
    ? websiteItems[currentIndex + 1]
    : null;

  const handlePublish = async () => {
    if (!weddingId) return;
    setPublishing(true);
    try {
      const success = await weddingService.publishWedding(weddingId);
      if (success) {
        setShowPublishedModal(true);
        window.postMessage({ type: 'CHANGES_SAVED' }, '*');
      } else {
        showStatus('error', 'Failed to publish. Please try again.');
      }
    } catch {
      showStatus('error', 'Failed to publish. Please try again.');
    } finally {
      setPublishing(false);
    }
  };

  if (currentIndex === -1) return null;

  const copyLiveUrl = () => {
    navigator.clipboard.writeText(liveUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4, mb: 2 }}>
        {nextItem ? (
          <Button
            variant="contained"
            endIcon={navigating ? <CircularProgress size={18} color="inherit" /> : <ArrowForward />}
            sx={PRIMARY_BUTTON_SX}
            disabled={navigating}
            onClick={() => { if (!checkGuard()) return; setNavigating(true); router.push(`/admin/${weddingSlug}${nextItem.path}`); }}
          >
            Continue: {nextItem.label}
          </Button>
        ) : (
          <Button
            variant="contained"
            startIcon={publishing ? <CircularProgress size={18} color="inherit" /> : <Publish />}
            sx={PRIMARY_BUTTON_SX}
            onClick={handlePublish}
            disabled={publishing || !weddingId}
          >
            {publishing ? 'Publishing...' : 'Publish Website'}
          </Button>
        )}
      </Box>

      {/* Published Modal */}
      <Dialog
        open={showPublishedModal}
        onClose={() => setShowPublishedModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '24px',
            p: 1,
            bgcolor: 'white',
          }
        }}
      >
        <DialogContent>
          <IconButton
            onClick={() => setShowPublishedModal(false)}
            sx={{ position: 'absolute', right: 16, top: 16, color: '#666' }}
          >
            <Close />
          </IconButton>

          <Stack spacing={3} sx={{ mt: 2, pb: 2, textAlign: 'center' }}>
            <Typography variant="h4" sx={{
              fontWeight: 700,
              color: '#1a1a1a',
              fontSize: { xs: '1.75rem', md: '2.5rem' }
            }}>
              Your website is published!
            </Typography>
            <Typography variant="body1" sx={{ color: '#4a4a4a' }}>
              Start sharing this with your friends and family — we&apos;ll collect your RSVPs.
            </Typography>
            <TextField
              fullWidth
              variant="outlined"
              value={liveUrl}
              InputProps={{
                readOnly: true,
                sx: {
                  borderRadius: '12px',
                  bgcolor: '#f8f9fa',
                  '& fieldset': { borderColor: 'rgba(0,0,0,0.1)' },
                  '&:hover fieldset': { borderColor: 'rgba(0,0,0,0.1)' },
                  color: '#666',
                }
              }}
            />
            <Stack direction="row" spacing={3} justifyContent="center">
              <Button
                startIcon={copiedLink ? <Check sx={{ fontSize: 18 }} /> : <ContentCopy sx={{ fontSize: 18 }} />}
                onClick={copyLiveUrl}
                sx={{
                  textTransform: 'none',
                  color: '#DE3F5E',
                  fontWeight: 600,
                  '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' }
                }}
              >
                {copiedLink ? 'Copied!' : 'Copy Link'}
              </Button>
              <Button
                startIcon={<OpenInNew sx={{ fontSize: 18 }} />}
                href={liveUrl}
                target="_blank"
                sx={{
                  textTransform: 'none',
                  color: '#DE3F5E',
                  fontWeight: 600,
                  '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' }
                }}
              >
                Open in New Tab
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  );
}
