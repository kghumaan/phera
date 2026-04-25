'use client';

/**
 * Two-step guest access: wedding password, then name selection.
 *
 * Exported as `PinEntry` for backwards compatibility with the handful of
 * pages that still import it under that name. The actual flow is now a
 * password step followed by a name-match / pick-yourself step.
 *
 * After a successful name selection the component writes three
 * localStorage keys per wedding:
 *   - `phera_password_ok_{slug}`  = 'true'
 *   - `phera_password_ts_{slug}`  = timestamp (24h TTL)
 *   - `phera_guest_id_{slug}`     = selected guest UUID
 *
 * It also writes the legacy `phera_pin_verified_{slug}` +
 * `phera_pin_timestamp_{slug}` pair so downstream code that still
 * reads those keys (bypass checks, auth restore) keeps working.
 */

import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  Snackbar,
} from '@mui/material';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useWedding } from '@/lib/contexts/WeddingContext';
import OptimizedBackground from '@/components/ui/OptimizedBackground';
import LoginModal from '@/components/auth/LoginModal';
import { InfoAlert } from '@/components/shared/Alert';
import { COLORS, RADII } from '@/lib/theme/tokens';
import PasswordEntry from './PasswordEntry';
import NameSelect from './NameSelect';

interface PinEntryProps {
  onPinVerified: () => void;
  weddingSlug: string;
  isPreview?: boolean;
}

type Step = 'password' | 'name';

const TTL_MS = 24 * 60 * 60 * 1000;

function readRecentFlag(slug: string, key: string, tsKey: string): string | null {
  if (typeof window === 'undefined') return null;
  const val = localStorage.getItem(`${key}_${slug}`);
  const ts = localStorage.getItem(`${tsKey}_${slug}`);
  if (!val || !ts) return null;
  if (Date.now() - parseInt(ts, 10) > TTL_MS) return null;
  return val;
}

