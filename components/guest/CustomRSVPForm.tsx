'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  FormControl,
  FormControlLabel,
  FormLabel,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Select,
  Stack,
  TextField,
  Typography,
  useTheme,
  useMediaQuery,
  Chip,
  Alert,
  Collapse,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormHelperText,
  CircularProgress,
  alpha,
} from '@mui/material';
import StreamlineIcon from '@/components/ui/StreamlineIcon';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FavoriteOutlined,
  CheckCircleOutlined,
  Add as AddIcon,
  Remove as RemoveIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { submitRSVP, getExistingRSVP } from '@/lib/supabase/rsvp-service';
import { RSVPFormData as SupabaseRSVPFormData } from '@/lib/supabase/types';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import Confetti from 'react-confetti';
import GifPicker from '@/components/ui/GifPicker';
import { GifData, RSVPFormData } from '@/lib/supabase/types';
import FullScreenFormContainer from '@/components/shared/FullScreenFormContainer';
import { WEDDING_CONFIG } from '@/lib/constants/wedding-config';


const initialFormData: RSVPFormData = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  countryCode: '+1',
  phone: '',
  attending: '',
  plusOne: '',
  plusOneName: '',
  plusOneEmail: '',
  plusOneCountryCode: '+1', // <-- Added
  plusOnePhone: '', // <-- Added
  guestCount: 1,
  foodPreference: [],
  dietaryRestrictions: '',
  weddingSide: '',
  songRequest: '',
  specialMessage: '',
  maybeComment: '',
  selectedGif: undefined,
  arrivalOption: '',
  arrivalDate: '',
  // Flight Details
  flightAirline: '',
  flightNumber: '',
  flightDepartureAirport: '',
  flightArrivalAirport: '',
  flightDepartureDate: '',
  flightDepartureTime: '',
  flightArrivalDate: '',
  flightArrivalTime: '',
  shuttlePreferenceTime: '',
  shuttlePreferenceNote: '',
};

const foodPreferences = [
  'Vegetarian',
  'Non-Vegetarian',
  'Vegan',
  'Jain Food',
  'No Preference',
];

const weddingSideOptions = [
  { value: 'bride', label: "Bride's Side" },
  { value: 'groom', label: "Groom's Side" },
  { value: 'both', label: "I can't pick!" },
];

