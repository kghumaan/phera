'use client';
/* eslint-disable no-restricted-syntax */
// Footer hex literals (#1a1a1a, #5a5a5a, #FBF7F1, #DE3F5E) are kept inline
// here to preserve the existing footer surface verbatim per latest UX
// direction. Token migration on the footer is tracked separately.

/**
 * Phera landing page.
 *
 * Eight sections — Hero, FeatureStepper ("The full kit"), our WhatsApp
 * Concierge dark panel (kept from a prior iteration), HowItWorks, Pricing,
 * Origin (Story), FAQ, FinalCTA — are mirrored 1:1 from the Claude Design
 * package (see /tmp/phera-zip/, also `Phera.zip` at the repo root). The
 * design's CSS lives at app/landing-design.css and is scoped to
 * `.phera-landing` so its classes don't leak into admin or guest surfaces.
 *
 * The shell here only handles auth, modals, SEO, and the footer. Each
 * section component is responsible for its own layout, typography, and
 * background.
 */

import './landing-design.css';
import { useState, Suspense } from 'react';
import { Box, Grid, Stack, Typography, IconButton, alpha } from '@mui/material';
import { Instagram, Email, WhatsApp } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

import AppHeader from '@/components/shared/AppHeader';
import OptimizedBackground from '@/components/ui/OptimizedBackground';
import UpgradeModal from '@/components/admin/UpgradeModal';
import { useAuth } from '@/lib/contexts/AuthContext';
import WhatsAppConcierge, { type Message } from '@/components/ui/WhatsAppConcierge';
import IPhoneMockup from '@/components/ui/IPhoneMockup';
import HomePostAuthModalOpener from './HomePostAuthModalOpener';
import { ActionButton } from '@/components/admin/ActionButton';
import HomeNavLinks from '@/components/landing/HomeNavLinks';

import HeroSection from '@/components/landing/HeroSection';
import FeatureStepper from '@/components/landing/FeatureStepper';
import HowItWorks from '@/components/landing/HowItWorks';
import PricingSection from '@/components/landing/PricingSection';
import OriginSection from '@/components/landing/OriginSection';
import FAQSection from '@/components/landing/FAQSection';
import FinalCTASection from '@/components/landing/FinalCTASection';
import { COLORS } from '@/lib/theme/tokens';

