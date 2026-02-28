'use client';

import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  useTheme,
  useMediaQuery,
  Stack,
  Avatar,
  Chip,
  IconButton,
  Menu,
  MenuItem
} from '@mui/material';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import {
  FavoriteOutlined,
  LocationOnOutlined,
  CalendarTodayOutlined,
  Logout as LogoutIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { PlaceholderCouple } from '@/components/ui/PlaceholderCouple';
import GuestList from '@/components/guest/GuestList';
import PinEntry from '@/components/guest/PinEntry';
import LoginModal from '@/components/auth/LoginModal';
import { useAuth } from '@/lib/contexts/AuthContext';
import OptimizedBackground from '@/components/ui/OptimizedBackground';
import AppHeader from '@/components/shared/AppHeader';
import { WEDDING_CONFIG } from '@/lib/constants/wedding-config';

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
        const months = Math.floor(difference / (1000 * 60 * 60 * 24 * 30.44)); // Average days per month
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
  const theme = useTheme();

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
        borderRadius: 8, // 64px from Figma converted to MUI scale
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
        {timeUnits.map((unit, index) => (
          <Stack
            key={unit.label}
            alignItems="center"
            spacing={0}
            sx={{
              minWidth: { xs: 35, sm: 40, lg: 45, xl: 50 }, // Fixed width for each column
            }}
          >
            <Typography
              variant="h4"
              sx={{
                fontWeight: 400, // Regular weight like in Figma
                color: '#000000',
                fontSize: { xs: '1.5rem', sm: '1.5rem', lg: '1.75rem', xl: '2rem' }, // 24px from Figma
                lineHeight: 1.2,
                // Match Figma font
              }}
            >
              {unit.value}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: '#000000',
                fontWeight: 400,
                fontSize: { xs: '0.85rem', sm: '0.75rem', lg: '0.85rem', xl: '0.9rem' }, // 12px from Figma
                lineHeight: 1.4,
                // Match Figma font
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

// Wedding data from centralized config
const coupleData = {
  names: WEDDING_CONFIG.coupleNames,
  date: WEDDING_CONFIG.weddingDateDisplay,
  weddingDate: WEDDING_CONFIG.weddingDate,
  venue: WEDDING_CONFIG.venue,
  flag: WEDDING_CONFIG.venueFlag,
  rsvpDeadline: WEDDING_CONFIG.rsvpDeadline,
  coupleImage: WEDDING_CONFIG.coupleImage,
  frameImage: WEDDING_CONFIG.frameImage
};

// Couple Image Carousel Component
const CoupleImageCarousel = ({ size = 300 }: { size?: number }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

  const coupleImages = [
    '/images/couple/couple-1.jpg',
    '/images/couple/couple-2.jpg',
    '/images/couple/couple-3.jpeg',
    '/images/couple/couple-4.jpg',
    '/images/couple/couple-5.jpg',
    '/images/couple/couple-7.jpeg',
    '/images/couple/couple-8.jpg',
    '/images/couple/couple-9.jpeg'
  ];

  const advanceToNextImage = () => {
    setIsTransitioning(true);

    setTimeout(() => {
      setCurrentImageIndex((prev) => (prev + 1) % coupleImages.length);
      setIsTransitioning(false);
    }, 300); // Half of transition duration
  };

  const handleImageClick = () => {
    // Clear existing interval
    if (intervalId) {
      clearInterval(intervalId);
    }

    // Advance to next image
    advanceToNextImage();

    // Restart auto-cycle timer
    const newInterval = setInterval(() => {
      advanceToNextImage();
    }, 4000);

    setIntervalId(newInterval);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      advanceToNextImage();
    }, 4000); // Change image every 4 seconds

    setIntervalId(interval);
    return () => clearInterval(interval);
  }, [coupleImages.length]);

  return (
    <Box
      onClick={handleImageClick}
      sx={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
      }}
    >
      <Image
        src={coupleImages[currentImageIndex]}
        alt="Couple Photo"
        fill
        priority={currentImageIndex === 0} // Priority for first image
        sizes="(max-width: 768px) 320px, 400px"
        style={{
          objectFit: 'cover',
          objectPosition: 'center',
          transition: 'filter 0.6s ease-in-out',
          filter: isTransitioning ? 'blur(5px)' : 'blur(0px)',
        }}
        onLoad={() => setImageLoaded(true)}
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
      />

      {/* Preload next image */}
      <link
        rel="preload"
        as="image"
        href={coupleImages[(currentImageIndex + 1) % coupleImages.length]}
      />
    </Box>
  );
};

