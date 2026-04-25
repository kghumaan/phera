'use client';

import { Box, Button, Stack, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { PheraPasswordField } from '@/components/shared/PasswordField';
import { guestTextFieldSx } from '@/lib/constants/form-styles';
import { COLORS, RADII } from '@/lib/theme/tokens';

export interface PasswordEntryProps {
  weddingSlug: string;
  isPreview?: boolean;
  /** Couple's chosen brand colour for buttons + error accents. */
  primaryColor?: string;
  /** Text colour for headings/subtitles on the lock screen. */
  fontColor?: string;
  /** Colour for text INSIDE the primary button. */
  buttonFontColor?: string;
  onSuccess: (password: string) => void;
  /** Fired when the user clicks submit in preview mode. */
  onPreviewSubmit?: () => void;
}

export default function PasswordEntry({
  weddingSlug,
  isPreview = false,
  primaryColor = COLORS.brand.primary,
  buttonFontColor = COLORS.bg.white,
  onSuccess,
  onPreviewSubmit,
}: PasswordEntryProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [rateLimit, setRateLimit] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = password.trim().length > 0 && !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    if (isPreview) {
      onPreviewSubmit?.();
      return;
    }

    setSubmitting(true);
    setError(null);
    setRateLimit(null);
    try {
      const res = await fetch('/api/access/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weddingSlug, password: password.trim() }),
      });
      const data = await res.json();

      if (res.status === 429) {
        setRateLimit(data.error || 'Too many attempts. Please wait and try again.');
        return;
      }
      if (!res.ok || !data.valid) {
        setError(data.error || 'Incorrect password. Please try again.');
        return;
      }
      onSuccess(password.trim());
    } catch (err) {
      console.error('Password verify error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}
    >
      <Box sx={{ width: '100%', maxWidth: { xs: 354, lg: 420 } }}>
        <PheraPasswordField
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError(null);
            setRateLimit(null);
          }}
          placeholder="Password"
          fullWidth
          autoFocus
          adminStyle={false}
          sx={guestTextFieldSx(primaryColor)}
          inputProps={{ 'aria-label': 'Wedding password' }}
        />
      </Box>

      {error && !rateLimit && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          <Typography
            variant="body2"
            sx={{
              color: primaryColor,
              fontWeight: 600,
              fontSize: { xs: '0.9rem', sm: '1rem' },
              textAlign: 'center',
              backgroundColor: `${primaryColor}15`,
              px: 3,
              py: 1,
              borderRadius: RADII.pill,
              border: `1px solid ${primaryColor}33`,
            }}
          >
            {error}
          </Typography>
        </motion.div>
      )}

      {rateLimit && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          <Typography
            variant="body2"
            sx={{
              color: COLORS.accent.warningText,
              fontWeight: 600,
              fontSize: { xs: '0.9rem', sm: '1rem' },
              textAlign: 'center',
              backgroundColor: COLORS.accent.warningBg,
              px: 3,
              py: 1,
              borderRadius: RADII.pill,
              border: `1px solid ${COLORS.accent.warning}`,
            }}
          >
            {rateLimit}
          </Typography>
        </motion.div>
      )}

      <Button
        type="submit"
        disabled={!canSubmit}
        sx={{
          backgroundColor: primaryColor,
          color: buttonFontColor,
          borderRadius: RADII.md,
          px: { xs: 2.5, sm: 3 },
          py: 1.5,
          minHeight: { xs: 48, sm: 52 },
          fontSize: { xs: '0.875rem', sm: '1rem' },
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '6.25%',
          width: '100%',
          maxWidth: { xs: 354, lg: 420 },
          boxShadow: 'none',
          '&:hover': {
            backgroundColor: primaryColor,
            filter: 'brightness(0.95)',
            boxShadow: 'none',
          },
          '&.Mui-disabled': {
            backgroundColor: COLORS.border.default,
            color: COLORS.text.inverse,
          },
        }}
      >
        {submitting ? 'Checking…' : 'Submit'}
      </Button>

      <Stack sx={{ minHeight: 4 }} />
    </motion.form>
  );
}
