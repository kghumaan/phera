'use client';

import { useState, useEffect } from 'react';
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
} from '@mui/material';
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
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import Confetti from 'react-confetti';
import GifPicker from '@/components/ui/GifPicker';
import { GifData } from '@/lib/supabase/types';

interface RSVPFormData {
  // Basic Information
  firstName: string;
  lastName: string;
  email: string;
  countryCode: string;
  phone: string;
  
  // Attendance
  attending: 'yes' | 'no' | 'maybe' | '';
  plusOne: 'yes' | 'no' | '';
  plusOneName: string;
  plusOneEmail: string;
  guestCount: number;
  
  // Event-specific (ceremonies removed)
  foodPreference: string[];
  dietaryRestrictions: string;
  
  // Cultural & Personal (modified)
  weddingSide: 'bride' | 'groom' | 'both' | '' | undefined;
  
  // Fun & Engagement (participation removed)
  songRequest: string;
  specialMessage: string;
  maybeComment: string;
  selectedGif?: GifData;
}

const initialFormData: RSVPFormData = {
  firstName: '',
  lastName: '',
  email: '',
  countryCode: '+1',
  phone: '',
  attending: '',
  plusOne: '',
  plusOneName: '',
  plusOneEmail: '',
  guestCount: 1,
  foodPreference: [],
  dietaryRestrictions: '',
  weddingSide: '',
  songRequest: '',
  specialMessage: '',
  maybeComment: '',
  selectedGif: undefined,
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
  { code: '+1', country: 'US/CA', flag: '🇺🇸' },
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+81', country: 'Japan', flag: '🇯🇵' },
  { code: '+86', country: 'China', flag: '🇨🇳' },
  { code: '+7', country: 'Russia', flag: '🇷🇺' },
  { code: '+55', country: 'Brazil', flag: '🇧🇷' },
  { code: '+52', country: 'Mexico', flag: '🇲🇽' },
  { code: '+27', country: 'South Africa', flag: '🇿🇦' },
  { code: '+234', country: 'Nigeria', flag: '🇳🇬' },
  { code: '+60', country: 'Malaysia', flag: '🇲🇾' },
  { code: '+66', country: 'Thailand', flag: '🇹🇭' },
  { code: '+84', country: 'Vietnam', flag: '🇻🇳' },
  { code: '+62', country: 'Indonesia', flag: '🇮🇩' },
  { code: '+63', country: 'Philippines', flag: '🇵🇭' },
];

