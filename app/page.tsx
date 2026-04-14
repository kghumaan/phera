'use client';

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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Avatar,
  Dialog,
} from '@mui/material';
import { useState, useRef, useEffect, useMemo, Suspense } from 'react';
import { motion, useScroll, useTransform, useMotionValueEvent } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  SentimentDissatisfied,
  Warning,
  ExpandMore,
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

// --- Data & Content ---

// Combined features with problem + solution
const features = [
  {
    id: 'guest-outreach',
    title: 'We collect every detail from your guests',
    problem: 'Chasing 300 guests across WhatsApp groups for RSVPs, dietary needs, and +1 counts.',
    solution: 'We reach out on your behalf — save-the-dates, RSVPs, dietary, event-by-event attendance. Auto follow-ups for non-responders, escalations only when it matters.',
    featureImage: '/images/feature_images/wedding_website.png',
    frameType: 'desktop' as const,
  },
  {
    id: 'travel-coordination',
    title: 'We coordinate flights, shuttles, and everything in between',
    problem: "Spreadsheets of flight numbers, hotel blocks, and shuttle manifests you're updating at midnight.",
    solution: 'We collect travel plans from every guest, optimize shuttle routes and timings, and send pickup reminders. Nobody gets stranded at the airport.',
    featureImage: '/images/feature_images/travel_coordination.png',
    frameType: 'desktop' as const,
  },
  {
    id: 'guest-communication',
    title: 'We answer every guest question, 24/7',
    problem: "Guests messaging you at 2 AM asking about dress code, venue directions, and what to pack.",
    solution: 'An AI concierge on WhatsApp answers schedule, venue, dress code, and local questions instantly — in English or Hindi, in their timezone.',
    frameType: 'mobile' as const,
    customComponent: <WhatsAppConcierge hideNotch dense sx={{ borderRadius: 0 }} />,
  },
  {
    id: 'reverse-destination',
    title: "Your friends from abroad? We've got them.",
    problem: 'Non-Indian friends and colleagues flying in with no idea what a sangeet is, what to wear, or how visas work.',
    solution: 'Cultural briefings per event, dress-code guides, visa walkthroughs, ceremony explainers — all delivered through WhatsApp before they board.',
    featureImage: '/images/feature_images/multi_event.png',
    frameType: 'desktop' as const,
  },
];

const pricingTiers = [
  {
    name: 'PHERA BASE',
    price: '$349',
    priceSuffix: '/wedding',
    description: 'Up to 200 guests',
    features: [
      'Guest logistics via WhatsApp',
      'Proactive outreach sequences',
      'WhatsApp Flows RSVP',
      '24/7 WhatsApp Concierge',
      'Custom wedding website',
      'Transportation optimization',
      'Control Tower dashboard',
    ],
    buttonText: 'Get Started',
    highlight: false,
  },
  {
    name: 'PHERA PREMIUM',
    price: '$599',
    priceSuffix: '/wedding',
    description: 'Up to 400 guests',
    features: [
      'Everything in Base',
      'Reverse-destination cultural guides',
      'WhatsApp concierge during wedding weekend',
      'Priority escalation support',
    ],
    buttonText: 'Get Started',
    highlight: true,
  },
  {
    name: 'PHERA GRAND',
    price: '$799',
    priceSuffix: '/wedding',
    description: '400+ guests',
    features: [
      'Everything in Premium',
      'Dedicated coordination support',
      'Custom outreach sequences',
    ],
    buttonText: 'Get Started',
    highlight: false,
  },
];

const faqs = [
  {
    q: 'How does the guest coordination work?',
    a: 'Phera proactively reaches out to every guest via WhatsApp on your behalf. We send save-the-dates, collect RSVPs, gather travel details, assign shuttles, and send reminders — all automatically on a timeline matched to your wedding date.',
  },
  {
    q: 'What information does Phera collect from my guests?',
    a: 'RSVP confirmations, event attendance, dietary requirements, travel plans, flight details, party size, and any special needs — all collected conversationally via WhatsApp.',
  },
  {
    q: 'Do my guests need to download an app?',
    a: 'No. Everything happens through WhatsApp and your wedding website. Guests just reply to messages — no app downloads, no account creation, no passwords.',
  },
  {
    q: 'What if a guest does not respond on WhatsApp?',
    a: 'Phera sends automatic follow-up nudges on a research-backed schedule. After 3 attempts with no response, the guest is escalated to you with their contact info so you or a family member can reach out personally.',
  },
  {
    q: 'I already have a wedding website — can I still use Phera?',
    a: 'Absolutely. Phera complements any existing wedding website. We handle the guest logistics layer — outreach, coordination, concierge — regardless of where your website lives.',
  },
  {
    q: 'Can I customize my wedding website myself?',
    a: 'Yes. Three options: design it yourself with full customization, let AI build it from a conversation about your wedding, or work 1-on-1 with our team to nail your vision.',
  },
  {
    q: 'Do I still need a day-of coordinator?',
    a: 'Phera handles pre-wedding coordination — the weeks and months of guest logistics leading up to your wedding. We recommend pairing with a local day-of coordinator for on-site execution. Together you get planner-quality outcomes at a fraction of the cost.',
  },
  {
    q: 'Is my guests\' data safe?',
    a: 'Yes. We are DPDPA 2023 compliant. Every guest gives explicit consent. Data is retained only until 90 days after your wedding, then deleted. You and your guests can withdraw consent at any time.',
  },
];

// --- Animation Variants ---
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};


// --- Features Scroll Section Component ---

interface FeatureItem {
  id: string;
  title: string;
  problem: string;
  solution: string;
  featureImage?: string;
  featureImage2?: string;
  customComponent?: React.ReactNode;
  frameType?: 'desktop' | 'desktop-stacked' | 'mobile' | 'none';
  isPro?: boolean;
}

