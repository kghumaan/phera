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
import { submitRSVP } from '@/lib/supabase/rsvp-service';
import { RSVPFormData as SupabaseRSVPFormData } from '@/lib/supabase/types';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import Confetti from 'react-confetti';

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
  foodPreference: string;
  dietaryRestrictions: string;
  
  // Cultural & Personal (modified)
  weddingSide: 'bride' | 'groom' | 'both' | '' | undefined;
  
  // Fun & Engagement (participation removed)
  songRequest: string;
  specialMessage: string;
  maybeComment: string;
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
  foodPreference: '',
  dietaryRestrictions: '',
  weddingSide: '',
  songRequest: '',
  specialMessage: '',
  maybeComment: '',
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
  const { refreshAuth, checkRSVPStatus } = useAuth();
  const [formData, setFormData] = useState<RSVPFormData>(initialFormData);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);

  const steps = [
    'Basic Information',
    'Attendance Details',
    'Event Preferences',
    'Personal Details',
    'Fun & Messages',
  ];

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
        break;
      
      case 1: // Attendance Details
        if (!formData.attending) newErrors.attending = 'Please select attendance';
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
      
      case 2: // Event Preferences
        if (formData.attending === 'yes' && !formData.foodPreference) {
          newErrors.foodPreference = 'Please select food preference';
        }
        break;

      case 3: // Personal Details
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
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;
    
    setIsSubmitting(true);
    
    try {
      // Convert form data to Supabase format
      const supabaseFormData: SupabaseRSVPFormData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone ? `${formData.countryCode}${formData.phone}` : '',
        attending: formData.attending === 'yes',
        plusOne: formData.plusOne === 'yes',
        plusOneName: formData.plusOneName,
        plusOneEmail: formData.plusOneEmail,
        guestCount: formData.guestCount,
        ceremonyAttending: [], // No longer used
        foodPreference: formData.foodPreference,
        dietaryRestrictions: formData.dietaryRestrictions,
        relationshipToBride: formData.weddingSide === 'bride' ? 'Guest' : undefined,
        relationshipToGroom: formData.weddingSide === 'groom' ? 'Guest' : undefined,
        weddingSide: formData.weddingSide === '' ? undefined : formData.weddingSide,
        traditionalWear: undefined, // Removed
        needsAccommodation: false, // Removed
        accommodationNights: 0,
        transportationNeeded: false, // Removed
        songRequest: formData.songRequest,
        specialMessage: formData.attending === 'maybe' 
          ? `Maybe attending. Notes: ${formData.maybeComment}${formData.specialMessage ? ` | Special message: ${formData.specialMessage}` : ''}`
          : formData.specialMessage,
        participation: [], // Removed
      };

      const result = await submitRSVP(supabaseFormData, 'sim-kv');
      
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
    return (
      <>
        <Confetti
          width={typeof window !== 'undefined' ? window.innerWidth : 1200}
          height={typeof window !== 'undefined' ? window.innerHeight : 800}
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
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 9999,
            p: 2,
          }}
        >
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <Paper
              elevation={8}
              sx={{
                p: 6,
                borderRadius: 1,
                textAlign: 'center',
                backgroundColor: 'white',
                boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                border: '2px solid #f0f0f0',
                maxWidth: 500,
                width: '100%',
              }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <CheckCircleOutlined
                  sx={{
                    fontSize: 80,
                    color: 'success.main',
                    mb: 3,
                  }}
                />
              </motion.div>
              
              <Typography variant="h3" gutterBottom sx={{ fontFamily: 'var(--font-instrument-serif)', color: '#000' }}>
                Thank You! 🙏
              </Typography>
              
              <Typography variant="h6" gutterBottom sx={{ color: '#000', mb: 3, fontWeight: 500 }}>
                Your RSVP has been submitted successfully
              </Typography>
              
              <Typography variant="body1" sx={{ color: '#000', mb: 4 }}>
                {formData.attending === 'yes' 
                  ? "We're excited to celebrate this special occasion with you!"
                  : "We're sorry to hear you may not join us. Remember, you can return here to update your RSVP until March 15th, 2025."
                }
              </Typography>
              
                              {/* <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Chip
                    icon={<FavoriteOutlined />}
                    label="Namaste"
                    variant="outlined"
                    sx={{ borderColor: 'primary.main', color: 'primary.main' }}
                  />
                </Box> */}
                
                <Button
                  onClick={() => router.push('/')}
                  variant="contained"
                  size="large"
                  fullWidth
                  sx={{
                    backgroundColor: '#DE3F5E',
                    color: 'white',
                    py: 2,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    borderRadius: '32px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    boxShadow: '0 4px 16px rgba(222, 63, 94, 0.3)',
                    mt: 4,
                    '&:hover': {
                      backgroundColor: '#C8365A',
                      boxShadow: '0 6px 20px rgba(222, 63, 94, 0.4)',
                    },
                  }}
                >
                  Done
                </Button>
              </Paper>
            </motion.div>
          </Box>
      </>
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0: // Basic Information
        return (
          <Stack spacing={3}>
            <Typography variant="h5" sx={{ fontFamily: 'var(--font-playfair)', color: '#800020', mb: 2 }}>
              Let's get to know you! 👋
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, flexDirection: isMobile ? 'column' : 'row' }}>
              <TextField
                fullWidth
                label="First Name"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                error={!!errors.firstName}
                helperText={errors.firstName}
                sx={{ flex: 1 }}
              />
              <TextField
                fullWidth
                label="Last Name"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                error={!!errors.lastName}
                helperText={errors.lastName}
                sx={{ flex: 1 }}
              />
            </Box>
            
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              error={!!errors.email}
              helperText={errors.email}
            />
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <FormControl sx={{ minWidth: 120 }}>
                <Select
                  value={formData.countryCode}
                  onChange={(e) => handleInputChange('countryCode', e.target.value)}
                  displayEmpty
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    '& .MuiSelect-select': {
                      padding: '16.5px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    },
                  }}
                >
                  {countryCodes.map((country) => (
                    <MenuItem key={country.code} value={country.code}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span>{country.flag}</span>
                        <span>{country.code}</span>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Phone Number"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                helperText="Optional - for important updates"
                sx={{ flex: 1 }}
              />
            </Box>
            
            <Alert severity="info" sx={{ borderRadius: 1, mt: 2, backgroundColor: '#f0f0f0' }}>
              <Typography variant="body2">
                <strong>Note:</strong> Your email and phone are needed for hotel booking confirmations and will help you access your details in the future with your 4-digit PIN.
              </Typography>
            </Alert>
          </Stack>
        );

      case 1: // Attendance Details
        return (
          <Stack spacing={3}>
            <Typography variant="h5" sx={{ fontFamily: 'var(--font-instrument-serif)', color: 'primary.main', mb: 2 }}>
              Will you be joining us? 💫
            </Typography>
            
            <FormControl error={!!errors.attending}>
              <FormLabel>Can you attend our wedding celebrations?</FormLabel>
              <RadioGroup
                value={formData.attending}
                onChange={(e) => handleInputChange('attending', e.target.value)}
              >
                <FormControlLabel value="yes" control={<Radio />} label="Yes, I'll be there! 🎉" />
                <FormControlLabel value="no" control={<Radio />} label="Sorry, I can't make it 😔" />
                <FormControlLabel value="maybe" control={<Radio />} label="Maybe... not sure yet 🤔" />
              </RadioGroup>
              {errors.attending && (
                <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                  {errors.attending}
                </Typography>
              )}
            </FormControl>
            
            <Collapse in={formData.attending === 'yes'}>
              <Stack spacing={3}>
                <FormControl>
                  <FormLabel>Will you be bringing a plus one?</FormLabel>
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
                    <FormControlLabel value="yes" control={<Radio />} label="Yes, bringing someone special" />
                    <FormControlLabel value="no" control={<Radio />} label="Just me!" />
                  </RadioGroup>
                </FormControl>
                
                <Collapse in={formData.plusOne === 'yes'}>
                  <Stack spacing={2}>
                    <TextField
                      fullWidth
                      label="Plus One Name"
                      value={formData.plusOneName}
                      onChange={(e) => handleInputChange('plusOneName', e.target.value)}
                      error={!!errors.plusOneName}
                      helperText={errors.plusOneName}
                    />
                    <TextField
                      fullWidth
                      label="Plus One Email"
                      type="email"
                      value={formData.plusOneEmail}
                      onChange={(e) => handleInputChange('plusOneEmail', e.target.value)}
                      error={!!errors.plusOneEmail}
                      helperText={errors.plusOneEmail}
                    />
                  </Stack>
                </Collapse>
                
                {formData.plusOne === 'yes' && (
                  <Box>
                    <FormLabel sx={{ mb: 2, display: 'block' }}>Total Number of Guests</FormLabel>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 2,
                      border: '1px solid #000',
                      borderRadius: 1,
                      p: 1,
                      maxWidth: 200,
                      '&:focus-within': {
                        borderColor: '#DAA520',
                        boxShadow: '0 0 0 1px #DAA520',
                      }
                    }}>
                      <IconButton
                        onClick={() => handleGuestCountChange(false)}
                        disabled={formData.guestCount <= 1}
                        size="small"
                        sx={{ color: '#000' }}
                      >
                        <RemoveIcon />
                      </IconButton>
                      <Typography variant="h6" sx={{ minWidth: 20, textAlign: 'center', color: '#000' }}>
                        {formData.guestCount}
                      </Typography>
                      <IconButton
                        onClick={() => handleGuestCountChange(true)}
                        disabled={formData.guestCount >= 10}
                        size="small"
                        sx={{ color: '#000' }}
                      >
                        <AddIcon />
                      </IconButton>
                    </Box>
                    <Typography variant="caption" sx={{ color: '#666', mt: 1, display: 'block' }}>
                      Including yourself and plus one
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Collapse>
            
            <Collapse in={formData.attending === 'maybe'}>
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  label="Please tell us more"
                  multiline
                  rows={3}
                  value={formData.maybeComment}
                  onChange={(e) => handleInputChange('maybeComment', e.target.value)}
                  helperText="Let us know what might help you decide or any concerns you have"
                />
              </Stack>
            </Collapse>
            
            <Collapse in={formData.attending === 'no'}>
              <Alert severity="info" sx={{ borderRadius: 1 }}>
                We'll miss you! We hope to celebrate with you in the future. 💕
              </Alert>
            </Collapse>
          </Stack>
        );

      case 2: // Event Preferences
        return (
          <Stack spacing={3}>
            <Typography variant="h5" sx={{ fontFamily: 'var(--font-instrument-serif)', color: 'primary.main', mb: 2 }}>
              Food Preferences 🍽️
            </Typography>
            
            <FormControl fullWidth error={!!errors.foodPreference}>
              <FormLabel>Food Preference</FormLabel>
              <Select
                value={formData.foodPreference}
                onChange={(e) => handleInputChange('foodPreference', e.target.value)}
                displayEmpty
              >
                <MenuItem value="">Select your preference</MenuItem>
                {foodPreferences.map((preference) => (
                  <MenuItem key={preference} value={preference}>
                    {preference}
                  </MenuItem>
                ))}
              </Select>
              {errors.foodPreference && (
                <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                  {errors.foodPreference}
                </Typography>
              )}
            </FormControl>
            
            <TextField
              fullWidth
              label="Any allergies or dietary restrictions?"
              multiline
              rows={3}
              value={formData.dietaryRestrictions}
              onChange={(e) => handleInputChange('dietaryRestrictions', e.target.value)}
              helperText="Please let us know about any allergies or special dietary needs"
            />
          </Stack>
        );

      case 3: // Personal Details
        return (
          <Stack spacing={3}>
            <Typography variant="h5" sx={{ fontFamily: 'var(--font-instrument-serif)', color: 'primary.main', mb: 2 }}>
              Personal Details 🌸
            </Typography>
            
            <FormControl fullWidth error={!!errors.weddingSide}>
              <FormLabel>Which side of the wedding are you on?</FormLabel>
              <Select
                value={formData.weddingSide}
                onChange={(e) => handleInputChange('weddingSide', e.target.value as 'bride' | 'groom' | 'both' | '')}
                displayEmpty
              >
                <MenuItem value="">Select side</MenuItem>
                {weddingSideOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
              {errors.weddingSide && (
                <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                  {errors.weddingSide}
                </Typography>
              )}
            </FormControl>
          </Stack>
        );

      case 4: // Fun & Messages
        return (
          <Stack spacing={3}>
            <Typography variant="h5" sx={{ fontFamily: 'var(--font-instrument-serif)', color: 'primary.main', mb: 2 }}>
              Fun & Messages 🎵
            </Typography>
            
            <TextField
              fullWidth
              label="Song Request"
              value={formData.songRequest}
              onChange={(e) => handleInputChange('songRequest', e.target.value)}
              helperText="Any specific song you'd like to hear at the celebration?"
            />
            
            <TextField
              fullWidth
              label="Special Message for the Couple"
              multiline
              rows={4}
              value={formData.specialMessage}
              onChange={(e) => handleInputChange('specialMessage', e.target.value)}
              helperText="Share your wishes, memories, or any special message"
              InputProps={{
                startAdornment: <FavoriteOutlined sx={{ color: 'action.active', mr: 1, alignSelf: 'flex-start', mt: 1 }} />,
              }}
            />
          </Stack>
        );

      default:
        return null;
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Progress Bar */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontFamily: 'var(--font-playfair)', color: '#000000' }}>
              RSVP Form
            </Typography>
            <IconButton
              onClick={handleClose}
              sx={{
                color: '#000',
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                border: '1px solid #000',
                borderRadius: 1,
                '&:hover': {
                  backgroundColor: 'rgba(240, 240, 240, 0.9)',
                },
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
          
          <Box
            sx={{
              height: 4,
              bgcolor: 'grey.200',
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                height: '100%',
                bgcolor: 'primary.main',
                borderRadius: 2,
                transition: 'width 0.3s ease',
                width: `${((currentStep + 1) / steps.length) * 100}%`,
              }}
            />
          </Box>
          
          <Typography variant="body2" sx={{ color: '#666666', mt: 1 }}>
            {steps[currentStep]}
          </Typography>
        </Box>

        {/* Form Content */}
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 1,
            border: '1px solid #000',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            color: '#000000',
            '& .MuiTypography-root': {
              color: '#000000 !important',
            },
            '& .MuiFormLabel-root': {
              color: '#333333 !important',
              fontWeight: 600,
            },
            '& .MuiTextField-root .MuiInputLabel-root': {
              color: '#666666 !important',
            },
            '& .MuiTextField-root .MuiOutlinedInput-root': {
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              color: '#000000 !important',
              '& fieldset': {
                borderColor: '#000 !important',
              },
              '&:hover fieldset': {
                borderColor: '#000 !important',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#DAA520 !important',
                borderWidth: '2px !important',
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
              '& fieldset': {
                borderColor: '#000 !important',
              },
              '&:hover fieldset': {
                borderColor: '#000 !important',
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

          {/* Navigation Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, pt: 3 }}>
            <Button
              onClick={handleBack}
              disabled={currentStep === 0}
              variant="outlined"
              sx={{ minWidth: 100 }}
            >
              Back
            </Button>
            
            {currentStep < steps.length - 1 ? (
              <Button
                onClick={formData.attending === 'no' ? handleSubmit : handleNext}
                variant="contained"
                sx={{ minWidth: 100 }}
                disabled={formData.attending === 'no' && currentStep > 1}
              >
                {formData.attending === 'no' ? 'Submit :(' : 'Next'}
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                variant="contained"
                sx={{ minWidth: 100 }}
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
      </motion.div>
    </Container>
  );
} 