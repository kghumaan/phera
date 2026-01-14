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
  MenuItem
} from '@mui/material';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import {
  LocationOnOutlined,
  CalendarTodayOutlined,
  Logout as LogoutIcon
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
import { useParams, useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { useWedding } from '@/lib/contexts/WeddingContext';
import { format, parseISO } from 'date-fns';

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
        px: { xs: 4, sm: 4.5, md: 5, lg: 6.5, xl: 8 },
        py: { xs: 1.5, sm: 1.75, md: 2, lg: 2.5, xl: 3 },
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '100%', // Let parent wrapper control width
      }}
    >
      <Stack
        direction="row"
        spacing={{ xs: 3, sm: 3.5, md: 3.5, lg: 4.5, xl: 6 }}
        justifyContent="center"
        alignItems="center"
      >
        {timeUnits.map((unit, index) => (
          <Stack
            key={unit.label}
            alignItems="center"
            spacing={0}
            sx={{
              minWidth: { xs: 35, sm: 40, md: 45, lg: 60, xl: 75 }, // Smoother progression
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
                  md: '1.75rem',  // 900px+ (small desktop) - reduced from 2.25rem
                  lg: '2.5rem',   // 1200px+ (desktop) - reduced from 2.75rem
                  xl: '3.25rem'   // 1536px+ (large desktop)
                },
                lineHeight: 1.2,
                fontFamily: 'Outfit, sans-serif', // Match Figma font
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
                  md: '0.875rem',  // small desktop - reduced from 1rem
                  lg: '1rem',      // desktop - reduced from 1.125rem
                  xl: '1.25rem'    // large desktop
                },
                lineHeight: 1.4,
                fontFamily: 'Outfit, sans-serif', // Match Figma font
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
  const { user, isLoading, hasRSVPed, rsvpResponse, isCheckingRSVP, signOut, refreshAuth } = useAuth();
  
  // Wedding data from context
  const { wedding, isLoading: weddingLoading } = useWedding();
  
  // Use data from context if available, otherwise fallback to config
  const coupleData = {
    names: wedding?.couple_name || WEDDING_CONFIG.coupleNames,
    date: wedding?.wedding_date_display || WEDDING_CONFIG.weddingDateDisplay,
    weddingDate: wedding?.wedding_date || WEDDING_CONFIG.weddingDate,
    venue: wedding?.venue_name || WEDDING_CONFIG.venue,
    flag: wedding?.venue_flag || WEDDING_CONFIG.venueFlag,
    rsvpDeadline: wedding?.rsvp_deadline || WEDDING_CONFIG.rsvpDeadline,
    coupleImage: wedding?.couple_image_url || WEDDING_CONFIG.coupleImage,
    frameImage: wedding?.frame_image_url || WEDDING_CONFIG.frameImage,
    coupleImages: wedding?.couple_images || []
  };

  // Pin verification state
  const [isPinVerified, setIsPinVerified] = useState(false);
  const [isCheckingPin, setIsCheckingPin] = useState(true);
  const [isBypassPin, setIsBypassPin] = useState(false);

  // Consolidated loading state - wait for ALL checks to complete
  // IMPORTANT: Also consider loading if user exists but RSVP hasn't been checked yet
  // This prevents a flash where auth completes but RSVP check hasn't started
  // Exception: bypass PIN users don't need RSVP check
  const needsRSVPCheck = user && !isBypassPin && !hasRSVPed && rsvpResponse === null && !isCheckingRSVP;
  const isPageLoading = isLoading || isCheckingPin || isCheckingRSVP || needsRSVPCheck || weddingLoading;
  
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
    }, 5000); // 5 second safety timeout for all checks

    return () => clearTimeout(safetyTimeout);
  }, [isPageLoading]);

  // Check for pin verification on component mount and auth changes
  useEffect(() => {
    const checkPinVerification = () => {
      if (typeof window !== 'undefined') {
        // FIRST: If user is authenticated, consider PIN verified (auth bypass)
        // Note: We can check this even while isLoading, since we have the user object
        if (user) {
          setIsPinVerified(true);
          setIsCheckingPin(false); // Important: Stop checking PIN when user is authenticated
          return;
        }
        
        // CHECK: Handle bypass PIN case - create temporary guest auth
        const bypassFlag = localStorage.getItem('phera_bypass_rsvp');
        const bypassPinVerified = localStorage.getItem('phera_pin_verified');
        const bypassPinTimestamp = localStorage.getItem('phera_pin_timestamp');
        
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
              // Restore PIN verification state
              localStorage.setItem('phera_pin_verified', 'true');
              localStorage.setItem('phera_pin_timestamp', restoredTimestamp);
              localStorage.setItem('phera_allows_plus_one', restoredAllowsPlusOne || 'false');
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
        
        // Check existing PIN verification
        const pinVerified = localStorage.getItem('phera_pin_verified');
        const pinTimestamp = localStorage.getItem('phera_pin_timestamp');
        
        if (pinVerified === 'true' && pinTimestamp) {
          try {
            const timestamp = parseInt(pinTimestamp);
            const isRecent = Date.now() - timestamp < 24 * 60 * 60 * 1000; // 24 hours
            if (isRecent) {
              setIsPinVerified(true);
              
              // Also check if this is a bypass PIN
              const existingBypassFlag = localStorage.getItem('phera_bypass_rsvp');
              if (existingBypassFlag === 'true') {
                setIsBypassPin(true);
              }
            } else {
              // Remove expired pin verification
              localStorage.removeItem('phera_pin_verified');
              localStorage.removeItem('phera_pin_timestamp');
              localStorage.removeItem('phera_allows_plus_one');
              localStorage.removeItem('phera_bypass_rsvp');
              setIsPinVerified(false);
              setIsBypassPin(false);
            }
          } catch (error) {
            console.error('Error checking pin verification:', error);
            setIsPinVerified(false);
            setIsBypassPin(false);
          }
        } else {
          setIsPinVerified(false);
          setIsBypassPin(false);
        }
      }
      setIsCheckingPin(false);
    };

    // Early return if user is authenticated - no need to check PIN
    // We check user without waiting for isLoading since user object is available immediately
    if (user) {
      setIsPinVerified(true);
      setIsCheckingPin(false);
      return;
    }

    checkPinVerification();
  }, [user]); // Only depend on user, not isLoading

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
      needsRSVPCheck,
      hasRSVPed,
      rsvpResponse,
      user: !!user,
      isPinVerified,
      reason: isLoading ? 'auth loading'
            : isCheckingPin ? 'checking PIN'
            : isCheckingRSVP ? 'checking RSVP'
            : needsRSVPCheck ? 'waiting for RSVP check to start'
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
  const DesktopLayout = () => (
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
            pl: { md: 6, lg: 8, xl: 10 }, // Outer padding
            pr: { md: 18, lg: 20, xl: 22 }, // Inner gap - User set
            // Align with top of the centered image on the right
            // Image max sizes: md: 500px, lg: 600px, xl: 700px
            // Top of image = 50vh - (image height / 2)
            pt: {
              md: 'calc(50vh - 250px)', // 500px / 2 = 250px
              lg: 'calc(50vh - 300px)', // 600px / 2 = 300px
              xl: 'calc(50vh - 350px)'  // 700px / 2 = 350px
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
            <Stack spacing={4} alignItems="flex-start" textAlign="left" sx={{ width: '100%', maxWidth: { md: 500, lg: 600, xl: 700 } }}>
              {/* Names - Large italic serif */}
              <Typography
                variant="h2"
                sx={{
                  fontSize: { md: '3.5rem', lg: '4.5rem', xl: '5.5rem' },
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
                      fontSize: { md: '1.5rem', lg: '1.75rem', xl: '2rem' },
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
                      width: { md: 48, lg: 56, xl: 64 },
                      height: { md: 48, lg: 56, xl: 64 },
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
                    <CalendarTodayOutlined sx={{ fontSize: { md: '1.5rem', lg: '1.75rem', xl: '2rem' }, color: '#000' }} />
                  </IconButton>
                  <IconButton
                    sx={{
                      backgroundColor: 'rgba(0, 0, 0, 0.15)',
                      border: '1px solid rgba(0, 0, 0, 0.25)',
                      width: { md: 48, lg: 56, xl: 64 },
                      height: { md: 48, lg: 56, xl: 64 },
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
                        width: { md: '1.5rem', lg: '1.75rem', xl: '2rem' },
                        height: { md: '1.5rem', lg: '1.75rem', xl: '2rem' },
                        color: '#000',
                      }}
                    >
                      <path d="M12 2L12 16M12 2L8 6M12 2L16 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M20 14V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
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
                <LocationOnOutlined sx={{ color: '#666', fontSize: { md: '1.5rem', lg: '1.75rem', xl: '2rem' } }} />
                {((user && hasRSVPed) || isBypassPin) ? (
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#000',
                        fontSize: { md: '1.25rem', lg: '1.5rem', xl: '1.75rem' },
                        textDecoration: 'underline',
                      }}
                    >
                      {coupleData.venue}
                    </Typography>
                    <Typography sx={{ fontSize: { md: '1.5rem', lg: '1.75rem', xl: '2rem' } }}>
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
                  fontSize: { md: '1.25rem', lg: '1.5rem', xl: '1.75rem' },
                  lineHeight: 1.6,
                  maxWidth: { md: 550, lg: 650, xl: 750 },
                }}
              >
                Come celebrate with us under the stars. A little romance, a lot of partying. You won&apos;t want to miss it.
              </Typography>

              {/* Countdown Timer */}
              <Box sx={{ mt: 1, width: '100%', maxWidth: { md: 550, lg: 650, xl: 750 } }}>
                <CountdownTimer targetDate={coupleData.weddingDate} />
              </Box>

              {/* RSVP Button - Desktop (Same width as CountdownTimer) */}
              {!isPageLoading && isPinVerified && !isBypassPin && (!user || !hasRSVPed) && (
                <Box sx={{ mt: 0, width: '100%', maxWidth: { md: 550, lg: 650, xl: 750 } }}>
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
                        backgroundColor: '#DE3F5E',
                        color: 'white',
                        py: 2,
                        fontSize: { md: '1.25rem', lg: '1.5rem' },
                        fontWeight: 600,
                        borderRadius: '32px', // Matches mobile button style
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
                <Box sx={{ mt: 2, width: '100%', maxWidth: { md: 550, lg: 650, xl: 750 } }}>
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
            pl: { md: 6, lg: 8, xl: 10 }, // Inner gap
            pr: { md: 6, lg: 8, xl: 10 }, // Outer padding
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
                maxWidth: { md: 500, lg: 600, xl: 700 }, // Match text column width constraint
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
                src="/images/frames/frame-27.png"
                alt="Decorative frame"
                fill
                priority
                sizes="(max-width: 1200px) 500px, (max-width: 1600px) 600px, 700px"
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
                <CoupleImageCarousel size={500} />
              </Box>
            </Box>
          </motion.div>

          {/* View Details Button */}
          {!isPageLoading && ((user && hasRSVPed) || isBypassPin) && (
            <Box sx={{ width: '100%', maxWidth: { md: 500, lg: 600, xl: 700 } }}>
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
                    backgroundColor: '#DE3F5E',
                    color: 'white',
                    py: { md: 2, lg: 2.25, xl: 2.5 },
                    fontSize: { md: '1.125rem', lg: '1.25rem', xl: '1.375rem' },
                    fontWeight: 700,
                    borderRadius: '16px',
                    textTransform: 'uppercase',
                    letterSpacing: '6.25%',
                    fontFamily: 'Outfit',
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
  const MobileLayout = () => (
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
                    {coupleData.venue}
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

  return (
    <OptimizedBackground
      useAppDefault={true}
      className="min-h-screen flex flex-col"
    >
      {/* Render desktop or mobile layout based on breakpoint */}
      {isMobile ? <MobileLayout /> : <DesktopLayout />}

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
      {/* Only show on mobile, desktop has inline buttons */}
      {isMobile && !isPageLoading && isPinVerified && !isBypassPin && (!user || !hasRSVPed) && (
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
                  href={`/${weddingSlug}/rsvp`}
                  variant="contained"
                  size="large"
                  fullWidth
                  sx={{
                    backgroundColor: '#DE3F5E',
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
                }}
              >
                Let us know you&apos;re coming by {coupleData.rsvpDeadline}
              </Typography>
            </Stack>
          </Container>
        </Box>
      )}

      {/* View Details Button - Show when user has RSVP'd OR using bypass PIN */}
      {/* Only show on mobile, desktop has inline buttons */}
      {isMobile && !isPageLoading && ((user && hasRSVPed) || isBypassPin) && (
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
                  onClick={() => {
                    setIsNavigating(true);
                    router.push(`/${weddingSlug}/details`);
                  }}
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={isNavigating}
                  sx={{
                    backgroundColor: '#DE3F5E',
                    color: 'white',
                    py: 1.5,
                    fontSize: '1rem',
                    fontWeight: 700,
                    borderRadius: '16px',
                    textTransform: 'uppercase',
                    letterSpacing: '6.25%',
                    fontFamily: 'Outfit',
                    '&:hover': {
                      backgroundColor: '#C8365A',
                    },
                  }}
                >
                  View Details
                </Button>
              </motion.div>
            </Stack>
          </Container>
        </Box>
      )}

      {/* Add bottom padding to prevent content from being hidden behind sticky footer - only on mobile */}
      {isMobile && <Box sx={{ height: 100 }} />}
    </OptimizedBackground>
  );
} 