const FeaturesSection = ({ items }: { items: FeatureItem[] }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const isScrollingToFeature = useRef(false);
  const scrollTargetIndex = useRef<number | null>(null);
  const [expandedImage, setExpandedImage] = useState<{ src: string; alt: string } | null>(null);

  // Use framer-motion for reliable scroll tracking
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Map the scroll progress (0-1) to the active index
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    // When programmatically scrolling, only update when we reach the target
    if (isScrollingToFeature.current && scrollTargetIndex.current !== null) {
      const targetIndex = scrollTargetIndex.current;
      const currentIndex = Math.min(
        Math.floor(latest * items.length),
        items.length - 1
      );
      if (currentIndex === targetIndex) {
        setActiveIndex(targetIndex);
        isScrollingToFeature.current = false;
        scrollTargetIndex.current = null;
      }
      return;
    }

    const newIndex = Math.min(
      Math.floor(latest * items.length),
      items.length - 1
    );
    if (newIndex !== activeIndex) {
      setActiveIndex(newIndex);
    }
  });

  // Calculate container height (60vh per item)
  const containerHeight = items.length * 60;

  // Click handler to scroll to a specific feature
  const scrollToFeature = (index: number) => {
    if (!containerRef.current || index === activeIndex) return;

    // Immediately set the active index so the UI updates right away
    isScrollingToFeature.current = true;
    scrollTargetIndex.current = index;
    setActiveIndex(index);

    const containerTop = containerRef.current.offsetTop;
    const containerPxHeight = containerRef.current.offsetHeight;
    const viewportHeight = window.innerHeight;
    // scrollYProgress goes 0→1 as we scroll from containerTop to (containerTop + containerPxHeight - viewportHeight)
    // For feature index i, target progress = (i + 0.5) / items.length
    const scrollRange = containerPxHeight - viewportHeight;
    const targetProgress = (index + 0.5) / items.length;
    const targetScroll = containerTop + targetProgress * scrollRange;
    window.scrollTo({ top: targetScroll, behavior: 'smooth' });

    // Safety timeout to re-enable scroll tracking if scroll event never hits exact target
    setTimeout(() => {
      isScrollingToFeature.current = false;
      scrollTargetIndex.current = null;
    }, 1200);
  };

  return (
    <>
      {/* Desktop Version */}
      <Box
        ref={containerRef}
        sx={{
          display: { xs: 'none', md: 'block' },
          position: 'relative',
          height: `${containerHeight}vh`,
          overflow: 'clip', // Clip the right-edge bleed from desktop browser frames
        }}
      >
        <Box
          sx={{
            position: 'sticky',
            top: 0,
            height: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10,
          }}
        >
          {/* Full-width container - left side padded, right side extends to viewport edge */}
          <Box
            sx={{
              width: '100%',
              pl: { md: 6, lg: 10 },
              pr: 0,
              display: 'flex',
              gap: { md: 4, lg: 6 },
              alignItems: 'center',
            }}
          >
            {/* Left Side - Content (fixed pane + stepper) */}
            <Box
              sx={{
                flex: 1,
                maxWidth: { md: '460px', lg: '560px' },
                display: 'flex',
                flexDirection: 'column',
                height: '80vh',
              }}
            >
              {/* Section Header - pinned top */}
              <Typography
                sx={{
                  fontFamily: 'var(--font-instrument-serif)',
                  fontStyle: 'italic',
                  fontSize: { md: '1.75rem', lg: '2.25rem' },
                  lineHeight: 1.1,
                  color: '#1a1a1a',
                  mb: { md: 4, lg: 5 },
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                }}
              >
                Everything you need,{' '}
                <Box component="span" sx={{ color: '#DE3F5E' }}>
                  simplified
                </Box>
              </Typography>

              {/* Active feature content — fixed slot, cross-fades */}
              <Box
                sx={{
                  position: 'relative',
                  flex: 1,
                  minHeight: { md: '340px', lg: '380px' },
                }}
              >
                {items.map((item, idx) => {
                  const isActive = idx === activeIndex;
                  return (
                    <motion.div
                      key={item.id}
                      initial={false}
                      animate={{ opacity: isActive ? 1 : 0 }}
                      transition={{ duration: 0.35, ease: 'easeOut' }}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        pointerEvents: isActive ? 'auto' : 'none',
                      }}
                    >
                      <Typography
                        sx={{
                          color: '#1a1a1a',
                          fontSize: { md: '2rem', lg: '2.5rem' },
                          fontWeight: 500,
                          lineHeight: 1.15,
                          mb: { md: 3, lg: 4 },
                        }}
                      >
                        {item.title}
                      </Typography>
                      <Typography
                        sx={{
                          color: '#888',
                          fontSize: { md: '1rem', lg: '1.15rem' },
                          lineHeight: 1.6,
                          mb: 2,
                        }}
                      >
                        <Box component="span" sx={{ color: '#DE3F5E', fontWeight: 500 }}>
                          The problem:
                        </Box>{' '}
                        {item.problem}
                      </Typography>
                      <Typography
                        sx={{
                          color: '#555',
                          fontSize: { md: '1rem', lg: '1.15rem' },
                          lineHeight: 1.6,
                        }}
                      >
                        <Box component="span" sx={{ color: '#DE3F5E', fontWeight: 500 }}>
                          Our solution:
                        </Box>{' '}
                        {item.solution}
                      </Typography>
                    </motion.div>
                  );
                })}
              </Box>

              {/* Stepper — dots only, clickable */}
              <Box
                sx={{
                  display: 'flex',
                  gap: 1.25,
                  alignItems: 'center',
                  pt: 4,
                  mt: 'auto',
                  flexShrink: 0,
                }}
              >
                {items.map((item, idx) => {
                  const isActive = idx === activeIndex;
                  return (
                    <Box
                      key={item.id}
                      onClick={() => scrollToFeature(idx)}
                      sx={{
                        width: isActive ? 32 : 8,
                        height: 8,
                        borderRadius: '999px',
                        bgcolor: isActive ? '#DE3F5E' : alpha('#000', 0.15),
                        cursor: isActive ? 'default' : 'pointer',
                        transition: 'all 0.3s ease',
                        '&:hover': !isActive
                          ? { bgcolor: alpha('#000', 0.3) }
                          : {},
                      }}
                    />
                  );
                })}
              </Box>
            </Box>

            {/* Right Side - Feature Images */}
            <Box
              sx={{
                flex: 1.4,
                height: '90vh',
                position: 'relative',
                overflow: 'visible',
                minWidth: 0, // Allow flex child to shrink
              }}
            >
              {items.map((item, idx) => {
                const position = idx - activeIndex; // -n = above/past, 0 = active, +n = below/upcoming
                return (
                <motion.div
                  key={item.id}
                  initial={false}
                  animate={{
                    opacity: position === 0 ? 1 : 0,
                    y: position === 0 ? '0%' : position < 0 ? '-110%' : '110%',
                  }}
                  transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: item.frameType === 'mobile' ? 'center' : 'flex-start',
                    pointerEvents: position === 0 ? 'auto' : 'none',
                  }}
                >
                  {item.featureImage && item.frameType === 'desktop' && (
                    /* Browser Frame — extends past viewport right edge */
                    <Box
                      sx={{
                        width: 'calc(100% + 8vw)', // Extends past the right edge of the viewport
                        minWidth: { md: '700px', lg: '900px' },
                        borderRadius: '12px 0 0 12px',
                        overflow: 'hidden',
                        boxShadow: '-10px 30px 80px rgba(0,0,0,0.18), -5px 10px 30px rgba(0,0,0,0.1)',
                        bgcolor: 'white',
                        border: '1px solid',
                        borderColor: alpha('#000', 0.08),
                        borderRight: 'none',
                      }}
                    >
                      {/* Browser Title Bar */}
                      <Box
                        sx={{
                          height: { md: 36, lg: 42 },
                          bgcolor: '#f1f1f1',
                          borderBottom: '1px solid',
                          borderColor: alpha('#000', 0.08),
                          display: 'flex',
                          alignItems: 'center',
                          px: 2,
                          gap: 1,
                        }}
                      >
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#ff5f57' }} />
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#febc2e' }} />
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#28c840' }} />
                      </Box>
                      {/* Screenshot */}
                      <Box sx={{ width: '100%', lineHeight: 0, position: 'relative' }}>
                        <Image
                          src={item.featureImage!}
                          alt={item.title}
                          width={2694}
                          height={1302}
                          quality={85}
                          sizes="(max-width: 768px) 100vw, 60vw"
                          style={{
                            width: '100%',
                            height: 'auto',
                            display: 'block',
                          }}
                        />
                      </Box>
                    </Box>
                  )}

                  {item.featureImage && item.featureImage2 && item.frameType === 'desktop-stacked' && (
                    /* Stacked Browser Frames — coordinator1 base (normal pos), coordinator2 overlay (down-right) */
                    <Box
                      sx={{
                        position: 'relative',
                        width: 'calc(100% + 8vw)',
                        minWidth: { md: '700px', lg: '900px' },
                      }}
                    >
                      {/* Base frame (coordinator1) — exact same position as regular desktop frames */}
                      <Box
                        sx={{
                          borderRadius: '12px 0 0 12px',
                          overflow: 'hidden',
                          boxShadow: '-10px 30px 80px rgba(0,0,0,0.18), -5px 10px 30px rgba(0,0,0,0.1)',
                          bgcolor: 'white',
                          border: '1px solid',
                          borderColor: alpha('#000', 0.08),
                          borderRight: 'none',
                        }}
                      >
                        <Box
                          sx={{
                            height: { md: 36, lg: 42 },
                            bgcolor: '#f1f1f1',
                            borderBottom: '1px solid',
                            borderColor: alpha('#000', 0.08),
                            display: 'flex',
                            alignItems: 'center',
                            px: 2,
                            gap: 1,
                          }}
                        >
                          <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#ff5f57' }} />
                          <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#febc2e' }} />
                          <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#28c840' }} />
                        </Box>
                        <Box sx={{ width: '100%', lineHeight: 0 }}>
                          <Image
                            src={item.featureImage!}
                            alt={`${item.title} - overview`}
                            width={2694}
                            height={1302}
                            quality={85}
                            sizes="(max-width: 768px) 100vw, 60vw"
                            style={{ width: '100%', height: 'auto', display: 'block' }}
                          />
                        </Box>
                      </Box>
                      {/* Overlay frame (coordinator2) — offset down and to the right */}
                      <Box
                        sx={{
                          position: 'absolute',
                          top: { md: '40%', lg: '40%' },
                          left: { md: '35%', lg: '35%' },
                          width: '100%',
                          borderRadius: '12px 0 0 12px',
                          overflow: 'hidden',
                          boxShadow: '-15px 35px 90px rgba(0,0,0,0.22), -8px 15px 40px rgba(0,0,0,0.14)',
                          bgcolor: 'white',
                          border: '1px solid',
                          borderColor: alpha('#000', 0.08),
                          borderRight: 'none',
                          zIndex: 2,
                        }}
                      >
                        <Box
                          sx={{
                            height: { md: 36, lg: 42 },
                            bgcolor: '#f1f1f1',
                            borderBottom: '1px solid',
                            borderColor: alpha('#000', 0.08),
                            display: 'flex',
                            alignItems: 'center',
                            px: 2,
                            gap: 1,
                          }}
                        >
                          <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#ff5f57' }} />
                          <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#febc2e' }} />
                          <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#28c840' }} />
                        </Box>
                        <Box sx={{ width: '100%', lineHeight: 0 }}>
                          <Image
                            src={item.featureImage2!}
                            alt={`${item.title} - detail`}
                            width={2694}
                            height={1302}
                            quality={85}
                            sizes="(max-width: 768px) 100vw, 60vw"
                            style={{ width: '100%', height: 'auto', display: 'block' }}
                          />
                        </Box>
                      </Box>
                    </Box>
                  )}

                  {(item.featureImage || item.customComponent) && item.frameType === 'mobile' && (
                    <IPhoneMockup
                      width={{ md: '320px', lg: '380px' }}
                      sx={{ mx: 'auto' }}
                    >
                      {item.customComponent ? (
                        item.customComponent
                      ) : (
                        <Image
                          src={item.featureImage!}
                          alt={item.title}
                          fill
                          quality={85}
                          sizes="380px"
                          style={{
                            objectFit: 'cover',
                            objectPosition: 'top',
                          }}
                        />
                      )}
                    </IPhoneMockup>
                  )}

                </motion.div>
                );
              })}
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Mobile Stacked Version */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        {/* Mobile Header */}
        <Box sx={{ py: 6, px: 3, textAlign: 'center' }}>
          <Typography
            sx={{
              fontFamily: 'var(--font-instrument-serif)',
              fontStyle: 'italic',
              fontSize: '2rem',
              lineHeight: 1.15,
              color: '#1a1a1a',
            }}
          >
            Everything you need,{' '}
            <Box component="span" sx={{ color: '#DE3F5E' }}>
              simplified
            </Box>
          </Typography>
        </Box>

        {/* Mobile Items */}
        <Box sx={{ px: 3, pb: 6 }}>
          <Stack spacing={4}>
            {items.map((item) => (
              <Box
                key={item.id}
                sx={{
                  pb: 4,
                  borderBottom: '1px solid',
                  borderColor: alpha('#000', 0.08),
                }}
              >
                {/* Feature Image */}
                {item.featureImage && (item.frameType === 'desktop' || item.frameType === 'desktop-stacked') && (
                  <Box
                    onClick={() => setExpandedImage({ src: item.featureImage!, alt: item.title })}
                    sx={{
                      mx: -1.5, // Slight margin on each side
                      borderRadius: '8px',
                      overflow: 'hidden',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                      bgcolor: 'white',
                      border: '1px solid',
                      borderColor: alpha('#000', 0.08),
                      mb: 3,
                      cursor: 'zoom-in',
                    }}
                  >
                    <Box
                      sx={{
                        height: 24,
                        bgcolor: '#f1f1f1',
                        borderBottom: '1px solid',
                        borderColor: alpha('#000', 0.08),
                        display: 'flex',
                        alignItems: 'center',
                        px: 1,
                        gap: 0.5,
                      }}
                    >
                      <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#ff5f57' }} />
                      <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#febc2e' }} />
                      <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#28c840' }} />
                    </Box>
                    <Image src={item.featureImage!} alt={item.title} width={2694} height={1302} quality={85} sizes="100vw" style={{ width: '100%', height: 'auto', display: 'block' }} />
                  </Box>
                )}
                {(item.featureImage || item.customComponent) && item.frameType === 'mobile' && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                    <Box
                      sx={{
                        width: '220px',
                        height: item.customComponent ? '400px' : 'auto',
                        borderRadius: '28px',
                        overflow: 'hidden',
                        boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
                        bgcolor: '#1a1a1a',
                        border: '8px solid #1a1a1a',
                        position: 'relative',
                      }}
                    >
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: '70px',
                          height: '18px',
                          bgcolor: '#1a1a1a',
                          borderBottomLeftRadius: '10px',
                          borderBottomRightRadius: '10px',
                          zIndex: 20,
                        }}
                      />
                      <Box sx={{ borderRadius: '20px', overflow: 'hidden', lineHeight: 0, height: '100%' }}>
                        {item.customComponent ? (
                          item.customComponent
                        ) : (
                          <Image
                            src={item.featureImage!}
                            alt={item.title}
                            width={726}
                            height={1566}
                            quality={85}
                            sizes="220px"
                            style={{ width: '100%', height: 'auto', display: 'block' }}
                          />
                        )}
                      </Box>
                    </Box>
                  </Box>
                )}

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Typography
                    sx={{
                      color: '#1a1a1a',
                      fontSize: '1.35rem',
                      fontWeight: 400,
                      lineHeight: 1.3,
                    }}
                  >
                    {item.title}
                  </Typography>
                  {item.isPro && (
                    <Box
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 0.3,
                        bgcolor: alpha('#DE3F5E', 0.08),
                        color: '#DE3F5E',
                        px: 0.8,
                        py: 0.25,
                        borderRadius: '12px',
                      }}
                    >
                      <AutoAwesome sx={{ fontSize: '0.65rem' }} />
                      <Typography
                        sx={{
                          fontSize: '0.6rem',
                          fontWeight: 700,
                          letterSpacing: '0.5px',
                        }}
                      >
                        PRO
                      </Typography>
                    </Box>
                  )}
                </Box>

                <Typography
                  sx={{
                    color: '#888',
                    fontSize: '0.95rem',
                    lineHeight: 1.6,
                    mb: 1.5,
                  }}
                >
                  <Box component="span" sx={{ color: '#DE3F5E', fontWeight: 500 }}>
                    The problem:
                  </Box>{' '}
                  {item.problem}
                </Typography>
                <Typography
                  sx={{
                    color: '#555',
                    fontSize: '0.95rem',
                    lineHeight: 1.6,
                  }}
                >
                  <Box component="span" sx={{ color: '#DE3F5E', fontWeight: 500 }}>
                    Our solution:
                  </Box>{' '}
                  {item.solution}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>
      </Box>

      {/* Lightbox for mobile image expansion */}
      <Dialog
        open={!!expandedImage}
        onClose={() => setExpandedImage(null)}
        maxWidth={false}
        PaperProps={{
          sx: {
            bgcolor: 'transparent',
            boxShadow: 'none',
            m: 1,
            maxWidth: '100vw',
            maxHeight: '100vh',
            overflow: 'visible',
          },
        }}
        sx={{
          '& .MuiBackdrop-root': { bgcolor: 'rgba(0,0,0,0.85)' },
        }}
      >
        <IconButton
          onClick={() => setExpandedImage(null)}
          sx={{
            position: 'absolute',
            top: -40,
            right: 0,
            color: 'white',
            zIndex: 1,
          }}
        >
          <Close />
        </IconButton>
        {expandedImage && (
          <Box sx={{ borderRadius: '8px', overflow: 'hidden', bgcolor: 'white' }}>
            <Box
              sx={{
                height: 24,
                bgcolor: '#f1f1f1',
                borderBottom: '1px solid',
                borderColor: alpha('#000', 0.08),
                display: 'flex',
                alignItems: 'center',
                px: 1,
                gap: 0.5,
              }}
            >
              <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#ff5f57' }} />
              <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#febc2e' }} />
              <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#28c840' }} />
            </Box>
            <Image
              src={expandedImage.src}
              alt={expandedImage.alt}
              width={2694}
              height={1302}
              quality={90}
              sizes="95vw"
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
          </Box>
        )}
      </Dialog>
    </>
  );
};

