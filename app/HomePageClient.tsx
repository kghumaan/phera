'use client';
/* eslint-disable no-restricted-syntax */
// Footer hex literals (#1a1a1a, #5a5a5a, #FBF7F1, #DE3F5E) are kept inline
// here to preserve the existing footer surface verbatim per latest UX
// direction. Token migration on the footer is tracked separately.

/**
 * Phera landing page.
 *
 * Nine sections — Hero, Meet your planner (voice-forward centerpiece),
 * FeatureStepper ("Everything it handles"), our WhatsApp Concierge dark panel
 * (the planner's guest-facing arm, kept from a prior iteration), Pricing,
 * Origin (Story), FAQ, Vendor Spotlight, FinalCTA — the design-package
 * sections are mirrored 1:1 from the Claude Design package (see /tmp/phera-zip/,
 * also `Phera.zip` at the repo root). The
 * design's CSS lives at app/landing-design.css and is scoped to
 * `.phera-landing` so its classes don't leak into admin or guest surfaces.
 *
 * The shell here only handles auth, modals, SEO, and the footer. Each
 * section component is responsible for its own layout, typography, and
 * background.
 */

import './landing-design.css';
import { useState, useEffect, Suspense } from 'react';
import { Box, Grid, Stack, Typography, IconButton, alpha } from '@mui/material';
import { Instagram, Email, WhatsApp, X } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

import AppHeader from '@/components/shared/AppHeader';
import OptimizedBackground from '@/components/ui/OptimizedBackground';
import UpgradeModal from '@/components/admin/UpgradeModal';
import { useAuth } from '@/lib/contexts/AuthContext';
import WhatsAppConcierge from '@/components/ui/WhatsAppConcierge';
import { CONCIERGE_MESSAGES } from '@/components/landing/concierge-messages';
import IPhoneMockup from '@/components/ui/IPhoneMockup';
import HomePostAuthModalOpener from './HomePostAuthModalOpener';
import { ActionButton } from '@/components/admin/ActionButton';
import HomeNavLinks from '@/components/landing/HomeNavLinks';
import LandingAnnouncementBar from '@/components/landing/LandingAnnouncementBar';

import HeroSection from '@/components/landing/HeroSection';
import MeetYourPlannerSection from '@/components/landing/MeetYourPlannerSection';
import FeatureStepper from '@/components/landing/FeatureStepper';
import PricingSection from '@/components/landing/PricingSection';
import OriginSection from '@/components/landing/OriginSection';
import FAQSection from '@/components/landing/FAQSection';
import FinalCTASection from '@/components/landing/FinalCTASection';
import VendorSpotlightSection from '@/components/landing/VendorSpotlightSection';
import { COLORS } from '@/lib/theme/tokens';
import { FAQ_ITEMS } from '@/lib/landing/faq-content';

// Single source of truth shared with the visible FAQ accordion.
const FAQS_FOR_SCHEMA = FAQ_ITEMS;

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export default function HomePageClient() {
  return <LandingPageContent />;
}

