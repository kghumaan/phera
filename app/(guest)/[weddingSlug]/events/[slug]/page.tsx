'use client';

import {
  Box,
  Container,
  Typography,
  IconButton,
  Card,
  CardContent,
  Stack,
  useTheme,
  useMediaQuery,
  CircularProgress,
} from '@mui/material';
import { motion } from 'framer-motion';
import { useRouter, useParams } from 'next/navigation';
import { ArrowBack, ChevronLeft, ChevronRight } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import OptimizedBackground from '@/components/ui/OptimizedBackground';
import AppHeader from '@/components/shared/AppHeader';
import { WeddingEvent, CarouselSlide } from '@/lib/supabase/wedding-service';
import { useWedding } from '@/lib/contexts/WeddingContext';

// Diamond indicators component
const DiamondIndicators = ({ total, current }: { total: number; current: number }) => (
  <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
    {[...Array(total)].map((_, index) => (
      <Box
        key={index}
        sx={{
          width: 12,
          height: 12,
          position: 'relative',
        }}
      >
        <svg width="12" height="12" viewBox="0 0 11 10" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.1038 6.00065C10.6321 5.50893 10.6321 4.49105 10.1038 3.99933L6.05569 0.231742C5.7237 -0.0772472 5.2763 -0.0772472 4.94431 0.231742L0.896222 3.99933C0.367926 4.49105 0.367926 5.50893 0.896222 6.00065L4.94431 9.76823C5.2763 10.0773 5.7237 10.0773 6.05569 9.76823L10.1038 6.00065Z"
            fill={index === current ? '#DE3F5E' : '#D7A393'}
          />
        </svg>
      </Box>
    ))}
  </Stack>
);

