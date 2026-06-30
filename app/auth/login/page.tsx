'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Stack,
  Paper,
  alpha,
  CircularProgress,
} from '@mui/material';
import OptimizedBackground from '@/components/ui/OptimizedBackground';
import OtpInput from '@/components/ui/OtpInput';
import { supabase } from '@/lib/supabase/client';
import { verifySignupOTP } from '@/lib/supabase/auth-service';
import { weddingService } from '@/lib/supabase/wedding-service';
import { useAuth } from '@/lib/contexts/AuthContext';
import { generateGuestAvatar } from '@/lib/utils/avatar-generator';
import { toast } from 'sonner';
import { COLORS, RADII } from '@/lib/theme/tokens';
import { WarningAlert, ErrorAlert } from '@/components/shared/Alert';
import { PrimaryActionButton } from '@/components/admin/ActionButton';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/admin';
  const role = searchParams.get('role');
  const { refreshAuth } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);

  const isAnyLoading = emailLoading || googleLoading;

  const getOnboardingUrl = () => {
    // New couples land on /welcome — the AI-planner vs manual fork the landing
    // page sells. Planners keep their dedicated onboarding path.
    return role ? `/onboarding?role=${role}` : '/welcome';
  };

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        router.push(redirectTo);
      }
    });

    // Default email for localhost development
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      setEmail('kv.s.ghumaan@gmail.com');
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailLoading(true);
    setError(null);

    try {
      // First try to sign in
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        // If invalid credentials, try to sign up (user might not exist)
        if (signInError.message.includes('Invalid login credentials')) {
          console.log('User not found, attempting signup...');

          // Validate password length for signup
          if (password.length < 6) {
            setError('Password must be at least 6 characters for a new account');
            return;
          }

          console.log('Calling supabase.auth.signUp...');
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(getOnboardingUrl())}`,
            },
          });
          console.log('signUp returned:', { user: signUpData?.user?.id, error: signUpError?.message, hasSession: !!signUpData?.session, identities: signUpData?.user?.identities?.length });

          if (signUpError) {
            if (signUpError.message.includes('already registered') || signUpError.message.includes('already been registered')) {
              setError('Incorrect password. Try again or use Google sign-in.');
            } else {
              setError(signUpError.message);
            }
          } else if (signUpData.user) {
            // Empty identities = email exists, wrong password
            if (signUpData.user.identities && signUpData.user.identities.length === 0) {
              setError('Incorrect password. Try again or use Google sign-in.');
              return;
            }

            // Genuinely new user — generate avatar
            setIsNewUser(true);
            try {
              const avatar = generateGuestAvatar(email);
              await supabase.from('user_settings').upsert([{
                user_id: signUpData.user.id,
                avatar_style: avatar.style,
                avatar_seed: avatar.seed,
                avatar_svg: avatar.svg,
                avatar_color: avatar.color,
              }], { onConflict: 'user_id' });
            } catch (avatarErr) {
              console.error('Failed to generate avatar on signup:', avatarErr);
            }

            if (signUpData.session) {
              // Process any pending wedding invites
              if (signUpData.session.user.email) {
                try {
                  await weddingService.processInvitesForUser(
                    signUpData.session.user.email,
                    signUpData.session.user.id
                  );
                } catch (err) {
                  console.error('Error processing pending invites (non-fatal):', err);
                }
              }
              setTimeout(() => { refreshAuth(); }, 100);
              router.push(getOnboardingUrl());
              router.refresh();
            } else {
              // Email confirmation enabled — show OTP step
              setStep('otp');
            }
          }
        } else if (signInError.message.includes('Email not confirmed')) {
          // User exists but hasn't confirmed — resend and show OTP
          setIsNewUser(true);
          await supabase.auth.resend({ type: 'signup', email });
          setStep('otp');
        } else {
          setError(signInError.message);
        }
      } else if (signInData.session) {
        // Existing user signed in successfully
        if (signInData.session.user.email) {
          try {
            await weddingService.processInvitesForUser(
              signInData.session.user.email,
              signInData.session.user.id
            );
          } catch (err) {
            console.error('Error processing pending invites (non-fatal):', err);
          }
        }
        setTimeout(() => { refreshAuth(); }, 100);
        router.push(redirectTo);
        router.refresh();
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setEmailLoading(false);
    }
  };

  const verifyOtp = useCallback(async (code: string) => {
    if (code.length !== 6 || otpLoading) return;
    setOtpLoading(true);
    setOtpError(null);

    try {
      const result = await verifySignupOTP(email, code);

      if (!result.success) {
        setOtpError(result.error || 'Verification failed');
        setOtpLoading(false);
        setOtpCode('');
        return;
      }

      // Process any pending wedding invites
      if (result.user?.email) {
        try {
          await weddingService.processInvitesForUser(result.user.email, result.user.id);
        } catch (err) {
          console.error('Error processing pending invites (non-fatal):', err);
        }
      }

      setTimeout(() => { refreshAuth(); }, 100);

      if (isNewUser) {
        router.push(getOnboardingUrl());
      } else {
        router.push(redirectTo);
      }
      router.refresh();
    } catch (err) {
      console.error('OTP verification error:', err);
      setOtpError('An unexpected error occurred');
      setOtpLoading(false);
      setOtpCode('');
    }
  }, [email, otpLoading, redirectTo, router, isNewUser, refreshAuth, role]);

  const handleOtpChange = (value: string) => {
    setOtpCode(value);
    setOtpError(null);
    if (value.length === 6) {
      verifyOtp(value);
    }
  };

  const handleResendOtp = async () => {
    setOtpError(null);
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email });
      if (error) {
        setOtpError(error.message);
      } else {
        toast.success('Verification code resent! Check your email.');
      }
    } catch (err) {
      setOtpError('Failed to resend code');
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError(null);

    try {
      // Build the callback URL with redirect parameter
      const callbackUrl = new URL('/auth/callback', window.location.origin);
      if (role) {
        callbackUrl.searchParams.set('redirect', getOnboardingUrl());
      } else {
        callbackUrl.searchParams.set('redirect', redirectTo);
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl.toString(),
        },
      });

      if (error) {
        setError(error.message);
        setGoogleLoading(false);
      }
    } catch (err) {
      setError('Failed to sign in with Google');
      setGoogleLoading(false);
    }
  };

  return (
    <OptimizedBackground useAppDefault={true} className="min-h-screen flex flex-col">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <Container maxWidth="sm">
          <Paper
            sx={{
              p: { xs: 3, sm: 5 },
              borderRadius: RADII.dialog,
              bgcolor: alpha('#fff', 0.95),
              backdropFilter: 'blur(10px)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
            }}
          >
            <Stack spacing={3}>
              <Box textAlign="center">
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 600,
                    mb: 1,
                    color: COLORS.text.strong,
                  }}
                >
                  {step === 'form' ? 'Welcome to Phera' : 'Verify Your Email'}
                </Typography>
                <Typography variant="body2" sx={{ color: COLORS.text.muted }}>
                  {step === 'form'
                    ? 'Sign in or create an account to get started'
                    : <>We sent a 6-digit code to <strong>{email}</strong></>
                  }
                </Typography>
              </Box>

              {step === 'form' ? (
                <>
                  {error && (
                    <WarningAlert onClose={() => setError(null)}>
                      {error}
                    </WarningAlert>
                  )}

                  <Button
                    variant="outlined"
                    size="large"
                    fullWidth
                    onClick={handleGoogleLogin}
                    disabled={isAnyLoading}
                    startIcon={
                      googleLoading ? (
                        <CircularProgress size={18} sx={{ color: COLORS.text.strong }} />
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                          <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                          <path d="M9.003 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.96v2.332C2.44 15.983 5.485 18 9.003 18z" fill="#34A853"/>
                          <path d="M3.964 10.712c-.18-.54-.282-1.117-.282-1.71 0-.593.102-1.17.282-1.71V4.96H.957C.347 6.175 0 7.55 0 9.002c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                          <path d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.428 0 9.003 0 5.485 0 2.44 2.017.96 4.958L3.967 7.29c.708-2.127 2.692-3.71 5.036-3.71z" fill="#EA4335"/>
                        </svg>
                      )
                    }
                    sx={{
                      borderRadius: '32px',
                      py: 1.5,
                      borderColor: '#1a1a1a',
                      color: COLORS.text.strong,
                      borderWidth: '1.5px',
                      textTransform: 'none',
                      fontWeight: 500,
                      bgcolor: 'white',
                      '&:hover': {
                        borderColor: COLORS.brand.primary,
                        bgcolor: alpha('#DE3F5E', 0.05),
                        borderWidth: '1.5px',
                      },
                      '&:disabled': {
                        borderColor: googleLoading ? '#1a1a1a' : alpha('#1a1a1a', 0.3),
                        color: googleLoading ? '#1a1a1a' : alpha('#1a1a1a', 0.3),
                        bgcolor: 'white',
                        opacity: googleLoading ? 0.8 : 0.6,
                        borderWidth: '1.5px',
                      },
                    }}
                  >
                    {googleLoading ? 'Connecting...' : 'Continue with Google'}
                  </Button>

                  <Box sx={{ position: 'relative', py: 1, textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ color: '#858585', bgcolor: alpha('#fff', 0.95), position: 'relative', zIndex: 1, display: 'inline-block', px: 2 }}>
                      or
                    </Typography>
                    <Box sx={{ position: 'absolute', left: 0, right: 0, top: '50%', height: '1px', bgcolor: '#E0E0E0', zIndex: 0 }} />
                  </Box>

                  <form onSubmit={handleLogin}>
                    <Stack spacing={2.5}>
                      <TextField
                        label="Email"
                        type="email"
                        fullWidth
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isAnyLoading}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: RADII.md,
                            bgcolor: 'white',
                            '& fieldset': {
                              borderColor: 'rgba(0, 0, 0, 0.23)',
                            },
                            '&:hover fieldset': {
                              borderColor: COLORS.brand.primary,
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: COLORS.brand.primary,
                              borderWidth: '2px',
                            },
                            '&.Mui-disabled': {
                              bgcolor: 'rgba(255, 255, 255, 0.8)',
                              '& fieldset': {
                                borderColor: 'rgba(0, 0, 0, 0.15)',
                              },
                            },
                          },
                          '& .MuiInputLabel-root': {
                            color: COLORS.text.muted,
                            '&:not(.MuiInputLabel-shrink)': {
                              top: '50%',
                              transform: 'translateX(14px) translateY(-50%)',
                            },
                            '&.Mui-disabled': {
                              color: COLORS.text.subtle,
                            },
                          },
                          '& .MuiInputLabel-root.Mui-focused': {
                            color: COLORS.brand.primary,
                          },
                          '& .MuiInputBase-input': {
                            padding: '16.5px 14px',
                            color: COLORS.text.strong,
                            '&.Mui-disabled': {
                              WebkitTextFillColor: '#4a4a4a',
                              color: COLORS.text.muted,
                            },
                            '&:-webkit-autofill': {
                              WebkitBoxShadow: '0 0 0 100px white inset',
                              WebkitTextFillColor: '#1a1a1a',
                              caretColor: '#1a1a1a',
                              borderRadius: 'inherit',
                            },
                          },
                        }}
                      />
                      <TextField
                        label="Password"
                        type="password"
                        fullWidth
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isAnyLoading}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: RADII.md,
                            bgcolor: 'white',
                            '& fieldset': {
                              borderColor: 'rgba(0, 0, 0, 0.23)',
                            },
                            '&:hover fieldset': {
                              borderColor: COLORS.brand.primary,
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: COLORS.brand.primary,
                              borderWidth: '2px',
                            },
                            '&.Mui-disabled': {
                              bgcolor: 'rgba(255, 255, 255, 0.8)',
                              '& fieldset': {
                                borderColor: 'rgba(0, 0, 0, 0.15)',
                              },
                            },
                          },
                          '& .MuiInputLabel-root': {
                            color: COLORS.text.muted,
                            '&:not(.MuiInputLabel-shrink)': {
                              top: '50%',
                              transform: 'translateX(14px) translateY(-50%)',
                            },
                            '&.Mui-disabled': {
                              color: COLORS.text.subtle,
                            },
                          },
                          '& .MuiInputLabel-root.Mui-focused': {
                            color: COLORS.brand.primary,
                          },
                          '& .MuiInputBase-input': {
                            padding: '16.5px 14px',
                            color: COLORS.text.strong,
                            '&.Mui-disabled': {
                              WebkitTextFillColor: '#4a4a4a',
                              color: COLORS.text.muted,
                            },
                            '&:-webkit-autofill': {
                              WebkitBoxShadow: '0 0 0 100px white inset !important',
                              WebkitTextFillColor: '#1a1a1a !important',
                              caretColor: '#1a1a1a',
                              borderRadius: 'inherit',
                              transition: 'background-color 5000s ease-in-out 0s',
                            },
                            '&:-webkit-autofill:hover': {
                              WebkitBoxShadow: '0 0 0 100px white inset !important',
                              WebkitTextFillColor: '#1a1a1a !important',
                            },
                            '&:-webkit-autofill:focus': {
                              WebkitBoxShadow: '0 0 0 100px white inset !important',
                              WebkitTextFillColor: '#1a1a1a !important',
                            },
                            '&:-webkit-autofill:active': {
                              WebkitBoxShadow: '0 0 0 100px white inset !important',
                              WebkitTextFillColor: '#1a1a1a !important',
                            },
                          },
                        }}
                      />
                      <PrimaryActionButton
                        type="submit"
                        size="large"
                        fullWidth
                        disabled={isAnyLoading}
                        loading={emailLoading}
                        sx={{ py: 1.5, fontSize: '1rem' }}
                      >
                        Sign In / Sign Up
                      </PrimaryActionButton>
                    </Stack>
                  </form>
                </>
              ) : (
                /* OTP Verification Step */
                <Stack spacing={2.5}>
                  {otpError && (
                    <ErrorAlert onClose={() => setOtpError(null)}>
                      {otpError}
                    </ErrorAlert>
                  )}

                  <OtpInput
                    value={otpCode}
                    onChange={handleOtpChange}
                    disabled={otpLoading}
                  />

                  {otpLoading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                      <CircularProgress size={24} sx={{ color: COLORS.brand.primary }} />
                    </Box>
                  )}

                  <Stack direction="row" justifyContent="center" spacing={2}>
                    <Button
                      variant="text"
                      onClick={() => {
                        setStep('form');
                        setOtpCode('');
                        setOtpError(null);
                      }}
                      disabled={otpLoading}
                      sx={{
                        color: COLORS.text.muted,
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        '&:hover': {
                          bgcolor: 'transparent',
                          textDecoration: 'underline',
                        },
                      }}
                    >
                      Go back
                    </Button>
                    <Button
                      variant="text"
                      onClick={handleResendOtp}
                      disabled={otpLoading}
                      sx={{
                        color: COLORS.brand.primary,
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        '&:hover': {
                          bgcolor: 'transparent',
                          textDecoration: 'underline',
                        },
                      }}
                    >
                      Resend code
                    </Button>
                  </Stack>
                  <Box sx={{ textAlign: 'center', pt: 1 }}>
                    <Typography variant="caption" sx={{ color: COLORS.text.subtle }}>
                      Can&apos;t receive a code?{' '}
                      <a
                        href="/contact"
                        style={{ color: COLORS.brand.primary, fontWeight: 600, textDecoration: 'none' }}
                      >
                        Contact support
                      </a>
                    </Typography>
                  </Box>
                </Stack>
              )}
            </Stack>
          </Paper>
        </Container>
      </Box>
    </OptimizedBackground>
  );
}

function LoginFallback() {
  return (
    <OptimizedBackground useAppDefault={true} className="min-h-screen flex flex-col">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <CircularProgress sx={{ color: COLORS.brand.primary }} />
      </Box>
    </OptimizedBackground>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginContent />
    </Suspense>
  );
}
