'use client';
/* eslint-disable no-restricted-syntax, @typescript-eslint/no-unused-vars */
// Renamed verbatim from app/page.tsx as part of SEO step 3b (server-shell split for metadata).
// Pre-existing inline hex colors and unused imports are grandfathered here pending the design-system token migration.

import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  Paper,
  Grid,
  useTheme,
  alpha,
  Chip,
  Card,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Avatar,
  Dialog,
} from '@mui/material';
import { useState, useRef, useEffect, useMemo, Suspense } from 'react';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { useRouter } from 'next/navigation';
import HomePostAuthModalOpener from './HomePostAuthModalOpener';
import Link from 'next/link';
import Image from 'next/image';
import {
  SentimentDissatisfied,
  Warning,
  Instagram,
  Twitter,
  LinkedIn,
  Check,
  DirectionsBus,
  Campaign,
  SupportAgent,
  ArrowBack,
  Verified,
  Domain,
  Send,
  Dashboard,
  KeyboardArrowDown,
  AutoAwesome,
  WhatsApp,
  Email,
  Close,
} from '@mui/icons-material';
import AppHeader from '@/components/shared/AppHeader';
import OptimizedBackground from '@/components/ui/OptimizedBackground';
import StreamlineIcon from '@/components/ui/StreamlineIcon';
import UpgradeModal from '@/components/admin/UpgradeModal';
import { useAuth } from '@/lib/contexts/AuthContext';
import WhatsAppConcierge, { Message } from '@/components/ui/WhatsAppConcierge';
import IPhoneMockup from '@/components/ui/IPhoneMockup';
import FinalCTA from '@/components/shared/FinalCTA';
import AppFooter from '@/components/shared/AppFooter';
import AboutSection from '@/components/landing/AboutSection';
import FeatureStepper from '@/components/landing/FeatureStepper';
import EyebrowLabel from '@/components/landing/EyebrowLabel';
import Marquee from '@/components/landing/Marquee';
import HowItWorks from '@/components/landing/HowItWorks';
import HomeNavLinks from '@/components/landing/HomeNavLinks';
import { ActionButton } from '@/components/admin/ActionButton';
import { COLORS, FONTS, RADII } from '@/lib/theme/tokens';
import { PRICING_TIERS, PLANNER_TIER } from '@/lib/pricing/tiers';

// --- Data & Content ---

const pricingTiers = PRICING_TIERS;

const faqs = [
  {
    q: 'Is there a free tier?',
    a: "Yes - and we mean really free. We wanted couples to be able to put up a beautiful wedding site, build their guest list, and collect RSVPs without paying us a cent. That's our Free plan. When you're ready for the heavier lifting (WhatsApp concierge, room assignments, transportation, vendor management), Base is $349 - flat, one-time, per wedding.",
  },
  {
    q: 'How does the guest coordination work?',
    a: "Once you're on Base, the chasing comes off your plate. From your dashboard, we'll WhatsApp every guest on your behalf - save-the-dates, RSVP nudges, travel details, room assignments, shuttle pickups - on a timeline we tuned by living through it ourselves. You stay in the loop without being the one sending the messages at midnight.",
  },
  {
    q: 'What information does Phera collect from my guests?',
    a: "All the stuff that ends up on a spreadsheet at 2am if you're doing it yourself - RSVPs per event, dietary needs, plus-ones, flight numbers, arrival times, hotel preferences, special requests. We gather it through normal WhatsApp conversations so it doesn't feel like a form to your guests, then organize it neatly in your dashboard for you.",
  },
  {
    q: 'Do my guests need to download an app?',
    a: "Nope - that was important to us. Everyone already has WhatsApp open all day, and your wedding site works on any phone or laptop they already use. No new apps to download, no logins to remember, nothing for your auntie to figure out.",
  },
  {
    q: "What if a guest doesn't respond on WhatsApp?",
    a: "We follow up a few times - gently, spaced out so it doesn't feel pushy. If they're still not replying, we hand them off to you (or your family) with their contact info so someone close to them can give them a real call. We've all got that one cousin who only responds after a phone call.",
  },
  {
    q: 'Can I customize my wedding website myself?',
    a: 'However you want. You can design every detail yourself with our editor, let our AI take a first pass from a short chat about your wedding, or - on White Glove - sit with us 1-on-1 and we\'ll nail the look together. There\'s no wrong way to do it.',
  },
  {
    q: 'How does the Concierge know about my wedding?',
    a: "We feed it everything from your dashboard - your schedule, dress codes, venue addresses - plus a Knowledge Bank we auto-build for the city you're in: weather, nearby restaurants, what's worth doing on a free afternoon, cultural context for guests who've never been to an Indian wedding. Anything we get wrong, you can fix in a click.",
  },
  {
    q: 'What does the Vendor Coordinator Agent do?',
    a: "We've all been buried in vendor WhatsApp groups - caterer here, florist there, decorator and DJ over there - with important commitments scrolling past at midnight. Add our agent to those groups and it'll summarize what was decided, flag risks, and pull every action item into one clean view so nothing slips.",
  },
  {
    q: 'Do I still need a day-of coordinator?',
    a: "Phera handles the months leading up to your wedding - guest details, logistics, the chasing. We're not on-site cueing the DJ or fixing your dupatta. For day-of, most couples pair us with a local coordinator. White Glove also gets you a dedicated person on our side who personally calls your guests and runs point on every detail before the big day.",
  },
  {
    q: "Is my guests' data safe?",
    a: "We take this really seriously - these are our friends and family on this platform too. Every guest gives explicit consent before we ever message them, we're DPDPA 2023 compliant, and we delete everything 90 days after your wedding. If a guest ever wants out, they can pull their data anytime, no questions asked.",
  },
];

