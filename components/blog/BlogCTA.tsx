import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import Link from 'next/link';
import { COLORS, RADII, FONTS, TEXT } from '@/lib/theme/tokens';

interface BlogCTAProps {
  title: string;
  body?: string;
  /** Defaults to the signup path every other post CTA uses. */
  href?: string;
  label?: string;
  /** Optional second, lower-emphasis action (e.g. "See how planners use it"). */
  secondaryHref?: string;
  secondaryLabel?: string;
}

/** Inline mid-post CTA. Distinct from the hardcoded card that
 *  app/blog/[slug]/page.tsx already appends to the end of every post. */
export default function BlogCTA({
  title,
  body,
  href = '/auth/login',
  label = 'Get started for free',
  secondaryHref,
  secondaryLabel,
}: BlogCTAProps) {
  return (
    <Box
      sx={{
        my: 6,
        px: { xs: 3, sm: 4 },
        py: { xs: 3.5, sm: 4 },
        borderRadius: RADII.xl,
        bgcolor: COLORS.bg.paper,
        border: `1px solid ${COLORS.border.light}`,
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
          mb: body ? 1.25 : 2.5,
        }}
      >
        {title}
      </Typography>

      {body && (
        <Typography
          sx={{
            fontFamily: FONTS.body,
            fontSize: TEXT.base,
            color: COLORS.text.muted,
            lineHeight: 1.65,
            maxWidth: 520,
            mx: 'auto',
            mb: 3,
          }}
        >
          {body}
        </Typography>
      )}

      <Box
        sx={{
          display: 'flex',
          gap: 1.5,
          justifyContent: 'center',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <Link href={href} className="no-underline">
          <Button
            variant="contained"
            disableElevation
            endIcon={<ArrowForwardIcon sx={{ fontSize: 18 }} />}
            sx={{
              bgcolor: COLORS.brand.primary,
              color: COLORS.text.inverse,
              textTransform: 'none',
              borderRadius: RADII.cta,
              fontFamily: FONTS.body,
              fontSize: TEXT.base,
              fontWeight: 500,
              px: 3.5,
              py: 1.25,
              '&:hover': { bgcolor: COLORS.brand.primaryHover },
            }}
          >
            {label}
          </Button>
        </Link>

        {secondaryHref && secondaryLabel && (
          <Link href={secondaryHref} className="no-underline">
            <Button
              variant="text"
              sx={{
                color: COLORS.text.muted,
                textTransform: 'none',
                borderRadius: RADII.cta,
                fontFamily: FONTS.body,
                fontSize: TEXT.base,
                fontWeight: 500,
                px: 2.5,
                py: 1.25,
                '&:hover': { color: COLORS.brand.primary, bgcolor: 'transparent' },
              }}
            >
              {secondaryLabel}
            </Button>
          </Link>
        )}
      </Box>
    </Box>
  );
}
