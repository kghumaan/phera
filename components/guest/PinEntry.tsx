'use client';

import {
  Box,
  Container,
  Typography,
  Button,
  TextField,
  Stack,
  InputAdornment,
  Snackbar,
  Alert,
} from '@mui/material';
import { motion } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useWedding } from '@/lib/contexts/WeddingContext';
import OptimizedBackground from '@/components/ui/OptimizedBackground';
import LoginModal from '@/components/auth/LoginModal';

interface PinEntryProps {
  onPinVerified: () => void;
  weddingSlug: string;
  isPreview?: boolean;
}

interface PinCode {
  pin: string;
  type: string;
  allows_plus_one: boolean;
  skip_rsvp?: boolean;
}

interface WeddingSettings {
  pin_codes: PinCode[];
}



const PinEntry = ({ onPinVerified, weddingSlug, isPreview = false }: PinEntryProps) => {
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState(false);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [weddingSettings, setWeddingSettings] = useState<WeddingSettings | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [showPreviewToast, setShowPreviewToast] = useState(false);

  // Pin entry customization state
  const [pinEntryText, setPinEntryText] = useState<string | null>(null);
  const [pinEntrySubtitleText, setPinEntrySubtitleText] = useState<string | null>(null);
  const [pinEntryBackground, setPinEntryBackground] = useState('/images/backgrounds/pearl.png');
  const [pinEntryPrimaryColor, setPinEntryPrimaryColor] = useState('#141414');
  const [pinEntryFontColor, setPinEntryFontColor] = useState('#000');
  const [pinEntryButtonFontColor, setPinEntryButtonFontColor] = useState('#FFFFFF');
  const [coupleName, setCoupleName] = useState('');

  const { refreshAuth, user, isLoading: authLoading } = useAuth();
  const { wedding: contextWedding, isLoading: weddingLoading } = useWedding();
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const handlePinChange = (index: number, value: string) => {
    // Handle paste or multi-character input (typically only at index 0 or if first char is empty)
    if (value.length > 1 && (index === 0 || pin[index] === '')) {
      const digits = value.replace(/[^0-9]/g, '').slice(0, 4);
      if (digits.length > 0) {
        const newPin = [...pin];
        for (let i = 0; i < digits.length && (index + i) < 4; i++) {
          newPin[index + i] = digits[i];
        }
        setPin(newPin);
        setError(false);

        const nextIndex = Math.min(index + digits.length, 3);
        inputRefs[nextIndex].current?.focus();
      }
      return;
    }

    // Handle single digit input
    const digit = value.replace(/[^0-9]/g, '').slice(-1); // Take only the last character typed

    // If no digit found and value isn't empty (meaning they typed a non-digit)
    if (!digit && value !== '') return;

    const newPin = [...pin];
    newPin[index] = digit;
    setPin(newPin);
    setError(false);

    // Auto-focus next input if we just typed a digit
    if (digit && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Handle backspace
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const digits = pastedText.replace(/[^0-9]/g, '').slice(0, 4);

    if (digits.length > 0) {
      const newPin = ['', '', '', ''];
      for (let i = 0; i < digits.length && i < 4; i++) {
        newPin[i] = digits[i];
      }
      setPin(newPin);
      setError(false);

      // Focus the next empty field or the last field
      const nextIndex = Math.min(digits.length, 3);
      inputRefs[nextIndex].current?.focus();
    }
  };

  // Fetch wedding settings and customizations on mount
  useEffect(() => {
    const fetchWeddingSettings = async () => {
      // If we have context wedding (preview mode), use it and skip fetch
      if (contextWedding) {
        setCoupleName(contextWedding.couple_name || '');
        setPinEntryText(contextWedding.pin_entry_text || '');
        setPinEntrySubtitleText(contextWedding.pin_entry_subtitle_text || '');
        setPinEntryBackground(contextWedding.pin_entry_background || '/images/backgrounds/pearl.png');
        setPinEntryPrimaryColor(contextWedding.pin_entry_primary_color || '#141414');
        setPinEntryFontColor(contextWedding.pin_entry_font_color || '#000');
        setPinEntryButtonFontColor(contextWedding.pin_entry_button_font_color || '#FFFFFF');
        setIsLoadingSettings(false);
        return;
      }

      setIsLoadingSettings(true);
      try {
        // Get the wedding data including pin entry customizations
        const { data: wedding, error: weddingError } = await supabase
          .from('weddings')
          .select('id, couple_name, pin_entry_text, pin_entry_subtitle_text, pin_entry_background, pin_entry_primary_color, pin_entry_font_color, pin_entry_button_font_color')
          .eq('slug', weddingSlug)
          .single();

        if (weddingError || !wedding) {
          console.error('Error fetching wedding:', weddingError);
          setIsLoadingSettings(false);
          return;
        }

        // Set couple name
        setCoupleName(wedding.couple_name || '');

        // Set pin entry customizations with defaults
        const defaultText = "You're invited!";
        const defaultSubtitle = 'Enter your invitation code to see all the details and RSVP for our celebration';

        setPinEntryText(wedding.pin_entry_text || defaultText);
        setPinEntrySubtitleText(wedding.pin_entry_subtitle_text || defaultSubtitle);
        setPinEntryBackground(wedding.pin_entry_background || '/images/backgrounds/pearl.png');
        setPinEntryPrimaryColor(wedding.pin_entry_primary_color || '#141414');
        setPinEntryFontColor(wedding.pin_entry_font_color || '#000');
        setPinEntryButtonFontColor(wedding.pin_entry_button_font_color || '#FFFFFF');

        // Now fetch the wedding settings for PIN codes
        const { data: settings, error: settingsError } = await supabase
          .from('wedding_settings')
          .select('pin_codes')
          .eq('wedding_id', wedding.id)
          .maybeSingle();

        if (settingsError) {
          console.error('Error fetching wedding settings:', settingsError);
          setIsLoadingSettings(false);
          return;
        }

        // If no settings exist yet, use empty pin_codes (admin hasn't configured PINs)
        if (settings && settings.pin_codes) {
          setWeddingSettings({ pin_codes: settings.pin_codes as unknown as PinCode[] });
        } else {
          setWeddingSettings({ pin_codes: [] });
        }
      } catch (error) {
        console.error('Unexpected error fetching settings:', error);
      } finally {
        setIsLoadingSettings(false);
      }
    };

    fetchWeddingSettings();
  }, [weddingSlug, contextWedding]);

  // Real-time update effect specifically for preview
  useEffect(() => {
    if (contextWedding) {
      setCoupleName(contextWedding.couple_name || '');
      setPinEntryText(contextWedding.pin_entry_text);
      setPinEntrySubtitleText(contextWedding.pin_entry_subtitle_text);
      setPinEntryBackground(contextWedding.pin_entry_background || '/images/backgrounds/pearl.png');
      setPinEntryPrimaryColor(contextWedding.pin_entry_primary_color || '#141414');
      setPinEntryFontColor(contextWedding.pin_entry_font_color || '#000');
      setPinEntryButtonFontColor(contextWedding.pin_entry_button_font_color || '#FFFFFF');
    }
  }, [contextWedding]);

  const handleContinue = async () => {
    if (isPreview) {
      setShowPreviewToast(true);
      return;
    }

    const enteredPin = pin.join('');

    if (!weddingSettings || !weddingSettings.pin_codes) {
      setError(true);
      return;
    }

    // Check if entered PIN matches any valid PIN for this wedding
    const matchedPin = weddingSettings.pin_codes.find(
      (pinConfig) => pinConfig.pin === enteredPin
    );

    if (matchedPin) {
      // Set pin verification flag and store settings
      if (typeof window !== 'undefined') {
        localStorage.setItem(`phera_pin_verified_${weddingSlug}`, 'true');
        localStorage.setItem(`phera_pin_timestamp_${weddingSlug}`, Date.now().toString());
        localStorage.setItem(`phera_allows_plus_one_${weddingSlug}`, matchedPin.allows_plus_one ? 'true' : 'false');
        localStorage.setItem(`phera_pin_type_${weddingSlug}`, matchedPin.type);

        // Store skip_rsvp flag if present
        if (matchedPin.skip_rsvp) {
          localStorage.setItem(`phera_skip_rsvp_${weddingSlug}`, 'true');
        } else {
          localStorage.removeItem(`phera_skip_rsvp_${weddingSlug}`);
        }

        // Call the callback to notify parent component
        onPinVerified();
      }
    } else {
      setError(true);
      // Clear pin after error
      setPin(['', '', '', '']);
      inputRefs[0].current?.focus();
    }
  };

  const isPinComplete = pin.every(digit => digit !== '');
  const isReady = isPreview || (!isLoadingSettings && weddingSettings !== null);

  const handleLogin = () => {
    setLoginDialogOpen(true);
  };

  const handleLoginSuccess = () => {
    setLoginDialogOpen(false);
    onPinVerified();
  };

  // Disable scrolling on this screen
  useEffect(() => {
    // Disable scrolling when component mounts
    document.body.style.overflow = 'hidden';

    // Re-enable scrolling when component unmounts
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Simplified PIN verification and bypass logic
  useEffect(() => {
    let mounted = true;
    let bypassTriggered = false;
    let authSubscription: any = null;

    const triggerBypass = () => {
      if (bypassTriggered || !mounted) return false;
      bypassTriggered = true;
      console.log('Triggering bypass - calling onPinVerified()');
      onPinVerified();
      return true;
    };

    const checkInitialState = () => {
      if (typeof window !== 'undefined') {
        // Note: Authenticated users now need to verify PIN for each wedding
        // We don't auto-bypass based on login status anymore

        // Check for stored PIN verification (wedding-specific)
        const pinVerified = localStorage.getItem(`phera_pin_verified_${weddingSlug}`);
        const pinTimestamp = localStorage.getItem(`phera_pin_timestamp_${weddingSlug}`);

        if (pinVerified === 'true' && pinTimestamp) {
          try {
            const timestamp = parseInt(pinTimestamp);
            const isRecent = Date.now() - timestamp < 24 * 60 * 60 * 1000; // 24 hours
            if (isRecent) {
              console.log('Recent PIN verification found for this wedding, bypassing...');
              triggerBypass();
              return;
            } else {
              // Remove expired pin verification
              localStorage.removeItem(`phera_pin_verified_${weddingSlug}`);
              localStorage.removeItem(`phera_pin_timestamp_${weddingSlug}`);
              localStorage.removeItem(`phera_allows_plus_one_${weddingSlug}`);
              localStorage.removeItem(`phera_pin_type_${weddingSlug}`);
            }
          } catch (error) {
            console.error('Error checking pin verification:', error);
          }
        }

        // Check URL parameters for auth bypass
        const urlParams = new URLSearchParams(window.location.search);
        const authSuccess = urlParams.get('auth_success');
        const restorePin = urlParams.get('restore_pin');
        const magicLink = urlParams.get('magic_link');
        const bypassPin = urlParams.get('bypass_pin');

        if (authSuccess === 'true' || restorePin === 'true' || magicLink === 'true' || bypassPin === 'true') {
          console.log('Auth URL parameter detected, bypassing PIN entry...');
          triggerBypass();
          return;
        }
      }
    };

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session && mounted) {
        // Check if PIN is already verified for this wedding
        const pinVerified = localStorage.getItem(`phera_pin_verified_${weddingSlug}`);
        const pinTimestamp = localStorage.getItem(`phera_pin_timestamp_${weddingSlug}`);
        if (pinVerified === 'true' && pinTimestamp) {
          const timestamp = parseInt(pinTimestamp);
          const isRecent = Date.now() - timestamp < 24 * 60 * 60 * 1000;
          if (isRecent) {
            console.log('Auth state changed and PIN already verified for this wedding, bypassing...');
            triggerBypass();
          }
        }
        // If PIN not verified for this wedding, don't bypass - let them enter PIN
      }
    });

    authSubscription = subscription;

    // Run initial check
    checkInitialState();

    return () => {
      mounted = false;
      bypassTriggered = true; // Prevent any delayed calls
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, [user, authLoading, onPinVerified, weddingSlug]);

  // Generate display text with couple name replacement
  const displayText = pinEntryText
    ? pinEntryText.replace(/\{couple_name\}/g, coupleName)
    : coupleName
      ? `Please join ${coupleName} on their special night`
      : "You're Invited!";
  const displaySubtitle = pinEntrySubtitleText
    ? pinEntrySubtitleText.replace(/\{couple_name\}/g, coupleName)
    : 'Enter your invitation code to see all the details and RSVP for our celebration';

  // Background setup similar to home page
  return (
    <OptimizedBackground
      src={pinEntryBackground}
      className="min-h-screen flex flex-col"
    >
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
          width: { xs: '120px', sm: '160px', md: '200px' },
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
          width: { xs: '120px', sm: '160px', md: '200px' },
          height: 'auto',
          pointerEvents: 'none',
        }}
      />

      {/* Main Content */}
      <Container
        maxWidth="sm"
        sx={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100svh',
          pt: { xs: 3, sm: 4 },
          pb: { xs: 4, sm: 6 },
          px: { xs: 3, sm: 4 },
          gap: { xs: 4, sm: 6 },
        }}
      >
        {/* Top Section - Logo and Title */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          style={{
            width: '100%',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
          }}
        >
          {/* Logo */}
          <Box
            component="img"
            src="/logo-stacked.svg"
            alt="Phera Logo"
            sx={{
              height: { xs: 80, sm: 100, md: 120, lg: 130, xl: 140 },
              width: 'auto',
              filter: 'brightness(0)',
            }}
          />

          {/* Heading */}
          <Typography
            variant="h3"
            sx={{
              fontFamily: 'var(--font-instrument-serif), serif',
              fontWeight: 400,
              color: pinEntryFontColor,
              fontSize: { xs: '2.5rem', sm: '2.75rem', md: '3rem', lg: '3.25rem', xl: '3.5rem' },
              lineHeight: 1.4,
              textAlign: 'center',
              fontStyle: 'italic',
            }}
          >
            {displayText}
          </Typography>

          {/* Subtitle */}
          <Typography
            variant="body1"
            sx={{
              fontFamily: 'var(--font-outfit), sans-serif',
              color: pinEntryFontColor,
              fontSize: { xs: '1.125rem', sm: '1.125rem', md: '1.125rem', lg: '1.2rem', xl: '1.25rem' },
              lineHeight: 1.5,
              maxWidth: { xs: 355, sm: 400, lg: 450, xl: 500 },
              mx: 'auto',
              fontWeight: 400,
              textAlign: 'center',
              px: 2,
            }}
          >
            {displaySubtitle}
          </Typography>
        </motion.div>

        {/* Middle Section - PIN Input (Centered) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          style={{
            width: '100%',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Pin Input Section */}
          <Stack
            direction="row"
            spacing={{ xs: 1.5, sm: 1.5, md: 1.5, lg: 1.75, xl: 2 }}
            justifyContent="center"
          >
            {pin.map((digit, index) => (
              <TextField
                key={index}
                inputRef={inputRefs[index]}
                value={digit}
                onChange={(e) => handlePinChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                sx={{
                  width: { xs: 72, sm: 72, md: 73, lg: 80, xl: 88 },
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#FFFFFF',
                    borderRadius: '50%', // Perfect circle
                    height: { xs: 72, sm: 72, md: 73, lg: 80, xl: 88 },
                    fontSize: { xs: '1.5rem', sm: '1.5rem', md: '1.5rem', lg: '1.75rem', xl: '2rem' },
                    fontFamily: 'var(--font-outfit), sans-serif',
                    fontWeight: 700,
                    textAlign: 'center',
                    border: error ? '1px solid #f44336' : '1px solid #D6D6D6',
                    boxShadow: 'none',
                    '&:hover': {
                      border: error ? '1px solid #f44336' : `1px solid ${pinEntryPrimaryColor}`,
                    },
                    '&.Mui-focused': {
                      border: error ? '1px solid #f44336' : `1px solid ${pinEntryPrimaryColor}`,
                      boxShadow: 'none',
                    },
                    transition: 'all 0.2s ease-in-out',
                  },
                  '& .MuiOutlinedInput-input': {
                    textAlign: 'center',
                    padding: 0,
                    letterSpacing: '4.17%',
                    textTransform: 'uppercase',
                  },
                  '& fieldset': {
                    border: 'none',
                  },
                }}
                inputProps={{
                  inputMode: 'numeric',
                  pattern: '[0-9]*',
                  style: {
                    textAlign: 'center',
                    fontSize: 'inherit',
                    fontWeight: 'inherit',
                    color: pin[index] ? '#000' : 'rgba(0, 0, 0, 0.2)',
                  }
                }}
                placeholder="0"
              />
            ))}
          </Stack>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              style={{ marginTop: '16px' }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: '#f44336',
                  fontWeight: 600,
                  fontSize: { xs: '0.9rem', sm: '1rem', lg: '1.0625rem', xl: '1.125rem' },
                  textAlign: 'center',
                  backgroundColor: 'rgba(244, 67, 54, 0.1)',
                  px: { xs: 3, lg: 3.5, xl: 4 },
                  py: { xs: 1, lg: 1.25, xl: 1.5 },
                  borderRadius: '20px',
                  border: '1px solid rgba(244, 67, 54, 0.2)',
                }}
              >
                Invalid invitation code. Please try again.
              </Typography>
            </motion.div>
          )}
        </motion.div>

        {/* Bottom Section - Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          {/* Continue Button */}
          <Button
            onClick={handleContinue}
            disabled={!isPinComplete || !isReady}
            sx={{
              backgroundColor: pinEntryPrimaryColor,
              color: pinEntryButtonFontColor,
              borderRadius: '16px',
              px: { xs: '20px', lg: '22px', xl: '24px' },
              py: { xs: '12px', lg: '13px', xl: '14px' },
              fontSize: { xs: '1rem', lg: '1.0625rem', xl: '1.125rem' },
              fontFamily: 'var(--font-outfit), sans-serif',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '6.25%',
              width: '100%',
              maxWidth: { xs: '354px', lg: '380px', xl: '400px' },
              boxShadow: 'none',
              '&:hover': {
                backgroundColor: pinEntryPrimaryColor,
                opacity: 0.9,
                boxShadow: 'none',
              },
              '&:disabled': {
                backgroundColor: pinEntryPrimaryColor,
                opacity: 0.3,
                color: pinEntryButtonFontColor,
                boxShadow: 'none',
              },
              transition: 'all 0.2s ease-in-out',
            }}
          >
            {isLoadingSettings ? 'Loading...' : 'Continue'}
          </Button>

          {/* Or Divider */}
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              my: { xs: 1, sm: 2 },
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                maxWidth: { xs: 280, sm: 300, lg: 320, xl: 350 },
                gap: 2,
              }}
            >
              {/* Left line */}
              <Box
                sx={{
                  flex: 1,
                  height: '1px',
                  backgroundColor: 'rgba(0, 0, 0, 0.2)',
                }}
              />

              {/* Or text */}
              <Typography
                variant="body2"
                sx={{
                  color: '#000',
                  fontFamily: 'var(--font-outfit), sans-serif',
                  fontWeight: 400,
                  fontSize: { xs: '1rem', sm: '1rem', lg: '1.0625rem', xl: '1.125rem' },
                  textTransform: 'uppercase',
                  letterSpacing: '6.25%',
                  flexShrink: 0,
                }}
              >
                or
              </Typography>

              {/* Right line */}
              <Box
                sx={{
                  flex: 1,
                  height: '1px',
                  backgroundColor: 'rgba(0, 0, 0, 0.2)',
                }}
              />
            </Box>
          </Box>

          {/* Login Button */}
          <Button
            onClick={handleLogin}
            sx={{
              backgroundColor: '#FFFFFF',
              color: '#141414',
              borderRadius: '16px',
              px: { xs: '20px', lg: '22px', xl: '24px' },
              py: { xs: '12px', lg: '13px', xl: '14px' },
              fontSize: { xs: '1rem', lg: '1.0625rem', xl: '1.125rem' },
              fontFamily: 'var(--font-outfit), sans-serif',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '6.25%',
              width: '100%',
              maxWidth: { xs: '354px', lg: '380px', xl: '400px' },
              border: '1px solid #D6D6D6',
              boxShadow: 'none',
              '&:hover': {
                backgroundColor: '#F5F5F5',
                border: '1px solid #B0B0B0',
                boxShadow: 'none',
              },
              transition: 'all 0.2s ease-in-out',
            }}
          >
            Login
          </Button>
        </motion.div>
      </Container>

      <Snackbar
        open={showPreviewToast}
        autoHideDuration={6000}
        onClose={() => setShowPreviewToast(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setShowPreviewToast(false)}
          severity="info"
          sx={{ width: '100%', borderRadius: '12px', fontWeight: 500 }}
        >
          In the live site, this would redirect you to the wedding website if the invitation code matches.
        </Alert>
      </Snackbar>
    </OptimizedBackground>
  );
};

export default PinEntry; 