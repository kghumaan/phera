'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  IconButton,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useWedding } from '@/lib/contexts/WeddingContext';
import { supabase } from '@/lib/supabase/client';
import AppHeader from '@/components/shared/AppHeader';
import ReserveTransportation from '@/components/guest/ReserveTransportation';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { COLORS, RADII } from '@/lib/theme/tokens';

export default function TransportationPage() {
  const params = useParams();
  const router = useRouter();
  const weddingSlug = params.weddingSlug as string;

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const { user, hasRSVPed, isLoading: authLoading } = useAuth();
  const { wedding, isLoading: weddingLoading } = useWedding();

  const [isNavigating, setIsNavigating] = useState(false);
  const [guestId, setGuestId] = useState<string | null>(null);

  const isLoading = authLoading || weddingLoading;
  const primaryColor = wedding?.primary_color || COLORS.brand.primary;

  // Look up the guest record ID by email + wedding slug
  // The guests table stores wedding_id as the slug (text), not UUID
  useEffect(() => {
    const lookupGuest = async () => {
      if (!user?.email || !weddingSlug) return;
      const { data, error } = await supabase
        .from('guests')
        .select('id')
        .eq('email', user.email)
        .eq('wedding_id', weddingSlug)
        .single();
      if (data && !error) {
        setGuestId(data.id);
      } else {
        console.error('Could not find guest record:', error);
      }
    };
    lookupGuest();
  }, [user?.email, weddingSlug]);

  const handleBack = () => {
    setIsNavigating(true);
    router.back();
  };

  const handleClose = () => {
    setIsNavigating(true);
    router.push(`/${weddingSlug}`);
  };

  // Check if user has RSVP'd
  if (!isLoading && !hasRSVPed) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundImage: 'url(/images/backgrounds/pearl.webp)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          p: 4,
        }}
      >
        <Typography
          variant="h5"
          sx={{
            fontFamily: 'var(--font-instrument-serif)',
            fontStyle: 'italic',
            color: COLORS.text.strong,
            mb: 2,
            textAlign: 'center',
          }}
        >
          Please RSVP First
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: COLORS.text.subtle, textAlign: 'center', maxWidth: 400 }}
        >
          You need to RSVP to the wedding before reserving transportation.
        </Typography>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: COLORS.bg.subtle,
        }}
      >
        <LoadingSpinner />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundImage: 'url(/images/backgrounds/pearl.webp)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Navigation Loading Overlay */}
      {isNavigating && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <CircularProgress size={40} sx={{ color: primaryColor }} />
        </Box>
      )}

      {/* Desktop Header */}
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
            backHref={`/${weddingSlug}`}
          />
        </Box>
      )}

      {/* Mobile Header with back button */}
      {isMobile && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10,
            pt: 2,
            pb: 2,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Container maxWidth="sm" sx={{ px: 2 }}>
            <IconButton
              onClick={handleBack}
              sx={{
                color: COLORS.text.strong,
                backgroundColor: 'rgba(255, 255, 255, 0.5)',
                backdropFilter: 'blur(10px)',
                width: 40,
                height: 40,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.7)',
                },
              }}
            >
              <ArrowBack />
            </IconButton>
          </Container>
        </Box>
      )}

      {/* Main Content */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          pt: { xs: 12, md: 16 },
          pb: 4,
          px: 2,
        }}
      >
        <Container
          maxWidth="sm"
          sx={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {wedding && guestId && (
              <ReserveTransportation
                weddingId={wedding.id}
                guestId={guestId}
                onClose={handleClose}
                primaryColor={wedding?.primary_color || undefined}
              />
            )}
          </motion.div>
        </Container>
      </Box>
    </Box>
  );
}
