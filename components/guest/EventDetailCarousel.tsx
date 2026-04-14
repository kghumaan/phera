'use client';

import {
  Box,
  Typography,
  IconButton,
  Card,
  CardContent,
  Stack,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Close } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { CarouselSlide } from '@/lib/supabase/wedding-service';

// Diamond indicators component — exported for reuse in admin preview
export const DiamondIndicators = ({ total, current, activeColor = '#DE3F5E' }: { total: number; current: number; activeColor?: string }) => (
  <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
    {[...Array(total)].map((_, index) => (
      <Box
        key={index}
        sx={{
          width: 12,
          height: 12,
          position: 'relative',
          cursor: 'pointer',
        }}
      >
        <svg width="12" height="12" viewBox="0 0 11 10" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.1038 6.00065C10.6321 5.50893 10.6321 4.49105 10.1038 3.99933L6.05569 0.231742C5.7237 -0.0772472 5.2763 -0.0772472 4.94431 0.231742L0.896222 3.99933C0.367926 4.49105 0.367926 5.50893 0.896222 6.00065L4.94431 9.76823C5.2763 10.0773 5.7237 10.0773 6.05569 9.76823L10.1038 6.00065Z"
            fill={index === current ? activeColor : '#D7A393'}
          />
        </svg>
      </Box>
    ))}
  </Stack>
);

