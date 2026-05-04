'use client';

import { Box, Stack } from '@mui/material';
import { ActionButton } from '@/components/admin/ActionButton';
import EyebrowLabel from '@/components/landing/EyebrowLabel';
import SectionContainer from '@/components/landing/SectionContainer';
import { COLORS, FONTS } from '@/lib/theme/tokens';

/**
 * Last section above the footer. Sits on the shared blue-clouds backdrop
 * (set by the parent wrapper in HomePageClient) so this component renders
 * transparent - no Paper card, no inner gradient. Centered eyebrow +
 * display headline + subtitle + two CTAs.
 *
 * Vertical padding is provided by the wrapper Box in HomePageClient via
 * SECTION.py - the inner SectionContainer here adds none.
 */
export default function FinalCTA() {
  return (
    <SectionContainer sx={{ textAlign: 'center' }}>
      <Stack spacing={3} sx={{ alignItems: 'center' }}>
        <EyebrowLabel align="center">One last thing</EyebrowLabel>

        {/* Plain h2 (not Typography variant) so MUI's variant rules don't
            override the clamp() at lg+. */}
        <Box
          component="h2"
          sx={{
            fontFamily: FONTS.display,
            fontStyle: 'italic',
            fontWeight: 400,
            // Design: clamp(48px, 8vw, 120px)
            fontSize: 'clamp(3rem, 8vw, 7.5rem)',
            lineHeight: 0.95,
            letterSpacing: '-0.025em',
            color: COLORS.text.strong,
            maxWidth: '14ch',
            mx: 'auto',
            m: 0,
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
        </Box>

        <Box
          component="p"
          sx={{
            fontFamily: FONTS.body,
            // Design: 18px (subtitle), reduced line-height 1.55 for two-line wraps.
            fontSize: 'clamp(1rem, 1.4vw, 1.125rem)',
            color: COLORS.text.muted,
            maxWidth: '50ch',
            mx: 'auto',
            lineHeight: 1.55,
            m: 0,
          }}
        >
          Spin up a free site in 10 minutes. Upgrade when you&apos;re ready
          for us to take over.
        </Box>

        <Stack
          direction="row"
          spacing="14px"
          sx={{ pt: 1, justifyContent: 'center', flexWrap: 'wrap', rowGap: '14px' }}
        >
          <ActionButton
            href="/auth/login"
            variant="contained"
            sx={{
              bgcolor: COLORS.brand.primary,
              color: 'white',
              padding: '18px 30px',
              borderRadius: '999px',
              fontSize: '17px',
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: 'none',
              transition: 'all 0.25s ease',
              '&:hover': {
                bgcolor: COLORS.brand.primaryHover,
                transform: 'translateY(-1px)',
                boxShadow: '0 12px 28px rgba(222,63,94,0.25)',
              },
            }}
            endIcon={<Box component="span" sx={{ fontSize: '1.05em', lineHeight: 1 }}>→</Box>}
          >
            Get started - it&apos;s free
          </ActionButton>
          <ActionButton
            href="https://wa.me/15558397813"
            variant="outlined"
            keepBackgroundOnLoad
            sx={{
              borderColor: 'rgba(0,0,0,0.18)',
              borderWidth: '1.5px',
              color: COLORS.text.strong,
              padding: '18px 30px',
              borderRadius: '999px',
              fontSize: '17px',
              textTransform: 'none',
              fontWeight: 600,
              bgcolor: 'transparent',
              transition: 'all 0.25s ease',
              '&:hover': {
                borderColor: COLORS.text.strong,
                borderWidth: '1.5px',
                bgcolor: 'rgba(0,0,0,0.02)',
              },
            }}
          >
            Talk to us on WhatsApp
          </ActionButton>
        </Stack>
      </Stack>
    </SectionContainer>
  );
}
