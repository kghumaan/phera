'use client';

/**
 * Signup Page
 * 
 * Email Configuration Note:
 * - For development: Email confirmation is disabled in Supabase Dashboard → Authentication → Email
 * - For production: Enable email confirmation and configure custom SMTP provider
 * - Alternative: Use "Continue with Google" OAuth for reliable authentication
 * - See EMAIL_VALIDATION_FIX.md for detailed setup instructions
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Stack,
  Paper,
  Link as MuiLink,
  alpha,
  CircularProgress,
} from '@mui/material';
import Link from 'next/link';
import { weddingService } from '@/lib/supabase/wedding-service';
import OptimizedBackground from '@/components/ui/OptimizedBackground';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { COLORS, FONTS, RADII } from '@/lib/theme/tokens';
import { PrimaryActionButton } from '@/components/admin/ActionButton';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const isAnyLoading = emailLoading || googleLoading;

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Check if user already has a wedding
        const weddings = await weddingService.getUserWeddings(user.id);
        if (weddings && weddings.length > 0) {
          // User has a wedding, redirect to admin dashboard
          router.push(`/admin/${weddings[0].slug}/overview`);
        } else {
          // User doesn't have a wedding, redirect to onboarding
          router.push('/onboarding');
        }
      } else {
        setCheckingAuth(false);
      }
    };
    checkAuth();
  }, [router]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailLoading(true);

    try {
      // Sign up user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) {
        toast.error(authError.message);
        setEmailLoading(false);
        return;
      }

      if (!authData.user) {
        toast.error('Failed to create account');
        setEmailLoading(false);
        return;
      }

      // Redirect to onboarding
      router.push('/onboarding');
    } catch (err) {
      console.error('Signup error:', err);
      toast.error('An unexpected error occurred');
      setEmailLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setGoogleLoading(true);

    try {
      // Build the callback URL with redirect to onboarding
      const callbackUrl = new URL('/auth/callback', window.location.origin);
      callbackUrl.searchParams.set('redirect', '/onboarding');

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl.toString(),
        },
      });

      if (error) {
        toast.error(error.message);
        setGoogleLoading(false);
      }
    } catch (err) {
      toast.error('Failed to sign up with Google');
      setGoogleLoading(false);
    }
  };

  // Show loading state while checking auth
  if (checkingAuth) {
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
                    fontFamily: FONTS.display,
                    fontWeight: 700,
                    mb: 1,
                    color: COLORS.text.strong,
                  }}
                >
                  Start Planning
                </Typography>
              </Box>



              <form onSubmit={handleSignup}>
                <Stack spacing={2.5}>
                  {/* Wedding Name removed for modular onboarding */}
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
                        '&.Mui-disabled': {
                          color: COLORS.text.subtle,
                        },
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: COLORS.brand.primary,
                      },
                      '& .MuiInputBase-input': {
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
                    helperText="At least 6 characters"
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
                        '&.Mui-disabled': {
                          color: COLORS.text.subtle,
                        },
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: COLORS.brand.primary,
                      },
                      '& .MuiInputBase-input': {
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
                      '& .MuiFormHelperText-root': {
                        color: COLORS.text.subtle,
                      },
                    }}
                  />
                  <PrimaryActionButton
                    type="submit"
                    size="large"
                    fullWidth
                    disabled={isAnyLoading}
                    loading={emailLoading}
                    sx={{ px: { xs: 4, md: 6 }, py: { xs: 1.2, md: 2 }, fontSize: { xs: '1rem', md: '1.25rem' } }}
                  >
                    Create Account
                  </PrimaryActionButton>
                </Stack>
              </form>

              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: COLORS.text.muted, fontWeight: 500 }}>
                  or
                </Typography>
              </Box>

              <Button
                variant="outlined"
                size="large"
                fullWidth
                onClick={handleGoogleSignup}
                disabled={isAnyLoading}
                startIcon={
                  googleLoading ? (
                    <CircularProgress size={18} sx={{ color: COLORS.text.strong }} />
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4" />
                      <path d="M9.003 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.96v2.332C2.44 15.983 5.485 18 9.003 18z" fill="#34A853" />
                      <path d="M3.964 10.712c-.18-.54-.282-1.117-.282-1.71 0-.593.102-1.17.282-1.71V4.96H.957C.347 6.175 0 7.55 0 9.002c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
                      <path d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.428 0 9.003 0 5.485 0 2.44 2.017.96 4.958L3.967 7.29c.708-2.127 2.692-3.71 5.036-3.71z" fill="#EA4335" />
                    </svg>
                  )
                }
                sx={{
                  borderRadius: '32px',
                  py: { xs: 1.2, md: 2 },
                  px: { xs: 4, md: 6 },
                  borderColor: '#1a1a1a',
                  color: COLORS.text.strong,
                  borderWidth: '1.5px',
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: { xs: '1rem', md: '1.25rem' },
                  bgcolor: 'white',
                  transition: 'all 0.2s ease',
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

              <Box textAlign="center">
                <Typography variant="body2" sx={{ color: COLORS.text.muted }}>
                  Already have an account?{' '}
                  <MuiLink
                    component={Link}
                    href="/auth/login"
                    sx={{
                      color: COLORS.brand.primary,
                      fontWeight: 600,
                      textDecoration: 'none',
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    Sign in
                  </MuiLink>
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Container>
      </Box>
    </OptimizedBackground>
  );
}

