'use client';

import React, { useState, useEffect, useRef, useCallback, forwardRef, ChangeEvent } from 'react';
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
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
  Favorite,
  Work,
  Language,
  WhatsApp,
  EventNote,
  FlightTakeoff,
  ArrowForward,
  LocationOn,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase/client';
import OptimizedBackground from '@/components/ui/OptimizedBackground';
import { weddingService } from '@/lib/supabase/wedding-service';
import { generateGuestAvatar } from '@/lib/utils/avatar-generator';
import { COLORS, FONTS, RADII } from '@/lib/theme/tokens';
import { onboardingAnalytics } from '@/lib/analytics/onboarding';
import { useOnboardingExitTracking } from '@/lib/analytics/useOnboardingExitTracking';
import { PAID_TIERS } from '@/lib/agent/plan';

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

const StyledTextField = styled(TextField)({
  '& .MuiOutlinedInput-root': {
    borderRadius: RADII.md,
    backgroundColor: `${COLORS.bg.muted} !important`,
    fontSize: '0.9rem',
    '& fieldset': {
      borderColor: 'rgba(222, 63, 94, 0.2) !important',
      borderWidth: '1px !important',
    },
    '&:hover fieldset': {
      borderColor: 'rgba(222, 63, 94, 0.4) !important',
    },
    '&.Mui-focused fieldset': {
      borderColor: `${COLORS.brand.primary} !important`,
      borderWidth: '2px !important',
    },
    '& input': {
      color: `${COLORS.text.strong} !important`,
      WebkitTextFillColor: `${COLORS.text.strong} !important`,
      padding: '10px 14px',
      fontSize: '0.9rem',
    },
    '& .MuiPickersSectionList-selectableSection': {
      color: `${COLORS.text.strong} !important`,
    },
    '& .MuiInputAdornment-root .MuiSvgIcon-root': {
      color: `${COLORS.text.subtle} !important`,
    },
  },
  '& .MuiInputLabel-root': {
    color: `${COLORS.text.subtle} !important`,
    fontSize: '0.875rem',
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: `${COLORS.brand.primary} !important`,
  },
});

const inputStyles = {
  // Keeping this for legacy compatibility or if needed for other components
};

// Custom input for react-datepicker that matches StyledTextField look
const DateRangeInput = forwardRef<HTMLInputElement, { value?: string; onClick?: () => void; disabled?: boolean }>(
  ({ value, onClick, disabled }, ref) => (
    <input
      ref={ref}
      value={value}
      onClick={onClick}
      readOnly
      disabled={disabled}
      placeholder="Select dates"
      style={{
        width: '100%',
        padding: '10px 14px',
        borderRadius: RADII.md,
        border: '1px solid rgba(222, 63, 94, 0.2)',
        backgroundColor: COLORS.bg.muted,
        fontSize: '0.9rem',
        color: COLORS.text.strong,
        fontFamily: 'inherit',
        outline: 'none',
        cursor: disabled ? 'default' : 'pointer',
        boxSizing: 'border-box',
        opacity: disabled ? 0.5 : 1,
      }}
      onFocus={(e) => { e.target.style.borderColor = COLORS.brand.primary; e.target.style.borderWidth = '2px'; e.target.style.padding = '9px 13px'; }}
      onBlur={(e) => { e.target.style.borderColor = 'rgba(222, 63, 94, 0.2)'; e.target.style.borderWidth = '1px'; e.target.style.padding = '10px 14px'; }}
    />
  )
);
DateRangeInput.displayName = 'DateRangeInput';

