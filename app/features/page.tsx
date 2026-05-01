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
import HomePostAuthModalOpener from '../HomePostAuthModalOpener';
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
import { COLORS, FONTS, RADII } from '@/lib/theme/tokens';

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
  customComponent?: React.ReactNode;
  frameType?: 'desktop' | 'mobile' | 'none';
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
            // Small-viewport unit on mobile tracks Chrome's visible area; desktop keeps 100vh
            height: { xs: '100svh', md: '100vh' },
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
                component="h1"
                sx={{
                  fontFamily: FONTS.display,
                  fontStyle: 'italic',
                  fontSize: { md: '3rem', lg: '3.5rem' },
                  lineHeight: 1.1,
                  color: COLORS.text.strong,
                  mb: { sm: 2, md: 3, lg: 3 },
                }}
              >
                Everything you need,{' '}
                <Box component="span" sx={{ color: COLORS.brand.primary }}>
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
                            color: COLORS.text.strong,
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
                              color: COLORS.brand.primary,
                              px: isActive ? 1.2 : 0.8,
                              py: isActive ? 0.4 : 0.2,
                              borderRadius: RADII.xl,
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
                            <Box component="span" sx={{ color: COLORS.brand.primary, fontWeight: 500 }}>
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
                            <Box component="span" sx={{ color: COLORS.brand.primary, fontWeight: 500 }}>
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
                          bgcolor: COLORS.border.faint,
                          borderBottom: '1px solid',
                          borderColor: alpha('#000', 0.08),
                          display: 'flex',
                          alignItems: 'center',
                          px: 2,
                          gap: 1,
                        }}
                      >
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: COLORS.accent.danger }} />
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: COLORS.accent.warning }} />
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: COLORS.accent.success }} />
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
                        bgcolor: COLORS.text.strong,
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
                          bgcolor: COLORS.text.strong,
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
            component="h1"
            sx={{
              fontFamily: FONTS.display,
              fontStyle: 'italic',
              fontSize: '2rem',
              lineHeight: 1.15,
              color: COLORS.text.strong,
            }}
          >
            Everything you need,{' '}
            <Box component="span" sx={{ color: COLORS.brand.primary }}>
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
                {item.featureImage && item.frameType === 'desktop' && (
                  <Box
                    onClick={() => setExpandedImage({ src: item.featureImage!, alt: item.title })}
                    sx={{
                      borderRadius: RADII.sm,
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
                        bgcolor: COLORS.border.faint,
                        borderBottom: '1px solid',
                        borderColor: alpha('#000', 0.08),
                        display: 'flex',
                        alignItems: 'center',
                        px: 1,
                        gap: 0.5,
                      }}
                    >
                      <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: COLORS.accent.danger }} />
                      <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: COLORS.accent.warning }} />
                      <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: COLORS.accent.success }} />
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
                        bgcolor: COLORS.text.strong,
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
                          bgcolor: COLORS.text.strong,
                          borderBottomLeftRadius: '10px',
                          borderBottomRightRadius: '10px',
                          zIndex: 20,
                        }}
                      />
                      <Box sx={{ borderRadius: RADII.xl, overflow: 'hidden', lineHeight: 0, height: '100%' }}>
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
                      color: COLORS.text.strong,
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
                        color: COLORS.brand.primary,
                        px: 0.8,
                        py: 0.25,
                        borderRadius: RADII.md,
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
                  <Box component="span" sx={{ color: COLORS.brand.primary, fontWeight: 500 }}>
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
                  <Box component="span" sx={{ color: COLORS.brand.primary, fontWeight: 500 }}>
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
          <Box sx={{ borderRadius: RADII.sm, overflow: 'hidden', bgcolor: 'white' }}>
            <Box
              sx={{
                height: 24,
                bgcolor: COLORS.border.faint,
                borderBottom: '1px solid',
                borderColor: alpha('#000', 0.08),
                display: 'flex',
                alignItems: 'center',
                px: 1,
                gap: 0.5,
              }}
            >
              <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: COLORS.accent.danger }} />
              <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: COLORS.accent.warning }} />
              <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: COLORS.accent.success }} />
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

export default function FeaturesPage() {
  return <FeaturesPageContent />;
}

function FeaturesPageContent() {
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
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  return (
    <OptimizedBackground
      useAppDefault={true}
      className="min-h-screen flex flex-col"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Phera",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web",
            "url": "https://www.phera.io/features",
            "description":
              "Phera handles RSVPs, multi-day events, guest travel, room blocks, and the wedding-day timeline. Built for Indian weddings and destination celebrations.",
            "offers": [
              { "@type": "Offer", "name": "PHERA FREE", "price": "0", "priceCurrency": "USD" },
              { "@type": "Offer", "name": "PHERA BASE", "price": "349", "priceCurrency": "USD" },
              { "@type": "Offer", "name": "PHERA WHITE GLOVE", "price": "599", "priceCurrency": "USD" },
            ],
            "publisher": {
              "@type": "Organization",
              "name": "Phera",
              "url": "https://www.phera.io",
            },
          })
        }}
      />

      <AppHeader
        variant="transparent"
      />

      <Box component="main" sx={{ flexGrow: 1, pt: 16 }}>
        {/* --- FEATURES SECTION --- */}
        <Box id="features">
          <FeaturesSection items={features} />
        </Box>

        {/* --- FINAL CTA --- */}
        <FinalCTA />

        {/* --- FOOTER --- */}
        <AppFooter />
      </Box >

      <UpgradeModal
        open={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
      />

      <Suspense fallback={null}>
        <HomePostAuthModalOpener
          user={user}
          setUpgradeModalOpen={setUpgradeModalOpen}
        />
      </Suspense>
    </OptimizedBackground >
  );
}
