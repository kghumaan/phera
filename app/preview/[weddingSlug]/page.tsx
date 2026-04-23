'use client';

import { use, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Box, Container, Typography, Button, Stack, useTheme, useMediaQuery, ListItemIcon, ListItemText } from '@mui/material';
import { PheraMenu, PheraMenuItem } from '@/components/shared/Menu';
import { Visibility, Lock, PersonOff, HowToReg } from '@mui/icons-material';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { WeddingProvider, useWedding } from '@/lib/contexts/WeddingContext';
import OptimizedBackground from '@/components/ui/OptimizedBackground';
import ReadOnlyComments from '@/components/preview/ReadOnlyComments';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import PinEntry from '@/components/guest/PinEntry';
import VerticalScrollLayout from '@/components/guest/VerticalScrollLayout';
import { getFrameConfig } from '@/lib/constants/images';
import { getCoupleFont } from '@/lib/constants/fonts';
import { COLORS, RADII } from '@/lib/theme/tokens';

const formatDeadline = (d: string) => { try { return format(parseISO(d), 'MMMM d, yyyy'); } catch { return d; } };

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

  // Hide countdown when date is TBD (epoch sentinel)
  if (new Date(targetDate).getTime() === 0) return null;

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
        backgroundColor: COLORS.bg.white,
        borderRadius: 8, // 64px from Figma converted to MUI scale
        px: { xs: 3, sm: 4, md: 5, lg: 5.5, xl: 6 }, // slightly less padding on mobile to fit 340px, reduced on lg/xl for overflow
        py: { xs: 1.5, sm: 1.75, md: 2, lg: 2.5, xl: 3 },
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: { xs: 340, md: '100%' }, // Match comments block width on mobile
      }}
    >
      <Stack
        direction="row"
        spacing={{ xs: 3, sm: 3.5, md: 3.5, lg: 4, xl: 5 }}
        justifyContent="center"
        alignItems="center"
      >
        {timeUnits.map((unit) => (
          <Stack
            key={unit.label}
            alignItems="center"
            spacing={0}
            sx={{
              minWidth: { xs: 35, sm: 40, md: 45, lg: 55, xl: 65 }, // Smoother progression
            }}
          >
            <Typography
              variant="h4"
              sx={{
                fontWeight: 400, // Regular weight like in Figma
                color: COLORS.text.strong,
                // Smoother font size progression to prevent overflow on small desktop
                fontSize: {
                  xs: '1.25rem',  // Scaled down to fit smaller 340px container
                  sm: '1.5rem',   // 600px+ (large mobile)
                  md: '1.75rem',  // 900px+ (small desktop)
                  lg: '2.25rem',  // 1200px+ (desktop)
                  xl: '2.75rem'   // 1536px+ (large desktop)
                },
                lineHeight: 1.2,
                // Match Figma font
              }}
            >
              {unit.value}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: COLORS.text.strong,
                fontWeight: 400,
                fontSize: { xs: '0.75rem', sm: '0.75rem', lg: '0.85rem', xl: '0.9rem' },
                lineHeight: 1.4,
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
  coupleImages: coupleImagesProp,
  frameImageUrl
}: {
  coupleImages: string[];
  frameImageUrl: string | null;
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

  // Use uploaded images or fallback to default couple images
  const coupleImages = coupleImagesProp.length > 0
    ? coupleImagesProp
    : [
      '/images/couple/couple-1.jpg',
      '/images/couple/couple-2.jpg',
      '/images/couple/couple-3.jpeg',
    ];

  const frameImage = frameImageUrl || '/images/frames/frame-1.png';

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
    }, 3000);

    setIntervalId(newInterval);
  };

  useEffect(() => {
    if (coupleImages.length <= 1) return;

    const interval = setInterval(() => {
      advanceToNextImage();
    }, 3000);

    setIntervalId(interval);
    return () => clearInterval(interval);
  }, [coupleImages.length]);

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        maxWidth: { xs: 320, sm: 340, md: '100%' },
        mx: 'auto',
        mb: 2,
        aspectRatio: '1',
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
      {/* Couple Image */}
      <Box
        sx={{
          position: 'absolute',
          ...getFrameConfig(frameImage),
          overflow: 'hidden',
          zIndex: 1,
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
          zIndex: 3,
          pointerEvents: 'none',
        }}
      />
    </Box>
  );
};

type PreviewView = 'pin_entry' | 'no_rsvp' | 'rsvp_submitted';

