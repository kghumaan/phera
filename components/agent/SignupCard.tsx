'use client';

import { useState } from 'react';
import { Box, Checkbox, Divider, Stack, Typography } from '@mui/material';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import { supabase } from '@/lib/supabase/client';
import { weddingService } from '@/lib/supabase/wedding-service';
import { generateGuestAvatar } from '@/lib/utils/avatar-generator';
import { PheraTextField } from '@/components/shared/TextField';
import { PrimaryActionButton, SecondaryActionButton } from '@/components/admin/ActionButton';
import OtpInput from '@/components/ui/OtpInput';
import { COLORS, EXTERNAL_BRAND, RADII } from '@/lib/theme/tokens';

/** Stash checked on return from the Google OAuth round-trip so the chat can
 *  tell the agent the account was created (the email flow never leaves the page). */
export const SIGNUP_INFLIGHT_KEY = 'phera-signup-inflight';

function GoogleGlyph() {
  return (
    <Box component="svg" viewBox="0 0 24 24" sx={{ width: 18, height: 18 }} aria-hidden>
      <path
        fill={EXTERNAL_BRAND.googleBlue}
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
      />
      <path
        fill={EXTERNAL_BRAND.googleGreen}
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill={EXTERNAL_BRAND.googleYellow}
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"
      />
      <path
        fill={EXTERNAL_BRAND.googleRed}
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </Box>
  );
}

/** Best-effort post-signup housekeeping — mirrors what the standalone signup
 *  pages do. Never blocks the conversion on a failure. */
async function completeAccountSetup(userId: string, email: string) {
  try {
    const avatar = generateGuestAvatar(email);
    await supabase.from('user_settings').upsert(
      {
        user_id: userId,
        avatar_style: avatar.style,
        avatar_seed: avatar.seed,
        avatar_svg: avatar.svg,
        avatar_color: avatar.color,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      } as never,
      { onConflict: 'user_id' }
    );
  } catch {
    /* avatar polish is optional */
  }
  try {
    await weddingService.processInvitesForUser(email, userId);
  } catch {
    /* non-fatal */
  }
}

export interface SignupCardProps {
  weddingSlug: string;
  /** The free anonymous allowance is used up — copy gets firmer. */
  required?: boolean;
  disabled?: boolean;
  /** Fired once the account exists (email flow only — Google round-trips). */
  onComplete: (email: string | null) => void;
}

/**
 * Inline create-account card for anonymous (pre-signup) planner sessions.
 * The visitor converts their anonymous Supabase user into a real account
 * WITHOUT leaving the chat: same user id, so the draft wedding and this
 * conversation carry over with zero re-keying. Email+password uses
 * auth.updateUser (with an email-change OTP when confirmation is on);
 * Google uses linkIdentity (a full OAuth round-trip back to this page).
 */
