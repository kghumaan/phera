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
import { sendMagicLink } from '@/lib/supabase/auth-service';

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const LoginModal = ({ open, onClose, onSuccess }: LoginModalProps) => {
  const [email, setEmail] = useState('');
  const [authError, setAuthError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleAuthSubmit = async () => {
    setIsLoading(true);
    setAuthError('');

    try {
      if (email && email.trim()) {
        // Use enhanced magic link with email validation and PIN preservation
        const result = await sendMagicLink(email.trim(), true);
        
        if (result.success) {
          // Show success screen
          setEmailSent(true);
        } else {
          throw new Error(result.error || 'Failed to send magic link');
        }
      } else {
        setAuthError('Please enter an email address');
      }
    } catch (error: any) {
      console.error('Auth error:', error); // Debug log
      setAuthError(error.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setEmail('');
    setAuthError('');
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
            {!emailSent && (
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
            ) : (
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
              </>
            )}

            {authError && !emailSent && (
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
                  {authError}
                </Typography>
              </Box>
            )}
          </Stack>

          {/* Send Email Button - Only show when not in email sent state */}
          {!emailSent && (
            <Button
              onClick={handleAuthSubmit}
              disabled={isLoading || !email}
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
              {isLoading ? 'Sending...' : 'send login link'}
            </Button>
          )}
        </Stack>
      </DialogContent>
    </Dialog>
  );
};

export default LoginModal; 