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
import { supabase } from '@/lib/supabase/client';
import OptimizedBackground from '@/components/ui/OptimizedBackground';
import { weddingService } from '@/lib/supabase/wedding-service';
import { generateGuestAvatar } from '@/lib/utils/avatar-generator';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// --- Types ---
type OnboardingStep = 1 | 2;

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
    borderRadius: '12px',
    backgroundColor: '#f8f9fa !important',
    fontSize: '0.9rem',
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
      padding: '10px 14px',
      fontSize: '0.9rem',
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
    fontSize: '0.85rem',
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
  const [authUser, setAuthUser] = useState<any>(null);
  const [step, setStep] = useState<OnboardingStep>(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [role, setRole] = useState<UserRole | null>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [plan, setPlan] = useState<'basic' | 'pro'>('basic');
  const [coupleName, setCoupleName] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [weddingDate, setWeddingDate] = useState('');
  const [weddingEndDate, setWeddingEndDate] = useState('');
  const [venueName, setVenueName] = useState('');
  const [venueTbd, setVenueTbd] = useState(false);
  const [dateTbd, setDateTbd] = useState(false);
  const [isOneDay, setIsOneDay] = useState(false);
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
    const checkSession = async () => {
      const { data: { user: sessionUser } } = await supabase.auth.getUser();
      if (sessionUser) {
        setAuthUser(sessionUser);
        restoreSettings(sessionUser.id);
      } else {
        router.push('/auth/signup');
      }
    };
    checkSession();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

      if (settings?.onboarding_completed && settings.subscription_tier === 'basic') {
        // Verify user actually has a wedding before skipping onboarding
        const { data: wedding } = await supabase
          .from('weddings')
          .select('slug')
          .eq('created_by', userId)
          .limit(1)
          .single();

        if (wedding?.slug) {
          console.log('[Onboarding DEBUG] Onboarding completed and wedding exists. Redirecting to admin.');
          router.push(`/admin/${wedding.slug}/overview`);
          return;
        }

        // onboarding_completed = true but no wedding — data integrity gap, continue onboarding
        console.log('[Onboarding DEBUG] onboarding_completed but no wedding found. Continuing onboarding to create wedding.');
      }

      if (settings) {
        console.log('[Onboarding DEBUG] restoreSettings: Applying existing settings to state:', {
          role: settings.account_type,
          features: settings.enabled_features,
          tier: settings.subscription_tier
        });
        if (settings.account_type) setRole(settings.account_type as UserRole);
        if (settings.enabled_features) setSelectedFeatures(settings.enabled_features);
        if (settings.subscription_tier) setPlan(settings.subscription_tier as 'basic' | 'pro');
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

      const { userId, role, coupleName, partnerName, weddingDate, weddingEndDate, venueName, selectedFeatures } = session.metadata;
      const features = JSON.parse(selectedFeatures || '[]');

      console.log('[Onboarding] Retrieved metadata from Stripe:', { userId, role, coupleName, partnerName, weddingDate, weddingEndDate, venueName, features });

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
        venueName,
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
    plan: 'basic' | 'pro',
    coupleName: string,
    partnerName?: string | null,
    weddingDate?: string | null,
    weddingEndDate?: string | null,
    venueName?: string | null,
    selectedFeatures: string[]
  }) => {
    console.log('[Onboarding DEBUG] Starting finalizeOnboarding with data:', data);
    console.log('[Onboarding DEBUG] Supabase client available:', !!supabase);

    try {
      // 1. Save user settings (with avatar)
      console.log('[Onboarding DEBUG] Step 1: Upserting user_settings...');
      const userEmail = authUser?.email || data.userId;
      const avatar = generateGuestAvatar(userEmail, data.coupleName);
      const settingsToSave = {
        user_id: data.userId,
        account_type: data.role,
        enabled_features: data.selectedFeatures,
        subscription_tier: data.plan,
        onboarding_completed: true,
        avatar_style: avatar.style,
        avatar_seed: avatar.seed,
        avatar_svg: avatar.svg,
        avatar_color: null,
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

        let wedding = null;
        let creationAttempts = 0;
        const maxAttempts = 3;

        while (creationAttempts < maxAttempts) {
          try {
            wedding = await weddingService.createWedding({
              slug,
              couple_name: data.coupleName,
              partner1_name: data.coupleName,
              partner2_name: data.partnerName || null,
              wedding_date: data.weddingDate ? new Date(data.weddingDate).toISOString() : new Date('2099-12-31').toISOString(),
              wedding_date_end: data.weddingEndDate ? new Date(data.weddingEndDate).toISOString() : null,
              wedding_date_display: data.weddingDate ? new Date(data.weddingDate).toLocaleDateString() : 'TBD',
              venue_name: (data.venueName === 'TBD' || !data.venueName) ? 'Venue Name' : data.venueName,
              venue_location: (data.venueName === 'TBD' || !data.venueName) ? 'City, Country' : data.venueName,
              rsvp_deadline: '',
              status: 'draft',
              created_by: data.userId,
              background_image: '/images/backgrounds/blue-clouds.jpg',
              primary_color: '#DE3F5E',
            });

            if (wedding) break;

            // If creation failed (returned null), it might be a race condition slug conflict
            console.warn(`[Onboarding DEBUG] Wedding creation attempt ${creationAttempts + 1} failed. Retrying with new slug...`);
            counter++;
            slug = `${baseSlug}-${counter}`;
            let isStillAvailable = await weddingService.checkSlugAvailability(slug);
            while (!isStillAvailable) {
              counter++;
              slug = `${baseSlug}-${counter}`;
              isStillAvailable = await weddingService.checkSlugAvailability(slug);
            }
          } catch (e) {
            console.error(`[Onboarding DEBUG] Exception during wedding creation attempt ${creationAttempts + 1}:`, e);
          }
          creationAttempts++;
        }

        if (wedding) {
          console.log('[Onboarding DEBUG] Step 2 SUCCESS, redirecting to wedding page...');
          setLoadingMessage('Perfect! Taking you to your dashboard...');
          router.push(`/admin/${slug}/details`);
          return;
        } else {
          console.error('[Onboarding DEBUG] Step 2 FAILED after all attempts');
          throw new Error('Failed to create wedding record after multiple attempts');
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
    else setPlan('basic');
  }, [selectedFeatures, hasProFeatures]);

  const handleNext = () => {
    console.log('[Onboarding] handleNext clicked', { step });
    if (step < 2) {
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
    if (step > 1) setStep((step - 1) as OnboardingStep);
  };

  const handleSubmit = async () => {
    console.log('[Onboarding DEBUG] handleSubmit invoked', { userId: authUser?.id, plan, role, coupleName, partnerName, weddingDate, selectedFeatures });
    if (!authUser) {
      console.error('[Onboarding DEBUG] handleSubmit: No user session found');
      return;
    }

    // Plan is always free now as we've skipped feature selection and payment
    console.log('[Onboarding DEBUG] handleSubmit: Finalizing onboarding...');

    console.log('[Onboarding DEBUG] handleSubmit: Finalizing FREE plan onboarding...');
    setLoading(true);
    setLoadingMessage('Creating your wedding workspace...');
    setSubmitting(true);
    try {
      await finalizeOnboarding({
        userId: authUser.id,
        role: role as UserRole,
        plan: 'basic',
        coupleName,
        partnerName,
        weddingDate: dateTbd ? null : weddingDate,
        weddingEndDate: dateTbd ? null : weddingEndDate,
        venueName: venueTbd ? 'TBD' : venueName,
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

  if (loading) {
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
          maxWidth: checkoutClientSecret ? '1000px' : '600px',
          transition: 'max-width 0.5s ease-in-out'
        }}>

          {/* Progress Indicator */}
          {!checkoutClientSecret && (
            <Stack direction="row" spacing={1} justifyContent="center" sx={{ mb: 6 }}>
              {[1, 2].map(s => (
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
                py: { xs: 2.5, md: 4 },
                px: { xs: 1.5, md: 3 },
                borderRadius: '24px',
                bgcolor: alpha('#fff', 0.9),
                backdropFilter: 'blur(10px)',
                textAlign: 'center',
                boxShadow: '0 20px 60px rgba(0,0,0,0.05)',
                minHeight: '400px',
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
                        <Typography variant="h4" sx={{ fontFamily: 'var(--font-instrument-serif)', fontStyle: 'italic', mb: 1, color: '#1a1a1a', fontSize: { xs: '1.6rem', md: '2rem' } }}>
                          Welcome to Phera
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#666', mb: 4, fontWeight: 400, fontSize: { xs: '0.9rem', md: '1rem' } }}>
                          How do you plan to use our platform?
                        </Typography>

                        <Grid container spacing={2} sx={{ maxWidth: '500px', mx: 'auto' }}>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <Card
                              elevation={0}
                              sx={{
                                borderRadius: '16px',
                                border: '2px solid',
                                borderColor: role === 'couple' ? '#DE3F5E' : 'transparent',
                                bgcolor: role === 'couple' ? alpha('#DE3F5E', 0.05) : '#f8f9fa',
                                transition: 'all 0.3s ease',
                                height: '100%'
                              }}
                            >
                              <CardActionArea sx={{ p: 3, height: '100%' }} onClick={() => setRole('couple')}>
                                <Favorite sx={{ fontSize: 40, color: '#DE3F5E', mb: 1.5 }} />
                                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, color: '#1a1a1a', fontSize: '1rem' }}>I'm a Couple</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ color: '#444', fontSize: '0.6rem' }}>Planning my own multi-day destination wedding</Typography>
                              </CardActionArea>
                            </Card>
                          </Grid>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <Card
                              elevation={0}
                              sx={{
                                borderRadius: '16px',
                                border: '2px solid',
                                borderColor: role === 'planner' ? '#DE3F5E' : 'transparent',
                                bgcolor: role === 'planner' ? alpha('#DE3F5E', 0.05) : '#f8f9fa',
                                transition: 'all 0.3s ease',
                                height: '100%'
                              }}
                            >
                              <CardActionArea sx={{ p: 3, height: '100%' }} onClick={() => setRole('planner')}>
                                <Work sx={{ fontSize: 40, color: '#DE3F5E', mb: 1.5 }} />
                                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, color: '#1a1a1a', fontSize: '1rem' }}>I'm a Planner</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ color: '#444', fontSize: '0.6rem' }}>Managing multiple weddings for my clients</Typography>
                              </CardActionArea>
                            </Card>
                          </Grid>
                        </Grid>
                      </Box>
                    )}

                    {/* STEP 2: NAMES, VENUE, DATE (Moved from step 4) */}
                    {step === 2 && (
                      <Box>
                        <Typography variant="h4" sx={{ fontFamily: 'var(--font-instrument-serif)', fontStyle: 'italic', mb: 0.5, color: '#1a1a1a', fontWeight: 700, fontSize: { xs: '1.6rem', md: '2rem' } }}>
                          Let's get ready to get planning
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#666', mb: 4, fontWeight: 400, fontSize: { xs: '0.9rem', md: '1rem' } }}>
                          We'll need a few details first.
                        </Typography>

                        <Box sx={{ maxWidth: '360px', mx: 'auto', textAlign: 'left' }}>
                          <Stack spacing={2.5}>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, color: '#1a1a1a', fontSize: '0.8rem' }}>Your First Name</Typography>
                              <StyledTextField
                                fullWidth
                                label=""
                                placeholder="Aarav"
                                value={coupleName}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setCoupleName(e.target.value.replace(/\s/g, ''))}
                                autoFocus
                              />
                            </Box>

                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, color: '#1a1a1a', fontSize: '0.8rem' }}>Your Partner's First Name</Typography>
                              <StyledTextField
                                fullWidth
                                label=""
                                placeholder="Ananya"
                                value={partnerName}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setPartnerName(e.target.value.replace(/\s/g, ''))}
                              />
                            </Box>

                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, color: '#1a1a1a', fontSize: '0.8rem' }}>Event Venue</Typography>
                              <StyledTextField
                                fullWidth
                                label=""
                                placeholder="Sheraton Grand"
                                value={venueName}
                                disabled={venueTbd}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setVenueName(e.target.value)}
                                sx={{ mb: 1 }}
                              />
                              <Stack direction="row" spacing={1} alignItems="center" onClick={() => setVenueTbd(!venueTbd)} sx={{ cursor: 'pointer' }}>
                                <Box
                                  sx={{
                                    width: 18,
                                    height: 18,
                                    borderRadius: '4px',
                                    border: '2px solid',
                                    borderColor: venueTbd ? '#1a1a1a' : 'rgba(0,0,0,0.25)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    bgcolor: 'transparent',
                                    transition: 'all 0.2s'
                                  }}
                                >
                                  {venueTbd && (
                                    <Box
                                      component="svg"
                                      viewBox="0 0 24 24"
                                      sx={{ width: 14, height: 14 }}
                                    >
                                      <path
                                        d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"
                                        fill="#1a1a1a"
                                      />
                                    </Box>
                                  )}
                                </Box>
                                <Typography variant="body2" sx={{ color: '#1a1a1a', fontWeight: 500, fontSize: '0.8rem' }}>
                                  We haven't picked a venue (yet)
                                </Typography>
                              </Stack>
                            </Box>

                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, color: '#1a1a1a', fontSize: '0.8rem' }}>Wedding Dates</Typography>
                              <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <Stack direction="row" spacing={2}>
                                  <Box sx={{ flex: 1 }}>
                                    <MobileDatePicker
                                      label=""
                                      disabled={dateTbd}
                                      value={weddingDate ? new Date(weddingDate) : null}
                                      onChange={(newValue) => setWeddingDate(newValue ? (newValue as Date).toISOString() : '')}
                                      enableAccessibleFieldDOMStructure={false}
                                      slots={{
                                        textField: StyledTextField,
                                      }}
                                      slotProps={{
                                        textField: {
                                          fullWidth: true,
                                          placeholder: "Date",
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
                                        calendarHeader: {
                                          sx: {
                                            '& .MuiPickersCalendarHeader-label': { color: '#000000', fontWeight: 700 },
                                            '& .MuiSvgIcon-root': { color: '#000000' }
                                          }
                                        },
                                        day: {
                                          sx: {
                                            color: '#000000 !important',
                                            fontWeight: 500,
                                            '&.Mui-selected': {
                                              backgroundColor: '#DE3F5E !important',
                                              color: '#ffffff !important',
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
                                  </Box>
                                  {!isOneDay && (
                                    <Box sx={{ flex: 1 }}>
                                      <MobileDatePicker
                                        label=""
                                        disabled={dateTbd}
                                        value={weddingEndDate ? new Date(weddingEndDate) : null}
                                        onChange={(newValue) => setWeddingEndDate(newValue ? (newValue as Date).toISOString() : '')}
                                        enableAccessibleFieldDOMStructure={false}
                                        slots={{
                                          textField: StyledTextField,
                                        }}
                                        slotProps={{
                                          textField: {
                                            fullWidth: true,
                                            placeholder: "End Date",
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
                                          calendarHeader: {
                                            sx: {
                                              '& .MuiPickersCalendarHeader-label': { color: '#000000', fontWeight: 700 },
                                              '& .MuiSvgIcon-root': { color: '#000000' }
                                            }
                                          },
                                          day: {
                                            sx: {
                                              color: '#000000 !important',
                                              fontWeight: 500,
                                              '&.Mui-selected': {
                                                backgroundColor: '#DE3F5E !important',
                                                color: '#ffffff !important',
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
                                    </Box>
                                  )}
                                </Stack>
                              </LocalizationProvider>
                              <Stack direction="row" spacing={3} sx={{ mt: 1.5 }}>
                                <Stack direction="row" spacing={1} alignItems="center" onClick={() => setIsOneDay(!isOneDay)} sx={{ cursor: 'pointer' }}>
                                  <Box
                                    sx={{
                                      width: 18,
                                      height: 18,
                                      borderRadius: '4px',
                                      border: '2px solid',
                                      borderColor: isOneDay ? '#1a1a1a' : 'rgba(0,0,0,0.25)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      bgcolor: 'transparent',
                                      transition: 'all 0.2s'
                                    }}
                                  >
                                    {isOneDay && (
                                      <Box
                                        component="svg"
                                        viewBox="0 0 24 24"
                                        sx={{ width: 14, height: 14 }}
                                      >
                                        <path
                                          d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"
                                          fill="#1a1a1a"
                                        />
                                      </Box>
                                    )}
                                  </Box>
                                  <Typography variant="body2" sx={{ color: '#1a1a1a', fontWeight: 500, fontSize: '0.8rem' }}>
                                    One day wedding
                                  </Typography>
                                </Stack>

                                <Stack direction="row" spacing={1} alignItems="center" onClick={() => setDateTbd(!dateTbd)} sx={{ cursor: 'pointer' }}>
                                  <Box
                                    sx={{
                                      width: 18,
                                      height: 18,
                                      borderRadius: '4px',
                                      border: '2px solid',
                                      borderColor: dateTbd ? '#1a1a1a' : 'rgba(0,0,0,0.25)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      bgcolor: 'transparent',
                                      transition: 'all 0.2s'
                                    }}
                                  >
                                    {dateTbd && (
                                      <Box
                                        component="svg"
                                        viewBox="0 0 24 24"
                                        sx={{ width: 14, height: 14 }}
                                      >
                                        <path
                                          d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"
                                          fill="#1a1a1a"
                                        />
                                      </Box>
                                    )}
                                  </Box>
                                  <Typography variant="body2" sx={{ color: '#1a1a1a', fontWeight: 500, fontSize: '0.8rem' }}>
                                    Dates TBD
                                  </Typography>
                                </Stack>
                              </Stack>
                            </Box>
                          </Stack>
                        </Box>
                      </Box>
                    )}

                    {/* STEP 3 & 4 (LEGACY) REMOVED */}

                    {/* Navigation Buttons */}
                    <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 5 }}>
                      {step > 1 && (
                        <Button
                          variant="text"
                          onClick={handleBack}
                          sx={{ color: '#666', fontWeight: 700, fontSize: '0.9rem' }}
                        >
                          Back
                        </Button>
                      )}
                      <Button
                        variant="contained"
                        endIcon={submitting ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : <ArrowForward sx={{ fontSize: 18 }} />}
                        title={
                          (step === 1 && !role) ? "Please select your role" :
                            (step === 2 && (!coupleName || (role === 'couple' && (!partnerName || (!weddingDate && !dateTbd))))) ? "Please fill in all celebration details" :
                              ""
                        }
                        onClick={() => {
                          if (step === 1 && !role) return;
                          if (step === 2 && (!coupleName || (role === 'couple' && (!partnerName || (!weddingDate && !dateTbd))))) return;
                          handleNext();
                        }}
                        sx={{
                          bgcolor: '#DE3F5E',
                          color: 'white',
                          px: 4,
                          py: 1,
                          borderRadius: '24px',
                          textTransform: 'none',
                          fontSize: '0.95rem',
                          fontWeight: 700,
                          boxShadow: '0 8px 24px rgba(222,63,94,0.3)',
                          opacity: (
                            (step === 1 && !role) ||
                            (step === 2 && (!coupleName || (role === 'couple' && (!partnerName || (!weddingDate && !dateTbd)))))
                          ) ? 0.6 : 1, // Desaturate if "disabled"
                          '&:hover': { bgcolor: '#C8365A' },
                        }}
                      >
                        {step === 2 ? (submitting ? 'Setting up...' : 'Start Planning') : 'Continue'}
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
