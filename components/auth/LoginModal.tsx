'use client';

import { 
  Box, 
  Typography, 
  Button, 
  TextField,
  Stack,
  Dialog,
  DialogContent,
} from '@mui/material';
import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { sendEmailOTP, verifyEmailOTP } from '@/lib/supabase/auth-service';
import { useAuth } from '@/lib/contexts/AuthContext';

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const LoginModal = ({ open, onClose, onSuccess }: LoginModalProps) => {
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [authError, setAuthError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const { refreshAuth } = useAuth();

  const handleSendOTP = async () => {
    setIsLoading(true);
    setAuthError('');

    try {
      if (email && email.trim()) {
        // Send email OTP
        const result = await sendEmailOTP(email.trim());
        
        if (result.success) {
          // Move to OTP input step
          setStep('otp');
        } else {
          throw new Error(result.error || 'Failed to send verification code');
        }
      } else {
        setAuthError('Please enter an email address');
      }
    } catch (error: any) {
      console.error('Send OTP error:', error);
      setAuthError(error.message || 'Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setIsLoading(true);
    setAuthError('');

    try {
      if (otpCode && otpCode.trim()) {
        // Verify the OTP code
        const result = await verifyEmailOTP(email.trim(), otpCode.trim());
        
        if (result.success) {
          // Close modal first
          handleCloseDialog();
          
          // Call success callback immediately to bypass PIN entry
          onSuccess?.();
          
          // Refresh auth context after a small delay to prevent race conditions
          setTimeout(async () => {
            await refreshAuth();
          }, 200);
        } else {
          throw new Error(result.error || 'Invalid verification code');
        }
      } else {
        setAuthError('Please enter the verification code');
      }
    } catch (error: any) {
      console.error('Verify OTP error:', error);
      setAuthError(error.message || 'Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setEmail('');
    setOtpCode('');
    setAuthError('');
    setStep('email');
    onClose();
  };

  const handleBackToEmail = () => {
    setOtpCode('');
    setAuthError('');
    setStep('email');
  };

  return (
    <Dialog
      open={open}
      onClose={handleCloseDialog}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          backgroundColor: '#FFFFFF',
          margin: { xs: 2, sm: 3 },
          maxWidth: { xs: '321px', sm: '400px' },
        }
      }}
    >
      <DialogContent sx={{ px: 2, py: 2 }}>
        <Stack spacing={2} alignItems="center">
          {/* Header Section */}
          <Stack spacing={1} alignItems="center" sx={{ width: '100%' }}>
            <Typography 
              variant="h5"
              sx={{ 
                color: '#141414',
                fontWeight: 600,
                fontSize: '26px',
                lineHeight: '1.26em',
                textAlign: 'center',
                fontFamily: 'Outfit, sans-serif',
                borderRadius: '16px',
              }}
            >
              {step === 'email' && 'Welcome Back!'}
              {step === 'otp' && 'Enter Verification Code'}
            </Typography>
            
            {step === 'email' && (
              <Typography 
                variant="body1" 
                sx={{ 
                  color: '#858585',
                  fontSize: '16px',
                  lineHeight: '1.5em',
                  textAlign: 'center',
                  fontFamily: 'Outfit, sans-serif',
                  fontWeight: 400,
                }}
              >
                Enter the email address you provided in your RSVP to login.
              </Typography>
            )}
            
            {step === 'otp' && (
              <Typography 
                variant="body1" 
                sx={{ 
                  color: '#858585',
                  fontSize: '16px',
                  lineHeight: '1.5em',
                  textAlign: 'center',
                  fontFamily: 'Outfit, sans-serif',
                  fontWeight: 400,
                }}
              >
                We sent a 6-digit code to <strong>{email}</strong>
              </Typography>
            )}
            

          </Stack>

          {/* Form Section */}
          <Stack spacing={2} sx={{ width: '100%' }}>
            {step === 'email' && (
              <>
                <TextField
                  variant="outlined"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendOTP()}
                  disabled={isLoading}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px',
                      backgroundColor: '#F5F5F5',
                      fontSize: '16px',
                      color: '#141414',
                      fontFamily: 'Outfit, sans-serif',
                      '& fieldset': {
                        borderColor: 'transparent',
                      },
                      '&:hover fieldset': {
                        borderColor: '#DE3F5E',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#DE3F5E',
                        borderWidth: '2px',
                      },
                    },
                    '& .MuiOutlinedInput-input::placeholder': {
                      color: '#858585',
                      opacity: 1,
                    }
                  }}
                />

                {authError && (
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: '#DE3F5E',
                      fontSize: '14px',
                      textAlign: 'center',
                      fontFamily: 'Outfit, sans-serif',
                    }}
                  >
                    {authError}
                  </Typography>
                )}

                <Button
                  onClick={handleSendOTP}
                  variant="contained"
                  disabled={isLoading}
                  fullWidth
                  sx={{
                    backgroundColor: '#DE3F5E',
                    py: 1.5,
                    borderRadius: '16px',
                    textTransform: 'uppercase',
                    fontSize: '14px',
                    fontWeight: 700,
                    fontFamily: 'Outfit, sans-serif',
                    '&:hover': {
                      backgroundColor: '#C73652',
                    },
                    color: '#FFFFFF',
                  }}
                >
                  {isLoading ? 'Sending...' : 'Send Verification Code'}
                </Button>
              </>
            )}

            {step === 'otp' && (
              <>
                <TextField
                  variant="outlined"
                  placeholder="Enter 6-digit code"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleVerifyOTP()}
                  disabled={isLoading}
                  inputProps={{
                    maxLength: 6,
                    style: { 
                      textAlign: 'center',
                      fontSize: '24px',
                      letterSpacing: '8px',
                      fontWeight: 'bold',
                      fontFamily: 'monospace'
                    }
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px',
                      backgroundColor: '#F5F5F5',
                      fontSize: '24px',
                      fontFamily: 'monospace',
                      color: '#141414',
                      '& fieldset': {
                        borderColor: 'transparent',
                      },
                      '&:hover fieldset': {
                        borderColor: '#DE3F5E',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#DE3F5E',
                        borderWidth: '2px',
                      },
                    },
                    '& .MuiOutlinedInput-input::placeholder': {
                      color: '#858585',
                      opacity: 1,
                      letterSpacing: 'normal',
                      fontSize: '16px',
                      fontFamily: 'Outfit, sans-serif'
                    }
                  }}
                />

                {authError && (
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: '#DE3F5E',
                      fontSize: '14px',
                      textAlign: 'center',
                      fontFamily: 'Outfit, sans-serif',
                    }}
                  >
                    {authError}
                  </Typography>
                )}

                <Button
                  onClick={handleVerifyOTP}
                  variant="contained"
                  disabled={isLoading || otpCode.length !== 6}
                  fullWidth
                  sx={{
                    backgroundColor: '#DE3F5E',
                    py: 1.5,
                    borderRadius: '16px',
                    textTransform: 'uppercase',
                    fontSize: '14px',
                    fontWeight: 700,
                    color: '#FFFFFF',
                    fontFamily: 'Outfit, sans-serif',
                    '&:hover': {
                      backgroundColor: '#C73652',
                    },
                    '&:disabled': {
                      backgroundColor: '#E0E0E0',
                      color: '#A0A0A0',
                    },
                  }}
                >
                  {isLoading ? 'Verifying...' : 'Verify & Login'}
                </Button>

                <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                  <Button
                    onClick={handleBackToEmail}
                    variant="outlined"
                    fullWidth
                    sx={{
                      borderColor: '#DE3F5E',
                      color: '#DE3F5E',
                      py: 1,
                      borderRadius: '16px',
                      textTransform: 'uppercase',
                      fontSize: '12px',
                      fontWeight: 700,
                      fontFamily: 'Outfit, sans-serif',
                      '&:hover': {
                        borderColor: '#C73652',
                        backgroundColor: 'rgba(222, 63, 94, 0.04)',
                      },
                    }}
                  >
                    Back
                  </Button>
                  
                  <Button
                    onClick={handleSendOTP}
                    variant="outlined"
                    disabled={isLoading}
                    fullWidth
                    sx={{
                      borderColor: '#858585',
                      color: '#858585',
                      py: 1,
                      borderRadius: '16px',
                      textTransform: 'uppercase',
                      fontSize: '12px',
                      fontWeight: 700,
                      fontFamily: 'Outfit, sans-serif',
                      '&:hover': {
                        borderColor: '#666666',
                        backgroundColor: 'rgba(133, 133, 133, 0.04)',
                      },
                    }}
                  >
                    Resend Code
                  </Button>
                </Stack>
              </>
            )}


          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
};

export default LoginModal; 