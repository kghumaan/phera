'use client';

import {
  Box,
  Container,
  Typography,
  Button,
  TextField,
  Stack,
} from '@mui/material';
import { motion } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import OptimizedBackground from '@/components/ui/OptimizedBackground';

interface AdminPinEntryProps {
  onPinVerified: () => void;
}

const AdminPinEntry = ({ onPinVerified }: AdminPinEntryProps) => {
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState(false);

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

    // Admin PIN code
    const ADMIN_PIN = '7777';

    if (enteredPin === ADMIN_PIN) {
      // Set admin authentication flag
      if (typeof window !== 'undefined') {
        localStorage.setItem('phera_admin_authenticated', 'true');
        localStorage.setItem('phera_admin_timestamp', Date.now().toString());

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

  // Disable scrolling on this screen
  useEffect(() => {
    // Disable scrolling when component mounts
    document.body.style.overflow = 'hidden';

    // Re-enable scrolling when component unmounts
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <OptimizedBackground
      src="/images/backgrounds/blue-clouds.jpg"
      className="min-h-screen flex flex-col"
    >
      {/* Desktop Alert */}
      {/* <DesktopAlert /> */}

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
          minHeight: { xs: 'calc(100vh - 96px)', sm: 'calc(100vh - 112px)', md: 'calc(100vh - 128px)' },
          pt: { xs: 12, sm: 14, md: 16 },
          pb: { xs: 4, sm: 6 },
          px: { xs: 3, sm: 4 },
          gap: { xs: 4, sm: 6 },
        }}
      >
        {/* Top Section - Title */}
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
            Admin Access
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
            Enter the admin code to access the wedding management dashboard
          </Typography>
        </motion.div>

        {/* Middle Section - PIN Input */}
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
                    borderRadius: '50%',
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
                Invalid admin code. Please try again.
              </Typography>
            </motion.div>
          )}
        </motion.div>

        {/* Bottom Section - Continue Button */}
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
              borderRadius: '16px',
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
        </motion.div>
      </Container>
    </OptimizedBackground>
  );
};

export default AdminPinEntry;
