'use client';

import {
  Box,
  Container,
  Typography,
  Button,
  useTheme,
  useMediaQuery,
  Stack,
  IconButton,
  Menu,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import {
  LocationOnOutlined,
  CalendarTodayOutlined,
  Logout as LogoutIcon
} from '@mui/icons-material';
import { useState, useEffect, useRef } from 'react';
import { PlaceholderCouple } from '@/components/ui/PlaceholderCouple';
import GuestList from '@/components/guest/GuestList';
import PinEntry from '@/components/guest/PinEntry';
import InfiniteScrollLayout from '@/components/guest/InfiniteScrollLayout';
import LoginModal from '@/components/auth/LoginModal';
import { useAuth } from '@/lib/contexts/AuthContext';
import OptimizedBackground from '@/components/ui/OptimizedBackground';
import AppHeader from '@/components/shared/AppHeader';
import { WEDDING_CONFIG } from '@/lib/constants/wedding-config';
import { useParams, useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { useWedding } from '@/lib/contexts/WeddingContext';
import { format, parseISO } from 'date-fns';
import { getFrameConfig } from '@/lib/constants/images';

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
        px: { xs: 4, sm: 4.5, md: 4, lg: 5.2, xl: 6.4 },
        py: { xs: 1.5, sm: 1.75, md: 1.6, lg: 2, xl: 2.4 },
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '100%', // Let parent wrapper control width
      }}
    >
      <Stack
        direction="row"
        spacing={{ xs: 3, sm: 3.5, md: 2.8, lg: 3.6, xl: 4.8 }}
        justifyContent="center"
        alignItems="center"
      >
        {timeUnits.map((unit, index) => (
          <Stack
            key={unit.label}
            alignItems="center"
            spacing={0}
            sx={{
              minWidth: { xs: 35, sm: 40, md: 36, lg: 48, xl: 60 }, // Smoother progression
            }}
          >
            <Typography
              variant="h4"
              sx={{
                fontWeight: 400, // Regular weight like in Figma
                color: '#000000',
                // Smoother font size progression to prevent overflow on small desktop
                fontSize: {
                  xs: '1.5rem',   // 360px+ (mobile)
                  sm: '1.5rem',   // 600px+ (large mobile)
                  md: '1.4rem',   // 900px+ (small desktop)
                  lg: '2rem',     // 1200px+ (desktop)
                  xl: '2.6rem'    // 1536px+ (large desktop)
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
                color: '#000000',
                fontWeight: 400,
                // Smoother label size progression
                fontSize: {
                  xs: '0.85rem',   // mobile
                  sm: '0.75rem',   // large mobile
                  md: '0.7rem',    // small desktop
                  lg: '0.8rem',    // desktop
                  xl: '1rem'       // large desktop
                },
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

// Couple Image Carousel Component
const CoupleImageCarousel = ({ size = 300, images = [] }: { size?: number, images?: string[] }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

  const carouselImages = images.length > 0 ? images : [
    '/images/couple/couple-1.jpg',
    '/images/couple/couple-2.jpg',
    '/images/couple/couple-3.jpeg',
    '/images/couple/couple-4.jpg',
    '/images/couple/couple-5.jpg',
    '/images/couple/couple-7.jpeg',
    '/images/couple/couple-8.jpg',
    '/images/couple/couple-9.jpeg'
  ];

  const advanceToNextImage = (numImages: number) => {
    if (numImages <= 1) return;
    setIsTransitioning(true);

    setTimeout(() => {
      setCurrentImageIndex((prev) => (prev + 1) % numImages);
      setIsTransitioning(false);
    }, 300);
  };

  const handleImageClick = () => {
    if (carouselImages.length <= 1) return;

    if (intervalId) {
      clearInterval(intervalId);
    }

    advanceToNextImage(carouselImages.length);

    const newInterval = setInterval(() => {
      advanceToNextImage(carouselImages.length);
    }, 4000);

    setIntervalId(newInterval);
  };

  useEffect(() => {
    if (carouselImages.length <= 1) return;

    const interval = setInterval(() => {
      advanceToNextImage(carouselImages.length);
    }, 4000);

    setIntervalId(interval);
    return () => clearInterval(interval);
  }, [carouselImages.length]);

  return (
    <Box
      onClick={handleImageClick}
      sx={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        cursor: carouselImages.length > 1 ? 'pointer' : 'default',
      }}
    >
      <Image
        src={carouselImages[currentImageIndex]}
        alt="Couple Photo"
        fill
        priority={currentImageIndex === 0}
        sizes="(max-width: 768px) 320px, 400px"
        style={{
          objectFit: 'cover',
          objectPosition: 'center',
          transition: 'filter 0.6s ease-in-out',
          filter: isTransitioning ? 'blur(5px)' : 'blur(0px)',
        }}
      />
    </Box>
  );
};

export default function HomePage() {
  const params = useParams();
  const weddingSlug = params.weddingSlug as string;
  // Keep weddingId for backward compatibility with other components that expect it
  const weddingId = weddingSlug;

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const router = useRouter();
  const [currentBackground, setCurrentBackground] = useState(0);
  const [customBackground, setCustomBackground] = useState<string>('');
  const [isNavigating, setIsNavigating] = useState(false);

  // Authentication state from context
  const { user, isLoading, hasRSVPed, rsvpResponse, isCheckingRSVP, signOut, refreshAuth, setCurrentWeddingSlug, checkRSVPStatus } = useAuth();

  // Wedding data from context
  const { wedding, isLoading: weddingLoading } = useWedding();

  // Set the current wedding slug in AuthContext on mount/change
  useEffect(() => {
    if (weddingSlug) {
      setCurrentWeddingSlug(weddingSlug);
    }
  }, [weddingSlug, setCurrentWeddingSlug]);

  // Use data from context if available, otherwise fallback to config
  const coupleData = {
    names: wedding?.couple_name || WEDDING_CONFIG.coupleNames,
    date: wedding?.wedding_date_display || WEDDING_CONFIG.weddingDateDisplay,
    weddingDate: wedding?.wedding_date || WEDDING_CONFIG.weddingDate,
    venue: wedding?.venue_name || WEDDING_CONFIG.venue,
    venueLocation: wedding?.venue_location || '',
    showVenueLocation: wedding?.show_venue_location !== false,
    flag: wedding?.venue_flag || WEDDING_CONFIG.venueFlag,
    rsvpDeadline: wedding?.rsvp_deadline || WEDDING_CONFIG.rsvpDeadline,
    coupleImage: wedding?.couple_image_url || WEDDING_CONFIG.coupleImage,
    frameImage: wedding?.frame_image_url || WEDDING_CONFIG.frameImage,
    coupleImages: (Array.isArray(wedding?.couple_images) ? wedding.couple_images : []) as string[]
  };

  // Pin verification state
  const [isPinVerified, setIsPinVerified] = useState(false);
  const [isCheckingPin, setIsCheckingPin] = useState(true);
  const [isBypassPin, setIsBypassPin] = useState(false);


  // Header visibility on scroll — use ref + DOM manipulation to avoid re-renders
  const headerRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (headerRef.current) {
        if (currentScrollY < 50) {
          headerRef.current.style.transform = 'translateY(0)';
        } else if (currentScrollY > lastScrollY.current) {
          headerRef.current.style.transform = 'translateY(-96px)';
        } else if (currentScrollY < lastScrollY.current) {
          headerRef.current.style.transform = 'translateY(0)';
        }
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Consolidated loading state - wait for ALL checks to complete
  // IMPORTANT: Also consider loading if user exists but RSVP check is actively running
  // This prevents a flash where auth completes but RSVP check hasn't finished
  // Exception: bypass PIN users don't need RSVP check
  // Note: We only wait for isCheckingRSVP, NOT for "needs RSVP check" - once check finishes (even with no results), we show the page
  const isPageLoading = isLoading || isCheckingPin || isCheckingRSVP || weddingLoading;

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
      const bypassFlag = localStorage.getItem(`phera_bypass_rsvp_${weddingSlug}`);
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
            weddingId: weddingId,
            avatar_style: undefined,
            avatar_seed: undefined,
            avatar_svg: undefined,
            timestamp: Date.now()
          };

          localStorage.setItem('phera_guest_auth', JSON.stringify(tempGuestInfo));
          console.log('Created temporary guest auth in handlePinVerified');

          // Try to refresh auth once - prevent multiple calls (only if not already loading)
          if (!isLoading) {
            setTimeout(() => refreshAuth(), 100);
          }
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
      if (isPageLoading) {
        console.warn('Safety timeout triggered - forcing loading completion');
        setIsCheckingPin(false);
        // If we have PIN verification but no user, that's OK for guest access
        if (typeof window !== 'undefined') {
          const pinVerified = localStorage.getItem(`phera_pin_verified_${weddingSlug}`);
          const pinTimestamp = localStorage.getItem(`phera_pin_timestamp_${weddingSlug}`);
          if (pinVerified === 'true' && pinTimestamp) {
            const timestamp = parseInt(pinTimestamp);
            const isRecent = Date.now() - timestamp < 24 * 60 * 60 * 1000;
            if (isRecent) {
              setIsPinVerified(true);
              const bypassFlag = localStorage.getItem(`phera_bypass_rsvp_${weddingSlug}`);
              if (bypassFlag === 'true') {
                setIsBypassPin(true);
              }
            }
          }
        }
      }
    }, 5000); // 5 second safety timeout for all checks

    return () => clearTimeout(safetyTimeout);
  }, [isPageLoading]);

  // Check for pin verification on component mount and auth changes
  useEffect(() => {
    const checkPinVerification = () => {
      if (typeof window !== 'undefined') {
        // For authenticated users, check if they have verified PIN for THIS wedding
        // We no longer auto-bypass PIN for all authenticated users
        const pinKeyForWedding = `phera_pin_verified_${weddingSlug}`;
        const timestampKeyForWedding = `phera_pin_timestamp_${weddingSlug}`;

        // Check if user has verified PIN for this specific wedding
        const pinVerifiedForWedding = localStorage.getItem(pinKeyForWedding);
        const pinTimestampForWedding = localStorage.getItem(timestampKeyForWedding);

        if (pinVerifiedForWedding === 'true' && pinTimestampForWedding) {
          const timestamp = parseInt(pinTimestampForWedding);
          const isRecent = Date.now() - timestamp < 24 * 60 * 60 * 1000; // 24 hours
          if (isRecent) {
            console.log(`PIN already verified for wedding: ${weddingSlug}`);
            setIsPinVerified(true);

            // Check for bypass flag for this wedding
            const bypassFlag = localStorage.getItem(`phera_bypass_rsvp_${weddingSlug}`);
            if (bypassFlag === 'true') {
              setIsBypassPin(true);
            }

            setIsCheckingPin(false);
            return;
          }
        }

        // CHECK: Handle bypass PIN case - create temporary guest auth
        const bypassFlag = localStorage.getItem(`phera_bypass_rsvp_${weddingSlug}`);
        const bypassPinVerified = localStorage.getItem(`phera_pin_verified_${weddingSlug}`);
        const bypassPinTimestamp = localStorage.getItem(`phera_pin_timestamp_${weddingSlug}`);

        if (bypassFlag === 'true' && bypassPinVerified === 'true' && bypassPinTimestamp) {
          try {
            const timestamp = parseInt(bypassPinTimestamp);
            const isRecent = Date.now() - timestamp < 24 * 60 * 60 * 1000; // 24 hours
            if (isRecent) {
              // Set local bypass PIN state immediately
              setIsBypassPin(true);
              console.log('Setting bypass PIN state to true');

              // Create temporary guest auth for bypass PIN users - but make it more robust
              const existingGuestAuth = localStorage.getItem('phera_guest_auth');
              if (!existingGuestAuth || !existingGuestAuth.includes('temp-bypass-guest')) {
                const tempGuestInfo = {
                  id: 'temp-bypass-guest',
                  email: 'bypass@guest.local',
                  name: 'Wedding Guest',
                  phone: undefined,
                  weddingId: weddingId,
                  avatar_style: undefined,
                  avatar_seed: undefined,
                  avatar_svg: undefined,
                  timestamp: Date.now()
                };

                localStorage.setItem('phera_guest_auth', JSON.stringify(tempGuestInfo));
                console.log('Created temporary guest auth for bypass PIN user');

                // Only trigger auth refresh if we just created the auth AND auth is not currently loading
                if (!isLoading) {
                  setTimeout(() => refreshAuth(), 100);
                }
              }

              setIsPinVerified(true);
              setIsCheckingPin(false);
              return;
            }
          } catch (error) {
            console.error('Error handling bypass PIN verification:', error);
          }
        }

        // Existing checks...
        // First check for auth errors from callback
        const urlParams = new URLSearchParams(window.location.search);
        const authError = urlParams.get('auth_error');
        const authSuccess = urlParams.get('auth_success');

        if (authError) {
          console.error('Authentication error:', authError);
          // You could show a toast notification here
          // Clean up URL params
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.delete('auth_error');
          window.history.replaceState({}, '', newUrl.toString());
        }

        // Force auth refresh if coming from magic link callback
        if (authSuccess === 'true') {
          console.log('Magic link authentication detected, refreshing auth...');
          // Only refresh if not already loading
          if (!isLoading) {
            setTimeout(() => {
              refreshAuth(); // Force refresh auth status
            }, 100);
          }

          // Clean up URL params
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.delete('auth_success');
          window.history.replaceState({}, '', newUrl.toString());
        }

        // Check for PIN restoration from auth callback
        const restorePin = urlParams.get('restore_pin');
        const restoredTimestamp = urlParams.get('pin_timestamp');
        const restoredAllowsPlusOne = urlParams.get('allows_plus_one');

        if (restorePin === 'true' && restoredTimestamp) {
          try {
            const timestamp = parseInt(restoredTimestamp);
            const isRecent = Date.now() - timestamp < 24 * 60 * 60 * 1000; // 24 hours
            if (isRecent) {
              // Restore PIN verification state for THIS wedding
              localStorage.setItem(`phera_pin_verified_${weddingSlug}`, 'true');
              localStorage.setItem(`phera_pin_timestamp_${weddingSlug}`, restoredTimestamp);
              localStorage.setItem(`phera_allows_plus_one_${weddingSlug}`, restoredAllowsPlusOne || 'false');
              setIsPinVerified(true);

              // Clean up URL params
              const newUrl = new URL(window.location.href);
              newUrl.searchParams.delete('restore_pin');
              newUrl.searchParams.delete('pin_timestamp');
              newUrl.searchParams.delete('allows_plus_one');
              window.history.replaceState({}, '', newUrl.toString());

              // Force refresh auth status after callback (only if not already loading)
              if (!isLoading) {
                setTimeout(() => {
                  refreshAuth();
                }, 500);
              }

              setIsCheckingPin(false);
              return;
            }
          } catch (error) {
            console.error('Error restoring PIN verification:', error);
          }
        }

        // Check existing PIN verification for THIS wedding
        const pinVerified = localStorage.getItem(`phera_pin_verified_${weddingSlug}`);
        const pinTimestamp = localStorage.getItem(`phera_pin_timestamp_${weddingSlug}`);

        if (pinVerified === 'true' && pinTimestamp) {
          try {
            const timestamp = parseInt(pinTimestamp);
            const isRecent = Date.now() - timestamp < 24 * 60 * 60 * 1000; // 24 hours
            if (isRecent) {
              setIsPinVerified(true);

              // Also check if this is a bypass PIN
              const existingBypassFlag = localStorage.getItem(`phera_bypass_rsvp_${weddingSlug}`);
              if (existingBypassFlag === 'true') {
                setIsBypassPin(true);
              }
            } else {
              // Remove expired pin verification for this wedding
              localStorage.removeItem(`phera_pin_verified_${weddingSlug}`);
              localStorage.removeItem(`phera_pin_timestamp_${weddingSlug}`);
              localStorage.removeItem(`phera_allows_plus_one_${weddingSlug}`);
              localStorage.removeItem(`phera_bypass_rsvp_${weddingSlug}`);
              setIsPinVerified(false);
              setIsBypassPin(false);
            }
          } catch (error) {
            console.error('Error checking pin verification:', error);
            setIsPinVerified(false);
            setIsBypassPin(false);
          }
        } else {
          // No PIN verified for this wedding
          // If user is authenticated, they don't need a PIN — treat as verified
          if (user) {
            setIsPinVerified(true);
          } else {
            setIsPinVerified(false);
          }
          setIsBypassPin(false);
        }
      }
      setIsCheckingPin(false);
    };

    checkPinVerification();
  }, [user, weddingSlug]); // Depend on weddingSlug to recheck when wedding changes

  // Scroll to top when main content becomes visible after all checks complete
  useEffect(() => {
    if (isPinVerified && !isPageLoading) {
      const timer = setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [isPinVerified, isPageLoading]);

  // IMPORTANT: Check loading state FIRST before showing PIN entry
  // Show loading screen while checking ANY state (auth, pin, or RSVP)
  if (isPageLoading) {
    // Debug logging to understand loading state
    console.log('HomePage loading state:', {
      isLoading,
      isCheckingPin,
      isCheckingRSVP,
      weddingLoading,
      hasRSVPed,
      rsvpResponse,
      user: !!user,
      isPinVerified,
      reason: isLoading ? 'auth loading'
        : isCheckingPin ? 'checking PIN'
          : isCheckingRSVP ? 'checking RSVP'
            : weddingLoading ? 'loading wedding'
              : 'unknown',
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
        <LoadingSpinner />
      </Box>
    );
  }

  // Show pin entry screen if user is not authenticated AND pin is not verified
  // This check comes AFTER loading check to prevent PIN entry from flashing during load
  if (!user && !isPinVerified) {
    return <PinEntry onPinVerified={handlePinVerified} weddingSlug={weddingId} />;
  }

  // Desktop layout component
  // --- Layout Components ---

  interface LayoutProps {
    isNavigating: boolean;
    coupleData: any;
    isPageLoading: boolean;
    user: any;
    hasRSVPed: boolean;
    isPinVerified: boolean;
    isBypassPin: boolean;
    weddingId: string;
    weddingSlug: string;
    wedding: any;
    refreshAuth: () => void;
    setIsPinVerified: (v: boolean) => void;
    setIsNavigating: (v: boolean) => void;
    router: any;
    isMobile: boolean;
  }

  const DesktopLayout = ({
    isNavigating,
    coupleData,
    isPageLoading,
    user,
    hasRSVPed,
    isPinVerified,
    isBypassPin,
    weddingId,
    weddingSlug,
    wedding,
    refreshAuth,
    setIsPinVerified,
    setIsNavigating,
    router,
    isMobile
  }: LayoutProps) => (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        width: '100%',
        position: 'relative',
      }}
    >
      {/* Loading Overlay */}
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
          <LoadingSpinner />
        </Box>
      )}
      {/* Full-width Header */}
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
        />
      </Box>

      {/* Main Content Area */}
      <Box
        sx={{
          display: 'flex',
          flex: 1,
          width: '100%',
          position: 'relative',
          minHeight: '100vh',
        }}
      >
        {/* Left Side - Scrollable Content */}
        <Box
          sx={{
            flex: '1 1 50%',
            maxWidth: '50%',
            minHeight: '100vh',
            display: 'flex',
            justifyContent: 'flex-start', // Start from top, don't center
            pl: { md: 5, lg: 6.4, xl: 8 }, // Outer padding
            pr: { md: 14.4, lg: 16, xl: 17.6 }, // Inner gap
            // Align with top of the centered image on the right
            // Image max sizes: md: 400px, lg: 480px, xl: 560px
            // Top of image = 50vh - (image height / 2)
            pt: {
              md: 'calc(50vh - 200px)', // 400px / 2 = 200px
              lg: 'calc(50vh - 240px)', // 480px / 2 = 240px
              xl: 'calc(50vh - 280px)'  // 560px / 2 = 280px
            },
            pb: { md: 15, lg: 15, xl: 15 }, // Bottom padding
            alignItems: 'flex-end', // Align content to the right (towards center)
            flexDirection: 'column',
          }}
        >
          {/* Wedding Details Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            style={{ width: '100%', display: 'flex', justifyContent: 'flex-end' }}
          >
            <Stack spacing={3.2} alignItems="flex-start" textAlign="left" sx={{ width: '100%', maxWidth: { md: 400, lg: 480, xl: 560 } }}>
              {/* Names - Large italic serif */}
              <Typography
                variant="h2"
                sx={{
                  fontSize: { md: '2.8rem', lg: '3.6rem', xl: '4.4rem' },
                  color: '#000',
                  lineHeight: 1.2,
                  fontFamily: 'var(--font-instrument-serif)',
                  fontStyle: 'italic',
                }}
              >
                {coupleData.names}
              </Typography>

              {/* Date and Time with Action Icons */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <Box>
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#000',
                      fontSize: { md: '1.2rem', lg: '1.4rem', xl: '1.6rem' },
                      fontWeight: 600,
                    }}
                  >
                    {coupleData.date}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={2}>
                  <IconButton
                    sx={{
                      backgroundColor: 'rgba(0, 0, 0, 0.15)',
                      border: '1px solid rgba(0, 0, 0, 0.25)',
                      width: { md: 38, lg: 45, xl: 51 },
                      height: { md: 38, lg: 45, xl: 51 },
                      color: '#000',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.25)',
                        borderColor: 'rgba(0, 0, 0, 0.35)',
                      },
                    }}
                    onClick={() => {
                      // Add to calendar functionality
                      const event = {
                        text: `${coupleData.names}`,
                        dates: coupleData.weddingDate,
                        location: coupleData.venue,
                      };
                      const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.text)}&location=${encodeURIComponent(event.location)}&dates=${coupleData.weddingDate.replace(/-/g, '')}/${coupleData.weddingDate.replace(/-/g, '')}`;
                      window.open(googleCalUrl, '_blank');
                    }}
                  >
                    <CalendarTodayOutlined sx={{ fontSize: { md: '1.2rem', lg: '1.4rem', xl: '1.6rem' }, color: '#000' }} />
                  </IconButton>
                  <IconButton
                    sx={{
                      backgroundColor: 'rgba(0, 0, 0, 0.15)',
                      border: '1px solid rgba(0, 0, 0, 0.25)',
                      width: { md: 38, lg: 45, xl: 51 },
                      height: { md: 38, lg: 45, xl: 51 },
                      color: '#000',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.25)',
                        borderColor: 'rgba(0, 0, 0, 0.35)',
                      },
                    }}
                    onClick={() => {
                      // Share functionality
                      if (navigator.share) {
                        navigator.share({
                          title: `${coupleData.names}`,
                          text: `Join us for our wedding on ${coupleData.date}!`,
                          url: window.location.href,
                        });
                      }
                    }}
                  >
                    <Box
                      component="svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      sx={{
                        width: { md: '1.2rem', lg: '1.4rem', xl: '1.6rem' },
                        height: { md: '1.2rem', lg: '1.4rem', xl: '1.6rem' },
                        color: '#000',
                      }}
                    >
                      <path d="M12 2L12 16M12 2L8 6M12 2L16 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M20 14V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </Box>
                  </IconButton>
                </Stack>
              </Box>

              {/* Location - Show actual venue if RSVP'd, otherwise show prompt */}
              <Box
                onClick={() => {
                  if ((user && hasRSVPed) || isBypassPin) {
                    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(coupleData.venue)}`;
                    window.open(mapsUrl, '_blank');
                  }
                }}
                sx={{
                  cursor: ((user && hasRSVPed) || isBypassPin) ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  '&:hover': ((user && hasRSVPed) || isBypassPin) ? { opacity: 0.8 } : {},
                }}
              >
                <LocationOnOutlined sx={{ color: '#666', fontSize: { md: '1.2rem', lg: '1.4rem', xl: '1.6rem' } }} />
                {((user && hasRSVPed) || isBypassPin) ? (
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#000',
                        fontSize: { md: '1rem', lg: '1.2rem', xl: '1.4rem' },
                        textDecoration: 'underline',
                      }}
                    >
                      {coupleData.venue}{coupleData.showVenueLocation && coupleData.venueLocation ? `, ${coupleData.venueLocation}` : ''}
                    </Typography>
                    <Typography sx={{ fontSize: { md: '1.2rem', lg: '1.4rem', xl: '1.6rem' } }}>
                      {coupleData.flag}
                    </Typography>
                  </Stack>
                ) : (
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#000',
                      fontSize: { md: '1.25rem', lg: '1.5rem', xl: '1.75rem' },
                    }}
                  >
                    <strong>RSVP</strong> to see location
                  </Typography>
                )}
              </Box>

              {/* Description */}
              <Typography
                variant="body1"
                sx={{
                  color: '#333',
                  fontSize: { md: '1rem', lg: '1.2rem', xl: '1.4rem' },
                  lineHeight: 1.6,
                  maxWidth: { md: 440, lg: 520, xl: 600 },
                }}
              >
                {wedding?.welcome_text}
              </Typography>

              {/* Countdown Timer */}
              <Box sx={{ mt: 1, width: '100%', maxWidth: { md: 440, lg: 520, xl: 600 } }}>
                <CountdownTimer targetDate={coupleData.weddingDate} />
              </Box>

              {/* RSVP Button - Desktop (Same width as CountdownTimer) */}
              {!isPageLoading && isPinVerified && !isBypassPin && (!user || !hasRSVPed) && (
                <Box sx={{ mt: 0, width: '100%', maxWidth: { md: 440, lg: 520, xl: 600 } }}>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{ width: '100%' }}
                  >
                    <Button
                      component={Link}
                      href={`/${weddingSlug}/rsvp`}
                      variant="contained"
                      size="large"
                      fullWidth
                      sx={{
                        backgroundColor: wedding?.primary_color || '#DE3F5E',
                        color: 'white',
                        py: 1.6,
                        fontSize: { md: '1rem', lg: '1.2rem' },
                        fontWeight: 600,
                        borderRadius: 1, // Matches mobile button style
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
                      fontSize: '0.9rem',
                      textAlign: 'center',
                      lineHeight: 1.4,
                      mt: 1.5
                    }}
                  >
                    Let us know you&apos;re coming by {coupleData.rsvpDeadline}
                  </Typography>
                </Box>
              )}

              {/* Guest List Section - Only show if user has RSVP'd OR using bypass PIN */}
              {!isPageLoading && ((user && hasRSVPed) || isBypassPin) && (
                <Box sx={{ mt: 2, width: '100%', maxWidth: { md: 440, lg: 520, xl: 600 } }}>
                  <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true, margin: '-100px' }}
                  >
                    <GuestList weddingId={weddingId} />
                  </motion.div>
                </Box>
              )}


            </Stack>
          </motion.div>
        </Box>

        {/* Right Side - Fixed Couple Image */}
        <Box
          sx={{
            position: 'fixed',
            right: 0,
            top: 0,
            width: '50%',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            pl: { md: 5, lg: 6.4, xl: 8 }, // Inner gap
            pr: { md: 5, lg: 6.4, xl: 8 }, // Outer padding
            pt: { md: 0, lg: 0, xl: 0 }, // Remove padding - let centering handle it
            pb: { md: 0, lg: 0, xl: 0 }, // Remove padding - let centering handle it
            gap: 3,
            alignItems: 'flex-start', // Align content to the left (towards center)
            pointerEvents: 'auto', // Ensure buttons are clickable
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}
          >
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                maxWidth: { md: 400, lg: 480, xl: 560 }, // Match text column width constraint
                aspectRatio: '1',
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
                src={wedding?.frame_image_url || "/images/frames/frame-1.png"}
                alt="Decorative frame"
                fill
                priority
                sizes="(max-width: 1200px) 500px, (max-width: 1600px) 600px, 700px"
                style={{
                  objectFit: 'contain',
                  objectPosition: 'center',
                  zIndex: 3,
                  pointerEvents: 'none',
                }}
              />

              {/* Couple Image */}
              <Box
                sx={{
                  position: 'absolute',
                  ...getFrameConfig(coupleData.frameImage),
                  overflow: 'hidden',
                  zIndex: 1,
                }}
              >
                <CoupleImageCarousel size={500} />
              </Box>
            </Box>
          </motion.div>

          {/* View Details Button */}
          {!isPageLoading && ((user && hasRSVPed) || isBypassPin) && (
            <Box sx={{ width: '100%', maxWidth: { md: 400, lg: 480, xl: 560 } }}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                style={{ width: '100%' }}
              >
                <Button
                  onClick={() => {
                    setIsNavigating(true);
                    router.push(`/${weddingSlug}/details`);
                  }}
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={isNavigating}
                  sx={{
                    backgroundColor: wedding?.primary_color || '#DE3F5E',
                    color: 'white',
                    py: { md: 1.6, lg: 1.8, xl: 2 },
                    fontSize: { md: '0.9rem', lg: '1rem', xl: '1.1rem' },
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
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );

  // Mobile layout component (existing layout)
  const MobileLayout = ({
    isNavigating,
    coupleData,
    isPageLoading,
    user,
    hasRSVPed,
    isPinVerified,
    isBypassPin,
    weddingId,
    weddingSlug,
    wedding,
    refreshAuth,
    setIsPinVerified,
    setIsNavigating,
    router,
    isMobile
  }: LayoutProps) => (
    <>
      {/* Loading Overlay */}
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
          <LoadingSpinner />
        </Box>
      )}
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
                maxWidth: { xs: 320, sm: 340 },
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
                src={wedding?.frame_image_url || "/images/frames/frame-1.png"}
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

              {/* Couple Image */}
              <Box
                sx={{
                  position: 'absolute',
                  ...getFrameConfig(coupleData.frameImage),
                  overflow: 'hidden',
                  zIndex: 1,
                }}
              >
                <CoupleImageCarousel images={coupleData.coupleImages} />
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
                  fontSize: { xs: '1rem', sm: '1.125rem' },
                  letterSpacing: '0.5px',
                }}
              >
                {coupleData.date}
              </Typography>

              {/* Names */}
              <Typography
                variant="h2"
                sx={{
                  fontSize: { xs: '2.5rem', sm: '3rem' },
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
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#000',
                      fontSize: { xs: '1.1rem', sm: '1.2rem' },
                      textDecoration: 'underline',
                    }}
                  >
                    {coupleData.venue}{coupleData.showVenueLocation && coupleData.venueLocation ? `, ${coupleData.venueLocation}` : ''}
                  </Typography>
                  <Typography sx={{ fontSize: { xs: '1.2rem', sm: '1.3rem' } }}>
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
      {!isPageLoading && ((user && hasRSVPed) || isBypassPin) && (
        <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 2, pb: 4 }}>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, margin: '-100px' }}
          >
            <GuestList weddingId={weddingId} />
          </motion.div>
        </Container>
      )}
    </>
  );

  // Check if infinite scroll layout should be used (desktop only)
  const useInfiniteScroll = !isMobile && wedding?.website_layout === 'infinite_scroll';

  // Render layout (Nested, Mobile, or Infinite Scroll)
  const renderLayout = () => {
    const commonProps: LayoutProps = {
      isNavigating,
      coupleData,
      isPageLoading,
      user,
      hasRSVPed,
      isPinVerified,
      isBypassPin,
      weddingId,
      weddingSlug,
      wedding,
      refreshAuth,
      setIsPinVerified,
      setIsNavigating,
      router,
      isMobile
    };

    if (useInfiniteScroll && wedding) {
      return (
        <>
          <div
            ref={headerRef}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 1000,
              transition: 'transform 0.3s ease-in-out',
            }}
          >
            <AppHeader variant="transparent" />
          </div>
          <InfiniteScrollLayout
            wedding={{
              id: wedding.id,
              couple_name: wedding.couple_name,
              wedding_date: wedding.wedding_date,
              wedding_date_display: wedding.wedding_date_display,
              venue_name: wedding.venue_name,
              venue_location: wedding.venue_location || '',
              show_venue_location: wedding.show_venue_location,
              venue_flag: wedding.venue_flag || '',
              rsvp_deadline: wedding.rsvp_deadline,
              welcome_text: wedding.welcome_text || undefined,
              primary_color: wedding.primary_color || undefined,
              couple_images: Array.isArray(wedding.couple_images) ? wedding.couple_images as string[] : undefined,
              frame_image_url: wedding.frame_image_url,
            }}
            weddingSlug={weddingSlug}
            isBypassPin={isBypassPin}
            hasRSVPed={hasRSVPed}
            rsvpResponse={rsvpResponse || undefined}
            user={user}
            CountdownTimer={CountdownTimer}
          />
        </>
      );
    }

    return isMobile ? <MobileLayout {...commonProps} /> : <DesktopLayout {...commonProps} />;
  };

  return (
    <OptimizedBackground
      src={wedding?.background_image || undefined}
      useAppDefault={!wedding?.background_image}
      className="min-h-screen flex flex-col"
    >
      {/* Loading Overlay */}
      {isNavigating && (
        <Box sx={{ position: 'fixed', inset: 0, bgcolor: 'rgba(255, 255, 255, 0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <LoadingSpinner />
        </Box>
      )}

      {renderLayout()}

      {/* Shared Modals and Menus */}
      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={() => setUserMenuAnchor(null)}
        PaperProps={{ sx: { mt: 1, minWidth: 150, borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' } }}
      >
        <MenuItem onClick={handleSignOut}>
          <LogoutIcon sx={{ mr: 1, fontSize: '1.1rem' }} />
          Sign Out
        </MenuItem>
      </Menu>

      <LoginModal open={loginDialogOpen} onClose={() => setLoginDialogOpen(false)} />

      {/* Sticky Bottom Actions (Mobile only) */}
      {isMobile && !isPageLoading && isPinVerified && !isBypassPin && (
        <Box sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 4, bgcolor: 'rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(10px)', borderTop: '1px solid rgba(0, 0, 0, 0.1)', px: 2, py: 2 }}>
          <Container maxWidth="sm">
            <Stack spacing={1.5} alignItems="center">
              {(!user || !hasRSVPed) ? (
                <>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} style={{ width: '100%' }}>
                    <Button
                      component={Link}
                      href={`/${weddingSlug}/rsvp`}
                      variant="contained"
                      fullWidth
                      sx={{ bgcolor: wedding?.primary_color || '#DE3F5E', py: 2, borderRadius: '32px' }}
                    >
                      RSVP
                    </Button>
                  </motion.div>
                  <Typography variant="body2" color="#777">
                    Let us know you&apos;re coming by {coupleData.rsvpDeadline}
                  </Typography>
                </>
              ) : (
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} style={{ width: '100%' }}>
                  <Button
                    onClick={() => { setIsNavigating(true); router.push(`/${weddingSlug}/details`); }}
                    variant="contained"
                    fullWidth
                    disabled={isNavigating}
                    sx={{ bgcolor: wedding?.primary_color || '#DE3F5E', py: 1.5, borderRadius: '16px' }}
                  >
                    View Details
                  </Button>
                </motion.div>
              )}
            </Stack>
          </Container>
        </Box>
      )}

      {isMobile && <Box sx={{ height: 100 }} />}
    </OptimizedBackground>
  );
}
