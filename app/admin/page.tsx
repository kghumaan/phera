'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  Card,
  CardContent,
  CardActions,
  CircularProgress,
  Chip,
  alpha,
  Drawer,
  IconButton,
  TextField,
} from '@mui/material';
import { Visibility, CalendarMonth, CheckCircle, Close } from '@mui/icons-material';
import OptimizedBackground from '@/components/ui/OptimizedBackground';
import { weddingService } from '@/lib/supabase/wedding-service';

interface Wedding {
  id: string;
  slug: string;
  couple_names: string;
  wedding_date: string;
  wedding_date_display: string;
  status: 'draft' | 'preview' | 'live';
  venue: string;
  created_at: string;
}

export default function AdminPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [customSlug, setCustomSlug] = useState('');
  const [savingSlug, setSavingSlug] = useState(false);

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[&]/g, '') // Remove ampersands
      .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
      .replace(/^-+|-+$/g, ''); // Trim hyphens
  };

  const handleUpdateSlug = async () => {
    if (!customSlug || !wedding) return;
    
    setSavingSlug(true);
    try {
      // Validate slug format
      const cleanSlug = generateSlug(customSlug);
      
      if (cleanSlug === wedding.slug) {
        alert('This is already your current wedding ID.');
        setSavingSlug(false);
        return;
      }
      
      // Check availability
      const isAvailable = await weddingService.checkSlugAvailability(cleanSlug);
      if (!isAvailable) {
        alert('This wedding ID is already taken. Please choose another.');
        setSavingSlug(false);
        return;
      }
      
      // Update slug
      await weddingService.updateWedding(wedding.id, { slug: cleanSlug });
      
      // Redirect to refresh the page with new slug
      router.push('/admin');
      router.refresh();
    } catch (error) {
      console.error('Failed to update slug:', error);
      alert('Failed to update wedding ID. Please try again.');
    } finally {
      setSavingSlug(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    let authSubscription: { unsubscribe: () => void } | null = null;
    let retryCount = 0;
    const MAX_RETRIES = 5;
    
    const fetchUserAndWedding = async () => {
      try {
        console.log('[Admin] Attempt', retryCount + 1, '- Fetching user and wedding...');
        
        // First try to get session (reads from cookies, more reliable after OAuth)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        console.log('[Admin] Session check:', session ? 'Found' : 'Not found', sessionError || '');
        
        if (!session) {
          retryCount++;
          
          // Retry a few times before giving up (for OAuth flow)
          if (retryCount < MAX_RETRIES) {
            console.log(`[Admin] No session yet, retrying in ${retryCount}s... (${retryCount}/${MAX_RETRIES})`);
            setTimeout(() => {
              if (isMounted) {
                fetchUserAndWedding();
              }
            }, retryCount * 1000); // Exponential backoff: 1s, 2s, 3s, 4s
            return;
          }
          
          // After retries, set up listener for future auth events
          console.log('[Admin] Max retries reached, setting up auth listener...');
          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, newSession) => {
              if (!isMounted) return;
              
              console.log('[Admin] Auth state changed:', event, 'Has session:', !!newSession);
              
              if (event === 'SIGNED_IN' && newSession) {
                await fetchUserAndWeddingWithUser(newSession.user);
              } else if (event === 'SIGNED_OUT') {
                if (isMounted) {
                  setIsLoading(false);
                }
              }
            }
          );
          
          authSubscription = subscription;
          
          // Final fallback - stop loading after 10 seconds
          setTimeout(() => {
            if (isMounted && isLoading) {
              console.log('[Admin] Timeout after 10s, stopping loading...');
              setIsLoading(false);
            }
          }, 10000);
          
          return;
        }
        
        // Session exists, proceed with user
        console.log('[Admin] Session found, fetching wedding...');
        await fetchUserAndWeddingWithUser(session.user);
        
      } catch (err) {
        console.error('[Admin] Unexpected error:', err);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    const fetchUserAndWeddingWithUser = async (currentUser: any) => {
      if (!isMounted) return;
      
      try {
        console.log('User found:', currentUser.email);
        setUser(currentUser);

        // Fetch user's wedding
        console.log('Fetching wedding for user:', currentUser.id);
        
        const { data: weddingData, error } = await supabase
          .from('weddings')
          .select('*')
          .eq('created_by', currentUser.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        console.log('Wedding data:', weddingData);
        console.log('Wedding error:', error);

        if (!isMounted) return;

        if (error && error.code !== 'PGRST116') {
          // PGRST116 = no rows returned
          console.error('Error fetching wedding:', error);
        } else if (weddingData) {
          setWedding(weddingData);
        } else {
          // No wedding found - redirect to onboarding
          console.log('No wedding found, redirecting to onboarding...');
          router.push('/admin/onboarding/new/overview');
          return;
        }
      } catch (err) {
        console.error('Error in fetchUserAndWeddingWithUser:', err);
      } finally {
        if (isMounted) {
          console.log('Setting loading to false');
          setIsLoading(false);
        }
      }
    };

    fetchUserAndWedding();

    return () => {
      isMounted = false;
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, [router]); // Add router back since we use it

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live':
        return 'success';
      case 'preview':
        return 'info';
      case 'draft':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    if (status === 'live') return <CheckCircle sx={{ fontSize: 16, ml: 0.5 }} />;
    return null;
  };

  if (isLoading) {
    return (
      <OptimizedBackground useAppDefault={true} className="min-h-screen flex flex-col">
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh'
        }}>
          <CircularProgress sx={{ color: '#DE3F5E' }} />
        </Box>
      </OptimizedBackground>
    );
  }

  // If no wedding found, show loading while redirect happens
  if (!wedding) {
    return (
      <OptimizedBackground useAppDefault={true} className="min-h-screen flex flex-col">
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh'
        }}>
          <CircularProgress sx={{ color: '#DE3F5E' }} />
        </Box>
      </OptimizedBackground>
    );
  }

  return (
    <OptimizedBackground useAppDefault={true} className="min-h-screen flex flex-col">
      <Box sx={{ minHeight: '100vh', py: 8 }}>
        <Container maxWidth="md">
          <Stack spacing={4}>
            {/* Header */}
            <Box>
              <Typography 
                variant="h3" 
                sx={{ 
                  fontFamily: 'var(--font-instrument-serif)',
                  fontWeight: 700, 
                  mb: 1,
                  color: '#1a1a1a',
                  fontSize: { xs: '2rem', md: '3rem' }
                }}
              >
                Your Wedding Dashboard
              </Typography>
              <Typography variant="body1" sx={{ color: '#4a4a4a', fontSize: '1.1rem' }}>
                Manage your wedding website and guest experience
              </Typography>
            </Box>

            {/* Wedding Card */}
            <Card 
              sx={{ 
                borderRadius: '24px',
                bgcolor: alpha('#fff', 0.95),
                backdropFilter: 'blur(10px)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
                overflow: 'visible',
                position: 'relative'
              }}
            >
            <CardContent sx={{ p: 4 }}>
              <Stack spacing={3}>
                {/* Status Badge */}
                <Box display="flex" justifyContent="space-between" alignItems="start">
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      fontWeight: 600,
                      color: '#1a1a1a',
                      fontSize: { xs: '1.5rem', md: '2rem' }
                    }}
                  >
                    {wedding.couple_names || 'Your Wedding'}
                  </Typography>
                  <Chip
                    label={wedding.status.toUpperCase()}
                    color={getStatusColor(wedding.status) as any}
                    icon={getStatusIcon(wedding.status) as any}
                    size="medium"
                    sx={{ fontWeight: 600 }}
                  />
                </Box>

                {/* Wedding Details */}
                <Stack spacing={2}>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <CalendarMonth sx={{ color: '#DE3F5E', fontSize: 28 }} />
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        color: '#1a1a1a',
                        fontWeight: 500
                      }}
                    >
                      {wedding.wedding_date_display || 'Date not set'}
                    </Typography>
                  </Box>
                  
                  {wedding.venue && (
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        color: '#4a4a4a',
                        fontSize: '1.05rem',
                        pl: 5.5
                      }}
                    >
                      {wedding.venue}
                    </Typography>
                  )}

                  <Box 
                    sx={{ 
                      bgcolor: alpha('#fff', 0.6),
                      p: 2, 
                      borderRadius: '16px',
                      border: '1px solid rgba(0, 0, 0, 0.08)'
                    }}
                  >
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#6a6a6a',
                        fontWeight: 500,
                        mb: 0.5
                      }}
                    >
                      Your Wedding URL
                    </Typography>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        color: '#DE3F5E',
                        fontWeight: 600,
                        fontFamily: 'monospace'
                      }}
                    >
                      phera.io/{wedding.slug}
                    </Typography>
                  </Box>

                  {/* Customize Wedding ID */}
                  <Box 
                    sx={{ 
                      bgcolor: alpha('#DE3F5E', 0.05),
                      p: 2.5, 
                      borderRadius: '16px',
                      border: '1px solid rgba(222, 63, 94, 0.15)'
                    }}
                  >
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#1a1a1a',
                        fontWeight: 600,
                        mb: 1.5
                      }}
                    >
                      Customize Wedding ID
                    </Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'flex-start' }}>
                      <TextField
                        label="Wedding ID"
                        placeholder={wedding.slug}
                        value={customSlug}
                        onChange={(e) => setCustomSlug(e.target.value)}
                        helperText="Lowercase letters, numbers, and hyphens only"
                        disabled={savingSlug}
                        size="small"
                        fullWidth
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
                          },
                          '& .MuiInputLabel-root': {
                            color: '#4a4a4a',
                          },
                          '& .MuiInputLabel-root.Mui-focused': {
                            color: '#DE3F5E',
                          },
                          '& .MuiInputBase-input': {
                            color: '#1a1a1a',
                          },
                          '& .MuiFormHelperText-root': {
                            color: '#6a6a6a',
                          },
                        }}
                      />
                      <Button
                        variant="contained"
                        onClick={handleUpdateSlug}
                        disabled={!customSlug || customSlug === wedding.slug || savingSlug}
                        sx={{
                          bgcolor: '#DE3F5E',
                          color: 'white',
                          borderRadius: '12px',
                          px: 3,
                          py: 1,
                          textTransform: 'none',
                          fontWeight: 600,
                          minWidth: 100,
                          '&:hover': { 
                            bgcolor: '#C8365A' 
                          },
                          '&.Mui-disabled': {
                            bgcolor: 'rgba(0, 0, 0, 0.12)',
                            color: 'rgba(0, 0, 0, 0.26)',
                          },
                        }}
                      >
                        {savingSlug ? 'Updating...' : 'Update'}
                      </Button>
                    </Stack>
                  </Box>
                </Stack>
              </Stack>
            </CardContent>

            {/* Action Buttons */}
            <CardActions 
              sx={{ 
                p: 3, 
                pt: 0, 
                gap: 2,
                flexDirection: { xs: 'column', sm: 'row' }
              }}
            >
              <Button
                onClick={() => setPreviewOpen(true)}
                startIcon={<Visibility />}
                variant="contained"
                size="large"
                fullWidth
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
                }}
              >
                Preview Site
              </Button>
            </CardActions>
          </Card>

          {/* Help Text */}
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography variant="body2" sx={{ color: '#6a6a6a' }}>
              Need help? Contact support@phera.io
            </Typography>
          </Box>
        </Stack>
      </Container>
      </Box>

      {/* Preview Drawer */}
      <Drawer
        anchor="right"
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: { xs: '100%', md: '80%' },
            maxWidth: 1200,
          },
        }}
      >
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ 
            p: 2, 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            borderBottom: 1, 
            borderColor: 'divider',
            bgcolor: alpha('#fff', 0.95),
            backdropFilter: 'blur(10px)',
          }}>
            <Typography variant="h6" sx={{ fontFamily: 'var(--font-instrument-serif)', fontWeight: 700, color: '#1a1a1a' }}>
              Preview: {wedding?.couple_names}
            </Typography>
            <IconButton onClick={() => setPreviewOpen(false)}>
              <Close />
            </IconButton>
          </Box>
          <Box sx={{ flex: 1 }}>
            <iframe
              src={`/preview/${wedding?.slug}`}
              style={{ width: '100%', height: '100%', border: 'none' }}
              title="Wedding Preview"
            />
          </Box>
        </Box>
      </Drawer>
    </OptimizedBackground>
  );
}
