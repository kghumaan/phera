'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  TextField,
  Stack,
  Typography,
  Divider,
  Alert,
  IconButton,
  Box,
} from '@mui/material';
import {
  Google as GoogleIcon,
  Close as CloseIcon,
  Phone as PhoneIcon,
} from '@mui/icons-material';
import { signInWithGoogle, signInWithPhone, verifyOTP } from '@/lib/supabase/auth-service';

interface LoginDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  redirectTo?: string;
}

export default function LoginDialog({ open, onClose, onSuccess, redirectTo }: LoginDialogProps) {
  const [step, setStep] = useState<'login' | 'otp'>('login');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClose = () => {
    setStep('login');
    setPhone('');
    setOtp('');
    setError('');
    setLoading(false);
    onClose();
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    
    try {
      const result = await signInWithGoogle(redirectTo);
      if (result.success) {
        onSuccess?.();
        handleClose();
      } else {
        setError(result.error || 'Failed to sign in with Google');
      }
    } catch (error) {
      setError('Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneSignIn = async () => {
    if (!phone.trim()) {
      setError('Please enter a phone number');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const result = await signInWithPhone(phone);
      if (result.success) {
        setStep('otp');
      } else {
        setError(result.error || 'Failed to send verification code');
      }
    } catch (error) {
      setError('Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerification = async () => {
    if (!otp.trim()) {
      setError('Please enter the verification code');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const result = await verifyOTP(phone, otp);
      if (result.success) {
        onSuccess?.();
        handleClose();
      } else {
        setError(result.error || 'Invalid verification code');
      }
    } catch (error) {
      setError('Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const formatPhoneForDisplay = (phone: string) => {
    // Simple formatting for display purposes - you can enhance this
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length >= 10) {
      return `(${cleaned.slice(-10, -7)}) ${cleaned.slice(-7, -4)}-${cleaned.slice(-4)}`;
    }
    return phone;
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          p: 1,
        }
      }}
    >
      <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            {step === 'login' ? 'Welcome Back' : 'Enter Verification Code'}
          </Typography>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ pt: 2 }}>
        {step === 'login' ? (
          <Stack spacing={3}>
            {error && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                {error}
              </Alert>
            )}
            
            {/* Google Sign In */}
            <Button
              variant="outlined"
              fullWidth
              size="large"
              startIcon={<GoogleIcon />}
              onClick={handleGoogleSignIn}
              disabled={loading}
              sx={{
                borderColor: '#dadce0',
                color: '#3c4043',
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 500,
                '&:hover': {
                  backgroundColor: '#f8f9fa',
                  borderColor: '#dadce0',
                },
              }}
            >
              Continue with Google
            </Button>
            
            <Divider sx={{ my: 2 }}>
              <Typography variant="body2" color="text.secondary">
                or
              </Typography>
            </Divider>
            
            {/* Phone Sign In */}
            <Stack spacing={2}>
              <TextField
                label="Phone Number"
                placeholder="+1 (555) 123-4567"
                fullWidth
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '& input::placeholder': {
                      color: '#C2C2C2 !important',
                    },
                  }
                }}
              />
              <Button
                variant="contained"
                fullWidth
                size="large"
                startIcon={<PhoneIcon />}
                onClick={handlePhoneSignIn}
                disabled={loading}
                sx={{
                  backgroundColor: '#E91E63',
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 600,
                  '&:hover': {
                    backgroundColor: '#C2185B',
                  },
                }}
              >
                Send Verification Code
              </Button>
            </Stack>
          </Stack>
        ) : (
          <Stack spacing={3}>
            {error && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                {error}
              </Alert>
            )}
            
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              We've sent a 6-digit verification code to {formatPhoneForDisplay(phone)}
            </Alert>
            
            <TextField
              label="Verification Code"
              placeholder="123456"
              fullWidth
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              variant="outlined"
              inputProps={{
                maxLength: 6,
                style: { textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem' }
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '& input::placeholder': {
                    color: '#C2C2C2 !important',
                  },
                }
              }}
            />
            
            <Stack spacing={2}>
              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={handleOTPVerification}
                disabled={loading || otp.length !== 6}
                sx={{
                  backgroundColor: '#E91E63',
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 600,
                  '&:hover': {
                    backgroundColor: '#C2185B',
                  },
                }}
              >
                Verify Code
              </Button>
              
              <Button
                variant="text"
                fullWidth
                onClick={() => setStep('login')}
                sx={{
                  textTransform: 'none',
                  color: '#666',
                }}
              >
                Back to Login
              </Button>
            </Stack>
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
} 