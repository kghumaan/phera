import type { Metadata } from 'next';
import Link from 'next/link';
import { Box, Stack, Typography } from '@mui/material';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import AppHeader from '@/components/shared/AppHeader';
import AppFooter from '@/components/shared/AppFooter';
import { COLORS, FONTS, RADII } from '@/lib/theme/tokens';
import { PLANNER_TIER } from '@/lib/pricing/tiers';

export const metadata: Metadata = {
  title: { absolute: 'Phera for Wedding Planners' },
  description:
    `Run every NRI wedding from one account. Pay-per-wedding (${PLANNER_TIER.price}), no subscription — unlimited clients under one login, with everything in Phera Base for each. Resell to your couples at your own rate.`,
  alternates: { canonical: '/planners' },
  openGraph: {
    type: 'website',
    title: 'Phera for Wedding Planners',
    description:
      `Pay-per-wedding ops for planners running multiple NRI weddings. ${PLANNER_TIER.price}${PLANNER_TIER.priceSuffix}, no subscription. You stay the face; we run the guest logistics.`,
    url: '/planners',
  },
};

const PLANNER_LOGIN = '/auth/login?role=planner';
const BOOK_A_CALL = 'https://wa.me/15558397813';

const STEPS = [
  { n: '01', t: 'Create your planner account', d: 'One login for every couple you take on — no per-wedding setup tax.' },
  { n: '02', t: 'Add a wedding, card on file', d: 'Your card is saved after the first. Every wedding after is one click to confirm and charge.' },
  { n: '03', t: 'We run the guest ops', d: 'Outreach, RSVPs, rooms, travel, the WhatsApp concierge — handled. You stay the face your couples see.' },
];

