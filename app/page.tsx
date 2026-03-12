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
import { useState, useRef, useEffect, useMemo } from 'react';
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
import FinalCTA from '@/components/shared/FinalCTA';
import AppFooter from '@/components/shared/AppFooter';

// --- Data & Content ---

// Combined features with problem + solution
const features = [
  {
    id: 'website-creation',
    title: 'Wedding Website',
    problem: 'Every wedding website template out there looks the same... and none of them get Indian weddings!',
    solution: 'Beautiful custom website built to feel like an Indian wedding.',
    featureImage: '/images/feature_images/wedding_website.png',
    frameType: 'desktop' as const,
  },
  {
    id: 'rsvp-management',
    title: 'RSVP Collection',
    problem: 'Who\'s vegetarian? Is this uncle bringing his whole family? Who has RSVPd??',
    solution: 'Simplified RSVP process to collect all the details, viewable in one dashboard.',
    featureImage: '/images/feature_images/rsvp_collection.png',
    frameType: 'desktop' as const,
  },
  {
    id: 'multi-event',
    title: 'Multi-Event Support',
    problem: 'Haldi on Thursday, Ceremony on Friday, Sangeet on Saturday... and my international guests are clueless...',
    solution: 'Display multi-day events with explanations for rituals, traditions, and dress codes—especially for international guests.',
    featureImage: '/images/feature_images/multi_event.png',
    frameType: 'desktop' as const,
  },
  {
    id: 'guest-access',
    title: 'Guest Access Control',
    problem: 'This auntie isn\'t invited to my cocktail party…',
    solution: 'Create different PINs so guests only see the events they\'re invited to. Even control who gets a plus one!',
    featureImage: '/images/feature_images/guest_access.png',
    frameType: 'mobile' as const,
  },
  {
    id: 'travel-coordination',
    title: 'Travel Coordination',
    problem: 'When\'s this friend arriving? When\'s the vendor landing? How many shuttles do I book??',
    solution: 'View everyone\'s arrival times and let guests sign up for shuttles — all in one place.',
    featureImage: '/images/feature_images/travel_coordination.png',
    frameType: 'desktop' as const,
    isPro: true,
  },
  {
    id: 'guest-communication',
    title: 'Guest Communication',
    problem: 'I have 30 unread messages from guests about this or that… I don\'t have time for this!',
    solution: '24/7 WhatsApp Agent that knows all your wedding details, ready to answer questions and even recommend what to do in the city!',
    frameType: 'mobile' as const,
    customComponent: <WhatsAppConcierge hideNotch sx={{ borderRadius: '28px' }} />,
    isPro: true,
  },
  {
    id: 'task-management',
    title: 'Task Management',
    problem: 'I need to talk to the decorator, send the DJ my song list, buy welcome gifts… I can\'t keep track!',
    solution: 'Ramble to our voice agent anytime and we\'ll organize your to-do items so you don\'t forget anything.',
    featureImage: '/images/feature_images/task_management.png',
    frameType: 'desktop' as const,
    isPro: true,
  },
  {
    id: 'vendor-coordinator',
    title: 'Vendor Coordinator',
    problem: 'Messaging 10 vendors across WhatsApp, email, and calls... I can\'t remember who said what!',
    solution: 'Import vendor chats, get AI-powered summaries and action items, and keep every conversation organized in one place.',
    featureImage: '/images/feature_images/coordinator1.png',
    featureImage2: '/images/feature_images/coordinator2.png',
    frameType: 'desktop-stacked' as const,
    isPro: true,
  },
];

const pricingTiers = [
  {
    name: 'FREE FOREVER',
    price: '$0',
    description: 'Everything you need to plan your wedding',
    features: [
      'Custom wedding website',
      'Unlimited RSVP collection',
      'Guest list management',
      'Multi-event pages',
      'PIN-based guest access',
      'Event schedule & details',
      'FAQ management',
      'Shopping guide',
    ],
    buttonText: 'Start Free',
    highlight: false,
  },
  {
    name: 'PRO',
    price: '$99',
    description: 'Advanced features for destination weddings',
    features: [
      'Everything in Basic, plus:',
      'Voice-to-task manager',
      'WhatsApp Concierge Agent',
      'Vendor Coordinator',
      'Travel & shuttle coordination',
      'Registry integration',
      'Premium themes & backgrounds',
      'Priority support',
    ],
    buttonText: 'Upgrade to Pro',
    highlight: true,
  },
  {
    name: 'PLANNER',
    price: '$249',
    priceSuffix: '/year',
    description: 'For professionals managing multiple weddings',
    features: [
      'Everything in Pro, plus:',
      'Unlimited client weddings',
      'Multi-wedding dashboard',
      'Pro features on every wedding',
      'Client handoff & collaboration',
      'Planner branding (coming soon)',
      'Dedicated support',
    ],
    buttonText: 'Start as a Planner',
    buttonHref: '/auth/login?role=planner',
    highlight: false,
  },
];

