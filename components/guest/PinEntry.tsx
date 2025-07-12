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
    // Handle multiple digits (paste or fast typing)
    if (value.length > 1) {
      // Extract only digits and take up to 4
      const digits = value.replace(/[^0-9]/g, '').slice(0, 4);
      if (digits.length > 0) {
        const newPin = ['', '', '', ''];
        // Fill the pin array with the digits
        for (let i = 0; i < digits.length && i < 4; i++) {
          newPin[i] = digits[i];
        }
        setPin(newPin);
        setError(false);
        
        // Focus the next empty field or the last field
        const nextIndex = Math.min(digits.length, 3);
        inputRefs[nextIndex].current?.focus();
      }
      return;
    }

    // Handle single digit input
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

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const digits = pastedText.replace(/[^0-9]/g, '').slice(0, 4);
    
    if (digits.length > 0) {
      const newPin = ['', '', '', ''];
      for (let i = 0; i < digits.length && i < 4; i++) {
        newPin[i] = digits[i];
      }
      setPin(newPin);
      setError(false);
      
      // Focus the next empty field or the last field
      const nextIndex = Math.min(digits.length, 3);
      inputRefs[nextIndex].current?.focus();
    }
  };

  const handleContinue = async () => {
    const enteredPin = pin.join('');
    
    // PIN codes for different guest types
    const PIN_WITH_PLUS_ONE = '7834';
    const PIN_NO_PLUS_ONE = '2591';
    
    if (enteredPin === PIN_WITH_PLUS_ONE || enteredPin === PIN_NO_PLUS_ONE) {
      // Set pin verification flag and store plus-one eligibility
      if (typeof window !== 'undefined') {
        localStorage.setItem('phera_pin_verified', 'true');
        localStorage.setItem('phera_pin_timestamp', Date.now().toString());
        localStorage.setItem('phera_allows_plus_one', enteredPin === PIN_WITH_PLUS_ONE ? 'true' : 'false');
        
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
      src="/images/backgrounds/pearl.png"
      className="min-h-screen flex flex-col"
    >
      {/* Top Left Decorative Image */}
      <Box
        component="img"
        src="/images/overlays/entry-topleft.png"
        alt="Decorative Top Left"
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 1,
          width: { xs: '120px', sm: '160px', md: '200px' },
          height: 'auto',
          pointerEvents: 'none',
        }}
      />

      {/* Top Right Decorative Image */}
      <Box
        component="img"
        src="/images/overlays/entry-topright.png"
        alt="Decorative Top Right"
        sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          zIndex: 1,
          width: { xs: '120px', sm: '160px', md: '200px' },
          height: 'auto',
          pointerEvents: 'none',
        }}
      />

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
              fontFamily: 'var(--font-instrument-serif), serif',
              fontWeight: 400,
              color: '#000',
              mb: { xs: 1, sm: 1.5 },
              fontSize: { xs: '2.5rem', sm: '2.75rem', md: '3rem' },
              lineHeight: 1.4,
              textAlign: 'center',
              fontStyle: 'italic',
            }}
          >
            You're Invited!
          </Typography>

          {/* Subtitle */}
          <Typography
            variant="body1"
            sx={{
              fontFamily: 'var(--font-outfit), sans-serif',
              color: '#000',
              fontSize: { xs: '1.125rem', sm: '1.125rem', md: '1.125rem' },
              lineHeight: 1.5,
              maxWidth: { xs: 355, sm: 400 },
              mx: 'auto',
              fontWeight: 400,
              textAlign: 'center',
              px: 2,
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
            spacing={{ xs: 1.5, sm: 1.5, md: 1.5 }}
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
                onPaste={handlePaste}
                sx={{
                  width: { xs: 72, sm: 72, md: 73 },
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#FFFFFF',
                    borderRadius: '50%', // Perfect circle
                    height: { xs: 72, sm: 72, md: 73 },
                    fontSize: { xs: '1.5rem', sm: '1.5rem', md: '1.5rem' },
                    fontFamily: 'var(--font-outfit), sans-serif',
                    fontWeight: 700,
                    textAlign: 'center',
                    border: error ? '1px solid #f44336' : '1px solid #D6D6D6',
                    boxShadow: 'none',
                    '&:hover': {
                      border: error ? '1px solid #f44336' : '1px solid rgba(0,0,0,0.3)',
                    },
                    '&.Mui-focused': {
                      border: error ? '1px solid #f44336' : '1px solid #141414',
                      boxShadow: 'none',
                    },
                    transition: 'all 0.2s ease-in-out',
                  },
                  '& .MuiOutlinedInput-input': {
                    textAlign: 'center',
                    padding: 0,
                    letterSpacing: '4.17%',
                    textTransform: 'uppercase',
                  },
                  '& fieldset': {
                    border: 'none',
                  },
                }}
                inputProps={{
                  inputMode: 'numeric',
                  pattern: '[0-9]*',
                  style: { 
                    textAlign: 'center',
                    fontSize: 'inherit',
                    fontWeight: 'inherit',
                    color: pin[index] ? '#000' : 'rgba(0, 0, 0, 0.2)',
                  }
                }}
                placeholder="0"
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
              backgroundColor: '#141414',
              color: '#FFFFFF',
              borderRadius: '80px',
              px: '20px',
              py: '12px',
              fontSize: '1rem',
              fontFamily: 'var(--font-outfit), sans-serif',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '6.25%',
              width: '100%',
              maxWidth: '354px',
              boxShadow: 'none',
              '&:hover': {
                backgroundColor: '#2A2A2A',
                boxShadow: 'none',
              },
              '&:disabled': {
                backgroundColor: 'rgba(20, 20, 20, 0.3)',
                color: 'rgba(255,255,255,0.5)',
                boxShadow: 'none',
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
                  fontFamily: 'var(--font-outfit), sans-serif',
                  fontWeight: 400,
                  fontSize: { xs: '1rem', sm: '1rem' },
                  textTransform: 'uppercase',
                  letterSpacing: '6.25%',
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
              backgroundColor: '#FFFFFF',
              color: '#141414',
              borderRadius: '80px',
              px: '20px',
              py: '12px',
              fontSize: '1rem',
              fontFamily: 'var(--font-outfit), sans-serif',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '6.25%',
              width: '100%',
              maxWidth: '354px',
              border: '1px solid #D6D6D6',
              boxShadow: 'none',
              '&:hover': {
                backgroundColor: '#F5F5F5',
                border: '1px solid #B0B0B0',
                boxShadow: 'none',
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