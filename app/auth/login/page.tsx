'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Stack,
  Paper,
  Alert,
  Link as MuiLink,
  alpha,
  CircularProgress,
} from '@mui/material';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import OptimizedBackground from '@/components/ui/OptimizedBackground';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/admin';
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  
  const supabase = createClientComponentClient();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
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
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else if (data.session) {
        router.push(redirectTo);
        router.refresh();
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      // Build the callback URL with redirect parameter
      const callbackUrl = new URL('/auth/callback', window.location.origin);
      callbackUrl.searchParams.set('redirect', redirectTo);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl.toString(),
        },
      });

      if (error) {
        setError(error.message);
        setLoading(false);
      }
    } catch (err) {
      setError('Failed to sign in with Google');
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!email) {
      setError('Please enter your email');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Build the callback URL with redirect parameter
      const callbackUrl = new URL('/auth/callback', window.location.origin);
      callbackUrl.searchParams.set('redirect', redirectTo);

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: callbackUrl.toString(),
        },
      });

      if (error) {
        setError(error.message);
      } else {
        setMessage('Check your email for the magic link!');
      }
    } catch (err) {
      setError('Failed to send magic link');
    } finally {
      setLoading(false);
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
              borderRadius: '24px',
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
                    fontFamily: 'var(--font-instrument-serif)',
                    fontWeight: 700,
                    mb: 1,
                    color: '#1a1a1a',
                  }}
                >
                  Welcome to Phera
                </Typography>
                <Typography variant="body1" sx={{ color: '#4a4a4a' }}>
                  Sign in to manage your wedding website
                </Typography>
              </Box>

              {error && (
                <Alert
                  severity="error"
                  onClose={() => setError(null)}
                  sx={{ borderRadius: '16px' }}
                >
                  {error}
                </Alert>
              )}

              {message && (
                <Alert
                  severity="success"
                  onClose={() => setMessage(null)}
                  sx={{ borderRadius: '16px' }}
                >
                  {message}
                </Alert>
              )}

              <form onSubmit={handleLogin}>
                <Stack spacing={2.5}>
                  <TextField
                    label="Email"
                    type="email"
                    fullWidth
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        bgcolor: 'white',
                        '& fieldset': {
                          borderColor: 'rgba(0, 0, 0, 0.23)',
                        },
                        '&:hover fieldset': {
                          borderColor: '#DE3F5E',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#DE3F5E',
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
                        color: '#4a4a4a',
                        '&.Mui-disabled': {
                          color: '#6a6a6a',
                        },
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#DE3F5E',
                      },
                      '& .MuiInputBase-input': {
                        color: '#1a1a1a',
                        '&.Mui-disabled': {
                          WebkitTextFillColor: '#4a4a4a',
                          color: '#4a4a4a',
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
                    disabled={loading}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        bgcolor: 'white',
                        '& fieldset': {
                          borderColor: 'rgba(0, 0, 0, 0.23)',
                        },
                        '&:hover fieldset': {
                          borderColor: '#DE3F5E',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#DE3F5E',
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
                        color: '#4a4a4a',
                        '&.Mui-disabled': {
                          color: '#6a6a6a',
                        },
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#DE3F5E',
                      },
                      '& .MuiInputBase-input': {
                        color: '#1a1a1a',
                        '&.Mui-disabled': {
                          WebkitTextFillColor: '#4a4a4a',
                          color: '#4a4a4a',
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
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    fullWidth
                    disabled={loading}
                    sx={{
                      bgcolor: '#DE3F5E',
                      color: 'white',
                      py: 1.5,
                      borderRadius: '32px',
                      fontSize: '1rem',
                      fontWeight: 600,
                      textTransform: 'none',
                      boxShadow: '0 4px 12px rgba(222, 63, 94, 0.3)',
                      '&:hover': {
                        bgcolor: '#C8365A',
                        boxShadow: '0 6px 16px rgba(222, 63, 94, 0.4)',
                      },
                      '&:disabled': {
                        bgcolor: alpha('#DE3F5E', 0.5),
                      },
                    }}
                  >
                    {loading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </Stack>
              </form>

              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: '#4a4a4a' }}>
                  or
                </Typography>
              </Box>

              <Button
                variant="outlined"
                size="large"
                fullWidth
                onClick={handleGoogleLogin}
                disabled={loading}
                startIcon={
                  loading ? (
                    <CircularProgress size={18} sx={{ color: '#1a1a1a' }} />
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
                  color: '#1a1a1a',
                  borderWidth: '1.5px',
                  textTransform: 'none',
                  fontWeight: 500,
                  bgcolor: 'white',
                  '&:hover': {
                    borderColor: '#DE3F5E',
                    bgcolor: alpha('#DE3F5E', 0.05),
                    borderWidth: '1.5px',
                  },
                  '&:disabled': {
                    borderColor: '#1a1a1a',
                    color: '#1a1a1a',
                    bgcolor: 'white',
                    opacity: 1,
                    borderWidth: '1.5px',
                  },
                }}
              >
                {loading ? 'Connecting to Google...' : 'Continue with Google'}
              </Button>

              <Button
                variant="outlined"
                size="large"
                fullWidth
                onClick={handleMagicLink}
                disabled={loading}
                sx={{
                  borderRadius: '32px',
                  py: 1.5,
                  borderColor: '#1a1a1a',
                  color: '#1a1a1a',
                  borderWidth: '1.5px',
                  textTransform: 'none',
                  fontWeight: 500,
                  '&:hover': {
                    borderColor: '#DE3F5E',
                    bgcolor: alpha('#DE3F5E', 0.05),
                    borderWidth: '1.5px',
                  },
                }}
              >
                Send Magic Link
              </Button>

              <Box textAlign="center">
                <Typography variant="body2" sx={{ color: '#4a4a4a' }}>
                  Don't have an account?{' '}
                  <MuiLink
                    component={Link}
                    href="/auth/signup"
                    sx={{
                      color: '#DE3F5E',
                      fontWeight: 600,
                      textDecoration: 'none',
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    Sign up
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
        <CircularProgress sx={{ color: '#DE3F5E' }} />
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

