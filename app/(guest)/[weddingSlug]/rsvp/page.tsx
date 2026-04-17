'use client';

import { Box, useTheme, useMediaQuery } from '@mui/material';
import { motion } from 'framer-motion';
import CustomRSVPForm from '@/components/guest/CustomRSVPForm';
import OptimizedBackground from '@/components/ui/OptimizedBackground';
import AppHeader from '@/components/shared/AppHeader';
import { useParams } from 'next/navigation';
import { useWedding } from '@/lib/contexts/WeddingContext';
import { COLORS, RADII } from '@/lib/theme/tokens';

export default function RSVPPage() {
  const params = useParams();
  const weddingId = params.weddingSlug as string;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { wedding } = useWedding();

  return (
    <OptimizedBackground
      useAppDefault={true}
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
            backHref={`/${weddingId}/details`}
          />
        </Box>
      )}

      {/* Desktop: Centered form container with header padding */}
      {!isMobile ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            pt: { md: 15, lg: 16 }, // Padding for fixed header
            pb: { md: 4, lg: 6 },
            px: { md: 4, lg: 6 },
          }}
        >
          <Box
            sx={{
              width: '100%',
              maxWidth: { md: 700, lg: 800, xl: 900 },
            }}
          >
            <CustomRSVPForm weddingId={weddingId} primaryColor={wedding?.primary_color || undefined} />
          </Box>
        </Box>
      ) : (
        /* Mobile: Full screen form as before */
        <CustomRSVPForm weddingId={weddingId} primaryColor={wedding?.primary_color || undefined} />
      )}
    </OptimizedBackground>
  );
}