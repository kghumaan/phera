'use client';

import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  TextField,
  Stack,
  InputAdornment,
} from '@mui/material';
import { motion } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';
import OptimizedBackground from '@/components/ui/OptimizedBackground';
import LoginModal from '@/components/auth/LoginModal';

interface PinEntryProps {
  onPinVerified: () => void;
}



const PinEntry = ({ onPinVerified }: PinEntryProps) => {
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState(false);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);


  const { refreshAuth } = useAuth();
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const handlePinChange = (index: number, value: string) => {
    // Only allow single digits
    if (value.length > 1) return;
    if (value && !/^[0-9]$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    setError(false);

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Handle backspace
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleContinue = async () => {
    const enteredPin = pin.join('');
    if (enteredPin === '1111') {
      // Set pin verification flag instead of creating fake auth
      if (typeof window !== 'undefined') {
        localStorage.setItem('phera_pin_verified', 'true');
        localStorage.setItem('phera_pin_timestamp', Date.now().toString());
        
        // Call the callback to notify parent component
        onPinVerified();
      }
    } else {
      setError(true);
      // Clear pin after error
      setPin(['', '', '', '']);
      inputRefs[0].current?.focus();
    }
  };

  const isPinComplete = pin.every(digit => digit !== '');

  const handleLogin = () => {
    setLoginDialogOpen(true);
  };

  const handleLoginSuccess = () => {
    setLoginDialogOpen(false);
    onPinVerified();
  };

  // Disable scrolling on this screen
  useEffect(() => {
    // Disable scrolling when component mounts
    document.body.style.overflow = 'hidden';
    
    // Re-enable scrolling when component unmounts
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Check for auth state changes and pin verification
  useEffect(() => {
    // Check for existing pin verification on component mount
    const checkPinVerification = () => {
      if (typeof window !== 'undefined') {
        const pinVerified = localStorage.getItem('phera_pin_verified');
        const pinTimestamp = localStorage.getItem('phera_pin_timestamp');
        
        if (pinVerified === 'true' && pinTimestamp) {
          try {
            const timestamp = parseInt(pinTimestamp);
            const isRecent = Date.now() - timestamp < 24 * 60 * 60 * 1000; // 24 hours
            if (isRecent) {
              onPinVerified(); // Skip pin if recently verified
              return;
            } else {
              // Remove expired pin verification
              localStorage.removeItem('phera_pin_verified');
              localStorage.removeItem('phera_pin_timestamp');
            }
          } catch (error) {
            console.error('Error checking pin verification:', error);
          }
        }
      }
    };

    checkPinVerification();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        onPinVerified(); // Skip pin if authenticated
      }
    });

    return () => subscription.unsubscribe();
  }, [onPinVerified]);

  // Background setup similar to home page
  return (
    <OptimizedBackground 
      useAppDefault={true}
      className="min-h-screen flex flex-col"
    >
      {/* Header Section with Logo */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 3,
          pt: { xs: 2, sm: 3 },
          px: { xs: 3, sm: 4 },
        }}
      >
        <Container maxWidth="sm">
                      <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%',
              }}
            >
            {/* Logo */}
            <Box
              component="img"
              src="/logo-stacked.svg"
              alt="Phera Logo"
              sx={{
                height: { xs: 80, sm: 100, md: 120 },
                width: 'auto',
                filter: 'brightness(0)',
              }}
            />
          </Box>
        </Container>
      </Box>

      {/* Main Content */}
      <Container 
        maxWidth="sm" 
        sx={{ 
          position: 'relative', 
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          pt: { xs: 8, sm: 8 }, // Account for header
          pb: { xs: 4, sm: 6 },
          px: { xs: 3, sm: 4 },
          gap: { xs: 4, sm: 6 },
        }}
      >
        {/* Top Section - Logo and Title */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          style={{ 
            width: '100%', 
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {/* Lotus Logo */}
          {/* <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mb: { xs: 2, sm: 3 },
            }}
          >
            <Box
              component="img"
              src="/logo-lotus-flame.svg"
              alt="Lotus Logo"
              sx={{
                height: { xs: 50, sm: 60, md: 80 },
                width: 'auto',
                filter: 'brightness(0)', // Makes it black
              }}
            />
          </Box> */}

          {/* Heading */}
          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              color: '#000',
              mb: { xs: 1, sm: 1.5 },
              fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
              letterSpacing: '0.02em',
            }}
          >
            YOU'RE INVITED!
          </Typography>

          {/* Subtitle */}
          <Typography
            variant="body1"
            sx={{
              color: '#000',
              fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' },
              lineHeight: 1.4,
              maxWidth: { xs: 280, sm: 350 },
              mx: 'auto',
              fontWeight: 500,
            }}
          >
            Enter your invitation code to see all the details and RSVP for our celebration
          </Typography>
        </motion.div>

        {/* Middle Section - PIN Input (Centered) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          style={{ 
            width: '100%', 
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Pin Input Section */}
          <Stack 
            direction="row" 
            spacing={{ xs: 1.5, sm: 2, md: 3 }}
            justifyContent="center"
            mb={4}
          >
            {pin.map((digit, index) => (
              <TextField
                key={index}
                inputRef={inputRefs[index]}
                value={digit}
                onChange={(e) => handlePinChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                sx={{
                  width: { xs: 55, sm: 70, md: 85 },
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: 3,
                    height: { xs: 55, sm: 70, md: 85 },
                    fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.25rem' },
                    fontWeight: 700,
                    textAlign: 'center',
                    border: error ? '3px solid #f44336' : '2px solid rgba(0,0,0,0.15)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    '&:hover': {
                      border: error ? '3px solid #f44336' : '2px solid rgba(0,0,0,0.3)',
                      boxShadow: '0 6px 16px rgba(0, 0, 0, 0.15)',
                    },
                    '&.Mui-focused': {
                      border: error ? '3px solid #f44336' : '3px solid #DE3F5E',
                      boxShadow: error ? '0 0 0 6px rgba(244, 67, 54, 0.15)' : '0 0 0 6px rgba(222, 63, 94, 0.15)',
                      transform: 'scale(1.05)',
                    },
                    transition: 'all 0.2s ease-in-out',
                  },
                  '& .MuiOutlinedInput-input': {
                    textAlign: 'center',
                    padding: 0,
                  },
                  '& fieldset': {
                    border: 'none',
                  },
                }}
                inputProps={{
                  maxLength: 1,
                  inputMode: 'numeric',
                  pattern: '[0-9]*',
                  style: { 
                    textAlign: 'center',
                    fontSize: 'inherit',
                    fontWeight: 'inherit',
                    color: '#000',
                  }
                }}
              />
            ))}
          </Stack>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: '#f44336',
                  mt: { xs: 3, sm: 4 },
                  fontWeight: 600,
                  fontSize: { xs: '0.9rem', sm: '1rem' },
                  textAlign: 'center',
                  backgroundColor: 'rgba(244, 67, 54, 0.1)',
                  px: 3,
                  py: 1,
                  borderRadius: '20px',
                  border: '1px solid rgba(244, 67, 54, 0.2)',
                }}
              >
                Invalid invitation code. Please try again.
              </Typography>
            </motion.div>
          )}
        </motion.div>

        {/* Bottom Section - Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          {/* Continue Button */}
          <Button
            onClick={handleContinue}
            disabled={!isPinComplete}
            sx={{
              backgroundColor: '#DE3F5E',
              color: '#fff',
              borderRadius: '32px',
              px: { xs: 4, sm: 6, md: 8 },
              py: { xs: 1.25, sm: 1.5, md: 2 },
              fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' },
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              width: '100%',
              maxWidth: { xs: 280, sm: 300 },
              boxShadow: '0 4px 20px rgba(222, 63, 94, 0.3)',
              '&:hover': {
                backgroundColor: '#C8365A',
                boxShadow: '0 6px 25px rgba(222, 63, 94, 0.4)',
                transform: 'translateY(-1px)',
              },
              '&:disabled': {
                backgroundColor: 'rgba(222, 63, 94, 0.3)',
                color: 'rgba(255,255,255,0.5)',
                boxShadow: 'none',
                transform: 'none',
              },
              transition: 'all 0.2s ease-in-out',
            }}
          >
            Continue
          </Button>

          {/* Or Divider */}
          <Box 
            sx={{ 
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              my: { xs: 1, sm: 2 },
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                maxWidth: { xs: 280, sm: 300 },
                gap: 2,
              }}
            >
              {/* Left line */}
              <Box
                sx={{
                  flex: 1,
                  height: '1px',
                  backgroundColor: 'rgba(0, 0, 0, 0.2)',
                }}
              />
              
              {/* Or text */}
              <Typography
                variant="body2"
                sx={{
                  color: '#000',
                  fontWeight: 500,
                  fontSize: { xs: '0.8rem', sm: '0.9rem' },
                  textTransform: 'lowercase',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  px: { xs: 1.5, sm: 2 },
                  py: 0.5,
                  borderRadius: '12px',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                  flexShrink: 0,
                }}
              >
                or
              </Typography>
              
              {/* Right line */}
              <Box
                sx={{
                  flex: 1,
                  height: '1px',
                  backgroundColor: 'rgba(0, 0, 0, 0.2)',
                }}
              />
            </Box>
          </Box>

          {/* Login Button */}
          <Button
            onClick={handleLogin}
            sx={{
              backgroundColor: '#DE3F5E',
              color: '#fff',
              borderRadius: '32px',
              px: { xs: 4, sm: 6, md: 8 },
              py: { xs: 1.25, sm: 1.5, md: 2 },
              fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' },
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              width: '100%',
              maxWidth: { xs: 280, sm: 300 },
              boxShadow: '0 4px 20px rgba(222, 63, 94, 0.3)',
              '&:hover': {
                backgroundColor: '#C8365A',
                boxShadow: '0 6px 25px rgba(222, 63, 94, 0.4)',
                transform: 'translateY(-1px)',
              },
              transition: 'all 0.2s ease-in-out',
            }}
          >
            Login
          </Button>
        </motion.div>
      </Container>

      {/* Login Modal */}
      <LoginModal
        open={loginDialogOpen}
        onClose={() => setLoginDialogOpen(false)}
        onSuccess={handleLoginSuccess}
      />
    </OptimizedBackground>
  );
};

export default PinEntry; 