export default function CustomRSVPForm() {
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
  const [windowHeight, setWindowHeight] = useState(typeof window !== 'undefined' ? window.innerHeight : 800);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  const steps = [
    'Basic Information',
    'Attendance Details',
    'Plus One Details',
    'Event Preferences',
    'Personal Details',
    'Fun & Messages',
  ];

  // Track window dimensions changes for proper mobile viewport handling
  useEffect(() => {
    const updateWindowDimensions = () => {
      setWindowHeight(window.innerHeight);
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', updateWindowDimensions);
    window.addEventListener('orientationchange', updateWindowDimensions);
    
    // Update immediately in case initial dimensions were wrong
    updateWindowDimensions();

    return () => {
      window.removeEventListener('resize', updateWindowDimensions);
      window.removeEventListener('orientationchange', updateWindowDimensions);
    };
  }, []);

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
            getExistingRSVP(user.email, 'sim-kv'),
            timeoutPromise
          ]);
          console.log('CustomRSVPForm: getExistingRSVP result:', result);
          
          if (result.success && result.data) {
            console.log('CustomRSVPForm: Found existing RSVP data:', result.data);
            setFormData(prev => ({
              ...prev,
              ...result.data
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
    router.push('/');
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

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};
    
    switch (step) {
      case 0: // Basic Information
        if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
        if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          newErrors.email = 'Please enter a valid email';
        }
        if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
        if (formData.phone && formData.phone.replace(/\D/g, '').length < 10) {
          newErrors.phone = 'Please enter a valid phone number (at least 10 digits)';
        }
        break;
      
      case 1: // Attendance Details
        if (!formData.attending) newErrors.attending = 'Please select attendance';
        break;
      
      case 2: // Plus One Details  
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
        }
        break;
      
      case 3: // Event Preferences
        if (formData.attending === 'yes' && formData.foodPreference.length === 0) {
          newErrors.foodPreference = 'Please select at least one food preference';
        }
        break;

      case 4: // Personal Details
        if (!formData.weddingSide) {
          newErrors.weddingSide = 'Please select which side of the wedding';
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      // Skip plus one section if not attending
      if (currentStep === 1 && formData.attending !== 'yes') {
        setCurrentStep(prev => Math.min(prev + 2, steps.length - 1)); // Skip case 2 (plus one)
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
      
      const result = await submitRSVP(formData, 'sim-kv');
      
      if (result.success) {
        console.log('RSVP submitted successfully, result:', result);
        
        // Refresh authentication to pick up the new guest auth
        await refreshAuth();
        
        // Wait a bit for database to be consistent, then check RSVP status
        setTimeout(async () => {
          console.log('Checking RSVP status after delay...');
          await checkRSVPStatus();
        }, 1000);
        
        setIsSubmitted(true);
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
        case 'yes':
          return '/images/overlays/yes-rsvp.png';
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
        <Confetti
          width={windowWidth}
          height={windowHeight}
          recycle={false}
          numberOfPieces={200}
          gravity={0.3}
        />
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <Container 
            maxWidth="sm" 
            sx={{ 
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '100vh',
              py: 0,
              px: { xs: 2, sm: 3, md: 4 },
              overflow: 'hidden',
            }}
          >
            <motion.div
              initial="hidden"
              animate="visible"
              variants={containerVariants}
              style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}
            >
              {/* RSVP Header - Same as form */}
              {/* <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                mb: { xs: 0.5, sm: 1, md: 2 }, 
                flexShrink: 0,
              }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontFamily: 'Outfit', 
                    color: '#141414', 
                    fontWeight: 400,
                    fontSize: { xs: '16px', sm: '18px' },
                    lineHeight: '1.26em',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    textAlign: 'center'
                  }}
                >
                  RSVP
                </Typography>
              </Box> */}

              {/* Form Content - Same structure as regular form */}
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 1,
                  border: '1px solid #000',
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  color: '#000000',
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  mt: 6,
                  minHeight: '180px',
                  maxHeight: windowHeight - (isMobile ? 160 : 190),
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                {/* Overlay Image - Absolutely positioned on top */}
                {getOverlayImage() && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      width: '100%',
                      height: { xs: 200, sm: 200, md: 200 },
                      backgroundImage: `url(${getOverlayImage()})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center top',
                      backgroundRepeat: 'no-repeat',
                      zIndex: 1,
                      borderRadius: '4px 4px 0 0', // Match Paper border radius at top
                    }}
                  />
                )}

                {/* Scrollable Content Area - Full width for confirmation */}
                <Box sx={{ 
                  flex: 1, 
                  overflowY: 'auto', 
                  minHeight: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  zIndex: 2, // Above overlay
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
                    <Box sx={{ height: { xs: 200, sm: 200, md: 200 }, flexShrink: 0 }} />
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
                    mt: { xs: -20, sm: -20, md: -20 }, // Pull content up to better center it
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
                        {formData.attending === 'yes' && (
                          <>
                            <Typography sx={{ 
                              fontFamily: 'Outfit', 
                              color: '#000', 
                              fontSize: { xs: '1.375rem', sm: '1.375rem', md: '1.375rem' }, 
                              lineHeight: 1.5, 
                              textAlign: 'center',
                              fontWeight: 400,
                            }}>
                              Yay! You're part of our celebration and we can't wait to have you there
                            </Typography>
                            
                            <Typography sx={{ 
                              color: '#474747', 
                              fontSize: { xs: '1rem', sm: '1rem', md: '1rem' }, 
                              lineHeight: 1.5, 
                              textAlign: 'center', 
                              fontFamily: 'Outfit',
                              fontWeight: 400,
                            }}>
                              Your room is booked and fully paid for! We'll be updating this website with a lot more details soon so keep an eye out for texts/emails!
                            </Typography>
                          </>
                        )}
                        
                        {formData.attending === 'maybe' && (
                          <>
                            <Typography sx={{ 
                              fontFamily: 'Outfit', 
                              color: '#000', 
                              fontSize: { xs: '1.375rem', sm: '1.375rem', md: '1.375rem' }, 
                              lineHeight: 1.5, 
                              textAlign: 'center',
                              fontWeight: 400,
                            }}>
                              Thanks for letting us know!
                            </Typography>
                            
                            <Typography sx={{ 
                              color: '#474747', 
                              fontSize: { xs: '1rem', sm: '1rem', md: '1rem' }, 
                              lineHeight: 1.5, 
                              textAlign: 'center', 
                              fontFamily: 'Outfit',
                              fontWeight: 400 
                            }}>
                              We understand you need to figure some things out. Just remember: We need your final answer by August 31, 2025. We'll check in with you before then!
                              {'\n\n'}
                              Use your email or phone number to sign in anytime so you can update your response.
                            </Typography>
                          </>
                        )}
                        
                        {formData.attending === 'no' && (
                          <>
                            <Typography sx={{ 
                              fontFamily: 'Outfit', 
                              color: '#000', 
                              fontSize: { xs: '1.375rem', sm: '1.375rem', md: '1.375rem' }, 
                              lineHeight: 1.5, 
                              textAlign: 'center',
                              fontWeight: 400,
                            }}>
                              We'll miss you! :(
                            </Typography>
                            
                            <Typography sx={{ 
                              color: '#474747', 
                              fontSize: { xs: '1rem', sm: '1rem', md: '1rem' }, 
                              lineHeight: 1.5, 
                              textAlign: 'center', 
                              fontFamily: 'Outfit',
                              fontWeight: 400 
                            }}>
                              We're sad you can't make it, but we understand. Your account is still ready if anything changes! RSVPs close on August 31, 2025.
                            </Typography>
                          </>
                        )}
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
                      onClick={() => router.push('/')}
                      variant="contained"
                      size="large"
                      fullWidth
                      sx={{
                        backgroundColor: '#DE3F5E',
                        color: 'white',
                        py: { xs: 1.5, sm: 1.5 },
                        fontSize: { xs: '1rem', sm: '1rem' },
                        fontWeight: 700,
                        borderRadius: '80px',
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
    switch (currentStep) {
      case 0: // Basic Information
        return (
          <Stack spacing={2}>
            <Typography 
              variant="h4" 
              sx={{ 
                color: '#000', 
                mb: 2,
                fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
                fontFamily: 'Outfit',
                fontWeight: 400,
                lineHeight: 1.3,
              }}
            >
              Let's make this celebration official! ✨
            </Typography>
            
            <Typography 
              variant="body1" 
              sx={{ 
                color: '#808080 !important', 
                mb: 3,
                fontSize: { xs: '0.9rem', sm: '1rem' },
                fontFamily: 'Outfit',
                lineHeight: 1.5,
              }}
            >
              First, we need some basics to create your guest account:
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, flexDirection: 'row' }}>
              <Box sx={{ flex: 1 }}>
                <Box
                  sx={{
                    border: '1px solid rgba(0, 0, 0, 0.24)',
                    borderRadius: '8px',
                    padding: '12px 12px',
                    backgroundColor: 'white',
                    cursor: 'text',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    '&:hover': {
                      borderColor: 'rgba(0, 0, 0, 0.4)',
                    },
                    '&:focus-within': {
                      borderColor: '#DAA520',
                      borderWidth: '2px',
                      padding: '11px 11px',
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
                      fontSize: windowWidth < 600 ? '14px' : '16px',
                      color: formData.firstName ? '#000' : '#C2C2C2',
                      backgroundColor: 'transparent',
                    }}
                    className="responsive-placeholder"
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
                    border: '1px solid rgba(0, 0, 0, 0.24)',
                    borderRadius: '8px',
                    padding: '12px 12px',
                    backgroundColor: 'white',
                    cursor: 'text',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    '&:hover': {
                      borderColor: 'rgba(0, 0, 0, 0.4)',
                    },
                    '&:focus-within': {
                      borderColor: '#DAA520',
                      borderWidth: '2px',
                      padding: '11px 11px',
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
                      fontSize: windowWidth < 600 ? '14px' : '16px',
                      color: formData.lastName ? '#000' : '#C2C2C2',
                      backgroundColor: 'transparent',
                    }}
                    className="responsive-placeholder"
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
                  border: '1px solid rgba(0, 0, 0, 0.24)',
                  borderRadius: '8px',
                  padding: '12px 12px',
                  backgroundColor: 'white',
                  cursor: 'text',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  '&:hover': {
                    borderColor: 'rgba(0, 0, 0, 0.4)',
                  },
                  '&:focus-within': {
                    borderColor: '#DAA520',
                    borderWidth: '2px',
                    padding: '11px 11px',
                  },
                }}
              >
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  style={{
                    border: 'none',
                    outline: 'none',
                    width: '100%',
                    fontFamily: 'Outfit',
                    fontSize: windowWidth < 600 ? '14px' : '16px',
                    color: formData.email ? '#000' : '#C2C2C2',
                    backgroundColor: 'transparent',
                  }}
                  className="responsive-placeholder"
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
                  border: '1px solid rgba(0, 0, 0, 0.24)',
                  borderRadius: '8px',
                  padding: '12px 12px',
                  backgroundColor: 'white',
                  cursor: 'text',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  '&:hover': {
                    borderColor: 'rgba(0, 0, 0, 0.4)',
                  },
                  '&:focus-within': {
                    borderColor: '#DAA520',
                    borderWidth: '2px',
                    padding: '11px 11px',
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
                        '& .MuiSelect-select': {
                          padding: '0px 8px 0px 0px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          fontSize: '1rem',
                          border: 'none',
                          '&:focus': {
                            backgroundColor: 'transparent',
                          },
                        },
                        '& .MuiSelect-icon': {
                          color: '#666',
                          fontSize: '1.2rem',
                        },
                      }}
                    >
                      {countryCodes.map((country) => (
                        <MenuItem key={country.code} value={country.code}>
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
                    fontSize: windowWidth < 600 ? '14px' : '16px',
                    color: formData.phone ? '#000' : '#C2C2C2',
                    backgroundColor: 'transparent',
                    marginLeft: '8px',
                  }}
                  className="responsive-placeholder"
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
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                fontFamily: 'Outfit',
                lineHeight: 1.4,
              }}
            >
              <strong>Note:</strong> We're creating your account so you can easily access wedding updates and never have to find that invitation code again! Phone number is required for hotel confirmations and important updates.
            </Typography>
          </Stack>
        );

      case 1: // Attendance Details
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
                  fontSize: { xs: '1.5rem', sm: '1.75rem', md: '1.75rem' },
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
                  fontSize: { xs: '0.9rem', sm: '1rem' },
                  lineHeight: 1.5,
                  fontFamily: 'Outfit'
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
                          fontSize: { xs: '0.9rem', sm: '1rem' },
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
                            border: '1px solid rgba(0, 0, 0, 0.24)',
                            borderRadius: '8px',
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
                            fontSize: windowWidth < 600 ? '14px' : '16px',
                            color: formData.maybeComment ? '#141414' : 'rgba(0, 0, 0, 0.6)',
                              backgroundColor: 'transparent',
                            }}
                            className="responsive-textarea"
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
                            borderRadius: '8px',
                            color: 'rgba(0, 0, 0, 0.72)',
                            mt: 2
                          }}
                        >
                          <Typography variant="body2" sx={{ 
                            fontWeight: 400,
                            fontSize: { xs: '0.8rem', sm: '0.875rem' },
                            lineHeight: 1.5,
                            fontFamily: 'Outfit'
                          }}>
                            📅  Final answer needed by: <strong>August 31, 2025</strong>
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
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                fontFamily: 'Outfit',
                mt: 3
              }}
            >
              <strong>Note:</strong> Your accommodation will be covered by us! We need to book the right number of rooms, so please let us know for sure by July 31, 2025!
            </Typography>
            

            
            {/* <Collapse in={formData.attending === 'no'}>
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  p: 2, 
                  backgroundColor: 'rgba(0, 0, 0, 0.08)', 
                  borderRadius: '8px',
                  color: 'rgba(0, 0, 0, 0.72)',
                  mt: 2
                }}
              >
                <Typography variant="body2" sx={{ 
                  fontWeight: 400,
                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                  lineHeight: 1.5,
                  fontFamily: 'Outfit'
                }}>
                  We'll miss you! We hope to celebrate with you in the future. 💕
                </Typography>
              </Box>
            </Collapse> */}
          </Stack>
        );

      case 2: // Plus One Details
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
                  fontSize: { xs: '1.4rem', sm: '1.6rem', md: '1.75rem' },
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
                  fontSize: { xs: '0.9rem', sm: '1rem' },
                  lineHeight: 1.5,
                  fontFamily: 'Outfit'
                }}
              >
                Couples share one invitation - add your partner here!
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
                          fontSize: { xs: '0.9rem', sm: '1rem' },
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
                        border: '1px solid rgba(0, 0, 0, 0.24)',
                        borderRadius: '8px',
                        padding: '12px 12px',
                        backgroundColor: 'white',
                        cursor: 'text',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        '&:hover': {
                          borderColor: 'rgba(0, 0, 0, 0.4)',
                        },
                        '&:focus-within': {
                          borderColor: '#DAA520',
                          borderWidth: '2px',
                          padding: '11px 11px',
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
                          fontSize: windowWidth < 600 ? '14px' : '16px',
                          color: formData.plusOneName.split(' ')[0] ? '#000' : '#C2C2C2',
                          backgroundColor: 'transparent',
                        }}
                        className="responsive-placeholder"
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
                        border: '1px solid rgba(0, 0, 0, 0.24)',
                        borderRadius: '8px',
                        padding: '12px 12px',
                        backgroundColor: 'white',
                        cursor: 'text',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        '&:hover': {
                          borderColor: 'rgba(0, 0, 0, 0.4)',
                        },
                        '&:focus-within': {
                          borderColor: '#DAA520',
                          borderWidth: '2px',
                          padding: '11px 11px',
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
                          fontSize: windowWidth < 600 ? '14px' : '16px',
                          color: formData.plusOneName.split(' ').slice(1).join(' ') ? '#000' : '#C2C2C2',
                          backgroundColor: 'transparent',
                        }}
                        className="responsive-placeholder"
                      />
                    </Box>
                  </Box>
                </Box>

                {/* Email Field */}
                <Box sx={{ mb: 2 }}>
                  <Box
                    sx={{
                      border: '1px solid rgba(0, 0, 0, 0.24)',
                      borderRadius: '8px',
                      padding: '12px 12px',
                      backgroundColor: 'white',
                      cursor: 'text',
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      '&:hover': {
                        borderColor: 'rgba(0, 0, 0, 0.4)',
                      },
                      '&:focus-within': {
                        borderColor: '#DAA520',
                        borderWidth: '2px',
                        padding: '11px 11px',
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
                      fontSize: windowWidth < 600 ? '14px' : '16px',
                      color: formData.plusOneEmail ? '#000' : '#C2C2C2',
                        backgroundColor: 'transparent',
                      }}
                      className="responsive-placeholder"
                    />
                  </Box>
                  {errors.plusOneEmail && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block', fontSize: '0.75rem' }}>
                      {errors.plusOneEmail}
                    </Typography>
                  )}
                </Box>

                {/* Phone Field */}
                <Box sx={{ mb: 2 }}>
                  <Box
                    sx={{
                      border: '1px solid rgba(0, 0, 0, 0.24)',
                      borderRadius: '8px',
                      padding: '12px 12px',
                      backgroundColor: 'white',
                      cursor: 'text',
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      '&:hover': {
                        borderColor: 'rgba(0, 0, 0, 0.4)',
                      },
                      '&:focus-within': {
                        borderColor: '#DAA520',
                        borderWidth: '2px',
                        padding: '11px 11px',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography sx={{ fontSize: '1.2rem' }}>🇺🇸</Typography>
                      <Typography sx={{ fontFamily: 'Outfit', fontSize: '14px', color: '#000' }}>
                        +1
                      </Typography>
                    </Box>
                    <input
                      type="tel"
                      inputMode="tel"
                      placeholder="000 000 0000 (optional)"
                      value={formData.phone || ''}
                      onChange={(e) => {
                        const cleanValue = e.target.value.replace(/[^\d+\s-()]/g, '');
                        handleInputChange('phone', cleanValue);
                      }}
                      style={{
                        border: 'none',
                        outline: 'none',
                        flex: 1,
                        fontFamily: 'Outfit',
                        fontSize: windowWidth < 600 ? '14px' : '16px',
                        color: formData.phone ? '#000' : '#C2C2C2',
                        backgroundColor: 'transparent',
                        marginLeft: '8px',
                      }}
                      className="responsive-placeholder"
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
                          fontSize: { xs: '0.9rem', sm: '1rem' },
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
                  fontSize: { xs: '0.9rem', sm: '1rem' },
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
                borderRadius: '8px',
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
                    fontSize: { xs: '1.1rem', sm: '1.25rem' },
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

      case 3: // Event Preferences
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
                  fontSize: { xs: '1.4rem', sm: '1.6rem', md: '1.75rem' },
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
                  fontSize: { xs: '0.9rem', sm: '1rem' },
                  lineHeight: 1.5,
                  fontFamily: 'Outfit'
                }}
              >
                                 Select all that apply for you (and your plus one)!
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
                           fontSize: { xs: '0.9rem', sm: '1rem' },
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
                     border: '1px solid rgba(0, 0, 0, 0.24)',
                     borderRadius: '8px',
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
                       fontSize: windowWidth < 600 ? '14px' : '16px',
                       color: formData.dietaryRestrictions ? '#000' : 'rgba(0, 0, 0, 0.48)',
                       backgroundColor: 'transparent',
                     }}
                     className="responsive-textarea"
                   />
                 </Box>
               </Box>
             )}
          </Stack>
        );

      case 4: // Personal Details
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
                  fontSize: { xs: '1.4rem', sm: '1.6rem', md: '1.75rem' },
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
                  fontSize: { xs: '0.9rem', sm: '1rem' },
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
                          fontSize: { xs: '0.9rem', sm: '1rem' },
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
          </Stack>
        );

      case 5: // Fun & Messages
        return (
          <Stack spacing={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {/* Music Request Section */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      color: '#000', 
                      fontWeight: 400,
                      lineHeight: 1.3,
                      mb: 1,
                      fontSize: { xs: '1.4rem', sm: '1.6rem', md: '1.75rem' },
                      fontFamily: 'Outfit'
                    }}
                  >
                    Music requests 🎵
                  </Typography>
                  
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      color: 'rgba(0, 0, 0, 0.48)', 
                      fontWeight: 400,
                      fontSize: { xs: '0.9rem', sm: '1rem' },
                      lineHeight: 1.5,
                      fontFamily: 'Outfit'
                    }}
                  >
                    What song will make this celebration perfect? (optional)
                  </Typography>
                </Box>
                
                <Box
                  sx={{
                    border: '1px solid rgba(0, 0, 0, 0.24)',
                    borderRadius: '8px',
                    padding: '12px 12px',
                    backgroundColor: 'white',
                    cursor: 'text',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    '&:hover': {
                      borderColor: 'rgba(0, 0, 0, 0.4)',
                    },
                    '&:focus-within': {
                      borderColor: '#DAA520',
                      borderWidth: '2px',
                      padding: '11px 11px',
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
                      fontSize: windowWidth < 600 ? '14px' : '16px',
                      color: formData.songRequest ? '#000' : '#C2C2C2',
                      backgroundColor: 'transparent',
                    }}
                    className="responsive-placeholder"
                  />
                </Box>
              </Box>
              
              {/* Special Message Section */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      color: '#000', 
                      fontWeight: 400,
                      lineHeight: 1.3,
                      mb: 1,
                      fontSize: { xs: '1.4rem', sm: '1.6rem', md: '1.75rem' },
                      fontFamily: 'Outfit'
                    }}
                  >
                    Share your excitement 💬
                  </Typography>
                  
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      color: 'rgba(0, 0, 0, 0.48)', 
                      fontWeight: 400,
                      fontSize: { xs: '0.9rem', sm: '1rem' },
                      lineHeight: 1.5,
                      fontFamily: 'Outfit'
                    }}
                  >
                    Leave a message for everyone to see! (optional)
                  </Typography>
                </Box>
                
                <Box
                  sx={{
                    border: '1px solid rgba(0, 0, 0, 0.24)',
                    borderRadius: '8px',
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
                      fontSize: windowWidth < 600 ? '14px' : '16px',
                      color: formData.specialMessage ? '#000' : '#C2C2C2',
                      backgroundColor: 'transparent',
                    }}
                    className="responsive-textarea"
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
                          <path d="M8.61429 8V0H10.1571V8H8.61429ZM0 8V0H6.17143V1.6H1.54286V6.4H4.62857V4H6.17143V8H0ZM12.4714 8V0H18V1.6H14.0143V3.6H16.6179V5.2H14.0143V8H12.4714Z" fill="#141414"/>
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
                        <img
                          src={formData.selectedGif.preview_url}
                          alt={formData.selectedGif.title}
                          style={{
                            width: '100%',
                            height: 'auto',
                            maxHeight: '200px',
                            objectFit: 'cover',
                            display: 'block',
                          }}
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

      default:
        return null;
    }
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Loading Overlay for Existing RSVP Data */}
      <AnimatePresence>
        {isLoadingExisting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(4px)',
              zIndex: 9998,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
                padding: 4,
                borderRadius: 2,
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                border: '1px solid rgba(0, 0, 0, 0.1)',
              }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                style={{
                  width: 48,
                  height: 48,
                  border: '4px solid #f3f3f3',
                  borderTop: '4px solid #DE3F5E',
                  borderRadius: '50%',
                }}
              />
              <Typography
                variant="h6"
                sx={{
                  color: '#000',
                  fontWeight: 600,
                  fontFamily: 'Outfit',
                  textAlign: 'center',
                }}
              >
                Loading Your RSVP...
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: '#666',
                  textAlign: 'center',
                  maxWidth: 250,
                }}
              >
                We're fetching your existing information to make updating easier
              </Typography>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>

      <Container 
        maxWidth="sm" 
        sx={{ 
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          alignItems: 'center',
          minHeight: '100vh',
          pt: 0,
          pb: { xs: 2, sm: 3 },
          px: { xs: 2, sm: 3, md: 4 },
          overflow: 'hidden',
        }}
      >
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          style={{ 
            width: '100%', 
            maxWidth: '500px',
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {/* Header with close button and RSVP title - perfectly aligned */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            width: '100%',
            height: 56,
            mb: { xs: 0.5, sm: 1 }, 
            flexShrink: 0,
          }}>
            <IconButton
              onClick={handleClose}
              sx={{
                color: '#000',
                backgroundColor: 'transparent',
                p: { xs: 1, sm: 1.5 },
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                },
              }}
            >
              <CloseIcon />
            </IconButton>
            
            <Typography 
              variant="h6" 
              sx={{ 
                fontFamily: 'Outfit', 
                color: '#141414', 
                fontWeight: 400,
                fontSize: { xs: '16px', sm: '18px' },
                lineHeight: '1.26em',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                textAlign: 'center'
              }}
            >
              RSVP
            </Typography>
            
            {/* Spacer to center the RSVP text */}
            <Box sx={{ width: { xs: 40, sm: 48 } }} />
          </Box>

          {/* Form Content */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 1.5, sm: 2.5 },
              borderRadius: 1,
              border: '1px solid #000',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              color: '#000000',
              display: 'flex',
              flexDirection: 'column',
              height: windowHeight - (isMobile ? 180 : 200),
              width: '100%',
              // Responsive placeholder styles
              '& .responsive-placeholder::placeholder': {
                fontSize: { xs: '13px', sm: '16px' },
                color: '#C2C2C2 !important',
              },
              '& .responsive-textarea::placeholder': {
                fontSize: { xs: '13px', sm: '16px' },
                color: '#C2C2C2 !important',
              },
              '& .MuiFormLabel-root': {
                color: '#333333 !important',
                fontWeight: 600,
              },
              '& .MuiTextField-root .MuiInputLabel-root': {
                color: '#808080 !important',
              },
              '& .MuiTextField-root .MuiOutlinedInput-root': {
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                color: '#000000 !important',
                borderRadius: '8px !important',
                '& fieldset': {
                  borderColor: '#808080 !important',
                  borderRadius: '8px !important',
                },
                '&:hover fieldset': {
                  borderColor: '#808080 !important',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#DAA520 !important',
                  borderWidth: '2px !important',
                },
                '& input::placeholder': {
                  color: '#C2C2C2 !important',
                  opacity: 1,
                },
                '& input': {
                  '&:-webkit-autofill': {
                    WebkitBoxShadow: '0 0 0 1000px rgba(255, 255, 255, 0.8) inset !important',
                    WebkitTextFillColor: '#000000 !important',
                    backgroundColor: 'transparent !important',
                  },
                  '&:-webkit-autofill:hover': {
                    WebkitBoxShadow: '0 0 0 1000px rgba(255, 255, 255, 0.8) inset !important',
                    WebkitTextFillColor: '#000000 !important',
                  },
                  '&:-webkit-autofill:focus': {
                    WebkitBoxShadow: '0 0 0 1000px rgba(255, 255, 255, 0.8) inset !important',
                    WebkitTextFillColor: '#000000 !important',
                  },
                },
              },
              '& .MuiTextField-root .MuiOutlinedInput-input': {
                color: '#000000 !important',
                padding: '16.5px 14px',
              },
              '& .MuiTextField-root .MuiInputBase-inputMultiline': {
                padding: '16.5px 14px',
              },
              '& .MuiRadio-root': {
                color: '#666666 !important',
              },
              '& .MuiFormControlLabel-label': {
                color: '#000000 !important',
              },
              '& .MuiChip-root': {
                color: '#000000 !important',
              },
              '& .MuiSelect-root': {
                color: '#000000 !important',
              },
              '& .MuiSelect-select': {
                padding: '16.5px 14px',
              },
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px !important',
                '& fieldset': {
                  borderColor: '#808080 !important',
                  borderRadius: '8px !important',
                },
                '&:hover fieldset': {
                  borderColor: '#808080 !important',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#DAA520 !important',
                  borderWidth: '2px !important',
                },
              },
              '& .MuiMenuItem-root': {
                color: '#000000 !important',
              },
            }}
          >
            {/* Progress Bar - moved inside form */}
            <Box sx={{ mb: { xs: 1, sm: 2 }, flexShrink: 0 }}>            
              {/* Horizontal Segment Progress Bar */}
              <Box sx={{ mb: { xs: 1.5, sm: 2 } }}>
                <Box
                  sx={{
                    display: 'flex',
                    gap: '4px',
                    height: { xs: '3px', sm: '4px' },
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
            </Box>

            {/* Scrollable Content Area */}
            <Box sx={{ 
              flex: 1, 
              overflowY: 'auto', 
              minHeight: 0,
              pr: { xs: 0.5, sm: 1 },
              px: { xs: 1, sm: 0 },
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
              gap: { xs: 1, sm: 1.5 },
              flexShrink: 0,
              mt: 'auto',
            }}>
              {currentStep > 0 && (
                <IconButton
                  onClick={handleBack}
                  sx={{
                    width: { xs: 44, sm: 48 },
                    height: { xs: 44, sm: 48 },
                    borderRadius: '50%',
                    backgroundColor: 'rgba(0, 0, 0, 0.16)',
                    color: '#141414',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.24)',
                    },
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m15 18-6-6 6-6"/>
                  </svg>
                </IconButton>
              )}
              
              {currentStep < steps.length - 1 ? (
                <Button
                  onClick={currentStep === 1 && formData.attending === 'no' ? handleSubmit : handleNext}
                  variant="contained"
                  sx={{ 
                    flex: 1,
                    height: { xs: 44, sm: 48 },
                    backgroundColor: '#DE3F5E',
                    color: 'white',
                    fontSize: { xs: '0.9rem', sm: '1rem' },
                    fontWeight: 700,
                    borderRadius: '80px',
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
                  {currentStep === 1 && formData.attending === 'no' ? 'Submit' : 'Next'}
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  variant="contained"
                  sx={{
                    flex: 1,
                    height: { xs: 44, sm: 48 },
                    backgroundColor: '#DE3F5E',
                    color: 'white',
                    fontSize: { xs: '0.9rem', sm: '1rem' },
                    fontWeight: 700,
                    borderRadius: '80px',
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
              )}
            </Box>
          </Paper>

          {/* Exit Confirmation Dialog */}
          <Dialog
            open={showExitConfirmation}
            onClose={handleCancelExit}
            maxWidth="sm"
            fullWidth
            PaperProps={{
              sx: {
                borderRadius: 1,
                border: '1px solid #000',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
              }
            }}
          >
            <DialogTitle sx={{ color: '#000', fontWeight: 600 }}>
              Exit RSVP Process?
            </DialogTitle>
            <DialogContent>
              <Typography variant="body1" sx={{ color: '#000' }}>
                Are you sure you want to leave? Any information you've entered will be lost and you'll need to start over.
              </Typography>
            </DialogContent>
            <DialogActions sx={{ p: 3, gap: 2 }}>
              <Button
                onClick={handleCancelExit}
                variant="outlined"
                sx={{
                  borderColor: '#000',
                  color: '#000',
                  '&:hover': {
                    borderColor: '#000',
                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  },
                }}
              >
                Continue RSVP
              </Button>
              <Button
                onClick={handleConfirmExit}
                variant="contained"
                sx={{
                  backgroundColor: '#DC3545',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: '#C82333',
                  },
                }}
              >
                Yes, Exit
              </Button>
            </DialogActions>
          </Dialog>

          {/* GIF Picker Dialog */}
          <GifPicker
            open={showGifPicker}
            onClose={() => setShowGifPicker(false)}
            onSelectGif={handleGifSelect}
          />
        </motion.div>
      </Container>
    </Box>
  );
} 