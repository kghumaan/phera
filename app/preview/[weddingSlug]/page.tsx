'use client';

import { use } from 'react';
import { Box, Container, Typography, Button, Stack } from '@mui/material';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { WeddingProvider, useWedding } from '@/lib/contexts/WeddingContext';
import OptimizedBackground from '@/components/ui/OptimizedBackground';
import ReadOnlyComments from '@/components/preview/ReadOnlyComments';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

// Countdown hook
const useCountdown = (targetDate: string) => {
  const [timeLeft, setTimeLeft] = useState({
    months: 0,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(targetDate).getTime() - new Date().getTime();

      if (difference > 0) {
        const months = Math.floor(difference / (1000 * 60 * 60 * 24 * 30.44));
        const days = Math.floor((difference % (1000 * 60 * 60 * 24 * 30.44)) / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({
          months,
          days,
          hours,
          minutes,
          seconds
        });
      } else {
        setTimeLeft({ months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return timeLeft;
};

// Countdown component
const CountdownTimer = ({ targetDate }: { targetDate: string }) => {
  const timeLeft = useCountdown(targetDate);

  const timeUnits = [
    { label: 'months', value: timeLeft.months },
    { label: 'days', value: timeLeft.days },
    { label: 'hours', value: timeLeft.hours },
    { label: 'mins', value: timeLeft.minutes },
    { label: 'secs', value: timeLeft.seconds }
  ];

  return (
    <Box
      sx={{
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        px: { xs: 4, lg: 4.25, xl: 4.5 },
        py: { xs: 1.5, lg: 1.625, xl: 1.75 },
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: { xs: 400, lg: 420, xl: 440 },
      }}
    >
      <Stack
        direction="row"
        spacing={{ xs: 3, lg: 3.5, xl: 4 }}
        justifyContent="center"
        alignItems="center"
      >
        {timeUnits.map((unit) => (
          <Stack
            key={unit.label}
            alignItems="center"
            spacing={0}
            sx={{
              minWidth: { xs: 35, sm: 40, lg: 45, xl: 50 },
            }}
          >
            <Typography
              variant="h4"
              sx={{
                fontWeight: 400,
                color: '#000000',
                fontSize: { xs: '1.5rem', sm: '1.5rem', lg: '1.75rem', xl: '2rem' },
                lineHeight: 1.2,
                fontFamily: 'Outfit, sans-serif',
              }}
            >
              {unit.value}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: '#000000',
                fontWeight: 400,
                fontSize: { xs: '0.85rem', sm: '0.75rem', lg: '0.85rem', xl: '0.9rem' },
                lineHeight: 1.4,
                fontFamily: 'Outfit, sans-serif',
                textAlign: 'center',
              }}
            >
              {unit.label}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
};

// Couple Image Component with uploaded images support
const CoupleImageDisplay = ({
  coupleImageUrl,
  frameImageUrl
}: {
  coupleImageUrl: string | null;
  frameImageUrl: string | null;
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

  // Use uploaded image or fallback to default couple images
  const coupleImages = coupleImageUrl
    ? [coupleImageUrl]
    : [
      '/images/couple/couple-1.jpg',
      '/images/couple/couple-2.jpg',
      '/images/couple/couple-3.jpeg',
    ];

  const frameImage = frameImageUrl || '/images/frames/frame-27.png';

  const advanceToNextImage = () => {
    if (coupleImages.length <= 1) return; // Don't cycle if only one image

    setIsTransitioning(true);

    setTimeout(() => {
      setCurrentImageIndex((prev) => (prev + 1) % coupleImages.length);
      setIsTransitioning(false);
    }, 300);
  };

  const handleImageClick = () => {
    if (coupleImages.length <= 1) return;

    if (intervalId) {
      clearInterval(intervalId);
    }

    advanceToNextImage();

    const newInterval = setInterval(() => {
      advanceToNextImage();
    }, 4000);

    setIntervalId(newInterval);
  };

  useEffect(() => {
    if (coupleImages.length <= 1) return;

    const interval = setInterval(() => {
      advanceToNextImage();
    }, 4000);

    setIntervalId(interval);
    return () => clearInterval(interval);
  }, [coupleImages.length]);

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        maxWidth: { xs: 320, lg: 340, xl: 360 },
        aspectRatio: '1',
        mx: 'auto',
        mb: 2,
        cursor: coupleImages.length > 1 ? 'pointer' : 'default',
        transition: 'transform 0.2s ease-in-out',
        '&:hover': {
          transform: coupleImages.length > 1 ? 'scale(1.02)' : 'none',
        },
        '&:active': {
          transform: coupleImages.length > 1 ? 'scale(0.98)' : 'none',
        },
      }}
      onClick={handleImageClick}
    >
      {/* Frame Background */}
      <Image
        src={frameImage}
        alt="Decorative frame"
        fill
        priority
        sizes="(max-width: 768px) 320px, 400px"
        style={{
          objectFit: 'contain',
          objectPosition: 'center',
          zIndex: 1,
        }}
      />

      {/* Couple Image */}
      <Box
        sx={{
          position: 'absolute',
          top: '7%',
          left: '7%',
          width: '87%',
          height: '87%',
          overflow: 'hidden',
          zIndex: 2,
        }}
      >
        <Image
          src={coupleImages[currentImageIndex]}
          alt="Couple Photo"
          fill
          priority
          sizes="(max-width: 768px) 320px, 400px"
          style={{
            objectFit: 'cover',
            objectPosition: 'center',
            transition: 'filter 0.6s ease-in-out',
            filter: isTransitioning ? 'blur(5px)' : 'blur(0px)',
          }}
        />
      </Box>
    </Box>
  );
};

function PreviewContent() {
  const { wedding, isLoading, error } = useWedding();

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

  return (
    <OptimizedBackground
      src={wedding.background_image}
      useAppDefault={!wedding.background_image}
      className="min-h-screen flex flex-col"
    >
      {/* Desktop Layout (lg and above) */}
      <Box
        sx={{
          display: { xs: 'none', lg: 'flex' },
          flexDirection: 'row',
          minHeight: '100vh',
          position: 'relative',
        }}
      >
        {/* Left Side: Sticky Image */}
        <Box
          sx={{
            flex: '0 0 50%',
            height: '100vh',
            position: 'sticky',
            top: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 4,
          }}
        >
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            style={{ width: '100%', maxWidth: '500px' }}
          >
            <CoupleImageDisplay
              coupleImageUrl={wedding.couple_image_url}
              frameImageUrl={wedding.frame_image_url}
            />
          </motion.div>
        </Box>

        {/* Right Side: Scrollable Details */}
        <Box
          sx={{
            flex: '0 0 50%',
            p: 6,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            zIndex: 2,
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Stack spacing={4} alignItems="center" textAlign="center">
              <Stack spacing={1}>
                {/* Date */}
                <Typography
                  variant="body2"
                  sx={{
                    color: '#000',
                    fontSize: '1.25rem',
                    letterSpacing: '0.5px',
                  }}
                >
                  {wedding.wedding_date_display}
                </Typography>

                {/* Names */}
                <Typography
                  variant="h2"
                  sx={{
                    fontSize: '4rem',
                    color: '#000',
                    lineHeight: 1.1,
                    fontFamily: 'var(--font-instrument-serif)',
                    fontStyle: 'italic',
                  }}
                >
                  {wedding.couple_name}
                </Typography>
              </Stack>

              {/* Venue */}
              <Box
                onClick={() => {
                  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(wedding.venue_location)}`;
                  window.open(mapsUrl, '_blank');
                }}
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  borderRadius: 2,
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    transform: 'translateY(-1px)',
                  },
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1} justifyContent="center">
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#000',
                      fontSize: '1.4rem',
                      textDecoration: 'underline',
                    }}
                  >
                    {wedding.venue_location}
                  </Typography>
                  {wedding.venue_flag && (
                    <Typography sx={{ fontSize: '1.5rem' }}>
                      {wedding.venue_flag}
                    </Typography>
                  )}
                </Stack>
              </Box>

              {/* Countdown Timer */}
              <CountdownTimer targetDate={wedding.wedding_date} />

              {/* Comments Section */}
              <Box sx={{ width: '100%', mt: 4 }}>
                <ReadOnlyComments />
              </Box>

              {/* View Details Button */}
              <Button
                component={Link}
                href={`/preview/${wedding.slug}/details`}
                variant="contained"
                size="large"
                sx={{
                  backgroundColor: wedding.primary_color || '#DE3F5E',
                  color: 'white',
                  px: 8,
                  py: 2,
                  fontSize: '1.125rem',
                  fontWeight: 700,
                  borderRadius: '16px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  fontFamily: 'Outfit',
                  '&:hover': {
                    backgroundColor: wedding.primary_color || '#C8365A',
                    opacity: 0.9,
                  },
                }}
              >
                View Details
              </Button>
            </Stack>
          </motion.div>
        </Box>
      </Box>

      {/* Mobile/Tablet Layout (xs to md) */}
      <Box sx={{ display: { xs: 'block', lg: 'none' } }}>
        <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 2 }}>
          <Box sx={{ pt: 4, pb: 4 }}>
            {/* Couple Photo Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <CoupleImageDisplay
                coupleImageUrl={wedding.couple_image_url}
                frameImageUrl={wedding.frame_image_url}
              />
            </motion.div>

            {/* Wedding Details Section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <Stack spacing={1} alignItems="center" textAlign="center">
                {/* Date */}
                <Typography
                  variant="body2"
                  sx={{
                    color: '#000',
                    fontSize: { xs: '1rem', lg: '1.125rem', xl: '1.25rem' },
                    letterSpacing: '0.5px',
                  }}
                >
                  {wedding.wedding_date_display}
                </Typography>

                {/* Names */}
                <Typography
                  variant="h2"
                  sx={{
                    fontSize: { xs: '2.5rem', sm: '3rem', lg: '3.25rem', xl: '3.5rem' },
                    color: '#000',
                    lineHeight: 1.2,
                    fontFamily: 'var(--font-instrument-serif)',
                    fontStyle: 'italic',
                  }}
                >
                  {wedding.couple_name}
                </Typography>

                {/* Venue */}
                <Box
                  onClick={() => {
                    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(wedding.venue_location)}`;
                    window.open(mapsUrl, '_blank');
                  }}
                  sx={{
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    borderRadius: 2,
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    },
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1} justifyContent="center" mb={2}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#000',
                        fontSize: { xs: '1.1rem', lg: '1.2rem', xl: '1.3rem' },
                        textDecoration: 'underline',
                      }}
                    >
                      {wedding.venue_location}
                    </Typography>
                    {wedding.venue_flag && (
                      <Typography sx={{ fontSize: { xs: '1.2rem', lg: '1.3rem', xl: '1.4rem' } }}>
                        {wedding.venue_flag}
                      </Typography>
                    )}
                  </Stack>
                </Box>

                {/* Countdown Timer */}
                <CountdownTimer targetDate={wedding.wedding_date} />
              </Stack>
            </motion.div>
          </Box>
        </Container>

        {/* Wedding Community Section - Comments */}
        <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 2, pb: 4 }}>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, margin: '-100px' }}
          >
            <ReadOnlyComments />
          </motion.div>
        </Container>

        {/* View Details Button - Sticky Footer (Mobile Only) */}
        <Box
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 4,
            backgroundColor: 'rgba(255, 255, 255, 0.4)',
            backdropFilter: 'blur(4px)',
            borderTop: '1px solid rgba(0, 0, 0, 0.1)',
            px: 2,
            py: 2,
            boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.1)',
          }}
        >
          <Container maxWidth="sm">
            <Stack spacing={1} alignItems="center">
              <Button
                component={Link}
                href={`/preview/${wedding.slug}/details`}
                variant="contained"
                size="large"
                fullWidth
                sx={{
                  backgroundColor: wedding.primary_color || '#DE3F5E',
                  color: 'white',
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 700,
                  borderRadius: '16px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  fontFamily: 'Outfit',
                  '&:hover': {
                    backgroundColor: wedding.primary_color || '#C8365A',
                  },
                }}
              >
                View Details
              </Button>
            </Stack>
          </Container>
        </Box>
        <Box sx={{ height: 100 }} />
      </Box>
    </OptimizedBackground>
  );
}

export default function PreviewPage({ params }: { params: Promise<{ weddingSlug: string }> }) {
  const { weddingSlug } = use(params);

  return (
    <WeddingProvider weddingSlug={weddingSlug}>
      <PreviewContent />
    </WeddingProvider>
  );
}

