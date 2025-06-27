'use client';

import { 
  Box, 
  Typography, 
  Button, 
  TextField,
  Stack,
  Dialog,
  DialogContent,
  Select,
  MenuItem,
  FormControl,
} from '@mui/material';
import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const countryCodes = [
  { code: '+1', country: 'US/CA', flag: '🇺🇸' },
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+81', country: 'Japan', flag: '🇯🇵' },
  { code: '+86', country: 'China', flag: '🇨🇳' },
  { code: '+7', country: 'Russia', flag: '🇷🇺' },
  { code: '+55', country: 'Brazil', flag: '🇧🇷' },
  { code: '+52', country: 'Mexico', flag: '🇲🇽' },
  { code: '+27', country: 'South Africa', flag: '🇿🇦' },
  { code: '+234', country: 'Nigeria', flag: '🇳🇬' },
  { code: '+60', country: 'Malaysia', flag: '🇲🇾' },
  { code: '+66', country: 'Thailand', flag: '🇹🇭' },
  { code: '+84', country: 'Vietnam', flag: '🇻🇳' },
  { code: '+62', country: 'Indonesia', flag: '🇮🇩' },
  { code: '+63', country: 'Philippines', flag: '🇵🇭' },
];

const LoginModal = ({ open, onClose, onSuccess }: LoginModalProps) => {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [authError, setAuthError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpType, setOtpType] = useState<'email' | 'sms' | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  const handleAuthSubmit = async () => {
    setIsLoading(true);
    setAuthError('');

    try {
      if (email && email.trim()) {
        // Use email authentication - no OTP verification needed, just magic link
        const { error } = await supabase.auth.signInWithOtp({
          email: email.trim(),
          options: {
            shouldCreateUser: true,
          }
        });
        if (error) throw error;
        
        // For email, we don't need OTP verification - just show success screen
        setEmailSent(true);
      } else if (phone && phone.trim()) {
        // Use phone authentication - combine selected country code with phone number
        const fullPhoneNumber = `${countryCode}${phone.trim().replace(/\D/g, '')}`; // Remove all non-digits and add selected country code
        console.log('Sending OTP to phone:', fullPhoneNumber); // Debug log
        
        const { error } = await supabase.auth.signInWithOtp({
          phone: fullPhoneNumber,
          options: {
            shouldCreateUser: true,
          }
        });
        if (error) throw error;
        
        setOtpType('sms');
        setOtpSent(true);
        // Don't show success message here, let the UI handle it
      } else {
        setAuthError('Please enter either an email or phone number');
      }
    } catch (error: any) {
      console.error('Auth error:', error); // Debug log
      setAuthError(error.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpVerify = async () => {
    setIsLoading(true);
    setAuthError('');

    try {
      if (otpType === 'email') {
        const { error } = await supabase.auth.verifyOtp({
          email: email.trim(),
          token: otpCode,
          type: 'email'
        });
        if (error) throw error;
      } else if (otpType === 'sms') {
        const fullPhoneNumber = `${countryCode}${phone.trim().replace(/\D/g, '')}`;
        const { error } = await supabase.auth.verifyOtp({
          phone: fullPhoneNumber,
          token: otpCode,
          type: 'sms'
        });
        if (error) throw error;
      }
      
      // If verification successful, close dialog and call success callback
      handleCloseDialog();
      onSuccess?.();
    } catch (error: any) {
      console.error('OTP verification error:', error);
      setAuthError(error.message || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setEmail('');
    setPhone('');
    setCountryCode('+1');
    setAuthError('');
    setOtpSent(false);
    setOtpCode('');
    setOtpType(null);
    setEmailSent(false);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleCloseDialog}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px', // 16px from Figma
          backgroundColor: '#FFFFFF',
          margin: { xs: 2, sm: 3 },
          maxWidth: { xs: '321px', sm: '400px' }, // Match Figma width
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
              {emailSent ? 'Check Your Email!' : 'Welcome Back!'}
            </Typography>
            {!otpSent && !emailSent && (
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
                Enter the email or phone number you provided in your RSVP to login.
              </Typography>
            )}
          </Stack>

          {/* Form Section */}
          <Stack spacing={2} sx={{ width: '100%' }}>
            {emailSent ? (
              <>
                {/* Email Sent Success Screen */}
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      color: '#141414',
                      fontSize: '16px',
                      lineHeight: '1.5em',
                      textAlign: 'center',
                      fontFamily: 'Outfit, sans-serif',
                      fontWeight: 400,
                    }}
                  >
                    We've sent you a login link! Check your email and click the link to sign in.
                  </Typography>
                </Box>

                {/* Navigation Buttons */}
                <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
                  <Button
                    onClick={() => {
                      setEmailSent(false);
                      setAuthError('');
                    }}
                    variant="outlined"
                    fullWidth
                    sx={{
                      borderColor: '#DE3F5E',
                      color: '#DE3F5E',
                      py: 1.5,
                      borderRadius: '80px',
                      textTransform: 'uppercase',
                      fontSize: '14px',
                      fontWeight: 700,
                      fontFamily: 'Outfit, sans-serif',
                      '&:hover': {
                        borderColor: '#C8365A',
                        backgroundColor: 'rgba(222, 63, 94, 0.04)',
                      },
                    }}
                  >
                    Go Back
                  </Button>
                  <Button
                    onClick={handleCloseDialog}
                    variant="contained"
                    fullWidth
                    sx={{
                      backgroundColor: '#DE3F5E',
                      color: '#FFFFFF',
                      py: 1.5,
                      borderRadius: '80px',
                      textTransform: 'uppercase',
                      fontSize: '14px',
                      fontWeight: 700,
                      fontFamily: 'Outfit, sans-serif',
                      boxShadow: 'none',
                      '&:hover': {
                        backgroundColor: '#C8365A',
                        boxShadow: 'none',
                      },
                    }}
                  >
                    Done
                  </Button>
                </Stack>
              </>
            ) : !otpSent ? (
              <>
                {/* Email Field */}
                <Box
                  sx={{
                    border: '1px solid #BCBCBC',
                    borderRadius: '8px',
                    padding: '16px 12px',
                    backgroundColor: '#FFFFFF',
                    cursor: 'text',
                    '&:hover': {
                      borderColor: '#DE3F5E',
                    },
                    '&:focus-within': {
                      borderColor: '#DE3F5E',
                    },
                  }}
                  onClick={() => document.getElementById('email-input')?.focus()}
                >
                  <TextField
                    id="email-input"
                    placeholder="Email"
                    type="email"
                    fullWidth
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    variant="standard"
                    InputProps={{
                      disableUnderline: true,
                      sx: {
                        fontSize: '16px',
                        fontFamily: 'Outfit, sans-serif',
                        fontWeight: 400,
                        color: '#141414',
                        '& input': {
                          padding: 0,
                          color: '#141414 !important',
                          '&::placeholder': {
                            color: '#BCBCBC',
                            opacity: 1,
                          },
                          '&:focus': {
                            color: '#141414 !important',
                          },
                          '&:-webkit-autofill': {
                            WebkitBoxShadow: '0 0 0 1000px #FFFFFF inset !important',
                            WebkitTextFillColor: '#141414 !important',
                            backgroundColor: '#FFFFFF !important',
                          },
                          '&:-webkit-autofill:hover': {
                            WebkitBoxShadow: '0 0 0 1000px #FFFFFF inset !important',
                            WebkitTextFillColor: '#141414 !important',
                          },
                          '&:-webkit-autofill:focus': {
                            WebkitBoxShadow: '0 0 0 1000px #FFFFFF inset !important',
                            WebkitTextFillColor: '#141414 !important',
                          },
                        },
                      },
                    }}
                  />
                </Box>

                {/* OR Divider */}
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    width: '100%',
                    gap: 2,
                  }}
                >
                  {/* Left line */}
                  <Box
                    sx={{
                      flex: 1,
                      height: '1px',
                      backgroundColor: '#BCBCBC',
                    }}
                  />
                  
                  {/* Or text */}
                  <Typography 
                    variant="body1"
                    sx={{
                      color: '#141414',
                      fontSize: '18px',
                      fontWeight: 400,
                      textAlign: 'center',
                      fontFamily: 'Outfit, sans-serif',
                      lineHeight: '1.26em',
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
                      backgroundColor: '#BCBCBC',
                    }}
                  />
                </Box>

                {/* Phone Field */}
                <Box
                  sx={{
                    border: '1px solid #BCBCBC',
                    borderRadius: '8px',
                    padding: '16px 12px',
                    backgroundColor: '#FFFFFF',
                    cursor: 'text',
                    '&:hover': {
                      borderColor: '#DE3F5E',
                    },
                    '&:focus-within': {
                      borderColor: '#DE3F5E',
                    },
                  }}
                  onClick={() => document.getElementById('phone-input')?.focus()}
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <FormControl sx={{ minWidth: 80 }}>
                      <Select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        variant="standard"
                        disableUnderline
                        sx={{
                          '& .MuiSelect-select': {
                            padding: '0px 8px 0px 0px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            fontSize: '16px',
                            fontFamily: 'Outfit, sans-serif',
                            color: '#141414 !important',
                            border: 'none',
                            '&:focus': {
                              backgroundColor: 'transparent',
                            },
                          },
                          '& .MuiSelect-icon': {
                            color: '#666',
                            fontSize: '1.2rem',
                          },
                        }}
                      >
                        {countryCodes.map((country) => (
                          <MenuItem key={country.code} value={country.code}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <span style={{ fontSize: '16px' }}>{country.flag}</span>
                              <span style={{ fontSize: '14px', fontFamily: 'Outfit, sans-serif' }}>{country.code}</span>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <TextField
                      id="phone-input"
                      placeholder="000 000 0000"
                      type="tel"
                      fullWidth
                      value={phone}
                      onChange={(e) => {
                        // Remove any non-numeric characters except + and spaces
                        const cleanValue = e.target.value.replace(/[^\d+\s-()]/g, '');
                        setPhone(cleanValue);
                      }}
                      variant="standard"
                      InputProps={{
                        disableUnderline: true,
                        sx: {
                          fontSize: '16px',
                          fontFamily: 'Outfit, sans-serif',
                          fontWeight: 400,
                          color: '#141414',
                          '& input': {
                            padding: 0,
                            paddingLeft: '8px',
                            color: '#141414 !important',
                            '&::placeholder': {
                              color: '#BCBCBC',
                              opacity: 1,
                            },
                            '&:focus': {
                              color: '#141414 !important',
                            },
                            '&:-webkit-autofill': {
                              WebkitBoxShadow: '0 0 0 1000px #FFFFFF inset !important',
                              WebkitTextFillColor: '#141414 !important',
                              backgroundColor: '#FFFFFF !important',
                            },
                            '&:-webkit-autofill:hover': {
                              WebkitBoxShadow: '0 0 0 1000px #FFFFFF inset !important',
                              WebkitTextFillColor: '#141414 !important',
                            },
                            '&:-webkit-autofill:focus': {
                              WebkitBoxShadow: '0 0 0 1000px #FFFFFF inset !important',
                              WebkitTextFillColor: '#141414 !important',
                            },
                          },
                        },
                      }}
                    />
                  </Stack>
                </Box>
              </>
            ) : (
              <>
                {/* OTP Input Field */}
                <Box>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      color: '#141414',
                      fontSize: '16px',
                      lineHeight: 1.5,
                      textAlign: 'center',
                      fontFamily: 'Outfit, sans-serif',
                      mb: 2
                    }}
                  >
                    {otpType === 'email' ? 'Enter the code from your email:' : 'Enter the code from your phone:'}
                  </Typography>
                  
                  <Box
                    sx={{
                      border: '1px solid #BCBCBC',
                      borderRadius: '8px',
                      padding: '16px 12px',
                      backgroundColor: '#FFFFFF',
                      cursor: 'text',
                      '&:hover': {
                        borderColor: '#DE3F5E',
                      },
                      '&:focus-within': {
                        borderColor: '#DE3F5E',
                      },
                    }}
                    onClick={() => document.getElementById('otp-input')?.focus()}
                  >
                    <TextField
                      id="otp-input"
                      placeholder="000000"
                      type="text"
                      fullWidth
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      variant="standard"
                      autoFocus
                      InputProps={{
                        disableUnderline: true,
                        sx: {
                          fontSize: '18px',
                          fontFamily: 'Outfit, sans-serif',
                          fontWeight: 400,
                          color: '#141414',
                          '& input': {
                            padding: 0,
                            textAlign: 'left',
                            letterSpacing: '0.5em',
                            caretColor: '#DE3F5E',
                            '&::placeholder': {
                              color: '#BCBCBC',
                              opacity: 1,
                              textAlign: 'center',
                            },
                          },
                        },
                      }}
                      inputProps={{
                        style: {
                          textAlign: 'center',
                        }
                      }}
                    />
                  </Box>
                </Box>

                {/* Back to login option */}
                <Button
                  onClick={() => {
                    setOtpSent(false);
                    setOtpCode('');
                    setOtpType(null);
                    setAuthError('');
                  }}
                  variant="text"
                  sx={{
                    color: '#DE3F5E',
                    fontSize: '14px',
                    fontFamily: 'Outfit, sans-serif',
                    textTransform: 'none',
                    '&:hover': {
                      backgroundColor: 'rgba(222, 63, 94, 0.04)',
                    },
                  }}
                >
                  ← Back to login
                </Button>
              </>
            )}

            {authError && !otpSent && !emailSent && (
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  p: 2, 
                  backgroundColor: authError.includes('Check your') ? 'rgba(0, 0, 0, 0.08)' : 'rgba(244, 67, 54, 0.08)', 
                  borderRadius: '8px',
                  color: authError.includes('Check your') ? 'rgba(0, 0, 0, 0.72)' : '#f44336',
                  mt: 1
                }}
              >
                <Typography variant="body2" sx={{ 
                  fontWeight: 400,
                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                  lineHeight: 1.5,
                  fontFamily: 'Outfit'
                }}>
                  {authError.includes('Check your email') && '📧  '}
                  {authError.includes('Check your phone') && '📱  '}
                  {authError}
                </Typography>
              </Box>
            )}
          </Stack>

          {/* Verify Button - Only show when not in email sent state */}
          {!emailSent && (
            <Button
              onClick={otpSent ? handleOtpVerify : handleAuthSubmit}
              disabled={isLoading || (!otpSent && !email && !phone) || (otpSent && otpCode.length !== 6)}
              variant="contained"
              fullWidth
              sx={{
                backgroundColor: '#DE3F5E',
                color: '#FFFFFF',
                py: 1.5,
                borderRadius: '80px', // Large border radius from Figma
                textTransform: 'uppercase',
                fontSize: '16px',
                fontWeight: 700,
                letterSpacing: '6.25%',
                fontFamily: 'Outfit, sans-serif',
                boxShadow: 'none',
                '&:hover': {
                  backgroundColor: '#C8365A',
                  boxShadow: 'none',
                },
                '&:disabled': {
                  backgroundColor: 'rgba(222, 63, 94, 0.3)',
                  color: 'rgba(255, 255, 255, 0.7)',
                },
              }}
            >
              {isLoading 
                ? (otpSent ? 'Verifying...' : 'Sending...') 
                : (otpSent ? 'verify code' : 'send code')
              }
            </Button>
          )}
        </Stack>
      </DialogContent>
    </Dialog>
  );
};

export default LoginModal; 