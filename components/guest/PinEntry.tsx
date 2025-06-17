'use client';

import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  TextField,
  Stack,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Alert,
} from '@mui/material';
import { motion } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';

interface PinEntryProps {
  onPinVerified: () => void;
}

const PinEntry = ({ onPinVerified }: PinEntryProps) => {
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState(false);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone' | null>(null);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [authError, setAuthError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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
      // Create a temporary guest auth when using default pin
      if (typeof window !== 'undefined') {
        const tempGuestInfo = {
          id: 'temp-guest',
          email: 'guest@example.com',
          name: 'Guest User',
          phone: '',
          weddingId: 'sim-kv',
          timestamp: Date.now()
        };
        localStorage.setItem('phera_guest_auth', JSON.stringify(tempGuestInfo));
        
        // Refresh auth context to pick up the new auth
        await refreshAuth();
        
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
    setAuthError('');
  };

  const handleAuthSubmit = async () => {
    setIsLoading(true);
    setAuthError('');

    try {
      if (loginMethod === 'email') {
        const { error } = await supabase.auth.signInWithOtp({
          email: email,
          options: {
            shouldCreateUser: true,
          }
        });
        if (error) throw error;
        setAuthError('Check your email for the login link!');
      } else if (loginMethod === 'phone') {
        const { error } = await supabase.auth.signInWithOtp({
          phone: phone,
          options: {
            shouldCreateUser: true,
          }
        });
        if (error) throw error;
        setAuthError('Check your phone for the verification code!');
      }
    } catch (error: any) {
      setAuthError(error.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setLoginDialogOpen(false);
    setLoginMethod(null);
    setEmail('');
    setPhone('');
    setAuthError('');
  };

  // Check for auth state changes and guest auth
  useEffect(() => {
    // Check for existing guest auth on component mount
    const checkGuestAuth = () => {
      if (typeof window !== 'undefined') {
        const guestAuthData = localStorage.getItem('phera_guest_auth');
        if (guestAuthData) {
          try {
            const guestInfo = JSON.parse(guestAuthData);
            const isRecent = Date.now() - guestInfo.timestamp < 24 * 60 * 60 * 1000;
            if (isRecent && guestInfo.email) {
              onPinVerified(); // Skip pin if guest is authenticated
              return;
            }
          } catch (error) {
            console.error('Error checking guest auth:', error);
          }
        }
      }
    };

    checkGuestAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        onPinVerified(); // Skip pin if authenticated
      }
    });

    return () => subscription.unsubscribe();
  }, [onPinVerified]);

  // Background and overlay setup similar to home page
  const activeBackground = '/images/backgrounds/blue-clouds.jpg';
  const activeOverlay = '/images/overlays/petals-birds.png';

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

      {/* Header Section with Logo */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 3,
          pt: 2,
          px: 2,
        }}
      >
        <Container maxWidth="sm">
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-start',
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
          py: 4,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          style={{ width: '100%', textAlign: 'center' }}
        >
          {/* Lotus Logo */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mb: 4,
            }}
          >
            <Box
              component="img"
              src="/logo-lotus-flame.svg"
              alt="Lotus Logo"
              sx={{
                height: { xs: 80, sm: 100 },
                width: 'auto',
                filter: 'brightness(0)', // Makes it black
              }}
            />
          </Box>

          {/* Heading */}
          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              color: '#000',
              mb: 2,
              fontSize: { xs: '2rem', sm: '2.5rem' },
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
              mb: 6,
              fontSize: { xs: '1rem', sm: '1.1rem' },
              lineHeight: 1.5,
              maxWidth: 400,
              mx: 'auto',
              fontWeight: 500,
            }}
          >
            Enter your invitation code to see all the details and RSVP for our celebration
          </Typography>

          {/* Pin Input Section */}
          <Stack 
            direction="row" 
            spacing={{ xs: 2, sm: 3 }}
            justifyContent="center"
            mb={6}
          >
            {pin.map((digit, index) => (
              <TextField
                key={index}
                inputRef={inputRefs[index]}
                value={digit}
                onChange={(e) => handlePinChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                sx={{
                  width: { xs: 60, sm: 80 },
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: 2,
                    height: { xs: 60, sm: 80 },
                    fontSize: { xs: '1.5rem', sm: '2rem' },
                    fontWeight: 600,
                    textAlign: 'center',
                    border: error ? '2px solid #f44336' : '1px solid rgba(0,0,0,0.12)',
                    '&:hover': {
                      border: error ? '2px solid #f44336' : '1px solid rgba(0,0,0,0.25)',
                    },
                    '&.Mui-focused': {
                      border: error ? '2px solid #f44336' : '2px solid #000',
                      boxShadow: error ? '0 0 0 4px rgba(244, 67, 54, 0.1)' : '0 0 0 4px rgba(0, 0, 0, 0.1)',
                    },
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
                  mb: 4,
                  fontWeight: 500,
                }}
              >
                Invalid invitation code. Please try again.
              </Typography>
            </motion.div>
          )}

          {/* Decorative Lotus at bottom */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mb: 6,
            //   opacity: 0.7,
            }}
          >
            <Box
              component="img"
              src="/logo-lotus-flame.svg"
              alt="Decorative Lotus"
              sx={{
                height: { xs: 80, sm: 100 },
                width: 'auto',
                filter: 'brightness(0)',
                transform: 'rotate(180deg)',
              }}
              
            />
          </Box>

          {/* Continue Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Button
              onClick={handleContinue}
              disabled={!isPinComplete}
              sx={{
                backgroundColor: '#DE3F5E',
                color: '#fff',
                borderRadius: '32px',
                px: { xs: 6, sm: 8 },
                py: { xs: 1.5, sm: 2 },
                fontSize: { xs: '1rem', sm: '1.1rem' },
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                width: '100%',
                maxWidth: 300,
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
          </motion.div>

          {/* Or Divider */}
          <Box 
            sx={{ 
              my: 4, 
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                maxWidth: 300,
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
                  fontSize: '0.9rem',
                  textTransform: 'lowercase',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  px: 2,
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <Button
              onClick={handleLogin}
              sx={{
                backgroundColor: '#DE3F5E',
                color: '#fff',
                borderRadius: '32px',
                px: { xs: 6, sm: 8 },
                py: { xs: 1.5, sm: 2 },
                fontSize: { xs: '1rem', sm: '1.1rem' },
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                width: '100%',
                maxWidth: 300,
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
        </motion.div>
      </Container>

      {/* Login Dialog */}
      <Dialog
        open={loginDialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(0,0,0,0.1)',
          }
        }}
      >
        <DialogTitle sx={{ 
          color: '#000', 
          fontWeight: 700,
          fontSize: '1.5rem',
          textAlign: 'center',
          pb: 1,
        }}>
          Welcome Back!
        </DialogTitle>
        <DialogContent sx={{ px: 4, py: 2 }}>
          <Typography 
            variant="body1" 
            sx={{ 
              color: '#000', 
              mb: 3,
              textAlign: 'center',
              fontSize: '1rem',
            }}
          >
            Choose how you'd like to sign in
          </Typography>

          {!loginMethod ? (
            <Stack spacing={2}>
              <Button
                variant="outlined"
                fullWidth
                size="large"
                onClick={() => setLoginMethod('email')}
                sx={{
                  borderColor: '#DE3F5E',
                  color: '#DE3F5E',
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 600,
                  '&:hover': {
                    borderColor: '#C8365A',
                    backgroundColor: 'rgba(222, 63, 94, 0.05)',
                  },
                }}
              >
                Continue with Email
              </Button>
              <Button
                variant="outlined"
                fullWidth
                size="large"
                onClick={() => setLoginMethod('phone')}
                sx={{
                  borderColor: '#DE3F5E',
                  color: '#DE3F5E',
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 600,
                  '&:hover': {
                    borderColor: '#C8365A',
                    backgroundColor: 'rgba(222, 63, 94, 0.05)',
                  },
                }}
              >
                Continue with Phone
              </Button>
            </Stack>
          ) : (
            <Stack spacing={3}>
              {loginMethod === 'email' ? (
                <TextField
                  label="Email Address"
                  type="email"
                  fullWidth
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      '& fieldset': {
                        borderColor: 'rgba(0,0,0,0.2)',
                      },
                      '&:hover fieldset': {
                        borderColor: '#DE3F5E',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#DE3F5E',
                      },
                    },
                  }}
                />
              ) : (
                <TextField
                  label="Phone Number"
                  type="tel"
                  fullWidth
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter your phone number with country code"
                  helperText="Include country code (e.g., +1 for US, +91 for India)"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      '& fieldset': {
                        borderColor: 'rgba(0,0,0,0.2)',
                      },
                      '&:hover fieldset': {
                        borderColor: '#DE3F5E',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#DE3F5E',
                      },
                    },
                  }}
                />
              )}
              
              {authError && (
                <Alert 
                  severity={authError.includes('Check your') ? 'success' : 'error'}
                  sx={{ borderRadius: 2 }}
                >
                  {authError}
                </Alert>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 4, pb: 4, pt: 2 }}>
          <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
            <Button
              onClick={loginMethod ? () => setLoginMethod(null) : handleCloseDialog}
              variant="outlined"
              sx={{
                borderColor: 'rgba(0,0,0,0.2)',
                color: '#666',
                flex: 1,
                py: 1,
                borderRadius: 2,
                textTransform: 'none',
                '&:hover': {
                  borderColor: 'rgba(0,0,0,0.4)',
                  backgroundColor: 'rgba(0,0,0,0.05)',
                },
              }}
            >
              {loginMethod ? 'Back' : 'Cancel'}
            </Button>
            {loginMethod && (
              <Button
                onClick={handleAuthSubmit}
                disabled={isLoading || (loginMethod === 'email' ? !email : !phone)}
                variant="contained"
                sx={{
                  backgroundColor: '#DE3F5E',
                  color: '#fff',
                  flex: 1,
                  py: 1,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  '&:hover': {
                    backgroundColor: '#C8365A',
                  },
                  '&:disabled': {
                    backgroundColor: 'rgba(222, 63, 94, 0.3)',
                  },
                }}
              >
                {isLoading ? 'Sending...' : `Send ${loginMethod === 'email' ? 'Login Link' : 'Code'}`}
              </Button>
            )}
          </Stack>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PinEntry; 