const countryCodes = [
  // North America
  { code: '+1', country: 'US/CA', flag: '🇺🇸' },
  { code: '+52', country: 'Mexico', flag: '🇲🇽' },
  // Europe
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+32', country: 'Belgium', flag: '🇧🇪' },
  { code: '+31', country: 'Netherlands', flag: '🇳🇱' },
  { code: '+39', country: 'Italy', flag: '🇮🇹' },
  { code: '+34', country: 'Spain', flag: '🇪🇸' },
  { code: '+351', country: 'Portugal', flag: '🇵🇹' },
  { code: '+41', country: 'Switzerland', flag: '🇨🇭' },
  { code: '+43', country: 'Austria', flag: '🇦🇹' },
  { code: '+45', country: 'Denmark', flag: '🇩🇰' },
  { code: '+46', country: 'Sweden', flag: '🇸🇪' },
  { code: '+47', country: 'Norway', flag: '🇳🇴' },
  { code: '+358', country: 'Finland', flag: '🇫🇮' },
  { code: '+48', country: 'Poland', flag: '🇵🇱' },
  { code: '+353', country: 'Ireland', flag: '🇮🇪' },
  { code: '+30', country: 'Greece', flag: '🇬🇷' },
  { code: '+420', country: 'Czech Republic', flag: '🇨🇿' },
  { code: '+36', country: 'Hungary', flag: '🇭🇺' },
  { code: '+7', country: 'Russia', flag: '🇷🇺' },
  // Asia Pacific
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+66', country: 'Thailand', flag: '🇹🇭' },
  { code: '+62', country: 'Indonesia', flag: '🇮🇩' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬' },
  { code: '+60', country: 'Malaysia', flag: '🇲🇾' },
  { code: '+63', country: 'Philippines', flag: '🇵🇭' },
  { code: '+84', country: 'Vietnam', flag: '🇻🇳' },
  { code: '+81', country: 'Japan', flag: '🇯🇵' },
  { code: '+82', country: 'South Korea', flag: '🇰🇷' },
  { code: '+86', country: 'China', flag: '🇨🇳' },
  { code: '+852', country: 'Hong Kong', flag: '🇭🇰' },
  { code: '+886', country: 'Taiwan', flag: '🇹🇼' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+64', country: 'New Zealand', flag: '🇳🇿' },
  // Middle East
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
  { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+972', country: 'Israel', flag: '🇮🇱' },
  { code: '+90', country: 'Turkey', flag: '🇹🇷' },
  // Africa
  { code: '+27', country: 'South Africa', flag: '🇿🇦' },
  { code: '+234', country: 'Nigeria', flag: '🇳🇬' },
  { code: '+254', country: 'Kenya', flag: '🇰🇪' },
  { code: '+20', country: 'Egypt', flag: '🇪🇬' },
  // South America
  { code: '+55', country: 'Brazil', flag: '🇧🇷' },
  { code: '+54', country: 'Argentina', flag: '🇦🇷' },
  { code: '+57', country: 'Colombia', flag: '🇨🇴' },
  { code: '+56', country: 'Chile', flag: '🇨🇱' },
];

interface CustomRSVPFormProps {
  weddingId?: string;
}

export default function CustomRSVPForm({ weddingId = 'simran-karanvir' }: CustomRSVPFormProps) {

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const router = useRouter();
  const { user, refreshAuth, checkRSVPStatus } = useAuth();
  const [formData, setFormData] = useState<RSVPFormData>(initialFormData);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [isLoadingExisting, setIsLoadingExisting] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);

  // Authentication states for Account Creation step
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if plus-ones are allowed based on PIN
  const allowsPlusOne = typeof window !== 'undefined' ?
    localStorage.getItem('phera_allows_plus_one') === 'true' : true;

  // Set default values for non-plus-one guests
  useEffect(() => {
    if (!allowsPlusOne) {
      setFormData(prev => ({
        ...prev,
        plusOne: 'no',
        guestCount: 1,
        plusOneName: '',
        plusOneEmail: '',
      }));
    }
  }, [allowsPlusOne]);

  // Steps definition - includes Phera Concierge as final step for attending guests
  const steps = allowsPlusOne ? [
    'Basic Information',
    'Account Creation',
    'Attendance Details',
    'Plus One Details',
    'Event Preferences',
    'Personal Details',
    'Fun & Messages',
    'Phera Concierge',
  ] : [
    'Basic Information',
    'Account Creation',
    'Attendance Details',
    'Event Preferences',
    'Personal Details',
    'Fun & Messages',
    'Phera Concierge',
  ];

  // Fetch existing RSVP data when component mounts and user is authenticated
  useEffect(() => {
    const fetchExistingRSVP = async () => {
      console.log('CustomRSVPForm: Starting fetchExistingRSVP, user:', user?.email);
      setIsLoadingExisting(true);

      try {
        if (user && user.email) {
          console.log('CustomRSVPForm: Fetching existing RSVP for:', user.email);

          // Add timeout to prevent hanging
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('RSVP fetch timeout')), 10000)
          );

          const result = await Promise.race([
            getExistingRSVP(user.email, weddingId),
            timeoutPromise
          ]);
          console.log('CustomRSVPForm: getExistingRSVP result:', result);

          if (result.success && result.data) {
            console.log('CustomRSVPForm: Found existing RSVP data:', result.data);
            setFormData(prev => ({
              ...prev,
              ...(result.data as any)
            }));
          } else {
            console.log('CustomRSVPForm: No existing RSVP found, starting fresh');
            // Pre-fill user info if available
            if (user.name) {
              const nameParts = user.name.split(' ');
              setFormData(prev => ({
                ...prev,
                firstName: nameParts[0] || '',
                lastName: nameParts.slice(1).join(' ') || '',
                email: user.email,
                phone: user.phone || '',
              }));
            }
          }
        } else {
          console.log('CustomRSVPForm: No user or email available, starting with empty form');
        }
      } catch (error) {
        console.error('CustomRSVPForm: Error fetching existing RSVP:', error);
      } finally {
        console.log('CustomRSVPForm: Setting isLoadingExisting to false');
        setIsLoadingExisting(false);
      }
    };

    fetchExistingRSVP();
  }, [user]);

  // Check if user is already authenticated and restore form state from OAuth redirect
  useEffect(() => {
    // Check if user is already authenticated
    if (user && user.email) {
      setIsAuthenticated(true);
      // Pre-fill email from authenticated user
      setFormData(prev => ({
        ...prev,
        email: user.email,
      }));

      // Find the Account Creation step index and Attendance Details index
      const accountStepIndex = steps.indexOf('Account Creation');
      const attendanceStepIndex = steps.indexOf('Attendance Details');

      // Restore form state from localStorage if returning from OAuth
      if (typeof window !== 'undefined') {
        const savedFormProgress = localStorage.getItem('phera_rsvp_form_progress');
        if (savedFormProgress) {
          try {
            const { formData: savedData } = JSON.parse(savedFormProgress);
            if (savedData) {
              setFormData(prev => ({
                ...prev,
                ...savedData,
                email: user.email, // Always use authenticated email
              }));
            }
            // Clear the saved progress
            localStorage.removeItem('phera_rsvp_form_progress');
          } catch (error) {
            console.error('Error restoring form progress:', error);
            localStorage.removeItem('phera_rsvp_form_progress');
          }
        }

        // If user is authenticated and on Basic Info or Account Creation step, 
        // move them to Attendance Details
        if (currentStep <= accountStepIndex) {
          console.log('User authenticated, advancing to Attendance Details step');
          setCurrentStep(attendanceStepIndex);
        }
      }
    }
  }, [user]);

  const handleInputChange = (field: keyof RSVPFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const handleGuestCountChange = (increment: boolean) => {
    const newCount = increment
      ? Math.min(formData.guestCount + 1, 10)
      : Math.max(formData.guestCount - 1, 1);
    handleInputChange('guestCount', newCount);
  };

  const handleClose = () => {
    setShowExitConfirmation(true);
  };

  const handleConfirmExit = () => {
    setShowExitConfirmation(false);
    router.push(`/${weddingId}`);
  };

  const handleCancelExit = () => {
    setShowExitConfirmation(false);
  };

  const handleGifSelect = (gif: GifData) => {
    setFormData(prev => ({
      ...prev,
      selectedGif: gif,
    }));
    setShowGifPicker(false);
  };

  const handleRemoveGif = () => {
    setFormData(prev => ({
      ...prev,
      selectedGif: undefined,
    }));
  };

  // Handle email/password authentication
  const handleEmailPasswordAuth = async () => {
    setAuthError(null);

    // Validate email and password
    if (!formData.email.trim()) {
      setAuthError('Please enter your email');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setAuthError('Please enter a valid email');
      return;
    }
    if (!formData.password?.trim()) {
      setAuthError('Please enter a password');
      return;
    }
    if (formData.password && formData.password.length < 6) {
      setAuthError('Password must be at least 6 characters');
      return;
    }

    setIsAuthenticating(true);

    try {
      // First try to sign in
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password!,
      });

      if (signInError) {
        // If invalid credentials, try to sign up
        if (signInError.message.includes('Invalid login credentials')) {
          console.log('User not found, attempting signup...');

          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: formData.email,
            password: formData.password!,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
          });

          if (signUpError) {
            setAuthError(signUpError.message);
            return;
          }

          if (signUpData.user) {
            console.log('Signup successful:', signUpData.user.email);
            // Refresh auth context
            await refreshAuth();
            setIsAuthenticated(true);
            // Move to next step
            setCurrentStep(prev => prev + 1);
          }
        } else {
          setAuthError(signInError.message);
        }
      } else if (signInData.user) {
        console.log('Sign in successful:', signInData.user.email);
        // Refresh auth context
        await refreshAuth();
        setIsAuthenticated(true);
        // Move to next step
        setCurrentStep(prev => prev + 1);
      }
    } catch (error) {
      console.error('Auth error:', error);
      setAuthError('An unexpected error occurred. Please try again.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Handle Google OAuth authentication
  const handleGoogleAuth = async () => {
    setAuthError(null);
    setIsAuthenticating(true);

    try {
      // Save form state to localStorage before redirect
      const formProgress = {
        formData: {
          ...formData,
          password: '', // Don't save password
        },
        step: currentStep, // Save current step (Account Creation)
      };
      localStorage.setItem('phera_rsvp_form_progress', JSON.stringify(formProgress));

      // Build callback URL that returns to RSVP page
      const callbackUrl = new URL('/auth/callback', window.location.origin);
      callbackUrl.searchParams.set('redirect', `/${weddingId}/rsvp`);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl.toString(),
        },
      });

      if (error) {
        setAuthError(error.message);
        localStorage.removeItem('phera_rsvp_form_progress');
      }
    } catch (error) {
      console.error('Google auth error:', error);
      setAuthError('Failed to connect with Google. Please try again.');
      localStorage.removeItem('phera_rsvp_form_progress');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    // Get the step name to determine validation
    const stepName = steps[step];

    switch (stepName) {
      case 'Basic Information':
        if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
        if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
        // Phone is now required
        if (!formData.phone.trim()) {
          newErrors.phone = 'Phone number is required';
        } else if (formData.phone.replace(/\D/g, '').length < 10) {
          newErrors.phone = 'Please enter a valid phone number (at least 10 digits)';
        }
        break;

      case 'Account Creation':
        // If already authenticated, no validation needed
        if (isAuthenticated) break;

        if (!formData.email.trim()) newErrors.email = 'Email is required';
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          newErrors.email = 'Please enter a valid email';
        }
        if (!formData.password?.trim()) newErrors.password = 'Password is required';
        if (formData.password && formData.password.length < 6) {
          newErrors.password = 'Password must be at least 6 characters';
        }
        break;

      case 'Attendance Details':
        if (!formData.attending) newErrors.attending = 'Please select attendance';
        break;

      case 'Plus One Details':
        if (formData.attending === 'yes' && !formData.plusOne) {
          newErrors.plusOne = 'Please select plus one option';
        }
        if (formData.attending === 'yes' && formData.plusOne === 'yes') {
          if (!formData.plusOneName.trim()) {
            newErrors.plusOneName = 'Plus one name is required';
          }
          if (!formData.plusOneEmail.trim()) {
            newErrors.plusOneEmail = 'Plus one email is required';
          } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.plusOneEmail)) {
            newErrors.plusOneEmail = 'Please enter a valid email';
          }
          // Plus one phone is now optional, but if provided, validate format
          if (formData.plusOnePhone && formData.plusOnePhone.replace(/\D/g, '').length > 0 && formData.plusOnePhone.replace(/\D/g, '').length < 10) {
            newErrors.plusOnePhone = 'Please enter a valid phone number (at least 10 digits)';
          }
        }
        break;

      case 'Event Preferences':
        if (formData.attending === 'yes' && formData.foodPreference.length === 0) {
          newErrors.foodPreference = 'Please select at least one food preference';
        }
        break;

      case 'Personal Details':
        if (!formData.weddingSide) {
          newErrors.weddingSide = 'Please select which side of the wedding';
        }
        break;

      case 'Fun & Messages':
        // No required fields in this step - both song request and special message are optional
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    const currentStepName = steps[currentStep];

    // Special handling for Account Creation step
    if (currentStepName === 'Account Creation') {
      // If already authenticated, skip validation and proceed
      if (isAuthenticated) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setCurrentStep(prev => prev + 1);
        return;
      }
      // Otherwise, don't proceed - user must authenticate via buttons
      setErrors({ auth: 'Please sign in or sign up to continue' });
      return;
    }

    if (validateStep(currentStep)) {
      // Reset zoom and scroll position
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => {
        // Reset zoom level
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
          viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0');
        }
      }, 100);

      // If plus-ones are allowed and user is not attending yes, skip the plus-one section
      if (currentStepName === 'Attendance Details' && allowsPlusOne && formData.attending !== 'yes') {
        // Find the index of Event Preferences and go there
        const eventPrefsIndex = steps.indexOf('Event Preferences');
        setCurrentStep(eventPrefsIndex);
      } else {
        setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
      }
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);

    try {
      // Directly pass form data - the service handles all normalization
      console.log('Submitting form data:', formData);

      const result = await submitRSVP(formData, weddingId);

      if (result.success) {
        console.log('RSVP submitted successfully, result:', result);

        // Wait a bit for database to be consistent, then check RSVP status (force refresh)
        setTimeout(async () => {
          console.log('Checking RSVP status after delay (forced)...');
          await checkRSVPStatus(true);
        }, 1000);

        // For 'yes' guests, the Concierge step is now part of the form steps
        // For 'no' and 'maybe' guests, we go directly to the success screen
        if (formData.attending === 'yes') {
          // Move to next step (Phera Concierge) rather than showing separate screen
          setCurrentStep(currentStep + 1);
        } else {
          setIsSubmitted(true);
        }
      } else {
        throw new Error('Failed to submit RSVP');
      }
    } catch (error) {
      console.error('Error submitting RSVP:', error);
      setErrors({ submit: 'Failed to submit RSVP. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  const stepVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.4 }
    },
    exit: {
      opacity: 0,
      x: -20,
      transition: { duration: 0.3 }
    }
  };



  if (isSubmitted) {
    const getOverlayImage = () => {
      switch (formData.attending) {
        case 'maybe':
          return '/images/overlays/maybe-rsvp.png';
        case 'no':
          return '/images/overlays/no-rsvp.png';
        default:
          return null;
      }
    };

    return (
      <>
        {/* Only show confetti for 'yes' responses */}
        {formData.attending === 'yes' && (
          <Confetti
            width={typeof window !== 'undefined' ? window.innerWidth : 1200}
            height={typeof window !== 'undefined' ? window.innerHeight : 800}
            recycle={false}
            numberOfPieces={200}
            gravity={0.3}
          />
        )}
        <Box
          sx={{
            position: isMobile ? 'fixed' : 'relative',
            top: isMobile ? 0 : 'auto',
            left: isMobile ? 0 : 'auto',
            right: isMobile ? 0 : 'auto',
            bottom: isMobile ? 0 : 'auto',
            width: isMobile ? 'auto' : '100%',
            maxWidth: isMobile ? 'none' : { md: 700, lg: 800, xl: 900 },
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: isMobile ? 1400 : 1,
          }}
        >
          <Container
            maxWidth={isMobile ? 'sm' : false}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: isMobile ? '100svh' : 'auto',
              py: 0,
              px: { xs: 2, sm: 3, md: 0 },
              overflow: 'hidden',
            }}
          >
            <motion.div
              initial="hidden"
              animate="visible"
              variants={containerVariants}
              style={{ width: '100%', height: isMobile ? '100%' : 'auto', display: 'flex', flexDirection: 'column' }}
            >
              {/* Form Content - Same structure as regular form */}
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 1.5, sm: 2.5, md: 4 },
                  borderRadius: { xs: 1, md: 2 },
                  border: '1px solid #000',
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  color: '#000000',
                  flex: isMobile ? 1 : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  mt: isMobile ? 6 : 0,
                  minHeight: isMobile ? '180px' : { md: 600, lg: 650 },
                  maxHeight: isMobile ? 'calc(100svh - 160px)' : { md: '80vh', lg: '85vh' },
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                {/* Overlay Image for maybe/no responses - Absolutely positioned on top */}
                {getOverlayImage() && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      width: '100%',
                      height: {
                        xs: formData.attending === 'no' ? 300 : 200,
                        sm: formData.attending === 'no' ? 300 : 200,
                        md: 300
                      },
                      backgroundImage: `url(${getOverlayImage()})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center top',
                      backgroundRepeat: 'no-repeat',
                      zIndex: 99, // High z-index to sit on top of everything
                      borderRadius: '4px 4px 0 0', // Match Paper border radius at top
                      pointerEvents: 'none', // Allow clicks to pass through transparent areas
                    }}
                  />
                )}

                {/* Corner decorative images for yes response only */}
                {formData.attending === 'yes' && (
                  <>
                    {/* Top Left Decorative Image */}
                    <Box
                      component="img"
                      src="/images/overlays/entry-topleft.png"
                      alt="Decorative Top Left"
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        zIndex: 1,
                        width: { xs: '120px', sm: '140px', md: '160px' },
                        height: 'auto',
                        pointerEvents: 'none',
                      }}
                    />

                    {/* Top Right Decorative Image */}
                    <Box
                      component="img"
                      src="/images/overlays/entry-topright.png"
                      alt="Decorative Top Right"
                      sx={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        zIndex: 1,
                        width: { xs: '120px', sm: '140px', md: '160px' },
                        height: 'auto',
                        pointerEvents: 'none',
                      }}
                    />
                  </>
                )}

                {/* Scrollable Content Area - Full width for confirmation */}
                <Box sx={{
                  flex: 1,
                  overflowY: 'auto',
                  minHeight: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  '&::-webkit-scrollbar': {
                    width: { xs: '4px', sm: '6px' },
                  },
                  '&::-webkit-scrollbar-track': {
                    background: '#f1f1f1',
                    borderRadius: '3px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: '#c1c1c1',
                    borderRadius: '3px',
                  },
                  '&::-webkit-scrollbar-thumb:hover': {
                    background: '#a8a8a8',
                  },
                }}>
                  {/* Spacer for overlay height */}
                  {getOverlayImage() && (
                    <Box sx={{
                      height: {
                        xs: formData.attending === 'no' ? 300 : 200,
                        sm: formData.attending === 'no' ? 300 : 200,
                        md: 300
                      },
                      flexShrink: 0
                    }} />
                  )}

                  {/* Content - Absolutely centered in remaining space */}
                  <Box sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: { xs: 2, sm: 3 },
                    minHeight: 0,
                    // Center content regardless of overlay image
                    position: 'relative',
                    ...(getOverlayImage() && {
                      // When there's an overlay, center in the available space below it
                      marginTop: {
                        xs: formData.attending === 'no' ? '-200px' : '-150px',
                        sm: formData.attending === 'no' ? '-200px' : '-150px',
                        md: '-200px'
                      },
                    }),
                  }}>
                    {/* Content Column with tight spacing */}
                    <Box sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 1, // 8px gap like in Figma
                    }}>
                      {/* Top Logo */}
                      <Box
                        component="img"
                        src="/logo-lotus-flame.svg"
                        alt="Logo"
                        sx={{
                          width: { xs: 80, sm: 80, md: 80 },
                          height: { xs: 80, sm: 80, md: 80 },
                          filter: 'brightness(0)', // Makes the logo black
                        }}
                      />

                      {/* Text Content */}
                      <Box sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        px: 6,
                        gap: 1,
                      }}>
                        {/* Define common Typography styles */}
                        {(() => {
                          const headingStyle = {
                            fontFamily: 'Outfit',
                            color: '#000',
                            lineHeight: 1.5,
                            textAlign: 'center' as const,
                            fontWeight: 400,
                            fontSize: { xs: '1.6rem', sm: '1.9rem' },
                          };

                          const bodyStyle = {
                            fontFamily: 'Outfit',
                            color: '#474747',
                            lineHeight: 1.5,
                            textAlign: 'center' as const,
                            fontWeight: 400,
                            fontSize: { xs: '1.1rem', sm: '1.2rem' },
                          };

                          if (formData.attending === 'yes') {
                            return (
                              <>
                                <Typography sx={headingStyle}>
                                  Yay! You're part of our celebration and we can't wait to have you there
                                </Typography>

                                <Typography sx={bodyStyle}>
                                  Your room is booked and fully paid for! Check out the rest of the website for travel trips, event details, dress codes, etc. We may require more information from you closer to the wedding so keep an eye out for emails!
                                </Typography>
                              </>
                            );
                          }

                          if (formData.attending === 'maybe') {
                            return (
                              <>
                                <Typography sx={headingStyle}>
                                  Thanks for letting us know!
                                </Typography>

                                <Typography sx={bodyStyle}>
                                  We understand you need to figure some things out. Just remember: We need your final answer by <strong>September 30, 2025</strong>. We'll check in with you before then!
                                  {'\n\n'}
                                  Use your email or phone number to sign in anytime so you can update your response.
                                </Typography>
                              </>
                            );
                          }

                          if (formData.attending === 'no') {
                            return (
                              <>
                                <Typography sx={headingStyle}>
                                  We'll miss you! :(
                                </Typography>

                                <Typography sx={bodyStyle}>
                                  We're sad you can't make it, but we understand. Your account is still ready if anything changes! RSVPs close on <strong>September 30, 2025</strong>.
                                </Typography>
                              </>
                            );
                          }

                          return null;
                        })()}
                      </Box>

                      {/* Bottom Logo - Upside Down */}
                      <Box
                        component="img"
                        src="/logo-lotus-flame.svg"
                        alt="Logo"
                        sx={{
                          width: { xs: 80, sm: 80, md: 80 },
                          height: { xs: 80, sm: 80, md: 80 },
                          filter: 'brightness(0)', // Makes the logo black
                          transform: 'rotate(180deg)', // Flips the logo upside down
                        }}
                      />
                    </Box>
                  </Box>

                  {/* Done Button - Fixed at bottom */}
                  <Box sx={{
                    p: { xs: 2, sm: 3 },
                    pt: { xs: 1, sm: 1.5 },
                    flexShrink: 0,
                  }}>
                    <Button
                      onClick={async () => {
                        await checkRSVPStatus(true);
                        router.push(`/${weddingId}`);
                      }}
                      variant="contained"
                      size="large"
                      fullWidth
                      sx={{
                        backgroundColor: '#DE3F5E',
                        color: 'white',
                        py: { xs: 1.5, sm: 1.5 },
                        fontWeight: 700,
                        borderRadius: '16px',
                        textTransform: 'uppercase',
                        letterSpacing: '6.25%',
                        boxShadow: 'none',
                        fontFamily: 'Outfit',
                        '&:hover': {
                          backgroundColor: '#C8365A',
                          boxShadow: 'none',
                        },
                      }}
                    >
                      Done
                    </Button>
                  </Box>
                </Box>
              </Paper>
            </motion.div>
          </Container>
        </Box>
      </>
    );
  }

  const renderStep = () => {
    // Get step name to determine which content to render
    const stepName = steps[currentStep];

    switch (stepName) {
      case 'Basic Information':
        return (
          <Stack spacing={2}>
            <Typography
              variant="h4"
              sx={{
                color: '#000',
                fontWeight: 400,
                lineHeight: 1.3,
                mb: 2,
                fontFamily: 'Outfit',
                fontSize: { xs: '1.75rem', md: '2.25rem' },
              }}
            >
              Let's make this celebration official! ✨
            </Typography>

            <Typography
              variant="body1"
              sx={{
                color: '#808080 !important',
                mb: 3,
                fontFamily: 'Outfit',
                lineHeight: 1.5,
              }}
            >
              First, tell us a bit about yourself:
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, flexDirection: 'row' }}>
              <Box sx={{ flex: 1 }}>
                <Box
                  sx={{
                    border: '1px solid rgba(0, 0, 0, 0.4)',
                    borderRadius: { xs: '8px', md: '10px' },
                    padding: { xs: '12px 12px', md: '14px 16px' },
                    backgroundColor: 'white',
                    cursor: 'text',
                    height: { xs: '40px', md: '52px' },
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: { xs: '1rem', md: '1.125rem' },
                    '&:hover': {
                      borderColor: 'rgba(0, 0, 0, 0.4)',
                    },
                    '&:focus-within': {
                      borderColor: '#DAA520',
                      borderWidth: '2px',
                      padding: { xs: '11px 11px', md: '13px 15px' },
                    },
                  }}
                >
                  <input
                    type="text"
                    placeholder="First name"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    style={{
                      border: 'none',
                      outline: 'none',
                      width: '100%',
                      fontFamily: 'Outfit',
                      fontSize: 'inherit',
                      color: formData.firstName ? '#000' : '#888888',
                      backgroundColor: 'transparent',
                    }}
                  />
                </Box>
                {errors.firstName && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block', fontSize: '0.75rem' }}>
                    {errors.firstName}
                  </Typography>
                )}
              </Box>

              <Box sx={{ flex: 1 }}>
                <Box
                  sx={{
                    border: '1px solid rgba(0, 0, 0, 0.4)',
                    borderRadius: { xs: '8px', md: '10px' },
                    padding: { xs: '12px 12px', md: '14px 16px' },
                    backgroundColor: 'white',
                    cursor: 'text',
                    height: { xs: '40px', md: '52px' },
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: { xs: '1rem', md: '1.125rem' },
                    '&:hover': {
                      borderColor: 'rgba(0, 0, 0, 0.4)',
                    },
                    '&:focus-within': {
                      borderColor: '#DAA520',
                      borderWidth: '2px',
                      padding: { xs: '11px 11px', md: '13px 15px' },
                    },
                  }}
                >
                  <input
                    type="text"
                    placeholder="Last name"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    style={{
                      border: 'none',
                      outline: 'none',
                      width: '100%',
                      fontFamily: 'Outfit',
                      fontSize: 'inherit',
                      color: formData.lastName ? '#000' : '#888888',
                      backgroundColor: 'transparent',
                    }}
                  />
                </Box>
                {errors.lastName && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block', fontSize: '0.75rem' }}>
                    {errors.lastName}
                  </Typography>
                )}
              </Box>
            </Box>

            <Box>
              <Box
                sx={{
                  border: '1px solid rgba(0, 0, 0, 0.4)',
                  borderRadius: { xs: '8px', md: '10px' },
                  padding: { xs: '12px 12px', md: '14px 16px' },
                  backgroundColor: 'white',
                  cursor: 'text',
                  height: { xs: '40px', md: '52px' },
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  '&:hover': {
                    borderColor: 'rgba(0, 0, 0, 0.4)',
                  },
                  '&:focus-within': {
                    borderColor: '#DAA520',
                    borderWidth: '2px',
                    padding: { xs: '11px 11px', md: '13px 15px' },
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                  <FormControl sx={{ minWidth: 100 }}>
                    <Select
                      value={formData.countryCode}
                      onChange={(e) => handleInputChange('countryCode', e.target.value)}
                      variant="standard"
                      disableUnderline
                      sx={{
                        height: '24px',
                        color: '#000', // always black
                        fontSize: '1rem',
                        '& .MuiSelect-select': {
                          padding: '0px 8px 0px 0px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          fontSize: '1rem',
                          border: 'none',
                          color: '#000', // always black
                          '&:focus': {
                            backgroundColor: 'transparent',
                          },
                        },
                        '& .MuiSelect-icon': {
                          color: '#666',
                          fontSize: '1.2rem',
                        },
                      }}
                      MenuProps={{
                        PaperProps: {
                          sx: {
                            backgroundColor: '#fff',
                            boxShadow: 3,
                            // borderRadius: 2,
                            height: '300px',
                          },
                        },
                        MenuListProps: {
                          sx: {
                            py: 0.5,
                          },
                        },
                      }}
                    >
                      {countryCodes.map((country) => (
                        <MenuItem key={country.code} value={country.code} sx={{ fontSize: '1rem', height: '32px', color: '#000', minHeight: '32px' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <span style={{ fontSize: '1rem' }}>{country.flag}</span>
                            <span style={{ fontSize: '0.9rem' }}>{country.code}</span>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                <input
                  type="tel"
                  inputMode="tel"
                  placeholder="000 000 0000"
                  value={formData.phone}
                  onChange={(e) => {
                    // Remove any non-numeric characters except + and spaces
                    const cleanValue = e.target.value.replace(/[^\d+\s-()]/g, '');
                    handleInputChange('phone', cleanValue);
                  }}
                  style={{
                    border: 'none',
                    outline: 'none',
                    flex: 1,
                    fontFamily: 'Outfit',
                    fontSize: 'inherit',
                    color: formData.phone ? '#000' : '#888888',
                    backgroundColor: 'transparent',
                    marginLeft: '8px',
                  }}
                />
              </Box>
              {errors.phone && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block', fontSize: '0.75rem' }}>
                  {errors.phone}
                </Typography>
              )}
            </Box>

            <Typography
              variant="body2"
              sx={{
                color: '#666',
                mt: 2,
                mb: 2,
                fontFamily: 'Outfit',
                lineHeight: 1.4,
              }}
            >
              <strong>Note:</strong> Phone number is required for hotel confirmations and important updates.
            </Typography>
          </Stack>
        );

      case 'Account Creation':
        return (
          <Stack spacing={2}>
            <Typography
              variant="h4"
              sx={{
                color: '#000',
                fontWeight: 400,
                lineHeight: 1.3,
                mb: 2,
                fontFamily: 'Outfit',
                fontSize: { xs: '1.75rem', md: '2.25rem' },
              }}
            >
              Create Your Login 🔐
            </Typography>

            <Typography
              variant="body1"
              sx={{
                color: '#808080 !important',
                mb: 3,
                fontFamily: 'Outfit',
                lineHeight: 1.5,
              }}
            >
              This will let you revisit event details anytime without needing an invite code.
            </Typography>

            {authError && (
              <Alert
                severity="error"
                onClose={() => setAuthError(null)}
                sx={{ borderRadius: '12px', mb: 2 }}
              >
                {authError}
              </Alert>
            )}

            {isAuthenticated ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CheckCircleOutlined sx={{ fontSize: 64, color: '#DE3F5E', mb: 2 }} />
                <Typography variant="h6" sx={{ color: '#000', fontFamily: 'Outfit', mb: 1 }}>
                  You're all set!
                </Typography>
                <Typography variant="body1" sx={{ color: '#666', fontFamily: 'Outfit' }}>
                  Logged in as {formData.email || user?.email}
                </Typography>
              </Box>
            ) : (
              <>
                <Box>
                  <Box
                    sx={{
                      border: '1px solid rgba(0, 0, 0, 0.4)',
                      borderRadius: { xs: '8px', md: '10px' },
                      padding: { xs: '12px 12px', md: '14px 16px' },
                      backgroundColor: 'white',
                      cursor: 'text',
                      height: { xs: '40px', md: '52px' },
                      display: 'flex',
                      alignItems: 'center',
                      '&:hover': {
                        borderColor: 'rgba(0, 0, 0, 0.4)',
                      },
                      '&:focus-within': {
                        borderColor: '#DAA520',
                        borderWidth: '2px',
                        padding: { xs: '11px 11px', md: '13px 15px' },
                      },
                    }}
                  >
                    <input
                      type="email"
                      placeholder="Email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      disabled={isAuthenticating}
                      style={{
                        border: 'none',
                        outline: 'none',
                        width: '100%',
                        fontFamily: 'Outfit',
                        fontSize: 'inherit',
                        color: formData.email ? '#000' : '#888888',
                        backgroundColor: 'transparent',
                      }}
                    />
                  </Box>
                  {errors.email && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block', fontSize: '0.75rem' }}>
                      {errors.email}
                    </Typography>
                  )}
                </Box>

                <Box>
                  <Box
                    sx={{
                      border: '1px solid rgba(0, 0, 0, 0.4)',
                      borderRadius: { xs: '8px', md: '10px' },
                      padding: { xs: '12px 12px', md: '14px 16px' },
                      backgroundColor: 'white',
                      cursor: 'text',
                      height: { xs: '40px', md: '52px' },
                      display: 'flex',
                      alignItems: 'center',
                      '&:hover': {
                        borderColor: 'rgba(0, 0, 0, 0.4)',
                      },
                      '&:focus-within': {
                        borderColor: '#DAA520',
                        borderWidth: '2px',
                        padding: { xs: '11px 11px', md: '13px 15px' },
                      },
                    }}
                  >
                    <input
                      type="password"
                      placeholder="Password (min 6 characters)"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      disabled={isAuthenticating}
                      style={{
                        border: 'none',
                        outline: 'none',
                        width: '100%',
                        fontFamily: 'Outfit',
                        fontSize: 'inherit',
                        color: (formData.password && formData.password.length > 0) ? '#000' : '#888888',
                        backgroundColor: 'transparent',
                      }}
                    />
                  </Box>
                  {errors.password && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block', fontSize: '0.75rem' }}>
                      {errors.password}
                    </Typography>
                  )}
                </Box>

                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleEmailPasswordAuth}
                  disabled={isAuthenticating}
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
                  {isAuthenticating ? (
                    <CircularProgress size={24} sx={{ color: 'white' }} />
                  ) : (
                    'Sign In / Sign Up'
                  )}
                </Button>

                <Box sx={{ textAlign: 'center', my: 2 }}>
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    or
                  </Typography>
                </Box>

                <Button
                  variant="outlined"
                  fullWidth
                  onClick={handleGoogleAuth}
                  disabled={isAuthenticating}
                  startIcon={
                    isAuthenticating ? (
                      <CircularProgress size={18} sx={{ color: '#1a1a1a' }} />
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
                      opacity: 0.7,
                      borderWidth: '1.5px',
                    },
                  }}
                >
                  {isAuthenticating ? 'Connecting...' : 'Continue with Google'}
                </Button>
              </>
            )}
          </Stack>
        );

      case 'Attendance Details':
        return (
          <Stack spacing={4}>
            <Box sx={{ textAlign: 'left', mb: 3 }}>
              <Typography
                variant="h4"
                sx={{
                  color: '#141414',
                  fontWeight: 400,
                  lineHeight: 1.3,
                  mb: 2,
                  fontFamily: 'Outfit'
                }}
              >
                Will you be celebrating with us in Thailand? 🏖️
              </Typography>

              <Typography
                variant="body1"
                sx={{
                  color: 'rgba(0, 0, 0, 0.48)',
                  fontWeight: 400,
                  fontFamily: 'Outfit',
                  lineHeight: 1.5,
                }}
              >
                Ready to make some memories?
              </Typography>
            </Box>

            <FormControl error={!!errors.attending}>
              <Box>
                {[
                  { value: 'yes', label: 'YES! Can\'t wait to celebrate!' },
                  { value: 'no', label: 'Sorry, can\'t make it :(' },
                  { value: 'maybe', label: 'MAYBE - Need to check a few things' }
                ].map((option, index, array) => (
                  <Box key={option.value}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        py: 2,
                        borderBottom: index < array.length - 1 || option.value !== 'maybe' ? '1px solid rgba(0, 0, 0, 0.08)' : 'none',
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: 'rgba(0, 0, 0, 0.02)',
                        },
                      }}
                      onClick={() => handleInputChange('attending', option.value)}
                    >
                      <Typography
                        sx={{
                          color: formData.attending === option.value ? '#DE3F5E' : '#141414',
                          fontWeight: formData.attending === option.value ? 600 : 400,
                          fontFamily: 'Outfit',
                          lineHeight: 1.3,
                          flex: 1
                        }}
                      >
                        {option.label}
                      </Typography>

                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          border: `2px solid ${formData.attending === option.value ? '#DE3F5E' : '#141414'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: formData.attending === option.value ? '#DE3F5E' : 'transparent',
                        }}
                      >
                        {formData.attending === option.value && (
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              backgroundColor: 'white',
                            }}
                          />
                        )}
                      </Box>
                    </Box>

                    {/* Maybe text field - show when maybe is selected */}
                    {option.value === 'maybe' && formData.attending === 'maybe' && (
                      <Box sx={{ mt: 2, mb: 2 }}>
                        <Box
                          sx={{
                            border: '1px solid rgba(0, 0, 0, 0.4)',
                            borderRadius: { xs: '8px', md: '10px' },
                            padding: '8px 12px',
                            backgroundColor: 'white',
                            cursor: 'text',
                            minHeight: '60px',
                            '&:hover': {
                              borderColor: 'rgba(0, 0, 0, 0.4)',
                            },
                            '&:focus-within': {
                              borderColor: '#DAA520',
                              borderWidth: '2px',
                              padding: '7px 11px',
                            },
                          }}
                        >
                          <textarea
                            placeholder="Help us understand what's holding you back We want to make this work! Let us know what you're figuring out:"
                            value={formData.maybeComment}
                            onChange={(e) => handleInputChange('maybeComment', e.target.value)}
                            style={{
                              border: 'none',
                              outline: 'none',
                              width: '100%',
                              height: '70px',
                              resize: 'none',
                              fontFamily: 'Outfit',
                              fontSize: 'inherit',
                              color: formData.maybeComment ? '#141414' : 'rgba(0, 0, 0, 0.6)',
                              backgroundColor: 'transparent',
                            }}
                          />
                        </Box>

                        {/* Final answer reminder */}
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            p: 2,
                            backgroundColor: 'rgba(0, 0, 0, 0.08)',
                            borderRadius: { xs: '8px', md: '10px' },
                            color: 'rgba(0, 0, 0, 0.72)',
                            mt: 2
                          }}
                        >
                          <Typography sx={{
                            fontWeight: 400,
                            lineHeight: 1.5,
                            fontFamily: 'Outfit'
                          }}>
                            📅  Final answer needed by: <strong>September 30, 2025</strong>
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  </Box>
                ))}
              </Box>
              {errors.attending && (
                <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                  {errors.attending}
                </Typography>
              )}
            </FormControl>

            <Typography
              variant="body2"
              sx={{
                color: 'rgba(0, 0, 0, 0.48)',
                lineHeight: 1.5,
                fontFamily: 'Outfit',
                mt: 3
              }}
            >
              <strong>Note:</strong> Your accommodation will be covered by us! We need to book the right number of rooms, so please let us know for sure by {WEDDING_CONFIG.rsvpDeadline}!
            </Typography>



            {/* <Collapse in={formData.attending === 'no'}>
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  p: 2, 
                  backgroundColor: 'rgba(0, 0, 0, 0.08)', 
                  borderRadius: { xs: '8px', md: '10px' },
                  color: 'rgba(0, 0, 0, 0.72)',
                  mt: 2
                }}
              >
                <Typography variant="body2" sx={{ 
                  fontWeight: 400,
                  lineHeight: 1.5,
                  fontFamily: 'Outfit'
                }}>
                  We'll miss you! We hope to celebrate with you in the future. 💕
                </Typography>
              </Box>
            </Collapse> */}
          </Stack>
        );

      case 'Plus One Details':
        return (
          <Stack spacing={4}>
            <Box sx={{ textAlign: 'left', mb: 3 }}>
              <Typography
                variant="h4"
                sx={{
                  color: '#000',
                  fontWeight: 400,
                  lineHeight: 1.3,
                  mb: 2,
                  fontFamily: 'Outfit'
                }}
              >
                Bringing your special someone? 💕
              </Typography>

              <Typography
                variant="body1"
                sx={{
                  color: 'rgba(0, 0, 0, 0.48)',
                  fontWeight: 400,
                  mt: 1,
                  lineHeight: 1.5,
                  fontFamily: 'Outfit'
                }}
              >
                Couples share one invitation - add your partner here! They will be able to sign in to the website with their email address as well.
              </Typography>
            </Box>

            <Box>
              <FormControl error={!!errors.plusOne} sx={{ width: '100%' }}>
                <Box>
                  <RadioGroup
                    value={formData.plusOne}
                    onChange={(e) => {
                      handleInputChange('plusOne', e.target.value);
                      // Update guest count based on plus one selection
                      if (e.target.value === 'yes') {
                        handleInputChange('guestCount', 2);
                      } else {
                        handleInputChange('guestCount', 1);
                      }
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        py: 2,
                        borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: 'rgba(0, 0, 0, 0.02)',
                        },
                      }}
                      onClick={() => {
                        handleInputChange('plusOne', 'yes');
                        handleInputChange('guestCount', 2);
                      }}
                    >
                      <Typography
                        sx={{
                          color: formData.plusOne === 'yes' ? '#DE3F5E' : '#000',
                          fontWeight: formData.plusOne === 'yes' ? 600 : 400,
                          fontFamily: 'Outfit',
                          lineHeight: 1.3,
                          flex: 1
                        }}
                      >
                        Yes! Here are their details
                      </Typography>

                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          border: `2px solid ${formData.plusOne === 'yes' ? '#DE3F5E' : 'rgba(0, 0, 0, 0.3)'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: formData.plusOne === 'yes' ? '#DE3F5E' : 'transparent',
                        }}
                      >
                        {formData.plusOne === 'yes' && (
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              backgroundColor: 'white',
                            }}
                          />
                        )}
                      </Box>
                    </Box>
                    <Collapse in={formData.plusOne === 'yes'}>
                      <Box>
                        {/* First Name and Last Name Row */}
                        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                          <Box sx={{ flex: 1 }}>
                            <Box
                              sx={{
                                border: '1px solid rgba(0, 0, 0, 0.4)',
                                borderRadius: { xs: '8px', md: '10px' },
                                padding: { xs: '12px 12px', md: '14px 16px' },
                                backgroundColor: 'white',
                                cursor: 'text',
                                height: { xs: '40px', md: '52px' },
                                display: 'flex',
                                alignItems: 'center',
                                '&:hover': {
                                  borderColor: 'rgba(0, 0, 0, 0.4)',
                                },
                                '&:focus-within': {
                                  borderColor: '#DAA520',
                                  borderWidth: '2px',
                                  padding: { xs: '11px 11px', md: '13px 15px' },
                                },
                              }}
                            >
                              <input
                                type="text"
                                placeholder="First name"
                                value={formData.plusOneName.split(' ')[0] || ''}
                                onChange={(e) => {
                                  const lastName = formData.plusOneName.split(' ').slice(1).join(' ');
                                  handleInputChange('plusOneName', e.target.value + (lastName ? ' ' + lastName : ''));
                                }}
                                style={{
                                  border: 'none',
                                  outline: 'none',
                                  width: '100%',
                                  fontFamily: 'Outfit',
                                  fontSize: 'inherit',
                                  color: formData.plusOneName.split(' ')[0] ? '#000' : '#888888',
                                  backgroundColor: 'transparent',
                                }}
                              />
                            </Box>
                            {errors.plusOneName && (
                              <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block', fontSize: '0.75rem' }}>
                                {errors.plusOneName}
                              </Typography>
                            )}
                          </Box>

                          <Box sx={{ flex: 1 }}>
                            <Box
                              sx={{
                                border: '1px solid rgba(0, 0, 0, 0.4)',
                                borderRadius: { xs: '8px', md: '10px' },
                                padding: { xs: '12px 12px', md: '14px 16px' },
                                backgroundColor: 'white',
                                cursor: 'text',
                                height: { xs: '40px', md: '52px' },
                                display: 'flex',
                                alignItems: 'center',
                                '&:hover': {
                                  borderColor: 'rgba(0, 0, 0, 0.4)',
                                },
                                '&:focus-within': {
                                  borderColor: '#DAA520',
                                  borderWidth: '2px',
                                  padding: { xs: '11px 11px', md: '13px 15px' },
                                },
                              }}
                            >
                              <input
                                type="text"
                                placeholder="Last name"
                                value={formData.plusOneName.split(' ').slice(1).join(' ') || ''}
                                onChange={(e) => {
                                  const firstName = formData.plusOneName.split(' ')[0] || '';
                                  handleInputChange('plusOneName', firstName + (e.target.value ? ' ' + e.target.value : ''));
                                }}
                                style={{
                                  border: 'none',
                                  outline: 'none',
                                  width: '100%',
                                  fontFamily: 'Outfit',
                                  fontSize: 'inherit',
                                  color: formData.plusOneName.split(' ').slice(1).join(' ') ? '#000' : '#888888',
                                  backgroundColor: 'transparent',
                                }}
                              />
                            </Box>
                          </Box>
                        </Box>

                        {/* Email Field */}
                        <Box sx={{ mb: 2 }}>
                          <Box
                            sx={{
                              border: '1px solid rgba(0, 0, 0, 0.4)',
                              borderRadius: { xs: '8px', md: '10px' },
                              padding: { xs: '12px 12px', md: '14px 16px' },
                              backgroundColor: 'white',
                              cursor: 'text',
                              height: { xs: '40px', md: '52px' },
                              display: 'flex',
                              alignItems: 'center',
                              '&:hover': {
                                borderColor: 'rgba(0, 0, 0, 0.4)',
                              },
                              '&:focus-within': {
                                borderColor: '#DAA520',
                                borderWidth: '2px',
                                padding: { xs: '11px 11px', md: '13px 15px' },
                              },
                            }}
                          >
                            <input
                              type="email"
                              placeholder="Email"
                              value={formData.plusOneEmail}
                              onChange={(e) => handleInputChange('plusOneEmail', e.target.value)}
                              style={{
                                border: 'none',
                                outline: 'none',
                                width: '100%',
                                fontFamily: 'Outfit',
                                fontSize: 'inherit',
                                color: formData.plusOneEmail ? '#000' : '#888888',
                                backgroundColor: 'transparent',
                              }}
                            />
                          </Box>
                          {errors.plusOneEmail && (
                            <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block', fontSize: '0.75rem' }}>
                              {errors.plusOneEmail}
                            </Typography>
                          )}
                        </Box>

                        {/* Phone Field (with country code select) */}
                        <Box sx={{ mb: 2 }}>
                          <Box
                            sx={{
                              border: '1px solid rgba(0, 0, 0, 0.4)',
                              borderRadius: { xs: '8px', md: '10px' },
                              padding: '6px 8px', // smaller padding
                              backgroundColor: 'white',
                              cursor: 'text',
                              height: '36px', // smaller height
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              '&:hover': {
                                borderColor: 'rgba(0, 0, 0, 0.4)',
                              },
                              '&:focus-within': {
                                borderColor: '#DAA520',
                                borderWidth: '2px',
                                padding: '5px 7px',
                              },
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                              <FormControl sx={{ minWidth: 70 }}>
                                <Select
                                  value={formData.plusOneCountryCode}
                                  onChange={(e) => handleInputChange('plusOneCountryCode', e.target.value)}
                                  variant="standard"
                                  disableUnderline
                                  sx={{
                                    height: '24px',
                                    color: '#000', // always black
                                    fontSize: '1rem',
                                    '& .MuiSelect-select': {
                                      padding: '0px 8px 0px 0px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 0.5,
                                      fontSize: '1rem',
                                      border: 'none',
                                      color: '#000', // always black
                                      '&:focus': {
                                        backgroundColor: 'transparent',
                                      },
                                    },
                                    '& .MuiSelect-icon': {
                                      color: '#666',
                                      fontSize: '1.2rem',
                                    },
                                  }}
                                  MenuProps={{
                                    PaperProps: {
                                      sx: {
                                        backgroundColor: '#fff',
                                        boxShadow: 3,
                                        height: '300px',
                                        // borderRadius: 2,
                                      },
                                    },
                                    MenuListProps: {
                                      sx: {
                                        py: 0.5,
                                      },
                                    },
                                  }}
                                >
                                  {countryCodes.map((country) => (
                                    <MenuItem key={country.code} value={country.code} sx={{ fontSize: '1rem', height: '32px', color: '#000', minHeight: '32px' }}>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <span style={{ fontSize: '1rem' }}>{country.flag}</span>
                                        <span style={{ fontSize: '0.9rem' }}>{country.code}</span>
                                      </Box>
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </Box>
                            <input
                              type="tel"
                              inputMode="tel"
                              placeholder="000 000 0000 (optional)"
                              value={formData.plusOnePhone}
                              onChange={(e) => {
                                const cleanValue = e.target.value.replace(/[^\d+\s-()]/g, '');
                                handleInputChange('plusOnePhone', cleanValue);
                              }}
                              style={{
                                border: 'none',
                                outline: 'none',
                                flex: 1,
                                fontFamily: 'Outfit',
                                fontSize: '1rem',
                              }}
                            />
                          </Box>
                        </Box>
                      </Box>
                    </Collapse>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        py: 2,
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: 'rgba(0, 0, 0, 0.02)',
                        },
                      }}
                      onClick={() => {
                        handleInputChange('plusOne', 'no');
                        handleInputChange('guestCount', 1);
                      }}
                    >
                      <Typography
                        sx={{
                          color: formData.plusOne === 'no' ? '#DE3F5E' : '#000',
                          fontWeight: formData.plusOne === 'no' ? 600 : 400,
                          fontFamily: 'Outfit',
                          lineHeight: 1.3,
                          flex: 1
                        }}
                      >
                        Just me - ready to celebrate!
                      </Typography>
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          border: `2px solid ${formData.plusOne === 'no' ? '#DE3F5E' : 'rgba(0, 0, 0, 0.3)'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: formData.plusOne === 'no' ? '#DE3F5E' : 'transparent',
                        }}
                      >
                        {formData.plusOne === 'no' && (
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              backgroundColor: 'white',
                            }}
                          />
                        )}
                      </Box>
                    </Box>
                  </RadioGroup>

                  {errors.plusOne && (
                    <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                      {errors.plusOne}
                    </Typography>
                  )}
                </Box>
              </FormControl>
            </Box>



            <Box>
              <Typography
                variant="body1"
                sx={{
                  color: 'rgba(0, 0, 0, 0.48)',
                  fontWeight: 400,
                  mb: 2,
                  fontFamily: 'Outfit'
                }}
              >
                Total number in your party (including kids)?
              </Typography>

              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0,
                border: '1px solid rgba(0, 0, 0, 0.12)',
                borderRadius: { xs: '8px', md: '10px' },
                p: 0,
                maxWidth: 180,
                backgroundColor: 'white',
              }}>
                <IconButton
                  onClick={() => handleGuestCountChange(false)}
                  disabled={formData.guestCount <= 1}
                  sx={{
                    color: '#666',
                    borderRadius: '8px 0 0 8px',
                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.08)',
                    },
                    '&:disabled': {
                      color: '#ccc',
                      backgroundColor: 'rgba(0, 0, 0, 0.02)',
                    }
                  }}
                >
                  <RemoveIcon />
                </IconButton>
                <Typography
                  variant="h6"
                  sx={{
                    minWidth: 60,
                    textAlign: 'center',
                    color: '#000',
                    fontWeight: 500,
                    py: 1,
                    fontFamily: 'Outfit'
                  }}
                >
                  {formData.guestCount}
                </Typography>
                <IconButton
                  onClick={() => handleGuestCountChange(true)}
                  disabled={formData.guestCount >= 10}
                  sx={{
                    color: '#666',
                    borderRadius: '0 8px 8px 0',
                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.08)',
                    },
                    '&:disabled': {
                      color: '#ccc',
                      backgroundColor: 'rgba(0, 0, 0, 0.02)',
                    }
                  }}
                >
                  <AddIcon />
                </IconButton>
              </Box>
            </Box>
          </Stack>
        );

      case 'Event Preferences':
        return (
          <Stack spacing={4}>
            <Box sx={{ textAlign: 'left', mb: 3 }}>
              <Typography
                variant="h4"
                sx={{
                  color: '#000',
                  fontWeight: 400,
                  lineHeight: 1.3,
                  mb: 2,
                  fontFamily: 'Outfit'
                }}
              >
                What's your dining preference? 🍛
              </Typography>

              <Typography
                variant="body1"
                sx={{
                  color: 'rgba(0, 0, 0, 0.48)',
                  fontWeight: 400,
                  mt: 1,
                  lineHeight: 1.5,
                  fontFamily: 'Outfit'
                }}
              >
                {allowsPlusOne ? 'Select all that apply for you (and your plus one)!' : 'Select all that apply for you!'}
              </Typography>
            </Box>

            <Box>
              <FormControl error={!!errors.foodPreference} sx={{ width: '100%' }}>
                <Box>
                  {[
                    { value: 'Non-Vegetarian', label: 'I enjoy everything! 🍗' },
                    { value: 'Vegetarian', label: 'Vegetarian 🥬' },
                    { value: 'Vegan', label: 'Vegan 🌱' },
                    { value: 'Jain Food', label: 'Jain 🙏' },
                    { value: 'Gluten-free', label: 'Gluten-free 🚫' },
                    { value: 'Allergies', label: 'Allergies 🥜 (please specify below)' }
                  ].map((option, index, array) => (
                    <Box
                      key={option.value}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        py: 2,
                        borderBottom: index < array.length - 1 ? '1px solid rgba(0, 0, 0, 0.08)' : 'none',
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: 'rgba(0, 0, 0, 0.02)',
                        },
                      }}
                      onClick={() => {
                        const currentPreferences = [...formData.foodPreference];
                        const index = currentPreferences.indexOf(option.value);
                        if (index > -1) {
                          currentPreferences.splice(index, 1);
                        } else {
                          currentPreferences.push(option.value);
                        }
                        handleInputChange('foodPreference', currentPreferences);
                      }}
                    >
                      <Typography
                        sx={{
                          color: formData.foodPreference.includes(option.value) ? '#DE3F5E' : '#000',
                          fontWeight: formData.foodPreference.includes(option.value) ? 600 : 400,
                          fontFamily: 'Outfit',
                          lineHeight: 1.3,
                          flex: 1
                        }}
                      >
                        {option.label}
                      </Typography>

                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          border: `2px solid ${formData.foodPreference.includes(option.value) ? '#DE3F5E' : 'rgba(0, 0, 0, 0.3)'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: formData.foodPreference.includes(option.value) ? '#DE3F5E' : 'transparent',
                        }}
                      >
                        {formData.foodPreference.includes(option.value) && (
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              backgroundColor: 'white',
                            }}
                          />
                        )}
                      </Box>
                    </Box>
                  ))}

                  {errors.foodPreference && (
                    <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                      {errors.foodPreference}
                    </Typography>
                  )}
                </Box>
              </FormControl>
            </Box>

            {/* Dietary Restrictions Text Field - Only show when "Allergies" is selected */}
            {formData.foodPreference.includes('Allergies') && (
              <Box sx={{ mt: 3 }}>
                <Box
                  sx={{
                    border: '1px solid rgba(0, 0, 0, 0.4)',
                    borderRadius: { xs: '8px', md: '10px' },
                    padding: '16px 12px',
                    backgroundColor: 'white',
                    cursor: 'text',
                    minHeight: '100px',
                    '&:hover': {
                      borderColor: 'rgba(0, 0, 0, 0.4)',
                    },
                    '&:focus-within': {
                      borderColor: '#DAA520',
                      borderWidth: '2px',
                      padding: '15px 11px',
                    },
                  }}
                >
                  <textarea
                    placeholder="Please specify your allergies or dietary restrictions."
                    value={formData.dietaryRestrictions}
                    onChange={(e) => handleInputChange('dietaryRestrictions', e.target.value)}
                    style={{
                      border: 'none',
                      outline: 'none',
                      width: '100%',
                      height: '20px',
                      resize: 'none',
                      fontFamily: 'Outfit',
                      fontSize: 'inherit',
                      color: formData.dietaryRestrictions ? '#000' : 'rgba(0, 0, 0, 0.48)',
                      backgroundColor: 'transparent',
                    }}
                  />
                </Box>
              </Box>
            )}
          </Stack>
        );

      case 'Personal Details':
        return (
          <Stack spacing={4}>
            <Box sx={{ textAlign: 'left', mb: 3 }}>
              <Typography
                variant="h4"
                sx={{
                  color: '#000',
                  fontWeight: 400,
                  lineHeight: 1.3,
                  mb: 2,
                  fontFamily: 'Outfit'
                }}
              >
                Which side of the celebration? 👰🏻‍♀️🤵🏻‍♂️
              </Typography>

              <Typography
                variant="body1"
                sx={{
                  color: 'rgba(0, 0, 0, 0.48)',
                  fontWeight: 400,
                  mt: 1,
                  lineHeight: 1.5,
                  fontFamily: 'Outfit'
                }}
              >
                This helps us with logistics and organization!
              </Typography>
            </Box>

            <Box>
              <FormControl error={!!errors.weddingSide} sx={{ width: '100%' }}>
                <Box>
                  {[
                    { value: 'bride', label: '💃 Team Bride' },
                    { value: 'groom', label: '🕺 Team Groom' },
                    { value: 'both', label: '🤷‍♀️ Can\'t choose - I love you both!' }
                  ].map((option, index, array) => (
                    <Box
                      key={option.value}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        py: 2,
                        borderBottom: index < array.length - 1 ? '1px solid rgba(0, 0, 0, 0.08)' : 'none',
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: 'rgba(0, 0, 0, 0.02)',
                        },
                      }}
                      onClick={() => handleInputChange('weddingSide', option.value)}
                    >
                      <Typography
                        sx={{
                          color: formData.weddingSide === option.value ? '#DE3F5E' : '#000',
                          fontWeight: formData.weddingSide === option.value ? 600 : 400,
                          fontFamily: 'Outfit',
                          lineHeight: 1.3,
                          flex: 1
                        }}
                      >
                        {option.label}
                      </Typography>

                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          border: `2px solid ${formData.weddingSide === option.value ? '#DE3F5E' : 'rgba(0, 0, 0, 0.3)'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: formData.weddingSide === option.value ? '#DE3F5E' : 'transparent',
                        }}
                      >
                        {formData.weddingSide === option.value && (
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              backgroundColor: 'white',
                            }}
                          />
                        )}
                      </Box>
                    </Box>
                  ))}

                  {errors.weddingSide && (
                    <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                      {errors.weddingSide}
                    </Typography>
                  )}
                </Box>
              </FormControl>
            </Box>

            {/* WhatsApp Opt-in Removed */}
          </Stack>
        );

      case 'Fun & Messages':
        return (
          <Stack spacing={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {/* Music Request Section */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <Typography
                      variant="h4"
                      sx={{
                        color: '#000',
                        fontWeight: 400,
                        lineHeight: 1.3,
                        fontFamily: 'Outfit'
                      }}
                    >
                      Music requests
                    </Typography>
                    <StreamlineIcon name="music-note" size={24} />
                  </Stack>

                  <Typography
                    variant="body1"
                    sx={{
                      color: 'rgba(0, 0, 0, 0.48)',
                      fontWeight: 400,
                      fontFamily: 'Outfit',
                      lineHeight: 1.5,
                    }}
                  >
                    What song will make this celebration perfect? (optional)
                  </Typography>
                </Box>

                <Box
                  sx={{
                    border: '1px solid rgba(0, 0, 0, 0.4)',
                    borderRadius: { xs: '8px', md: '10px' },
                    padding: { xs: '12px 12px', md: '14px 16px' },
                    backgroundColor: 'white',
                    cursor: 'text',
                    height: { xs: '40px', md: '52px' },
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: { xs: '1rem', md: '1.125rem' },
                    '&:hover': {
                      borderColor: 'rgba(0, 0, 0, 0.4)',
                    },
                    '&:focus-within': {
                      borderColor: '#DAA520',
                      borderWidth: '2px',
                      padding: { xs: '11px 11px', md: '13px 15px' },
                    },
                  }}
                >
                  <input
                    type="text"
                    placeholder="Add song name and artist..."
                    value={formData.songRequest}
                    onChange={(e) => handleInputChange('songRequest', e.target.value)}
                    style={{
                      border: 'none',
                      outline: 'none',
                      width: '100%',
                      fontFamily: 'Outfit',
                      fontSize: 'inherit',
                      color: formData.songRequest ? '#000' : '#888888',
                      backgroundColor: 'transparent',
                    }}
                  />
                </Box>
              </Box>

              {/* Special Message Section */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <Typography
                      variant="h4"
                      sx={{
                        color: '#000',
                        fontWeight: 400,
                        lineHeight: 1.3,
                        fontFamily: 'Outfit'
                      }}
                    >
                      Share your excitement
                    </Typography>
                    <StreamlineIcon name="megaphone" size={24} />
                  </Stack>

                  <Typography
                    variant="body1"
                    sx={{
                      color: 'rgba(0, 0, 0, 0.48)',
                      fontWeight: 400,
                      fontFamily: 'Outfit',
                      lineHeight: 1.5,
                    }}
                  >
                    Leave a message for everyone to see! (optional)
                  </Typography>
                </Box>

                <Box
                  sx={{
                    border: '1px solid rgba(0, 0, 0, 0.4)',
                    borderRadius: { xs: '8px', md: '10px' },
                    padding: '8px 12px',
                    backgroundColor: 'white',
                    cursor: 'text',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    minHeight: '100px',
                    '&:hover': {
                      borderColor: 'rgba(0, 0, 0, 0.4)',
                    },
                    '&:focus-within': {
                      borderColor: '#DAA520',
                      borderWidth: '2px',
                      padding: '7px 11px',
                    },
                  }}
                >
                  <textarea
                    placeholder="Your wishes for the happy couple..."
                    value={formData.specialMessage}
                    onChange={(e) => handleInputChange('specialMessage', e.target.value)}
                    style={{
                      border: 'none',
                      outline: 'none',
                      width: '100%',
                      height: '60px',
                      resize: 'none',
                      fontFamily: 'Outfit',
                      fontSize: 'inherit',
                      color: formData.specialMessage ? '#000' : '#888888',
                      backgroundColor: 'transparent',
                    }}
                  />

                  {/* GIF Button - only show when no GIF is selected */}
                  {!formData.selectedGif && (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                      <IconButton
                        onClick={() => setShowGifPicker(true)}
                        sx={{
                          width: 32,
                          height: 32,
                          border: '1px solid #000',
                          borderRadius: '6px',
                          backgroundColor: 'white',
                          p: 1,
                          '&:hover': {
                            backgroundColor: 'rgba(0, 0, 0, 0.04)',
                            borderColor: '#000',
                          },
                        }}
                      >
                        <svg width="18" height="8" viewBox="0 0 18 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M8.61429 8V0H10.1571V8H8.61429ZM0 8V0H6.17143V1.6H1.54286V6.4H4.62857V4H6.17143V8H0ZM12.4714 8V0H18V1.6H14.0143V3.6H16.6179V5.2H14.0143V8H12.4714Z" fill="#141414" />
                        </svg>
                      </IconButton>
                    </Box>
                  )}

                  {/* Selected GIF Display - show under input when selected */}
                  {formData.selectedGif && (
                    <Box sx={{ mt: 2 }}>
                      <Box
                        sx={{
                          position: 'relative',
                          borderRadius: '16px',
                          overflow: 'hidden',
                          border: '1px solid rgba(0, 0, 0, 0.12)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                            transform: 'translateY(-1px)',
                          },
                        }}
                        onClick={() => setShowGifPicker(true)}
                      >
                        <Image
                          src={formData.selectedGif.preview_url}
                          alt={formData.selectedGif.title}
                          width={200}
                          height={200}
                          style={{
                            width: '100%',
                            height: 'auto',
                            maxHeight: '200px',
                            objectFit: 'cover',
                            display: 'block',
                          }}
                          unoptimized // For external GIF URLs
                        />

                        {/* Delete button */}
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveGif();
                          }}
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            backgroundColor: 'rgba(0, 0, 0, 0.6)',
                            color: 'white',
                            width: 32,
                            height: 32,
                            '&:hover': {
                              backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            },
                          }}
                          size="small"
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>
          </Stack>
        );

      case 'Phera Concierge':
        return (
          <Stack spacing={3}>
            {/* Header */}
            <Box sx={{ textAlign: 'left' }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ justifyContent: 'center', mb: 1, width: '100%' }}>
                <Typography
                  variant="h3"
                  sx={{
                    fontFamily: 'var(--font-instrument-serif)',
                    fontStyle: 'italic',
                    color: '#1a1a1a',
                    fontWeight: 500,
                  }}
                >
                  One Last Step!
                </Typography>
                <StreamlineIcon name="party-popper" size={32} />
              </Stack>
              <Typography
                variant="body1"
                sx={{
                  fontFamily: 'Outfit',
                  color: '#808080 !important',
                  lineHeight: 1.6,
                  mb: 3,
                }}
              >
                The couple has set up a 24/7 Concierge service via WhatsApp — ask any questions, get live updates, plus more!
              </Typography>
            </Box>

            {/* How to register */}
            <Box sx={{
              backgroundColor: 'rgba(37, 211, 102, 0.08)',
              border: '1px solid rgba(37, 211, 102, 0.2)',
              p: 2.5,
              borderRadius: '16px',
              mb: 1,
            }}>
              <Typography variant="body1" sx={{ fontFamily: 'Outfit', color: '#474747', lineHeight: 1.6 }}>
                <strong>📱 How to register:</strong> Send us a message on WhatsApp to opt in and start using Phera Concierge.
              </Typography>
            </Box>

            {/* Action buttons */}
            <Stack spacing={2}>
              <Button
                variant="contained"
                fullWidth
                href="https://wa.me/15558397813?text=Sign%20me%20up%20for%20Phera%20Concierge%20service!"
                target="_blank"
                startIcon={<StreamlineIcon name="whatsapp" size={28} />}
                sx={{
                  bgcolor: '#DE3F5E',
                  color: 'white',
                  py: 1.8,
                  borderRadius: '16px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  fontFamily: 'Outfit',
                  boxShadow: 'none',
                  '&:hover': {
                    bgcolor: '#C8365A',
                    boxShadow: 'none',
                  },
                }}
              >
                Open WhatsApp
              </Button>

              <Typography
                variant="body2"
                sx={{
                  textAlign: 'left',
                  color: '#808080',
                  fontFamily: 'Outfit',
                  fontSize: '0.9rem',
                  lineHeight: 1.5,
                  mt: 0.5,
                }}
              >
                After sending the message, tap "Done" at the bottom to complete your RSVP.
              </Typography>
            </Stack>
          </Stack >
        );

      default:
        return null;
    }
  };

  return (
    <>
      <FullScreenFormContainer
        title="RSVP"
        onClose={handleClose}
        paperHeight="85vh" // Set to 85% of viewport height as per user request
      >
        {/* Progress Bar */}
        <Box sx={{ mb: { xs: 1.5, sm: 2, md: 3 } }}>
          <Box
            sx={{
              display: 'flex',
              gap: '4px',
              height: { xs: '3px', sm: '4px', md: '5px' },
              borderRadius: '2px',
              overflow: 'hidden',
              backgroundColor: '#F5F5F5',
            }}
          >
            {steps.map((_, index) => (
              <Box
                key={index}
                sx={{
                  flex: 1,
                  height: '100%',
                  backgroundColor: index <= currentStep ? '#DE3F5E' : '#E0E0E0',
                  transition: 'background-color 0.3s ease',
                  '&:first-of-type': {
                    borderTopLeftRadius: '2px',
                    borderBottomLeftRadius: '2px',
                  },
                  '&:last-of-type': {
                    borderTopRightRadius: '2px',
                    borderBottomRightRadius: '2px',
                  },
                }}
              />
            ))}
          </Box>
        </Box>

        {/* Scrollable Content Area */}
        <Box sx={{
          flex: 1,
          overflowY: 'auto',
          minHeight: 0,
          pr: { xs: 0.5, sm: 1, md: 2 },
          px: { xs: 1, sm: 0, md: 2 },
          '&::-webkit-scrollbar': {
            width: { xs: '4px', sm: '6px' },
          },
          '&::-webkit-scrollbar-track': {
            background: '#f1f1f1',
            borderRadius: '3px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#c1c1c1',
            borderRadius: '3px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: '#a8a8a8',
          },
        }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={stepVariants}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </Box>

        {/* Navigation Buttons */}
        <Box sx={{
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(4px)',
          pt: { xs: 2, sm: 2.5 },
          display: 'flex',
          alignItems: 'center',
          gap: { xs: 1, sm: 1.5, md: 2 },
          flexShrink: 0,
          mt: 'auto',
        }}>
          {currentStep > 0 && (
            <IconButton
              onClick={handleBack}
              sx={{
                width: { xs: 44, sm: 48, md: 56 },
                height: { xs: 44, sm: 48, md: 56 },
                borderRadius: '50%',
                backgroundColor: 'rgba(0, 0, 0, 0.16)',
                color: '#141414',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.4)',
                },
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </IconButton>
          )}

          {steps[currentStep] === 'Phera Concierge' ? (
            // On Concierge step - show "Done" button that completes the flow
            <Button
              onClick={async () => {
                await checkRSVPStatus(true);
                setIsSubmitted(true);
              }}
              variant="contained"
              sx={{
                flex: 1,
                height: { xs: 44, sm: 48, md: 56 },
                backgroundColor: '#DE3F5E',
                color: 'white',
                fontWeight: 700,
                fontSize: { xs: '0.9rem', md: '1.1rem' },
                borderRadius: '16px',
                textTransform: 'uppercase',
                letterSpacing: '6.25%',
                fontFamily: 'Outfit',
                '&:hover': {
                  backgroundColor: '#C8365A',
                },
              }}
            >
              Done
            </Button>
          ) : (steps[currentStep] === 'Fun & Messages' || (steps[currentStep] === 'Attendance Details' && formData.attending === 'no')) ? (
            <Button
              onClick={handleSubmit}
              variant="contained"
              sx={{
                flex: 1,
                height: { xs: 44, sm: 48, md: 56 },
                backgroundColor: '#DE3F5E',
                color: 'white',
                fontWeight: 700,
                fontSize: { xs: '0.9rem', md: '1.1rem' },
                borderRadius: '16px',
                textTransform: 'uppercase',
                letterSpacing: '6.25%',
                fontFamily: 'Outfit',
                '&:hover': {
                  backgroundColor: '#C8365A',
                },
                '&:disabled': {
                  backgroundColor: '#ccc',
                  color: '#999',
                },
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit RSVP'}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              variant="contained"
              sx={{
                flex: 1,
                height: { xs: 44, sm: 48, md: 56 },
                backgroundColor: '#DE3F5E',
                color: 'white',
                fontWeight: 700,
                fontSize: { xs: '0.9rem', md: '1.1rem' },
                borderRadius: '16px',
                textTransform: 'uppercase',
                letterSpacing: '6.25%',
                fontFamily: 'Outfit',
                '&:hover': {
                  backgroundColor: '#C8365A',
                },
                '&:disabled': {
                  backgroundColor: '#ccc',
                  color: '#999',
                },
              }}
              disabled={false}
            >
              Next
            </Button>
          )}
        </Box>
      </FullScreenFormContainer>

      {/* Exit Confirmation Dialog */}
      <Dialog open={showExitConfirmation} onClose={handleCancelExit}
        PaperProps={{
          sx: {
            backgroundColor: '#fff',
            color: '#000',
            boxShadow: 8,
          },
        }}
      >
        <DialogTitle sx={{ color: '#000', background: 'transparent' }}>Leave RSVP?</DialogTitle>
        <DialogContent sx={{ color: '#000', background: 'transparent' }}>
          <Typography sx={{ color: '#000' }}>
            Are you sure you want to exit? Your changes will not be saved.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ background: 'transparent', pb: 2, pr: 2 }}>
          <Button onClick={handleCancelExit} variant="outlined" sx={{ color: '#000', borderColor: '#000', '&:hover': { borderColor: '#000', background: '#222' } }}>
            Cancel
          </Button>
          <Button onClick={handleConfirmExit} color="error" variant="contained" sx={{ color: '#fff', background: '#DE3F5E', '&:hover': { background: '#C8365A' } }}>
            Leave
          </Button>
        </DialogActions>
      </Dialog>

      {/* GIF Picker Modal */}
      <GifPicker
        open={showGifPicker}
        onClose={() => setShowGifPicker(false)}
        onSelectGif={handleGifSelect}
      />
    </>
  );
} 