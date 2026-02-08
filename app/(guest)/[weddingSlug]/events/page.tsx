'use client';

import { Box, Container, Typography, IconButton, Stack, Button, useTheme, useMediaQuery, CircularProgress } from '@mui/material';
import { motion } from 'framer-motion';
import OptimizedBackground from '@/components/ui/OptimizedBackground';
import WhatsAppChannelModal from '@/components/shared/WhatsAppChannelModal';
import AppHeader from '@/components/shared/AppHeader';
import Link from 'next/link';
import { ArrowBack } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useWedding } from '@/lib/contexts/WeddingContext';

export default function GuestEventsPage() {
  const params = useParams();
  const weddingSlug = params.weddingSlug as string;

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const router = useRouter();
  const { user, hasRSVPed, rsvpResponse } = useAuth();

  // Use WeddingContext instead of fetching directly
  const { wedding, events: weddingEvents, isLoading: loading, error } = useWedding();

  // Only show WhatsApp button if user has RSVP'd "yes" or "maybe"
  const shouldShowWhatsApp = hasRSVPed && (rsvpResponse === 'yes' || rsvpResponse === 'maybe');
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
  return (
    <OptimizedBackground
      src="/images/backgrounds/aquarium.png"
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
                onClick={() => router.push(`/${weddingSlug}/details`)}
                sx={{
                  color: '#000',
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
                  fontFamily: 'Outfit',
                  fontWeight: 400,
                  fontSize: 18,
                  lineHeight: 1.5,
                  letterSpacing: '5.56%',
                  textTransform: 'uppercase',
                  color: '#141414',
                }}
              >
                Events & Dress Code
              </Typography>

              {/* WhatsApp Button - Only show if user RSVP'd yes or maybe */}
              {shouldShowWhatsApp ? (
                <IconButton
                  onClick={() => setWhatsAppModalOpen(true)}
                  sx={{
                    width: 32,
                    height: 32,
                    backgroundColor: '#000',
                    color: '#fff',
                    '&:hover': {
                      backgroundColor: '#333',
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
        }}
      >
        {/* Loading State - Only show if loading AND no events yet */}
        {loading && weddingEvents.length === 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
            <CircularProgress sx={{ color: wedding?.primary_color || '#DE3F5E' }} />
          </Box>
        )}

        {/* Error State */}
        {error && !loading && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="error" gutterBottom>
              {error}
            </Typography>
            <Button onClick={() => window.location.reload()} variant="contained" sx={{ mt: 2, backgroundColor: wedding?.primary_color || '#DE3F5E' }}>
              Retry
            </Button>
          </Box>
        )}

        {/* Events List - Show if we have events OR if not loading */}
        {(weddingEvents.length > 0 || !loading) && !error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Event Cards */}
            <Stack spacing={2}>
              {weddingEvents.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <Link href={`/${weddingSlug}/events/${event.slug}`} style={{ textDecoration: 'none' }}>
                    <Box
                      sx={{
                        borderRadius: '16px',
                        overflow: 'hidden',
                        boxShadow: '0px 0px 32px 0px rgba(0, 0, 0, 0.12)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          boxShadow: '0px 0px 40px 0px rgba(0, 0, 0, 0.16)',
                          transform: 'translateY(-2px)',
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex' }}>
                        {event.gradient_background && (
                          <Box
                            sx={{
                              width: 8,
                              flexShrink: 0,
                              backgroundImage: `url(/images/backgrounds/${event.gradient_background})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center'
                            }}
                          />
                        )}
                        <Box
                          sx={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            px: 2,
                            py: 2,
                            backgroundColor: '#fff'
                          }}
                        >
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            {/* Event Title */}
                            <Typography
                              variant="subtitle2"
                              sx={{
                                fontFamily: 'Outfit',
                                fontWeight: 600,
                                fontSize: 14,
                                lineHeight: 1.5,
                                letterSpacing: '0.07em',
                                textTransform: 'uppercase',
                                color: '#474747',
                                mb: 0.5,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {event.name}
                            </Typography>
                            {/* Dress Code (emoji + text) */}
                            <Typography
                              variant="h6"
                              sx={{
                                fontFamily: 'Outfit',
                                fontWeight: 500,
                                fontSize: 22,
                                lineHeight: 1.3,
                                // color: getDressCodeColor(event.name),
                                color: '#000',
                                mb: 0.5,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                              }}
                            >
                              {event.dress_code_emoji} <span style={{ fontWeight: 500 }}>{event.dress_code}</span>
                            </Typography>
                            {/* Date/Time */}
                            <Typography
                              variant="body2"
                              sx={{
                                fontFamily: 'Outfit',
                                fontWeight: 300,
                                fontSize: 16,
                                lineHeight: 1.5,
                                color: '#858585',
                              }}
                            >
                              {event.date} @ {event.time}
                            </Typography>
                          </Box>
                          {/* Chevron Icon */}
                          <Box sx={{ ml: 2, display: 'flex', alignItems: 'center' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M10 6L16 12L10 18" stroke="#858585" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  </Link>
                </motion.div>
              ))}
            </Stack>
          </motion.div>
        )}
      </Container>

      {/* Sticky "Where to Shop" Footer */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 4,
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          borderTop: '1px solid rgba(0, 0, 0, 0.1)',
          px: 2,
          py: 2,
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Container
          maxWidth={false}
          sx={{
            maxWidth: { xs: 361, md: 600, lg: 700 },
            px: { xs: 2, md: 3 },
          }}
        >
          <Stack spacing={1.5} alignItems="center">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{ width: '100%' }}
            >
              <Button
                component={Link}
                href={`/${weddingSlug}/where-to-shop`}
                variant="contained"
                size="large"
                fullWidth
                sx={{
                  backgroundColor: wedding?.primary_color || '#DE3F5E',
                  color: 'white',
                  py: 2,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  borderRadius: '32px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  boxShadow: '0 4px 16px rgba(222, 63, 94, 0.3)',
                  '&:hover': {
                    backgroundColor: '#C8365A',
                    boxShadow: '0 6px 20px rgba(222, 63, 94, 0.4)',
                  },
                }}
              >
                Where to Shop
              </Button>
            </motion.div>
          </Stack>
        </Container>
      </Box>

      {/* Add bottom padding to prevent content from being hidden behind sticky footer */}
      <Box sx={{ height: 100 }} />

      {/* WhatsApp Channel Modal */}
      <WhatsAppChannelModal
        open={whatsAppModalOpen}
        onClose={() => setWhatsAppModalOpen(false)}
      />
    </OptimizedBackground>
  );
} 