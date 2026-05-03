'use client';

/**
 * Six-step "how it works" strip used between pricing and origin.
 *
 * Desktop: 6 columns side-by-side with a dashed connector behind the
 * numbered chips. Tablet: 3 cols. Mobile: 2 cols, no connector.
 */

import { Box, Container, Stack, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import EyebrowLabel from './EyebrowLabel';
import { COLORS, FONTS } from '@/lib/theme/tokens';

const STEPS = [
  { n: '01', t: 'Bring your guest list', d: 'Spreadsheet, paste, or photo of a notebook. We clean it up and group families.' },
  { n: '02', t: 'Spin up your site', d: 'DIY, AI-assisted, or 1-on-1 with us. Your invitation, schedule, RSVP - live in an afternoon.' },
  { n: '03', t: 'Switch on the bot', d: 'We start outreach on a tuned timeline. The 24/7 reply bot answers in your voice.' },
  { n: '04', t: 'Sort rooms & shuttles', d: 'Upload a floor plan, share hotel blocks. We place guests and route every shuttle.' },
  { n: '05', t: 'Loop us into vendors', d: 'Add us to your vendor WhatsApp groups. We summarize, chase, and surface what matters.' },
  { n: '06', t: 'Show up, celebrate', d: 'Your Control Tower has every flight, room, dietary need, and shuttle. You just enjoy.' },
];

export default function HowItWorks() {
  return (
    <Box
      component="section"
      sx={{
        py: { xs: 8, md: 14 },
        bgcolor: '#F7F1E8',
        position: 'relative',
        isolation: 'isolate',
        // Paisley-cream texture overlay matching the design's `.bg-paisley`
        // rule (opacity 0.18, normal blend so the pattern reads warm but
        // doesn't darken the cream base).
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          backgroundImage: 'url("/images/backgrounds/paisley-cream.webp")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.18,
          zIndex: -1,
          pointerEvents: 'none',
        },
      }}
    >
      <Container
        maxWidth="xl"
        sx={{ px: { xs: 2.5, md: 6, lg: 10 } }}
      >
        <Stack spacing={2} sx={{ mb: { xs: 5, md: 10 }, alignItems: 'flex-start' }}>
          <EyebrowLabel>How it works</EyebrowLabel>
          <Typography
            variant="h2"
            sx={{
              fontFamily: FONTS.display,
              fontStyle: 'italic',
              // Match design's clamp(36px, 5.5vw, 76px) - caps at 4.75rem so
              // the title doesn't outweigh the FeatureStepper headline above.
              fontSize: { xs: '2.25rem', sm: '3rem', md: '4rem', lg: '4.75rem' },
              lineHeight: 1.02,
              color: COLORS.text.strong,
              maxWidth: '18ch',
              textWrap: 'balance',
              letterSpacing: '-0.025em',
            }}
          >
            Six steps, then we take over.
          </Typography>
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(2, 1fr)',
              sm: 'repeat(3, 1fr)',
              md: 'repeat(6, 1fr)',
            },
            rowGap: { xs: 4, md: 0 },
            columnGap: { xs: 2, md: 1 },
            position: 'relative',
          }}
        >
          {/* dashed connector - desktop only */}
          <Box
            aria-hidden
            sx={{
              display: { xs: 'none', md: 'block' },
              position: 'absolute',
              left: '8%',
              right: '8%',
              top: 32,
              height: 0,
              borderTop: '1.5px dashed rgba(0,0,0,0.15)',
              zIndex: 0,
            }}
          />
          {STEPS.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: Math.min(i * 0.08, 0.4) }}
              style={{ position: 'relative', zIndex: 1 }}
            >
              <Stack
                spacing={1.5}
                sx={{ alignItems: 'center', textAlign: 'center', px: { xs: 0.5, md: 1 } }}
              >
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    bgcolor: COLORS.bg.white,
                    border: '1px solid rgba(0,0,0,0.08)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: FONTS.display,
                    fontStyle: 'italic',
                    fontSize: '1.65rem',
                    color: COLORS.brand.primary,
                  }}
                >
                  {s.n}
                </Box>
                <Typography
                  sx={{
                    fontSize: { xs: '0.95rem', md: '1rem' },
                    fontWeight: 600,
                    color: COLORS.text.strong,
                    lineHeight: 1.3,
                    mt: 1.5,
                  }}
                >
                  {s.t}
                </Typography>
                <Typography
                  sx={{
                    fontSize: { xs: '0.825rem', md: '0.85rem' },
                    color: COLORS.text.subtle,
                    lineHeight: 1.5,
                    maxWidth: 200,
                  }}
                >
                  {s.d}
                </Typography>
              </Stack>
            </motion.div>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