export function SignupCard({ weddingSlug, required, disabled, onComplete }: SignupCardProps) {
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const friendlyAuthError = (message: string): string => {
    const m = message.toLowerCase();
    if (m.includes('already') && (m.includes('registered') || m.includes('exists') || m.includes('in use'))) {
      return 'That email already has a Phera account. Use a different email here — this preview can\'t merge into an existing account yet.';
    }
    if (m.includes('password')) return 'Password needs to be at least 6 characters.';
    if (m.includes('invalid') && m.includes('email')) return 'That email doesn\'t look right — double-check it?';
    return message;
  };

  const submitEmail = async () => {
    setError(null);
    if (!acceptedTerms) {
      setError('Please accept the Terms & Privacy Policy first.');
      return;
    }
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Enter the email you want to use.');
      return;
    }
    if (password.length < 6) {
      setError('Password needs to be at least 6 characters.');
      return;
    }
    setBusy(true);
    try {
      const { data, error: updateError } = await supabase.auth.updateUser({
        email: cleanEmail,
        password,
      });
      if (updateError) {
        setError(friendlyAuthError(updateError.message));
        return;
      }
      // Email confirmation on → the address stays in new_email until the
      // 6-digit code from the email is verified.
      const pendingConfirmation = !!(data.user as { new_email?: string | null })?.new_email;
      if (pendingConfirmation) {
        setStep('otp');
        return;
      }
      if (data.user) await completeAccountSetup(data.user.id, cleanEmail);
      onComplete(cleanEmail);
    } catch {
      setError('Something went wrong creating your account — please try again.');
    } finally {
      setBusy(false);
    }
  };

  const submitOtp = async () => {
    setError(null);
    if (code.length < 6) return;
    setBusy(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: code,
        type: 'email_change',
      });
      if (verifyError) {
        setError('That code didn\'t match — check the email and try again.');
        return;
      }
      if (data.user) await completeAccountSetup(data.user.id, cleanEmail);
      onComplete(cleanEmail);
    } catch {
      setError('Something went wrong verifying the code — please try again.');
    } finally {
      setBusy(false);
    }
  };

  const resendOtp = async () => {
    setError(null);
    try {
      await supabase.auth.resend({ type: 'email_change', email: email.trim().toLowerCase() });
    } catch {
      /* the verify error path covers it */
    }
  };

  const signUpWithGoogle = async () => {
    setError(null);
    if (!acceptedTerms) {
      setError('Please accept the Terms & Privacy Policy first.');
      return;
    }
    setBusy(true);
    try {
      // Google leaves the page — remember why, so the chat can tell the agent
      // the account was created when we land back here after the callback.
      try {
        window.sessionStorage.setItem(SIGNUP_INFLIGHT_KEY, weddingSlug);
      } catch {
        /* private mode */
      }
      const callbackUrl = new URL('/auth/callback', window.location.origin);
      callbackUrl.searchParams.set('redirect', `/admin/${weddingSlug}/assistant?welcome=1`);
      const { error: linkError } = await supabase.auth.linkIdentity({
        provider: 'google',
        options: { redirectTo: callbackUrl.toString() },
      });
      if (linkError) {
        setError('Google sign-up isn\'t available right now — use email and password instead.');
        setBusy(false);
      }
      // On success the browser navigates away; no further state changes here.
    } catch {
      setError('Google sign-up isn\'t available right now — use email and password instead.');
      setBusy(false);
    }
  };

  return (
    <Box
      sx={{
        alignSelf: 'flex-start',
        width: '100%',
        maxWidth: 440,
        border: `1px solid ${COLORS.brand.primaryBorder}`,
        bgcolor: COLORS.brand.primaryWash,
        borderRadius: RADII.lg,
        p: 2,
      }}
    >
      <Stack direction="row" spacing={0.75} alignItems="center" mb={0.5}>
        <AutoAwesomeRoundedIcon sx={{ color: COLORS.brand.primary, fontSize: 18 }} />
        <Typography variant="body2" sx={{ color: COLORS.text.strong, fontWeight: 700 }}>
          {required ? 'Create your free account to keep going' : 'Save your wedding — create your free account'}
        </Typography>
      </Stack>
      <Typography variant="body2" sx={{ color: COLORS.text.muted, mb: 1.5 }}>
        Everything we&apos;ve set up together stays exactly as it is — you just get a way back in, from
        any device.
      </Typography>

      {step === 'otp' ? (
        <Stack spacing={1.5}>
          <Typography variant="body2" sx={{ color: COLORS.text.strong }}>
            We emailed a 6-digit code to <strong>{email.trim().toLowerCase()}</strong> — enter it here.
          </Typography>
          <OtpInput value={code} onChange={setCode} disabled={busy || disabled} />
          <Stack direction="row" spacing={1} alignItems="center">
            <PrimaryActionButton size="small" onClick={() => void submitOtp()} disabled={busy || disabled || code.length < 6}>
              Verify & finish
            </PrimaryActionButton>
            <Typography
              component="button"
              type="button"
              variant="caption"
              onClick={() => void resendOtp()}
              sx={{
                border: 'none',
                background: 'none',
                p: 0,
                color: COLORS.brand.primary,
                cursor: 'pointer',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              Resend code
            </Typography>
          </Stack>
          {error && (
            <Typography variant="caption" sx={{ color: COLORS.accent.dangerText }}>
              {error}
            </Typography>
          )}
        </Stack>
      ) : (
        <Stack spacing={1.25}>
          <SecondaryActionButton
            size="small"
            onClick={() => void signUpWithGoogle()}
            disabled={busy || disabled}
            startIcon={<GoogleGlyph />}
            sx={{ bgcolor: COLORS.bg.white, justifyContent: 'center' }}
          >
            Continue with Google
          </SecondaryActionButton>
          <Divider sx={{ '&::before, &::after': { borderColor: COLORS.border.light } }}>
            <Typography variant="caption" sx={{ color: COLORS.text.subtle }}>
              or
            </Typography>
          </Divider>
          <PheraTextField
            size="small"
            type="email"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={busy || disabled}
            autoComplete="email"
            fullWidth
          />
          <PheraTextField
            size="small"
            type="password"
            placeholder="Choose a password (6+ characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void submitEmail();
              }
            }}
            disabled={busy || disabled}
            autoComplete="new-password"
            fullWidth
          />
          <Stack direction="row" alignItems="flex-start" spacing={0.5}>
            <Checkbox
              size="small"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              disabled={busy || disabled}
              sx={{ p: 0.25, color: COLORS.text.subtle, '&.Mui-checked': { color: COLORS.brand.primary } }}
            />
            <Typography variant="caption" sx={{ color: COLORS.text.muted, pt: 0.25 }}>
              I agree to the{' '}
              <Box component="a" href="/terms" target="_blank" sx={{ color: COLORS.brand.primary }}>
                Terms
              </Box>{' '}
              &{' '}
              <Box component="a" href="/privacy" target="_blank" sx={{ color: COLORS.brand.primary }}>
                Privacy Policy
              </Box>
            </Typography>
          </Stack>
          <Box>
            <PrimaryActionButton size="small" onClick={() => void submitEmail()} disabled={busy || disabled} loading={busy}>
              Create my account
            </PrimaryActionButton>
          </Box>
          {error && (
            <Typography variant="caption" sx={{ color: COLORS.accent.dangerText }}>
              {error}
            </Typography>
          )}
        </Stack>
      )}
    </Box>
  );
}
