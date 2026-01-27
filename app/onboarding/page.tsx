'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  Paper,
  Grid,
  alpha,
  CircularProgress,
  Card,
  CardActionArea,
  Chip,
  TextField,
  Fade,
} from '@mui/material';
import {
  Favorite,
  Work,
  Language,
  WhatsApp,
  EventNote,
  FlightTakeoff,
  ArrowForward,
  ArrowBack,
  CheckCircle,
  CreditCard,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { loadStripe } from '@stripe/stripe-js';
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout
} from '@stripe/react-stripe-js';
import { useAuth } from '@/lib/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import OptimizedBackground from '@/components/ui/OptimizedBackground';
import { weddingService } from '@/lib/supabase/wedding-service';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// --- Types ---
type OnboardingStep = 1 | 2 | 3 | 4;
type UserRole = 'couple' | 'planner';

interface Feature {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  isPro: boolean;
}

const features: Feature[] = [
  {
    id: 'website',
    name: 'Wedding Website',
    description: 'Beautiful branded site for your guests',
    icon: <Language fontSize="large" />,
    isPro: false,
  },
  {
    id: 'rsvp',
    name: 'RSVP Collection',
    description: 'Track attendance and dietary needs',
    icon: <EventNote fontSize="large" />,
    isPro: false,
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Agent',
    description: 'AI-powered 24/7 guest concierge',
    icon: <WhatsApp fontSize="large" />,
    isPro: true,
  },
  {
    id: 'travel',
    name: 'Travel Coordination',
    description: 'Manage flights and airport pickups',
    icon: <FlightTakeoff fontSize="large" />,
    isPro: true,
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [step, setStep] = useState<OnboardingStep>(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [role, setRole] = useState<UserRole | null>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [plan, setPlan] = useState<'free' | 'pro'>('free');
  const [coupleName, setCoupleName] = useState('');

  const [checkoutClientSecret, setCheckoutClientSecret] = useState<string | null>(null);

  useEffect(() => {
    // Check if we're returning from Stripe
    const query = new URLSearchParams(window.location.search);
    const sessionId = query.get('session_id');
    if (sessionId) {
      console.log('[Onboarding] Returned from Stripe with session:', sessionId);
      handleStripeSuccess(sessionId);
    }
  }, []);

  // Restore settings or redirect if no user is found
  useEffect(() => {
    let redirectTimer: NodeJS.Timeout;

    if (!isAuthLoading && user) {
      console.log('[Onboarding] User available from AuthContext:', user.id);
      restoreSettings(user.id);
    } else if (!isAuthLoading && !user) {
      console.log('[Onboarding] No user from AuthContext, waiting 2s before redirecting...');
      redirectTimer = setTimeout(() => {
        // Double check after 2s
        if (!user && !isAuthLoading) {
          console.log('[Onboarding] Still no user session after delay, redirecting to signup');
          router.push('/auth/signup');
        } else if (user) {
          console.log('[Onboarding] User session appeared during delay, restoring settings');
          restoreSettings(user.id);
        }
      }, 2000);
    }

    return () => {
      if (redirectTimer) clearTimeout(redirectTimer);
    };
  }, [user, isAuthLoading, router]);

  const restoreSettings = async (userId: string) => {
    try {
      console.log('[Onboarding] Restoring existing settings for:', userId);
      const { data: settings } = await (supabase as any)
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (settings?.onboarding_completed && settings.subscription_tier === 'free') {
        console.log('[Onboarding] Already completed free onboarding, redirecting to admin');
        router.push('/admin');
        return;
      }
      
      if (settings) {
        console.log('[Onboarding] Restoring existing settings:', settings);
        if (settings.account_type) setRole(settings.account_type as UserRole);
        if (settings.enabled_features) setSelectedFeatures(settings.enabled_features);
        if (settings.subscription_tier) setPlan(settings.subscription_tier as 'free' | 'pro');
      }
    } catch (err) {
      console.error('[Onboarding] Error restoring settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStripeSuccess = async (sessionId: string) => {
    // We would normally verify the session here, but for now we'll assume success
    // and proceed to save settings
    setLoading(true);
    try {
      // We might need to fetch the saved selections from localStorage or something 
      // if they were lost during redirect, but since we use upsert, 
      // we can try to find them or just assume they are in state for now
      // Actually, Stripe Embedded Checkout doesn't necessarily redirect if handled via state
    } finally {
      setLoading(false);
    }
  };

  const toggleFeature = (id: string) => {
    setSelectedFeatures(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const hasProFeatures = selectedFeatures.some(id => 
    features.find(f => f.id === id)?.isPro
  );

  useEffect(() => {
    if (hasProFeatures) setPlan('pro');
    else setPlan('free');
  }, [selectedFeatures, hasProFeatures]);

  const handleNext = () => {
    console.log('[Onboarding] handleNext clicked', { step });
    if (step < 4) setStep((step + 1) as OnboardingStep);
    else {
      console.log('[Onboarding] Final step, calling handleSubmit');
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (checkoutClientSecret) {
      setCheckoutClientSecret(null);
      return;
    }
    if (step > 1) setStep((step - 1) as OnboardingStep);
  };

  const handleSubmit = async () => {
    if (!user) {
      console.error('[Onboarding] Submit clicked but no user found');
      return;
    }
    
    // If Pro and not paid yet, show Stripe
    if (plan === 'pro' && !checkoutClientSecret) {
      console.log('[Onboarding] Pro plan selected, creating checkout session...');
      setSubmitting(true);
      try {
        const response = await fetch('/api/stripe/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            email: user.email,
            role: role,
            plan: 'pro',
          }),
        });
        const { clientSecret, error } = await response.json();
        if (error) throw new Error(error);
        
        console.log('[Onboarding] Checkout session created');
        setCheckoutClientSecret(clientSecret);
      } catch (err) {
        console.error('[Onboarding] Stripe session error:', err);
        alert('Failed to start checkout. Please try again.');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    console.log('[Onboarding] Finalizing setup...', { role, selectedFeatures, plan, coupleName });
    setSubmitting(true);

    try {
      // 1. Save user settings
      console.log('[Onboarding] Saving user settings...');
      const { error: settingsError } = await (supabase as any)
        .from('user_settings')
        .upsert([{
          user_id: (user as any).id,
          account_type: role,
          enabled_features: selectedFeatures,
          subscription_tier: plan,
          onboarding_completed: true,
        }], { onConflict: 'user_id' });

      if (settingsError) {
        console.error('[Onboarding] Settings error:', settingsError);
        throw settingsError;
      }
      console.log('[Onboarding] User settings saved successfully');

      // 2. Initial Setup (Create wedding if couple)
      if (role === 'couple' && coupleName) {
        console.log('[Onboarding] Role is couple, creating wedding...');
        let baseSlug = coupleName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        let slug = baseSlug;
        let counter = 1;
        
        console.log('[Onboarding] Checking slug availability for:', slug);
        let isAvailable = await weddingService.checkSlugAvailability(slug);
        while (!isAvailable) {
          slug = `${baseSlug}-${counter}`;
          counter++;
          console.log('[Onboarding] Slug taken, trying:', slug);
          isAvailable = await weddingService.checkSlugAvailability(slug);
        }

        console.log('[Onboarding] Final slug:', slug);

        const wedding = await weddingService.createWedding({
          slug,
          couple_name: coupleName,
          wedding_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          wedding_date_display: 'To be determined',
          venue_name: 'To be determined',
          venue_location: 'To be determined',
          rsvp_deadline: 'To be determined',
          status: 'draft',
          created_by: user.id,
          background_image: '/images/backgrounds/blue-clouds.jpg',
          primary_color: '#DE3F5E',
        });

        if (wedding) {
          console.log('[Onboarding] Wedding created successfully:', wedding.id);
          router.push(`/admin/${slug}/overview`);
          return;
        } else {
          console.error('[Onboarding] Failed to create wedding - wedding object is null');
        }
      } else {
        console.log('[Onboarding] Not creating wedding (role not couple or no name)');
      }

      console.log('[Onboarding] Redirecting to general admin');
      router.push('/admin');
    } catch (error) {
      console.error('[Onboarding] Error completing onboarding:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || isAuthLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: '#f8f9fa' }}>
        <CircularProgress sx={{ color: '#DE3F5E' }} />
      </Box>
    );
  }

  return (
    <OptimizedBackground useAppDefault={true} className="min-h-screen flex flex-col">
      <Container maxWidth="lg" sx={{ 
        flexGrow: 1, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        py: { xs: 4, md: 8 }
      }}>
        <Box sx={{ width: '100%', maxWidth: '800px' }}>
          
          {/* Progress Indicator */}
          {!checkoutClientSecret && (
            <Stack direction="row" spacing={1} justifyContent="center" sx={{ mb: 6 }}>
              {[1, 2, 3, 4].map(s => (
                <Box
                  key={s}
                  sx={{
                    width: { xs: 30, md: 40 },
                    height: 4,
                    borderRadius: 2,
                    bgcolor: step >= s ? '#DE3F5E' : alpha('#DE3F5E', 0.1),
                    transition: 'background-color 0.3s ease',
                  }}
                />
              ))}
            </Stack>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={checkoutClientSecret ? 'payment' : step}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              <Paper elevation={0} sx={{ 
                p: { xs: 3, md: 6 }, 
                borderRadius: '32px', 
                bgcolor: alpha('#fff', 0.9),
                backdropFilter: 'blur(10px)',
                textAlign: 'center',
                boxShadow: '0 20px 60px rgba(0,0,0,0.05)',
                minHeight: checkoutClientSecret ? '500px' : 'auto'
              }}>
                
                {checkoutClientSecret ? (
                  <Box sx={{ p: { xs: 0, md: 2 } }}>
                    <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
                      <Button onClick={() => setCheckoutClientSecret(null)} startIcon={<ArrowBack />} sx={{ color: '#666' }}>
                        Back to setup
                      </Button>
                      <Typography variant="h5" sx={{ fontWeight: 700, flexGrow: 1, textAlign: 'center', color: '#1a1a1a', mr: 10 }}>
                        Complete Pro Upgrade
                      </Typography>
                    </Stack>
                    
                    <Box sx={{ mb: 4, textAlign: 'left', p: 3, bgcolor: alpha('#DE3F5E', 0.05), borderRadius: '16px', border: '1px solid', borderColor: alpha('#DE3F5E', 0.1) }}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Box sx={{ bgcolor: '#DE3F5E', color: 'white', p: 1, borderRadius: '8px', display: 'flex' }}>
                          <CreditCard />
                        </Box>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1a1a1a' }}>Pro Plan - $199</Typography>
                          <Typography variant="caption" sx={{ color: '#666' }}>Unlocks AI Agent, Travel Coordination, and more</Typography>
                        </Box>
                      </Stack>
                    </Box>

                    <Box id="checkout" sx={{ 
                      width: '100%',
                      minHeight: { xs: '400px', md: '500px' }, 
                      borderRadius: '16px', 
                      overflow: 'hidden',
                      '& iframe': {
                        width: '100% !important',
                      }
                    }}>
                      <EmbeddedCheckoutProvider
                        stripe={stripePromise}
                        options={{ clientSecret: checkoutClientSecret }}
                      >
                        <EmbeddedCheckout />
                      </EmbeddedCheckoutProvider>
                    </Box>
                  </Box>
                ) : (
                  <>
                    {/* STEP 1: ROLE SELECTION */}
                    {step === 1 && (
                      <Box>
                        <Typography variant="h3" sx={{ fontFamily: 'var(--font-instrument-serif)', fontStyle: 'italic', mb: 2, color: '#1a1a1a' }}>
                          Welcome to Phera
                        </Typography>
                        <Typography variant="h6" sx={{ color: '#666', mb: 6, fontWeight: 400 }}>
                          How do you plan to use our platform?
                        </Typography>

                        <Grid container spacing={3}>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <Card 
                              elevation={0}
                              sx={{ 
                                borderRadius: '24px', 
                                border: '2px solid',
                                borderColor: role === 'couple' ? '#DE3F5E' : 'transparent',
                                bgcolor: role === 'couple' ? alpha('#DE3F5E', 0.05) : '#f8f9fa',
                                transition: 'all 0.3s ease',
                                height: '100%'
                              }}
                            >
                              <CardActionArea sx={{ p: 4, height: '100%' }} onClick={() => setRole('couple')}>
                                <Favorite sx={{ fontSize: 60, color: '#DE3F5E', mb: 2 }} />
                                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: '#1a1a1a' }}>I'm a Couple</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ color: '#444' }}>Planning my own multi-day destination wedding</Typography>
                              </CardActionArea>
                            </Card>
                          </Grid>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <Card 
                              elevation={0}
                              sx={{ 
                                borderRadius: '24px', 
                                border: '2px solid',
                                borderColor: role === 'planner' ? '#DE3F5E' : 'transparent',
                                bgcolor: role === 'planner' ? alpha('#DE3F5E', 0.05) : '#f8f9fa',
                                transition: 'all 0.3s ease',
                                height: '100%'
                              }}
                            >
                              <CardActionArea sx={{ p: 4, height: '100%' }} onClick={() => setRole('planner')}>
                                <Work sx={{ fontSize: 60, color: '#DE3F5E', mb: 2 }} />
                                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: '#1a1a1a' }}>I'm a Planner</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ color: '#444' }}>Managing multiple weddings for my clients</Typography>
                              </CardActionArea>
                            </Card>
                          </Grid>
                        </Grid>
                      </Box>
                    )}

                    {/* STEP 2: FEATURE SELECTION */}
                    {step === 2 && (
                      <Box>
                        <Typography variant="h3" sx={{ fontFamily: 'var(--font-instrument-serif)', fontStyle: 'italic', mb: 2, color: '#1a1a1a' }}>
                          Personalize Your Experience
                        </Typography>
                        <Typography variant="h6" sx={{ color: '#666', mb: 6, fontWeight: 400 }}>
                          What tools do you need to make your wedding perfect?
                        </Typography>

                        <Grid container spacing={2}>
                          {features.map(feature => (
                            <Grid size={{ xs: 12, sm: 6 }} key={feature.id}>
                              <Card 
                                elevation={0}
                                sx={{ 
                                  borderRadius: '20px', 
                                  border: '2px solid',
                                  borderColor: selectedFeatures.includes(feature.id) ? '#DE3F5E' : 'transparent',
                                  bgcolor: selectedFeatures.includes(feature.id) ? alpha('#DE3F5E', 0.05) : '#f8f9fa',
                                  transition: 'all 0.2s ease',
                                }}
                              >
                                <CardActionArea sx={{ p: 3, textAlign: 'left' }} onClick={() => toggleFeature(feature.id)}>
                                  <Stack direction="row" spacing={2} alignItems="center">
                                    <Box sx={{ color: '#DE3F5E' }}>{feature.icon}</Box>
                                    <Box sx={{ flexGrow: 1 }}>
                                      <Stack direction="row" spacing={1} alignItems="center">
                                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1a1a1a' }}>{feature.name}</Typography>
                                        {feature.isPro && <Chip label="PRO" size="small" sx={{ bgcolor: alpha('#DE3F5E', 0.1), color: '#DE3F5E', fontWeight: 700, height: 20, fontSize: '0.65rem' }} />}
                                      </Stack>
                                      <Typography variant="caption" sx={{ color: '#444' }}>{feature.description}</Typography>
                                    </Box>
                                    {selectedFeatures.includes(feature.id) && <CheckCircle sx={{ color: '#DE3F5E' }} />}
                                  </Stack>
                                </CardActionArea>
                              </Card>
                            </Grid>
                          ))}
                        </Grid>
                      </Box>
                    )}

                    {/* STEP 3: PLAN SELECTION */}
                    {step === 3 && (
                      <Box>
                        <Typography variant="h3" sx={{ fontFamily: 'var(--font-instrument-serif)', fontStyle: 'italic', mb: 2, color: '#1a1a1a' }}>
                          Choose Your Plan
                        </Typography>
                        <Typography variant="h6" sx={{ color: '#666', mb: 6, fontWeight: 400 }}>
                          {hasProFeatures 
                            ? "You've selected Pro features! Upgrade now for full access." 
                            : "Start for free or unlock the full potential with Pro."}
                        </Typography>

                        <Grid container spacing={4} justifyContent="center">
                          <Grid size={{ xs: 12, md: 5 }}>
                            <Paper sx={{ 
                              p: 4, 
                              borderRadius: '24px', 
                              border: plan === 'free' ? '2px solid #DE3F5E' : '1px solid #eee',
                              bgcolor: plan === 'free' ? alpha('#DE3F5E', 0.02) : '#fff',
                              opacity: hasProFeatures ? 0.6 : 1,
                              cursor: hasProFeatures ? 'not-allowed' : 'pointer',
                              transition: 'all 0.3s'
                            }} onClick={() => !hasProFeatures && setPlan('free')}>
                              <Typography variant="overline" sx={{ fontWeight: 800, color: '#DE3F5E' }}>FREE</Typography>
                              <Typography variant="h4" sx={{ fontWeight: 800, my: 1, color: '#1a1a1a' }}>$0</Typography>
                              <Typography variant="body2" sx={{ color: '#444', mb: 3 }}>Perfect for simple RSVP tracking</Typography>
                              {plan === 'free' && <Chip label="Selected" sx={{ bgcolor: '#DE3F5E', color: '#fff', fontWeight: 700 }} />}
                            </Paper>
                          </Grid>
                          <Grid size={{ xs: 12, md: 5 }}>
                            <Paper sx={{ 
                              p: 4, 
                              borderRadius: '24px', 
                              border: plan === 'pro' ? '2px solid #DE3F5E' : '1px solid #eee',
                              bgcolor: plan === 'pro' ? alpha('#DE3F5E', 0.02) : '#fff',
                              boxShadow: plan === 'pro' ? '0 20px 40px rgba(222,63,94,0.1)' : 'none',
                              position: 'relative',
                              cursor: 'pointer',
                              transition: 'all 0.3s'
                            }} onClick={() => setPlan('pro')}>
                              <Chip label="RECOMMENDED" size="small" sx={{ position: 'absolute', top: -12, right: 20, bgcolor: '#DE3F5E', color: 'white', fontWeight: 800 }} />
                              <Typography variant="overline" sx={{ fontWeight: 800, color: '#DE3F5E' }}>PRO</Typography>
                              <Typography variant="h4" sx={{ fontWeight: 800, my: 1, color: '#1a1a1a' }}>$199</Typography>
                              <Typography variant="body2" sx={{ color: '#444', mb: 3 }}>Full coordination suite & AI agent</Typography>
                              {plan === 'pro' && <Chip label="Selected" sx={{ bgcolor: '#DE3F5E', color: '#fff', fontWeight: 700 }} />}
                            </Paper>
                          </Grid>
                        </Grid>
                      </Box>
                    )}

                    {/* STEP 4: INITIAL SETUP */}
                    {step === 4 && (
                      <Box>
                        <Typography variant="h3" sx={{ fontFamily: 'var(--font-instrument-serif)', fontStyle: 'italic', mb: 2, color: '#1a1a1a' }}>
                          {role === 'couple' ? "Tell Us Your Names" : "Let's Get Started"}
                        </Typography>
                        <Typography variant="h6" sx={{ color: '#666', mb: 6, fontWeight: 400 }}>
                          {role === 'couple' 
                            ? "This will be used to personalize your wedding website and concierge." 
                            : "We'll set up your first wedding project workspace."}
                        </Typography>

                        <Box sx={{ maxWidth: '400px', mx: 'auto' }}>
                          <TextField
                            fullWidth
                            label={role === 'couple' ? "Couple Names" : "First Wedding Name"}
                            placeholder="e.g., Sarah & John"
                            value={coupleName}
                            onChange={(e) => setCoupleName(e.target.value)}
                            autoFocus
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: '16px',
                                bgcolor: '#f8f9fa',
                                '& input': {
                                  color: '#1a1a1a',
                                },
                              },
                              '& .MuiInputLabel-root': {
                                color: '#666',
                              },
                              '& .MuiInputLabel-root.Mui-focused': {
                                color: '#DE3F5E',
                              }
                            }}
                          />
                          <Typography variant="caption" sx={{ display: 'block', mt: 2, color: '#999' }}>
                            You can change this anytime in settings
                          </Typography>
                        </Box>
                      </Box>
                    )}

                    {/* Navigation Buttons */}
                    <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 8 }}>
                      {step > 1 && (
                        <Button 
                          variant="text" 
                          onClick={handleBack}
                          sx={{ color: '#666', fontWeight: 700 }}
                        >
                          Back
                        </Button>
                      )}
                      <Button
                        variant="contained"
                        endIcon={submitting ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : <ArrowForward />}
                        disabled={
                          (step === 1 && !role) ||
                          (step === 2 && selectedFeatures.length === 0) ||
                          (step === 4 && !coupleName) ||
                          submitting
                        }
                        onClick={handleNext}
                        sx={{
                          bgcolor: '#DE3F5E',
                          color: 'white',
                          px: 6,
                          py: 1.5,
                          borderRadius: '32px',
                          textTransform: 'none',
                          fontSize: '1.1rem',
                          fontWeight: 700,
                          boxShadow: '0 8px 24px rgba(222,63,94,0.3)',
                          '&:hover': { bgcolor: '#C8365A' },
                        }}
                      >
                        {step === 4 ? (submitting ? 'Setting up...' : (plan === 'pro' ? 'Go to Payment' : 'Start Planning')) : 'Continue'}
                      </Button>
                    </Stack>
                  </>
                )}
              </Paper>
            </motion.div>
          </AnimatePresence>
        </Box>
      </Container>
    </OptimizedBackground>
  );
}
