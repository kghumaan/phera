'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import { COLORS, RADII, FONTS, TEXT } from '@/lib/theme/tokens';
import HeroPlannerChat from '@/components/landing/HeroPlannerChat';

interface PlannerChatEmbedProps {
  title?: string;
  subtitle?: string;
  /** Anchor target — ChatDemo footer CTAs link here with "#try-the-planner". */
  id?: string;
}

/**
 * The REAL planner chat box, embedded in a blog post — not a replay.
 *
 * This is the same <HeroPlannerChat /> the landing hero uses: typing here
 * mints an anonymous Supabase session, creates a draft wedding, and drops the
 * reader into a live planner conversation with their message replayed as the
 * opening turn. No signup.
 *
 * If anonymous sign-ins are disabled on the Supabase project, HeroPlannerChat
 * falls back to /auth/signup on its own and the typed message survives — so
 * this stays safe to ship before the dashboard toggles are flipped.
 */
export default function PlannerChatEmbed({
  title = 'Try it right here',
  subtitle = 'Type what’s actually on your mind. No account, no card — you’ll land in a live planner session.',
  id = 'try-the-planner',
}: PlannerChatEmbedProps) {
  return (
    <Box
      id={id}
      sx={{
        my: 6,
        scrollMarginTop: 24,
        px: { xs: 3, sm: 4 },
        py: { xs: 4, sm: 5 },
        borderRadius: RADII.xl,
        bgcolor: COLORS.bg.paper,
        border: `1px solid ${COLORS.brand.primaryBorder}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      <Typography
        sx={{
          fontFamily: FONTS.display,
          fontStyle: 'italic',
          fontSize: { xs: TEXT['2xl'], md: TEXT['3xl'] },
          color: COLORS.text.strong,
          lineHeight: 1.25,
          mb: 1,
        }}
      >
        {title}
      </Typography>
      <Typography
        sx={{
          fontFamily: FONTS.body,
          fontSize: TEXT.base,
          color: COLORS.text.muted,
          lineHeight: 1.6,
          maxWidth: 520,
          mb: 3,
        }}
      >
        {subtitle}
      </Typography>

      <HeroPlannerChat />
    </Box>
  );
}