// --- Animation Variants ---
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};


// --- Features section now lives in components/landing/FeatureStepper ---

export default function HomePageClient() {
  return <LandingPageContent />;
}

function LandingPageContent() {
  const conciergeMessages: Message[] = [
    {
      type: 'guest',
      text: "What should I wear to the Sangeet tomorrow?",
      time: "10:42 AM",
    },
    {
      type: 'bot',
      text: <>Sangeet&apos;s festive - jewel tones, lehengas or anarkalis for women, kurtas in deep colors for men. Skip white &amp; black. Indoor venue, heels are fine 💃</>,
      time: "10:42 AM",
      hasCheck: true,
    },
    {
      type: 'guest',
      text: "Perfect. My flight lands at 11pm - is there a pickup?",
      time: "10:43 AM",
    },
    {
      type: 'bot',
      text: <>You&apos;re on the <strong>11:30 PM</strong> shuttle to the <strong>Grand Hyatt</strong>. Driver Rajesh (+91 98xxx 12345) will be at Arrivals Gate 4 with a Phera sign ✈️</>,
      time: "10:43 AM",
      hasCheck: true,
    },
    {
      type: 'guest',
      text: "Free afternoon Friday - anything to do nearby?",
      time: "11:05 AM",
    },
    {
      type: 'bot',
      text: <>It&apos;s 28°C and sunny ☀️ <strong>Hauz Khas Village</strong> is 10 min away (cafés, boutiques) or <strong>Lodhi Garden</strong> for a quiet walk. Want me to book a table somewhere?</>,
      time: "11:06 AM",
      hasCheck: true,
    },
  ];

  const { user } = useAuth();
  const router = useRouter();
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeTier, setUpgradeTier] = useState<'base' | 'premium' | 'planner_perwedding'>('base');
  const [selectedPricingTier, setSelectedPricingTier] = useState(1); // Start with Pro tier
  // First FAQ open by default to invite skim, like the design.
  const [openFaqIdx, setOpenFaqIdx] = useState<number>(0);

  const handleTierAction = (targetTier: typeof upgradeTier, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setUpgradeTier(targetTier);
    if (user) {
      setUpgradeModalOpen(true);
    } else {
      router.push(`/auth/login?redirect=/?tier=${targetTier}`);
    }
  };

  const handleBaseAction = (e?: React.MouseEvent) => handleTierAction('base', e);
  const handlePremiumAction = (e?: React.MouseEvent) => handleTierAction('premium', e);

  return (
    <OptimizedBackground
      useAppDefault={true}
      className="min-h-screen flex flex-col"
    >
      {/* SEO Structured Data - FAQ only. Organization is emitted sitewide from app/layout.tsx. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": faqs.map(faq => ({
              "@type": "Question",
              "name": faq.q,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.a,
              },
            })),
          })
        }}
      />
      {/* Decorative marigolds - gently sway from top-center, mirrored on the
          right side so the two corners feel like they're hanging from the
          same string. Matches the design's `.hero-garland` animation. */}
      <Box
        component="img"
        src="/images/overlays/entry-topleft.png"
        alt=""
        aria-hidden
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 1,
          width: { xs: '120px', sm: '160px', md: '200px' },
          height: 'auto',
          pointerEvents: 'none',
          userSelect: 'none',
          transformOrigin: 'top center',
          animation: 'garland-sway-l 7s ease-in-out infinite',
          filter: 'drop-shadow(0 8px 18px rgba(180, 80, 0, 0.12))',
          '@keyframes garland-sway-l': {
            '0%, 100%': { transform: 'rotate(-1.4deg)' },
            '50%': { transform: 'rotate(1.4deg)' },
          },
        }}
      />
      <Box
        component="img"
        src="/images/overlays/entry-topright.png"
        alt=""
        aria-hidden
        sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          zIndex: 1,
          width: { xs: '120px', sm: '160px', md: '200px' },
          height: 'auto',
          pointerEvents: 'none',
          userSelect: 'none',
          transformOrigin: 'top center',
          // Mirrored direction + 3.5s phase offset so left and right move in
          // opposition rather than in unison.
          animation: 'garland-sway-r 7s ease-in-out infinite',
          animationDelay: '-3.5s',
          filter: 'drop-shadow(0 8px 18px rgba(180, 80, 0, 0.12))',
          '@keyframes garland-sway-r': {
            '0%, 100%': { transform: 'rotate(1.4deg)' },
            '50%': { transform: 'rotate(-1.4deg)' },
          },
        }}
      />

      <AppHeader
        variant="transparent"
        rightSlot={<HomeNavLinks />}
      />

      <Box component="main" sx={{ flexGrow: 1 }}>
        {/* --- HERO SECTION --- blue-cloud background that fades to cream
             at the bottom edge, so the marquee + feature section that follow
             flow naturally into the warm paper palette. */}
        <Box
          sx={{
            minHeight: { xs: '100svh', md: '100vh' },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            position: 'relative',
            pt: { xs: 14, md: 12 },
            pb: { xs: 8, md: 12 },
            // Layered bg: a top-fade-to-cream gradient over the cloud photo
            // over a soft sky tint. The bottom 15% lands at #F7F1E8 so the
            // ticker (cream→paper gradient) picks up where this leaves off.
            background: `
              linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(247,241,232,0.5) 85%, #F7F1E8 100%),
              url('/images/backgrounds/blue-clouds.webp') center/cover no-repeat,
              #BDDFF1
            `,
          }}
        >
          <Container maxWidth="lg">
            <Stack
              spacing={{ xs: 3, md: 4 }}
              sx={{ alignItems: 'flex-start', textAlign: 'left' }}
            >
              <Typography
                variant="h1"
                sx={{
                  fontFamily: FONTS.display,
                  fontStyle: 'italic',
                  fontSize: { xs: '2.75rem', sm: '3.75rem', md: '5.5rem', lg: '7rem' },
                  lineHeight: 1.02,
                  letterSpacing: '-0.025em',
                  color: COLORS.text.strong,
                  maxWidth: '17ch',
                }}
              >
                <Box component="span" sx={{ display: 'block' }}>Your desi wedding,</Box>
                <Box
                  component="span"
                  sx={{ position: 'relative', display: 'inline-block' }}
                >
                  minus the headaches.
                  <Box
                    component={motion.span}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 1.1, delay: 0.6, ease: 'easeOut' }}
                    sx={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      bottom: '8%',
                      height: '38%',
                      bgcolor: COLORS.brand.primary,
                      opacity: 0.22,
                      zIndex: -1,
                      transformOrigin: 'left center',
                      pointerEvents: 'none',
                    }}
                  />
                </Box>
              </Typography>

              <Typography
                sx={{
                  fontSize: { xs: '1rem', md: '1.25rem' },
                  color: COLORS.text.muted,
                  maxWidth: '60ch',
                  lineHeight: 1.55,
                  fontWeight: 400,
                }}
              >
                Phera is the wedding operations team you wish you had. We coordinate every guest - RSVPs, travel, rooms, shuttles, dress codes, midnight WhatsApp questions - so you can actually enjoy your wedding.
              </Typography>

              <Stack
                direction={{ xs: 'row', sm: 'row' }}
                spacing={1.5}
                sx={{ pt: { xs: 1, md: 2 }, flexWrap: 'wrap', rowGap: 1.5 }}
              >
                {/* Primary CTA — drops `keepBackgroundOnLoad` on click so
                    the bg flashes white and the brand-pink spinner shows
                    against it (pink-on-pink would be invisible). */}
                <ActionButton
                  href="/auth/login"
                  variant="contained"
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
                  href="/demo"
                  variant="outlined"
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
                  See how it works
                </ActionButton>
              </Stack>
            </Stack>
          </Container>
        </Box>

        {/* --- TICKER --- sits below the hero viewport so a single scroll
             from the top reveals it, with breathing room from the buttons. */}
        <Marquee />

        {/* --- FEATURES SECTION --- sticky scrolling stepper, six steps */}
        <FeatureStepper />

        {/* --- WHATSAPP AGENT SHOWCASE --- */}
        <Box sx={{
          py: { xs: 8, md: 14 },
          bgcolor: '#075E54',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Top hairline accent */}
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.5), transparent)',
          }} />
          {/* Decorative background circle */}
          <Box sx={{
            position: 'absolute',
            top: -100,
            right: -100,
            width: { xs: 200, md: 400 },
            height: { xs: 200, md: 400 },
            bgcolor: 'rgba(255,255,255,0.06)',
            borderRadius: '50%',
          }} />

          <Container maxWidth="xl" sx={{ pl: { md: 6, lg: 10 }, pr: { md: 6, lg: 10 } }}>
            <Grid container spacing={{ xs: 4, md: 8 }} alignItems="center">
              <Grid size={{ xs: 12, md: 8 }}>
                <motion.div
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeIn}
                >
                  <Box sx={{ mb: { xs: 2, md: 2.5 } }}>
                    <EyebrowLabel tone="light">24/7 concierge</EyebrowLabel>
                  </Box>
                  <Typography
                    variant="h2"
                    sx={{
                      fontFamily: FONTS.display,
                      fontStyle: 'italic',
                      fontSize: { xs: '2.5rem', md: '4rem', lg: '5rem' },
                      lineHeight: 0.98,
                      letterSpacing: '-0.02em',
                      color: 'white',
                      mb: { xs: 2, md: 3 },
                    }}
                  >
                    Trained on{' '}
                    <Box component="em" sx={{ color: '#FF8AA0' }}>your</Box>{' '}
                    wedding.<br />
                    On call <Box component="em" sx={{ color: 'inherit' }}>at 2 AM.</Box>
                  </Typography>
                  <Typography sx={{
                    mb: { xs: 3, md: 4 },
                    opacity: 0.78,
                    fontWeight: 400,
                    fontSize: { xs: '1rem', md: '1.15rem' },
                    lineHeight: 1.55,
                    color: 'white',
                    maxWidth: '52ch',
                  }}>
                    Concierge knows your venues, dates, dress codes, weather, nearby restaurants, visa rules. Guests get instant answers. You get to sleep.
                  </Typography>

                  <Stack spacing={1.5} sx={{ mb: { xs: 3, md: 4 } }}>
                    {[
                      'Trained on your full wedding data - venues, schedule, dress codes',
                      'Knows the local weather, restaurants, things to do, spas',
                      'Handles visa walkthroughs and airport pickups in English or Hindi',
                      'Broadcasts updates and collects replies back from every guest',
                    ].map((line, idx) => (
                      <Stack
                        key={idx}
                        direction="row"
                        spacing={1.25}
                        sx={{ alignItems: 'flex-start' }}
                      >
                        <Box
                          component="span"
                          sx={{
                            color: COLORS.brand.primary,
                            fontWeight: 600,
                            mt: '2px',
                            flex: 'none',
                            fontSize: { xs: '0.95rem', md: '1.05rem' },
                          }}
                        >
                          ✓
                        </Box>
                        <Typography sx={{ fontSize: { xs: '0.95rem', md: '1rem' }, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}>
                          {line}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>

                  <ActionButton
                    onClick={handleBaseAction}
                    variant="contained"
                    keepBackgroundOnLoad
                    spinnerColor="#fff"
                    sx={{
                      bgcolor: COLORS.brand.primary,
                      color: 'white',
                      px: { xs: 3, md: 4 },
                      py: { xs: 1, md: 1.4 },
                      minHeight: { xs: 44, md: 50 },
                      borderRadius: '999px',
                      fontSize: { xs: '0.875rem', md: '1rem' },
                      fontWeight: 600,
                      textTransform: 'none',
                      '&:hover': { bgcolor: COLORS.brand.primaryHover },
                    }}
                    endIcon={<Box component="span" sx={{ fontSize: '1.1em', lineHeight: 1 }}>→</Box>}
                  >
                    Activate concierge
                  </ActionButton>
                </motion.div>
              </Grid>

              <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex', justifyContent: { xs: 'center', md: 'flex-end' } }}>
                <motion.div
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={{
                    hidden: { opacity: 0, x: 20 },
                    visible: { opacity: 1, x: 0, transition: { duration: 0.8 } }
                  }}
                >
                  <IPhoneMockup
                    width={{ xs: '240px', sm: '270px', md: '310px', lg: '340px' }}
                    sx={{ maxHeight: { md: '80vh' }, mx: { xs: 'auto', md: 0 } }}
                  >
                    <WhatsAppConcierge
                      hideNotch
                      dense
                      scripted
                      messages={conciergeMessages}
                      sx={{
                        width: '100%',
                        height: '100%',
                        border: 'none',
                        borderRadius: 0,
                      }}
                    />
                  </IPhoneMockup>
                </motion.div>
              </Grid>
            </Grid>
          </Container >
        </Box >

        {/* --- WEDDING ROADMAP SECTION --- */}
        {/* <Container maxWidth="xl" sx={{ py: { xs: 3, md: 14 } }}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
          >
            <Stack spacing={2} sx={{ textAlign: 'center', mb: { xs: 3, md: 12 }, alignItems: 'center' }}>
              <Typography
                variant="overline"
                sx={{ color: COLORS.brand.primary, fontWeight: 800, letterSpacing: '2px', fontSize: { xs: '0.65rem', md: '0.75rem' } }}
              >
                HOW IT WORKS
              </Typography>
              <Typography
                variant="h2"
                align="center"
                sx={{
                  fontFamily: FONTS.display,
                  fontStyle: 'italic',
                  fontSize: { xs: '2.5rem', md: '3.5rem', lg: '4.5rem' },
                  color: COLORS.text.strong,
                  lineHeight: 1.15,
                }}
              >
                Your Journey, Simplified.
              </Typography>
              <Typography variant="h6" sx={{ color: COLORS.text.muted, fontWeight: 400, maxWidth: '600px', mx: 'auto', textAlign: 'center', fontSize: { xs: '1rem', md: '1.25rem' }, lineHeight: 1.5 }}>
                Launch your wedding in minutes, not months.
              </Typography>
            </Stack>

            <Box
              ref={roadmapRef}
              sx={{
                display: { xs: 'flex', md: 'grid' },
                overflowX: { xs: 'auto', md: 'visible' },
                scrollSnapType: { xs: 'x mandatory', md: 'none' },
                gridTemplateColumns: { md: 'repeat(4, 1fr)' },
                gap: { xs: 2, md: 4 },
                position: 'relative',
                pb: { xs: 2, md: 0 },
                px: { xs: 2, md: 0 },
                mx: { xs: -2, md: 0 },
                '&::-webkit-scrollbar': { display: 'none' },
                msOverflowStyle: 'none',
                scrollbarWidth: 'none',
              }}
            >
        <Box sx={{
          position: 'absolute',
          top: '40px',
          left: '12%',
          right: '12%',
          height: '2px',
          borderTop: '2px dashed #e0e0e0',
          display: { xs: 'none', md: 'block' },
          zIndex: 0
        }} />

        {[
          {
            step: '01',
            title: 'Spin Up Your Site',
            desc: 'Customize your design, add events, and setup details in 10 minutes.',
            icon: <Domain fontSize="large" />
          },
          {
            step: '02',
            title: 'Activate Concierge',
            desc: 'Enable advanced features like WhatsApp Concierge and Travel Coordination.',
            icon: <SupportAgent fontSize="large" />
          },
          {
            step: '03',
            title: 'Send & Sync',
            desc: 'Share your beautiful website. Guests RSVP and get details instantly.',
            icon: <Send fontSize="large" />
          },
          {
            step: '04',
            title: 'Cruise Control',
            desc: 'Track RSVPs, coordinate logistics, and broadcast updates to everyone.',
            icon: <Dashboard fontSize="large" />
          }
        ].map((item, idx) => (
          <Box
            key={idx}
            sx={{
              position: 'relative',
              zIndex: 1,
              flex: { xs: '0 0 75%', md: 'auto' },
              minWidth: { xs: '220px', md: 'auto' },
              scrollSnapAlign: 'center'
            }}
          >
            <motion.div
              whileHover={{ y: -10, transition: { duration: 0.3 } }}
              style={{ height: '100%' }}
            >
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2.5, md: 4 },
                  height: '100%',
                  borderRadius: { xs: '16px', md: '24px' },
                  border: '1px solid',
                  borderColor: alpha('#000', 0.05),
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                  bgcolor: 'white',
                  '&:hover': {
                    borderColor: alpha('#DE3F5E', 0.2),
                    boxShadow: '0 20px 40px rgba(0,0,0,0.05)',
                    '& .step-number': {
                      color: alpha('#DE3F5E', 0.3),
                    }
                  }
                }}
              >
        <Typography
          className="step-number"
          sx={{
            position: 'absolute',
            top: { xs: 8, md: 12 },
            right: { xs: 12, md: 16 },
            fontSize: { xs: '1.5rem', md: '2rem' },
            fontFamily: FONTS.display,
            fontStyle: 'italic',
            color: alpha('#DE3F5E', 0.2),
            transition: 'all 0.3s ease',
            zIndex: 1
          }}
        >
          {item.step}
        </Typography>

        <Box
          sx={{
            width: { xs: 50, md: 80 },
            height: { xs: 50, md: 80 },
            borderRadius: '50%',
            bgcolor: 'white',
            border: '1px solid #eee',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: { xs: 1.5, md: 3 },
            color: COLORS.brand.primary,
            boxShadow: '0 8px 16px rgba(0,0,0,0.05)',
            zIndex: 1,
            '& svg': { fontSize: { xs: '1.5rem', md: '2rem' } }
          }}
        >
          {item.icon}
        </Box>

        <Typography variant="h5" sx={{ mb: { xs: 1, md: 2 }, fontFamily: FONTS.display, fontStyle: 'italic', zIndex: 1, color: COLORS.text.strong, fontSize: { xs: '1.15rem', md: '1.5rem' } }}>
          {item.title}
        </Typography>

        <Typography variant="body2" sx={{ color: '#666', lineHeight: 1.5, zIndex: 1, fontSize: { xs: '0.9rem', md: '1rem' } }}>
          {item.desc}
        </Typography>
      </Paper>
    </motion.div>
          </Box >
        ))
}
      </Box >

        < Stack
          direction="row"
          spacing={1}
          sx={{
            display: { xs: 'flex', md: 'none' },
            justifyContent: 'center',
            mt: 2,
            pb: 2
          }}
        >
          {
            [0, 1, 2, 3].map((idx) => (
              <Box
                key={idx}
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: roadmapIndex === idx ? '#DE3F5E' : alpha('#DE3F5E', 0.2),
                  transition: 'all 0.3s ease',
                }}
              />
            ))
          }
        </Stack >
      </motion.div >
    </Container > */
        }

        {/* --- HOW IT WORKS --- */}
        <HowItWorks />

        {/* --- PRICING --- */}
        <Box id="pricing" sx={{ bgcolor: '#FBF7F1', py: { xs: 8, md: 14 } }}>
          <Container maxWidth="xl" sx={{ px: { xs: 2.5, md: 6, lg: 10 } }}>
            <Stack spacing={2} sx={{ alignItems: 'flex-start', mb: { xs: 5, md: 8 } }}>
              <EyebrowLabel>Pricing</EyebrowLabel>
              <Typography
                variant="h2"
                sx={{
                  fontFamily: FONTS.display,
                  fontStyle: 'italic',
                  fontSize: { xs: '2.25rem', sm: '3rem', md: '4rem', lg: '4.75rem' },
                  lineHeight: 1.02,
                  letterSpacing: '-0.025em',
                  color: COLORS.text.strong,
                  maxWidth: '18ch',
                  textWrap: 'balance',
                }}
              >
                One flat fee. Per wedding.
              </Typography>
              <Typography sx={{ color: COLORS.text.muted, fontSize: { xs: '1rem', md: '1.15rem' }, lineHeight: 1.55, maxWidth: '52ch' }}>
                Less than a single shuttle bus rental. No subscription. No surprises.
              </Typography>
            </Stack>

            {/* Mobile Toggle Buttons */}
            <Stack direction="row" spacing={1} sx={{ display: { xs: 'flex', md: 'none' }, justifyContent: 'center', mb: 3 }}>
              {pricingTiers.map((tier, idx) => (
                <Button
                  key={idx}
                  variant={selectedPricingTier === idx ? 'contained' : 'outlined'}
                  onClick={() => setSelectedPricingTier(idx)}
                  sx={{
                    flex: 1,
                    borderRadius: RADII.xl,
                    py: 1,
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    bgcolor: selectedPricingTier === idx ? '#DE3F5E' : 'transparent',
                    borderColor: COLORS.brand.primary,
                    color: selectedPricingTier === idx ? 'white' : '#DE3F5E',
                    '&:hover': {
                      bgcolor: selectedPricingTier === idx ? COLORS.brand.primaryHover : alpha('#DE3F5E', 0.05),
                      borderColor: COLORS.brand.primary,
                    },
                  }}
                >
                  {tier.name}
                </Button>
              ))}
            </Stack>

            <Grid container spacing={{ xs: 1.5, md: 4 }} sx={{ alignItems: 'stretch', justifyContent: 'center' }}>
              {pricingTiers.map((tier, idx) => (
                <Grid
                  size={{ xs: 12, md: 4 }}
                  key={idx}
                  sx={{
                    display: {
                      xs: selectedPricingTier === idx ? 'block' : 'none',
                      md: 'block'
                    }
                  }}
                >
                  <Paper
                    elevation={tier.highlight ? 8 : 0}
                    sx={{
                      p: { xs: 1.5, md: 4 },
                      height: '100%',
                      borderRadius: { xs: '12px', md: '24px' },
                      bgcolor: 'white',
                      color: COLORS.text.strong,
                      border: tier.highlight
                        ? '2px solid #DE3F5E'
                        : '1px solid #E0E0E0',
                      position: 'relative',
                      transition: 'transform 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      '&:hover': {
                        transform: { md: 'translateY(-5px)' },
                      }
                    }}
                  >
                    {tier.highlight && (
                      <Chip
                        label="POPULAR"
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: { xs: -8, md: -12 },
                          right: { xs: 8, md: 24 },
                          bgcolor: COLORS.brand.primary,
                          color: 'white',
                          fontWeight: 'bold',
                          fontSize: { xs: '0.6rem', md: '0.8rem' },
                          height: { xs: '18px', md: '24px' }
                        }}
                      />
                    )}
                    <Typography
                      variant="overline"
                      sx={{ fontWeight: 'bold', opacity: 0.7, color: COLORS.brand.primary, fontSize: { xs: '0.75rem', md: '0.8rem' }, letterSpacing: '1.5px' }}
                    >
                      {tier.name}
                    </Typography>
                    <Box sx={{ my: { xs: 0.5, md: 2 } }}>
                      <Typography variant="h3" sx={{ fontWeight: 'bold', display: 'inline', fontSize: { xs: '2rem', md: '3rem' } }}>
                        {tier.price}
                      </Typography>
                      {'priceSuffix' in tier && tier.priceSuffix && (
                        <Typography component="span" sx={{ fontSize: { xs: '0.85rem', md: '1.25rem' }, color: COLORS.text.subtle, fontWeight: 400 }}>
                          {tier.priceSuffix}
                        </Typography>
                      )}
                    </Box>
                    {tier.description && (
                      <Typography variant="body2" sx={{ mb: { xs: 1.5, md: 2 }, color: COLORS.text.muted, fontSize: { xs: '0.9rem', md: '0.95rem' } }}>
                        {tier.description}
                      </Typography>
                    )}

                    <List dense sx={{ mb: { xs: 1, md: 2 }, flexGrow: 1 }}>
                      {tier.features.map((feature, fIdx) => (
                        <ListItem key={fIdx} disableGutters sx={{ py: { xs: 0.5, md: 0.75 } }}>
                          <ListItemIcon sx={{ minWidth: { xs: 32, md: 44 } }}>
                            <StreamlineIcon
                              name="check-circle"
                              sx={{
                                color: COLORS.brand.primary,
                                width: { xs: 22, md: 28 },
                                height: { xs: 22, md: 28 },
                              }}
                            />
                          </ListItemIcon>
                          <ListItemText
                            primary={feature.replace('WhatsApp Concierge Agent', 'WhatsApp Agent')}
                            primaryTypographyProps={{
                              sx: {
                                color: COLORS.text.strong,
                                fontWeight: 400,
                                fontSize: { xs: '0.9rem', md: '0.95rem' },
                                lineHeight: 1.5
                              }
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>

                    {(() => {
                      const ctaSx = {
                        borderRadius: { xs: '16px', md: '32px' },
                        py: { xs: 0.75, md: 1.5 },
                        fontSize: { xs: '0.9rem', md: '1rem' },
                        bgcolor: tier.highlight ? '#DE3F5E' : 'transparent',
                        borderColor: COLORS.brand.primary,
                        color: tier.highlight ? 'white' : '#DE3F5E',
                        '&:hover': {
                          bgcolor: tier.highlight
                            ? COLORS.brand.primaryHover
                            : alpha('#DE3F5E', 0.05),
                          borderColor: COLORS.brand.primary,
                        },
                      };
                      const label = tier.buttonText;
                      if (tier.name === 'PHERA BASE' || tier.name === 'PHERA WHITE GLOVE') {
                        return (
                          <ActionButton
                            fullWidth
                            onClick={tier.name === 'PHERA BASE' ? handleBaseAction : handlePremiumAction}
                            variant={tier.highlight ? 'contained' : 'outlined'}
                            size="small"
                            keepBackgroundOnLoad
                            sx={ctaSx}
                          >
                            {label}
                          </ActionButton>
                        );
                      }
                      const href = ('buttonHref' in tier && typeof tier.buttonHref === 'string')
                        ? tier.buttonHref
                        : '/auth/signup';
                      return (
                        <ActionButton
                          fullWidth
                          href={href}
                          variant={tier.highlight ? 'contained' : 'outlined'}
                          size="small"
                          keepBackgroundOnLoad
                          sx={ctaSx}
                        >
                          {label}
                        </ActionButton>
                      );
                    })()}
                  </Paper>
                </Grid>
              ))}
            </Grid>

            {/* For Planners strip - white surface, matches the tier cards
                so the planner option reads as part of the same pricing rail */}
            <Paper
              elevation={0}
              sx={{
                mt: { xs: 3, md: 5 },
                p: { xs: 2.5, md: 4 },
                borderRadius: { xs: '16px', md: '22px' },
                bgcolor: 'white',
                border: '1px solid rgba(0,0,0,0.07)',
              }}
            >
              <Grid container spacing={{ xs: 2, md: 4 }} alignItems="center">
                <Grid size={{ xs: 12, md: 7 }}>
                  <Box sx={{ mb: 1 }}>
                    <EyebrowLabel>For wedding planners</EyebrowLabel>
                  </Box>
                  <Typography
                    sx={{
                      fontFamily: FONTS.display,
                      fontStyle: 'italic',
                      fontSize: { xs: '1.5rem', md: '2.25rem' },
                      color: COLORS.text.strong,
                      lineHeight: 1.15,
                      letterSpacing: '-0.01em',
                      mt: 0.5,
                    }}
                  >
                    Wholesale pricing for the planners running 30 weddings a year.
                  </Typography>
                  <Typography sx={{ fontSize: { xs: '0.9rem', md: '0.95rem' }, color: COLORS.text.muted, mt: 1.5, lineHeight: 1.55, maxWidth: '60ch' }}>
                    {PLANNER_TIER.description} Multi-wedding Control Tower, white-label option, planner branding.
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 5 }} sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, alignItems: { xs: 'flex-start', md: 'flex-end' } }}>
                  <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                    <Typography sx={{ fontSize: { xs: '0.7rem', md: '0.75rem' }, color: COLORS.text.subtle, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', mb: 0.5 }}>
                      Per-wedding
                    </Typography>
                    <Typography sx={{ fontFamily: FONTS.display, fontStyle: 'italic', fontSize: { xs: '2.5rem', md: '3.25rem' }, color: COLORS.text.strong, lineHeight: 1 }}>
                      {PLANNER_TIER.price}
                      <Box component="span" sx={{ fontFamily: FONTS.body, fontStyle: 'normal', fontSize: { xs: '0.85rem', md: '1rem' }, color: COLORS.text.subtle, fontWeight: 400, ml: 0.75 }}>
                        {PLANNER_TIER.priceSuffix}
                      </Box>
                    </Typography>
                  </Box>
                  <ActionButton
                    href="/auth/login?role=planner"
                    variant="outlined"
                    keepBackgroundOnLoad
                    sx={{
                      borderColor: 'rgba(0,0,0,0.18)',
                      color: COLORS.text.strong,
                      borderRadius: '999px',
                      px: { xs: 2.5, md: 3 },
                      py: 1,
                      minHeight: 44,
                      fontSize: { xs: '0.875rem', md: '0.95rem' },
                      textTransform: 'none',
                      fontWeight: 600,
                      bgcolor: 'transparent',
                      '&:hover': { borderColor: COLORS.text.strong, bgcolor: 'rgba(0,0,0,0.03)' },
                    }}
                    endIcon={<Box component="span" sx={{ fontSize: '1.1em', lineHeight: 1 }}>→</Box>}
                  >
                    Start as a planner
                  </ActionButton>
                </Grid>
              </Grid>
            </Paper>
          </Container>
        </Box>

        {/* --- ORIGIN / ABOUT --- sunset photo bg, full-strength (no white
             wash). The "Origin" eyebrow is passed into AboutSection so it
             sits directly above the headline in the right column. */}
        <Box
          id="about"
          sx={{
            position: 'relative',
            bgcolor: '#F4EBDB',
            backgroundImage: 'url("/images/backgrounds/sunset.webp")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        >
          <AboutSection
            variant="embedded"
            eyebrow={<EyebrowLabel>Origin</EyebrowLabel>}
          />
        </Box>

        {/* --- FAQ + FINAL CTA --- shared blue-clouds backdrop so the two
             sections read as one continuous sky panel.
             `backgroundSize: '100% auto'` (not `cover`) keeps the image at a
             stable vertical scale — when an FAQ accordion opens/closes and
             the wrapper height changes, `cover` was rescaling the bg image
             which read as a visible stretch. With `100% auto` the image
             pins to the section's width and any extra height is filled by
             the bgcolor below. */}
        <Box
          sx={{
            bgcolor: '#E8F1FB',
            backgroundImage: 'url("/images/backgrounds/blue-clouds.webp")',
            backgroundSize: '100% auto',
            backgroundPosition: 'center top',
            backgroundRepeat: 'no-repeat',
          }}
        >
        {/* --- FAQ --- transparent so the shared blue-clouds bg shows through */}
        <Box id="faq" sx={{ py: { xs: 8, md: 14 } }}>
          <Container maxWidth="xl" sx={{ px: { xs: 2.5, md: 6, lg: 10 } }}>
            <Paper
              elevation={0}
              sx={{
                bgcolor: 'white',
                borderRadius: { xs: '20px', md: '28px' },
                p: { xs: 3, md: 5 },
                maxWidth: 920,
                mx: 'auto',
                border: '1px solid rgba(0,0,0,0.05)',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
              }}
            >
              <Stack spacing={2} sx={{ alignItems: 'center', textAlign: 'center' }}>
                <EyebrowLabel align="center">FAQ</EyebrowLabel>
                <Typography
                  variant="h2"
                  align="center"
                  sx={{
                    fontFamily: FONTS.display,
                    fontStyle: 'italic',
                    fontSize: { xs: '2.25rem', md: '3.25rem' },
                    lineHeight: 1.05,
                    letterSpacing: '-0.02em',
                    color: COLORS.text.strong,
                  }}
                >
                  Things people ask.
                </Typography>
              </Stack>
            </Paper>

            {/* Flat list — no per-item card, just hairline dividers between
                rows. Plus icon rotates 45° to become an X when its row is
                open. Matches the design's bg-sky-soft FAQ exactly. */}
            <Box sx={{ maxWidth: 800, mx: 'auto', mt: { xs: 4, md: 6 } }}>
              {faqs.map((faq, idx) => {
                const isOpen = openFaqIdx === idx;
                return (
                  <Box
                    key={idx}
                    sx={{ borderBottom: '1px solid rgba(0,0,0,0.1)' }}
                  >
                    <Box
                      component="button"
                      type="button"
                      onClick={() => setOpenFaqIdx(isOpen ? -1 : idx)}
                      sx={{
                        width: '100%',
                        textAlign: 'left',
                        background: 'transparent',
                        border: 0,
                        cursor: 'pointer',
                        py: 3,
                        px: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 3,
                        fontFamily: FONTS.body,
                        color: 'inherit',
                      }}
                    >
                      <Box
                        component="span"
                        sx={{
                          fontSize: { xs: '1.05rem', md: '1.1875rem' },
                          fontWeight: 500,
                          color: COLORS.text.strong,
                          lineHeight: 1.4,
                        }}
                      >
                        {faq.q}
                      </Box>
                      <Box
                        component="span"
                        aria-hidden
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          border: '1px solid rgba(0,0,0,0.1)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: COLORS.brand.primary,
                          fontSize: '1.125rem',
                          lineHeight: 1,
                          flexShrink: 0,
                          transition: 'transform 0.3s ease',
                          transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                        }}
                      >
                        +
                      </Box>
                    </Box>
                    <Box
                      sx={{
                        maxHeight: isOpen ? 600 : 0,
                        overflow: 'hidden',
                        transition: 'max-height 0.4s cubic-bezier(0.2, 0.7, 0.2, 1)',
                      }}
                    >
                      <Typography
                        sx={{
                          pb: 3,
                          fontSize: '1rem',
                          color: COLORS.text.muted,
                          lineHeight: 1.65,
                          maxWidth: '60ch',
                        }}
                      >
                        {faq.a}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Container>
        </Box>

        {/* --- FINAL CTA --- transparent, sits on the shared blue-clouds bg */}
        <Box sx={{ pb: { xs: 6, md: 10 } }}>
          <FinalCTA />
        </Box>
        </Box>

        {/* --- FOOTER --- light cream surface, dark text, our existing icons + links */}
        <Box sx={{ bgcolor: '#FBF7F1', color: COLORS.text.strong, py: 8, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          <Container maxWidth="lg" sx={{ pl: { md: 6, lg: 10 } }}>
            <Grid container spacing={4}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Image
                  src="/logo.svg"
                  alt="Phera Logo"
                  width={120}
                  height={32}
                  style={{
                    height: '32px',
                    width: 'auto',
                    marginBottom: '16px',
                    filter: 'brightness(0)',
                  }}
                />
                <Typography variant="body2" sx={{ mb: 2, color: COLORS.text.muted }}>
                  Phera was built by a couple who spent more time coordinating
                  guests than enjoying their own wedding. We built the operations
                  team we wish we had.
                </Typography>
                <Typography variant="body2" sx={{ color: COLORS.text.muted }}>
                  Indian weddings are beautiful chaos. Phera handles the guest logistics
                  so you can focus on the celebration.
                </Typography>
              </Grid>
              <Grid size={{ xs: 6, md: 2 }}>
                <Typography
                  variant="subtitle1"
                  color="#1a1a1a"
                  sx={{ fontWeight: 'bold', mb: 2 }}
                >
                  Platform
                </Typography>
                <Stack spacing={1}>
                  <Link href="#features" className="text-[#4a4a4a] hover:text-[#DE3F5E] transition-colors">
                    Features
                  </Link>
                  <Link href="#pricing" className="text-[#4a4a4a] hover:text-[#DE3F5E] transition-colors">
                    Pricing
                  </Link>
                  <Link href="/demo" className="text-[#4a4a4a] hover:text-[#DE3F5E] transition-colors">
                    Demo
                  </Link>
                </Stack>
              </Grid>
              <Grid size={{ xs: 6, md: 2 }}>
                <Typography
                  variant="subtitle1"
                  color="#1a1a1a"
                  sx={{ fontWeight: 'bold', mb: 2 }}
                >
                  Company
                </Typography>
                <Stack spacing={1}>
                  <Link href="/about" className="text-[#4a4a4a] hover:text-[#DE3F5E] transition-colors">
                    About Us
                  </Link>
                  <Link href="/blog" className="text-[#4a4a4a] hover:text-[#DE3F5E] transition-colors">
                    Blog
                  </Link>
                  <Link href="/contact" className="text-[#4a4a4a] hover:text-[#DE3F5E] transition-colors">
                    Contact
                  </Link>
                  <Link href="/privacy" className="text-[#4a4a4a] hover:text-[#DE3F5E] transition-colors">
                    Privacy
                  </Link>
                </Stack>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography
                  variant="subtitle1"
                  color="#1a1a1a"
                  sx={{ fontWeight: 'bold', mb: 2 }}
                >
                  Connect
                </Typography>
                <Stack direction="row" spacing={2}>
                  <IconButton
                    component="a"
                    href="https://instagram.com/withphera"
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ color: COLORS.brand.primary, bgcolor: alpha('#DE3F5E', 0.1), '&:hover': { bgcolor: alpha('#DE3F5E', 0.2) } }}
                  >
                    <Instagram />
                  </IconButton>
                  <IconButton
                    component="a"
                    href="mailto:contact@phera.io"
                    sx={{ color: COLORS.brand.primary, bgcolor: alpha('#DE3F5E', 0.1), '&:hover': { bgcolor: alpha('#DE3F5E', 0.2) } }}
                  >
                    <Email />
                  </IconButton>
                  <IconButton
                    component="a"
                    href="https://wa.me/15558397813"
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ color: COLORS.brand.primary, bgcolor: alpha('#DE3F5E', 0.1), '&:hover': { bgcolor: alpha('#DE3F5E', 0.2) } }}
                  >
                    <WhatsApp />
                  </IconButton>
                </Stack>
              </Grid>
            </Grid>
            <Box
              sx={{
                borderTop: '1px solid rgba(0,0,0,0.1)',
                mt: 8,
                pt: 4,
                textAlign: 'center',
              }}
            >
              <Typography variant="body2" sx={{ color: '#5a5a5a', fontWeight: 500 }}>
                © 2026 Phera Events. All rights reserved.
              </Typography>
              <Typography variant="caption" sx={{ color: COLORS.text.faint, display: 'block', mt: 0.5 }}>
                Phera Events is owned and operated by Ghumaan Ventures, LLC.
              </Typography>
            </Box>
          </Container>
        </Box>
      </Box >

      <UpgradeModal
        open={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        tier={upgradeTier}
        returnPath="/"
      />

      <Suspense fallback={null}>
        <HomePostAuthModalOpener
          user={user}
          setUpgradeModalOpen={setUpgradeModalOpen}
          setUpgradeTier={setUpgradeTier}
        />
      </Suspense>
    </OptimizedBackground >
  );
}
