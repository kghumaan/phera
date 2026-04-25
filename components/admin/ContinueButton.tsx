'use client';

import { Box, Button, DialogContent, TextField, IconButton, Stack, Typography } from '@mui/material';
import { PheraDialog } from '@/components/shared/Dialog';
import { ArrowForward, ContentCopy, Check, Close, OpenInNew } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { PRIMARY_BUTTON_SX } from '@/lib/constants/button-styles';
import { groups } from '@/components/admin/OnboardingSidebar';
import { useNavigationGuard } from '@/lib/contexts/NavigationGuardContext';
import { PrimaryActionButton } from './ActionButton';
import { COLORS, RADII } from '@/lib/theme/tokens';

// Flow = wedding-website items, then guest-list. After pins (last website
// section) we push users toward importing their guests rather than showing
// the publish CTA — publish lives in the preview panel now and is gated on
// guest count.
const websiteItems = groups.find(g => g.id === 'wedding-website')!.items;
const guestListItem = groups
  .find(g => g.id === 'guests-group')!
  .items.find(i => i.id === 'guest-list')!;
const flow = [...websiteItems, guestListItem];

interface ContinueButtonProps {
  weddingSlug: string;
  currentSection: string;
  weddingId?: string | null;
}

export default function ContinueButton({ weddingSlug, currentSection }: ContinueButtonProps) {
  const router = useRouter();
  const { checkGuard } = useNavigationGuard();
  const [navigating, setNavigating] = useState(false);
  const [showPublishedModal, setShowPublishedModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const liveUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://phera.io'}/${weddingSlug}`;

  const currentIndex = flow.findIndex(item => item.id === currentSection);
  const nextItem = currentIndex >= 0 && currentIndex < flow.length - 1
    ? flow[currentIndex + 1]
    : null;

  if (currentIndex === -1 || !nextItem) return null;

  const copyLiveUrl = () => {
    navigator.clipboard.writeText(liveUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4, mb: 2 }}>
        <PrimaryActionButton
          endIcon={<ArrowForward />}
          sx={PRIMARY_BUTTON_SX}
          loading={navigating}
          onClick={() => { if (!checkGuard()) return; setNavigating(true); router.push(`/admin/${weddingSlug}${nextItem.path}`); }}
        >
          Continue: {nextItem.label}
        </PrimaryActionButton>
      </Box>

      {/* Published Modal */}
      <PheraDialog
        open={showPublishedModal}
        onClose={() => setShowPublishedModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { p: 1 } }}
      >
        <DialogContent>
          <IconButton
            onClick={() => setShowPublishedModal(false)}
            sx={{ position: 'absolute', right: 16, top: 16, color: COLORS.text.subtle }}
          >
            <Close />
          </IconButton>

          <Stack spacing={3} sx={{ mt: 2, pb: 2, textAlign: 'center' }}>
            <Typography variant="h4" sx={{
              fontWeight: 700,
              color: COLORS.text.strong,
              fontSize: { xs: '1.75rem', md: '2.5rem' }
            }}>
              Your website is published!
            </Typography>
            <Typography variant="body1" sx={{ color: COLORS.text.muted }}>
              Start sharing this with your friends and family — we&apos;ll collect your RSVPs.
            </Typography>
            <TextField
              fullWidth
              variant="outlined"
              value={liveUrl}
              InputProps={{
                readOnly: true,
                sx: {
                  borderRadius: RADII.md,
                  bgcolor: COLORS.bg.muted,
                  '& fieldset': { borderColor: 'rgba(0,0,0,0.1)' },
                  '&:hover fieldset': { borderColor: 'rgba(0,0,0,0.1)' },
                  color: COLORS.text.subtle,
                }
              }}
            />
            <Stack direction="row" spacing={3} justifyContent="center">
              <Button
                startIcon={copiedLink ? <Check sx={{ fontSize: 18 }} /> : <ContentCopy sx={{ fontSize: 18 }} />}
                onClick={copyLiveUrl}
                sx={{
                  textTransform: 'none',
                  color: COLORS.brand.primary,
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
                  color: COLORS.brand.primary,
                  fontWeight: 600,
                  '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' }
                }}
              >
                Open in New Tab
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </PheraDialog>
    </>
  );
}