function LandingPageContent() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeTier, setUpgradeTier] = useState<'base' | 'premium' | 'planner_perwedding'>('base');
  // Tier whose CTA was just clicked — drives the spinner on the pricing card
  // until the in-flight redirect (auth or Stripe) takes over the page.
  const [pendingTier, setPendingTier] = useState<'base' | 'premium' | 'planner_perwedding' | null>(null);

  // After post-auth redirect from a pricing CTA (?tier=base|premium|planner_perwedding),
  // resume the upgrade flow once the user lands back here signed in. We strip the
  // query so a refresh doesn't re-open the modal.
  useEffect(() => {
    if (!user || typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const tier = params.get('tier');
    if (tier === 'base' || tier === 'premium' || tier === 'planner_perwedding') {
      setUpgradeTier(tier);
      setPendingTier(tier);
      setUpgradeModalOpen(true);
      params.delete('tier');
      const qs = params.toString();
      window.history.replaceState({}, '', qs ? `/?${qs}` : '/');
    }
  }, [user]);

  const handleTierAction = (targetTier: typeof upgradeTier, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (authLoading || pendingTier) return; // Still resolving auth or already redirecting

    setPendingTier(targetTier);
    setUpgradeTier(targetTier);
    if (user) {
      // UpgradeModal mounts and immediately redirects to the Stripe Payment Link.
      setUpgradeModalOpen(true);
    } else {
      // Encode the target so /?tier=X survives the auth round-trip intact.
      const target = `/?tier=${targetTier}`;
      router.push(`/auth/login?redirect=${encodeURIComponent(target)}`);
    }
  };

  const handleBaseAction = (e?: React.MouseEvent) => handleTierAction('base', e);
  const handlePremiumAction = (e?: React.MouseEvent) => handleTierAction('premium', e);
  // Planners get a dedicated page (positioning + book-a-call) instead of being
  // dropped straight into a $249 Stripe checkout. They start the per-wedding
  // billing flow from inside the planner onboarding.
  const handlePlannerAction = (e?: React.MouseEvent) => {
    e?.preventDefault();
    router.push('/planners');
  };

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

        <MeetYourPlannerSection />

        <FeatureStepper />

        {/* WHATSAPP AGENT SHOWCASE — kept from prior iteration; sits between
            FeatureStepper and Pricing, in the same slot the design's
            ConciergeShowcase occupied, but uses our IPhoneMockup +
            WhatsAppConcierge. */}
        <Box
          className="bg-textured bg-wa-doodles"
          sx={{
            py: 'var(--section-pad, 140px)',
            px: 0,
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
              top: { xs: -60, md: -100 },
              right: { xs: -60, md: -100 },
              width: { xs: 160, md: 400 },
              height: { xs: 160, md: 400 },
              bgcolor: 'rgba(255,255,255,0.06)',
              borderRadius: '50%',
              pointerEvents: 'none',
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
                    <span className="eyebrow" style={{ color: 'white' }}>24/7 guest experience</span>
                  </div>
                  <h2
                    className="display"
                    style={{
                      fontFamily: 'var(--font-instrument-serif), Georgia, serif',
                      fontStyle: 'italic',
                      fontWeight: 400,
                      letterSpacing: '-0.02em',
                      fontSize: 'clamp(50px, 7vw, 88px)',
                      color: 'white',
                      margin: 0,
                      lineHeight: 0.98,
                    }}
                  >
                    Your planner answers <em style={{ color: '#F08AA0' }}>your guests</em>, too.<br />
                    On call <em>at 2 AM.</em>
                  </h2>
                  <Typography
                    sx={{
                      marginTop: 3,
                      fontSize: { xs: 16, md: 18 },
                      color: 'rgba(255,255,255,0.72)',
                      maxWidth: '52ch',
                      lineHeight: 1.55,
                    }}
                  >
                    The same planner, in guest mode: a WhatsApp concierge trained on your wedding — venues, dates, dress codes, weather, restaurants, visa rules. Guests get instant answers. You get to sleep.
                  </Typography>
                  <Box component="ul" sx={{ marginTop: { xs: 3, md: 4 }, listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: { xs: 1.25, md: 1.75 } }}>
                    {[
                      'Trained on your full wedding data - venues, schedule, dress codes',
                      'Knows the local weather, restaurants, things to do, spas',
                      'Handles visa walkthroughs and airport pickups in English or Hindi',
                      'Broadcasts updates and collects replies back from every guest',
                    ].map((line, i) => (
                      <Box component="li" key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, fontSize: { xs: 14, md: 16 }, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}>
                        <Box component="span" sx={{ color: '#F08AA0', fontWeight: 600, marginTop: '2px', flex: 'none' }}>✓</Box>
                        {line}
                      </Box>
                    ))}
                  </Box>
                  <ActionButton
                    href="/auth/signup"
                    variant="contained"
                    className="btn btn-primary"
                    sx={{
                      marginTop: { xs: '28px', md: '36px' },
                      fontSize: { xs: 15, md: 16 },
                      padding: { xs: '13px 22px', md: '16px 28px' },
                      borderRadius: '999px',
                      textTransform: 'none',
                      fontWeight: 600,
                      bgcolor: 'var(--accent)',
                      color: COLORS.text.inverse,
                      '&:hover': { bgcolor: 'var(--accent-hover)' },
                    }}
                    endIcon={<span className="btn-arrow" style={{ display: 'inline-block' }}>→</span>}
                  >
                    Start free
                  </ActionButton>
                  <Typography sx={{ marginTop: 1.5, fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
                    The concierge is part of Base — $349, one-time per wedding.
                  </Typography>
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
                    width={{ xs: '220px', sm: '260px', md: '300px', lg: '320px' }}
                    sx={{ maxHeight: { md: '80dvh' }, mx: { xs: 'auto', md: 0 } }}
                  >
                    <WhatsAppConcierge
                      hideNotch
                      dense
                      scripted
                      messages={CONCIERGE_MESSAGES}
                      sx={{ width: '100%', height: '100%', border: 'none', borderRadius: 0 }}
                    />
                  </IPhoneMockup>
                </motion.div>
              </Grid>
            </Grid>
          </div>
        </Box>

        <PricingSection
          onBaseClick={handleBaseAction}
          onPremiumClick={handlePremiumAction}
          onPlannerClick={handlePlannerAction}
          loadingTier={pendingTier}
        />

        <OriginSection />

        <FAQSection />

        <VendorSpotlightSection />

        <FinalCTASection />

        {/* FOOTER — kept from prior iteration; copyright row updated to
            split-left/right per latest direction. */}
        <Box
          sx={{
            bgcolor: '#FBF7F1',
            color: COLORS.text.strong,
            py: { xs: 5, md: 8 },
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
                  <Link href="/vendors" className="text-[#4a4a4a] hover:text-[#DE3F5E] transition-colors">Vendor Directory</Link>
                  <Link href="/demo" className="text-[#4a4a4a] hover:text-[#DE3F5E] transition-colors">Demo</Link>
                  <Link href="/planners" className="text-[#4a4a4a] hover:text-[#DE3F5E] transition-colors">For Planners</Link>
                  <Link href="/vendors/join" className="text-[#4a4a4a] hover:text-[#DE3F5E] transition-colors">For Vendors</Link>
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
                    href="https://x.com/withphera"
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ color: COLORS.brand.primary, bgcolor: alpha(COLORS.brand.primary, 0.1), '&:hover': { bgcolor: alpha(COLORS.brand.primary, 0.2) } }}
                  >
                    <X />
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

      <LandingAnnouncementBar />

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