export default function OnboardingPage() {
  const router = useRouter();
  const [authUser, setAuthUser] = useState<any>(null);
  const [step, setStep] = useState<OnboardingStep>(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  // Set true the moment we commit to a successful finish, so the exit tracker
  // (which can fire during the post-onboarding redirect) doesn't log a bounce.
  const completedRef = useRef(false);
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

  const [venueLocation, setVenueLocation] = useState(''); // "City, Country" parsed from Mapbox
  const [venueSuggestions, setVenueSuggestions] = useState<Array<{ id: string; name: string; place_name: string }>>([]);
  const [venueSearchLoading, setVenueSearchLoading] = useState(false);
  const [showVenueSuggestions, setShowVenueSuggestions] = useState(false);
  const venueDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const venueContainerRef = useRef<HTMLDivElement>(null);
  const venueSessionTokenRef = useRef<string>(typeof crypto !== 'undefined' ? crypto.randomUUID() : '');
  const [companyName, setCompanyName] = useState('');
  const [plannerLocation, setPlannerLocation] = useState('');
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Preparing your experience...');

  // Service-oriented onboarding fields
  const [coupleCountry, setCoupleCountry] = useState('');
  const [coupleCity, setCoupleCity] = useState('');
  const [estimatedGuestCount, setEstimatedGuestCount] = useState('');
  const [hasNonIndianGuests, setHasNonIndianGuests] = useState(false);
  const [weddingLocationType, setWeddingLocationType] = useState('');
  const [destination, setDestination] = useState('');

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  // Close venue suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (venueContainerRef.current && !venueContainerRef.current.contains(event.target as Node)) {
        setShowVenueSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchVenues = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2 || !mapboxToken) {
      setVenueSuggestions([]);
      return;
    }
    setVenueSearchLoading(true);
    try {
      const url = `https://api.mapbox.com/search/searchbox/v1/suggest?q=${encodeURIComponent(
        searchQuery
      )}&access_token=${mapboxToken}&session_token=${venueSessionTokenRef.current}&types=poi,address,place,locality,neighborhood&limit=8`;
      const response = await fetch(url);
      const data = await response.json();
      const mapped = (data.suggestions || []).map((s: any) => ({
        id: s.mapbox_id,
        name: s.name,
        place_name: s.full_address || s.place_formatted || s.name,
      }));
      setVenueSuggestions(mapped);
    } catch (error) {
      console.error('Error searching venues:', error);
      setVenueSuggestions([]);
    } finally {
      setVenueSearchLoading(false);
    }
  }, [mapboxToken]);

  const handleVenueInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setVenueName(val);
    setShowVenueSuggestions(true);
    // Clear parsed location when user edits
    setVenueLocation('');
    if (venueDebounceRef.current) clearTimeout(venueDebounceRef.current);
    venueDebounceRef.current = setTimeout(() => searchVenues(val), 300);
  };

  const handleSelectVenue = async (feature: { id: string; name: string; place_name: string }) => {
    if (!mapboxToken) return;
    setVenueSearchLoading(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/search/searchbox/v1/retrieve/${feature.id}?access_token=${mapboxToken}&session_token=${venueSessionTokenRef.current}`
      );
      const data = await response.json();
      const retrieved = data.features?.[0];
      if (retrieved) {
        const displayName = feature.name || retrieved.properties?.name || feature.place_name;
        setVenueName(displayName);

        // Parse city and country from context
        const ctx = retrieved.properties?.context;
        const city = ctx?.place?.name || ctx?.locality?.name || ctx?.region?.name || '';
        const country = ctx?.country?.name || '';
        if (city && country) {
          setVenueLocation(`${city}, ${country}`);
        } else if (country) {
          setVenueLocation(country);
        } else if (city) {
          setVenueLocation(city);
        }
      }
    } catch (error) {
      console.error('Error retrieving venue details:', error);
    } finally {
      setVenueSearchLoading(false);
    }
    setShowVenueSuggestions(false);
    setVenueSuggestions([]);
    venueSessionTokenRef.current = crypto.randomUUID();
  };

  // Restore settings or redirect if no user is found
  useEffect(() => {
    const checkSession = async () => {
      const { data: { user: sessionUser } } = await supabase.auth.getUser();
      if (sessionUser) {
        setAuthUser(sessionUser);
        // Onboarding is a high-intent flow — force a session replay and mark
        // the funnel entry so we can see where users click and where they drop.
        onboardingAnalytics.startSessionReplay();
        onboardingAnalytics.started({ role: null, startStep: 1 });
        restoreSettings(sessionUser.id);
      } else {
        router.push('/auth/login');
      }
    };
    checkSession();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Funnel: record each step the user actually sees.
  useEffect(() => {
    if (loading) return;
    onboardingAnalytics.stepViewed(step, role);
  }, [step, role, loading]);

  // Abandonment: emit an event (with the step they left on) when the user
  // backgrounds or closes the tab without finishing.
  useOnboardingExitTracking(() => ({
    step,
    role,
    completed: completedRef.current,
    hadInput: Boolean(
      coupleName || partnerName || venueName || weddingDate ||
      companyName || plannerLocation || selectedFeatures.length
    ),
  }));

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

      if (settings?.onboarding_completed) {
        if (settings.account_type === 'planner') {
          console.log('[Onboarding DEBUG] Planner onboarding completed. Redirecting to admin.');
          router.push('/admin');
          return;
        }

        if (settings.subscription_tier === 'basic') {
          // Verify user actually has a wedding before skipping onboarding.
          // Exclude demo clones so a stale demo session doesn't short-circuit
          // the onboarding flow for a real wedding.
          const { data: wedding } = await supabase
            .from('weddings')
            .select('slug')
            .eq('created_by', userId)
            .not('slug', 'like', 'demo-%')
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
      }

      if (settings) {
        console.log('[Onboarding DEBUG] restoreSettings: Applying existing settings to state:', {
          role: settings.account_type,
          features: settings.enabled_features,
          tier: settings.subscription_tier
        });
        if (settings.account_type) setRole(settings.account_type as UserRole);
        if (settings.enabled_features) setSelectedFeatures(settings.enabled_features);
        // Map canonical tiers back onto the wizard's basic/pro UI state.
        if (settings.subscription_tier) {
          setPlan(['phera_premium', 'phera_grand', 'planner', 'pro'].includes(settings.subscription_tier) ? 'pro' : 'basic');
        }
      } else {
        console.log('[Onboarding DEBUG] restoreSettings: No existing settings found, starting fresh.');
        const params = new URLSearchParams(window.location.search);
        if (params.get('role') === 'planner') {
          setRole('planner');
          onboardingAnalytics.roleSelected('planner');
          onboardingAnalytics.stepCompleted(1, 'planner');
          // Start at step 2 if we pre-selected planner to reduce friction
          setStep(2);
        }
      }
    } catch (err) {
      console.error('[Onboarding DEBUG] FATAL error in restoreSettings:', err);
    } finally {
      setLoading(false);
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
    venueLocation?: string | null,
    selectedFeatures: string[],
    companyName?: string,
    plannerLocation?: string,
  }) => {
    console.log('[Onboarding DEBUG] Starting finalizeOnboarding with data:', data);
    console.log('[Onboarding DEBUG] Supabase client available:', !!supabase);

    try {
      // 1. Save user settings (with avatar)
      console.log('[Onboarding DEBUG] Step 1: Upserting user_settings...');
      const userEmail = authUser?.email || data.userId;
      const avatar = generateGuestAvatar(userEmail, data.coupleName);
      // Canonical tiers only ('phera' = free) — the legacy 'basic'/'pro' values
      // made every wizard signup read as Pro (isPro treats non-'phera' as paid).
      const desiredTier =
        data.role === 'planner' ? 'planner' : data.plan === 'pro' ? 'phera_premium' : 'phera';
      // NEVER downgrade an existing paid tier. The wizard has no payment step and
      // submits plan:'basic' unconditionally, so a paying user who re-enters
      // /onboarding would otherwise be written back down to free — and a
      // phera_grand user would be flattened to phera_premium.
      const { data: currentSettings } = await supabase
        .from('user_settings')
        .select('subscription_tier')
        .eq('user_id', data.userId)
        .maybeSingle();
      const currentTier = (currentSettings as { subscription_tier?: string } | null)?.subscription_tier;
      const subscriptionTier =
        currentTier && PAID_TIERS.has(currentTier) ? currentTier : desiredTier;

      const settingsToSave: Record<string, any> = {
        user_id: data.userId,
        account_type: data.role,
        enabled_features: data.selectedFeatures,
        subscription_tier: subscriptionTier,
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

      // 2. Create planner profile if applicable
      if (data.role === 'planner' && data.companyName) {
        console.log('[Onboarding DEBUG] Step 2: Creating planner profile...');
        await weddingService.createPlannerProfile({
          userId: data.userId,
          companyName: data.companyName,
          location: data.plannerLocation || '',
        });
        console.log('[Onboarding DEBUG] Step 2 SUCCESS: Planner profile created');
      }

      // 3. Create Wedding if applicable
      if (data.role === 'couple' && data.coupleName) {
        console.log('[Onboarding DEBUG] Step 2: Creating wedding record...');
        const fullCoupleName = data.partnerName ? `${data.coupleName} & ${data.partnerName}` : data.coupleName;
        let baseSlug = (data.partnerName ? `${data.coupleName}-${data.partnerName}` : data.coupleName).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
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
              couple_name: fullCoupleName,
              partner1_name: data.coupleName,
              partner2_name: data.partnerName || null,
              wedding_date: data.weddingDate
                ? new Date(data.weddingDate).toISOString()
                : new Date(0).toISOString(),
              wedding_date_end: data.weddingEndDate ? new Date(data.weddingEndDate).toISOString() : null,
              wedding_date_display: data.weddingDate
                ? (() => {
                  const start = new Date(data.weddingDate);
                  const end = data.weddingEndDate ? new Date(data.weddingEndDate) : null;
                  const fmt = (d: Date) => d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();
                  const fmtDay = (d: Date) => d.getDate().toString();
                  const fmtMonth = (d: Date) => d.toLocaleDateString('en-US', { month: 'long' }).toUpperCase();
                  const fmtYear = (d: Date) => d.getFullYear().toString();
                  if (!end || start.getTime() === end.getTime()) return fmt(start);
                  if (fmtYear(start) !== fmtYear(end)) return `${fmt(start)} - ${fmt(end)}`;
                  if (fmtMonth(start) !== fmtMonth(end)) return `${fmtDay(start)} ${fmtMonth(start)} - ${fmtDay(end)} ${fmtMonth(end)}, ${fmtYear(start)}`;
                  return `${fmtDay(start)}-${fmtDay(end)} ${fmtMonth(start)}, ${fmtYear(start)}`;
                })()
                : 'Dates TBD',
              venue_name: (data.venueName === 'TBD' || !data.venueName) ? 'Venue TBD' : data.venueName,
              venue_location: data.venueLocation || '',
              rsvp_deadline: '',
              status: 'draft',
              created_by: data.userId,
              background_image: '/images/backgrounds/blue-clouds.webp',
              primary_color: COLORS.brand.primary,
              couple_images: ['/images/couple/placeholder1.png', '/images/couple/placeholder2.png'],
              couple_image_url: '/images/couple/placeholder1.png',
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

      // Planners land in a free, blank first wedding's Planner chat rather than
      // the $249 paywall — give them a workspace to start in immediately.
      if (data.role === 'planner') {
        console.log('[Onboarding DEBUG] Planner onboarding complete, creating free first wedding...');
        setLoadingMessage('All set! Opening your first wedding…');

        // Unguessable draft slug — a raw UUID, matching the couple AI-first
        // flow. (The old 'wedding-N' counter produced guessable, enumerable
        // slugs and cost a round-trip per collision.)
        let slug = globalThis.crypto?.randomUUID?.() ?? `w-${Date.now()}`;

        console.log('[Onboarding DEBUG] Planner first-wedding slug decided:', slug);

        let plannerWedding = null;
        let creationAttempts = 0;
        const maxAttempts = 3;

        while (creationAttempts < maxAttempts) {
          try {
            plannerWedding = await weddingService.createWedding({
              slug,
              couple_name: 'New Wedding',
              partner1_name: 'New',
              partner2_name: null,
              wedding_date: new Date(0).toISOString(),
              wedding_date_end: null,
              wedding_date_display: 'Dates TBD',
              venue_name: 'Venue TBD',
              venue_location: '',
              rsvp_deadline: '',
              status: 'draft',
              created_by: data.userId,
              background_image: '/images/backgrounds/blue-clouds.webp',
              primary_color: COLORS.brand.primary,
              couple_images: ['/images/couple/placeholder1.png', '/images/couple/placeholder2.png'],
              couple_image_url: '/images/couple/placeholder1.png',
            });

            if (plannerWedding) break;

            // If creation failed (returned null), it might be a race condition
            // slug conflict — a fresh UUID sidesteps it without any lookups.
            console.warn(`[Onboarding DEBUG] Planner wedding creation attempt ${creationAttempts + 1} failed. Retrying with new slug...`);
            slug = globalThis.crypto?.randomUUID?.() ?? `w-${Date.now()}-${creationAttempts}`;
          } catch (e) {
            console.error(`[Onboarding DEBUG] Exception during planner wedding creation attempt ${creationAttempts + 1}:`, e);
          }
          creationAttempts++;
        }

        if (plannerWedding) {
          console.log('[Onboarding DEBUG] Planner first wedding created, opening assistant...');
          router.push(`/admin/${slug}/assistant?welcome=1`);
          return;
        }

        // Couldn't create a wedding after retries — fall back to the planner
        // dashboard rather than the $249 /admin/new wall.
        console.error('[Onboarding DEBUG] Planner wedding creation failed after all attempts, falling back to dashboard');
        router.push('/admin');
        return;
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
      onboardingAnalytics.stepCompleted(step, role);
      setStep((step + 1) as OnboardingStep);
    }
    else {
      console.log('[Onboarding] Final step, calling handleSubmit');
      handleSubmit();
    }
  };

  const handleBack = () => {
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
    onboardingAnalytics.stepCompleted(2, role);
    setLoading(true);
    setLoadingMessage('Creating your wedding workspace...');
    setSubmitting(true);
    // Optimistically mark complete so the redirect that follows isn't logged as
    // an abandonment; rolled back in catch if finalize throws.
    completedRef.current = true;
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
        venueLocation: venueTbd ? null : venueLocation,
        selectedFeatures,
        companyName,
        plannerLocation,
      });

      onboardingAnalytics.completed({
        role: role as UserRole,
        goalCount: 0,
        hasVenue: Boolean(venueName) && !venueTbd,
        hasDate: Boolean(weddingDate) && !dateTbd,
        plan,
      });
    } catch (error) {
      console.error('[Onboarding DEBUG] handleSubmit: Error completing onboarding:', error);
      completedRef.current = false;
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
        bgcolor: COLORS.bg.muted,
        gap: 3
      }}>
        <CircularProgress sx={{ color: COLORS.brand.primary }} />
        <Typography
          variant="h6"
          sx={{
            color: COLORS.text.strong,
            fontWeight: 400,
            fontFamily: FONTS.display,
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
          maxWidth: '600px',
          transition: 'max-width 0.5s ease-in-out'
        }}>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              <Paper elevation={0} sx={{
                py: { xs: 2.5, md: 4 },
                px: { xs: 1.5, md: 3 },
                borderRadius: RADII.dialog,
                bgcolor: alpha(COLORS.bg.white, 0.9),
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
                    <CircularProgress sx={{ color: COLORS.brand.primary }} />
                    <Typography variant="h6" sx={{ color: COLORS.text.strong, fontWeight: 800 }}>
                      Preparing your workspace...
                    </Typography>
                  </Box>
                )}

                <>
                    {/* STEP 1: ROLE SELECTION */}
                    {step === 1 && (
                      <Box>
                        <Typography variant="h4" sx={{ fontFamily: FONTS.display, fontStyle: 'italic', mb: 1, color: COLORS.text.strong, fontWeight: 400, fontSize: { xs: '1.6rem', md: '2rem' } }}>
                          Welcome to Phera
                        </Typography>
                        <Typography variant="body2" sx={{ color: COLORS.text.subtle, mb: 4, fontWeight: 400, fontSize: { xs: '0.9rem', md: '1rem' } }}>
                          How do you plan to use our platform?
                        </Typography>

                        <Grid container spacing={2} sx={{ maxWidth: '500px', mx: 'auto' }}>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <Card
                              elevation={0}
                              sx={{
                                borderRadius: RADII.lg,
                                border: '2px solid',
                                borderColor: role === 'couple' ? COLORS.brand.primary : 'transparent',
                                bgcolor: role === 'couple' ? alpha(COLORS.brand.primary, 0.05) : COLORS.bg.muted,
                                transition: 'all 0.3s ease',
                                height: '100%'
                              }}
                            >
                              <CardActionArea
                                sx={{ p: 3, height: '100%' }}
                                onClick={() => { setRole('couple'); onboardingAnalytics.roleSelected('couple'); onboardingAnalytics.stepCompleted(1, 'couple'); setStep(2); }}
                              >
                                <Favorite sx={{ fontSize: 40, color: COLORS.brand.primary, mb: 1.5 }} />
                                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, color: COLORS.text.strong, fontSize: '1rem' }}>I'm a Couple</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ color: COLORS.text.muted, fontSize: '0.875rem' }}>Planning my own wedding</Typography>
                              </CardActionArea>
                            </Card>
                          </Grid>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <Card
                              elevation={0}
                              sx={{
                                borderRadius: RADII.lg,
                                border: '2px solid',
                                borderColor: role === 'planner' ? COLORS.brand.primary : 'transparent',
                                bgcolor: role === 'planner' ? alpha(COLORS.brand.primary, 0.05) : COLORS.bg.muted,
                                transition: 'all 0.3s ease',
                                height: '100%'
                              }}
                            >
                              <CardActionArea
                                sx={{ p: 3, height: '100%' }}
                                onClick={() => { setRole('planner'); onboardingAnalytics.roleSelected('planner'); onboardingAnalytics.stepCompleted(1, 'planner'); setStep(2); }}
                              >
                                <Work sx={{ fontSize: 40, color: COLORS.brand.primary, mb: 1.5 }} />
                                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, color: COLORS.text.strong, fontSize: '1rem' }}>I'm a Planner</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ color: COLORS.text.muted, fontSize: '0.875rem' }}>Managing multiple weddings</Typography>
                              </CardActionArea>
                            </Card>
                          </Grid>
                        </Grid>
                      </Box>
                    )}

                    {/* STEP 2: NAMES, VENUE, DATE (Moved from step 4) */}
                    {step === 2 && (
                      <Box>
                        <Typography variant="h4" sx={{ fontFamily: FONTS.display, fontStyle: 'italic', mb: 0.5, color: COLORS.text.strong, fontWeight: 400, fontSize: { xs: '1.6rem', md: '2rem' } }}>
                          {role === 'planner' ? 'Tell us about your business' : "Let's get your wedding set up"}
                        </Typography>
                        <Typography variant="body2" sx={{ color: COLORS.text.subtle, mb: 4, fontWeight: 400, fontSize: { xs: '0.9rem', md: '1rem' } }}>
                          We'll need a few details first.
                        </Typography>

                        <Box sx={{ maxWidth: role === 'couple' ? '420px' : '360px', mx: 'auto', textAlign: 'left' }}>
                          <Stack spacing={2.5}>
                            {role === 'planner' && (
                              <>
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, color: COLORS.text.strong, fontSize: '0.875rem' }}>Company / Business Name</Typography>
                                  <StyledTextField
                                    fullWidth
                                    label=""
                                    placeholder="Elegant Events Co."
                                    value={companyName}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setCompanyName(e.target.value)}
                                    autoFocus
                                  />
                                </Box>

                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, color: COLORS.text.strong, fontSize: '0.875rem' }}>Where are you based?</Typography>
                                  <StyledTextField
                                    fullWidth
                                    label=""
                                    placeholder="Mumbai, India"
                                    value={plannerLocation}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setPlannerLocation(e.target.value)}
                                  />
                                </Box>
                              </>
                            )}

                            {role === 'couple' && (
                              <>
                                <Stack direction="row" spacing={2}>
                                  <Box sx={{ flex: 1 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, color: COLORS.text.strong, fontSize: '0.875rem' }}>Your First Name</Typography>
                                    <StyledTextField
                                      fullWidth
                                      label=""
                                      placeholder="Aarav"
                                      value={coupleName}
                                      onChange={(e: ChangeEvent<HTMLInputElement>) => setCoupleName(e.target.value.replace(/\s/g, ''))}
                                      autoFocus
                                    />
                                  </Box>
                                  <Box sx={{ flex: 1 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, color: COLORS.text.strong, fontSize: '0.875rem' }}>Partner's First Name</Typography>
                                    <StyledTextField
                                      fullWidth
                                      label=""
                                      placeholder="Ananya"
                                      value={partnerName}
                                      onChange={(e: ChangeEvent<HTMLInputElement>) => setPartnerName(e.target.value.replace(/\s/g, ''))}
                                    />
                                  </Box>
                                </Stack>

                                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ my: 0.5 }}>
                                  <Divider sx={{ flex: 1, borderColor: 'rgba(0,0,0,0.1)' }} />
                                  <Typography variant="caption" sx={{ color: COLORS.text.faint, fontWeight: 500, fontSize: '0.875rem', whiteSpace: 'nowrap', flexShrink: 0 }}>
                                    Optionally provide details below
                                  </Typography>
                                  <Divider sx={{ flex: 1, borderColor: 'rgba(0,0,0,0.1)' }} />
                                </Stack>

                                <Box ref={venueContainerRef} sx={{ position: 'relative' }}>
                                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, color: COLORS.text.strong, fontSize: '0.875rem' }}>Event Venue</Typography>
                                  <StyledTextField
                                    fullWidth
                                    label=""
                                    placeholder="Search for a venue..."
                                    value={venueName}
                                    disabled={venueTbd}
                                    onChange={handleVenueInputChange}
                                    onFocus={() => { if (venueSuggestions.length > 0) setShowVenueSuggestions(true); }}
                                    InputProps={{
                                      endAdornment: venueSearchLoading ? (
                                        <CircularProgress size={18} sx={{ color: COLORS.brand.primary }} />
                                      ) : null,
                                    }}
                                    sx={{ mb: 1 }}
                                  />
                                  {/* Venue suggestions dropdown */}
                                  {showVenueSuggestions && venueSuggestions.length > 0 && (
                                    <Paper
                                      elevation={4}
                                      sx={{
                                        position: 'absolute',
                                        // top: 'calc(100% - 30px)',
                                        left: 0,
                                        right: 0,
                                        zIndex: 1000,
                                        borderRadius: 1,
                                        bgcolor: COLORS.bg.white,
                                        overflow: 'hidden',
                                        maxHeight: 240,
                                        overflowY: 'auto',
                                      }}
                                    >
                                      <List sx={{ py: 0 }}>
                                        {venueSuggestions.map((s) => (
                                          <ListItemButton
                                            key={s.id}
                                            onClick={() => handleSelectVenue(s)}
                                            sx={{ py: 1, '&:hover': { bgcolor: alpha(COLORS.brand.primary, 0.05) } }}
                                          >
                                            <ListItemIcon sx={{ minWidth: 36 }}>
                                              <LocationOn sx={{ color: COLORS.brand.primary, fontSize: 20 }} />
                                            </ListItemIcon>
                                            <ListItemText
                                              primary={<Typography sx={{ fontWeight: 500, color: COLORS.text.strong, fontSize: '0.875rem' }}>{s.name}</Typography>}
                                              secondary={<Typography variant="caption" sx={{ color: COLORS.text.subtle }}>{s.place_name}</Typography>}
                                            />
                                          </ListItemButton>
                                        ))}
                                      </List>
                                    </Paper>
                                  )}
                                  <Stack direction="row" spacing={1} alignItems="center" onClick={() => { if (!venueTbd) { setVenueName(''); setVenueLocation(''); } setVenueTbd(!venueTbd); }} sx={{ cursor: 'pointer' }}>
                                    <Box
                                      sx={{
                                        width: 15,
                                        height: 15,
                                        borderRadius: '3px',
                                        border: '1.5px solid',
                                        borderColor: venueTbd ? COLORS.text.faint : 'rgba(0,0,0,0.2)',
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
                                          sx={{ width: 11, height: 11 }}
                                        >
                                          <path
                                            d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"
                                            fill={COLORS.text.faint}
                                          />
                                        </Box>
                                      )}
                                    </Box>
                                    <Typography variant="caption" sx={{ color: COLORS.text.faint, fontWeight: 400, fontSize: '0.875rem' }}>
                                      Venue TBD
                                    </Typography>
                                  </Stack>
                                </Box>

                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, color: COLORS.text.strong, fontSize: '0.875rem' }}>Wedding Dates</Typography>
                                  <DatePicker
                                    selectsRange
                                    startDate={weddingDate ? new Date(weddingDate) : undefined}
                                    endDate={weddingEndDate ? new Date(weddingEndDate) : undefined}
                                    onChange={(dates) => {
                                      const [start, end] = dates as [Date | null, Date | null];
                                      setWeddingDate(start ? start.toISOString() : '');
                                      setWeddingEndDate(end ? end.toISOString() : '');
                                    }}
                                    disabled={dateTbd}
                                    customInput={<DateRangeInput />}
                                    dateFormat="MMM d, yyyy"
                                    monthsShown={1}
                                    showMonthDropdown
                                    showYearDropdown
                                    dropdownMode="select"
                                    yearDropdownItemNumber={5}
                                    scrollableYearDropdown
                                    wrapperClassName="onboarding-datepicker-wrapper"
                                  />
                                  <Stack direction="row" spacing={1} alignItems="center" onClick={() => { if (!dateTbd) { setWeddingDate(''); setWeddingEndDate(''); } setDateTbd(!dateTbd); }} sx={{ cursor: 'pointer', mt: 1 }}>
                                    <Box
                                      sx={{
                                        width: 15,
                                        height: 15,
                                        borderRadius: '3px',
                                        border: '1.5px solid',
                                        borderColor: dateTbd ? COLORS.text.faint : 'rgba(0,0,0,0.2)',
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
                                          sx={{ width: 11, height: 11 }}
                                        >
                                          <path
                                            d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"
                                            fill={COLORS.text.faint}
                                          />
                                        </Box>
                                      )}
                                    </Box>
                                    <Typography variant="caption" sx={{ color: COLORS.text.faint, fontWeight: 400, fontSize: '0.875rem' }}>
                                      Dates TBD
                                    </Typography>
                                  </Stack>
                                </Box>

                              </>
                            )}
                          </Stack>
                        </Box>
                      </Box>
                    )}

                    {/* Navigation Buttons — hidden on step 1 (role cards auto-advance) */}
                    {step > 1 && (
                      <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 5 }}>
                        <Button
                          variant="text"
                          onClick={handleBack}
                          sx={{ color: COLORS.text.subtle, fontWeight: 700, fontSize: '0.9rem' }}
                        >
                          Back
                        </Button>
                        <Button
                          variant="contained"
                          endIcon={submitting ? <CircularProgress size={18} sx={{ color: COLORS.text.inverse }} /> : <ArrowForward sx={{ fontSize: 18 }} />}
                          title={
                            (step === 2 && role === 'couple' && (!coupleName || !partnerName || (!weddingDate && !dateTbd))) ? "Please fill in all celebration details" :
                              (step === 2 && role === 'planner' && !companyName) ? "Please enter your company name" :
                                ""
                          }
                          onClick={() => {
                            if (step === 2 && role === 'couple' && (!coupleName || !partnerName || (!weddingDate && !dateTbd))) return;
                            if (step === 2 && role === 'planner' && !companyName) return;
                            handleNext();
                          }}
                          sx={{
                            bgcolor: COLORS.brand.primary,
                            color: COLORS.text.inverse,
                            px: 4,
                            py: 1,
                            borderRadius: RADII.dialog,
                            textTransform: 'none',
                            fontSize: '0.95rem',
                            fontWeight: 700,
                            boxShadow: '0 8px 24px rgba(222,63,94,0.3)',
                            opacity: (
                              (step === 2 && role === 'couple' && (!coupleName || !partnerName || (!weddingDate && !dateTbd))) ||
                              (step === 2 && role === 'planner' && !companyName)
                            ) ? 0.6 : 1,
                            '&:hover': { bgcolor: COLORS.brand.primaryHover },
                          }}
                        >
                          {step === 2 ? (submitting ? 'Setting up...' : 'Get Started') : 'Continue'}
                        </Button>
                      </Stack>
                    )}
                </>
              </Paper>
            </motion.div>
          </AnimatePresence>

          {/* Progress Dots */}
          <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 3 }}>
            {[1, 2].map(s => (
              <Box
                key={s}
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: step >= s ? COLORS.brand.primary : alpha(COLORS.brand.primary, 0.15),
                  transition: 'background-color 0.3s ease',
                }}
              />
            ))}
          </Stack>
        </Box>
      </Container>
    </OptimizedBackground>
  );
}
