'use client';

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
  Alert,
  alpha,
  CircularProgress,
} from '@mui/material';
import { weddingService } from '@/lib/supabase/wedding-service';
import OptimizedBackground from '@/components/ui/OptimizedBackground';
import { supabase } from '@/lib/supabase/client';

export default function NewWeddingPage() {
  const router = useRouter();
  const [coupleName, setCoupleName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    checkAuthAndRedirect();
  }, []);

  const checkAuthAndRedirect = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // Not authenticated, redirect to signup
        router.push('/auth/signup');
        return;
      }

      setUserId(user.id);

      // Check if user already has weddings
      const { data: existingWeddings } = await supabase
        .from('weddings')
        .select('slug')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (existingWeddings && existingWeddings.length > 0) {
        // User already has a wedding, redirect to it
        router.push(`/admin/${existingWeddings[0].slug}/overview`);
        return;
      }

      // Check if user is admin of any wedding
      const { data: adminWeddings } = await supabase
        .from('wedding_admins')
        .select('wedding_id, weddings(slug)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (adminWeddings && adminWeddings.length > 0 && adminWeddings[0].weddings) {
        // User is admin of a wedding, redirect to it
        const weddingSlug = (adminWeddings[0].weddings as any).slug;
        router.push(`/admin/${weddingSlug}/overview`);
        return;
      }

      // User is authenticated but has no weddings, show the form
      setCheckingAuth(false);
    } catch (err) {
      console.error('Error checking auth:', err);
      setError('Failed to verify authentication');
      setCheckingAuth(false);
    }
  };

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleCreateWedding = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!coupleName.trim()) {
      setError('Please enter your names');
      return;
    }

    if (!userId) {
      setError('You must be logged in to create a wedding');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Generate a unique wedding slug
      let baseSlug = generateSlug(coupleName);
      let slug = baseSlug;
      let counter = 1;

      // Check slug availability
      let isAvailable = await weddingService.checkSlugAvailability(slug);
      while (!isAvailable) {
        slug = `${baseSlug}-${counter}`;
        counter++;
        isAvailable = await weddingService.checkSlugAvailability(slug);
      }

      // Create wedding
      const wedding = await weddingService.createWedding({
        slug,
        couple_name: coupleName,
        wedding_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
        wedding_date_display: 'TBD',
        venue_name: 'TBD',
        venue_location: 'TBD',
        rsvp_deadline: 'TBD',
        status: 'draft',
        created_by: userId,
        background_image: '/images/backgrounds/blue-clouds.jpg',
        primary_color: '#DE3F5E',
      });

      if (wedding) {
        // Redirect to onboarding
        router.push(`/admin/${slug}/details`);
      } else {
        setError('Failed to create wedding. Please try again.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Wedding creation error:', err);
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <OptimizedBackground useAppDefault={true} className="min-h-screen flex flex-col">
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CircularProgress size={48} sx={{ color: '#DE3F5E' }} />
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
            elevation={0}
            sx={{
              p: { xs: 3, sm: 5 },
              borderRadius: '32px',
              bgcolor: alpha('#fff', 0.95),
              backdropFilter: 'blur(10px)',
            }}
          >
            <Stack spacing={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography
                  variant="h3"
                  sx={{
                    fontFamily: 'var(--font-instrument-serif)',
                    mb: 1,
                    fontSize: { xs: '2rem', sm: '2.5rem' },
                    color: '#1a1a1a',
                  }}
                >
                  Create Your Wedding
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: '#666',
                    fontSize: { xs: '0.95rem', sm: '1.05rem' },
                  }}
                >
                  Let's start by getting your names
                </Typography>
              </Box>

              <form onSubmit={handleCreateWedding}>
                <Stack spacing={3}>
                  <TextField
                    fullWidth
                    label="Couple Name"
                    placeholder="e.g., Sarah & Mike or Sarah and Mike"
                    value={coupleName}
                    onChange={(e) => {
                      setCoupleName(e.target.value);
                      setError(null);
                    }}
                    disabled={loading}
                    required
                    autoFocus
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '16px',
                        '& fieldset': {
                          borderColor: 'rgba(0, 0, 0, 0.23)',
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(0, 0, 0, 0.4)',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#DE3F5E',
                        },
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#DE3F5E',
                      },
                    }}
                  />

                  {error && (
                    <Alert
                      severity="error"
                      onClose={() => setError(null)}
                      sx={{ borderRadius: '12px' }}
                    >
                      {error}
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={loading || !coupleName.trim()}
                    sx={{
                      bgcolor: '#DE3F5E',
                      color: 'white',
                      borderRadius: '16px',
                      py: 1.5,
                      fontSize: '1.1rem',
                      textTransform: 'none',
                      fontWeight: 600,
                      '&:hover': {
                        bgcolor: '#C8365A',
                      },
                      '&:disabled': {
                        bgcolor: '#ccc',
                      },
                    }}
                  >
                    {loading ? (
                      <CircularProgress size={24} sx={{ color: 'white' }} />
                    ) : (
                      'Continue'
                    )}
                  </Button>
                </Stack>
              </form>

              <Typography
                variant="caption"
                sx={{
                  textAlign: 'center',
                  color: '#999',
                  fontSize: '0.85rem',
                }}
              >
                Don't worry, you can change this later
              </Typography>
            </Stack>
          </Paper>
        </Container>
      </Box>
    </OptimizedBackground>
  );
}
