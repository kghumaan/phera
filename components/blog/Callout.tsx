import React from 'react';
import { Box, Typography } from '@mui/material';
import { COLORS, RADII, FONTS, TEXT } from '@/lib/theme/tokens';

type CalloutTone = 'note' | 'tip' | 'warning' | 'honest';

/** `honest` is deliberate: posts about the AI planner need a way to say
 *  "here is what it does NOT do" without it reading as a downside. */
const TONES: Record<
  CalloutTone,
  { bg: string; border: string; label: string; labelColor: string }
> = {
  note: {
    bg: COLORS.accent.infoBg,
    border: `${COLORS.accent.info}33`,
    label: 'Note',
    labelColor: COLORS.accent.infoText,
  },
  tip: {
    bg: COLORS.accent.successBg,
    border: `${COLORS.accent.success}33`,
    label: 'Tip',
    labelColor: COLORS.accent.successText,
  },
  warning: {
    bg: COLORS.accent.warningBg,
    border: `${COLORS.accent.warning}33`,
    label: 'Heads up',
    labelColor: COLORS.accent.warningText,
  },
  honest: {
    bg: COLORS.brand.primaryWash,
    border: COLORS.brand.primaryBorder,
    label: 'Straight answer',
    labelColor: COLORS.brand.primary,
  },
};

interface CalloutProps {
  tone?: CalloutTone;
  /** Overrides the tone's default label. */
  title?: string;
  children: React.ReactNode;
}

export default function Callout({ tone = 'note', title, children }: CalloutProps) {
  const t = TONES[tone];

  return (
    <Box
      sx={{
        my: 5,
        px: { xs: 2.5, sm: 3 },
        py: 2.5,
        borderRadius: RADII.lg,
        bgcolor: t.bg,
        border: `1px solid ${t.border}`,
      }}
    >
      <Typography
        sx={{
          fontFamily: FONTS.body,
          fontSize: TEXT.sm,
          fontWeight: 600,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: t.labelColor,
          mb: 1,
        }}
      >
        {title ?? t.label}
      </Typography>
      <Box
        sx={{
          fontFamily: FONTS.body,
          fontSize: TEXT.base,
          color: COLORS.text.muted,
          lineHeight: 1.65,
          '& p': { m: 0 },
          '& p + p': { mt: 1.5 },
          '& a': { color: COLORS.brand.primary, textDecoration: 'underline' },
          '& strong': { color: COLORS.text.strong, fontWeight: 600 },
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