export default function HomePage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [currentBackground, setCurrentBackground] = useState(0);
  const [customBackground, setCustomBackground] = useState<string>('');

  // Authentication state from context
  const { user, isLoading, hasRSVPed, rsvpResponse, isCheckingRSVP, signOut, refreshAuth } = useAuth();

  // Pin verification state - DISABLED
  // PIN entry is completely bypassed - users go directly to the wedding website
  const [isPinVerified, setIsPinVerified] = useState(true);
  const [isCheckingPin, setIsCheckingPin] = useState(false);
  const [isBypassPin, setIsBypassPin] = useState(true); // Always set to true to bypass RSVP requirement

  // Login dialog state
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);

  // Background configuration - now handled by OptimizedBackground component  
  const handleBackgroundChange = (backgroundPath: string) => {
    setCustomBackground(backgroundPath);
  };

  const handleSignOut = async () => {
    await signOut();
    setUserMenuAnchor(null);
    // Clear bypass PIN state
    setIsBypassPin(false);
  };

  const handlePinVerified = () => {
    setIsPinVerified(true);

    // Check if this is a bypass PIN immediately
    if (typeof window !== 'undefined') {
      const bypassFlag = localStorage.getItem('phera_bypass_rsvp');
      if (bypassFlag === 'true') {
        setIsBypassPin(true);
        console.log('Bypass PIN detected in handlePinVerified - showing guest content immediately');

        // Create temporary guest auth if not exists
        const existingGuestAuth = localStorage.getItem('phera_guest_auth');
        if (!existingGuestAuth || !existingGuestAuth.includes('temp-bypass-guest')) {
          const tempGuestInfo = {
            id: 'temp-bypass-guest',
            email: 'bypass@guest.local',
            name: 'Wedding Guest',
            phone: undefined,
            weddingId: 'sim-kv',
            avatar_style: undefined,
            avatar_seed: undefined,
            avatar_svg: undefined,
            timestamp: Date.now()
          };

          localStorage.setItem('phera_guest_auth', JSON.stringify(tempGuestInfo));
          console.log('Created temporary guest auth in handlePinVerified');

          // Try to refresh auth once - prevent multiple calls
          setTimeout(() => refreshAuth(), 100);
        }
      }
    }

    // Scroll to top after small delay to ensure content has rendered
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 200);
  };

  // Scroll to top on initial page load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, []);

  // Safety timeout to prevent infinite loading
  useEffect(() => {
    const safetyTimeout = setTimeout(() => {
      if (isLoading || isCheckingPin) {
        console.warn('Safety timeout triggered - forcing loading completion');
        setIsCheckingPin(false);
        // If we have PIN verification but no user, that's OK for guest access
        if (typeof window !== 'undefined') {
          const pinVerified = localStorage.getItem('phera_pin_verified');
          const pinTimestamp = localStorage.getItem('phera_pin_timestamp');
          if (pinVerified === 'true' && pinTimestamp) {
            const timestamp = parseInt(pinTimestamp);
            const isRecent = Date.now() - timestamp < 24 * 60 * 60 * 1000;
            if (isRecent) {
              setIsPinVerified(true);
              const bypassFlag = localStorage.getItem('phera_bypass_rsvp');
              if (bypassFlag === 'true') {
                setIsBypassPin(true);
              }
            }
          }
        }
      }
    }, 3000); // 3 second safety timeout - should be much faster now

    return () => clearTimeout(safetyTimeout);
  }, [isLoading, isCheckingPin]);

  // PIN verification is now disabled - users go directly to the wedding website
  useEffect(() => {
    // Always allow access - PIN entry is disabled
    setIsPinVerified(true);
    setIsCheckingPin(false);
    setIsBypassPin(true);

    // Clean up any old PIN verification data
    if (typeof window !== 'undefined') {
      localStorage.setItem('phera_bypass_rsvp', 'true');
      localStorage.setItem('phera_pin_verified', 'true');
      localStorage.setItem('phera_pin_timestamp', Date.now().toString());
    }
  }, []); // Run once on mount

  // Scroll to top when main content becomes visible after PIN verification
  useEffect(() => {
    if (isPinVerified && !isLoading && !isCheckingPin) {
      const timer = setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [isPinVerified, isLoading, isCheckingPin]);

  // PIN entry is disabled - users go directly to the wedding website
  // (PinEntry component will never be shown)

  // Show loading screen while checking authentication or pin
  if (isLoading || isCheckingPin) {
    // Debug logging to understand loading state
    console.log('HomePage loading state:', {
      isLoading,
      isCheckingPin,
      user: !!user,
      isPinVerified,
      reason: isLoading ? 'auth loading' : isCheckingPin ? 'checking PIN' : 'unknown',
      timestamp: new Date().toISOString()
    });

    return (
      <Box
        sx={{
          minHeight: '100svh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f5f5f5',
        }}
      >
        <Typography variant="h6" sx={{ color: '#666' }}>
          Loading...
        </Typography>
      </Box>
    );
  }

  return (
    <OptimizedBackground
      useAppDefault={true}
      className="min-h-screen flex flex-col"
    >
      {/* Header Section */}
      <AppHeader
        variant="transparent"
      />

      {/* Main Landing Section */}
      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 2 }}>
        <Box sx={{ pt: 10, pb: 4 }}>
          {/* Couple Photo Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                maxWidth: { xs: 320, lg: 340, xl: 360 },
                aspectRatio: '1',
                mx: 'auto',
                mb: 2,
                cursor: 'pointer',
                transition: 'transform 0.2s ease-in-out',
                '&:hover': {
                  transform: 'scale(1.02)',
                },
                '&:active': {
                  transform: 'scale(0.98)',
                },
              }}
            >
              {/* Frame Background */}
              <Image
                src="/images/frames/frame-27.png"
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
                <CoupleImageCarousel size={300} />
              </Box>
            </Box>
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
                {coupleData.date}
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
                {coupleData.names}
              </Typography>

              {/* Venue */}
              <Box
                onClick={() => {
                  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(coupleData.venue)}`;
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
                  '&:active': {
                    transform: 'translateY(0px)',
                  },
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1} justifyContent="center" mb={2}>
                  {/* <LocationOnOutlined 
                    sx={{ 
                      color: '#000', 
                      fontSize: '1.2rem' 
                    }} 
                  /> */}
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#000',
                      fontSize: { xs: '1.1rem', lg: '1.2rem', xl: '1.3rem' },
                      textDecoration: 'underline',
                    }}
                  >
                    {coupleData.venue}
                  </Typography>
                  <Typography sx={{ fontSize: { xs: '1.2rem', lg: '1.3rem', xl: '1.4rem' } }}>
                    {coupleData.flag}
                  </Typography>
                </Stack>
              </Box>

              {/* Countdown Timer */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <CountdownTimer targetDate={coupleData.weddingDate} />
              </motion.div>
            </Stack>
          </motion.div>
        </Box>
      </Container>

      {/* Wedding Community Section - Only show if user has RSVP'd OR using bypass PIN */}
      {(() => {
        console.log('Guest content visibility check:', {
          isLoading,
          isCheckingRSVP,
          user: !!user,
          hasRSVPed,
          isBypassPin,
          shouldShowContent: !isLoading && !isCheckingRSVP && ((user && hasRSVPed) || isBypassPin)
        });
        return null;
      })()}
      {!isLoading && !isCheckingRSVP && ((user && hasRSVPed) || isBypassPin) && (
        <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 2, pb: 4 }}>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, margin: '-100px' }}
          >
            <GuestList weddingId="sim-kv" />
          </motion.div>
        </Container>
      )}

      {/* User Menu */}
      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={() => setUserMenuAnchor(null)}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 150,
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          }
        }}
      >
        <MenuItem onClick={handleSignOut}>
          <LogoutIcon sx={{ mr: 1, fontSize: '1.1rem' }} />
          Sign Out
        </MenuItem>
      </Menu>

      {/* Login Modal */}
      <LoginModal
        open={loginDialogOpen}
        onClose={() => setLoginDialogOpen(false)}
        onSuccess={() => {
          // Optional: Show success message or refresh data
          console.log('Login successful');
        }}
      />

      {/* Sticky RSVP Footer - Show when pin verified and either not authenticated or authenticated but not RSVP'd (but NOT for bypass PIN users) */}
      {!isLoading && !isCheckingPin && isPinVerified && !isBypassPin && (!user || (user && !isCheckingRSVP && !hasRSVPed)) && (
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
          <Container maxWidth="sm">
            <Stack spacing={1.5} alignItems="center">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{ width: '100%' }}
              >
                <Button
                  component={Link}
                  href="/rsvp"
                  variant="contained"
                  size="large"
                  fullWidth
                  sx={{
                    backgroundColor: '#DE3F5E',
                    color: 'white',
                    py: { xs: 2, lg: 2.25, xl: 2.5 },
                    fontSize: { xs: '1.1rem', lg: '1.2rem', xl: '1.3rem' },
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
                  RSVP
                </Button>
              </motion.div>

              {/* RSVP Deadline */}
              <Typography
                variant="body2"
                sx={{
                  color: '#777',
                  fontSize: { xs: '0.9rem', lg: '0.95rem', xl: '1rem' },
                  textAlign: 'center',
                  lineHeight: 1.4,
                }}
              >
                Let us know you're coming by {coupleData.rsvpDeadline}
              </Typography>
            </Stack>
          </Container>
        </Box>
      )}

      {/* View Details Button - Show when user has RSVP'd OR using bypass PIN */}
      {(() => {
        console.log('View Details button visibility check:', {
          isLoading,
          isCheckingRSVP,
          user: !!user,
          hasRSVPed,
          isBypassPin,
          shouldShowButton: !isLoading && !isCheckingRSVP && ((user && hasRSVPed) || isBypassPin)
        });
        return null;
      })()}
      {!isLoading && !isCheckingRSVP && ((user && hasRSVPed) || isBypassPin) && (
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
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{ width: '100%' }}
              >
                <Button
                  component={Link}
                  href="/details"
                  variant="contained"
                  size="large"
                  fullWidth
                  sx={{
                    backgroundColor: '#DE3F5E',
                    color: 'white',
                    py: { xs: 1.5, lg: 1.75, xl: 2 },
                    fontSize: { xs: '1rem', lg: '1.0625rem', xl: '1.125rem' },
                    fontWeight: 700,
                    borderRadius: '16px',
                    textTransform: 'uppercase',
                    letterSpacing: '6.25%',
                    '&:hover': {
                      backgroundColor: '#C8365A',
                    },
                  }}
                >
                  View Details
                </Button>
              </motion.div>

              {/* RSVP Deadline - removed for RSVP'd users */}
            </Stack>
          </Container>
        </Box>
      )}

      {/* Add bottom padding to prevent content from being hidden behind sticky footer */}
      <Box sx={{ height: 100 }} />
    </OptimizedBackground>
  );
} 