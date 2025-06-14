'use client';

import { useState } from 'react';
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
  SelectChangeEvent,
  Stack,
  TextField,
  Typography,
  useTheme,
  useMediaQuery,
  Chip,
  Alert,
  Collapse,
  Divider,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FavoriteOutlined,
  RestaurantOutlined,
  LocationOnOutlined,
  MusicNoteOutlined,
  FlightOutlined,
  HotelOutlined,
  CheckCircleOutlined,
} from '@mui/icons-material';
import { submitRSVP } from '@/lib/supabase/rsvp-service';
import { RSVPFormData as SupabaseRSVPFormData } from '@/lib/supabase/types';
import Confetti from 'react-confetti';

interface RSVPFormData {
  // Basic Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  
  // Attendance
  attending: 'yes' | 'no' | '';
  plusOne: 'yes' | 'no' | '';
  plusOneName: string;
  guestCount: number;
  
  // Event-specific
  ceremonyAttending: string[];
  foodPreference: string;
  dietaryRestrictions: string;
  
  // Cultural & Personal
  relationshipToBride: string;
  relationshipToGroom: string;
  traditionalWear: 'yes' | 'no' | '';
  
  // Logistics
  needsAccommodation: 'yes' | 'no' | '';
  accommodationNights: number;
  transportationNeeded: 'yes' | 'no' | '';
  
  // Fun & Engagement
  songRequest: string;
  specialMessage: string;
  participation: string[];
}

const initialFormData: RSVPFormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  attending: '',
  plusOne: '',
  plusOneName: '',
  guestCount: 1,
  ceremonyAttending: [],
  foodPreference: '',
  dietaryRestrictions: '',
  relationshipToBride: '',
  relationshipToGroom: '',
  traditionalWear: '',
  needsAccommodation: '',
  accommodationNights: 1,
  transportationNeeded: '',
  songRequest: '',
  specialMessage: '',
  participation: [],
};

const ceremonies = [
  'Mehndi Ceremony',
  'Sangeet Night',
  'Haldi Ceremony',
  'Wedding Ceremony',
  'Reception',
];

const foodPreferences = [
  'Vegetarian',
  'Non-Vegetarian',
  'Vegan',
  'Jain Food',
  'No Preference',
];

const relationships = [
  'Family',
  'Close Friend',
  'Colleague',
  'Neighbor',
  'Classmate',
  'Other',
];

const participationOptions = [
  'Dance Performance',
  'Photography/Videography',
  'Decoration Help',
  'Music/DJ',
  'Ceremony Assistance',
  'Not Interested',
];

