'use client';

import { Box, Container, Stack, Typography } from '@mui/material';
import {
  Campaign,
  DirectionsBus,
  Forum,
  Language,
  Public,
  WhatsApp,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { COLORS, FONTS } from '@/lib/theme/tokens';

interface IntroFeature {
  icon: React.ReactNode;
  label: string;
}

const FEATURES: IntroFeature[] = [
  { icon: <Language />, label: 'Wedding Website' },
  { icon: <Campaign />, label: 'Guest Outreach' },
  { icon: <DirectionsBus />, label: 'Travel & Shuttles' },
  { icon: <WhatsApp />, label: 'WhatsApp Concierge' },
  { icon: <Forum />, label: 'Vendor Coordinator' },
  { icon: <Public />, label: 'Cultural Briefings' },
];

export default function FeaturesIntro() {
  return (
    <Box
      component="section"
      sx={{
        py: { xs: 8, md: 14 },
        bgcolor: COLORS.bg.white,
      }}
    >
      <Container maxWidth="lg">
        <Stack spacing={{ xs: 3, md: 4 }} sx={{ textAlign: 'center', alignItems: 'center' }}>
          <Typography
            variant="overline"
            sx={{
              color: COLORS.text.strong,
              fontWeight: 800,
              letterSpacing: '2px',
              fontSize: { xs: '0.75rem', md: '0.875rem' },
            }}
          >
            FEATURES
          </Typography>

          <Typography
            variant="h2"
            sx={{
              fontFamily: FONTS.display,
              fontStyle: 'italic',
              fontSize: { xs: '2.25rem', sm: '3rem', md: '4rem' },
              lineHeight: 1.1,
              color: COLORS.text.strong,
              maxWidth: 980,
            }}
          >
            Tools designed to simplify every part of{' '}
            <Box component="span" sx={{ color: COLORS.brand.primary }}>
              Indian wedding planning
            </Box>
          </Typography>

          <Typography
            sx={{
              fontSize: { xs: '1rem', md: '1.15rem' },
              lineHeight: 1.6,
              color: COLORS.text.muted,
              maxWidth: 720,
            }}
          >
            Hundreds of guests, days of events, vendors in eight WhatsApp groups — Phera turns the chaos
            of wedding coordination into something you can actually enjoy.
          </Typography>
        </Stack>

        <Box
          sx={{
            mt: { xs: 6, md: 9 },
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(2, 1fr)',
              sm: 'repeat(3, 1fr)',
              md: 'repeat(6, 1fr)',
            },
            gap: { xs: 4, md: 3 },
            justifyItems: 'center',
          }}
        >
          {FEATURES.map((feature, idx) => (
            <motion.div
              key={feature.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: idx * 0.06 }}
              style={{ width: '100%' }}
            >
              <Stack
                spacing={1.5}
                alignItems="center"
                sx={{
                  textAlign: 'center',
                  px: 1,
                  '& svg': {
                    fontSize: { xs: 36, md: 40 },
                    color: COLORS.brand.primary,
                  },
                }}
              >
                {feature.icon}
                <Typography
                  sx={{
                    fontSize: { xs: '0.85rem', md: '0.95rem' },
                    fontWeight: 600,
                    color: COLORS.text.strong,
                    lineHeight: 1.3,
                    maxWidth: 140,
                  }}
                >
                  {feature.label}
                </Typography>
              </Stack>
            </motion.div>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
