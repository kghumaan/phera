'use client';

import { use, useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Stack,
  IconButton,
} from '@mui/material';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowBack } from '@mui/icons-material';
import { WeddingProvider, useWedding } from '@/lib/contexts/WeddingContext';
import { weddingService } from '@/lib/supabase/wedding-service';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

// Diamond decorative component
const DiamondDecoration = () => (
  <Box
    sx={{
      width: { xs: 50, sm: 65, lg: 70, xl: 75 },
      height: { xs: 12, sm: 16, lg: 17, xl: 18 },
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#D1B99F',
      my: { xs: 0.5, sm: 0 },
    }}
  >
    <svg width="75" height="18" viewBox="0 0 65 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clipPath="url(#clip0_173_729)">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M15.6025 9.22518C16.4176 8.62308 16.4176 7.37669 15.6025 6.77459L9.35693 2.16121C8.84471 1.78285 8.15445 1.78285 7.64223 2.16121L1.39661 6.77459C0.581523 7.37669 0.581523 8.62308 1.39661 9.22518L7.64223 13.8386C8.15445 14.217 8.84471 14.217 9.35693 13.8386L15.6025 9.22518Z"
          fill="currentColor"
        />
      </g>
      <g clipPath="url(#clip1_173_729)">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M39.6025 9.22518C40.4176 8.62308 40.4176 7.37669 39.6025 6.77459L33.3569 2.16121C32.8447 1.78285 32.1545 1.78285 31.6422 2.16121L25.3966 6.77459C24.5815 7.37669 24.5815 8.62308 25.3966 9.22518L31.6422 13.8386C32.1545 14.217 32.8447 14.217 33.3569 13.8386L39.6025 9.22518Z"
          fill="currentColor"
        />
      </g>
      <g clipPath="url(#clip2_173_729)">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M63.6025 9.22518C64.4176 8.62308 64.4176 7.37669 63.6025 6.77459L57.3569 2.16121C56.8447 1.78285 56.1545 1.78285 55.6422 2.16121L49.3966 6.77459C48.5815 7.37669 48.5815 8.62308 49.3966 9.22518L55.6422 13.8386C56.1545 14.217 56.8447 14.217 57.3569 13.8386L63.6025 9.22518Z"
          fill="currentColor"
        />
      </g>
      <defs>
        <clipPath id="clip0_173_729">
          <rect width="16" height="16" fill="white" transform="matrix(0 1 -1 0 16.5 0)" />
        </clipPath>
        <clipPath id="clip1_173_729">
          <rect width="16" height="16" fill="white" transform="matrix(0 1 -1 0 40.5 0)" />
        </clipPath>
        <clipPath id="clip2_173_729">
          <rect width="16" height="16" fill="white" transform="matrix(0 1 -1 0 64.5 0)" />
        </clipPath>
      </defs>
    </svg>
  </Box>
);

// Menu item component
const MenuItem = ({
  title,
  onClick
}: {
  title: string;
  onClick: () => void;
}) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    style={{ cursor: 'pointer', width: '100%' }}
  >
    <Box
      sx={{
        py: { xs: 1.5, sm: 2, lg: 2.25, xl: 2.5 },
        px: { xs: 3, sm: 4, lg: 4.5, xl: 5 },
        borderRadius: 2,
        transition: 'all 0.2s ease-in-out',
        width: '100%',
        textAlign: 'center',
        '&:hover': {
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
        },
      }}
    >
      <Typography
        variant="h6"
        sx={{
          fontWeight: 400,
          fontSize: { xs: 16, sm: 18, md: 20, lg: 22, xl: 24 },
          lineHeight: 1.5,
          letterSpacing: '5.56%',
          textTransform: 'uppercase',
          color: '#141414',
          textAlign: 'center',
        }}
      >
        {title}
      </Typography>
    </Box>
  </motion.div>
);

