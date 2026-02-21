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
import { sendEmailOTP, verifyEmailOTP, signInWithGoogle, signInWithPhone, verifyOTP } from '@/lib/supabase/auth-service';
import { useAuth } from '@/lib/contexts/AuthContext';

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  redirectTo?: string;
}

const LoginModal = ({ open, onClose, onSuccess, redirectTo }: LoginModalProps) => {
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [authError, setAuthError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'email' | 'email-otp' | 'phone' | 'phone-otp'>('email');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const { refreshAuth } = useAuth();

  const handleSendOTP = async () => {
    setIsLoading(true);
    setAuthError('');

    try {
      if (email && email.trim()) {
        // Send email OTP
        const result = await sendEmailOTP(email.trim());
        
        if (result.success) {
          // Move to Emails OTP input step
          setStep('email-otp');
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

  const handleSendPhoneOTP = async () => {
    setIsLoading(true);
    setAuthError('');

    try {
      if (phoneNumber && phoneNumber.trim()) {
        const result = await signInWithPhone(phoneNumber.trim());
        
        if (result.success) {
          setStep('phone-otp');
        } else {
          throw new Error(result.error || 'Failed to send verification code');
        }
      } else {
        setAuthError('Please enter a phone number');
      }
    } catch (error: any) {
      console.error('Send Phone OTP error:', error);
      setAuthError(error.message || 'Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setAuthError('');
    
    try {
      const result = await signInWithGoogle(redirectTo);
      if (result.success) {
        // Google sign in redirects - onSuccess won't fire for OAuth (full page redirect)
        onSuccess?.();
        handleCloseDialog();
      } else {
        setAuthError(result.error || 'Failed to sign in with Google');
      }
    } catch (error: any) {
      setAuthError('Failed to sign in with Google');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setIsLoading(true);
    setAuthError('');

    try {
      if (otpCode && otpCode.trim()) {
        // Verify the EMAIL OTP code
        const result = await verifyEmailOTP(email.trim(), otpCode.trim());
        
        if (result.success) {
          handleCloseDialog();
          onSuccess?.();
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

  const handleVerifyPhoneOTP = async () => {
    setIsLoading(true);
    setAuthError('');

    try {
      if (phoneOtp && phoneOtp.trim()) {
        const result = await verifyOTP(phoneNumber.trim(), phoneOtp.trim());
        
        if (result.success) {
          handleCloseDialog();
          onSuccess?.();
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
      console.error('Verify Phone OTP error:', error);
      setAuthError(error.message || 'Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setEmail('');
    setOtpCode('');
    setPhoneNumber('');
    setPhoneOtp('');
    setAuthError('');
    setStep('email');
    onClose();
  };

  const handleBack = () => {
    setOtpCode('');
    setPhoneOtp('');
    setAuthError('');
    if (step === 'email-otp') setStep('email');
    if (step === 'phone-otp') setStep('phone');
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
              {(step === 'email' || step === 'phone') && 'Welcome Back!'}
              {(step === 'email-otp' || step === 'phone-otp') && 'Enter Verification Code'}
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

            {step === 'phone' && (
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
                Enter your phone number to login or check your RSVP.
              </Typography>
            )}
            
            {step === 'email-otp' && (
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

                <Box sx={{ position: 'relative', py: 1, textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ textAlign: 'center', color: '#858585', backgroundColor: '#fff', position: 'relative', zIndex: 1, display: 'inline-block', px: 2 }}>
                    OR
                  </Typography>
                  <Box sx={{ position: 'absolute', left: 0, right: 0, top: '50%', height: '1px', backgroundColor: '#E0E0E0', zIndex: 0 }} />
                </Box>

                <Stack spacing={2}>
                    <Button
                        variant="outlined"
                        fullWidth
                        onClick={handleGoogleSignIn}
                        disabled={isLoading}
                        startIcon={
                            <Box 
                                component="img" 
                                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                                sx={{ width: 18, height: 18, mr: 1 }} 
                                alt="Google"
                            />
                        }
                        sx={{
                            borderColor: '#E0E0E0',
                            color: '#141414',
                            py: 1.5,
                            borderRadius: '16px',
                            textTransform: 'none',
                            fontSize: '16px',
                            fontWeight: 500,
                            fontFamily: 'Outfit, sans-serif',
                            '&:hover': {
                                borderColor: '#B0B0B0',
                                backgroundColor: '#F5F5F5',
                            },
                        }}
                    >
                        Continue with Google
                    </Button>
                    <Button
                        variant="text"
                        onClick={() => setStep('phone')}
                        disabled={isLoading}
                        sx={{
                            color: '#666',
                            textTransform: 'none',
                            fontSize: '14px',
                            fontFamily: 'Outfit, sans-serif',
                            '&:hover': {
                                color: '#141414',
                                backgroundColor: 'transparent',
                                textDecoration: 'underline',
                            },
                        }}
                    >
                        Use Phone Number instead
                    </Button>
                </Stack>
              </>
            )}

            {step === 'phone' && (
              <>
                <TextField
                  variant="outlined"
                  placeholder="Enter your phone (+1...)"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendPhoneOTP()}
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
                  onClick={handleSendPhoneOTP}
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

                <Button
                    variant="text"
                    onClick={() => setStep('email')}
                    disabled={isLoading}
                    sx={{
                        color: '#666',
                        textTransform: 'none',
                        fontSize: '14px',
                        fontFamily: 'Outfit, sans-serif',
                        mt: 2,
                        '&:hover': {
                            color: '#141414',
                            backgroundColor: 'transparent',
                            textDecoration: 'underline',
                        },
                    }}
                >
                    Use Email Address instead
                </Button>
              </>
            )}

            {(step === 'email-otp' || step === 'phone-otp') && (
              <>
                <TextField
                  variant="outlined"
                  placeholder="Enter 6-digit code"
                  value={step === 'email-otp' ? otpCode : phoneOtp}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                    if (step === 'email-otp') setOtpCode(val);
                    else setPhoneOtp(val);
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && !isLoading && (step === 'email-otp' ? handleVerifyOTP() : handleVerifyPhoneOTP())}
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
                  onClick={step === 'email-otp' ? handleVerifyOTP : handleVerifyPhoneOTP}
                  variant="contained"
                  disabled={isLoading || (step === 'email-otp' ? otpCode.length : phoneOtp.length) !== 6}
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
                    onClick={handleBack}
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
                    onClick={step === 'email-otp' ? handleSendOTP : handleSendPhoneOTP}
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