export default function LandingPage() {
  return (
    <Suspense>
      <LandingPageContent />
    </Suspense>
  );
}

function LandingPageContent() {
  const conciergeMessages: Message[] = [
    {
      type: 'guest',
      text: "Hey! What time is the shuttle for the Sangeet leaving?",
      time: "10:42 AM",
    },
    {
      type: 'bot',
      text: <>Hi! The Sangeet shuttles start leaving from <strong>Grand Hyatt Lobby</strong> at <strong>6:30 PM</strong>. Would you like to reserve a seat? 🚐</>,
      time: "10:42 AM",
      hasCheck: true,
    },
    {
      type: 'guest',
      text: "Yes please, for 2 people.",
      time: "10:43 AM",
    },
    {
      type: 'bot',
      text: "Done! ✅ I've reserved 2 seats for you on the 6:30 PM shuttle.",
      time: "10:43 AM",
      hasCheck: true,
    },
    {
      type: 'guest',
      text: "We have some free time before the reception. Any recommendations nearby?",
      time: "11:05 AM",
    },
    {
      type: 'bot',
      text: <>Absolutely! 🌴 The <strong>Oasis Spa</strong> is just a 5-min walk, or grab a coffee at <strong>Blue Tokai</strong>.</>,
      time: "11:06 AM",
      hasCheck: true,
    },
  ];

  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeTier, setUpgradeTier] = useState<'pro' | 'planner'>('pro');
  const [selectedPricingTier, setSelectedPricingTier] = useState(1); // Start with Pro tier
  const [roadmapIndex, setRoadmapIndex] = useState(0);
  const [expanded, setExpanded] = useState<string | false>(false);
  const [expandedImage, setExpandedImage] = useState<{ src: string; alt: string } | null>(null);

  const handleAccordionChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  const roadmapRef = useRef<HTMLDivElement>(null);

  // Auto-open UpgradeModal when redirected back with tier param
  useEffect(() => {
    const tier = searchParams.get('tier');
    if (tier && (tier === 'pro' || tier === 'planner') && user) {
      setUpgradeTier(tier);
      setUpgradeModalOpen(true);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [searchParams, user]);

  const handleTierAction = (targetTier: 'pro' | 'planner', e?: React.MouseEvent) => {
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

  const handleProAction = (e?: React.MouseEvent) => handleTierAction('pro', e);
  const handlePlannerAction = (e?: React.MouseEvent) => handleTierAction('planner', e);

  useEffect(() => {
    const handleScroll = (ref: React.RefObject<HTMLDivElement | null>, setIndex: (i: number) => void, itemCount: number) => {
      if (!ref.current) return;
      const scrollLeft = ref.current.scrollLeft;
      const itemWidth = ref.current.scrollWidth / itemCount;
      const index = Math.round(scrollLeft / itemWidth);
      setIndex(Math.min(index, itemCount - 1));
    };

    const roadmapEl = roadmapRef.current;
    const roadmapHandler = () => handleScroll(roadmapRef, setRoadmapIndex, 4); // 4 roadmap items

    roadmapEl?.addEventListener('scroll', roadmapHandler);

    return () => {
      roadmapEl?.removeEventListener('scroll', roadmapHandler);
    };
  }, []);

  return (
    <OptimizedBackground
      useAppDefault={true}
      className="min-h-screen flex flex-col"
    >
      {/* SEO Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Phera",
              "url": "https://www.phera.io",
              "logo": "https://www.phera.io/logo.svg",
              "sameAs": [
                "https://instagram.com/withphera"
              ],
              "contactPoint": {
                "@type": "ContactPoint",
                "email": "contact@phera.io",
                "contactType": "customer support"
              }
            },
            {
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": faqs.map(faq => ({
                "@type": "Question",
                "name": faq.q,
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": faq.a
                }
              }))
            }
          ])
        }}
      />
      <AppHeader
        variant="transparent"
      />

      <Box component="main" sx={{ flexGrow: 1 }}>
        {/* --- HERO SECTION --- */}
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Container maxWidth="lg" sx={{ py: { xs: 4, md: 8 } }}>
            <motion.div initial="hidden" animate="visible" variants={fadeIn}>
              <Stack spacing={{ xs: 3, md: 4 }} sx={{ alignItems: 'center', textAlign: 'center' }}>
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.75,
                    px: 2,
                    py: 0.75,
                    borderRadius: '999px',
                    border: '1px solid rgba(0,0,0,0.08)',
                    bgcolor: 'rgba(255,255,255,0.7)',
                    backdropFilter: 'blur(8px)',
                    color: '#4a4a4a',
                    fontSize: { xs: '0.8rem', md: '0.875rem' },
                    fontWeight: 500,
                  }}
                >
                  <AutoAwesome sx={{ fontSize: '0.95rem', color: '#DE3F5E' }} />
                  Wedding operations, done for you
                </Box>
                <Typography
                  variant="h1"
                  sx={{
                    fontFamily: 'var(--font-instrument-serif)',
                    fontSize: { xs: '3rem', md: '4.5rem', lg: '5.5rem' },
                    lineHeight: 1.05,
                    letterSpacing: '-0.02em',
                    color: '#1a1a1a',
                    maxWidth: '1100px',
                  }}
                >
                  We run your wedding,<br />so you can live it.
                </Typography>
                <Typography
                  sx={{
                    fontSize: { xs: '1.1rem', md: '1.35rem' },
                    color: '#4a4a4a',
                    maxWidth: '720px',
                    lineHeight: 1.5,
                    fontWeight: 400,
                    px: { xs: 2, md: 0 },
                  }}
                >
                  Phera coordinates your guests — RSVPs, travel, shuttles, questions — end to end on WhatsApp.
                </Typography>

                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={2}
                  sx={{ pt: 2 }}
                >
                  <Button
                    component={Link}
                    href="/auth/login"
                    variant="contained"
                    size="large"
                    sx={{
                      bgcolor: '#DE3F5E',
                      color: 'white',
                      minWidth: { xs: 220, md: 280 },
                      px: { xs: 4, md: 6 },
                      py: { xs: 1.2, md: 2 },
                      borderRadius: '32px',
                      fontSize: { xs: '1rem', md: '1.25rem' },
                      textTransform: 'none',
                      fontWeight: 700,
                      '&:hover': { bgcolor: '#C8365A' },
                    }}
                  >
                    Get Started
                  </Button>
                  <Button
                    component={Link}
                    href="/demo"
                    variant="outlined"
                    size="large"
                    sx={{
                      borderColor: '#DE3F5E',
                      color: '#DE3F5E',
                      minWidth: { xs: 220, md: 280 },
                      px: { xs: 4, md: 6 },
                      py: { xs: 1.2, md: 2 },
                      borderRadius: '32px',
                      fontSize: { xs: '1rem', md: '1.25rem' },
                      textTransform: 'none',
                      fontWeight: 700,
                      '&:hover': {
                        borderColor: '#C8365A',
                        bgcolor: alpha('#DE3F5E', 0.05),
                      },
                    }}
                  >
                    See How It Works
                  </Button>
                </Stack>
              </Stack>
            </motion.div>
          </Container>
        </Box>

        {/* --- FEATURES SECTION --- */}
        <Box id="features">
          <FeaturesSection items={features} />
        </Box>

        {/* --- FOR PLANNERS SECTION --- */}
        <Box id="planners" sx={{ py: { xs: 6, md: 10 }, bgcolor: '#FFFFFF', overflow: 'hidden' }}>
          <Container maxWidth="xl" sx={{ pl: { md: 6, lg: 10 } }}>
            <Grid container spacing={{ xs: 4, md: 8 }} alignItems="center">
              <Grid size={{ xs: 12, md: 5 }}>
                <motion.div
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeIn}
                >
                  <Typography
                    variant="overline"
                    sx={{ color: '#DE3F5E', fontWeight: 800, letterSpacing: '2px', fontSize: { xs: '0.65rem', md: '0.75rem' } }}
                  >
                    FOR WEDDING PLANNERS
                  </Typography>
                  <Typography
                    variant="h2"
                    sx={{
                      fontFamily: 'var(--font-instrument-serif)',
                      fontStyle: 'italic',
                      lineHeight: 1.1,
                      color: '#1a1a1a',
                      mt: 1,
                      mb: 2,
                      fontSize: { xs: '2.5rem', md: '3.5rem' },
                    }}
                  >
                    Manage multiple weddings with ease.
                  </Typography>
                  <Typography variant="h6" sx={{ color: '#4a4a4a', fontWeight: 400, fontSize: { xs: '1rem', md: '1.25rem' }, lineHeight: 1.6, mb: 4 }}>
                    Give your clients a premium, tech-forward guest experience.
                    Manage all your events, RSVPs, and guest communications from a single, unified dashboard.
                  </Typography>

                  <List sx={{ mb: { xs: 2, md: 4 } }}>
                    {[
                      { icon: <Dashboard />, text: "Single dashboard for all your clients" },
                      { icon: <AutoAwesome />, text: "Premium, modern guest experience" },
                      { icon: <SupportAgent />, text: "Reduce repetitive guest questions" }
                    ].map((item, idx) => (
                      <ListItem key={idx} sx={{ px: 0, py: { xs: 0.5, md: 1 } }}>
                        <ListItemIcon sx={{ minWidth: { xs: 36, md: 44 } }}>
                          <Box sx={{ color: '#DE3F5E', bgcolor: alpha('#DE3F5E', 0.1), p: 1, borderRadius: '50%', display: 'flex' }}>
                            {item.icon}
                          </Box>
                        </ListItemIcon>
                        <ListItemText
                          primary={item.text}
                          primaryTypographyProps={{ fontSize: { xs: '0.95rem', md: '1.1rem' }, color: '#1a1a1a', fontWeight: 500 }}
                        />
                      </ListItem>
                    ))}
                  </List>

                  <Button
                    component={Link}
                    href="/auth/login?role=planner"
                    variant="contained"
                    size="large"
                    sx={{
                      bgcolor: '#DE3F5E',
                      color: 'white',
                      px: { xs: 4, md: 5 },
                      py: { xs: 1.2, md: 1.5 },
                      borderRadius: '32px',
                      fontSize: { xs: '0.95rem', md: '1.1rem' },
                      fontWeight: 'bold',
                      textTransform: 'none',
                      '&:hover': { bgcolor: '#C8365A' },
                    }}
                  >
                    Start as a Planner
                  </Button>
                </motion.div>
              </Grid>

              <Grid size={{ xs: 12, md: 7 }}>
                <motion.div
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={{
                    hidden: { opacity: 0, x: 20 },
                    visible: { opacity: 1, x: 0, transition: { duration: 0.8 } }
                  }}
                >
                  <Box
                    onClick={() => setExpandedImage({ src: "/images/feature_images/planner.png", alt: "Planner Dashboard" })}
                    sx={{
                      width: { md: '110%', lg: '120%' },
                      maxWidth: 'none',
                      borderRadius: '12px 0 0 12px',
                      overflow: 'hidden',
                      boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 8px 24px rgba(0,0,0,0.1)',
                      bgcolor: 'white',
                      border: '1px solid',
                      borderColor: alpha('#000', 0.08),
                      borderRight: 'none',
                      cursor: 'zoom-in'
                    }}
                  >
                    {/* Browser Title Bar */}
                    <Box
                      sx={{
                        height: { xs: 24, md: 36 },
                        bgcolor: '#f1f1f1',
                        borderBottom: '1px solid',
                        borderColor: alpha('#000', 0.08),
                        display: 'flex',
                        alignItems: 'center',
                        px: 1.5,
                        gap: 0.8,
                      }}
                    >
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#ff5f57' }} />
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#febc2e' }} />
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#28c840' }} />
                    </Box>
                    {/* Screenshot */}
                    <Box sx={{ width: '100%', lineHeight: 0, position: 'relative' }}>
                      <Image
                        src="/images/feature_images/planner.png"
                        alt="Planner Dashboard"
                        width={2694}
                        height={1302}
                        quality={85}
                        style={{
                          width: '100%',
                          height: 'auto',
                          display: 'block',
                        }}
                      />
                    </Box>
                  </Box>
                </motion.div>
              </Grid>
            </Grid>
          </Container>
        </Box>

        {/* --- WHATSAPP AGENT SHOWCASE --- */}
        <Box sx={{
          minHeight: { md: '90vh' },
          py: { xs: 6, md: 0 },
          display: 'flex',
          alignItems: 'center',
          bgcolor: '#075E54',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Decorative background circle */}
          <Box sx={{
            position: 'absolute',
            top: -100,
            right: -100,
            width: { xs: 200, md: 400 },
            height: { xs: 200, md: 400 },
            bgcolor: 'rgba(255,255,255,0.1)',
            borderRadius: '50%',
          }} />

          <Container maxWidth="xl" sx={{ pl: { md: 6, lg: 10 }, pr: { md: 6, lg: 10 } }}>
            <Grid container spacing={{ xs: 3, md: 4 }} alignItems="center">
              <Grid size={{ xs: 12, md: 8 }}>
                <motion.div
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeIn}
                >
                  <Stack direction="row" spacing={{ xs: 1, md: 2 }} alignItems="center" sx={{ mb: { xs: 1.5, md: 2 } }}>
                    <Typography
                      variant="h2"
                      sx={{
                        fontFamily: 'var(--font-instrument-serif)',
                        fontStyle: 'italic',
                        // fontSize: { xs: '2rem', md: '3rem', lg: '4rem' },
                        lineHeight: 1.1,
                        color: 'white'
                      }}
                    >
                      Your 24/7 Wedding Concierge
                    </Typography>
                    <StreamlineIcon name="whatsapp" sx={{ width: { xs: 40, md: 50 }, height: { xs: 40, md: 50 }, color: 'white' }} />

                  </Stack>
                  <Typography variant="h6" sx={{ mb: { xs: 2, md: 6 }, opacity: 0.9, fontWeight: 400, fontSize: { xs: '1.05rem', md: '1.4rem' }, lineHeight: 1.4, color: 'white' }}>
                    Stop being your guests' personal assistant. Let our intelligent WhatsApp
                    Concierge handle the repetitive questions so you can focus on your celebration.
                  </Typography>

                  <List sx={{ mb: { xs: 1, md: 2 }, color: 'white' }}>
                    {[
                      { icon: <SupportAgent />, text: "Answers FAQs about schedule, venue, and dress code" },
                      { icon: <DirectionsBus />, text: "Coordinates shuttle sign-ups and airport pickups" },
                      { icon: <Campaign />, text: "Broadcasts urgent updates to your entire guest list" },
                      { icon: <Check />, text: "All data comes directly from your wedding website" }
                    ].map((item, idx) => (
                      <ListItem key={idx} sx={{ px: 0, py: { xs: 0.25, md: 0.5 } }}>
                        <ListItemIcon sx={{ color: 'white', minWidth: { xs: 28, md: 40 } }}>
                          <Box sx={{ '& svg': { fontSize: { xs: '1.2rem', md: '1.5rem' } } }}>
                            {item.icon}
                          </Box>
                        </ListItemIcon>
                        <ListItemText
                          primary={item.text}
                          primaryTypographyProps={{ fontSize: { xs: '0.9rem', md: '1.25rem' }, color: 'white' }}
                        />
                      </ListItem>
                    ))}
                  </List>

                  <Button
                    onClick={handleProAction}
                    variant="contained"
                    size="large"
                    sx={{
                      bgcolor: '#25D366',
                      color: 'white',
                      px: { xs: 3, md: 5 },
                      py: { xs: 1, md: 2 },
                      borderRadius: '32px',
                      fontSize: { xs: '0.85rem', md: '1.25rem' },
                      fontWeight: 'bold',
                      textTransform: 'none',
                      mt: { xs: 1.5, md: 2 },
                      '&:hover': { bgcolor: '#128C7E' },
                    }}
                  >
                    Get Guest Concierge
                  </Button>
                </motion.div>
              </Grid>

              <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <motion.div
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={{
                    hidden: { opacity: 0, x: 20 },
                    visible: { opacity: 1, x: 0, transition: { duration: 0.8 } }
                  }}
                >
                  <IPhoneMockup width={{ xs: '260px', sm: '290px', md: '360px', lg: '400px' }}>
                    <WhatsAppConcierge
                      hideNotch
                      dense
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
                sx={{ color: '#DE3F5E', fontWeight: 800, letterSpacing: '2px', fontSize: { xs: '0.65rem', md: '0.75rem' } }}
              >
                HOW IT WORKS
              </Typography>
              <Typography
                variant="h2"
                align="center"
                sx={{
                  fontFamily: 'var(--font-instrument-serif)',
                  fontStyle: 'italic',
                  fontSize: { xs: '1.5rem', md: '3.5rem', lg: '4.5rem' },
                  color: '#1a1a1a',
                  lineHeight: 1.1,
                }}
              >
                Your Journey, Simplified.
              </Typography>
              <Typography variant="h6" sx={{ color: '#4a4a4a', fontWeight: 400, maxWidth: '600px', mx: 'auto', textAlign: 'center', fontSize: { xs: '0.75rem', md: '1.25rem' } }}>
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
            fontFamily: 'var(--font-instrument-serif)',
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
            color: '#DE3F5E',
            boxShadow: '0 8px 16px rgba(0,0,0,0.05)',
            zIndex: 1,
            '& svg': { fontSize: { xs: '1.5rem', md: '2rem' } }
          }}
        >
          {item.icon}
        </Box>

        <Typography variant="h5" sx={{ mb: { xs: 1, md: 2 }, fontFamily: 'var(--font-instrument-serif)', fontStyle: 'italic', zIndex: 1, color: '#1a1a1a', fontSize: { xs: '1rem', md: '1.5rem' } }}>
          {item.title}
        </Typography>

        <Typography variant="body2" sx={{ color: '#666', lineHeight: 1.5, zIndex: 1, fontSize: { xs: '0.8rem', md: '1rem' } }}>
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

        {/* --- PRICING --- */}
        <Box id="pricing" sx={{ bgcolor: '#F0F2F5', py: { xs: 3, md: 10 } }}>
          <Container maxWidth="lg" sx={{ pl: { md: 6, lg: 10 } }}>
            <Stack spacing={1} sx={{ textAlign: 'center', mb: { xs: 2.5, md: 4 } }}>
              <Typography
                variant="h2"
                sx={{
                  fontFamily: 'var(--font-instrument-serif)',
                  fontStyle: 'italic',
                  fontSize: { xs: '1.5rem', md: '3rem' },
                  color: '#1a1a1a',
                }}
              >
                Simple, Transparent Pricing
              </Typography>
              <Typography variant="h6" sx={{ color: '#4a4a4a', fontSize: { xs: '0.75rem', md: '1.25rem' } }}>
                Start free, upgrade for power features.
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
                    borderRadius: '20px',
                    py: 1,
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    bgcolor: selectedPricingTier === idx ? '#DE3F5E' : 'transparent',
                    borderColor: '#DE3F5E',
                    color: selectedPricingTier === idx ? 'white' : '#DE3F5E',
                    '&:hover': {
                      bgcolor: selectedPricingTier === idx ? '#C8365A' : alpha('#DE3F5E', 0.05),
                      borderColor: '#DE3F5E',
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
                      color: '#1a1a1a',
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
                          bgcolor: '#DE3F5E',
                          color: 'white',
                          fontWeight: 'bold',
                          fontSize: { xs: '0.6rem', md: '0.8rem' },
                          height: { xs: '18px', md: '24px' }
                        }}
                      />
                    )}
                    <Typography
                      variant="overline"
                      sx={{ fontWeight: 'bold', opacity: 0.7, color: '#DE3F5E', fontSize: { xs: '0.6rem', md: '0.75rem' } }}
                    >
                      {tier.name}
                    </Typography>
                    <Box sx={{ my: { xs: 0.5, md: 2 } }}>
                      <Typography variant="h3" sx={{ fontWeight: 'bold', display: 'inline', fontSize: { xs: '1.5rem', md: '3rem' } }}>
                        {tier.price}
                      </Typography>
                      {'priceSuffix' in tier && tier.priceSuffix && (
                        <Typography component="span" sx={{ fontSize: { xs: '0.85rem', md: '1.25rem' }, color: '#6a6a6a', fontWeight: 400 }}>
                          {tier.priceSuffix}
                        </Typography>
                      )}
                    </Box>
                    <Typography variant="body2" sx={{ mb: { xs: 1.5, md: 2 }, color: '#4a4a4a', fontSize: { xs: '0.7rem', md: '0.875rem' }, display: { xs: 'none', md: 'block' } }}>
                      {tier.description}
                    </Typography>

                    <List dense sx={{ mb: { xs: 1, md: 2 }, flexGrow: 1 }}>
                      {tier.features.map((feature, fIdx) => (
                        <ListItem key={fIdx} disableGutters sx={{ py: { xs: 0.5, md: 0.75 } }}>
                          <ListItemIcon sx={{ minWidth: { xs: 32, md: 44 } }}>
                            <StreamlineIcon
                              name="check-circle"
                              sx={{
                                color: '#DE3F5E',
                                width: { xs: 22, md: 28 },
                                height: { xs: 22, md: 28 },
                              }}
                            />
                          </ListItemIcon>
                          <ListItemText
                            primary={feature.replace('WhatsApp Concierge Agent', 'WhatsApp Agent')}
                            primaryTypographyProps={{
                              sx: {
                                color: '#1a1a1a',
                                fontWeight: 400,
                                fontSize: { xs: '0.8rem', md: '.9rem' },
                                lineHeight: 1.4
                              }
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>

                    <Button
                      fullWidth
                      onClick={(e: React.MouseEvent) => {
                        if (tier.name === 'PRO') {
                          handleProAction(e);
                        } else if (tier.name === 'PLANNER') {
                          handlePlannerAction(e);
                        }
                      }}
                      component={tier.name === 'PRO' || tier.name === 'PLANNER' ? 'button' : Link}
                      href={tier.name === 'PRO' || tier.name === 'PLANNER' ? undefined : ('buttonHref' in tier && tier.buttonHref ? tier.buttonHref : "/auth/login")}
                      variant={tier.highlight ? 'contained' : 'outlined'}
                      size="small"
                      sx={{
                        borderRadius: { xs: '16px', md: '32px' },
                        py: { xs: 0.75, md: 1.5 },
                        fontSize: { xs: '0.7rem', md: '1rem' },
                        bgcolor: tier.highlight ? '#DE3F5E' : 'transparent',
                        borderColor: '#DE3F5E',
                        color: tier.highlight ? 'white' : '#DE3F5E',
                        '&:hover': {
                          bgcolor: tier.highlight
                            ? '#C8365A'
                            : alpha('#DE3F5E', 0.05),
                          borderColor: '#DE3F5E',
                        },
                      }}
                    >
                      {tier.buttonText.replace('Upgrade to Pro', 'Go Pro')}
                    </Button>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>

        {/* --- FAQ --- */}
        <Container maxWidth="lg" sx={{ py: { xs: 3, md: 10 }, pl: { md: 6, lg: 10 } }}>
          <Stack spacing={2} sx={{ textAlign: 'center', mb: { xs: 3, md: 8 }, alignItems: 'center' }}>
            <Typography
              variant="overline"
              sx={{ color: '#DE3F5E', fontWeight: 800, letterSpacing: '2px', fontSize: { xs: '0.65rem', md: '0.75rem' } }}
            >
              FAQ
            </Typography>
            <Typography
              variant="h2"
              align="center"
              sx={{ fontFamily: 'var(--font-instrument-serif)', fontStyle: 'italic', fontSize: { xs: '1.5rem', md: '3rem' }, color: '#1a1a1a' }}
            >
              Common Questions
            </Typography>
          </Stack>

          <Container maxWidth="md">
            <Stack spacing={1.5}>
              {faqs.map((faq, idx) => (
                <Accordion
                  key={idx}
                  expanded={expanded === `panel${idx}`}
                  onChange={handleAccordionChange(`panel${idx}`)}
                  disableGutters
                  elevation={0}
                  sx={{
                    bgcolor: 'white',
                    border: '1px solid',
                    borderColor: 'rgba(0,0,0,0.06)',
                    borderRadius: '16px !important',
                    overflow: 'hidden',
                    transition: 'all 0.2s ease',
                    '&:before': { display: 'none' },
                    '&:hover': {
                      borderColor: 'rgba(0,0,0,0.12)',
                      transform: 'translateY(-1px)',
                    },
                    '&.Mui-expanded': {
                      boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
                      borderColor: 'transparent',
                    }
                  }}
                >
                  <AccordionSummary
                    expandIcon={<Box sx={{
                      bgcolor: alpha('#DE3F5E', 0.05),
                      color: '#DE3F5E',
                      borderRadius: '50%',
                      p: { xs: 0.3, md: 0.4 },
                      display: 'flex',
                      '& svg': { fontSize: { xs: '1rem', md: '1.25rem' } }
                    }}>
                      <ExpandMore />
                    </Box>}
                    sx={{ px: { xs: 2, md: 3 }, py: { xs: 0.5, md: 1 } }}
                  >
                    <Typography variant="h6" sx={{ fontSize: { xs: '0.85rem', md: '1.1rem' }, fontWeight: 700, color: '#1a1a1a' }}>
                      {faq.q}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ px: { xs: 2, md: 3 }, pb: { xs: 1.5, md: 2.5 }, pt: 0 }}>
                    <Typography variant="body2" sx={{ color: '#666', lineHeight: 1.6, fontSize: { xs: '0.8rem', md: '1rem' } }}>
                      {faq.a}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Stack>
          </Container>
        </Container>

        {/* --- FINAL CTA --- */}
        <FinalCTA />

        {/* --- FOOTER --- */}
        <Box sx={{ bgcolor: '#F5F5F5', color: '#1a1a1a', py: 8 }}>
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
                <Typography variant="body2" sx={{ mb: 2, color: '#4a4a4a' }}>
                  Phera was built by a couple who spent more time coordinating
                  guests than enjoying their own wedding. We built the operations
                  team we wish we had.
                </Typography>
                <Typography variant="body2" sx={{ color: '#4a4a4a' }}>
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
                    sx={{ color: '#DE3F5E', bgcolor: alpha('#DE3F5E', 0.1), '&:hover': { bgcolor: alpha('#DE3F5E', 0.2) } }}
                  >
                    <Instagram />
                  </IconButton>
                  <IconButton
                    component="a"
                    href="mailto:contact@phera.io"
                    sx={{ color: '#DE3F5E', bgcolor: alpha('#DE3F5E', 0.1), '&:hover': { bgcolor: alpha('#DE3F5E', 0.2) } }}
                  >
                    <Email />
                  </IconButton>
                  <IconButton
                    component="a"
                    href="https://wa.me/15558397813"
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ color: '#DE3F5E', bgcolor: alpha('#DE3F5E', 0.1), '&:hover': { bgcolor: alpha('#DE3F5E', 0.2) } }}
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
              <Typography variant="caption" sx={{ color: '#9a9a9a', display: 'block', mt: 0.5 }}>
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

      {/* Lightbox for image expansion */}
      <Dialog
        open={!!expandedImage}
        onClose={() => setExpandedImage(null)}
        maxWidth={false}
        PaperProps={{
          sx: {
            bgcolor: 'transparent',
            boxShadow: 'none',
            m: 1,
            maxWidth: '100vw',
            maxHeight: '100vh',
            overflow: 'visible',
          },
        }}
        sx={{
          '& .MuiBackdrop-root': { bgcolor: 'rgba(0,0,0,0.85)' },
        }}
      >
        <IconButton
          onClick={() => setExpandedImage(null)}
          sx={{
            position: 'absolute',
            top: -40,
            right: 0,
            color: 'white',
            zIndex: 1,
          }}
        >
          <Close />
        </IconButton>
        {expandedImage && (
          <Box sx={{ borderRadius: '8px', overflow: 'hidden', bgcolor: 'white' }}>
            <Box
              sx={{
                height: 24,
                bgcolor: '#f1f1f1',
                borderBottom: '1px solid',
                borderColor: alpha('#000', 0.08),
                display: 'flex',
                alignItems: 'center',
                px: 1.5,
                gap: 0.5,
              }}
            >
              <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#ff5f57' }} />
              <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#febc2e' }} />
              <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#28c840' }} />
            </Box>
            <Image
              src={expandedImage.src}
              alt={expandedImage.alt}
              width={2694}
              height={1302}
              quality={90}
              sizes="95vw"
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
          </Box>
        )}
      </Dialog>
    </OptimizedBackground >
  );
}