function PreviewDetailsContent() {
  const { wedding, isLoading, error } = useWedding();
  const router = useRouter();

  // State for section data availability
  const [hasTravelData, setHasTravelData] = useState(false);
  const [hasFAQData, setHasFAQData] = useState(false);
  const [hasEventsData, setHasEventsData] = useState(false);
  const [hasScheduleData, setHasScheduleData] = useState(false);
  const [hasRegistryData, setHasRegistryData] = useState(false);
  const [isLoadingSections, setIsLoadingSections] = useState(true);

  // Fetch data availability for each section
  useEffect(() => {
    const fetchSectionData = async () => {
      if (!wedding) {
        setIsLoadingSections(false);
        return;
      }

      try {
        setIsLoadingSections(true);
        const weddingId = wedding.id;

        // Fetch all section data in parallel
        const [travelCards, faqs, events, schedule, registry] = await Promise.all([
          weddingService.getTravelCards(weddingId),
          weddingService.getFAQs(weddingId),
          weddingService.getWeddingEvents(weddingId),
          weddingService.getWeddingSchedule(weddingId),
          weddingService.getRegistry(weddingId),
        ]);

        // Check if each section has data
        setHasTravelData(travelCards.length > 0);
        setHasFAQData(faqs.length > 0);
        setHasEventsData(events.length > 0);
        setHasScheduleData(schedule.length > 0);
        setHasRegistryData(registry.length > 0);
      } catch (error) {
        console.error('Error fetching section data:', error);
      } finally {
        setIsLoadingSections(false);
      }
    };

    if (wedding) {
      fetchSectionData();
    }
  }, [wedding]);

  if (isLoading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingSpinner message="" />
      </Box>
    );
  }

  if (error || !wedding) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography>Wedding not found or you don't have access</Typography>
      </Box>
    );
  }

  const handleBack = () => {
    router.push(`/preview/${wedding.slug}`);
  };

  const handleMenuItemClick = (item: string) => {
    // In preview mode, just show an alert that these would navigate in the real site
    alert(`In the live wedding website, this would navigate to: ${item}`);
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        backgroundImage: 'url(/images/backgrounds/pearl.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        overflow: 'hidden',
      }}
    >
      {/* Header with back button */}
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
            maxWidth: { xs: 361, md: 600, lg: 650, xl: 700 },
            px: { xs: 2, md: 3 },
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <IconButton
              onClick={handleBack}
              sx={{
                color: '#000',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                width: { xs: 40, lg: 44, xl: 48 },
                height: { xs: 40, lg: 44, xl: 48 },
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                },
                '& .MuiSvgIcon-root': {
                  fontSize: { xs: '1.5rem', lg: '1.625rem', xl: '1.75rem' },
                },
              }}
            >
              <ArrowBack />
            </IconButton>
          </Stack>
        </Container>
      </Box>

      {/* Main Content */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 1,
          pt: { xs: 10, md: 12 },
          pb: { xs: 3, md: 5 },
          overflow: 'auto',
        }}
      >
        <Container
          maxWidth={false}
          sx={{
            maxWidth: { xs: '100%', md: 600, lg: 650, xl: 700 },
            px: { xs: 2, md: 3 },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            py: 2,
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{ width: '100%' }}
          >
            <Stack spacing={{ xs: 1.5, sm: 2, md: 3 }} alignItems="center" sx={{ justifyContent: 'center' }}>
              {/* Menu Items */}
              {isLoadingSections ? (
                <Typography sx={{ color: '#141414' }}>Loading...</Typography>
              ) : (
                <Stack
                  spacing={{ xs: 1.5, sm: 2, lg: 2.25, xl: 2.5 }}
                  sx={{
                    width: '100%',
                    maxWidth: { xs: '90%', sm: 361, md: 500, lg: 550, xl: 600 },
                    alignItems: 'center',
                  }}
                >
                  {hasTravelData && (
                    <>
                      <MenuItem
                        title="Travel & Stay"
                        onClick={() => handleMenuItemClick('Travel & Stay')}
                      />
                      <DiamondDecoration />
                    </>
                  )}
                  {(hasEventsData || hasScheduleData) && (
                    <>
                      <MenuItem
                        title="Schedule & Events"
                        onClick={() => handleMenuItemClick('Schedule & Events')}
                      />
                      <DiamondDecoration />
                    </>
                  )}
                  {hasFAQData && (
                    <>
                      <MenuItem
                        title="Q & A"
                        onClick={() => handleMenuItemClick('Q & A')}
                      />
                      <DiamondDecoration />
                    </>
                  )}
                  {hasRegistryData && (
                    <>
                      <MenuItem
                        title="Registry"
                        onClick={() => handleMenuItemClick('Registry')}
                      />
                      <DiamondDecoration />
                    </>
                  )}
                  {/* Change RSVP is always shown */}
                  <MenuItem
                    title="Change RSVP"
                    onClick={() => handleMenuItemClick('Change RSVP')}
                  />
                </Stack>
              )}
            </Stack>
          </motion.div>
        </Container>
      </Box>
    </Box>
  );
}

export default function PreviewDetailsPage({ params }: { params: Promise<{ weddingSlug: string }> }) {
  const { weddingSlug } = use(params);

  return (
    <WeddingProvider weddingSlug={weddingSlug}>
      <PreviewDetailsContent />
    </WeddingProvider>
  );
}