export default function CustomRSVPForm() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [formData, setFormData] = useState<RSVPFormData>(initialFormData);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const steps = [
    'Basic Information',
    'Attendance Details',
    'Event Preferences',
    'Cultural & Personal',
    'Logistics',
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

  const handleMultiSelectChange = (field: keyof RSVPFormData, value: string) => {
    const currentValues = formData[field] as string[];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(item => item !== value)
      : [...currentValues, value];
    
    handleInputChange(field, newValues);
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
        if (formData.attending === 'yes' && formData.plusOne === 'yes' && !formData.plusOneName.trim()) {
          newErrors.plusOneName = 'Plus one name is required';
        }
        break;
      
      case 2: // Event Preferences
        if (formData.attending === 'yes' && formData.ceremonyAttending.length === 0) {
          newErrors.ceremonyAttending = 'Please select at least one ceremony';
        }
        if (formData.attending === 'yes' && !formData.foodPreference) {
          newErrors.foodPreference = 'Please select food preference';
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
        phone: formData.phone,
        attending: formData.attending === 'yes',
        plusOne: formData.plusOne === 'yes',
        plusOneName: formData.plusOneName,
        guestCount: formData.guestCount,
        ceremonyAttending: formData.ceremonyAttending,
        foodPreference: formData.foodPreference,
        dietaryRestrictions: formData.dietaryRestrictions,
        relationshipToBride: formData.relationshipToBride,
        relationshipToGroom: formData.relationshipToGroom,
        traditionalWear: formData.traditionalWear === 'yes',
        needsAccommodation: formData.needsAccommodation === 'yes',
        accommodationNights: formData.accommodationNights,
        transportationNeeded: formData.transportationNeeded === 'yes',
        songRequest: formData.songRequest,
        specialMessage: formData.specialMessage,
        participation: formData.participation,
      };

      const result = await submitRSVP(supabaseFormData, 'sim-kv');
      
      if (result.success) {
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
        <Container maxWidth="md" sx={{ py: 4 }}>
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <Paper
              elevation={8}
              sx={{
                p: 6,
                borderRadius: 4,
                textAlign: 'center',
                backgroundColor: 'white',
                boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                border: '2px solid #f0f0f0',
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
              
              <Typography variant="h3" gutterBottom sx={{ fontFamily: 'var(--font-instrument-serif)', color: 'primary.main' }}>
                Thank You! 🙏
              </Typography>
              
              <Typography variant="h6" gutterBottom sx={{ color: 'text.primary', mb: 3, fontWeight: 500 }}>
                Your RSVP has been submitted successfully
              </Typography>
              
              <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4 }}>
                We're excited to celebrate this special occasion with you! You'll receive a confirmation email shortly with all the details.
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Chip
                  icon={<FavoriteOutlined />}
                  label="Namaste"
                  variant="outlined"
                  sx={{ borderColor: 'primary.main', color: 'primary.main' }}
                />
                <Chip
                  icon={<LocationOnOutlined />}
                  label="See you in Thailand!"
                  variant="outlined"
                  sx={{ borderColor: 'secondary.main', color: 'secondary.main' }}
                />
              </Box>
            </Paper>
          </motion.div>
        </Container>
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
            
            <TextField
              fullWidth
              label="Phone Number"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              helperText="Optional - for important updates"
            />
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
                    onChange={(e) => handleInputChange('plusOne', e.target.value)}
                  >
                    <FormControlLabel value="yes" control={<Radio />} label="Yes, bringing someone special" />
                    <FormControlLabel value="no" control={<Radio />} label="Just me!" />
                  </RadioGroup>
                </FormControl>
                
                <Collapse in={formData.plusOne === 'yes'}>
                  <TextField
                    fullWidth
                    label="Plus One Name"
                    value={formData.plusOneName}
                    onChange={(e) => handleInputChange('plusOneName', e.target.value)}
                    error={!!errors.plusOneName}
                    helperText={errors.plusOneName}
                  />
                </Collapse>
                
                <TextField
                  type="number"
                  label="Total Number of Guests"
                  value={formData.guestCount}
                  onChange={(e) => handleInputChange('guestCount', parseInt(e.target.value) || 1)}
                  inputProps={{ min: 1, max: 10 }}
                  helperText="Including yourself and plus one"
                />
              </Stack>
            </Collapse>
            
            <Collapse in={formData.attending === 'no'}>
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                We'll miss you! We hope to celebrate with you in the future. 💕
              </Alert>
            </Collapse>
          </Stack>
        );

      case 2: // Event Preferences
        return (
          <Stack spacing={3}>
            <Typography variant="h5" sx={{ fontFamily: 'var(--font-instrument-serif)', color: 'primary.main', mb: 2 }}>
              Event Preferences 🎊
            </Typography>
            
            <FormControl error={!!errors.ceremonyAttending}>
              <FormLabel>Which ceremonies will you attend?</FormLabel>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                {ceremonies.map((ceremony) => (
                  <Chip
                    key={ceremony}
                    label={ceremony}
                    clickable
                    color={formData.ceremonyAttending.includes(ceremony) ? 'primary' : 'default'}
                    onClick={() => handleMultiSelectChange('ceremonyAttending', ceremony)}
                    variant={formData.ceremonyAttending.includes(ceremony) ? 'filled' : 'outlined'}
                  />
                ))}
              </Box>
              {errors.ceremonyAttending && (
                <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                  {errors.ceremonyAttending}
                </Typography>
              )}
            </FormControl>
            
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
              label="Dietary Restrictions or Allergies"
              multiline
              rows={2}
              value={formData.dietaryRestrictions}
              onChange={(e) => handleInputChange('dietaryRestrictions', e.target.value)}
              helperText="Please let us know about any allergies or special dietary needs"
            />
          </Stack>
        );

      case 3: // Cultural & Personal
        return (
          <Stack spacing={3}>
            <Typography variant="h5" sx={{ fontFamily: 'var(--font-instrument-serif)', color: 'primary.main', mb: 2 }}>
              Personal Details 🌸
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, flexDirection: isMobile ? 'column' : 'row' }}>
              <FormControl fullWidth>
                <FormLabel>Relationship to Bride</FormLabel>
                <Select
                  value={formData.relationshipToBride}
                  onChange={(e) => handleInputChange('relationshipToBride', e.target.value)}
                  displayEmpty
                >
                  <MenuItem value="">Select relationship</MenuItem>
                  {relationships.map((relationship) => (
                    <MenuItem key={relationship} value={relationship}>
                      {relationship}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth>
                <FormLabel>Relationship to Groom</FormLabel>
                <Select
                  value={formData.relationshipToGroom}
                  onChange={(e) => handleInputChange('relationshipToGroom', e.target.value)}
                  displayEmpty
                >
                  <MenuItem value="">Select relationship</MenuItem>
                  {relationships.map((relationship) => (
                    <MenuItem key={relationship} value={relationship}>
                      {relationship}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            
            <FormControl>
              <FormLabel>Will you be wearing traditional Indian attire?</FormLabel>
              <RadioGroup
                value={formData.traditionalWear}
                onChange={(e) => handleInputChange('traditionalWear', e.target.value)}
              >
                <FormControlLabel value="yes" control={<Radio />} label="Yes, I love traditional wear! 🥻" />
                <FormControlLabel value="no" control={<Radio />} label="No, I'll wear western attire" />
              </RadioGroup>
            </FormControl>
          </Stack>
        );

      case 4: // Logistics
        return (
          <Stack spacing={3}>
            <Typography variant="h5" sx={{ fontFamily: 'var(--font-instrument-serif)', color: 'primary.main', mb: 2 }}>
              Travel & Logistics ✈️
            </Typography>
            
            <FormControl>
              <FormLabel>Do you need accommodation assistance?</FormLabel>
              <RadioGroup
                value={formData.needsAccommodation}
                onChange={(e) => handleInputChange('needsAccommodation', e.target.value)}
              >
                <FormControlLabel 
                  value="yes" 
                  control={<Radio />} 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <HotelOutlined fontSize="small" />
                      Yes, I need help with accommodation
                    </Box>
                  } 
                />
                <FormControlLabel value="no" control={<Radio />} label="No, I have my own arrangements" />
              </RadioGroup>
            </FormControl>
            
            <Collapse in={formData.needsAccommodation === 'yes'}>
              <TextField
                type="number"
                label="Number of Nights"
                value={formData.accommodationNights}
                onChange={(e) => handleInputChange('accommodationNights', parseInt(e.target.value) || 1)}
                inputProps={{ min: 1, max: 10 }}
                helperText="How many nights will you be staying?"
              />
            </Collapse>
            
            <FormControl>
              <FormLabel>Do you need transportation from airport/hotel?</FormLabel>
              <RadioGroup
                value={formData.transportationNeeded}
                onChange={(e) => handleInputChange('transportationNeeded', e.target.value)}
              >
                <FormControlLabel 
                  value="yes" 
                  control={<Radio />} 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FlightOutlined fontSize="small" />
                      Yes, I need transportation
                    </Box>
                  } 
                />
                <FormControlLabel value="no" control={<Radio />} label="No, I have my own transport" />
              </RadioGroup>
            </FormControl>
          </Stack>
        );

      case 5: // Fun & Messages
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
              InputProps={{
                startAdornment: <MusicNoteOutlined sx={{ color: 'action.active', mr: 1 }} />,
              }}
            />
            
            <FormControl>
              <FormLabel>Would you like to participate in any activities?</FormLabel>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                {participationOptions.map((option) => (
                  <Chip
                    key={option}
                    label={option}
                    clickable
                    color={formData.participation.includes(option) ? 'secondary' : 'default'}
                    onClick={() => handleMultiSelectChange('participation', option)}
                    variant={formData.participation.includes(option) ? 'filled' : 'outlined'}
                  />
                ))}
              </Box>
            </FormControl>
            
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
            <Typography variant="body2" sx={{ color: '#666666' }}>
              Step {currentStep + 1} of {steps.length}
            </Typography>
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
            borderRadius: 4,
            border: '1px solid',
            borderColor: 'divider',
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
            },
            '& .MuiTextField-root .MuiOutlinedInput-input': {
              color: '#000000 !important',
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
                onClick={handleNext}
                variant="contained"
                sx={{ minWidth: 100 }}
                disabled={formData.attending === 'no' && currentStep > 1}
              >
                Next
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
      </motion.div>
    </Container>
  );
} 