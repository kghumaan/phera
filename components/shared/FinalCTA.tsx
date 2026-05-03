'use client';

import { Box, Container, Typography, Stack } from '@mui/material';
import { ActionButton } from '@/components/admin/ActionButton';
import EyebrowLabel from '@/components/landing/EyebrowLabel';
import { COLORS, FONTS } from '@/lib/theme/tokens';

/**
 * Last section above the footer. Sits on the shared blue-clouds backdrop
 * (set by the parent wrapper in HomePageClient) so this component renders
 * transparent — no Paper card, no inner gradient. Centered eyebrow +
 * display headline + subtitle + two CTAs.
 */
export default function FinalCTA() {
  return (
    <Container
      maxWidth="xl"
      sx={{
        px: { xs: 2.5, md: 6, lg: 10 },
        pb: { xs: 6, md: 10 },
        pt: { xs: 6, md: 10 },
        textAlign: 'center',
      }}
    >
      <Stack spacing={3} sx={{ alignItems: 'center' }}>
        <EyebrowLabel align="center">One last thing</EyebrowLabel>

        <Typography
          variant="h2"
          sx={{
            fontFamily: FONTS.display,
            fontStyle: 'italic',
            // Match design's clamp(48px, 8vw, 120px) — capped lower so it
            // doesn't dwarf section titles above.
            fontSize: { xs: '2.75rem', sm: '3.75rem', md: '5.5rem', lg: '6.5rem' },
            lineHeight: 0.95,
            letterSpacing: '-0.025em',
            color: COLORS.text.strong,
            maxWidth: '14ch',
            mx: 'auto',
            textWrap: 'balance',
          }}
        >
          Stop chasing.
          <br />
          Start{' '}
          <Box component="em" sx={{ color: COLORS.brand.primary, fontStyle: 'italic' }}>
            celebrating
          </Box>
          .
        </Typography>

        <Typography
          sx={{
            fontSize: { xs: '1rem', md: '1.15rem' },
            color: COLORS.text.muted,
            maxWidth: '50ch',
            mx: 'auto',
            lineHeight: 1.55,
          }}
        >
          Spin up a free site in 10 minutes. Upgrade when you&apos;re ready
          for us to take over.
        </Typography>

        <Stack
          direction={{ xs: 'row', sm: 'row' }}
          spacing={1.5}
          sx={{ pt: { xs: 1, md: 2 }, justifyContent: 'center', flexWrap: 'wrap', rowGap: 1.5 }}
        >
          <ActionButton
            href="/auth/login"
            variant="contained"
            keepBackgroundOnLoad
            sx={{
              bgcolor: COLORS.brand.primary,
              color: 'white',
              px: { xs: 2.5, md: 4 },
              py: { xs: 1, md: 1.5 },
              minHeight: { xs: 44, md: 56 },
              borderRadius: '999px',
              fontSize: { xs: '0.875rem', md: '1.05rem' },
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: '0 6px 18px rgba(222,63,94,0.18)',
              '&:hover': {
                bgcolor: COLORS.brand.primaryHover,
                boxShadow: '0 12px 28px rgba(222,63,94,0.25)',
              },
            }}
            endIcon={<Box component="span" sx={{ fontSize: '1.1em', lineHeight: 1 }}>→</Box>}
          >
            Get started - it&apos;s free
          </ActionButton>
          <ActionButton
            href="https://wa.me/15558397813"
            variant="outlined"
            keepBackgroundOnLoad
            sx={{
              borderColor: 'rgba(0,0,0,0.18)',
              color: COLORS.text.strong,
              px: { xs: 2.5, md: 4 },
              py: { xs: 1, md: 1.5 },
              minHeight: { xs: 44, md: 56 },
              borderRadius: '999px',
              fontSize: { xs: '0.875rem', md: '1.05rem' },
              textTransform: 'none',
              fontWeight: 600,
              bgcolor: 'transparent',
              '&:hover': {
                borderColor: COLORS.text.strong,
                bgcolor: 'rgba(0,0,0,0.02)',
              },
            }}
          >
            Talk to us on WhatsApp
          </ActionButton>
        </Stack>
      </Stack>
    </Container>
  );
}