const faqs = [
  {
    q: 'Is this only for destination weddings?',
    a: 'Not at all! It works perfectly for any Indian wedding—local, destination, intimate, or grand.',
  },
  {
    q: 'Can I customize the look and feel?',
    a: 'Absolutely! Choose designs, colors, photos, and cultural elements to match your vision.',
  },
  {
    q: 'What if I only need RSVP collection?',
    a: "That's completely free! Create invites and collect RSVPs without paying a dime.",
  },
  {
    q: 'Can guests access this without an app?',
    a: 'Yes! It works in any browser on mobile or desktop. No downloads needed.',
  },
  {
    q: 'Is my guest data secure?',
    a: 'Yes, we use bank-level encryption to keep your guest information private and secure.',
  },
  {
    q: 'What is the WhatsApp Concierge?',
    a: 'It is an intelligent automated assistant that guests can text to get answers about your wedding schedule, events, and travel details. It saves you from answering the same questions repeatedly.',
  },
  {
    q: 'Can I upgrade to Pro later?',
    a: 'Yes, you can start with the Free plan and upgrade to Pro whenever you need the advanced features like travel coordination or the WhatsApp agent.',
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
            {/* Left Side - Content */}
            <Box sx={{ flex: 1, maxWidth: { md: '420px', lg: '520px' } }}>
              {/* Section Header - Big */}
              <Typography
                sx={{
                  fontFamily: 'var(--font-instrument-serif)',
                  fontStyle: 'italic',
                  fontSize: { md: '3rem', lg: '3.5rem' },
                  lineHeight: 1.1,
                  color: '#1a1a1a',
                  mb: { sm: 2, md: 3, lg: 3 },
                }}
              >
                Everything you need,{' '}
                <Box component="span" sx={{ color: '#DE3F5E' }}>
                  simplified
                </Box>
              </Typography>

              {/* Feature Items List */}
              <Stack spacing={0}>
                {items.map((item, idx) => {
                  const isActive = idx === activeIndex;
                  return (
                    <Box
                      key={item.id}
                      onClick={() => scrollToFeature(idx)}
                      sx={{
                        py: isActive ? 3 : 1.5,
                        borderBottom: idx < items.length - 1 ? '1px solid' : 'none',
                        borderColor: alpha('#000', 0.06),
                        transition: 'padding 0.3s ease',
                        opacity: isActive ? 1 : 0.35,
                        cursor: isActive ? 'default' : 'pointer',
                        '&:hover': !isActive ? {
                          opacity: 0.6,
                        } : {},
                      }}
                    >
                      {/* Title - Not bold, left aligned always */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Typography
                          sx={{
                            color: '#1a1a1a',
                            fontSize: isActive ? { md: '1.5rem', lg: '2rem' } : { md: '1rem', lg: '1.25rem' },
                            transition: 'all 0.3s ease',
                            fontWeight: 500,
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
                              gap: 0.4,
                              bgcolor: alpha('#DE3F5E', 0.08),
                              color: '#DE3F5E',
                              px: isActive ? 1.2 : 0.8,
                              py: isActive ? 0.4 : 0.2,
                              borderRadius: '20px',
                              transition: 'all 0.3s ease',
                            }}
                          >
                            <AutoAwesome sx={{ fontSize: isActive ? '0.9rem' : '0.7rem', transition: 'all 0.3s ease' }} />
                            <Typography
                              sx={{
                                fontSize: isActive ? '0.75rem' : '0.6rem',
                                fontWeight: 700,
                                letterSpacing: '0.5px',
                                transition: 'all 0.3s ease',
                              }}
                            >
                              PRO
                            </Typography>
                          </Box>
                        )}
                      </Box>

                      {/* Problem & Solution - Only show when active */}
                      <motion.div
                        initial={false}
                        animate={{
                          height: isActive ? 'auto' : 0,
                          opacity: isActive ? 1 : 0,
                        }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        style={{ overflow: 'hidden' }}
                      >
                        <Box sx={{ mt: 2 }}>
                          <Typography
                            sx={{
                              color: '#888',
                              fontSize: { md: '1rem', lg: '1.25rem' },
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
                              fontSize: { md: '1rem', lg: '1.25rem' },
                              lineHeight: 1.6,
                            }}
                          >
                            <Box component="span" sx={{ color: '#DE3F5E', fontWeight: 500 }}>
                              Our solution:
                            </Box>{' '}
                            {item.solution}
                          </Typography>
                        </Box>
                      </motion.div>
                    </Box>
                  );
                })}
              </Stack>
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
              {items.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={false}
                  animate={{
                    opacity: idx === activeIndex ? 1 : 0,
                    scale: idx === activeIndex ? 1 : 0.95,
                    y: idx === activeIndex ? 0 : 30,
                  }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: item.frameType === 'mobile' ? 'center' : 'flex-start',
                    pointerEvents: idx === activeIndex ? 'auto' : 'none',
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
                    /* Mobile Phone Frame — more compact, positioned toward right */
                    <Box
                      sx={{
                        width: { md: '320px', lg: '380px' },
                        aspectRatio: '9 / 18', // Slightly taller aspect ratio for modern phones
                        mx: 'auto',
                        borderRadius: '40px',
                        overflow: 'hidden',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.1)',
                        bgcolor: '#1a1a1a',
                        border: '12px solid #1a1a1a',
                        position: 'relative',
                      }}
                    >
                      {/* Dynamic Island / Notch */}
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: '100px',
                          height: '24px',
                          bgcolor: '#1a1a1a',
                          borderBottomLeftRadius: '18px',
                          borderBottomRightRadius: '18px',
                          zIndex: 20,
                        }}
                      />
                      {/* Phone Screen */}
                      <Box
                        sx={{
                          borderRadius: '28px',
                          overflow: 'hidden',
                          lineHeight: 0,
                          height: '100%',
                        }}
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
                      </Box>
                    </Box>
                  )}

                </motion.div>
              ))}
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
              <Stack spacing={4} sx={{ alignItems: 'center', textAlign: 'center' }}>
                <Typography
                  variant="h1"
                  sx={{
                    fontFamily: 'var(--font-instrument-serif)',
                    fontStyle: 'italic',
                    fontSize: { xs: '3.2rem', md: '4rem', lg: '5rem' },
                    lineHeight: 1.1,
                    color: '#1a1a1a',
                    maxWidth: '1000px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Box>Destination Wedding,</Box>
                  <Box
                    component="span"
                    sx={{
                      position: 'relative',
                      display: 'inline-block',
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        left: 0,
                        top: '50%',
                        width: '100%',
                        height: '3px',
                        bgcolor: '#DE3F5E',
                        transform: 'scaleX(0)',
                        transformOrigin: 'left',
                        animation: 'strikethrough 0.8s ease-out 1s forwards',
                      },
                      '@keyframes strikethrough': {
                        '0%': { transform: 'scaleX(0)' },
                        '100%': { transform: 'scaleX(1)' },
                      },
                    }}
                  >
                    Minus the Chaos
                  </Box>
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    fontSize: { xs: '1.25rem', md: '1.5rem' },
                    fontWeight: 600,
                    color: '#1a1a1a',
                    maxWidth: '800px',
                    lineHeight: 1.4,
                  }}
                >
                  Wedding Planner in your Pocket
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: { xs: '1rem', md: '1.25rem' },
                    color: '#4a4a4a',
                    maxWidth: '800px',
                    lineHeight: 1.5,
                    fontWeight: 400,
                    px: { xs: 2, md: 0 }
                  }}
                >
                  Custom Indian wedding websites, smart RSVPs, 24/7 WhatsApp concierge,
                  <br />
                  and much more - all in one place.
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
                      px: { xs: 4, md: 6 },
                      py: { xs: 1.2, md: 2 },
                      borderRadius: '32px',
                      fontSize: { xs: '1rem', md: '1.25rem' },
                      textTransform: 'none',
                      fontWeight: 700,
                      '&:hover': { bgcolor: '#C8365A' },
                    }}
                  >
                    Start Planning Free
                  </Button>
                  <Button
                    component={Link}
                    href="/demo"
                    variant="outlined"
                    size="large"
                    sx={{
                      borderColor: '#DE3F5E',
                      color: '#DE3F5E',
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
        <Box sx={{ py: { xs: 4, md: 4 }, bgcolor: '#075E54', color: 'white', position: 'relative', overflow: 'hidden' }}>
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
                    Get Phera Concierge
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
                  <WhatsAppConcierge
                    messages={conciergeMessages}
                    sx={{
                      width: { xs: '100%', sm: '260px', md: '300px' },
                      height: { xs: '420px', md: '620px' },
                      maxWidth: { xs: '260px', md: '300px' },
                      mx: 0,
                      borderRadius: { xs: '32px', md: '52px' },
                      border: { xs: '8px solid #1a1a1a', md: '12px solid #1a1a1a' },
                    }}
                  />
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
                  Phera was built by a couple frustrated with the complexity of
                  planning a modern Indian destination wedding. We knew there had
                  to be a better way—so we built it.
                </Typography>
                <Typography variant="body2" sx={{ color: '#4a4a4a' }}>
                  Making Indian weddings beautiful to plan, not just beautiful to
                  attend.
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