const FAQS_FOR_SCHEMA = [
  { q: 'Is there really a free tier?', a: "Yes - really free. Beautiful wedding site, guest list, basic RSVPs without paying us a cent. Base ($349) is when you want the heavier lifting: WhatsApp outreach, concierge, travel, rooms." },
  { q: 'How does the guest coordination work?', a: "Once you're on Base, the chasing comes off your plate. We WhatsApp every guest on your behalf - save-the-dates, RSVP nudges, travel forms, room assignments, shuttle pickups - on a timeline we tuned by living through it." },
  { q: 'Do my guests need to download an app?', a: "Nope - that was non-negotiable. Everyone has WhatsApp open already, and your wedding site works on any phone or laptop. No new apps for your aunty to figure out." },
  { q: "What if a guest doesn't reply on WhatsApp?", a: "We follow up a few times - gently, spaced out. If they're still silent, we hand them off to you with their contact info so a family member can call. Some cousins only respond after a phone call." },
  { q: 'How does the Concierge know about my wedding?', a: "We feed it everything in your dashboard: schedule, dress codes, venue addresses, plus a Knowledge Bank we auto-build for the city - weather, restaurants, cultural context. Anything wrong, you fix in a click." },
  { q: 'Do I still need a day-of coordinator?', a: "Phera handles the months leading up to the wedding. We don't cue the DJ or fix your dupatta. For day-of, most couples pair us with a local coordinator. White Glove gets you a dedicated person on our side as well." },
  { q: "Is my guests' data safe?", a: "Yes. Every guest gives explicit consent before we message them, we're DPDPA-2023 compliant, and we delete everything 90 days after the wedding. Guests can pull their data anytime." },
];

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

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
    <OptimizedBackground useAppDefault className="min-h-screen flex flex-col">
      {/* SEO Structured Data — FAQ only. Organization is emitted sitewide from app/layout.tsx. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": FAQS_FOR_SCHEMA.map(faq => ({
              "@type": "Question",
              "name": faq.q,
              "acceptedAnswer": { "@type": "Answer", "text": faq.a },
            })),
          }),
        }}
      />

      <AppHeader variant="transparent" rightSlot={<HomeNavLinks />} />

      {/* Landing surface — wrapped in `phera-landing` so the design CSS
          variables and class rules from app/landing-design.css apply. */}
      <Box component="main" className="phera-landing" sx={{ flexGrow: 1 }}>
        <HeroSection />

        <FeatureStepper />

        {/* WHATSAPP AGENT SHOWCASE — kept from prior iteration; sits between
            FeatureStepper and HowItWorks just like the design's
            ConciergeShowcase, but uses our IPhoneMockup + WhatsAppConcierge. */}
        <Box
          className="bg-textured bg-wa-doodles"
          sx={{
            py: 'var(--section-pad, 140px)',
            bgcolor: 'var(--wa-header)',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '1px',
              background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.5), transparent)',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              top: -100,
              right: -100,
              width: { xs: 200, md: 400 },
              height: { xs: 200, md: 400 },
              bgcolor: 'rgba(255,255,255,0.06)',
              borderRadius: '50%',
            }}
          />

          <div className="container" style={{ position: 'relative', zIndex: 2 }}>
            <Grid container spacing={{ xs: 4, md: 8 }} alignItems="center">
              <Grid size={{ xs: 12, md: 7 }}>
                <motion.div
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeIn}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
                    <span style={{ display: 'inline-block', width: 28, height: 1, background: 'rgba(255,255,255,0.3)', flex: 'none' }} />
                    <span className="eyebrow" style={{ color: '#FFB347' }}>24/7 concierge</span>
                  </div>
                  <h2
                    className="display"
                    style={{
                      fontFamily: 'var(--font-instrument-serif), Georgia, serif',
                      fontStyle: 'italic',
                      fontWeight: 400,
                      letterSpacing: '-0.02em',
                      fontSize: 'clamp(40px, 6vw, 88px)',
                      color: 'white',
                      margin: 0,
                      lineHeight: 0.98,
                    }}
                  >
                    Trained on <em style={{ color: '#FF8AA0' }}>your</em> wedding.<br />
                    On call <em>at 2 AM.</em>
                  </h2>
                  <p
                    style={{
                      marginTop: 24,
                      fontSize: 18,
                      color: 'rgba(255,255,255,0.72)',
                      maxWidth: '52ch',
                      lineHeight: 1.55,
                    }}
                  >
                    Concierge knows your venues, dates, dress codes, weather, nearby restaurants, visa rules. Guests get instant answers. You get to sleep.
                  </p>
                  <ul style={{ marginTop: 32, listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {[
                      'Trained on your full wedding data - venues, schedule, dress codes',
                      'Knows the local weather, restaurants, things to do, spas',
                      'Handles visa walkthroughs and airport pickups in English or Hindi',
                      'Broadcasts updates and collects replies back from every guest',
                    ].map((line, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, fontSize: 16, color: 'rgba(255,255,255,0.85)' }}>
                        <span style={{ color: 'var(--accent)', fontWeight: 600, marginTop: 2 }}>✓</span>
                        {line}
                      </li>
                    ))}
                  </ul>
                  <ActionButton
                    onClick={handleBaseAction}
                    variant="contained"
                    keepBackgroundOnLoad
                    spinnerColor="#fff"
                    className="btn btn-primary"
                    sx={{
                      marginTop: '36px',
                      fontSize: 16,
                      padding: '16px 28px',
                      borderRadius: '999px',
                      textTransform: 'none',
                      fontWeight: 600,
                      bgcolor: 'var(--accent)',
                      color: '#fff',
                      '&:hover': { bgcolor: 'var(--accent-hover)' },
                    }}
                    endIcon={<span className="btn-arrow" style={{ display: 'inline-block' }}>→</span>}
                  >
                    Activate concierge
                  </ActionButton>
                </motion.div>
              </Grid>
              <Grid size={{ xs: 12, md: 5 }} sx={{ display: 'flex', justifyContent: 'center' }}>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                >
                  <IPhoneMockup
                    width={{ xs: '240px', sm: '270px', md: '300px', lg: '320px' }}
                    sx={{ maxHeight: { md: '80vh' }, mx: { xs: 'auto', md: 0 } }}
                  >
                    <WhatsAppConcierge
                      hideNotch
                      dense
                      scripted
                      messages={conciergeMessages}
                      sx={{ width: '100%', height: '100%', border: 'none', borderRadius: 0 }}
                    />
                  </IPhoneMockup>
                </motion.div>
              </Grid>
            </Grid>
          </div>
        </Box>

        <HowItWorks />

        <PricingSection
          onBaseClick={handleBaseAction}
          onPremiumClick={handlePremiumAction}
        />

        <OriginSection />

        <FAQSection />

        <FinalCTASection />

        {/* FOOTER — kept from prior iteration; copyright row updated to
            split-left/right per latest direction. */}
        <Box
          sx={{
            bgcolor: '#FBF7F1',
            color: COLORS.text.strong,
            py: 8,
            borderTop: '1px solid rgba(0,0,0,0.06)',
          }}
        >
          <div className="container">
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
                <Typography variant="subtitle1" color="#1a1a1a" sx={{ fontWeight: 'bold', mb: 2 }}>
                  Platform
                </Typography>
                <Stack spacing={1}>
                  <Link href="#service" className="text-[#4a4a4a] hover:text-[#DE3F5E] transition-colors">Features</Link>
                  <Link href="#pricing" className="text-[#4a4a4a] hover:text-[#DE3F5E] transition-colors">Pricing</Link>
                  <Link href="/demo" className="text-[#4a4a4a] hover:text-[#DE3F5E] transition-colors">Demo</Link>
                </Stack>
              </Grid>
              <Grid size={{ xs: 6, md: 2 }}>
                <Typography variant="subtitle1" color="#1a1a1a" sx={{ fontWeight: 'bold', mb: 2 }}>
                  Company
                </Typography>
                <Stack spacing={1}>
                  <Link href="/about" className="text-[#4a4a4a] hover:text-[#DE3F5E] transition-colors">About Us</Link>
                  <Link href="/blog" className="text-[#4a4a4a] hover:text-[#DE3F5E] transition-colors">Blog</Link>
                  <Link href="/contact" className="text-[#4a4a4a] hover:text-[#DE3F5E] transition-colors">Contact</Link>
                  <Link href="/privacy" className="text-[#4a4a4a] hover:text-[#DE3F5E] transition-colors">Privacy</Link>
                </Stack>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="subtitle1" color="#1a1a1a" sx={{ fontWeight: 'bold', mb: 2 }}>
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
            {/* Copyright row — left/right split per latest direction. */}
            <Box
              sx={{
                borderTop: '1px solid rgba(0,0,0,0.1)',
                mt: 8,
                pt: 4,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 2,
              }}
            >
              <Typography variant="body2" sx={{ color: '#5a5a5a', fontWeight: 500 }}>
                © 2026 Phera Events. All rights reserved.
              </Typography>
              <Typography variant="caption" sx={{ color: COLORS.text.faint }}>
                Phera Events is owned and operated by Ghumaan Ventures, LLC.
              </Typography>
            </Box>
          </div>
        </Box>
      </Box>

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
    </OptimizedBackground>
  );
}
