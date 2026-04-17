'use client';

import {
  Box,
  Container,
  Typography,
  IconButton,
  Stack,
  useTheme,
  useMediaQuery,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
} from '@mui/material';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowBack, ChevronRight, OpenInNew } from '@mui/icons-material';
import OptimizedBackground from '@/components/ui/OptimizedBackground';
import WhatsAppChannelModal from '@/components/shared/WhatsAppChannelModal';
import AppHeader from '@/components/shared/AppHeader';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { weddingService } from '@/lib/supabase/wedding-service';
import { useWedding } from '@/lib/contexts/WeddingContext';
import type { WeddingRegistry } from '@/lib/supabase/wedding-service';
import { COLORS, RADII } from '@/lib/theme/tokens';
import { PheraDialog, PheraDialogTitle } from '@/components/shared/Dialog';

export default function RegistryPage() {
  const params = useParams();
  const weddingSlug = params.weddingSlug as string;

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const router = useRouter();
  const { user, hasRSVPed, rsvpResponse } = useAuth();
  const { wedding, registry: contextRegistry, isLoading: contextLoading } = useWedding();

  const [registry, setRegistry] = useState<WeddingRegistry[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedRegistry, setSelectedRegistry] = useState<WeddingRegistry | null>(null);

  // Only show WhatsApp button if user has RSVP'd "yes" or "maybe"
  const shouldShowWhatsApp = hasRSVPed && (rsvpResponse === 'yes' || rsvpResponse === 'maybe');
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);

  // Use registry from context (respects live/preview mode and snapshot)
  useEffect(() => {
    if (!contextLoading) {
      setRegistry(contextRegistry);
      setLoading(false);
    }
  }, [contextRegistry, contextLoading]);

  const handleRegistryClick = (item: WeddingRegistry) => {
    setSelectedRegistry(item);
    setConfirmDialogOpen(true);
  };

  const handleConfirmRedirect = () => {
    if (selectedRegistry?.external_url) {
      window.open(selectedRegistry.external_url, '_blank', 'noopener,noreferrer');
    }
    setConfirmDialogOpen(false);
    setSelectedRegistry(null);
  };

  const handleBack = () => {
    router.push(`/${weddingSlug}/details`);
  };

  return (
    <OptimizedBackground
      src="/images/backgrounds/lavender.webp"
      className="min-h-screen"
    >
      {/* Desktop Header - AppHeader with consistent styling */}
      {!isMobile && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10,
            backgroundColor: 'transparent',
          }}
        >
          <AppHeader
            variant="transparent"
            showBackButton={true}
            backHref={`/${weddingSlug}/details`}
          />
        </Box>
      )}

      {/* Mobile Header */}
      {isMobile && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 2,
            pt: 2,
            pb: 2,
          }}
        >
          <Container
            maxWidth={false}
            sx={{
              maxWidth: { xs: 361, md: 600, lg: 700 },
              px: { xs: 2, md: 3 },
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <IconButton
                onClick={handleBack}
                sx={{
                  color: COLORS.text.strong,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  },
                }}
              >
                <ArrowBack />
              </IconButton>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 400,
                  fontSize: 18,
                  lineHeight: 1.5,
                  letterSpacing: '5.56%',
                  textTransform: 'uppercase',
                  color: '#141414',
                }}
              >
                Registry
              </Typography>

              {/* WhatsApp Button - Only show if user RSVP'd yes or maybe */}
              {shouldShowWhatsApp ? (
                <IconButton
                  onClick={() => setWhatsAppModalOpen(true)}
                  sx={{
                    width: 32,
                    height: 32,
                    backgroundColor: COLORS.text.strong,
                    color: COLORS.text.inverse,
                    '&:hover': {
                      backgroundColor: COLORS.text.strong,
                      transform: 'scale(1.05)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.516" />
                  </svg>
                </IconButton>
              ) : (
                <Box sx={{ width: 32, height: 32 }} /> // Spacer when WhatsApp button is hidden
              )}
            </Stack>
          </Container>
        </Box>
      )}

      {/* Main Content */}
      <Container
        maxWidth={false}
        sx={{
          maxWidth: { xs: '100%', md: 800, lg: 900 },
          px: { xs: 2, md: 4 },
          pb: 4,
          pt: { xs: 10, md: 14 },
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '80vh',
        }}
      >
        {loading ? (
          <CircularProgress sx={{ color: wedding?.primary_color || COLORS.brand.primary }} />
        ) : registry.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Typography
              sx={{
                fontSize: 18,
                color: COLORS.text.subtle,
                textAlign: 'center',
              }}
            >
              No registry links available yet.
            </Typography>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{ width: '100%' }}
          >
            <Stack spacing={{ xs: 3, md: 4 }} alignItems="center">
              {registry.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  style={{ width: '100%' }}
                >
                  <Box
                    component="button"
                    onClick={() => handleRegistryClick(item)}
                    sx={{
                      display: 'block',
                      width: '100%',
                      textDecoration: 'none',
                      border: 'none',
                      borderRadius: RADII.xl,
                      overflow: 'hidden',
                      boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.15)',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease-in-out',
                      '&:hover': {
                        boxShadow: '0px 8px 30px rgba(0, 0, 0, 0.25)',
                        transform: 'translateY(-4px)',
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 3,
                        padding: { xs: 4, md: 5 },
                        backgroundColor: COLORS.bg.white,
                      }}
                    >
                      {/* Registry Name with Emoji */}
                      <Typography
                        variant="h4"
                        sx={{
                          fontWeight: 600,
                          lineHeight: 1,
                          color: '#141414',
                        }}
                      >
                        {item.fund_name}
                      </Typography>

                      <ChevronRight
                        sx={{
                          color: '#141414',
                          fontSize: { xs: 40, md: 48 },
                          flexShrink: 0,
                        }}
                      />
                    </Box>
                  </Box>
                </motion.div>
              ))}
            </Stack>
          </motion.div>
        )}
      </Container>

      {/* Confirmation Dialog */}
      <PheraDialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        PaperProps={{ sx: { p: 2 } }}
      >
        <PheraDialogTitle
          onClose={() => setConfirmDialogOpen(false)}
          sx={{ justifyContent: 'center', pt: 3 }}
        >
          Leaving Site
        </PheraDialogTitle>
        <DialogContent>
          <Stack spacing={2} alignItems="center" sx={{ py: 2 }}>
            <OpenInNew sx={{ fontSize: 48, color: wedding?.primary_color || COLORS.brand.primary }} />
            <Typography
              sx={{
                fontSize: 16,
                color: COLORS.text.muted,
                textAlign: 'center',
              }}
            >
              You're about to be redirected to an external registry site:
            </Typography>
            <Typography
              sx={{
                fontSize: 18,
                fontWeight: 600,
                color: '#141414',
                textAlign: 'center',
              }}
            >
              {selectedRegistry?.fund_name}
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3, gap: 2 }}>
          <Button
            onClick={() => setConfirmDialogOpen(false)}
            sx={{
              color: COLORS.text.subtle,
              borderRadius: RADII.md,
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.05)',
              },
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmRedirect}
            sx={{
              bgcolor: wedding?.primary_color || COLORS.brand.primary,
              color: COLORS.text.inverse,
              borderRadius: RADII.md,
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              '&:hover': {
                bgcolor: COLORS.brand.primaryHover,
              },
            }}
          >
            Continue
          </Button>
        </DialogActions>
      </PheraDialog>

      {/* WhatsApp Channel Modal */}
      <WhatsAppChannelModal
        open={whatsAppModalOpen}
        onClose={() => setWhatsAppModalOpen(false)}
      />
    </OptimizedBackground>
  );
}