// Event card component
const EventCard = ({
  slide,
  isActive,
  index,
  textColor,
  gradientBackground,
}: {
  slide: CarouselSlide;
  isActive: boolean;
  index: number;
  textColor: string;
  gradientBackground: string | null;
}) => {
  const isGradientSlide = index % 2 === 0;
  const isImageSlide = slide.type === 'image';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{
        opacity: isActive ? 1 : 0.3,
        scale: isActive ? 1 : 0.9,
      }}
      transition={{ duration: 0.3 }}
      style={{
        width: '100vw',
        maxWidth: '100%',
        height: '70vh',
        minHeight: '500px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '0 16px',
      }}
    >
      <Card
        sx={{
          width: '100%',
          maxWidth: { xs: 361, md: 600, lg: 700 },
          height: { xs: '100%', md: '96vh', lg: '96vh' },
          backgroundColor: isGradientSlide ? 'transparent' : isImageSlide ? '#FFFFFF' : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: isGradientSlide ? 'none' : isImageSlide ? 'none' : 'blur(10px)',
          borderRadius: '16px',
          boxShadow: '0px 0px 32px 0px rgba(0, 0, 0, 0.16)',
          border: isGradientSlide || isImageSlide ? '2px solid #FFFFFF' : 'none',
          overflow: 'hidden',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          backgroundImage: isGradientSlide && gradientBackground
            ? `url(/images/backgrounds/${gradientBackground})`
            : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <CardContent
          sx={{
            p: isImageSlide ? 0 : { xs: 3, md: 4, lg: 5 },
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {isImageSlide && slide.src ? (
            <Image
              src={slide.src}
              alt={slide.title || 'Event image'}
              fill
              style={{
                objectFit: 'cover',
                borderRadius: '16px',
              }}
              sizes="(max-width: 768px) 100vw, 361px"
              priority={isActive}
            />
          ) : slide.type === 'dress_code' ? (
            <Stack spacing={3} alignItems="center" sx={{ position: 'relative', zIndex: 2 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 600,
                  fontSize: 16,
                  lineHeight: 1.5,
                  letterSpacing: '0.0625em',
                  textTransform: 'uppercase',
                  color: textColor,
                  opacity: textColor === '#FFFFFF' ? 0.7 : 0.4,
                  textAlign: 'center',
                }}
              >
                {slide.subtitle}
              </Typography>

              <Typography
                variant="h2"
                sx={{
                  fontSize: 40,
                  lineHeight: 1.3,
                  textTransform: 'capitalize',
                  color: textColor,
                  textAlign: 'center',
                  mb: 1,
                }}
              >
                {slide.heading}
              </Typography>

              <Typography
                variant="body1"
                sx={{
                  fontWeight: 300,
                  fontSize: 16,
                  lineHeight: 1.5,
                  color: textColor,
                  textAlign: 'center',
                  maxWidth: 281,
                  px: 2,
                }}
              >
                {slide.description}
              </Typography>
            </Stack>
          ) : slide.type === 'outfit_ideas' ? (
            <Stack spacing={4} alignItems="center" sx={{ position: 'relative', zIndex: 2 }}>
              {/* Women Section */}
              {slide.women && slide.women.length > 0 && (
                <Box sx={{ textAlign: 'center', width: '100%' }}>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 600,
                      fontSize: { xs: 16, md: 18, lg: 20 },
                      lineHeight: 1.5,
                      letterSpacing: '0.0625em',
                      textTransform: 'uppercase',
                      color: textColor,
                      opacity: textColor === '#FFFFFF' ? 0.7 : 0.4,
                      textAlign: 'center',
                      mb: 2,
                    }}
                  >
                    Women
                  </Typography>

                  <Stack spacing={1} sx={{ mb: 3 }}>
                    {slide.women.map((item) => (
                      <Typography
                        key={item}
                        variant="h3"
                        sx={{
                          fontSize: { xs: 28, md: 34, lg: 38 },
                          lineHeight: 1.3,
                          textTransform: 'capitalize',
                          color: textColor,
                          textAlign: 'center',
                        }}
                      >
                        {item}
                      </Typography>
                    ))}
                  </Stack>
                </Box>
              )}

              {/* Men Section */}
              {slide.men && slide.men.length > 0 && (
                <Box sx={{ textAlign: 'center', width: '100%' }}>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 600,
                      fontSize: { xs: 16, md: 18, lg: 20 },
                      lineHeight: 1.5,
                      letterSpacing: '0.0625em',
                      textTransform: 'uppercase',
                      color: textColor,
                      opacity: textColor === '#FFFFFF' ? 0.7 : 0.4,
                      textAlign: 'center',
                      mb: 2,
                    }}
                  >
                    Men
                  </Typography>

                  <Stack spacing={1}>
                    {slide.men.map((item) => (
                      <Typography
                        key={item}
                        variant="h3"
                        sx={{
                          fontSize: { xs: 28, md: 34, lg: 38 },
                          lineHeight: 1.3,
                          textTransform: 'capitalize',
                          color: textColor,
                          textAlign: 'center',
                        }}
                      >
                        {item}
                      </Typography>
                    ))}
                  </Stack>
                </Box>
              )}
            </Stack>
          ) : slide.type === 'ritual' ? (
            <Stack spacing={3} alignItems="center" sx={{ position: 'relative', zIndex: 2 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 600,
                  fontSize: 16,
                  lineHeight: 1.5,
                  letterSpacing: '0.0625em',
                  textTransform: 'uppercase',
                  color: textColor,
                  opacity: textColor === '#FFFFFF' ? 0.7 : 0.4,
                  textAlign: 'center',
                }}
              >
                {slide.subtitle}
              </Typography>

              <Typography
                variant="h2"
                sx={{
                  fontSize: 40,
                  lineHeight: 1.3,
                  textTransform: 'capitalize',
                  color: textColor,
                  textAlign: 'center',
                  mb: 1,
                }}
              >
                {slide.heading}
              </Typography>

              <Typography
                variant="body1"
                sx={{
                  fontWeight: 300,
                  fontSize: 16,
                  lineHeight: 1.5,
                  color: textColor,
                  textAlign: 'center',
                  maxWidth: 281,
                  px: 2,
                }}
              >
                {slide.description}
              </Typography>
            </Stack>
          ) : null}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default function EventDetailPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const router = useRouter();
  const params = useParams();
  const weddingSlug = params.weddingSlug as string;
  const eventSlug = params.slug as string;

  const [currentSlide, setCurrentSlide] = useState(0);

  // Use WeddingContext to get events (already loaded)
  const { events, isLoading: loading, error: contextError } = useWedding();

  // Find the event by slug from the context
  const event = events.find(e => e.slug === eventSlug) || null;
  const error = !event && !loading ? 'Event not found' : contextError;

  // Disable scrolling when component mounts
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  const handleNextSlide = () => {
    if (event && currentSlide < event.carousel_slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const handlePrevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  // Only show loading if we're loading AND we don't have the event yet
  if (loading && !event) {
    return (
      <OptimizedBackground
        src="/images/backgrounds/aquarium.png"
        alt="Background"
        priority={true}
      >
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <CircularProgress sx={{ color: '#DE3F5E' }} />
        </Box>
      </OptimizedBackground>
    );
  }

  if (error || !event) {
    return (
      <OptimizedBackground
        src="/images/backgrounds/aquarium.png"
        alt="Background"
        priority={true}
      >
        <Container>
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="error" gutterBottom>
              {error || 'Event not found'}
            </Typography>
            <IconButton onClick={() => router.push(`/${weddingSlug}/events`)} sx={{ mt: 2 }}>
              <ArrowBack /> Back to Events
            </IconButton>
          </Box>
        </Container>
      </OptimizedBackground>
    );
  }

  const slides = event.carousel_slides || [];
  const totalSlides = slides.length;

  return (
    <OptimizedBackground
      src="/images/backgrounds/aquarium.png"
      alt="Aquarium Background"
      priority={true}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100svh',
          overflow: 'hidden',
          touchAction: 'pan-x',
        }}
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
              backHref={`/${weddingSlug}/events`}
            />
          </Box>
        )}

        {/* Mobile Header */}
        {isMobile && (
          <Box
            sx={{
              position: 'relative',
              zIndex: 2,
              pt: 2,
              pb: 2,
              flexShrink: 0,
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
                  onClick={() => router.push(`/${weddingSlug}/events`)}
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
                    fontWeight: 400,
                    fontSize: 18,
                    lineHeight: 1.5,
                    letterSpacing: '5.56%',
                    textTransform: 'uppercase',
                    color: '#141414',
                  }}
                >
                  {event.name}
                </Typography>
                <Box sx={{ width: 48 }} /> {/* Spacer */}
              </Stack>
            </Container>
          </Box>
        )}

        {/* Main carousel content */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
            pt: { xs: 0, md: 10 }, // Add top padding for desktop fixed header
          }}
        >
          {/* Slides */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
            }}
          >
            {slides.map((slide, index) => (
              <Box
                key={index}
                sx={{
                  display: index === currentSlide ? 'flex' : 'none',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  height: '100%',
                }}
              >
                <EventCard
                  slide={slide}
                  isActive={index === currentSlide}
                  index={index}
                  textColor={event.text_color}
                  gradientBackground={event.gradient_background}
                />
              </Box>
            ))}
          </Box>
        </Box>

        {/* Navigation Arrows - Now below carousel */}
        <Box
          sx={{
            position: 'relative',
            zIndex: 2,
            py: 3,
            flexShrink: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 3,
          }}
        >
          <IconButton
            onClick={handlePrevSlide}
            disabled={currentSlide === 0}
            sx={{
              width: 48,
              height: 48,
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              color: '#000',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 1)',
              },
              '&:disabled': {
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                color: 'rgba(0, 0, 0, 0.3)',
              },
            }}
          >
            <ChevronLeft sx={{ fontSize: 32 }} />
          </IconButton>

          <IconButton
            onClick={handleNextSlide}
            disabled={currentSlide === totalSlides - 1}
            sx={{
              width: 48,
              height: 48,
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              color: '#000',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 1)',
              },
              '&:disabled': {
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                color: 'rgba(0, 0, 0, 0.3)',
              },
            }}
          >
            <ChevronRight sx={{ fontSize: 32 }} />
          </IconButton>
        </Box>

        {/* Diamond indicators at bottom */}
        <Box
          sx={{
            position: 'relative',
            zIndex: 2,
            py: 3,
            flexShrink: 0,
          }}
        >
          <DiamondIndicators total={totalSlides} current={currentSlide} />
        </Box>
      </Box>
    </OptimizedBackground>
  );
}