const PinEntry = ({ onPinVerified, weddingSlug, isPreview = false }: PinEntryProps) => {
  const [step, setStep] = useState<Step>('password');
  const [verifiedPassword, setVerifiedPassword] = useState<string>('');
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [showPreviewToast, setShowPreviewToast] = useState(false);

  // Lock-screen customisations
  const [pinEntryText, setPinEntryText] = useState<string | null>(null);
  const [pinEntrySubtitleText, setPinEntrySubtitleText] = useState<string | null>(null);
  const [pinEntryBackground, setPinEntryBackground] = useState('/images/backgrounds/pearl.webp');
  const [pinEntryPrimaryColor, setPinEntryPrimaryColor] = useState<string>(COLORS.text.strong);
  const [pinEntryFontColor, setPinEntryFontColor] = useState<string>(COLORS.text.strong);
  const [pinEntryButtonFontColor, setPinEntryButtonFontColor] = useState<string>(COLORS.bg.white);
  const [coupleName, setCoupleName] = useState('');

  const { wedding: contextWedding } = useWedding();

  // ── Fetch wedding customisations ───────────────────────────────────────
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- wedding row shape from multiple call sites; partial Wedding-or-snapshot
    const apply = (wedding: any) => {
      setCoupleName(wedding.couple_name || '');
      setPinEntryText(wedding.pin_entry_text || '');
      setPinEntrySubtitleText(wedding.pin_entry_subtitle_text || '');
      setPinEntryBackground(wedding.pin_entry_background || '/images/backgrounds/pearl.webp');
      setPinEntryPrimaryColor(wedding.pin_entry_primary_color || COLORS.text.strong);
      setPinEntryFontColor(wedding.pin_entry_font_color || COLORS.text.strong);
      setPinEntryButtonFontColor(wedding.pin_entry_button_font_color || COLORS.bg.white);
    };

    if (contextWedding) {
      apply(contextWedding);
      setIsLoadingSettings(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setIsLoadingSettings(true);
      try {
        const { data: wedding, error } = await supabase
          .from('weddings')
          .select('id, couple_name, pin_entry_text, pin_entry_subtitle_text, pin_entry_background, pin_entry_primary_color, pin_entry_font_color, pin_entry_button_font_color')
          .eq('slug', weddingSlug)
          .single();
        if (!cancelled && !error && wedding) apply(wedding);
      } catch (err) {
        console.error('Error fetching wedding settings:', err);
      } finally {
        if (!cancelled) setIsLoadingSettings(false);
      }
    })();

    return () => { cancelled = true; };
  }, [weddingSlug, contextWedding]);

  // ── On-mount bypass + step resolution ──────────────────────────────────
  useEffect(() => {
    if (isPreview) return;
    if (typeof window === 'undefined') return;

    // Fully verified (password + guest selected, within TTL) → skip straight through.
    const guestId = readRecentFlag(weddingSlug, 'phera_guest_id', 'phera_password_ts');
    if (guestId) {
      onPinVerified();
      return;
    }

    // Password verified but no guest selected yet → resume at name step.
    const pwOk = readRecentFlag(weddingSlug, 'phera_password_ok', 'phera_password_ts');
    if (pwOk === 'true') {
      setStep('name');
      return;
    }

    // Magic link: authenticated users bypass password entirely (still need name selection).
    (async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const magicLink = urlParams.get('magic_link');
      if (magicLink === 'true') {
        const { data: { user: mlUser } } = await supabase.auth.getUser();
        if (mlUser) {
          localStorage.setItem(`phera_password_ok_${weddingSlug}`, 'true');
          localStorage.setItem(`phera_password_ts_${weddingSlug}`, Date.now().toString());
          setStep('name');
        }
      }
    })();
  }, [weddingSlug, isPreview, onPinVerified]);

  // Prevent scroll on lock screen
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  // ── Step handlers ──────────────────────────────────────────────────────
  const handlePasswordSuccess = (password: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`phera_password_ok_${weddingSlug}`, 'true');
      localStorage.setItem(`phera_password_ts_${weddingSlug}`, Date.now().toString());
    }
    setVerifiedPassword(password);
    setStep('name');
  };

  const handleGuestSelect = (guestId: string) => {
    if (typeof window !== 'undefined') {
      const now = Date.now().toString();
      localStorage.setItem(`phera_guest_id_${weddingSlug}`, guestId);
      localStorage.setItem(`phera_password_ts_${weddingSlug}`, now);
      // Legacy compat: downstream code (guest/page.tsx) still reads these.
      localStorage.setItem(`phera_pin_verified_${weddingSlug}`, 'true');
      localStorage.setItem(`phera_pin_timestamp_${weddingSlug}`, now);
    }
    onPinVerified();
  };

  // ── Display text ───────────────────────────────────────────────────────
  const displayText = pinEntryText
    ? pinEntryText.replace(/\{couple_name\}/g, coupleName)
    : coupleName
      ? `Celebrate with ${coupleName}!`
      : "You're Invited!";
  const displaySubtitle = pinEntrySubtitleText
    ? pinEntrySubtitleText.replace(/\{couple_name\}/g, coupleName)
    : 'Enter the password from your invitation to RSVP and see all the details.';

  const isReady = isPreview || !isLoadingSettings;

  return (
    <OptimizedBackground src={pinEntryBackground} className="min-h-screen flex flex-col">
      <Box
        component="img"
        src="/images/overlays/entry-topleft.png"
        alt=""
        sx={{ position: 'absolute', top: 0, left: 0, zIndex: 1, width: { xs: 120, sm: 160, md: 200 }, height: 'auto', pointerEvents: 'none' }}
      />
      <Box
        component="img"
        src="/images/overlays/entry-topright.png"
        alt=""
        sx={{ position: 'absolute', top: 0, right: 0, zIndex: 1, width: { xs: 120, sm: 160, md: 200 }, height: 'auto', pointerEvents: 'none' }}
      />

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
          pt: { xs: 2, sm: 4 },
          pb: { xs: 3, sm: 6 },
          px: { xs: 2.5, sm: 4 },
          gap: { xs: 2.5, sm: 5 },
        }}
      >
        {/* Top: logo + welcome */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ width: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}
        >
          <Box
            component="img"
            src="/logo-stacked.svg"
            alt="Phera"
            sx={{ height: { xs: 96, sm: 112, md: 128 }, width: 'auto', filter: 'brightness(0)' }}
          />
          <Stack spacing={1} alignItems="center" sx={{ width: '100%' }}>
            <Typography
              variant="h1"
              sx={{
                color: pinEntryFontColor,
                lineHeight: 1.1,
                textAlign: 'center',
                fontSize: { xs: '2.25rem', sm: '3rem', md: '3.5rem', lg: '4rem' },
              }}
            >
              {displayText}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: pinEntryFontColor,
                lineHeight: 1.45,
                maxWidth: { xs: 300, sm: 400, lg: 800 },
                mx: 'auto',
                textAlign: 'center',
                px: 1.5,
                fontSize: { xs: '0.875rem', sm: '0.95rem', md: '1rem', lg: '1.125rem' },
              }}
            >
              {step === 'password'
                ? displaySubtitle
                : "Please enter the first and last name of one member of your party below. If you're responding for you and a guest (or your family), you'll be able to RSVP for your entire group on the next page."}
            </Typography>
          </Stack>
        </motion.div>

        {/* Middle: active step */}
        {isReady && step === 'password' && (
          <PasswordEntry
            weddingSlug={weddingSlug}
            isPreview={isPreview}
            primaryColor={pinEntryPrimaryColor}
            fontColor={pinEntryFontColor}
            buttonFontColor={pinEntryButtonFontColor}
            onSuccess={handlePasswordSuccess}
            onPreviewSubmit={() => setShowPreviewToast(true)}
          />
        )}

        {isReady && step === 'name' && (
          <NameSelect
            weddingSlug={weddingSlug}
            password={verifiedPassword}
            isPreview={isPreview}
            primaryColor={pinEntryPrimaryColor}
            fontColor={pinEntryFontColor}
            buttonFontColor={pinEntryButtonFontColor}
            onSelect={handleGuestSelect}
          />
        )}

        {/* Bottom: login option (password step only) */}
        {step === 'password' && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', maxWidth: 354 }}>
              <Box sx={{ flex: 1, height: '1px', bgcolor: COLORS.border.default }} />
              <Typography variant="body2" sx={{ px: 2, color: COLORS.text.subtle, fontSize: '0.875rem', fontWeight: 500 }}>or</Typography>
              <Box sx={{ flex: 1, height: '1px', bgcolor: COLORS.border.default }} />
            </Box>
            <Button
              onClick={() => setLoginDialogOpen(true)}
              sx={{
                backgroundColor: COLORS.bg.white,
                color: COLORS.text.strong,
                borderRadius: RADII.lg,
                px: { xs: 2.5, sm: 3 },
                py: 1.5,
                minHeight: { xs: 48, sm: 52 },
                fontSize: { xs: '0.875rem', sm: '1rem' },
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '6.25%',
                width: '100%',
                maxWidth: 354,
                border: `1px solid ${COLORS.border.default}`,
                boxShadow: 'none',
                '&:hover': {
                  backgroundColor: COLORS.bg.subtle,
                  border: `1px solid ${COLORS.border.strong}`,
                  boxShadow: 'none',
                },
              }}
            >
              Log in with email
            </Button>
          </motion.div>
        )}
      </Container>

      <LoginModal
        open={loginDialogOpen}
        onClose={() => setLoginDialogOpen(false)}
        onSuccess={() => { setLoginDialogOpen(false); onPinVerified(); }}
        redirectTo={`/${weddingSlug}?magic_link=true`}
      />

      <Snackbar
        open={showPreviewToast}
        autoHideDuration={6000}
        onClose={() => setShowPreviewToast(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Box sx={{ maxWidth: 520 }}>
          <InfoAlert>
            In the live site, this would advance to the name selection step once the password matches.
          </InfoAlert>
        </Box>
      </Snackbar>
    </OptimizedBackground>
  );
};

export default PinEntry;