export default function PlannersPage() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: COLORS.bg.paper, display: 'flex', flexDirection: 'column' }}>
      <AppHeader variant="solid" />

      <Box component="main" sx={{ flexGrow: 1, pt: { xs: 11, md: 13 } }}>
        {/* Hero */}
        <Box sx={{ maxWidth: 820, mx: 'auto', px: { xs: 2.5, md: 4 }, pt: { xs: 4, md: 6 }, pb: { xs: 4, md: 5 }, textAlign: 'center' }}>
          <Typography variant="subtitleCaps" sx={{ color: COLORS.brand.primary, display: 'block', mb: 1.5 }}>
            For wedding planners
          </Typography>
          <Typography variant="h2" sx={{ color: COLORS.text.strong, mb: 2 }}>
            Run every wedding from one account.
          </Typography>
          <Typography variant="body1" sx={{ color: COLORS.text.muted, maxWidth: 640, mx: 'auto', mb: 4 }}>
            Phera for planners is pay-per-wedding — <strong>{PLANNER_TIER.price}{PLANNER_TIER.priceSuffix}</strong>, no
            subscription. Manage unlimited clients under one login, with everything in Phera Base for each. You stay
            their planner; we&apos;re the ops team behind you.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="center" alignItems="center">
            <Box
              component={Link}
              href={PLANNER_LOGIN}
              sx={{
                px: 3.5, py: 1.5, borderRadius: RADII.pill,
                bgcolor: COLORS.brand.primary, color: 'white',
                fontFamily: FONTS.body, fontWeight: 600, fontSize: '1rem', textDecoration: 'none',
                transition: 'background 0.18s ease',
                '&:hover': { bgcolor: COLORS.brand.primaryHover },
              }}
            >
              Start as a planner →
            </Box>
            <Box
              component="a"
              href={BOOK_A_CALL}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                px: 3.5, py: 1.5, borderRadius: RADII.pill,
                border: '1.5px solid rgba(0,0,0,0.14)', bgcolor: 'white', color: COLORS.text.strong,
                fontFamily: FONTS.body, fontWeight: 600, fontSize: '1rem', textDecoration: 'none',
                transition: 'border-color 0.18s ease, color 0.18s ease',
                '&:hover': { borderColor: COLORS.brand.primary, color: COLORS.brand.primary },
              }}
            >
              Book a call
            </Box>
          </Stack>
        </Box>

        {/* How it works */}
        <Box sx={{ maxWidth: 1040, mx: 'auto', px: { xs: 2.5, md: 4 }, py: { xs: 4, md: 6 } }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2.5 }}>
            {STEPS.map((s) => (
              <Box
                key={s.n}
                sx={{ bgcolor: 'white', borderRadius: RADII.lg, border: '1px solid rgba(0,0,0,0.07)', p: 3 }}
              >
                <Typography sx={{ fontFamily: FONTS.display, fontStyle: 'italic', fontSize: '2rem', color: COLORS.brand.primary, lineHeight: 1, mb: 1.5 }}>
                  {s.n}
                </Typography>
                <Typography sx={{ fontFamily: FONTS.body, fontWeight: 600, fontSize: '1rem', color: COLORS.text.strong, mb: 0.75 }}>
                  {s.t}
                </Typography>
                <Typography variant="body2" sx={{ color: COLORS.text.muted, lineHeight: 1.55 }}>
                  {s.d}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* What you get + price */}
        <Box sx={{ maxWidth: 1040, mx: 'auto', px: { xs: 2.5, md: 4 }, py: { xs: 4, md: 6 } }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1.3fr 1fr' },
              gap: { xs: 3, md: 5 },
              alignItems: 'center',
              bgcolor: 'white',
              border: '1px solid rgba(0,0,0,0.07)',
              borderRadius: RADII.lg,
              p: { xs: 3, md: 5 },
            }}
          >
            <Box>
              <Typography variant="subtitleCaps" sx={{ color: COLORS.brand.primary, display: 'block', mb: 1.5 }}>
                What you get
              </Typography>
              <Stack spacing={1.25}>
                {PLANNER_TIER.features.map((f) => (
                  <Stack key={f} direction="row" spacing={1.25} alignItems="flex-start">
                    <CheckRoundedIcon sx={{ fontSize: 18, color: COLORS.brand.primary, mt: '2px', flexShrink: 0 }} />
                    <Typography sx={{ fontFamily: FONTS.body, fontSize: '0.95rem', color: COLORS.text.strong }}>
                      {f}
                    </Typography>
                  </Stack>
                ))}
                <Stack direction="row" spacing={1.25} alignItems="flex-start">
                  <CheckRoundedIcon sx={{ fontSize: 18, color: COLORS.brand.primary, mt: '2px', flexShrink: 0 }} />
                  <Typography sx={{ fontFamily: FONTS.body, fontSize: '0.95rem', color: COLORS.text.strong }}>
                    Couples still see Phera (no white-label) — you stay their planner, we stay behind the scenes.
                  </Typography>
                </Stack>
              </Stack>
            </Box>
            <Box sx={{ textAlign: { xs: 'left', md: 'center' } }}>
              <Stack direction="row" spacing={0.5} alignItems="baseline" justifyContent={{ xs: 'flex-start', md: 'center' }}>
                <Typography sx={{ fontFamily: FONTS.display, fontStyle: 'italic', fontSize: { xs: '3rem', md: '3.5rem' }, color: COLORS.text.strong, lineHeight: 1 }}>
                  {PLANNER_TIER.price}
                </Typography>
                <Typography sx={{ fontFamily: FONTS.body, fontSize: '0.95rem', color: COLORS.text.subtle }}>
                  {PLANNER_TIER.priceSuffix}
                </Typography>
              </Stack>
              <Typography variant="body2" sx={{ color: COLORS.text.muted, mt: 1, mb: 2.5 }}>
                No subscription. Pay only when you take on a wedding.
              </Typography>
              <Box
                component={Link}
                href={PLANNER_LOGIN}
                sx={{
                  display: 'inline-block',
                  px: 3.5, py: 1.5, borderRadius: RADII.pill,
                  bgcolor: COLORS.brand.primary, color: 'white',
                  fontFamily: FONTS.body, fontWeight: 600, fontSize: '0.95rem', textDecoration: 'none',
                  transition: 'background 0.18s ease',
                  '&:hover': { bgcolor: COLORS.brand.primaryHover },
                }}
              >
                Start as a planner →
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Talk to us */}
        <Box sx={{ maxWidth: 720, mx: 'auto', px: { xs: 2.5, md: 4 }, py: { xs: 4, md: 6 }, textAlign: 'center' }}>
          <Typography variant="h3" sx={{ color: COLORS.text.strong, mb: 1.5 }}>
            Running 10+ weddings a year?
          </Typography>
          <Typography variant="body1" sx={{ color: COLORS.text.muted, mb: 3 }}>
            Let&apos;s talk volume pricing and how Phera fits your workflow. We usually reply within the day.
          </Typography>
          <Box
            component="a"
            href={BOOK_A_CALL}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              display: 'inline-block',
              px: 3.5, py: 1.5, borderRadius: RADII.pill,
              border: '1.5px solid rgba(0,0,0,0.14)', bgcolor: 'white', color: COLORS.text.strong,
              fontFamily: FONTS.body, fontWeight: 600, fontSize: '1rem', textDecoration: 'none',
              transition: 'border-color 0.18s ease, color 0.18s ease',
              '&:hover': { borderColor: COLORS.brand.primary, color: COLORS.brand.primary },
            }}
          >
            Book a call
          </Box>
        </Box>
      </Box>

      <AppFooter />
    </Box>
  );
}
