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
        px: 4,
        py: 1.5,
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: 400,
      }}
    >
      <Stack 
        direction="row" 
        spacing={3}
        justifyContent="center" 
        alignItems="center"
      >
        {timeUnits.map((unit, index) => (
          <Stack 
            key={unit.label} 
            alignItems="center" 
            spacing={0}
            sx={{ 
              minWidth: { xs: 35, sm: 40 }, // Fixed width for each column
            }}
          >
            <Typography
              variant="h4"
              sx={{
                fontWeight: 400, // Regular weight like in Figma
                color: '#000000',
                fontSize: { xs: '1.5rem', sm: '1.5rem' }, // 24px from Figma
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
                fontSize: { xs: '0.85rem', sm: '0.75rem' }, // 12px from Figma
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

// Sample couple data - this would come from your backend/config
const coupleData = {
  names: "Simran & Karanvir",
  date: "4-6 JANUARY, 2026",
  weddingDate: "2026-01-04T00:00:00", // ISO format for countdown
  venue: "The Palayana, Hua Hin, Thailand",
  flag: "🇹🇭",
  rsvpDeadline: "31 July, 2025",
          coupleImage: "/images/couple/couple-1.jpg", // Using optimized couple image
        frameImage: "/images/frames/frame-27.png" // Optimized frame image
};

// Couple Image Carousel Component
const CoupleImageCarousel = ({ size = 300 }: { size?: number }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const coupleImages = [
    '/images/couple/couple-1.jpg',
    '/images/couple/couple-2.jpg'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      
      setTimeout(() => {
        setCurrentImageIndex((prev) => (prev + 1) % coupleImages.length);
        setIsTransitioning(false);
      }, 300); // Half of transition duration
      
    }, 6000); // Change image every 6 seconds

    return () => clearInterval(interval);
  }, [coupleImages.length]);

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Box
        component="img"
        src={coupleImages[currentImageIndex]}
        alt="Couple Photo"
        sx={{
          width: '100%',
          height: '100%',
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [currentBackground, setCurrentBackground] = useState(0);
  const [customBackground, setCustomBackground] = useState<string>('');
  
  // Authentication state from context
  const { user, isLoading, hasRSVPed, rsvpResponse, isCheckingRSVP, signOut } = useAuth();
  
  // Pin verification state
  const [isPinVerified, setIsPinVerified] = useState(false);
  const [isCheckingPin, setIsCheckingPin] = useState(true);
  
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
  };

  const handlePinVerified = () => {
    setIsPinVerified(true);
    
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

  // Check for pin verification on component mount
  useEffect(() => {
    const checkPinVerification = () => {
      if (typeof window !== 'undefined') {
        // First check for auth errors from callback
        const urlParams = new URLSearchParams(window.location.search);
        const authError = urlParams.get('auth_error');
        
        if (authError) {
          console.error('Authentication error:', authError);
          // You could show a toast notification here
          // Clean up URL params
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.delete('auth_error');
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
            } else {
              // Remove expired pin verification
              localStorage.removeItem('phera_pin_verified');
              localStorage.removeItem('phera_pin_timestamp');
              setIsPinVerified(false);
            }
          } catch (error) {
            console.error('Error checking pin verification:', error);
            setIsPinVerified(false);
          }
        } else {
          setIsPinVerified(false);
        }
      }
      setIsCheckingPin(false);
    };

    checkPinVerification();
  }, []);

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

  // Show pin entry screen if pin is not verified and not loading
  if (!isCheckingPin && !isPinVerified) {
    return <PinEntry onPinVerified={handlePinVerified} />;
  }

  // Show loading screen while checking authentication or pin
  if (isLoading || isCheckingPin) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
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
        onLoginClick={() => setLoginDialogOpen(true)}
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
                  maxWidth: 320,
                  aspectRatio: '1',
                  mx: 'auto',
                  mb: 2,
                }}
              >
              {/* Frame Background */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  backgroundImage: `url(/images/frames/frame-27.png)`,
                  backgroundSize: 'contain',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
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
                  fontSize: '1rem',
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
                      fontSize: '1.1rem',
                      textDecoration: 'underline',
                    }}
                  >
                    {coupleData.venue}
                  </Typography>
                  <Typography sx={{ fontSize: '1.2rem' }}>
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

      {/* Wedding Community Section - Only show if user has RSVP'd */}
      {!isLoading && user && !isCheckingRSVP && hasRSVPed && (
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

      {/* Sticky RSVP Footer - Show when pin verified and either not authenticated or authenticated but not RSVP'd */}
      {!isLoading && !isCheckingPin && isPinVerified && (!user || (user && !isCheckingRSVP && !hasRSVPed)) && (
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
                Let us know you're coming by {coupleData.rsvpDeadline}
              </Typography>
            </Stack>
          </Container>
        </Box>
      )}

      {/* Change RSVP Button - Show when user has RSVP'd */}
      {!isLoading && user && !isCheckingRSVP && hasRSVPed && (
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
                    py: 1.5,
                    fontSize: '1rem',
                    fontWeight: 700,
                    borderRadius: '80px',
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