'use client';

import { useState, useEffect, useCallback, forwardRef } from 'react';
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
import { motion, AnimatePresence } from 'framer-motion';
import {
  FavoriteOutlined,
  CheckCircleOutlined,
  Add as AddIcon,
  Remove as RemoveIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { submitRSVP, getExistingRSVP, getCustomQuestions } from '@/lib/supabase/rsvp-service';
import { RSVPFormData as SupabaseRSVPFormData } from '@/lib/supabase/types';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import Confetti from 'react-confetti';
import GifPicker from '@/components/ui/GifPicker';
import { GifData, RSVPFormData, RSVPCustomQuestionStep } from '@/lib/supabase/types';
import FullScreenFormContainer from '@/components/shared/FullScreenFormContainer';
import { WEDDING_CONFIG } from '@/lib/constants/wedding-config';
import { useWedding } from '@/lib/contexts/WeddingContext';
import { guestTextFieldSx } from '@/lib/constants/form-styles';
import { ActionButton } from '@/components/admin/ActionButton';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';


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
  custom_answers: {},
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

// E.164 max is 15 digits total (including country code). Longest national number is ~12 digits.
const PHONE_MAX_LENGTH = 15;

// Custom date input for react-datepicker styled to match guest form fields
const GuestDateInput = forwardRef<HTMLInputElement, { value?: string; onClick?: () => void; label?: string; error?: boolean; helperText?: string; themeColor?: string }>(
  ({ value, onClick, label, error, helperText, themeColor = '#DE3F5E' }, ref) => (
    <TextField
      ref={ref as any}
      value={value}
      onClick={onClick}
      label={label}
      error={error}
      helperText={helperText}
      fullWidth
      InputProps={{ readOnly: true }}
      sx={{
        ...guestTextFieldSx(themeColor),
        '& .MuiOutlinedInput-root': {
          ...guestTextFieldSx(themeColor)['& .MuiOutlinedInput-root'],
          cursor: 'pointer',
          '& input': {
            cursor: 'pointer',
            color: value ? '#000' : '#888',
          },
        },
      }}
    />
  )
);
GuestDateInput.displayName = 'GuestDateInput';

const countryCodes = [
  // North America & Caribbean
  { code: '+1', country: 'US/CA', flag: '🇺🇸' },
  { code: '+1242', country: 'Bahamas', flag: '🇧🇸' },
  { code: '+1246', country: 'Barbados', flag: '🇧🇧' },
  { code: '+1264', country: 'Anguilla', flag: '🇦🇮' },
  { code: '+1268', country: 'Antigua', flag: '🇦🇬' },
  { code: '+1284', country: 'British VI', flag: '🇻🇬' },
  { code: '+1340', country: 'US VI', flag: '🇻🇮' },
  { code: '+1345', country: 'Cayman Is.', flag: '🇰🇾' },
  { code: '+1441', country: 'Bermuda', flag: '🇧🇲' },
  { code: '+1473', country: 'Grenada', flag: '🇬🇩' },
  { code: '+1649', country: 'Turks & Caicos', flag: '🇹🇨' },
  { code: '+1664', country: 'Montserrat', flag: '🇲🇸' },
  { code: '+1670', country: 'N. Mariana Is.', flag: '🇲🇵' },
  { code: '+1671', country: 'Guam', flag: '🇬🇺' },
  { code: '+1684', country: 'American Samoa', flag: '🇦🇸' },
  { code: '+1721', country: 'Sint Maarten', flag: '🇸🇽' },
  { code: '+1758', country: 'St. Lucia', flag: '🇱🇨' },
  { code: '+1767', country: 'Dominica', flag: '🇩🇲' },
  { code: '+1784', country: 'St. Vincent', flag: '🇻🇨' },
  { code: '+1787', country: 'Puerto Rico', flag: '🇵🇷' },
  { code: '+1809', country: 'Dominican Rep.', flag: '🇩🇴' },
  { code: '+1868', country: 'Trinidad', flag: '🇹🇹' },
  { code: '+1869', country: 'St. Kitts', flag: '🇰🇳' },
  { code: '+1876', country: 'Jamaica', flag: '🇯🇲' },
  { code: '+52', country: 'Mexico', flag: '🇲🇽' },
  // Central America
  { code: '+501', country: 'Belize', flag: '🇧🇿' },
  { code: '+502', country: 'Guatemala', flag: '🇬🇹' },
  { code: '+503', country: 'El Salvador', flag: '🇸🇻' },
  { code: '+504', country: 'Honduras', flag: '🇭🇳' },
  { code: '+505', country: 'Nicaragua', flag: '🇳🇮' },
  { code: '+506', country: 'Costa Rica', flag: '🇨🇷' },
  { code: '+507', country: 'Panama', flag: '🇵🇦' },
  // South America
  { code: '+54', country: 'Argentina', flag: '🇦🇷' },
  { code: '+55', country: 'Brazil', flag: '🇧🇷' },
  { code: '+56', country: 'Chile', flag: '🇨🇱' },
  { code: '+57', country: 'Colombia', flag: '🇨🇴' },
  { code: '+58', country: 'Venezuela', flag: '🇻🇪' },
  { code: '+591', country: 'Bolivia', flag: '🇧🇴' },
  { code: '+592', country: 'Guyana', flag: '🇬🇾' },
  { code: '+593', country: 'Ecuador', flag: '🇪🇨' },
  { code: '+594', country: 'French Guiana', flag: '🇬🇫' },
  { code: '+595', country: 'Paraguay', flag: '🇵🇾' },
  { code: '+597', country: 'Suriname', flag: '🇸🇷' },
  { code: '+598', country: 'Uruguay', flag: '🇺🇾' },
  { code: '+51', country: 'Peru', flag: '🇵🇪' },
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
  { code: '+420', country: 'Czech Rep.', flag: '🇨🇿' },
  { code: '+36', country: 'Hungary', flag: '🇭🇺' },
  { code: '+7', country: 'Russia', flag: '🇷🇺' },
  { code: '+40', country: 'Romania', flag: '🇷🇴' },
  { code: '+380', country: 'Ukraine', flag: '🇺🇦' },
  { code: '+370', country: 'Lithuania', flag: '🇱🇹' },
  { code: '+371', country: 'Latvia', flag: '🇱🇻' },
  { code: '+372', country: 'Estonia', flag: '🇪🇪' },
  { code: '+385', country: 'Croatia', flag: '🇭🇷' },
  { code: '+386', country: 'Slovenia', flag: '🇸🇮' },
  { code: '+381', country: 'Serbia', flag: '🇷🇸' },
  { code: '+387', country: 'Bosnia', flag: '🇧🇦' },
  { code: '+389', country: 'N. Macedonia', flag: '🇲🇰' },
  { code: '+355', country: 'Albania', flag: '🇦🇱' },
  { code: '+359', country: 'Bulgaria', flag: '🇧🇬' },
  { code: '+356', country: 'Malta', flag: '🇲🇹' },
  { code: '+357', country: 'Cyprus', flag: '🇨🇾' },
  { code: '+354', country: 'Iceland', flag: '🇮🇸' },
  { code: '+352', country: 'Luxembourg', flag: '🇱🇺' },
  { code: '+373', country: 'Moldova', flag: '🇲🇩' },
  { code: '+374', country: 'Armenia', flag: '🇦🇲' },
  { code: '+375', country: 'Belarus', flag: '🇧🇾' },
  { code: '+376', country: 'Andorra', flag: '🇦🇩' },
  { code: '+377', country: 'Monaco', flag: '🇲🇨' },
  { code: '+378', country: 'San Marino', flag: '🇸🇲' },
  { code: '+382', country: 'Montenegro', flag: '🇲🇪' },
  { code: '+383', country: 'Kosovo', flag: '🇽🇰' },
  { code: '+995', country: 'Georgia', flag: '🇬🇪' },
  // Asia Pacific
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+92', country: 'Pakistan', flag: '🇵🇰' },
  { code: '+93', country: 'Afghanistan', flag: '🇦🇫' },
  { code: '+94', country: 'Sri Lanka', flag: '🇱🇰' },
  { code: '+95', country: 'Myanmar', flag: '🇲🇲' },
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
  { code: '+853', country: 'Macau', flag: '🇲🇴' },
  { code: '+886', country: 'Taiwan', flag: '🇹🇼' },
  { code: '+880', country: 'Bangladesh', flag: '🇧🇩' },
  { code: '+855', country: 'Cambodia', flag: '🇰🇭' },
  { code: '+856', country: 'Laos', flag: '🇱🇦' },
  { code: '+976', country: 'Mongolia', flag: '🇲🇳' },
  { code: '+977', country: 'Nepal', flag: '🇳🇵' },
  { code: '+975', country: 'Bhutan', flag: '🇧🇹' },
  { code: '+960', country: 'Maldives', flag: '🇲🇻' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+64', country: 'New Zealand', flag: '🇳🇿' },
  { code: '+679', country: 'Fiji', flag: '🇫🇯' },
  { code: '+675', country: 'Papua New Guinea', flag: '🇵🇬' },
  { code: '+670', country: 'Timor-Leste', flag: '🇹🇱' },
  { code: '+673', country: 'Brunei', flag: '🇧🇳' },
  // Middle East
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
  { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+972', country: 'Israel', flag: '🇮🇱' },
  { code: '+90', country: 'Turkey', flag: '🇹🇷' },
  { code: '+961', country: 'Lebanon', flag: '🇱🇧' },
  { code: '+962', country: 'Jordan', flag: '🇯🇴' },
  { code: '+963', country: 'Syria', flag: '🇸🇾' },
  { code: '+964', country: 'Iraq', flag: '🇮🇶' },
  { code: '+965', country: 'Kuwait', flag: '🇰🇼' },
  { code: '+968', country: 'Oman', flag: '🇴🇲' },
  { code: '+970', country: 'Palestine', flag: '🇵🇸' },
  { code: '+973', country: 'Bahrain', flag: '🇧🇭' },
  { code: '+974', country: 'Qatar', flag: '🇶🇦' },
  { code: '+98', country: 'Iran', flag: '🇮🇷' },
  { code: '+994', country: 'Azerbaijan', flag: '🇦🇿' },
  { code: '+996', country: 'Kyrgyzstan', flag: '🇰🇬' },
  { code: '+998', country: 'Uzbekistan', flag: '🇺🇿' },
  { code: '+993', country: 'Turkmenistan', flag: '🇹🇲' },
  { code: '+992', country: 'Tajikistan', flag: '🇹🇯' },
  // Africa
  { code: '+20', country: 'Egypt', flag: '🇪🇬' },
  { code: '+27', country: 'South Africa', flag: '🇿🇦' },
  { code: '+234', country: 'Nigeria', flag: '🇳🇬' },
  { code: '+254', country: 'Kenya', flag: '🇰🇪' },
  { code: '+255', country: 'Tanzania', flag: '🇹🇿' },
  { code: '+256', country: 'Uganda', flag: '🇺🇬' },
  { code: '+233', country: 'Ghana', flag: '🇬🇭' },
  { code: '+225', country: 'Ivory Coast', flag: '🇨🇮' },
  { code: '+237', country: 'Cameroon', flag: '🇨🇲' },
  { code: '+212', country: 'Morocco', flag: '🇲🇦' },
  { code: '+213', country: 'Algeria', flag: '🇩🇿' },
  { code: '+216', country: 'Tunisia', flag: '🇹🇳' },
  { code: '+218', country: 'Libya', flag: '🇱🇾' },
  { code: '+221', country: 'Senegal', flag: '🇸🇳' },
  { code: '+249', country: 'Sudan', flag: '🇸🇩' },
  { code: '+250', country: 'Rwanda', flag: '🇷🇼' },
  { code: '+251', country: 'Ethiopia', flag: '🇪🇹' },
  { code: '+252', country: 'Somalia', flag: '🇸🇴' },
  { code: '+253', country: 'Djibouti', flag: '🇩🇯' },
  { code: '+258', country: 'Mozambique', flag: '🇲🇿' },
  { code: '+260', country: 'Zambia', flag: '🇿🇲' },
  { code: '+261', country: 'Madagascar', flag: '🇲🇬' },
  { code: '+263', country: 'Zimbabwe', flag: '🇿🇼' },
  { code: '+265', country: 'Malawi', flag: '🇲🇼' },
  { code: '+267', country: 'Botswana', flag: '🇧🇼' },
  { code: '+268', country: 'Eswatini', flag: '🇸🇿' },
  { code: '+264', country: 'Namibia', flag: '🇳🇦' },
  { code: '+266', country: 'Lesotho', flag: '🇱🇸' },
  { code: '+269', country: 'Comoros', flag: '🇰🇲' },
  { code: '+230', country: 'Mauritius', flag: '🇲🇺' },
  { code: '+231', country: 'Liberia', flag: '🇱🇷' },
  { code: '+232', country: 'Sierra Leone', flag: '🇸🇱' },
  { code: '+235', country: 'Chad', flag: '🇹🇩' },
  { code: '+236', country: 'Central African Rep.', flag: '🇨🇫' },
  { code: '+238', country: 'Cape Verde', flag: '🇨🇻' },
  { code: '+239', country: 'São Tomé', flag: '🇸🇹' },
  { code: '+240', country: 'Equatorial Guinea', flag: '🇬🇶' },
  { code: '+241', country: 'Gabon', flag: '🇬🇦' },
  { code: '+242', country: 'Congo', flag: '🇨🇬' },
  { code: '+243', country: 'DR Congo', flag: '🇨🇩' },
  { code: '+244', country: 'Angola', flag: '🇦🇴' },
  { code: '+245', country: 'Guinea-Bissau', flag: '🇬🇼' },
  { code: '+246', country: 'Diego Garcia', flag: '🇮🇴' },
  { code: '+248', country: 'Seychelles', flag: '🇸🇨' },
  { code: '+257', country: 'Burundi', flag: '🇧🇮' },
  { code: '+262', country: 'Réunion', flag: '🇷🇪' },
  { code: '+220', country: 'Gambia', flag: '🇬🇲' },
  { code: '+222', country: 'Mauritania', flag: '🇲🇷' },
  { code: '+223', country: 'Mali', flag: '🇲🇱' },
  { code: '+224', country: 'Guinea', flag: '🇬🇳' },
  { code: '+226', country: 'Burkina Faso', flag: '🇧🇫' },
  { code: '+227', country: 'Niger', flag: '🇳🇪' },
  { code: '+228', country: 'Togo', flag: '🇹🇬' },
  { code: '+229', country: 'Benin', flag: '🇧🇯' },
];

interface CustomRSVPFormProps {
  weddingId?: string;
  primaryColor?: string;
  isPreview?: boolean;
}

export default function CustomRSVPForm({ weddingId = 'simran-karanvir', primaryColor, isPreview }: CustomRSVPFormProps) {
  const themeColor = primaryColor || '#DE3F5E';

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const router = useRouter();
  const { user, refreshAuth, checkRSVPStatus } = useAuth();
  const { wedding } = useWedding();
  const [formData, setFormData] = useState<RSVPFormData>(initialFormData);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [isLoadingExisting, setIsLoadingExisting] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);

  // Custom question steps
  const [customQuestionSteps, setCustomQuestionSteps] = useState<RSVPCustomQuestionStep[]>([]);

  // Authentication states for Account Creation step
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if plus-ones are allowed based on PIN (always true in preview so admin can see all steps)
  const allowsPlusOne = isPreview ? true : (typeof window !== 'undefined' ?
    localStorage.getItem(`phera_allows_plus_one_${weddingId}`) === 'true' : true);

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

  // Fetch custom question steps
  const fetchCustomQuestions = useCallback(async () => {
    try {
      const steps = await getCustomQuestions(weddingId);
      setCustomQuestionSteps(steps);
    } catch (err) {
      console.error('Error fetching custom questions:', err);
    }
  }, [weddingId]);

  useEffect(() => {
    fetchCustomQuestions();
  }, [fetchCustomQuestions]);

  // Listen for admin updates to custom questions
  useEffect(() => {
    const channel = new BroadcastChannel('phera-design-sync');
    channel.onmessage = (event) => {
      if (event.data?.type === 'RSVP_CUSTOM_QUESTIONS_UPDATED') {
        fetchCustomQuestions();
      }
    };
    return () => channel.close();
  }, [fetchCustomQuestions]);

  // Steps definition - includes Guest Concierge as final step for attending guests
  // Normalize legacy hidden step name
  const rawHidden = wedding?.hidden_rsvp_steps || [];
  const hiddenSteps = rawHidden.flatMap((s: string) =>
    s === 'Music Request & Comment' ? ['Music Request', 'Comment'] : [s]
  );
  const steps = (allowsPlusOne ? [
    'Basic Information',
    'Account Creation',
    'RSVP',
    'Plus One Details',
    'Dietary Restrictions',
    'Team Bride/Groom',
    'Music Request',
    'Comment',
  ] : [
    'Basic Information',
    'Account Creation',
    'RSVP',
    'Dietary Restrictions',
    'Team Bride/Groom',
    'Music Request',
    'Comment',
  ]).filter(s => !hiddenSteps.includes(s));

  // Merge fixed steps with custom question steps
  const mergedSteps: (string | RSVPCustomQuestionStep)[] = (() => {
    const result: (string | RSVPCustomQuestionStep)[] = [];
    const allFixedNames = new Set(steps);
    for (const fixedStep of steps) {
      result.push(fixedStep);
      const stepsAfterThis = customQuestionSteps
        .filter(s => s.insert_after === fixedStep)
        .sort((a, b) => a.order_index - b.order_index);
      result.push(...stepsAfterThis);
    }
    const orphans = customQuestionSteps.filter(s => !allFixedNames.has(s.insert_after));
    result.push(...orphans);
    return result;
  })();

  // Helper to get step name for display/logic
  const getStepName = (step: string | RSVPCustomQuestionStep): string => {
    return typeof step === 'string' ? step : step.step_title;
  };

  // Helper to check if current step is a custom step
  const isCustomStep = (stepIndex: number): boolean => {
    return typeof mergedSteps[stepIndex] !== 'string';
  };

  const getCustomStepData = (stepIndex: number): RSVPCustomQuestionStep | null => {
    const step = mergedSteps[stepIndex];
    return typeof step === 'string' ? null : step;
  };

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
            // Only use user.name as a name if it doesn't look like an email address
            const nameIsEmail = user.name && user.name.includes('@');
            if (user.name && !nameIsEmail) {
              const nameParts = user.name.split(' ');
              setFormData(prev => ({
                ...prev,
                firstName: nameParts[0] || '',
                lastName: nameParts.slice(1).join(' ') || '',
                email: user.email,
                phone: user.phone || '',
              }));
            } else {
              // Only pre-fill email and phone, leave name fields empty
              setFormData(prev => ({
                ...prev,
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
      const attendanceStepIndex = steps.indexOf('RSVP');

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

        // Only auto-advance if returning from OAuth redirect (saved form progress existed)
        // Otherwise, always start at step 0 so users fill in Basic Info first
        const hadSavedProgress = localStorage.getItem('phera_rsvp_oauth_returned');
        if (hadSavedProgress && currentStep <= accountStepIndex) {
          console.log('User returning from OAuth, advancing to Attendance Details step');
          localStorage.removeItem('phera_rsvp_oauth_returned');
          setCurrentStep(attendanceStepIndex);
        }
      }
    }
  }, [user]);

  // Listen for admin panel step navigation messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'NAVIGATE_TO_RSVP_STEP' && event.data.stepName) {
        // Match by name: fixed steps match by string name, custom steps match by step_title or id
        const targetName = event.data.stepName;
        const targetId = event.data.stepId;
        const idx = mergedSteps.findIndex(s => {
          if (typeof s === 'string') return s === targetName;
          return s.id === targetId || s.step_title === targetName;
        });
        if (idx !== -1) {
          setIsSubmitted(false);
          setCurrentStep(idx);
        }
      }
      // Show confirmation screen preview
      if (event.data?.type === 'SHOW_RSVP_CONFIRMATION') {
        const response = event.data.response as 'yes' | 'no' | 'maybe';
        setFormData(prev => ({ ...prev, attending: response }));
        setIsSubmitted(true);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [mergedSteps]);

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
      localStorage.setItem('phera_rsvp_oauth_returned', 'true');

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

    // Handle custom step validation
    const customStep = getCustomStepData(step);
    if (customStep) {
      customStep.questions.forEach(q => {
        if (q.required) {
          const answer = formData.custom_answers?.[q.id];
          if (!answer || (typeof answer === 'string' && !answer.trim())) {
            newErrors[`custom_${q.id}`] = `${q.label} is required`;
          }
        }
      });
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    }

    // Get the step name to determine validation
    const stepName = mergedSteps[step] as string;

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

      case 'RSVP':
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

      case 'Dietary Restrictions':
        if (formData.attending === 'yes' && formData.foodPreference.length === 0) {
          newErrors.foodPreference = 'Please select at least one food preference';
        }
        break;

      case 'Team Bride/Groom':
        if (!formData.weddingSide) {
          newErrors.weddingSide = 'Please select which side of the wedding';
        }
        break;

      case 'Music Request':
      case 'Comment':
        // Both steps are fully optional
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    const currentStepItem = mergedSteps[currentStep];
    const currentStepName = getStepName(currentStepItem);

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
      // If the user just completed Basic Info and is already authenticated,
      // skip the Account Creation step entirely
      if (currentStepName === 'Basic Information' && isAuthenticated) {
        const attendanceStepIndex = mergedSteps.findIndex(s => typeof s === 'string' && s === 'RSVP');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setCurrentStep(attendanceStepIndex);
        return;
      }

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
      if (currentStepName === 'RSVP' && allowsPlusOne && formData.attending !== 'yes') {
        // Find the index of Event Preferences and go there
        const eventPrefsIndex = mergedSteps.findIndex(s => typeof s === 'string' && s === 'Dietary Restrictions');
        setCurrentStep(eventPrefsIndex);
      } else {
        setCurrentStep(prev => Math.min(prev + 1, mergedSteps.length - 1));
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

    // In preview mode, render confirmation inside FullScreenFormContainer for consistent positioning
    if (isPreview) {
      return (
        <FullScreenFormContainer
          title="RSVP"
          onClose={() => setIsSubmitted(false)}
        >
          {/* Scrollable Content Area */}
          <Box sx={{
            flex: 1,
            overflowY: 'auto',
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            p: { xs: 2, sm: 3 },
            position: 'relative',
          }}>
            {getOverlayImage() && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  width: '100%',
                  height: 200,
                  backgroundImage: `url(${getOverlayImage()})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center top',
                  backgroundRepeat: 'no-repeat',
                  borderRadius: '4px 4px 0 0',
                  pointerEvents: 'none',
                }}
              />
            )}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, textAlign: 'center', px: 4 }}>
              <Box
                component="img"
                src="/logo-lotus-flame.svg"
                alt="Logo"
                sx={{ width: 80, height: 80, filter: 'brightness(0)' }}
              />
              {(() => {
                const msgs = (wedding as any)?.rsvp_confirmation_messages;
                const defaults: Record<string, { heading: string; body: string }> = {
                  yes: { heading: "Yay! We can't wait to celebrate with you!", body: "Check out the rest of the website for travel tips, event details, dress codes, and more." },
                  maybe: { heading: 'Thanks for letting us know!', body: "We understand you need to figure some things out. Let us know your final answer by the RSVP deadline." },
                  no: { heading: "We'll miss you!", body: "We're sad you can't make it, but we understand. Your account is still ready if anything changes!" },
                };
                const key = formData.attending as 'yes' | 'maybe' | 'no';
                if (!key || !defaults[key]) return null;
                const heading = msgs?.[key]?.heading || defaults[key].heading;
                const body = msgs?.[key]?.body || defaults[key].body;
                return (
                  <>
                    <Typography variant="h4" sx={{ color: '#000', lineHeight: 1.5, fontWeight: 400, fontSize: { xs: '1.6rem', sm: '1.9rem' } }}>
                      {heading}
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#474747', lineHeight: 1.5, fontSize: { xs: '1.1rem', sm: '1.2rem' } }}>
                      {body}
                    </Typography>
                  </>
                );
              })()}
              <Box
                component="img"
                src="/logo-lotus-flame.svg"
                alt="Logo"
                sx={{ width: 80, height: 80, filter: 'brightness(0)', transform: 'rotate(180deg)' }}
              />
            </Box>
          </Box>
        </FullScreenFormContainer>
      );
    }

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
            maxWidth: isMobile ? 'none' : { md: 550, lg: 600, xl: 650 },
            mx: isMobile ? 0 : 'auto',
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
                  flex: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  mt: 0,
                  minHeight: isMobile ? '180px' : { md: 600, lg: 650 },
                  maxHeight: isMobile ? 'calc(85svh)' : { md: '80vh', lg: '85vh' },
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
                            color: '#000',
                            lineHeight: 1.5,
                            textAlign: 'center' as const,
                            fontWeight: 400,
                            fontSize: { xs: '1.6rem', sm: '1.9rem' },
                          };

                          const bodyStyle = {
                            color: '#474747',
                            lineHeight: 1.5,
                            textAlign: 'center' as const,
                            fontSize: { xs: '1.1rem', sm: '1.2rem' },
                          };

                          const msgs = (wedding as any)?.rsvp_confirmation_messages;

                          const defaults = {
                            yes: {
                              heading: "Yay! We can't wait to celebrate with you!",
                              body: "Check out the rest of the website for travel tips, event details, dress codes, and more. We may need more information closer to the wedding — keep an eye on your email!",
                            },
                            maybe: {
                              heading: 'Thanks for letting us know!',
                              body: "We understand you need to figure some things out. Let us know your final answer by the RSVP deadline. Use your email or phone number to sign in anytime to update your response.",
                            },
                            no: {
                              heading: "We'll miss you!",
                              body: "We're sad you can't make it, but we understand. Your account is still ready if anything changes!",
                            },
                          };

                          const key = formData.attending as 'yes' | 'maybe' | 'no';
                          if (key && defaults[key]) {
                            const heading = msgs?.[key]?.heading || defaults[key].heading;
                            const body = msgs?.[key]?.body || defaults[key].body;
                            return (
                              <>
                                <Typography variant="h4" sx={headingStyle}>
                                  {heading}
                                </Typography>
                                <Typography variant="body1" sx={bodyStyle}>
                                  {body}
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
                    <ActionButton
                      onClick={async () => {
                        await checkRSVPStatus(true);
                        router.push(`/${weddingId}`);
                      }}
                      variant="contained"
                      size="large"
                      fullWidth
                      sx={{
                        backgroundColor: themeColor,
                        color: 'white',
                        py: { xs: 1.5, sm: 1.5 },
                        fontWeight: 700,
                        borderRadius: '16px',
                        textTransform: 'uppercase',
                        letterSpacing: '6.25%',
                        boxShadow: 'none',
                        '&:hover': {
                          backgroundColor: '#C8365A',
                          boxShadow: 'none',
                        },
                      }}
                    >
                      Done
                    </ActionButton>
                  </Box>
                </Box>
              </Paper>
            </motion.div>
          </Container>
        </Box>
      </>
    );
  }

  const handleCustomAnswerChange = (questionId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      custom_answers: {
        ...(prev.custom_answers || {}),
        [questionId]: value,
      },
    }));
    // Clear error for this field
    setErrors(prev => {
      const updated = { ...prev };
      delete updated[`custom_${questionId}`];
      return updated;
    });
  };

  const renderCustomStep = (step: RSVPCustomQuestionStep) => {
    return (
      <Stack spacing={2}>
        <Box sx={{ mb: 1 }}>
          <Typography
            variant="h4"
            sx={{
              color: '#000',
              fontWeight: 400,
              lineHeight: 1.3,
            }}
          >
            {step.step_title}
          </Typography>
          {step.description && (
            <Typography
              variant="body1"
              sx={{
                color: '#474747',
                lineHeight: 1.5,
                fontSize: { xs: '1.1rem', sm: '1.2rem' },
                mt: 1.5,
              }}
            >
              {step.description}
            </Typography>
          )}
        </Box>

        {step.questions.map(q => {
          const value = formData.custom_answers?.[q.id] || '';
          const errorKey = `custom_${q.id}`;
          const hasError = !!errors[errorKey];

          return (
            <Box key={q.id}>
              {q.type === 'short_text' && (
                <TextField
                  label={q.label + (q.required ? ' *' : '')}
                  value={value}
                  onChange={e => handleCustomAnswerChange(q.id, e.target.value)}
                  error={hasError}
                  helperText={hasError ? errors[errorKey] : undefined}
                  fullWidth
                  sx={guestTextFieldSx(themeColor)}
                />
              )}
              {q.type === 'long_text' && (
                <TextField
                  label={q.label + (q.required ? ' *' : '')}
                  value={value}
                  onChange={e => handleCustomAnswerChange(q.id, e.target.value)}
                  error={hasError}
                  helperText={hasError ? errors[errorKey] : undefined}
                  fullWidth
                  multiline
                  minRows={3}
                  sx={guestTextFieldSx(themeColor)}
                />
              )}
              {q.type === 'numeric' && (
                <TextField
                  label={q.label + (q.required ? ' *' : '')}
                  type="number"
                  value={value}
                  onChange={e => handleCustomAnswerChange(q.id, e.target.value)}
                  error={hasError}
                  helperText={hasError ? errors[errorKey] : undefined}
                  fullWidth
                  sx={guestTextFieldSx(themeColor)}
                />
              )}
              {q.type === 'dropdown' && (
                <FormControl fullWidth error={hasError}>
                  <Select
                    value={value}
                    onChange={e => handleCustomAnswerChange(q.id, e.target.value)}
                    displayEmpty
                    sx={{
                      borderRadius: { xs: '8px', md: '10px' },
                      bgcolor: 'white',
                      color: value ? '#000' : '#999',
                      '& fieldset': { borderColor: hasError ? '#d32f2f' : 'rgba(0, 0, 0, 0.4)' },
                      '&:hover fieldset': { borderColor: hasError ? '#d32f2f' : 'rgba(0,0,0,0.5)' },
                    }}
                  >
                    <MenuItem value="" disabled>
                      <Typography sx={{ color: '#999' }}>
                        {q.label}{q.required ? ' *' : ''}
                      </Typography>
                    </MenuItem>
                    {(q.options || []).map((opt, i) => (
                      <MenuItem key={i} value={opt}>{opt}</MenuItem>
                    ))}
                  </Select>
                  {hasError && (
                    <FormHelperText>{errors[errorKey]}</FormHelperText>
                  )}
                </FormControl>
              )}
              {q.type === 'date' && (
                <DatePicker
                  selected={value ? new Date(value) : null}
                  onChange={(date: Date | null) => {
                    handleCustomAnswerChange(q.id, date ? date.toISOString().split('T')[0] : '');
                  }}
                  dateFormat="MMM d, yyyy"
                  customInput={
                    <GuestDateInput
                      label={q.label + (q.required ? ' *' : '')}
                      error={hasError}
                      helperText={hasError ? errors[errorKey] : undefined}
                      themeColor={themeColor}
                    />
                  }
                  wrapperClassName="guest-datepicker-wrapper"
                />
              )}
              {hasError && q.type !== 'short_text' && q.type !== 'long_text' && q.type !== 'numeric' && q.type !== 'dropdown' && q.type !== 'date' && (
                <Typography variant="caption" sx={{ color: '#d32f2f', mt: 0.5, display: 'block' }}>
                  {errors[errorKey]}
                </Typography>
              )}
            </Box>
          );
        })}
      </Stack>
    );
  };

  const renderStep = () => {
    // Check if this is a custom step
    const customStep = getCustomStepData(currentStep);
    if (customStep) {
      return renderCustomStep(customStep);
    }

    // Get step name to determine which content to render
    const stepName = mergedSteps[currentStep] as string;

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
              }}
            >
              Let's make this celebration official! ✨
            </Typography>

            <Typography
              variant="body2"
              sx={{
                color: '#808080 !important',
                mb: 3,
                lineHeight: 1.5,
              }}
            >
              First, tell us a bit about yourself:
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, flexDirection: 'row' }}>
              <TextField
                label="First name"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                error={!!errors.firstName}
                helperText={errors.firstName}
                fullWidth
                sx={guestTextFieldSx(themeColor)}
              />
              <TextField
                label="Last name"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                error={!!errors.lastName}
                helperText={errors.lastName}
                fullWidth
                sx={guestTextFieldSx(themeColor)}
              />
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
                    borderColor: themeColor,
                    borderWidth: '2px',
                    padding: { xs: '11px 11px', md: '13px 15px' },
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <FormControl sx={{ minWidth: 80 }}>
                    <Select
                      value={formData.countryCode}
                      onChange={(e) => handleInputChange('countryCode', e.target.value)}
                      variant="standard"
                      disableUnderline
                      sx={{
                        height: '24px',
                        color: '#000',
                        fontSize: '1rem',
                        '& .MuiSelect-select': {
                          padding: '0px 4px 0px 0px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          fontSize: '1rem',
                          border: 'none',
                          color: '#000',
                          '&:focus': {
                            backgroundColor: 'transparent',
                          },
                        },
                        '& .MuiSelect-icon': {
                          color: '#666',
                          fontSize: '1rem',
                          right: 0,
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
                  maxLength={PHONE_MAX_LENGTH}
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
              }}
            >
              Create Your Login 🔐
            </Typography>

            <Typography
              variant="body2"
              sx={{
                color: '#808080 !important',
                mb: 3,
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
                <CheckCircleOutlined sx={{ fontSize: 64, color: themeColor, mb: 2 }} />
                <Typography variant="h6" sx={{ color: '#000', mb: 1 }}>
                  You're all set!
                </Typography>
                <Typography variant="body2" sx={{ color: '#666' }}>
                  Logged in as {formData.email || user?.email}
                </Typography>
              </Box>
            ) : (
              <>
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
                      borderColor: themeColor,
                      bgcolor: alpha(themeColor, 0.05),
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

                <Box sx={{ textAlign: 'center', my: 2 }}>
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    or
                  </Typography>
                </Box>

                <TextField
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  disabled={isAuthenticating}
                  error={!!errors.email}
                  helperText={errors.email}
                  fullWidth
                  sx={guestTextFieldSx(themeColor)}
                />

                <TextField
                  label="Password (min 6 characters)"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  disabled={isAuthenticating}
                  error={!!errors.password}
                  helperText={errors.password}
                  fullWidth
                  sx={guestTextFieldSx(themeColor)}
                />

                <ActionButton
                  variant="contained"
                  fullWidth
                  onClick={handleEmailPasswordAuth}
                  loading={isAuthenticating}
                  sx={{
                    bgcolor: themeColor,
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
                      bgcolor: alpha(themeColor, 0.5),
                    },
                  }}
                >
                  Sign In / Sign Up
                </ActionButton>
              </>
            )}
          </Stack>
        );

      case 'RSVP':
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
                }}
              >
                Will you be celebrating with us? 🏖️
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
                        variant="body1"
                        sx={{
                          color: formData.attending === option.value ? themeColor : '#141414',
                          fontWeight: formData.attending === option.value ? 600 : 400,
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
                          border: `2px solid ${formData.attending === option.value ? themeColor : '#141414'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: formData.attending === option.value ? themeColor : 'transparent',
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
                        <TextField
                          label="Tell us what you're figuring out"
                          value={formData.maybeComment}
                          onChange={(e) => handleInputChange('maybeComment', e.target.value)}
                          fullWidth
                          multiline
                          minRows={2}
                          sx={guestTextFieldSx(themeColor)}
                        />

                        {/* Final answer reminder — only show if RSVP deadline is set */}
                        {wedding?.rsvp_deadline && (
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
                            <Typography variant="body1" sx={{
                              lineHeight: 1.5,
                            }}>
                              📅  Final answer needed by: <strong>{new Date(wedding.rsvp_deadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong>
                            </Typography>
                          </Box>
                        )}
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
                  lineHeight: 1.5,
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
                }}
              >
                Bringing your special someone? 💕
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  color: 'rgba(0, 0, 0, 0.48)',
                  mt: 1,
                  lineHeight: 1.5,
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
                        variant="body1"
                        sx={{
                          color: formData.plusOne === 'yes' ? themeColor : '#000',
                          fontWeight: formData.plusOne === 'yes' ? 600 : 400,
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
                          border: `2px solid ${formData.plusOne === 'yes' ? themeColor : 'rgba(0, 0, 0, 0.3)'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: formData.plusOne === 'yes' ? themeColor : 'transparent',
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
                          <TextField
                            label="First name"
                            value={formData.plusOneName.split(' ')[0] || ''}
                            onChange={(e) => {
                              const lastName = formData.plusOneName.split(' ').slice(1).join(' ');
                              handleInputChange('plusOneName', e.target.value + (lastName ? ' ' + lastName : ''));
                            }}
                            error={!!errors.plusOneName}
                            helperText={errors.plusOneName}
                            fullWidth
                            sx={guestTextFieldSx(themeColor)}
                          />
                          <TextField
                            label="Last name"
                            value={formData.plusOneName.split(' ').slice(1).join(' ') || ''}
                            onChange={(e) => {
                              const firstName = formData.plusOneName.split(' ')[0] || '';
                              handleInputChange('plusOneName', firstName + (e.target.value ? ' ' + e.target.value : ''));
                            }}
                            fullWidth
                            sx={guestTextFieldSx(themeColor)}
                          />
                        </Box>

                        {/* Email Field */}
                        <Box sx={{ mb: 2 }}>
                          <TextField
                            label="Email"
                            type="email"
                            value={formData.plusOneEmail}
                            onChange={(e) => handleInputChange('plusOneEmail', e.target.value)}
                            error={!!errors.plusOneEmail}
                            helperText={errors.plusOneEmail}
                            fullWidth
                            sx={guestTextFieldSx(themeColor)}
                          />
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
                                borderColor: themeColor,
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
                              maxLength={PHONE_MAX_LENGTH}
                              value={formData.plusOnePhone}
                              onChange={(e) => {
                                const cleanValue = e.target.value.replace(/[^\d+\s-()]/g, '');
                                handleInputChange('plusOnePhone', cleanValue);
                              }}
                              style={{
                                border: 'none',
                                outline: 'none',
                                flex: 1,
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
                        variant="body1"
                        sx={{
                          color: formData.plusOne === 'no' ? themeColor : '#000',
                          fontWeight: formData.plusOne === 'no' ? 600 : 400,
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
                          border: `2px solid ${formData.plusOne === 'no' ? themeColor : 'rgba(0, 0, 0, 0.3)'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: formData.plusOne === 'no' ? themeColor : 'transparent',
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
                variant="body2"
                sx={{
                  color: 'rgba(0, 0, 0, 0.48)',
                  mb: 2,
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
                    py: 1,
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

      case 'Dietary Restrictions':
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
                }}
              >
                What's your dining preference? 🍛
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  color: 'rgba(0, 0, 0, 0.48)',
                  mt: 1,
                  lineHeight: 1.5,
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
                        variant="body1"
                        sx={{
                          color: formData.foodPreference.includes(option.value) ? themeColor : '#000',
                          fontWeight: formData.foodPreference.includes(option.value) ? 600 : 400,
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
                          border: `2px solid ${formData.foodPreference.includes(option.value) ? themeColor : 'rgba(0, 0, 0, 0.3)'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: formData.foodPreference.includes(option.value) ? themeColor : 'transparent',
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
                      borderColor: themeColor,
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

      case 'Team Bride/Groom':
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
                }}
              >
                Which side of the celebration? 👰🏻‍♀️🤵🏻‍♂️
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  color: 'rgba(0, 0, 0, 0.48)',
                  mt: 1,
                  lineHeight: 1.5,
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
                        variant="body1"
                        sx={{
                          color: formData.weddingSide === option.value ? themeColor : '#000',
                          fontWeight: formData.weddingSide === option.value ? 600 : 400,
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
                          border: `2px solid ${formData.weddingSide === option.value ? themeColor : 'rgba(0, 0, 0, 0.3)'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: formData.weddingSide === option.value ? themeColor : 'transparent',
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

      case 'Music Request':
        return (
          <Stack spacing={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="h4" sx={{ color: '#000', fontWeight: 400, lineHeight: 1.3, mb: 1 }}>
                  Music requests
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.48)', lineHeight: 1.5 }}>
                  What song will make this celebration perfect? (optional)
                </Typography>
              </Box>
              <TextField
                label="Song name and artist"
                value={formData.songRequest}
                onChange={(e) => handleInputChange('songRequest', e.target.value)}
                fullWidth
                sx={guestTextFieldSx(themeColor)}
              />
            </Box>
          </Stack>
        );

      case 'Comment':
        return (
          <Stack spacing={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="h4" sx={{ color: '#000', fontWeight: 400, lineHeight: 1.3, mb: 1 }}>
                  Share your excitement
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.48)', lineHeight: 1.5 }}>
                  Leave a message for everyone to see! (optional)
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <TextField
                  label="Your wishes for the happy couple..."
                  value={formData.specialMessage}
                  onChange={(e) => handleInputChange('specialMessage', e.target.value)}
                  fullWidth
                  multiline
                  minRows={2}
                  sx={guestTextFieldSx(themeColor)}
                />

                {!formData.selectedGif && (
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                    <IconButton
                      onClick={() => setShowGifPicker(true)}
                      sx={{
                        width: 32, height: 32, border: '1px solid #000', borderRadius: '6px',
                        backgroundColor: 'white', p: 1,
                        '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)', borderColor: '#000' },
                      }}
                    >
                      <svg width="18" height="8" viewBox="0 0 18 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8.61429 8V0H10.1571V8H8.61429ZM0 8V0H6.17143V1.6H1.54286V6.4H4.62857V4H6.17143V8H0ZM12.4714 8V0H18V1.6H14.0143V3.6H16.6179V5.2H14.0143V8H12.4714Z" fill="#141414" />
                      </svg>
                    </IconButton>
                  </Box>
                )}

                {formData.selectedGif && (
                  <Box sx={{ mt: 2 }}>
                    <Box
                      sx={{
                        position: 'relative', borderRadius: '16px', overflow: 'hidden',
                        border: '1px solid rgba(0, 0, 0, 0.12)', cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        '&:hover': { boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', transform: 'translateY(-1px)' },
                      }}
                      onClick={() => setShowGifPicker(true)}
                    >
                      <Image
                        src={formData.selectedGif.preview_url}
                        alt={formData.selectedGif.title}
                        width={200}
                        height={200}
                        style={{ width: '100%', height: 'auto', maxHeight: '200px', objectFit: 'cover', display: 'block' }}
                        unoptimized
                      />
                      <IconButton
                        onClick={(e) => { e.stopPropagation(); handleRemoveGif(); }}
                        sx={{
                          position: 'absolute', top: 8, right: 8,
                          backgroundColor: 'rgba(0, 0, 0, 0.6)', color: 'white',
                          width: 32, height: 32,
                          '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.8)' },
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
            {mergedSteps.map((_, index) => (
              <Box
                key={index}
                sx={{
                  flex: 1,
                  height: '100%',
                  backgroundColor: index <= currentStep ? themeColor : '#E0E0E0',
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

          {/* Hide Next/Submit on Account Creation — auth buttons handle progression */}
          {getStepName(mergedSteps[currentStep]) === 'Account Creation' && !isAuthenticated ? null : (currentStep === mergedSteps.length - 1 || (getStepName(mergedSteps[currentStep]) === 'RSVP' && formData.attending === 'no')) ? (
            <ActionButton
              onClick={handleSubmit}
              variant="contained"
              loading={isSubmitting}
              sx={{
                flex: 1,
                height: { xs: 44, sm: 48, md: 56 },
                backgroundColor: themeColor,
                color: 'white',
                fontWeight: 700,
                fontSize: { xs: '0.9rem', md: '1.1rem' },
                borderRadius: '16px',
                textTransform: 'uppercase',
                letterSpacing: '6.25%',
                '&:hover': {
                  backgroundColor: '#C8365A',
                },
                '&:disabled': {
                  backgroundColor: '#ccc',
                  color: '#999',
                },
              }}
            >
              Submit RSVP
            </ActionButton>
          ) : (
            <ActionButton
              onClick={handleNext}
              variant="contained"
              sx={{
                flex: 1,
                height: { xs: 44, sm: 48, md: 56 },
                backgroundColor: themeColor,
                color: 'white',
                fontWeight: 700,
                fontSize: { xs: '0.9rem', md: '1.1rem' },
                borderRadius: '16px',
                textTransform: 'uppercase',
                letterSpacing: '6.25%',
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
            </ActionButton>
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
          <Typography variant="body1" sx={{ color: '#000' }}>
            Are you sure you want to exit? Your changes will not be saved.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ background: 'transparent', pb: 2, pr: 2 }}>
          <Button onClick={handleCancelExit} variant="outlined" sx={{ color: '#000', borderColor: '#000', '&:hover': { borderColor: '#000', background: '#222' } }}>
            Cancel
          </Button>
          <ActionButton onClick={handleConfirmExit} variant="contained" sx={{ color: '#fff', background: themeColor, '&:hover': { background: '#C8365A' } }}>
            Leave
          </ActionButton>
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