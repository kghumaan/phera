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
import LoginDialog from '@/components/auth/LoginDialog';
import { useAuth } from '@/lib/contexts/AuthContext';

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
    { label: 'Months', value: timeLeft.months },
    { label: 'Days', value: timeLeft.days },
    { label: 'Hours', value: timeLeft.hours },
    { label: 'Mins', value: timeLeft.minutes },
    { label: 'Secs', value: timeLeft.seconds }
  ];

  return (
    <Box
      sx={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 3,
        px: 4,
        py: 2,
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.2)',
        width: '100%',
        maxWidth: 500,
      }}
    >
      <Stack 
        direction="row" 
        spacing={{ xs: 2, sm: 3 }} 
        justifyContent="center" 
        alignItems="center"
        flexWrap="wrap"
      >
        {timeUnits.map((unit, index) => (
          <Box key={unit.label} sx={{ display: 'flex', alignItems: 'center' }}>
            <Stack alignItems="center" spacing={0.5}>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  color: '#000',
                  fontSize: { xs: '1.5rem', sm: '1.75rem' },
                  lineHeight: 1,
                }}
              >
                {unit.value.toString().padStart(2, '0')}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: '#000',
                  fontWeight: 500,
                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                {unit.label}
              </Typography>
            </Stack>
            {index < timeUnits.length - 1 && (
                          <Typography
              sx={{
                color: '#000',
                fontWeight: 700,
                fontSize: '1.5rem',
                mx: 1,
                display: { xs: 'none', sm: 'block' }
              }}
            >
              :
            </Typography>
            )}
          </Box>
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
  rsvpDeadline: "15 July, 2025",
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
  const [customOverlay, setCustomOverlay] = useState<string>('');
  
  // Authentication state from context
  const { user, isLoading, hasRSVPed, isCheckingRSVP, signOut } = useAuth();
  
  // Login dialog state
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  
  // Use optimized BlueClouds background only
  const backgrounds = [
    '/images/backgrounds/rose.jpg'
  ];

  const handleBackgroundChange = (backgroundPath: string) => {
    setCustomBackground(backgroundPath);
  };

  const handleOverlayChange = (overlayPath: string) => {
    setCustomOverlay(overlayPath);
  };

  const activeBackground = customBackground || backgrounds[currentBackground];
  const activeOverlay = customOverlay || '/images/overlays/petals-birds.png';

  const handleSignOut = async () => {
    await signOut();
    setUserMenuAnchor(null);
  };

  const handlePinVerified = () => {
    // Pin verification is no longer needed since we use auth context
    // This function is kept for the PinEntry component but doesn't do anything
  };

  // Show pin entry screen if user is not authenticated and not loading
  if (!isLoading && !user) {
    return <PinEntry onPinVerified={handlePinVerified} />;
  }

  // Show loading screen while checking authentication
  if (isLoading) {
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
    <Box
      sx={{
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Dynamic Background */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0,
        }}
      >
        <motion.div
          key={activeBackground}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url(${activeBackground})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundAttachment: 'fixed',
          }}
        />
      </Box>

      {/* Decorative Overlay */}
      {activeOverlay && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1,
            backgroundImage: `url(${activeOverlay})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundAttachment: 'fixed',
            opacity: 0.6,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Header Section */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 3,
          pt: 2,
        }}
      >
        <Container maxWidth="sm">
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
            }}
          >
            {/* Logo */}
            <Box
              component="img"
              src="/logo.svg"
              alt="Phera Logo"
              sx={{
                height: { xs: 32, sm: 40 },
                width: 'auto',
                filter: 'brightness(0)',
              }}
            />
            
            {/* Login Button / User Avatar */}
            {isLoading ? (
              <Box sx={{ width: 80, height: 40 }} /> // Loading placeholder
            ) : user ? (
              <Chip
                avatar={
                  <Avatar
                    sx={{
                      backgroundColor: user.avatar_color,
                      color: 'white',
                      fontWeight: 600,
                      fontSize: '0.8rem',
                    }}
                  >
                    {user.initials}
                  </Avatar>
                }
                label={user.name.split(' ')[0]}
                onClick={(e) => setUserMenuAnchor(e.currentTarget)}
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  color: '#333',
                  fontWeight: 500,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 1)',
                  },
                }}
              />
            ) : (
              <Button
                variant="contained"
                onClick={() => setLoginDialogOpen(true)}
                sx={{
                  backgroundColor: '#000',
                  color: '#fff',
                  borderRadius: '24px',
                  px: 3,
                  py: 1,
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  textTransform: 'none',
                  minWidth: 80,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  '&:hover': {
                    backgroundColor: '#333',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                  },
                }}
              >
                Login
              </Button>
            )}
          </Box>
        </Container>
      </Box>

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
                maxWidth: 400,
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
                <Stack direction="row" alignItems="center" spacing={1} justifyContent="center">
                  <LocationOnOutlined 
                    sx={{ 
                      color: '#000', 
                      fontSize: '1.2rem' 
                    }} 
                  />
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#000',
                      fontSize: '1.1rem',
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

      {/* Wedding Community Section */}
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

      {/* Login Dialog */}
      <LoginDialog
        open={loginDialogOpen}
        onClose={() => setLoginDialogOpen(false)}
        onSuccess={() => {
          // Optional: Show success message or refresh data
          console.log('Login successful');
        }}
      />

      {/* Sticky RSVP Footer - Only show if user hasn't RSVP'd and not loading */}
      {!isLoading && user && !isCheckingRSVP && !hasRSVPed && (
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

      {/* View Events Button - Show when user has RSVP'd */}
      {!isLoading && user && !isCheckingRSVP && hasRSVPed && (
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
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{ width: '100%' }}
            >
              <Button
                component={Link}
                href="/events"
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
                View Events
              </Button>
            </motion.div>
          </Container>
        </Box>
      )}

      {/* Add bottom padding to prevent content from being hidden behind sticky footer */}
      <Box sx={{ height: 100 }} />
    </Box>
  );
} 