const PREVIEW_VIEW_OPTIONS: { value: PreviewView; label: string; icon: React.ReactNode }[] = [
  { value: 'pin_entry', label: 'Pin Entry Screen', icon: <Lock fontSize="small" /> },
  { value: 'no_rsvp', label: 'No RSVP Submitted', icon: <PersonOff fontSize="small" /> },
  { value: 'rsvp_submitted', label: 'RSVP Submitted', icon: <HowToReg fontSize="small" /> },
];

function PreviewContent() {
  const { wedding, isLoading, error } = useWedding();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const headerRef = useRef<HTMLDivElement>(null);
  const [previewView, setPreviewView] = useState<PreviewView>('rsvp_submitted');
  const [viewMenuAnchor, setViewMenuAnchor] = useState<null | HTMLElement>(null);
  const [isInIframe, setIsInIframe] = useState(true); // default true to avoid flash
  const [showScrolledNav, setShowScrolledNav] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    const inIframe = window.self !== window.top;
    setIsInIframe(inIframe);
    // When inside an iframe, trap back-navigation so history.back() in guest
    // components (e.g. back buttons) can't escape and navigate the parent admin page
    if (inIframe) {
      window.history.replaceState({ preview: true }, '', window.location.href);
      const handlePopState = () => {
        window.history.pushState({ preview: true }, '', window.location.href);
      };
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, []);

  // Listen for SET_PREVIEW_MODE postMessage from admin panel
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SET_PREVIEW_MODE') {
        setPreviewView(event.data.mode);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Read ?view= query param for standalone "View Site" link
  useEffect(() => {
    const viewParam = searchParams.get('view');
    if (viewParam === 'pin_entry') {
      setPreviewView('pin_entry');
    }
  }, []);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollingUp = currentScrollY < lastScrollY;
      if (currentScrollY < 80) {
        setShowScrolledNav(false);
      } else if (scrollingUp) {
        setShowScrolledNav(true);
      } else {
        setShowScrolledNav(false);
      }
      lastScrollY = currentScrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Check if we should use vertical scroll layout (desktop only)
  // Normalize legacy DB values: 'infinite_scroll' → 'vertical_scroll'
  const normalizedLayout = (wedding?.website_layout === 'infinite_scroll' || wedding?.website_layout === 'vertical_scroll') ? 'vertical_scroll' : 'multi_page';
  const useVerticalScroll = !isMobile && normalizedLayout === 'vertical_scroll';

  if (isLoading) {
    return (
      <Box sx={{ minHeight: { xs: '100svh', md: '100vh' }, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingSpinner message="" />
      </Box>
    );
  }

  if (error || !wedding) {
    return (
      <Box sx={{ minHeight: { xs: '100svh', md: '100vh' }, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography>Wedding not found or you don&apos;t have access</Typography>
      </Box>
    );
  }

  // Floating "Change View" button - rendered in all preview modes
  const ViewSwitcher = isInIframe ? null : (
    <>
      <Button
        onClick={(e) => setViewMenuAnchor(e.currentTarget)}
        variant="contained"
        startIcon={<Visibility sx={{ fontSize: 16 }} />}
        sx={{
          position: 'fixed',
          top: 12,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          bgcolor: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          backdropFilter: 'blur(8px)',
          borderRadius: RADII.xl,
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.8rem',
          px: 2,
          py: 0.75,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.85)' },
        }}
      >
        {PREVIEW_VIEW_OPTIONS.find(o => o.value === previewView)?.label || 'Change View'}
      </Button>
      <PheraMenu
        anchorEl={viewMenuAnchor}
        open={Boolean(viewMenuAnchor)}
        onClose={() => setViewMenuAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              borderRadius: 2,
              minWidth: 200,
              bgcolor: 'rgba(0, 0, 0, 0.85)',
              backdropFilter: 'blur(8px)',
              color: 'white',
            },
          },
        }}
      >
        {PREVIEW_VIEW_OPTIONS.map((option) => (
          <PheraMenuItem
            key={option.value}
            selected={previewView === option.value}
            onClick={() => { setPreviewView(option.value); setViewMenuAnchor(null); }}
            sx={{
              color: 'white',
              '& .MuiListItemIcon-root': { color: 'white' },
              '&.Mui-selected': { bgcolor: 'rgba(255, 255, 255, 0.15)' },
              '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' },
            }}
          >
            <ListItemIcon>{option.icon}</ListItemIcon>
            <ListItemText>{option.label}</ListItemText>
          </PheraMenuItem>
        ))}
      </PheraMenu>
    </>
  );

  // Pin Entry view
  if (previewView === 'pin_entry') {
    return (
      <>
        {ViewSwitcher}
        <PinEntry weddingSlug={wedding.slug} onPinVerified={() => { }} isPreview={true} />
      </>
    );
  }

  // For vertical scroll layout, render VerticalScrollLayout directly
  if (useVerticalScroll) {
    return (
      <OptimizedBackground
        src={wedding.background_image || undefined}
        useAppDefault={!wedding.background_image}
        className="min-h-screen flex flex-col"
      >
        {/* Mock Header for Preview */}
        <Box
          ref={headerRef}
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10,
            background: showScrolledNav
              ? 'linear-gradient(to bottom, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0) 100%)'
              : 'transparent',
            transition: 'background 0.3s ease',
            ...(showScrolledNav && {
              '@keyframes slideDown': {
                from: { transform: 'translateY(-100%)' },
                to: { transform: 'translateY(0)' },
              },
              animation: 'slideDown 0.3s ease forwards',
            }),
          }}
        >
          <Box sx={{
            height: { xs: 56, md: 64 },
            display: 'flex',
            alignItems: 'center',
            px: { xs: 2, md: 4 },
            width: '100%',
            justifyContent: 'space-between'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: { xs: 80, sm: 100, md: 120 },
                  height: { xs: 32, sm: 40, md: 48 },
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Image
                  src="/logo.svg"
                  alt="Phera Logo"
                  fill
                  priority
                  style={{
                    objectFit: 'contain',
                    filter: 'brightness(0)',
                  }}
                />
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {/* WhatsApp Icon */}
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  backgroundColor: COLORS.text.strong,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <Box
                  component="svg"
                  sx={{ width: 18, height: 18 }}
                  viewBox="0 0 24 24"
                  fill="white"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.516" />
                </Box>
              </Box>
              <Button variant="contained" sx={{
                bgcolor: COLORS.text.strong, color: COLORS.text.inverse,
                borderRadius: RADII.xl, px: 2,
                fontSize: '0.8rem', fontWeight: 500,
                textTransform: 'none',
                height: 36,
                minHeight: 36,
                '&:hover': { bgcolor: COLORS.text.strong }
              }}>
                Going
              </Button>
              {/* User Avatar Mock */}
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  backgroundColor: COLORS.side.both,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                }}
              >
                KG
              </Box>
            </Box>
          </Box>
        </Box>

        {ViewSwitcher}
        <VerticalScrollLayout
          wedding={{
            id: wedding.id,
            couple_name: wedding.couple_name,
            wedding_date: wedding.wedding_date,
            wedding_date_display: wedding.wedding_date_display,
            venue_name: wedding.venue_name,
            venue_location: wedding.venue_location || '',
            venue_flag: wedding.venue_flag || '',
            rsvp_deadline: wedding.rsvp_deadline,
            welcome_text: wedding.welcome_text || undefined,
            registry_description: (wedding as { registry_description?: string | null }).registry_description || undefined,
            primary_color: wedding.primary_color || undefined,
            couple_images: Array.isArray(wedding.couple_images) ? wedding.couple_images as string[] : undefined,
            couple_name_font: (wedding as { couple_name_font?: string | null }).couple_name_font || undefined,
            frame_image_url: wedding.frame_image_url ?? null,
            background_image: wedding.background_image ?? null,
          }}
          weddingSlug={wedding.slug}
          isBypassPin={previewView === 'rsvp_submitted'}
          hasRSVPed={previewView === 'rsvp_submitted'}
          user={previewView === 'no_rsvp' ? null : { id: 'preview-user' }}
          CountdownTimer={CountdownTimer}
          headerRef={headerRef as React.RefObject<HTMLDivElement>}
        />
      </OptimizedBackground>
    );
  }

  return (
    <OptimizedBackground
      src={wedding.background_image || undefined}
      useAppDefault={!wedding.background_image}
      className="min-h-screen flex flex-col"
    >
      {ViewSwitcher}
      <>
        {/* Desktop Layout (lg and above) */}
        <Box
          sx={{
            display: { xs: 'none', lg: 'flex' },
            flexDirection: 'row',
            minHeight: '100vh',
            position: 'relative',
          }}
        >
          {/* Full-width Header */}
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 10,
              background: showScrolledNav
                ? 'linear-gradient(to bottom, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0) 100%)'
                : 'transparent',
              transition: 'background 0.3s ease',
              ...(showScrolledNav && {
                '@keyframes slideDown': {
                  from: { transform: 'translateY(-100%)' },
                  to: { transform: 'translateY(0)' },
                },
                animation: 'slideDown 0.3s ease forwards',
              }),
            }}
          >
            {/* Mock Header for Preview - Simplified version of AppHeader */}
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              px: { xs: 2, md: 4 },
              pt: { xs: 1.5, md: 2 },
              pb: { xs: 1.5, md: 2 },
              width: '100%',
              justifyContent: 'space-between'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: { xs: 80, sm: 100, md: 120 },
                    height: { xs: 32, sm: 40, md: 48 },
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Image
                    src="/logo.svg"
                    alt="Phera Logo"
                    fill
                    priority
                    style={{
                      objectFit: 'contain',
                      filter: 'brightness(0)',
                    }}
                  />
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {/* WhatsApp Icon */}
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    backgroundColor: COLORS.text.strong,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <Box
                    component="svg"
                    sx={{ width: 18, height: 18 }}
                    viewBox="0 0 24 24"
                    fill="white"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.516" />
                  </Box>
                </Box>
                <Button variant="contained" sx={{
                  bgcolor: COLORS.text.strong, color: COLORS.text.inverse,
                  borderRadius: RADII.xl, px: 2,
                  fontSize: '0.8rem', fontWeight: 500,
                  textTransform: 'none',
                  height: 36,
                  minHeight: 36,
                  '&:hover': { bgcolor: COLORS.text.strong }
                }}>
                  Going
                </Button>
                {/* User Avatar Mock */}
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    backgroundColor: COLORS.side.both,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                  }}
                >
                  KG
                </Box>
              </Box>
            </Box>
          </Box>


          {/* Left Side: Scrollable Details */}
          <Box
            sx={{
              flex: '1 1 50%',
              maxWidth: '50%',
              minHeight: '100vh',
              display: 'flex',
              justifyContent: 'flex-start',
              pl: { md: 6, lg: 8, xl: 12 },
              pr: { md: 2, lg: 4, xl: 6 },
              pt: {
                md: 'calc(50vh - 190px)',
                lg: 'calc(50vh - 220px)',
                xl: 'calc(50vh - 240px)'
              },
              pb: { md: 15, lg: 15, xl: 15 },
              alignItems: 'flex-end', // Align content to the right (towards center)
              flexDirection: 'column',
              zIndex: 2,
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              style={{ width: '100%', display: 'flex', justifyContent: 'flex-end' }}
            >
              <Stack spacing={4} alignItems="flex-start" textAlign="left" sx={{ width: '100%', maxWidth: { md: 400, lg: 460, xl: 520 } }}>
                <Stack spacing={1} sx={{ width: '100%' }}>
                  {/* Names */}
                  <Typography
                    variant="h2"
                    sx={{
                      fontSize: { md: '2.5rem', lg: '3rem', xl: '3.5rem' },
                      color: COLORS.text.strong,
                      lineHeight: 1.2,
                      fontFamily: getCoupleFont((wedding as { couple_name_font?: string | null }).couple_name_font).cssVar,
                      fontStyle: getCoupleFont((wedding as { couple_name_font?: string | null }).couple_name_font).fontStyle || 'normal',
                    }}
                  >
                    {wedding.couple_name}
                  </Typography>

                  {/* Date */}
                  <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2} sx={{ width: '100%' }}>
                    <Typography
                      variant="subtitleCaps"
                      sx={{
                        color: COLORS.text.strong,
                        fontSize: { md: '1rem', lg: '1.25rem' },
                      }}
                    >
                      {wedding.wedding_date_display}
                    </Typography>

                    {/* Action Buttons */}
                    <Stack direction="row" spacing={1.5}>
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          backgroundColor: 'rgba(0,0,0,0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          '&:hover': { backgroundColor: 'rgba(0,0,0,0.15)' }
                        }}
                      >
                        <Box component="svg" sx={{ width: 18, height: 18, color: COLORS.text.strong }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                        </Box>
                      </Box>
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          backgroundColor: 'rgba(0,0,0,0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          '&:hover': { backgroundColor: 'rgba(0,0,0,0.15)' }
                        }}
                      >
                        <Box component="svg" sx={{ width: 18, height: 18, color: COLORS.text.strong }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" />
                        </Box>
                      </Box>
                    </Stack>
                  </Stack>
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
                  <Stack direction="row" alignItems="center" spacing={1} justifyContent="flex-start">
                    <Box component="svg" sx={{ width: 16, height: 16, color: COLORS.text.muted }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{
                        color: COLORS.text.strong,
                        fontSize: { md: '1rem', lg: '1.125rem', xl: '1.25rem' },
                        textDecoration: 'underline',
                      }}
                    >
                      {wedding.venue_name}{wedding.venue_location ? `, ${wedding.venue_location}` : ''}
                    </Typography>
                    {wedding.venue_flag && (
                      <Typography sx={{ fontSize: { md: '1.25rem', lg: '1.375rem', xl: '1.5rem' } }}>
                        {wedding.venue_flag}
                      </Typography>
                    )}
                  </Stack>
                </Box>

                {/* Description */}
                <Typography
                  variant="body2"
                  sx={{
                    color: COLORS.text.strong,
                    fontSize: { md: '1rem', lg: '1.125rem', xl: '1.25rem' },
                    lineHeight: 1.6,
                    maxWidth: { md: 400, lg: 460, xl: 520 },
                  }}
                >
                  {wedding.welcome_text}
                </Typography>

                {/* Countdown Timer */}
                <Box sx={{ mt: 1, width: '100%', maxWidth: { md: 400, lg: 460, xl: 520 } }}>
                  <CountdownTimer targetDate={wedding.wedding_date} />
                </Box>

                {/* Comments Section - hidden when no RSVP */}
                {previewView === 'rsvp_submitted' && (
                  <Box sx={{ width: '100%', mt: 4, maxWidth: { md: 400, lg: 460, xl: 520 } }}>
                    <ReadOnlyComments />
                  </Box>
                )}

              </Stack>
            </motion.div>
          </Box>

          {/* Right Side: Sticky Image */}
          <Box
            sx={{
              flex: '0 0 50%',
              width: '50%',
              height: '100vh',
              position: 'fixed',
              right: 0,
              top: 0,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              px: { md: 4, lg: 6, xl: 8 },
              gap: 3,
              alignItems: 'center',
            }}
          >
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  maxWidth: { md: 320, lg: 380, xl: 420 },
                  aspectRatio: '1',
                }}
              >
                <CoupleImageDisplay
                  coupleImages={Array.isArray(wedding.couple_images) ? wedding.couple_images as string[] : wedding.couple_image_url ? [wedding.couple_image_url] : []}
                  frameImageUrl={wedding.frame_image_url}
                />
              </Box>
            </motion.div>

            {/* View Details / RSVP Button */}
            <Box sx={{ width: '100%', maxWidth: { md: 320, lg: 380, xl: 420 } }}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                style={{ width: '100%' }}
              >
                <Button
                  component={previewView === 'rsvp_submitted' ? Link : 'button'}
                  href={previewView === 'rsvp_submitted' ? `/preview/${wedding.slug}/details` : undefined}
                  variant="contained"
                  size="large"
                  fullWidth
                  sx={{
                    backgroundColor: wedding.primary_color || COLORS.brand.primary,
                    color: 'white',
                    py: { md: 2, lg: 2.25, xl: 2.5 },
                    fontSize: { md: '1.125rem', lg: '1.25rem', xl: '1.375rem' },
                    fontWeight: 700,
                    borderRadius: RADII.lg,
                    textTransform: 'uppercase',
                    letterSpacing: '6.25%',
                    '&:hover': {
                      backgroundColor: wedding.primary_color || COLORS.brand.primaryHover,
                      opacity: 0.9,
                    },
                  }}
                >
                  {previewView === 'rsvp_submitted' ? 'View Details' : 'RSVP'}
                </Button>
              </motion.div>
              {previewView !== 'rsvp_submitted' && wedding.rsvp_deadline && wedding.rsvp_deadline !== 'TBD' && (
                <Typography
                  variant="body2"
                  sx={{
                    color: COLORS.text.subtle,
                    fontSize: '0.9rem',
                    textAlign: 'center',
                    lineHeight: 1.4,
                    mt: 1.5,
                  }}
                >
                  Please RSVP by {formatDeadline(wedding.rsvp_deadline)}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>



        {/* Mobile/Tablet Layout (xs to md) */}
        <Box sx={{ display: { xs: 'block', lg: 'none' } }}>
          <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 2 }}>
            <Box sx={{ pt: { xs: 3, md: 5 }, pb: 1 }}>
              {/* Couple Photo Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <CoupleImageDisplay
                  coupleImages={Array.isArray(wedding.couple_images) ? wedding.couple_images as string[] : wedding.couple_image_url ? [wedding.couple_image_url] : []}
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
                    variant="subtitleCaps"
                    sx={{
                      color: COLORS.text.strong,
                      fontSize: { xs: '1rem', lg: '1.125rem', xl: '1.25rem' },
                    }}
                  >
                    {wedding.wedding_date_display}
                  </Typography>

                  {/* Names */}
                  <Typography
                    variant="h2"
                    sx={{
                      fontSize: { xs: '2.5rem', sm: '3rem', lg: '3.25rem', xl: '3.5rem' },
                      color: COLORS.text.strong,
                      lineHeight: 1.2,
                      fontFamily: getCoupleFont((wedding as { couple_name_font?: string | null }).couple_name_font).cssVar,
                      fontStyle: getCoupleFont((wedding as { couple_name_font?: string | null }).couple_name_font).fontStyle || 'normal',
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
                          color: COLORS.text.strong,
                          fontSize: { xs: '1.1rem', lg: '1.2rem', xl: '1.3rem' },
                          textDecoration: 'underline',
                        }}
                      >
                        {wedding.venue_name}{wedding.venue_location ? `, ${wedding.venue_location}` : ''}
                      </Typography>
                      {wedding.venue_flag && (
                        <Typography sx={{ fontSize: { xs: '1.2rem', lg: '1.3rem', xl: '1.4rem' } }}>
                          {wedding.venue_flag}
                        </Typography>
                      )}
                    </Stack>
                  </Box>

                  {/* Countdown Timer */}
                  <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                    <CountdownTimer targetDate={wedding.wedding_date} />
                  </Box>

                  {/* Welcome Message */}
                  {wedding.welcome_text && (
                    <Typography
                      variant="body2"
                      sx={{
                        color: COLORS.text.strong,
                        fontSize: { xs: '0.95rem', sm: '1rem' },
                        lineHeight: 1.6,
                        textAlign: 'center',
                        maxWidth: 340,
                        mt: { xs: 2, sm: 2 },
                      }}
                    >
                      {wedding.welcome_text}
                    </Typography>
                  )}
                </Stack>
              </motion.div>
            </Box>
          </Container>

          {/* Wedding Community Section - Comments - hidden when no RSVP */}
          {previewView === 'rsvp_submitted' && (
            <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 2, pt: 1, pb: 4 }}>
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true, margin: '-100px' }}
                style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
              >
                <Box sx={{ width: '100%', maxWidth: 340, mx: 'auto' }}>
                  <ReadOnlyComments />
                </Box>
              </motion.div>
            </Container>
          )}

          {/* View Details / RSVP Button - Sticky Footer (Mobile Only) */}
          <Box
            sx={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 4,
              backgroundColor: 'rgba(254, 249, 242, 0.4)',
              backdropFilter: 'blur(4px)',
              borderTop: '1px solid rgba(0, 0, 0, 0.1)',
              px: 2,
              py: 2,
              boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.1)',
            }}
          >
            <Container maxWidth="sm">
              <Stack spacing={1.5} alignItems="center" sx={{ width: '100%' }}>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} style={{ width: '100%' }}>
                  <Button
                    component={previewView === 'rsvp_submitted' ? Link : 'button'}
                    href={previewView === 'rsvp_submitted' ? `/preview/${wedding.slug}/details` : undefined}
                    variant="contained"
                    fullWidth
                    sx={{
                      bgcolor: wedding?.primary_color || COLORS.brand.primary,
                      color: 'white',
                      py: 1.5,
                      borderRadius: '80px',
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                    }}
                  >
                    {previewView === 'rsvp_submitted' ? 'View Details' : 'RSVP'}
                  </Button>
                </motion.div>
                {previewView !== 'rsvp_submitted' && wedding?.rsvp_deadline && wedding.rsvp_deadline !== 'TBD' && (
                  <Typography variant="body2" sx={{ color: COLORS.text.subtle }}>
                    Please RSVP by {formatDeadline(wedding.rsvp_deadline)}
                  </Typography>
                )}
              </Stack>
            </Container>
          </Box>
          <Box sx={{ height: 100 }} />
        </Box>
      </>
    </OptimizedBackground>
  );
}

export default function PreviewPage({ params }: { params: Promise<{ weddingSlug: string }> }) {
  const { weddingSlug } = use(params);

  return (
    <WeddingProvider weddingSlug={weddingSlug} mode="preview">
      <Suspense>
        <PreviewContent />
      </Suspense>
    </WeddingProvider>
  );
}