// Slide content renderer — exported for reuse in admin preview
export const SlideContent = ({
  slide,
  textColor,
  gradientBackground,
  isGradientSlide,
}: {
  slide: CarouselSlide;
  textColor: string;
  gradientBackground: string | null;
  isGradientSlide: boolean;
}) => {
  // Image slide
  if (slide.type === 'image' && slide.src) {
    return (
      <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
        <Image
          src={slide.src}
          alt={slide.title || 'Event image'}
          fill
          style={{
            objectFit: 'cover',
            borderRadius: '16px',
          }}
          sizes="(max-width: 768px) 100vw, 600px"
          priority
        />
      </Box>
    );
  }

  // Two sections slide (outfit ideas style)
  if (slide.type === 'two_sections' || slide.type === 'outfit_ideas') {
    const section1Header = slide.section1_header || 'Women';
    const section1Items = slide.section1_items || slide.women || [];
    const section2Header = slide.section2_header || 'Men';
    const section2Items = slide.section2_items || slide.men || [];

    return (
      <Stack spacing={4} alignItems="center" justifyContent="center" sx={{ position: 'relative', zIndex: 2, py: 4, height: '100%' }}>
        {/* Section 1 */}
        {section1Items.length > 0 && (
          <Box sx={{ textAlign: 'center', width: '100%' }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontSize: { xs: 14, md: 16 },
                lineHeight: 1.5,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: textColor,
                opacity: textColor === '#FFFFFF' ? 0.7 : 0.5,
                textAlign: 'center',
                mb: 2,
              }}
            >
              {section1Header}
            </Typography>

            <Stack spacing={0.5}>
              {section1Items.map((item, idx) => (
                <Typography
                  key={idx}
                  variant="h3"
                  sx={{
                    fontSize: { xs: 24, md: 32, lg: 36 },
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

        {/* Section 2 */}
        {section2Items.length > 0 && (
          <Box sx={{ textAlign: 'center', width: '100%', mt: 4 }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontSize: { xs: 14, md: 16 },
                lineHeight: 1.5,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: textColor,
                opacity: textColor === '#FFFFFF' ? 0.7 : 0.5,
                textAlign: 'center',
                mb: 2,
              }}
            >
              {section2Header}
            </Typography>

            <Stack spacing={0.5}>
              {section2Items.map((item, idx) => (
                <Typography
                  key={idx}
                  variant="h3"
                  sx={{
                    fontSize: { xs: 24, md: 32, lg: 36 },
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
    );
  }

  // Three lines slide (celebration header style)
  if (slide.type === 'three_lines') {
    return (
      <Stack spacing={3} alignItems="center" justifyContent="center" sx={{ position: 'relative', zIndex: 2, py: 4, height: '100%' }}>
        {/* Top Label */}
        {slide.top_label && (
          <Typography
            variant="subtitleCaps"
            sx={{
              fontSize: { xs: 14, md: 16 },
              lineHeight: 1.5,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: textColor,
              opacity: textColor === '#FFFFFF' ? 0.7 : 0.5,
              textAlign: 'center',
            }}
          >
            {slide.top_label}
          </Typography>
        )}

        {/* Main Heading */}
        {slide.main_heading && (
          <Typography
            variant="h2"
            sx={{
              fontFamily: 'var(--font-instrument-serif)',
              fontWeight: 400,
              fontSize: { xs: 36, md: 48, lg: 56 },
              lineHeight: 1.2,
              color: textColor,
              textAlign: 'center',
              fontStyle: 'italic',
            }}
          >
            {slide.main_heading}
          </Typography>
        )}

        {/* Body Text */}
        {slide.body_text && (
          <Typography
            variant="body1"
            sx={{
              fontSize: { xs: 16, md: 20, lg: 22 },
              lineHeight: 1.6,
              color: textColor,
              textAlign: 'center',
              maxWidth: 400,
              px: 2,
            }}
          >
            {slide.body_text}
          </Typography>
        )}
      </Stack>
    );
  }

  // Default: dress_code or ritual style (subtitle, heading, description)
  return (
    <Stack spacing={3} alignItems="center" justifyContent="center" sx={{ position: 'relative', zIndex: 2, py: 4, height: '100%' }}>
      {slide.subtitle && (
        <Typography
          variant="subtitle2"
          sx={{
            fontSize: { xs: 14, md: 16 },
            lineHeight: 1.5,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: textColor,
            opacity: textColor === '#FFFFFF' ? 0.7 : 0.5,
            textAlign: 'center',
          }}
        >
          {slide.subtitle}
        </Typography>
      )}

      {slide.heading && (
        <Typography
          variant="h2"
          sx={{
            fontFamily: 'var(--font-instrument-serif)',
            fontWeight: 400,
            fontSize: { xs: 32, md: 40, lg: 48 },
            lineHeight: 1.3,
            textTransform: 'capitalize',
            color: textColor,
            textAlign: 'center',
            fontStyle: 'italic',
          }}
        >
          {slide.heading}
        </Typography>
      )}

      {slide.description && (
        <Typography
          variant="body1"
          sx={{
            fontWeight: 300,
            fontSize: { xs: 14, md: 16 },
            lineHeight: 1.6,
            color: textColor,
            textAlign: 'center',
            maxWidth: 320,
            px: 2,
          }}
        >
          {slide.description}
        </Typography>
      )}
    </Stack>
  );
};

interface EventDetailCarouselProps {
  eventName: string;
  slides: CarouselSlide[];
  textColor: string;
  gradientBackground: string | null;
  onClose: () => void;
  primaryColor?: string;
}

export default function EventDetailCarousel({
  eventName,
  slides,
  textColor,
  gradientBackground,
  onClose,
  primaryColor,
}: EventDetailCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = slides.length;

  // Reset to first slide when event changes
  useEffect(() => {
    setCurrentSlide(0);
  }, [eventName, slides]);

  const handleNextSlide = () => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const handlePrevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  if (slides.length === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 100 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{
          position: 'fixed',
          right: 0,
          top: 0,
          width: '45%',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '16px',
          zIndex: 10,
        }}
      >
        {/* Close Button */}
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: 24,
            right: 24,
            backgroundColor: 'rgba(254, 249, 242, 0.9)',
            color: '#000',
            zIndex: 20,
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 1)',
            },
          }}
        >
          <Close />
        </IconButton>

        {/* Event Name Header */}
        <Typography
          variant="h6"
          sx={{
            fontSize: 14,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: '#000',
            mb: 3,
            textAlign: 'center',
          }}
        >
          {eventName}
        </Typography>

        {/* Carousel Card */}
        <Card
          sx={{
            width: '100%',
            maxWidth: 380,
            height: '75vh',
            maxHeight: 750,
            backgroundColor: 'transparent',
            borderRadius: '24px',
            boxShadow: '0px 0px 32px 0px rgba(0, 0, 0, 0.16)',
            border: '2px solid #FEF9F2',
            overflow: 'hidden',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            backgroundImage: gradientBackground
              ? `url(/images/backgrounds/${gradientBackground})`
              : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        >
          <CardContent
            sx={{
              p: slides[currentSlide]?.type === 'image' ? 0 : { xs: 3, md: 4 },
              '&:last-child': { pb: slides[currentSlide]?.type === 'image' ? 0 : undefined },
              flexGrow: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
              position: 'relative',
              zIndex: 1,
              height: '100%',
            }}
          >
            <SlideContent
              slide={slides[currentSlide]}
              textColor={textColor}
              gradientBackground={gradientBackground}
              isGradientSlide={currentSlide % 2 === 0}
            />
          </CardContent>
        </Card>

        {/* Navigation */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 3,
            mt: 3,
          }}
        >
          <IconButton
            onClick={handlePrevSlide}
            disabled={currentSlide === 0}
            sx={{
              width: 48,
              height: 48,
              backgroundColor: 'rgba(254, 249, 242, 0.9)',
              color: '#000',
              '&:hover': {
                backgroundColor: '#FEF9F2',
              },
              '&:disabled': {
                backgroundColor: 'rgba(254, 249, 242, 0.3)',
                color: 'rgba(0, 0, 0, 0.3)',
              },
            }}
          >
            <ChevronLeft sx={{ fontSize: 28 }} />
          </IconButton>

          <IconButton
            onClick={handleNextSlide}
            disabled={currentSlide === totalSlides - 1}
            sx={{
              width: 48,
              height: 48,
              backgroundColor: 'rgba(254, 249, 242, 0.9)',
              color: '#000',
              '&:hover': {
                backgroundColor: '#FEF9F2',
              },
              '&:disabled': {
                backgroundColor: 'rgba(254, 249, 242, 0.3)',
                color: 'rgba(0, 0, 0, 0.3)',
              },
            }}
          >
            <ChevronRight sx={{ fontSize: 28 }} />
          </IconButton>
        </Box>

        {/* Diamond Indicators */}
        <Box sx={{ mt: 3 }}>
          <DiamondIndicators total={totalSlides} current={currentSlide} activeColor={primaryColor} />
        </Box>
      </motion.div>
    </AnimatePresence>
  );
}
