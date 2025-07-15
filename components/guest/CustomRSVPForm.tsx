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
import FullScreenFormContainer from '@/components/shared/FullScreenFormContainer';
import { WEDDING_CONFIG } from '@/lib/constants/wedding-config';

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
  plusOneCountryCode: string; // <-- Added
  plusOnePhone: string; // <-- Added
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
  arrivalOption: 'known' | 'not_sure' | '';
  arrivalDate: string;
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

  const steps = allowsPlusOne ? [
    'Basic Information',
    'Attendance Details',
    'Plus One Details',
    'Event Preferences',
    'Personal Details',
    'Arrival Plans',
    'Fun & Messages',
  ] : [
    'Basic Information',
    'Attendance Details',
    'Event Preferences',
    'Personal Details',
    'Arrival Plans',
    'Fun & Messages',
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
    
    // Adjust step numbers based on whether plus-ones are allowed
    const getActualStepType = (step: number) => {
      if (allowsPlusOne) {
        return step; // No adjustment needed
      } else {
        // When plus-ones not allowed, shift steps after attendance
        if (step >= 2) return step + 1; // Event Preferences becomes case 3, etc.
        return step;
      }
    };
    
    const actualStep = getActualStepType(step);
    
    switch (actualStep) {
      case 0: // Basic Information
        if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
        if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          newErrors.email = 'Please enter a valid email';
        }
        // Phone is now optional, but if provided, validate format
        if (formData.phone && formData.phone.replace(/\D/g, '').length > 0 && formData.phone.replace(/\D/g, '').length < 10) {
          newErrors.phone = 'Please enter a valid phone number (at least 10 digits)';
        }
        break;
      
      case 1: // Attendance Details
        if (!formData.attending) newErrors.attending = 'Please select attendance';
        break;
      
      case 2: // Plus One Details (only when allowsPlusOne is true)
        if (allowsPlusOne) {
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

      case 5: // Arrival Plans
        if (!formData.arrivalOption) {
          newErrors.arrivalOption = 'Please select an arrival option';
        }
        if (formData.arrivalOption === 'known' && !formData.arrivalDate) {
          newErrors.arrivalDate = 'Please select your arrival date';
        }
        break;

      case 6: // Fun & Messages
        // No required fields in this step - both song request and special message are optional
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
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

      // If plus-ones are not allowed, or if not attending, skip the plus-one section
      if (allowsPlusOne && currentStep === 1 && formData.attending !== 'yes') {
        setCurrentStep(prev => Math.min(prev + 2, steps.length - 1)); // Skip plus one section
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
                  maxHeight: 'calc(100vh - 160px)',
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
                                  Your room is booked and fully paid for! We'll be updating this website with a lot more details soon so keep an eye out for texts/emails!
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
                      onClick={() => router.push('/')}
                      variant="contained"
                      size="large"
                      fullWidth
                      sx={{
                        backgroundColor: '#DE3F5E',
                        color: 'white',
                        py: { xs: 1.5, sm: 1.5 },
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
    // Adjust step numbers based on whether plus-ones are allowed
    const getActualStepType = (step: number) => {
      if (allowsPlusOne) {
        return step; // No adjustment needed
      } else {
        // When plus-ones not allowed, shift steps after attendance
        if (step >= 2) return step + 1; // Event Preferences becomes case 3, etc.
        return step;
      }
    };
    
    const actualStep = getActualStepType(currentStep);
    
    switch (actualStep) {
      case 0: // Basic Information
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
                fontSize: '1.75rem',
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
                      color: formData.firstName ? '#000' : '#C2C2C2',
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
                      color: formData.lastName ? '#000' : '#C2C2C2',
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
                    color: formData.email ? '#000' : '#C2C2C2',
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
                    color: formData.phone ? '#000' : '#C2C2C2',
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
                            borderRadius: '8px',
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
                  borderRadius: '8px',
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

      case 2: // Plus One Details (only when allowsPlusOne is true)
        if (!allowsPlusOne) return null; // Safety check
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
                          color: formData.plusOneName.split(' ')[0] ? '#000' : '#C2C2C2',
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
                          color: formData.plusOneName.split(' ').slice(1).join(' ') ? '#000' : '#C2C2C2',
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
                        color: formData.plusOneEmail ? '#000' : '#C2C2C2',
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
                      border: '1px solid rgba(0, 0, 0, 0.24)',
                      borderRadius: '8px',
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
                        color: formData.plusOnePhone ? '#000' : '#C2C2C2',
                        backgroundColor: 'transparent',
                        marginLeft: '8px',
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
                       color: formData.dietaryRestrictions ? '#000' : 'rgba(0, 0, 0, 0.48)',
                       backgroundColor: 'transparent',
                     }}
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
          </Stack>
        );

      case 5: // Arrival Plans
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
                When do you plan to arrive in Thailand? 🛬
              </Typography>
              
              <Typography 
                variant="body1" 
                sx={{ 
                  color: 'rgba(0, 0, 0, 0.48)', 
                  fontWeight: 400,
                  mt: 1,
                  fontFamily: 'Outfit',
                  lineHeight: 1.5,
                }}
              >
                We'll share travel tips and help coordinate arrivals!
              </Typography>
            </Box>
            
            <Box>
              {[
                { value: 'known', label: 'I know my arrival date' },
                { value: 'not_sure', label: "Not sure yet, I'll share later" }
              ].map((option, index, array) => (
                <Box key={option.value}>
                  <Box
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
                    onClick={() => handleInputChange('arrivalOption', option.value)}
                  >
                    <Typography 
                      sx={{ 
                        color: formData.arrivalOption === option.value ? '#DE3F5E' : '#000',
                        fontWeight: formData.arrivalOption === option.value ? 600 : 400,
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
                        border: `2px solid ${formData.arrivalOption === option.value ? '#DE3F5E' : 'rgba(0, 0, 0, 0.3)'}` ,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: formData.arrivalOption === option.value ? '#DE3F5E' : 'transparent',
                      }}
                    >
                      {formData.arrivalOption === option.value && (
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
                  
                  {option.value === 'known' && (
                    <Collapse in={formData.arrivalOption === 'known'}>
                      <TextField
                        type="date"
                        value={formData.arrivalDate}
                        onChange={(e) => handleInputChange('arrivalDate', e.target.value)}
                        fullWidth
                        error={!!errors.arrivalDate}
                        helperText={errors.arrivalDate}
                        InputLabelProps={{ shrink: true }}
                        inputProps={{
                          min: '2025-12-01',
                          max: '2026-01-04',
                          style: {
                            fontFamily: 'Outfit',
                            border: '1px solid #ccc',
                            color: '#000',
                            borderRadius: '8px',
                          },
                        }}
                        sx={{
                          marginTop: 2, marginBottom: 2,
                          fontFamily: 'Outfit',
                        }}
                      />
                    </Collapse>
                  )}
                </Box>
              ))}
              
              {errors.arrivalOption && (
                <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                  {errors.arrivalOption}
                </Typography>
              )}
            </Box>
            
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'rgba(0, 0, 0, 0.72)', 
                p: 2, 
                backgroundColor: 'rgba(0, 0, 0, 0.08)', 
                borderRadius: '8px',
                lineHeight: 1.5,
                fontFamily: 'Outfit'
              }}
            >
              Travel Tip: Hua Hin is a ~3 hour drive from Bangkok, and our celebrations start at 12pm on January 4th. We recommend arriving in Bangkok by at least January 3rd so you can travel to Hua Hin early on the 4th morning!
            </Typography>
          </Stack>
        );

      case 6: // Fun & Messages
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
                      fontFamily: 'Outfit',
                      lineHeight: 1.5,
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
                      color: formData.songRequest ? '#000' : '#C2C2C2',
                      backgroundColor: 'transparent',
                    }}
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
                      fontFamily: 'Outfit',
                      lineHeight: 1.5,
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
                      color: formData.specialMessage ? '#000' : '#C2C2C2',
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