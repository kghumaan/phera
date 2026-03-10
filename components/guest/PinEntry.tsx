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


const PinEntry = ({ onPinVerified, weddingSlug, isPreview = false }: PinEntryProps) => {
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState(false);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [showPreviewToast, setShowPreviewToast] = useState(false);
  const [rateLimitMessage, setRateLimitMessage] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Pin entry customization state
  const [pinEntryText, setPinEntryText] = useState<string | null>(null);
  const [pinEntrySubtitleText, setPinEntrySubtitleText] = useState<string | null>(null);
  const [pinEntryBackground, setPinEntryBackground] = useState('/images/backgrounds/pearl.webp');
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

  // Persist pin verification to DB for authenticated users
  const storePinAccessToDB = async (pinType: string, allowsPlusOne: boolean) => {
    try {
      const { data: { user: sbUser } } = await supabase.auth.getUser();
      if (!sbUser) return;

      await supabase.from('pin_access').upsert([{
        user_id: sbUser.id,
        wedding_id: weddingSlug,
        pin_type: pinType,
        allows_plus_one: allowsPlusOne,
      }], { onConflict: 'user_id,wedding_id' });
      console.log('Pin access stored to DB for user:', sbUser.id);
    } catch (err) {
      console.error('Failed to store pin_access to DB (non-fatal):', err);
    }
  };

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
    setRateLimitMessage(null);

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
        setPinEntryBackground(contextWedding.pin_entry_background || '/images/backgrounds/pearl.webp');
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
        setPinEntryBackground(wedding.pin_entry_background || '/images/backgrounds/pearl.webp');
        setPinEntryPrimaryColor(wedding.pin_entry_primary_color || '#141414');
        setPinEntryFontColor(wedding.pin_entry_font_color || '#000');
        setPinEntryButtonFontColor(wedding.pin_entry_button_font_color || '#FFFFFF');
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
      setPinEntryBackground(contextWedding.pin_entry_background || '/images/backgrounds/pearl.webp');
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
    if (enteredPin.length !== 4 || isVerifying) return;

    setIsVerifying(true);
    setError(false);
    setRateLimitMessage(null);

    try {
      const res = await fetch('/api/pin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weddingSlug, pin: enteredPin }),
      });

      const data = await res.json();

      if (res.status === 429) {
        setRateLimitMessage(data.error || 'Too many attempts. Please wait and try again.');
        setPin(['', '', '', '']);
        inputRefs[0].current?.focus();
        return;
      }

      if (!res.ok || !data.valid) {
        setError(true);
        setPin(['', '', '', '']);
        inputRefs[0].current?.focus();
        return;
      }

      // PIN is valid — store settings in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(`phera_pin_verified_${weddingSlug}`, 'true');
        localStorage.setItem(`phera_pin_timestamp_${weddingSlug}`, Date.now().toString());
        localStorage.setItem(`phera_allows_plus_one_${weddingSlug}`, data.allows_plus_one ? 'true' : 'false');
        localStorage.setItem(`phera_pin_type_${weddingSlug}`, data.type);

        if (data.skip_rsvp) {
          localStorage.setItem(`phera_skip_rsvp_${weddingSlug}`, 'true');
          localStorage.setItem(`phera_bypass_rsvp_${weddingSlug}`, 'true');
        } else {
          localStorage.removeItem(`phera_skip_rsvp_${weddingSlug}`);
          localStorage.removeItem(`phera_bypass_rsvp_${weddingSlug}`);
        }

        if (data.hidden_events && data.hidden_events.length > 0) {
          localStorage.setItem(`phera_hidden_events_${weddingSlug}`, JSON.stringify(data.hidden_events));
        } else {
          localStorage.removeItem(`phera_hidden_events_${weddingSlug}`);
        }

        storePinAccessToDB(data.type, data.allows_plus_one);
        onPinVerified();
      }
    } catch (err) {
      console.error('PIN verify error:', err);
      setError(true);
      setPin(['', '', '', '']);
      inputRefs[0].current?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const isPinComplete = pin.every(digit => digit !== '');
  const isReady = isPreview || !isLoadingSettings;

  // Auto-submit when all digits are entered
  useEffect(() => {
    if (isPinComplete && isReady) {
      handleContinue();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin, isReady]);

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

    const checkInitialState = async () => {
      if (typeof window !== 'undefined') {
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

        // Check magic_link URL parameter — requires valid Supabase session
        const urlParams = new URLSearchParams(window.location.search);
        const magicLink = urlParams.get('magic_link');

        if (magicLink === 'true') {
          try {
            const { data: { user: mlUser } } = await supabase.auth.getUser();
            if (mlUser) {
              console.log('Magic link with valid session, bypassing PIN entry...');
              triggerBypass();
              return;
            }
          } catch (err) {
            console.error('Magic link session check failed:', err);
          }
        }

        // Check DB for existing pin_access (for authenticated users)
        try {
          const { data: { user: sbUser } } = await supabase.auth.getUser();
          if (sbUser) {
            const { data: pinAccess } = await supabase
              .from('pin_access')
              .select('verified_at, pin_type, allows_plus_one')
              .eq('user_id', sbUser.id)
              .eq('wedding_id', weddingSlug)
              .single();

            if (pinAccess) {
              console.log('Found pin_access in DB, restoring localStorage and bypassing...');
              localStorage.setItem(`phera_pin_verified_${weddingSlug}`, 'true');
              localStorage.setItem(`phera_pin_timestamp_${weddingSlug}`, Date.now().toString());
              if (pinAccess.allows_plus_one) {
                localStorage.setItem(`phera_allows_plus_one_${weddingSlug}`, 'true');
              }
              if (pinAccess.pin_type) {
                localStorage.setItem(`phera_pin_type_${weddingSlug}`, pinAccess.pin_type);
              }
              triggerBypass();
              return;
            }
          }
        } catch (err) {
          console.error('Error checking pin_access DB (non-fatal):', err);
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
      ? `Celebrate with ${coupleName}!`
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
              height: { xs: 60, sm: 60, md: 80, lg: 100, xl: 100 },
              width: 'auto',
              filter: 'brightness(0)',
            }}
          />

          {/* Heading */}
          <Typography
            variant="h2"
            sx={{
              color: pinEntryFontColor,
              fontSize: { xs: '1.75rem', sm: '2rem', md: '2.5rem', lg: '3rem', xl: '3.25rem' },
              lineHeight: 1.3,
              textAlign: 'center',
            }}
          >
            {displayText}
          </Typography>

          {/* Subtitle */}
          <Typography
            variant="body2"
            sx={{
              color: pinEntryFontColor,
              // fontSize: { xs: '1.125rem', sm: '1.125rem', md: '1.125rem', lg: '1.2rem', xl: '1.25rem' },
              lineHeight: 1.5,
              maxWidth: { xs: 355, sm: 400, lg: 800, xl: 800 },
              mx: 'auto',
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
                    fontWeight: 700,
                    textAlign: 'center',
                    border: error ? `1px solid ${pinEntryPrimaryColor}` : '1px solid #D6D6D6',
                    boxShadow: 'none',
                    '&:hover': {
                      border: error ? `1px solid ${pinEntryPrimaryColor}` : `1px solid ${pinEntryPrimaryColor}`,
                    },
                    '&.Mui-focused': {
                      border: error ? `1px solid ${pinEntryPrimaryColor}` : `1px solid ${pinEntryPrimaryColor}`,
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
          {error && !rateLimitMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              style={{ marginTop: '16px' }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: pinEntryPrimaryColor,
                  fontWeight: 600,
                  fontSize: { xs: '0.9rem', sm: '1rem', lg: '1.0625rem', xl: '1.125rem' },
                  textAlign: 'center',
                  backgroundColor: `${pinEntryPrimaryColor}15`,
                  px: { xs: 3, lg: 3.5, xl: 4 },
                  py: { xs: 1, lg: 1.25, xl: 1.5 },
                  borderRadius: '20px',
                  border: `1px solid ${pinEntryPrimaryColor}33`,
                }}
              >
                Invalid invitation code. Please try again.
              </Typography>
            </motion.div>
          )}

          {/* Rate Limit Message */}
          {rateLimitMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              style={{ marginTop: '16px' }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: '#e65100',
                  fontWeight: 600,
                  fontSize: { xs: '0.9rem', sm: '1rem', lg: '1.0625rem', xl: '1.125rem' },
                  textAlign: 'center',
                  backgroundColor: '#fff3e0',
                  px: { xs: 3, lg: 3.5, xl: 4 },
                  py: { xs: 1, lg: 1.25, xl: 1.5 },
                  borderRadius: '20px',
                  border: '1px solid #ffcc80',
                }}
              >
                {rateLimitMessage}
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
          {/* Or Divider */}
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', maxWidth: '354px' }}>
            <Box sx={{ flex: 1, height: '1px', bgcolor: '#D6D6D6' }} />
            <Typography variant="body2" sx={{ px: 2, color: '#6a6a6a', fontSize: '0.875rem', fontWeight: 500 }}>
              or
            </Typography>
            <Box sx={{ flex: 1, height: '1px', bgcolor: '#D6D6D6' }} />
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
            Log in with email
          </Button>
        </motion.div>
      </Container>

      <LoginModal
        open={loginDialogOpen}
        onClose={() => setLoginDialogOpen(false)}
        onSuccess={handleLoginSuccess}
        redirectTo={`/${weddingSlug}?magic_link=true`}
      />

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