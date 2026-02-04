'use client';

import React, { useState, useEffect, ChangeEvent } from 'react';
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
  IconButton,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker';
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
    isPro: true,
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

const StyledTextField = styled(TextField)({
  '& .MuiOutlinedInput-root': {
    borderRadius: '16px',
    backgroundColor: '#f8f9fa !important',
    '& fieldset': {
      borderColor: 'rgba(222, 63, 94, 0.2) !important',
      borderWidth: '1px !important',
    },
    '&:hover fieldset': {
      borderColor: 'rgba(222, 63, 94, 0.4) !important',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#DE3F5E !important',
      borderWidth: '2px !important',
    },
    '& input': {
      color: '#1a1a1a !important',
      WebkitTextFillColor: '#1a1a1a !important',
    },
    '& .MuiPickersSectionList-selectableSection': {
      color: '#1a1a1a !important',
    },
    '& .MuiInputAdornment-root .MuiSvgIcon-root': {
      color: '#666 !important',
    },
  },
  '& .MuiInputLabel-root': {
    color: '#666 !important',
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: '#DE3F5E !important',
  },
});

const inputStyles = {
  // Keeping this for legacy compatibility or if needed for other components
};

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
  const [partnerName, setPartnerName] = useState('');
  const [weddingDate, setWeddingDate] = useState('');
  const [weddingEndDate, setWeddingEndDate] = useState('');
  const [checkoutClientSecret, setCheckoutClientSecret] = useState<string | null>(null);
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Preparing your experience...');

  useEffect(() => {
    // Check if we're returning from Stripe
    const query = new URLSearchParams(window.location.search);
    const sessionId = query.get('session_id');
    if (sessionId) {
      console.log('[Onboarding DEBUG] Returned from Stripe with session:', sessionId);
      setLoading(true);
      setLoadingMessage('Payment successful! Finalizing your wedding workspace...');
      handleStripeSuccess(sessionId);
    }
  }, []);

  // Restore settings or redirect if no user is found
  useEffect(() => {
    let redirectTimer: NodeJS.Timeout;

    if (!isAuthLoading && user) {
      console.log('[Onboarding DEBUG] Auth state resolved: User logged in', { userId: user.id, email: user.email });
      restoreSettings(user.id);
    } else if (!isAuthLoading && !user) {
      console.warn('[Onboarding DEBUG] Auth state resolved: No user found. Waiting for possible delayed session...');
      redirectTimer = setTimeout(() => {
        if (!user && !isAuthLoading) {
          console.error('[Onboarding DEBUG] Still no user session after 2s delay. Redirecting to signup.');
          router.push('/auth/signup');
        } else if (user) {
          console.log('[Onboarding DEBUG] User session appeared after delay. Proceeding with restoreSettings.', (user as any).id);
          restoreSettings((user as any).id);
        }
      }, 2000);
    }

    return () => {
      if (redirectTimer) clearTimeout(redirectTimer);
    };
  }, [user, isAuthLoading, router]);

  const restoreSettings = async (userId: string) => {
    try {
      console.log('[Onboarding DEBUG] restoreSettings: Fetching from user_settings for userId:', userId);
      const { data: settings, error: fetchError } = await (supabase as any)
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (fetchError) {
        console.warn('[Onboarding DEBUG] restoreSettings: Potential issue or no settings found yet:', fetchError);
        // Error code PGRST116 means no rows found, which is fine for new users
        if (fetchError.code !== 'PGRST116') {
          console.error('[Onboarding DEBUG] Unexpected Supabase error:', fetchError);
        }
      }

      console.log('[Onboarding DEBUG] restoreSettings: Received data:', settings);

      if (settings?.onboarding_completed && settings.subscription_tier === 'free') {
        console.log('[Onboarding DEBUG] Onboarding already completed for FREE plan. Redirecting to admin.');
        router.push('/admin');
        return;
      }

      if (settings) {
        console.log('[Onboarding DEBUG] restoreSettings: Applying existing settings to state:', {
          role: settings.account_type,
          features: settings.enabled_features,
          tier: settings.subscription_tier
        });
        if (settings.account_type) setRole(settings.account_type as UserRole);
        if (settings.enabled_features) setSelectedFeatures(settings.enabled_features);
        if (settings.subscription_tier) setPlan(settings.subscription_tier as 'free' | 'pro');
      } else {
        console.log('[Onboarding DEBUG] restoreSettings: No existing settings found, starting fresh.');
      }
    } catch (err) {
      console.error('[Onboarding DEBUG] FATAL error in restoreSettings:', err);
    } finally {
      // Only stop loading if we're NOT returning from Stripe
      // (Stripe handling has its own loading management)
      const query = new URLSearchParams(window.location.search);
      if (!query.has('session_id')) {
        setLoading(false);
      }
    }
  };

  const handleStripeSuccess = async (sessionId: string) => {
    console.log('[Onboarding] Handling Stripe success for session:', sessionId);
    setLoading(true);
    try {
      // 1. Retrieve session from our new API
      const response = await fetch(`/api/stripe/get-session?session_id=${sessionId}`);
      const session = await response.json();

      if (session.error) throw new Error(session.error);
      if (session.payment_status !== 'paid') {
        console.warn('[Onboarding] Payment status not paid:', session.payment_status);
        return;
      }

      const { userId, role, coupleName, partnerName, weddingDate, weddingEndDate, selectedFeatures } = session.metadata;
      const features = JSON.parse(selectedFeatures || '[]');

      console.log('[Onboarding] Retrieved metadata from Stripe:', { userId, role, coupleName, partnerName, weddingDate, weddingEndDate, features });

      setLoadingMessage(`Setting up ${coupleName}'s wedding workspace...`);

      // 2. Finalize settings in DB
      await finalizeOnboarding({
        userId,
        role: role as UserRole,
        plan: 'pro',
        coupleName,
        partnerName,
        weddingDate,
        weddingEndDate,
        selectedFeatures: features
      });

    } catch (err: any) {
      console.error('[Onboarding] Error in handleStripeSuccess:', err);
      if (err.message) console.error('Error message:', err.message);
      if (err.details) console.error('Error details:', err.details);
      if (err.hint) console.error('Error hint:', err.hint);
      alert('We received your payment but encountered an error setting up your account. Please contact support.');
      setLoading(false);
    } finally {
      // Don't setLoading(false) here to avoid flickering before redirect
    }
  };

  const finalizeOnboarding = async (data: {
    userId: string,
    role: UserRole,
    plan: 'free' | 'pro',
    coupleName: string,
    partnerName?: string,
    weddingDate?: string,
    weddingEndDate?: string,
    selectedFeatures: string[]
  }) => {
    console.log('[Onboarding DEBUG] Starting finalizeOnboarding with data:', data);
    console.log('[Onboarding DEBUG] Supabase client available:', !!supabase);

    try {
      // 1. Save user settings
      console.log('[Onboarding DEBUG] Step 1: Upserting user_settings...');
      const settingsToSave = {
        user_id: data.userId,
        account_type: data.role,
        enabled_features: data.selectedFeatures,
        subscription_tier: data.plan,
        onboarding_completed: true,
      };
      console.log('[Onboarding DEBUG] Data to upsert:', settingsToSave);

      const { data: upsertData, error: settingsError } = await (supabase as any)
        .from('user_settings')
        .upsert([settingsToSave], { onConflict: 'user_id' });

      if (settingsError) {
        console.error('[Onboarding DEBUG] Step 1 FAILED (settingsError):', settingsError);
        throw settingsError;
      }
      console.log('[Onboarding DEBUG] Step 1 SUCCESS:', upsertData);

      // 2. Create Wedding if applicable
      if (data.role === 'couple' && data.coupleName) {
        console.log('[Onboarding DEBUG] Step 2: Creating wedding record...');
        let baseSlug = data.coupleName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        let slug = baseSlug;
        let counter = 1;

        let isAvailable = await weddingService.checkSlugAvailability(slug);
        while (!isAvailable) {
          slug = `${baseSlug}-${counter}`;
          counter++;
          isAvailable = await weddingService.checkSlugAvailability(slug);
        }

        console.log('[Onboarding DEBUG] Step 2a: Final slug decided:', slug);
        const wedding = await weddingService.createWedding({
          slug,
          couple_name: data.coupleName,
          partner1_name: data.coupleName,
          partner2_name: data.partnerName || null,
          wedding_date: data.weddingDate ? new Date(data.weddingDate).toISOString() : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          wedding_date_end: data.weddingEndDate ? new Date(data.weddingEndDate).toISOString() : null,
          wedding_date_display: data.weddingDate ? new Date(data.weddingDate).toLocaleDateString() : 'TBD',
          venue_name: 'TBD',
          venue_location: 'TBD',
          rsvp_deadline: 'TBD',
          status: 'draft',
          created_by: data.userId,
          background_image: '/images/backgrounds/blue-clouds.jpg',
          primary_color: '#DE3F5E',
        });

        if (wedding) {
          console.log('[Onboarding DEBUG] Step 2 SUCCESS, redirecting to wedding page...');
          setLoadingMessage('Perfect! Taking you to your dashboard...');
          router.push(`/admin/${slug}/details`);
          return;
        } else {
          console.error('[Onboarding DEBUG] Step 2 FAILED (wedding creation returned null)');
          throw new Error('Failed to create wedding record');
        }
      }

      console.log('[Onboarding DEBUG] All steps finished (no wedding needed), redirecting...');
      setLoadingMessage('All set! Taking you to your dashboard...');
      router.push('/admin');
    } catch (err: any) {
      console.error('[Onboarding DEBUG] FATAL ERROR inside finalizeOnboarding:', err);
      // Re-throw so the caller's catch block also handles it
      throw err;
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
    if (step === 2) {
      setStep(4);
    } else if (step < 4) {
      setStep((step + 1) as OnboardingStep);
    }
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
    if (step === 4) {
      setStep(2);
      return;
    }
    if (step > 1) setStep((step - 1) as OnboardingStep);
  };

  const handleSubmit = async () => {
    console.log('[Onboarding DEBUG] handleSubmit invoked', { userId: user?.id, plan, role, coupleName, partnerName, weddingDate, selectedFeatures });
    if (!user) {
      console.error('[Onboarding DEBUG] handleSubmit: No user session found');
      return;
    }

    if (plan === 'pro' && !checkoutClientSecret) {
      setSubmitting(true);
      try {
        // --- Pre-Payment Persistence ---
        console.log('[Onboarding DEBUG] handleSubmit: Saving pre-payment settings for PRO upgrade');
        const settingsToSave = {
          user_id: user.id,
          account_type: role,
          enabled_features: selectedFeatures,
          subscription_tier: 'pro',
          onboarding_completed: false,
        };

        const { error: preSaveError } = await (supabase as any)
          .from('user_settings')
          .upsert([settingsToSave], { onConflict: 'user_id' });

        if (preSaveError) {
          console.error('[Onboarding DEBUG] handleSubmit: Pre-payment save error:', preSaveError);
        } else {
          console.log('[Onboarding DEBUG] handleSubmit: Pre-payment save SUCCESS');
        }

        console.log('[Onboarding DEBUG] handleSubmit: Creating Stripe Checkout session via API...');
        const response = await fetch('/api/stripe/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            email: user.email,
            role,
            plan: 'pro',
            coupleName,
            partnerName,
            weddingDate,
            weddingEndDate,
            selectedFeatures,
          }),
        });

        const stripeRes = await response.json();
        console.log('[Onboarding DEBUG] handleSubmit: Stripe API response:', stripeRes);

        if (stripeRes.error) throw new Error(stripeRes.error);
        setCheckoutClientSecret(stripeRes.clientSecret);
      } catch (err) {
        console.error('[Onboarding DEBUG] handleSubmit: Stripe session error:', err);
        alert('Failed to start checkout. Please try again.');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    console.log('[Onboarding DEBUG] handleSubmit: Finalizing FREE plan onboarding...');
    setLoading(true);
    setLoadingMessage('Creating your wedding workspace...');
    setSubmitting(true);
    try {
      await finalizeOnboarding({
        userId: user.id,
        role: role as UserRole,
        plan: 'free',
        coupleName,
        partnerName,
        weddingDate,
        weddingEndDate,
        selectedFeatures
      });
    } catch (error) {
      console.error('[Onboarding DEBUG] handleSubmit: Error completing onboarding:', error);
      alert('Something went wrong. Please try again.');
      setLoading(false);
    } finally {
      setSubmitting(false);
      // Don't setLoading(false) here to avoid flickering before redirect
    }
  };

  if (loading || isAuthLoading) {
    return (
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        bgcolor: '#f8f9fa',
        gap: 3
      }}>
        <CircularProgress sx={{ color: '#DE3F5E' }} />
        <Typography
          variant="h6"
          sx={{
            color: '#1a1a1a',
            fontWeight: 800,
            fontFamily: 'var(--font-instrument-serif)',
            fontStyle: 'italic',
            letterSpacing: '0.02em'
          }}
        >
          {loadingMessage}
        </Typography>
      </Box>
    );
  }

  return (
    <OptimizedBackground useAppDefault={true} className="min-h-screen flex flex-col">
      <Container maxWidth="xl" sx={{
        flexGrow: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: { xs: 4, md: 8 }
      }}>
        <Box sx={{
          width: '100%',
          maxWidth: checkoutClientSecret ? '1000px' : '1200px',
          transition: 'max-width 0.5s ease-in-out'
        }}>

          {/* Progress Indicator */}
          {!checkoutClientSecret && (
            <Stack direction="row" spacing={1} justifyContent="center" sx={{ mb: 6 }}>
              {[1, 2, 4].map(s => (
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
                py: { xs: 3, md: 5 },
                px: { xs: 1.5, md: 3 },
                borderRadius: '32px',
                bgcolor: alpha('#fff', 0.9),
                backdropFilter: 'blur(10px)',
                textAlign: 'center',
                boxShadow: '0 20px 60px rgba(0,0,0,0.05)',
                minHeight: '500px', // Set min-height to maintain container size during loading
                display: 'flex',
                flexDirection: 'column',
                justifyContent: submitting ? 'center' : 'flex-start',
                position: 'relative'
              }}>

                {submitting && (
                  <Box sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'rgba(255,255,255,0.7)',
                    borderRadius: '32px',
                    zIndex: 10,
                    gap: 3
                  }}>
                    <CircularProgress sx={{ color: '#DE3F5E' }} />
                    <Typography variant="h6" sx={{ color: '#1a1a1a', fontWeight: 800 }}>
                      Preparing your workspace...
                    </Typography>
                  </Box>
                )}

                {checkoutClientSecret ? (
                  <Box sx={{ p: 0 }}>
                    <Box sx={{ mb: 4, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <IconButton
                        onClick={() => setCheckoutClientSecret(null)}
                        sx={{
                          position: 'absolute',
                          left: 0,
                          color: '#666',
                          p: { xs: 0.5, md: 1 }
                        }}
                      >
                        <ArrowBack sx={{ fontSize: { xs: 20, md: 24 } }} />
                      </IconButton>
                      <Typography
                        variant="h5"
                        sx={{
                          fontWeight: 700,
                          color: '#1a1a1a',
                          fontSize: { xs: '1.2rem', md: '1.5rem' },
                          px: 5 // Add padding to avoid overlapping with absolute icon
                        }}
                      >
                        Complete Pro Upgrade
                      </Typography>
                    </Box>

                    <Grid container spacing={{ xs: 2, md: 4 }} alignItems="flex-start" justifyContent="center">
                      {/* Left Column: Plan Details & Features */}
                      <Grid size={{ xs: 12, md: 4, lg: 3.5 }}>
                        <Box sx={{
                          textAlign: 'left',
                          p: { xs: 2, md: 4 },
                          bgcolor: alpha('#DE3F5E', 0.05),
                          borderRadius: '24px',
                          border: '1px solid',
                          borderColor: alpha('#DE3F5E', 0.1),
                          display: 'flex',
                          flexDirection: 'column'
                        }}>
                          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: { xs: 2, md: 4 } }}>
                            <Box sx={{ bgcolor: '#DE3F5E', color: 'white', p: { xs: 1, md: 1.5 }, borderRadius: '12px', display: 'flex' }}>
                              <CreditCard sx={{ fontSize: { xs: 20, md: 28 } }} />
                            </Box>
                            <Box>
                              <Typography variant="h6" sx={{ fontWeight: 800, color: '#1a1a1a', lineHeight: 1.2, fontSize: { xs: '1rem', md: '1.25rem' } }}>Pro Plan</Typography>
                              <Typography variant="h4" sx={{ fontWeight: 800, color: '#DE3F5E', fontSize: { xs: '1.5rem', md: '2.125rem' } }}>$199</Typography>
                            </Box>
                          </Stack>

                          {/* Desktop Feature Title */}
                          <Typography variant="subtitle2" sx={{ display: { xs: 'none', md: 'block' }, fontWeight: 700, color: '#1a1a1a', mb: 2, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.75rem', opacity: 0.7 }}>
                            What's included:
                          </Typography>

                          {/* Mobile Toggle Button */}
                          <Button
                            variant="text"
                            size="small"
                            onClick={() => setShowAllFeatures(!showAllFeatures)}
                            endIcon={<ArrowForward sx={{ transform: showAllFeatures ? 'rotate(90deg)' : 'none', transition: '0.2s', fontSize: 16 }} />}
                            sx={{
                              display: { xs: 'flex', md: 'none' },
                              color: '#DE3F5E',
                              fontWeight: 700,
                              p: 0,
                              mb: showAllFeatures ? 2 : 0,
                              justifyContent: 'flex-start',
                              textTransform: 'none',
                              fontSize: '0.8rem'
                            }}
                          >
                            {showAllFeatures ? 'Hide premium features' : 'Show all premium features'}
                          </Button>

                          <Box sx={{ display: { xs: showAllFeatures ? 'block' : 'none', md: 'block' } }}>
                            <Stack spacing={2.5}>
                              {[
                                { text: '24/7 AI-Powered WhatsApp Guest Concierge', icon: <WhatsApp /> },
                                { text: 'Real-time RSVP Tracking & Analytics', icon: <CheckCircle /> },
                                { text: 'Automated Travel & Flight Logistics', icon: <CheckCircle /> },
                                { text: 'Global Guest Broadcasts & Updates', icon: <CheckCircle /> },
                                { text: 'Gift Registry & Honeymoon Funds', icon: <CheckCircle /> },
                                { text: 'Dedicated Relationship Manager', icon: <CheckCircle /> },
                                { text: 'Unlimited Guest Capacity', icon: <CheckCircle /> }
                              ].map((item, i) => (
                                <Stack key={i} direction="row" spacing={1.5} alignItems="flex-start">
                                  {React.cloneElement(item.icon as React.ReactElement<any>, {
                                    sx: { color: '#DE3F5E', fontSize: { xs: 16, md: 20 }, mt: 0.3 }
                                  })}
                                  <Typography variant="body2" sx={{ color: '#333', fontWeight: 500, lineHeight: 1.5, fontSize: { xs: '0.85rem', md: '0.95rem' } }}>
                                    {item.text}
                                  </Typography>
                                </Stack>
                              ))}
                              <Typography variant="caption" sx={{ color: '#888', fontStyle: 'italic', mt: 2, display: 'block', fontSize: '0.8rem' }}>
                                + even more features coming soon
                              </Typography>
                            </Stack>
                          </Box>
                        </Box>
                      </Grid>

                      {/* Right Column: Checkout Form */}
                      <Grid size={{ xs: 12, md: 7, lg: 6 }}>
                        <Box id="checkout" sx={{
                          width: '100%',
                          minHeight: 'auto',
                          bgcolor: 'white',
                          borderRadius: '24px',
                          p: { xs: 1, md: 2 },
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
                      </Grid>
                    </Grid>
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

                        {/* Payment Tier Display */}
                        <Box sx={{ mt: 6, p: 4, borderRadius: '24px', bgcolor: alpha('#DE3F5E', 0.03), border: '1px solid', borderColor: alpha('#DE3F5E', 0.1) }}>
                          <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} alignItems="center" justifyContent="space-between">
                            <Box sx={{ textAlign: 'left' }}>
                              <Typography variant="overline" sx={{ fontWeight: 800, color: '#DE3F5E', letterSpacing: '0.1em' }}>
                                Selected Tier: {plan.toUpperCase()}
                              </Typography>
                              <Typography variant="h4" sx={{ fontWeight: 800, color: '#1a1a1a', mt: 1 }}>
                                {plan === 'pro' ? '$199' : '$0'}
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#666', mt: 0.5 }}>
                                {plan === 'pro' ? 'Unlock all premium features and AI concierge' : 'Basic wedding website features'}
                              </Typography>
                            </Box>

                            <Box sx={{ width: { xs: '100%', md: 'auto' } }}>
                              <Button
                                variant="text"
                                color="primary"
                                onClick={() => setShowAllFeatures(!showAllFeatures)}
                                endIcon={<ArrowForward sx={{ transform: showAllFeatures ? 'rotate(90deg)' : 'none', transition: '0.2s' }} />}
                                sx={{ color: '#DE3F5E', fontWeight: 700 }}
                              >
                                {showAllFeatures ? 'Hide Features' : 'See Features Included'}
                              </Button>
                            </Box>
                          </Stack>

                          <AnimatePresence>
                            {showAllFeatures && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                              >
                                <Box sx={{ mt: 4, pt: 4, borderTop: '1px solid', borderColor: alpha('#DE3F5E', 0.1) }}>
                                  <Grid container spacing={3}>
                                    <Grid size={{ xs: 12, md: 6 }}>
                                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, textAlign: 'left', color: '#1a1a1a' }}>Free Features</Typography>
                                      <Stack spacing={1.5}>
                                        {['Wedding Website', 'Custom Domain (phera.id/yours)', 'Basic Design Themes'].map((f, i) => (
                                          <Stack key={i} direction="row" spacing={1} alignItems="center">
                                            <CheckCircle sx={{ color: '#DE3F5E', fontSize: 18 }} />
                                            <Typography variant="body2" sx={{ color: '#333' }}>{f}</Typography>
                                          </Stack>
                                        ))}
                                      </Stack>
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 6 }}>
                                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, textAlign: 'left', color: '#1a1a1a' }}>Pro Features</Typography>
                                      <Stack spacing={1.5}>
                                        {['RSVP Collection', '24/7 AI WhatsApp Agent', 'Travel Coordination', 'Real-time Analytics'].map((f, i) => (
                                          <Stack key={i} direction="row" spacing={1} alignItems="center">
                                            <CheckCircle sx={{ color: '#DE3F5E', fontSize: 18 }} />
                                            <Typography variant="body2" sx={{ color: '#333' }}>{f}</Typography>
                                          </Stack>
                                        ))}
                                      </Stack>
                                    </Grid>
                                  </Grid>
                                </Box>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </Box>
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
                          {role === 'couple' ? "Tell Us About Your Celebration" : "Let's Get Started"}
                        </Typography>
                        <Typography variant="h6" sx={{ color: '#666', mb: 6, fontWeight: 400 }}>
                          {role === 'couple'
                            ? "This will be used to personalize your wedding website and concierge."
                            : "We'll set up your first wedding project workspace."}
                        </Typography>

                        <Box sx={{ maxWidth: '400px', mx: 'auto' }}>
                          <Stack spacing={3}>
                            <StyledTextField
                              fullWidth
                              label={role === 'couple' ? "Your Name" : "First Wedding Name"}
                              placeholder={role === 'couple' ? "e.g., Sarah" : "e.g., Sarah & John Wedding"}
                              value={coupleName}
                              onChange={(e: ChangeEvent<HTMLInputElement>) => setCoupleName(e.target.value)}
                              autoFocus
                            />

                            {role === 'couple' && (
                              <>
                                <StyledTextField
                                  fullWidth
                                  label="Partner's Name"
                                  placeholder="e.g., John"
                                  value={partnerName}
                                  onChange={(e: ChangeEvent<HTMLInputElement>) => setPartnerName(e.target.value)}
                                />

                                <LocalizationProvider dateAdapter={AdapterDateFns}>
                                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                    <MobileDatePicker
                                      label="Start Date"
                                      value={weddingDate ? new Date(weddingDate) : null}
                                      onChange={(newValue) => setWeddingDate(newValue ? (newValue as Date).toISOString() : '')}
                                      enableAccessibleFieldDOMStructure={false}
                                      slots={{
                                        textField: StyledTextField,
                                      }}
                                      slotProps={{
                                        textField: {
                                          fullWidth: true,
                                        },
                                        actionBar: {
                                          actions: ['cancel', 'accept'],
                                          sx: {
                                            '& .MuiButton-root': {
                                              color: '#DE3F5E',
                                              fontWeight: 700,
                                            }
                                          }
                                        },
                                        day: {
                                          sx: {
                                            '&.Mui-selected': {
                                              backgroundColor: '#DE3F5E !important',
                                            },
                                            '&.Mui-selected:hover': {
                                              backgroundColor: '#DE3F5E !important',
                                              opacity: 0.9,
                                            },
                                            '&.MuiPickersDay-today': {
                                              borderColor: '#DE3F5E !important',
                                              color: '#DE3F5E',
                                            }
                                          }
                                        }
                                      }}
                                    />
                                    <MobileDatePicker
                                      label="End Date"
                                      value={weddingEndDate ? new Date(weddingEndDate) : null}
                                      onChange={(newValue) => setWeddingEndDate(newValue ? (newValue as Date).toISOString() : '')}
                                      enableAccessibleFieldDOMStructure={false}
                                      slots={{
                                        textField: StyledTextField,
                                      }}
                                      slotProps={{
                                        textField: {
                                          fullWidth: true,
                                        },
                                        actionBar: {
                                          actions: ['cancel', 'accept'],
                                          sx: {
                                            '& .MuiButton-root': {
                                              color: '#DE3F5E',
                                              fontWeight: 700,
                                            }
                                          }
                                        },
                                        day: {
                                          sx: {
                                            '&.Mui-selected': {
                                              backgroundColor: '#DE3F5E !important',
                                            },
                                            '&.Mui-selected:hover': {
                                              backgroundColor: '#DE3F5E !important',
                                              opacity: 0.9,
                                            },
                                            '&.MuiPickersDay-today': {
                                              borderColor: '#DE3F5E !important',
                                              color: '#DE3F5E',
                                            }
                                          }
                                        }
                                      }}
                                    />
                                  </Stack>
                                </LocalizationProvider>
                              </>
                            )}
                          </Stack>
                          <Typography variant="caption" sx={{ display: 'block', mt: 2, color: '#999' }}>
                            You can change these details anytime in settings
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
                        title={
                          (step === 1 && !role) ? "Please select your role" :
                            (step === 2 && selectedFeatures.length === 0) ? "Please select at least one feature" :
                              (step === 4 && (!coupleName || (role === 'couple' && (!partnerName || !weddingDate)))) ? "Please fill in all celebration details" :
                                ""
                        }
                        onClick={() => {
                          if (step === 1 && !role) return;
                          if (step === 2 && selectedFeatures.length === 0) return;
                          if (step === 4 && (!coupleName || (role === 'couple' && (!partnerName || !weddingDate)))) return;
                          handleNext();
                        }}
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
                          opacity: (
                            (step === 1 && !role) ||
                            (step === 2 && selectedFeatures.length === 0) ||
                            (step === 4 && (!coupleName || (role === 'couple' && (!partnerName || !weddingDate))))
                          ) ? 0.6 : 1, // Desaturate if "disabled"
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
