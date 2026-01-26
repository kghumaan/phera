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
} from '@mui/material';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import {
  SentimentDissatisfied,
  Warning,
  Flight,
  Chat,
  EventAvailable,
  WhatsApp,
  CalendarMonth,
  CheckCircle,
  Storefront,
  ExpandMore,
  Instagram,
  Twitter,
  LinkedIn,
  Check,
  DirectionsBus,
  Campaign,
  SupportAgent,
  Groups,
  EventBusy,
  FlightTakeoff,
  ArrowBack,
  Verified,
  Domain,
  Send,
  Dashboard,
} from '@mui/icons-material';
import AppHeader from '@/components/shared/AppHeader';
import OptimizedBackground from '@/components/ui/OptimizedBackground';
import { useState, useRef, useEffect } from 'react';
import LoginModal from '@/components/auth/LoginModal';

// --- Data & Content ---

const painPoints = [
  {
    title: 'The Coordination Nightmare',
    description: 'Hundreds of guests, multiple events, different venues—absolute chaos.',
    icon: <Groups sx={{ fontSize: '4rem', color: '#DE3F5E' }} />,
    rotation: -3,
    color: '#FFEAEE',
  },
  {
    title: 'RSVP Chaos',
    description: 'Texts, calls, spreadsheets. Who is actually coming? Nobody knows.',
    icon: <EventBusy sx={{ fontSize: '4rem', color: '#FBC02D' }} />,
    rotation: 2,
    color: '#FFF8E1',
  },
  {
    title: 'Travel Coordination',
    description: 'Tracking flights, hotels, and 50+ airport pickups manually.',
    icon: <FlightTakeoff sx={{ fontSize: '4rem', color: '#1976D2' }} />,
    rotation: -2,
    color: '#E3F2FD',
  },
  {
    title: 'The WhatsApp Spiral',
    description: 'Five groups, lost messages, info buried under endless spam.',
    icon: <WhatsApp sx={{ fontSize: '4rem', color: '#25D366' }} />,
    rotation: 4,
    color: '#E8F5E9',
  },
];

const keyFeatures = [
  {
    title: 'Smart RSVP',
    description: 'Digital invites with plus-ones, dietary tracking, and real-time responses.',
    icon: <EventAvailable fontSize="large" sx={{ color: '#DE3F5E' }} />,
    badge: 'FREE',
  },
  {
    title: 'Multi-Event Support',
    description: 'Native support for Haldi, Mehendi, Sangeet, Baraat, and custom ceremonies.',
    icon: <CalendarMonth fontSize="large" sx={{ color: '#DE3F5E' }} />,
    badge: 'FREE',
  },
  {
    title: 'Travel Coordination',
    description: 'Collect flight details, organize airport pickups, and coordinate shuttles.',
    icon: <Flight fontSize="large" sx={{ color: '#DE3F5E' }} />,
    badge: 'PRO',
  },
  {
    title: 'PIN-Based Privacy',
    description: 'Family, individual, and VIP access codes. You control who sees what.',
    icon: <CheckCircle fontSize="large" sx={{ color: '#DE3F5E' }} />,
    badge: 'FREE',
  },
  {
    title: 'WhatsApp Concierge',
    description: 'AI-powered assistant answers guest questions 24/7. Broadcast updates instantly.',
    icon: <WhatsApp fontSize="large" sx={{ color: '#DE3F5E' }} />,
    badge: 'PRO',
  },
  {
    title: 'Gift Registry',
    description: 'Honeymoon funds and cash gifts with secure Stripe payments.',
    icon: <Storefront fontSize="large" sx={{ color: '#DE3F5E' }} />,
    badge: 'PRO',
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
      'Multi-event pages (Haldi, Mehendi, etc.)',
      'PIN-based guest access',
      'Event schedule & details',
      'FAQ management',
      'Real-time guest wall',
    ],
    buttonText: 'Start Free',
    highlight: false,
  },
  {
    name: 'PRO',
    price: '$199',
    description: 'Advanced features for destination weddings',
    features: [
      'Everything in Free, plus:',
      'WhatsApp Concierge Agent',
      'Shuttle transportation coordination',
      'Advanced website styling',
      'Registry with Stripe payments',
      'Broadcast messages to guests',
      'Priority support',
      'All future features included',
    ],
    buttonText: 'Upgrade to Pro',
    highlight: true,
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

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  badge?: string;
  height?: string | number;
  gradient?: string;
  accentColor?: string;
  isDark?: boolean;
  large?: boolean;
}

const FeatureCard = ({
  title,
  description,
  icon,
  badge,
  height = '100%',
  gradient,
  accentColor,
  isDark = false,
  large = false
}: FeatureCardProps) => {
  return (
    <motion.div
      variants={fadeIn}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      style={{ height: '100%' }}
    >
      <Paper
        elevation={0}
        sx={{
          p: large ? { xs: 2.5, md: 6 } : { xs: 2.5, md: 4 },
          height: height,
          borderRadius: '24px',
          background: gradient || (isDark ? (accentColor || '#1a1a1a') : '#fff'),
          color: isDark ? '#fff' : '#1a1a1a',
          border: '1px solid',
          borderColor: isDark ? 'transparent' : alpha('#000', 0.05),
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
          }
        }}
      >
        <Box>
          <Stack
            direction="row"
            sx={{ justifyContent: 'space-between', alignItems: 'flex-start', mb: { xs: 1.5, md: 3 } }}
          >
            <Box sx={{
              p: { xs: 1, md: 1.5 },
              borderRadius: '16px',
              bgcolor: isDark ? alpha('#fff', 0.1) : alpha('#DE3F5E', 0.05),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              '& svg': { fontSize: { xs: '1.5rem', md: '2.5rem' } }
            }}>
              {icon}
            </Box>
            {badge && (
              <Chip
                label={badge}
                size="small"
                sx={{
                  bgcolor: isDark
                    ? alpha('#fff', 0.2)
                    : (badge === 'PRO' ? '#FFEAEE' : '#F5F5F5'),
                  color: isDark
                    ? '#fff'
                    : (badge === 'PRO' ? '#DE3F5E' : '#666'),
                  fontWeight: 800,
                  fontSize: { xs: '0.6rem', md: '0.7rem' },
                  letterSpacing: '0.5px',
                  border: badge === 'PRO' ? '1px solid rgba(222, 63, 94, 0.1)' : 'none',
                  height: { xs: '18px', md: '24px' }
                }}
              />
            )}
          </Stack>

          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              mb: { xs: 1, md: 2 },
              fontFamily: 'var(--font-instrument-serif)',
              fontStyle: 'italic',
              fontSize: large ? { xs: '1.2rem', md: '3rem' } : { xs: '1rem', md: '1.75rem' },
              lineHeight: 1.1
            }}
          >
            {title}
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: isDark ? alpha('#fff', 0.8) : '#4a4a4a',
              lineHeight: 1.6,
              fontSize: large ? { xs: '0.8rem', md: '1.25rem' } : { xs: '0.75rem', md: '1.1rem' },
              maxWidth: '95%'
            }}
          >
            {description}
          </Typography>
        </Box>

        {large && (
           <Box 
            sx={{ 
              position: 'absolute', 
              bottom: 0, 
              right: -30, 
              width: '400px',
              height: '150px',
              opacity: 0.05, 
              display: { xs: 'none', md: 'block' },
              pointerEvents: 'none'
            }}
          >
             <Image 
              src="/logo-flower.svg" 
              alt="" 
              fill 
              style={{ objectFit: 'contain', filter: 'brightness(0)' }} 
            />
          </Box>
        )}
      </Paper>
    </motion.div>
  );
};

export default function LandingPage() {
  const theme = useTheme();
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [selectedPricingTier, setSelectedPricingTier] = useState(1); // Start with Pro tier
  const [painPointsIndex, setPainPointsIndex] = useState(0);
  const [solutionIndex, setSolutionIndex] = useState(0);
  const [roadmapIndex, setRoadmapIndex] = useState(0);

  const painPointsRef = useRef<HTMLDivElement>(null);
  const solutionRef = useRef<HTMLDivElement>(null);
  const roadmapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = (ref: React.RefObject<HTMLDivElement>, setIndex: (i: number) => void, itemCount: number) => {
      if (!ref.current) return;
      const scrollLeft = ref.current.scrollLeft;
      const itemWidth = ref.current.scrollWidth / itemCount;
      const index = Math.round(scrollLeft / itemWidth);
      setIndex(Math.min(index, itemCount - 1));
    };

    const painPointsEl = painPointsRef.current;
    const solutionEl = solutionRef.current;
    const roadmapEl = roadmapRef.current;

    const painPointsHandler = () => handleScroll(painPointsRef, setPainPointsIndex, painPoints.length);
    const solutionHandler = () => handleScroll(solutionRef, setSolutionIndex, 5); // 5 solution items
    const roadmapHandler = () => handleScroll(roadmapRef, setRoadmapIndex, 4); // 4 roadmap items

    painPointsEl?.addEventListener('scroll', painPointsHandler);
    solutionEl?.addEventListener('scroll', solutionHandler);
    roadmapEl?.addEventListener('scroll', roadmapHandler);

    return () => {
      painPointsEl?.removeEventListener('scroll', painPointsHandler);
      solutionEl?.removeEventListener('scroll', solutionHandler);
      roadmapEl?.removeEventListener('scroll', roadmapHandler);
    };
  }, []);

  return (
    <OptimizedBackground
      useAppDefault={true}
      className="min-h-screen flex flex-col"
    >
      <AppHeader
        variant="transparent"
      />

      <Box component="main" sx={{ flexGrow: 1 }}>
        {/* --- HERO SECTION --- */}
        <Container maxWidth="lg" sx={{ pt: { xs: 12, md: 24 }, pb: { xs: 4, md: 10 } }}>
          <motion.div initial="hidden" animate="visible" variants={fadeIn}>
            <Stack spacing={4} sx={{ alignItems: 'center', textAlign: 'center' }}>
              <Typography
                variant="h1"
                sx={{
                  fontFamily: 'var(--font-instrument-serif)',
                  fontStyle: 'italic',
                  fontSize: { xs: '1.5rem', md: '3.5rem', lg: '4.5rem' },
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
                  fontSize: { xs: '0.95rem', md: '1.75rem' },
                  color: '#1a1a1a',
                  maxWidth: '800px',
                  lineHeight: 1.4,
                  fontWeight: 500,
                }}
              >
                Wedding Planner in your Pocket
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  fontSize: { xs: '0.75rem', md: '1.25rem' },
                  color: '#4a4a4a',
                  maxWidth: '800px',
                  lineHeight: 1.5,
                  fontWeight: 400,
                  px: { xs: 2, md: 0 }
                }}
              >
                RSVP tracking, WhatsApp broadcasting, travel logistics, guest concierge
                <br />
                all on one platform.
              </Typography>

              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                sx={{ pt: 2 }}
              >
                <Button
                  component={Link}
                  href="/auth/signup"
                  variant="contained"
                  size="large"
                  sx={{
                    bgcolor: '#DE3F5E',
                    color: 'white',
                    px: { xs: 2.5, md: 5 },
                    py: { xs: 0.8, md: 1.5 },
                    borderRadius: '32px',
                    fontSize: { xs: '0.85rem', md: '1.1rem' },
                    textTransform: 'none',
                    '&:hover': { bgcolor: '#C8365A' },
                  }}
                >
                  Start Planning Free
                </Button>
                <Button
                  component={Link}
                  href="/sim-kv"
                  variant="outlined"
                  size="large"
                  sx={{
                    borderColor: '#DE3F5E',
                    color: '#DE3F5E',
                    px: { xs: 2.5, md: 5 },
                    py: { xs: 0.8, md: 1.5 },
                    borderRadius: '32px',
                    fontSize: { xs: '0.85rem', md: '1.1rem' },
                    textTransform: 'none',
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

        {/* --- PROBLEM SECTION --- */}
        <Container maxWidth="xl" sx={{ py: { xs: 3, md: 14 } }}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
          >
            <Typography
              variant="h2"
              align="center"
              sx={{
                fontFamily: 'var(--font-instrument-serif)',
                fontStyle: 'italic',
                mb: { xs: 4, md: 10 },
                fontSize: { xs: '1.5rem', md: '3.5rem', lg: '4.5rem' },
                color: '#1a1a1a',
                maxWidth: '1000px',
                mx: 'auto',
                lineHeight: 1.1,
                px: { xs: 2, md: 0 }
              }}
            >
              Wedding Planning shouldn't feel like a <Box component="span" sx={{ color: '#DE3F5E' }}>Second Job</Box>
            </Typography>

            <Box
              ref={painPointsRef}
              sx={{
                display: { xs: 'flex', sm: 'grid' },
                overflowX: { xs: 'auto', md: 'visible' },
                scrollSnapType: { xs: 'x mandatory', md: 'none' },
                gap: { xs: 2, lg: 6 },
                perspective: '1200px',
                pb: { xs: 2, md: 0 },
                px: { xs: 2, md: 0 },
                mx: { xs: -2, md: 0 }, // Negative margin to allow items to touch edges while scrolling
                '&::-webkit-scrollbar': { display: 'none' },
                msOverflowStyle: 'none',
                scrollbarWidth: 'none',
                gridTemplateColumns: { sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' },
                maxWidth: { xs: '280px', md: '100%' },
                mx: { xs: 'auto', md: 0 },
              }}
            >
              {painPoints.map((point, idx) => (
                <motion.div
                  key={idx}
                  variants={{
                    hidden: { opacity: 0, y: 20, rotate: point.rotation },
                    visible: { 
                      opacity: 1, 
                      y: 0, 
                      rotate: point.rotation,
                      transition: { delay: idx * 0.1 }
                    }
                  }}
                  whileHover={{
                    rotate: 0,
                    scale: 1.02,
                    zIndex: 10,
                    transition: { type: 'spring', stiffness: 200 }
                  }}
                  style={{
                    scrollSnapAlign: 'center',
                    flex: '0 0 auto',
                    width: '100%'
                  }}
                >
                  <Paper
                    elevation={0}
                    sx={{
                      p: { xs: 2.5, md: 6 },
                      height: '100%',
                      aspectRatio: { xs: '1/1', md: 'auto' },
                      minHeight: { xs: 'auto', md: '350px' },
                      bgcolor: point.color,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      gap: { xs: 1.25, md: 3 },
                      position: 'relative',
                      // Post-it Fold Effect: The polygon clips the top-right corner
                      clipPath: 'polygon(0 0, calc(100% - 30px) 0, 100% 30px, 100% 100%, 0 100%)',
                      // Use filter: drop-shadow instead of boxShadow to follow the clipped shape
                      filter: 'drop-shadow(8px 8px 0px rgba(0,0,0,0.02))',
                      transition: 'filter 0.3s ease',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        width: '30px',
                        height: '30px',
                        bgcolor: alpha('#000', 0.1),
                        clipPath: 'polygon(0 0, 100% 100%, 0 100%)',
                        zIndex: 2,
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: { xs: 0.75, md: 2 } }}>
                      {typeof point.icon === 'string' ? (
                        <Typography sx={{ fontSize: { xs: '2.25rem', md: '4rem' } }}>
                          {point.icon}
                        </Typography>
                      ) : (
                        <Box sx={{ '& svg': { fontSize: { xs: '2.25rem', md: '4rem' } } }}>
                          {point.icon}
                        </Box>
                      )}
                    </Box>

                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 800,
                        color: '#1a1a1a',
                        fontFamily: 'var(--font-instrument-serif)',
                        fontStyle: 'italic',
                        lineHeight: 1.1,
                        fontSize: { xs: '1rem', md: '2rem' },
                        textAlign: 'center'
                      }}
                    >
                      {point.title}
                    </Typography>

                    <Typography
                      variant="body1"
                      sx={{
                        color: '#4a4a4a',
                        lineHeight: 1.35,
                        fontWeight: 450,
                        fontSize: { xs: '0.85rem', md: '1.15rem' },
                        textAlign: 'center'
                      }}
                    >
                      {point.description}
                    </Typography>

                    <Box 
                      sx={{ 
                        position: 'absolute', 
                        bottom: -15, 
                        right: -15, 
                        fontSize: { xs: '6rem', md: '10rem' }, 
                        opacity: 0.02, 
                        fontWeight: 900,
                        userSelect: 'none',
                        fontFamily: 'inherit'
                      }}
                    >
                      {idx + 1}
                    </Box>
                  </Paper>
                </motion.div>
              ))}
            </Box>

            {/* Breadcrumbs for Pain Points (Mobile Only) */}
            <Stack
              direction="row"
              spacing={1}
              sx={{
                display: { xs: 'flex', md: 'none' },
                justifyContent: 'center',
                mt: 2,
                pb: 2
              }}
            >
              {painPoints.map((_, idx) => (
                <Box
                  key={idx}
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: painPointsIndex === idx ? '#DE3F5E' : alpha('#DE3F5E', 0.2),
                    transition: 'all 0.3s ease',
                  }}
                />
              ))}
            </Stack>
          </motion.div>
        </Container>

        {/* --- SOLUTION & FEATURES (Bento Grid) --- */}
        <Box sx={{ bgcolor: alpha('#DE3F5E', 0.03), py: { xs: 3, md: 14 } }}>
          <Container maxWidth="xl">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              <Stack spacing={2} sx={{ textAlign: 'center', mb: { xs: 4, md: 10 }, alignItems: 'center' }}>
                <Typography
                  variant="overline"
                  sx={{ color: '#DE3F5E', fontWeight: 800, letterSpacing: '2px', fontSize: { xs: '0.65rem', md: '0.75rem' } }}
                >
                  THE SOLUTION
                </Typography>
                <Typography
                  variant="h2"
                  sx={{
                    fontFamily: 'var(--font-instrument-serif)',
                    fontStyle: 'italic',
                    fontSize: { xs: '1.5rem', md: '3.5rem', lg: '4.5rem' },
                    color: '#1a1a1a',
                    lineHeight: 1.1,
                  }}
                >
                  Everything You Need, <br />
                  <Box component="span" sx={{ color: '#DE3F5E' }}>All in One Place.</Box>
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    maxWidth: '900px',
                    color: '#4a4a4a',
                    fontSize: { xs: '0.8rem', md: '1.35rem' },
                    lineHeight: 1.6,
                    mt: 3,
                    opacity: 0.9,
                    px: { xs: 2, md: 0 }
                  }}
                >
                  Ditch the messy spreadsheets and fragmented group chats. Phera brings your
                  entire wedding coordination into one powerful, integrated system.
                </Typography>
              </Stack>

              <Box
                ref={solutionRef}
                sx={{
                  display: { xs: 'flex', md: 'grid' },
                  overflowX: { xs: 'auto', md: 'visible' },
                  scrollSnapType: { xs: 'x mandatory', md: 'none' },
                  gap: 3,
                  pb: { xs: 2, md: 0 },
                  px: { xs: 2, md: 0 },
                  mx: { xs: -2, md: 0 },
                  '&::-webkit-scrollbar': { display: 'none' },
                  msOverflowStyle: 'none',
                  scrollbarWidth: 'none',
                  gridTemplateColumns: { md: 'repeat(3, 1fr)' },
                  gridAutoRows: 'minmax(250px, auto)',
                }}
              >
                {/* 1. Smart RSVP & Multi-Event (Large Feature) */}
                <Box sx={{ 
                  gridColumn: { md: '1 / span 2' }, 
                  gridRow: { md: '1 / span 2' },
                  flex: { xs: '0 0 85%', md: 'auto' },
                  scrollSnapAlign: 'center'
                }}>
                  <FeatureCard 
                    title="Unified Guest Management"
                    description="From Smart RSVPs that track plus-ones and dietary needs to native support for Haldi, Mehendi, and Sangeet. Everything is synced instantly."
                    icon={keyFeatures[0].icon}
                    badge="FREE"
                    height="100%"
                    gradient="linear-gradient(135deg, #fff 0%, #fff 100%)"
                    large
                  />
                </Box>

                {/* 2. WhatsApp Concierge (Featured Pro) */}
                <Box sx={{ 
                  gridColumn: { md: '3 / span 1' }, 
                  gridRow: { md: '1 / span 2' },
                  flex: { xs: '0 0 85%', md: 'auto' },
                  scrollSnapAlign: 'center'
                }}>
                   <FeatureCard 
                    title="WhatsApp Concierge"
                    description="Our AI agent answers guest questions 24/7. Broadcast updates instantly to everyone's phone."
                    icon={<WhatsApp sx={{ fontSize: '3rem', color: '#25D366' }} />}
                    badge="PRO"
                    accentColor="#075E54"
                    height="100%"
                    isDark
                  />
                </Box>

                {/* 3. Travel & Logistics */}
                <Box sx={{ flex: { xs: '0 0 85%', md: 'auto' }, scrollSnapAlign: 'center' }}>
                  <FeatureCard 
                    title="Travel Coordination"
                    description="Collect flight details and organize airport pickups seamlessly."
                    icon={keyFeatures[2].icon}
                    badge="PRO"
                  />
                </Box>

                {/* 4. PIN Privacy */}
                <Box sx={{ flex: { xs: '0 0 85%', md: 'auto' }, scrollSnapAlign: 'center' }}>
                  <FeatureCard 
                    title="VIP Privacy"
                    description="PIN-based access codes for family, individuals, and VIPs."
                    icon={keyFeatures[3].icon}
                    badge="FREE"
                  />
                </Box>

                {/* 5. Gift Registry */}
                <Box sx={{ flex: { xs: '0 0 85%', md: 'auto' }, scrollSnapAlign: 'center' }}>
                  <FeatureCard 
                    title="Modern Registry"
                    description="Secure cash gifts and honeymoon funds via Stripe."
                    icon={keyFeatures[5].icon}
                    badge="PRO"
                  />
                </Box>
              </Box>

              {/* Breadcrumbs for Solution Items (Mobile Only) */}
              <Stack
                direction="row"
                spacing={1}
                sx={{
                  display: { xs: 'flex', md: 'none' },
                  justifyContent: 'center',
                  mt: 2,
                  pb: 2
                }}
              >
                {[0, 1, 2, 3, 4].map((idx) => (
                  <Box
                    key={idx}
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: solutionIndex === idx ? '#DE3F5E' : alpha('#DE3F5E', 0.2),
                      transition: 'all 0.3s ease',
                    }}
                  />
                ))}
              </Stack>
            </motion.div>
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

          <Container maxWidth="xl">
            <Grid container spacing={{ xs: 3, md: 8 }} alignItems="center">
              <Grid size={{ xs: 12, md: 6 }}>
                <motion.div
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeIn}
                >
                  <Stack direction="row" spacing={{ xs: 1, md: 2 }} alignItems="center" sx={{ mb: { xs: 1.5, md: 2 } }}>
                    <WhatsApp sx={{ fontSize: { xs: '2rem', md: '5rem' }, color: '#25D366' }} />
                    <Typography
                      variant="h2"
                      sx={{
                        fontFamily: 'var(--font-instrument-serif)',
                        fontStyle: 'italic',
                        fontSize: { xs: '1.5rem', md: '4rem', lg: '5rem' },
                        lineHeight: 1.1,
                      }}
                    >
                      Your 24/7 Wedding Concierge
                    </Typography>
                  </Stack>
                  <Typography variant="h6" sx={{ mb: { xs: 2, md: 6 }, opacity: 0.9, fontWeight: 400, fontSize: { xs: '0.85rem', md: '1.4rem' }, lineHeight: 1.4 }}>
                    Stop being your guests' personal assistant. Let our intelligent WhatsApp
                    Concierge handle the repetitive questions so you can focus on your celebration.
                  </Typography>
                  
                  <List sx={{ mb: { xs: 1, md: 2 } }}>
                    {[
                      { icon: <SupportAgent />, text: "Answers FAQs about schedule, venue, and dress code" },
                      { icon: <DirectionsBus />, text: "Coordinates shuttle sign-ups and airport pickups" },
                      { icon: <Campaign />, text: "Broadcasts urgent updates to your entire guest list" },
                      { icon: <Check />, text: "All data comes directly from your wedding website" }
                    ].map((item, idx) => (
                      <ListItem key={idx} sx={{ px: 0, py: { xs: 0.25, md: 0.5 } }}>
                        <ListItemIcon sx={{ color: '#25D366', minWidth: { xs: 28, md: 40 } }}>
                          <Box sx={{ '& svg': { fontSize: { xs: '1.2rem', md: '1.5rem' } } }}>
                            {item.icon}
                          </Box>
                        </ListItemIcon>
                        <ListItemText
                          primary={item.text}
                          primaryTypographyProps={{ fontSize: { xs: '0.75rem', md: '1.25rem' } }}
                        />
                      </ListItem>
                    ))}
                  </List>

                  <Button
                    component={Link}
                    href="/admin"
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
                    Get the WhatsApp Concierge
                  </Button>
                </motion.div>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <motion.div
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={{
                    hidden: { opacity: 0, x: 20 },
                    visible: { opacity: 1, x: 0, transition: { duration: 0.8 } }
                  }}
                >
                  <Paper
                    elevation={20}
                    sx={{
                      p: 0, // Remove padding to let header flush
                      borderRadius: { xs: '24px', md: '50px' },
                      bgcolor: '#EFE7DE', // WhatsApp chat bg (classic beige/pattern) or use image
                      width: { xs: '100%', sm: '320px' }, // Narrower phone for mobile
                      height: { xs: '450px', md: '900px' }, // Shorter phone for mobile
                      maxWidth: { xs: '320px', md: '440px' },
                      mx: 'auto',
                      position: 'relative',
                      border: { xs: '8px solid #1a1a1a', md: '18px solid #1a1a1a' },
                      overflow: 'hidden',
                      backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', // WhatsApp background subtlety
                      backgroundSize: 'cover',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                     {/* Dynamic Island / Notch */}
                     <Box sx={{
                       position: 'absolute',
                       top: 0,
                       left: '50%',
                       transform: 'translateX(-50%)',
                       width: { xs: '80px', md: '120px' },
                       height: { xs: '20px', md: '30px' },
                       bgcolor: '#1a1a1a',
                       borderBottomLeftRadius: { xs: '12px', md: '16px' },
                       borderBottomRightRadius: { xs: '12px', md: '16px' },
                       zIndex: 20
                     }} />

                     {/* Custom WhatsApp Header */}
                     <Box sx={{
                       bgcolor: '#202C33', // Dark header
                       color: 'primary.contrastText',
                       pt: { xs: 4, md: 6 }, // Space for notch/status bar
                       pb: { xs: 1, md: 1.5 },
                       px: 1,
                       display: 'flex',
                       alignItems: 'center',
                       boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                       zIndex: 10
                     }}>
                        <Stack direction="row" alignItems="center" spacing={0} sx={{ mr: 1, color: 'white' }}>
                          <ArrowBack sx={{ fontSize: { xs: '1.25rem', md: '1.75rem' } }} />
                        </Stack>

                        <Stack direction="row" alignItems="center" spacing={{ xs: 1, md: 1.5 }} sx={{ flexGrow: 1 }}>
                          <Avatar
                            src="/Phera Logomark.jpg"
                            sx={{ width: { xs: 32, md: 42 }, height: { xs: 32, md: 42 } }}
                          />
                          <Box>
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'white', lineHeight: 1.2, fontSize: { xs: '0.9rem', md: '1.1rem' } }}>
                                Phera
                              </Typography>
                              <Verified sx={{ fontSize: { xs: '0.9rem', md: '1.1rem' }, color: '#2979FF' }} />
                            </Stack>
                          </Box>
                        </Stack>
                     </Box>

                     {/* Chat Area */}
                     <Stack spacing={{ xs: 1.5, md: 2 }} sx={{ p: { xs: 1.5, md: 2 }, flexGrow: 1, overflowY: 'auto' }}>
                       {/* Date Separator */}
                       <Box sx={{ alignSelf: 'center', bgcolor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', px: { xs: 1, md: 1.5 }, py: 0.5, borderRadius: '8px', mb: { xs: 1, md: 2 } }}>
                         <Typography variant="caption" sx={{ color: '#54656F', fontWeight: 500, bgcolor: '#FFF', px: { xs: 0.75, md: 1 }, py: 0.5, borderRadius: '8px', boxShadow: '0 1px 0.5px rgba(0,0,0,0.1)', fontSize: { xs: '0.6rem', md: '0.75rem' } }}>
                           Today
                         </Typography>
                       </Box>

                       {/* Chat Bubble Guest */}
                       <Box sx={{ alignSelf: 'flex-start', bgcolor: 'white', p: { xs: 1, md: 1.5 }, borderRadius: '0px 12px 12px 12px', maxWidth: '85%', boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)', position: 'relative' }}>
                          {/* Triangle */}
                          <Box sx={{ position: 'absolute', top: 0, left: -8, width: 0, height: 0, borderTop: '12px solid white', borderLeft: '12px solid transparent' }} />

                         <Typography variant="body2" sx={{ color: '#111b21', fontSize: { xs: '0.75rem', md: '0.95rem' }, lineHeight: 1.3 }}>
                           Hey! What time is the shuttle for the Sangeet leaving?
                         </Typography>
                         <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: '#667781', textAlign: 'right', fontSize: { xs: '0.6rem', md: '0.7rem' } }}>
                           10:42 AM
                         </Typography>
                       </Box>

                       {/* Chat Bubble Bot */}
                       <Box sx={{ alignSelf: 'flex-end', bgcolor: '#E7FFDB', p: { xs: 1, md: 1.5 }, borderRadius: '12px 0px 12px 12px', maxWidth: '85%', boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)', position: 'relative' }}>
                          {/* Triangle */}
                          <Box sx={{ position: 'absolute', top: 0, right: -8, width: 0, height: 0, borderTop: '12px solid #E7FFDB', borderRight: '12px solid transparent' }} />

                         <Typography variant="body2" sx={{ color: '#111b21', fontSize: { xs: '0.75rem', md: '0.95rem' }, lineHeight: 1.3 }}>
                           Hi! The Sangeet shuttles start leaving from <strong>Grand Hyatt Lobby</strong> at <strong>6:30 PM</strong>.
                         </Typography>
                         <Typography variant="body2" sx={{ mt: { xs: 0.75, md: 1 }, color: '#111b21', fontSize: { xs: '0.75rem', md: '0.95rem' } }}>
                           Would you like to reserve a seat? 🚐
                         </Typography>
                         <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', mt: 0.5, color: '#667781', fontSize: { xs: '0.6rem', md: '0.7rem' }, gap: 0.5 }}>
                           10:42 AM <Check sx={{ fontSize: { xs: '0.85rem', md: '1rem' }, color: '#53bdeb' }} />
                         </Typography>
                       </Box>

                       {/* Chat Bubble Guest */}
                       <Box sx={{ alignSelf: 'flex-start', bgcolor: 'white', p: { xs: 1, md: 1.5 }, borderRadius: '0px 12px 12px 12px', maxWidth: '85%', boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)', position: 'relative' }}>
                          {/* Triangle */}
                          <Box sx={{ position: 'absolute', top: 0, left: -8, width: 0, height: 0, borderTop: '12px solid white', borderLeft: '12px solid transparent' }} />

                         <Typography variant="body2" sx={{ color: '#111b21', fontSize: { xs: '0.75rem', md: '0.95rem' } }}>
                           Yes please, for 2 people.
                         </Typography>
                         <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: '#667781', textAlign: 'right', fontSize: { xs: '0.6rem', md: '0.7rem' } }}>
                           10:43 AM
                         </Typography>
                       </Box>

                       {/* Chat Bubble Bot */}
                       <Box sx={{ alignSelf: 'flex-end', bgcolor: '#E7FFDB', p: { xs: 1, md: 1.5 }, borderRadius: '12px 0px 12px 12px', maxWidth: '85%', boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)', position: 'relative' }}>
                          {/* Triangle */}
                          <Box sx={{ position: 'absolute', top: 0, right: -8, width: 0, height: 0, borderTop: '12px solid #E7FFDB', borderRight: '12px solid transparent' }} />

                        <Typography variant="body2" sx={{ color: '#111b21', fontSize: { xs: '0.75rem', md: '0.95rem' } }}>
                           Done! ✅ I've reserved 2 seats for you on the 6:30 PM shuttle.
                         </Typography>
                         <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', mt: 0.5, color: '#667781', fontSize: { xs: '0.6rem', md: '0.7rem' }, gap: 0.5 }}>
                           10:43 AM <Check sx={{ fontSize: { xs: '0.85rem', md: '1rem' }, color: '#53bdeb' }} />
                         </Typography>
                       </Box>

                       {/* Chat Bubble Guest (Kill Time) */}
                       <Box sx={{ alignSelf: 'flex-start', bgcolor: 'white', p: { xs: 1, md: 1.5 }, borderRadius: '0px 12px 12px 12px', maxWidth: '85%', boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)', position: 'relative' }}>
                          {/* Triangle */}
                          <Box sx={{ position: 'absolute', top: 0, left: -8, width: 0, height: 0, borderTop: '12px solid white', borderLeft: '12px solid transparent' }} />

                         <Typography variant="body2" sx={{ color: '#111b21', fontSize: { xs: '0.75rem', md: '0.95rem' } }}>
                           We have some free time before the reception. Any recommendations nearby?
                         </Typography>
                         <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: '#667781', textAlign: 'right', fontSize: { xs: '0.6rem', md: '0.7rem' } }}>
                           11:15 AM
                         </Typography>
                       </Box>

                       {/* Chat Bubble Bot (Recommendation) */}
                       <Box sx={{ alignSelf: 'flex-end', bgcolor: '#E7FFDB', p: { xs: 1, md: 1.5 }, borderRadius: '12px 0px 12px 12px', maxWidth: '85%', boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)', position: 'relative' }}>
                          {/* Triangle */}
                          <Box sx={{ position: 'absolute', top: 0, right: -8, width: 0, height: 0, borderTop: '12px solid #E7FFDB', borderRight: '12px solid transparent' }} />

                        <Typography variant="body2" sx={{ color: '#111b21', fontSize: { xs: '0.75rem', md: '0.95rem' } }}>
                           Absolutely! 🌴 The <strong>Oasis Spa</strong> is just a 5-min walk, or grab a coffee at <strong>Blue Tokai</strong>.
                         </Typography>
                         <Typography variant="body2" sx={{ mt: { xs: 0.75, md: 1 }, color: '#111b21', fontSize: { xs: '0.75rem', md: '0.95rem' } }}>
                           Check out the full guide here:
                         </Typography>
                         {/* Link Preview Mockup */}
                         <Box sx={{ mt: { xs: 0.75, md: 1 }, bgcolor: '#CFE9BA', p: { xs: 0.75, md: 1 }, borderRadius: '8px', borderLeft: '4px solid #53bdeb' }}>
                           <Typography variant="caption" sx={{ color: '#007AFF', fontWeight: 600, fontSize: { xs: '0.6rem', md: '0.75rem' } }}>maps.google.com</Typography>
                           <Typography variant="body2" sx={{ fontSize: { xs: '0.7rem', md: '0.85rem' }, color: '#111b21' }}>Udaipur Local Guide • Best Cafes & Spas</Typography>
                         </Box>
                         <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', mt: 0.5, color: '#667781', fontSize: { xs: '0.6rem', md: '0.7rem' }, gap: 0.5 }}>
                           11:15 AM <Check sx={{ fontSize: { xs: '0.85rem', md: '1rem' }, color: '#53bdeb' }} />
                         </Typography>
                       </Box>
                     </Stack>
                  </Paper>
                </motion.div>
              </Grid>
            </Grid>
          </Container>
        </Box>


        {/* --- WEDDING ROADMAP SECTION --- */}
        <Container maxWidth="xl" sx={{ py: { xs: 3, md: 14 } }}>
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
              {/* Connector Line (Desktop Only) */}
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
                      {/* Step Number in Corner */}
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
                          fontWeight: 700,
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
                      
                      <Typography variant="h5" sx={{ fontWeight: 800, mb: { xs: 1, md: 2 }, fontFamily: 'var(--font-instrument-serif)', fontStyle: 'italic', zIndex: 1, color: '#1a1a1a', fontSize: { xs: '1rem', md: '1.5rem' } }}>
                        {item.title}
                      </Typography>
                      
                      <Typography variant="body1" sx={{ color: '#666', lineHeight: 1.5, zIndex: 1, fontSize: { xs: '0.8rem', md: '1rem' } }}>
                        {item.desc}
                      </Typography>
                    </Paper>
                  </motion.div>
                </Box>
              ))}
            </Box>

            {/* Breadcrumbs for Roadmap (Mobile Only) */}
            <Stack
              direction="row"
              spacing={1}
              sx={{
                display: { xs: 'flex', md: 'none' },
                justifyContent: 'center',
                mt: 2,
                pb: 2
              }}
            >
              {[0, 1, 2, 3].map((idx) => (
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
              ))}
            </Stack>
          </motion.div>
        </Container>

        {/* --- PRICING --- */}
        <Box sx={{ bgcolor: '#F0F2F5', py: { xs: 3, md: 14 } }}>
          <Container maxWidth="lg">
            <Stack spacing={1} sx={{ textAlign: 'center', mb: { xs: 2.5, md: 8 } }}>
              <Typography
                variant="h2"
                sx={{
                  fontFamily: 'var(--font-instrument-serif)',
                  fontStyle: 'italic',
                  fontSize: { xs: '1.5rem', md: '3.5rem' },
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
                  size={{ xs: 12, md: 5 }}
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
                    </Box>
                    <Typography variant="body2" sx={{ mb: { xs: 1.5, md: 4 }, color: '#4a4a4a', fontSize: { xs: '0.7rem', md: '0.875rem' }, display: { xs: 'none', md: 'block' } }}>
                      {tier.description}
                    </Typography>

                    <List dense sx={{ mb: { xs: 1, md: 4 }, flexGrow: 1 }}>
                      {tier.features.map((feature, fIdx) => (
                        <ListItem key={fIdx} disableGutters sx={{ py: { xs: 0.25, md: 0.5 } }}>
                          <ListItemIcon sx={{ minWidth: { xs: 24, md: 36 } }}>
                            <CheckCircle
                              sx={{
                                color: '#DE3F5E',
                                fontSize: { xs: 16, md: 20 },
                              }}
                            />
                          </ListItemIcon>
                          <ListItemText
                            primary={feature.replace('WhatsApp Concierge Agent', 'WhatsApp Agent')}
                            primaryTypographyProps={{
                              sx: {
                                color: '#1a1a1a',
                                fontWeight: feature.includes('WhatsApp') ? 600 : 400,
                                fontSize: { xs: '0.8rem', md: '0.875rem' },
                                lineHeight: 1.4
                              }
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>

                    <Button
                      fullWidth
                      component={Link}
                      href="/admin"
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
        <Container maxWidth="lg" sx={{ py: { xs: 3, md: 14 } }}>
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
              sx={{ fontFamily: 'var(--font-instrument-serif)', fontStyle: 'italic', fontSize: { xs: '1.5rem', md: '3.5rem' }, color: '#1a1a1a' }}
            >
              Common Questions
            </Typography>
          </Stack>
          
          <Container maxWidth="md">
            <Stack spacing={3}>
              {faqs.map((faq, idx) => (
                <Accordion
                  key={idx}
                  elevation={0}
                  sx={{
                    bgcolor: 'white',
                    border: '1px solid',
                    borderColor: 'rgba(0,0,0,0.06)',
                    borderRadius: '24px !important',
                    overflow: 'hidden',
                    transition: 'all 0.2s ease',
                    '&:before': { display: 'none' },
                    '&:hover': {
                      borderColor: 'rgba(0,0,0,0.12)',
                      transform: 'translateY(-2px)',
                    },
                    '&.Mui-expanded': {
                      boxShadow: '0 12px 32px rgba(0,0,0,0.06)',
                      borderColor: 'transparent',
                      m: 0, // Reset default margin expansion
                    }
                  }}
                >
                  <AccordionSummary
                    expandIcon={<Box sx={{
                      bgcolor: alpha('#DE3F5E', 0.05),
                      color: '#DE3F5E',
                      borderRadius: '50%',
                      p: { xs: 0.3, md: 0.5 },
                      display: 'flex',
                      '& svg': { fontSize: { xs: '1.2rem', md: '1.5rem' } }
                    }}>
                      <ExpandMore />
                    </Box>}
                    sx={{ px: { xs: 2, md: 4 }, py: { xs: 0.75, md: 2 } }}
                  >
                    <Typography variant="h6" sx={{ fontSize: { xs: '0.9rem', md: '1.6rem' }, fontWeight: 700, color: '#1a1a1a', fontFamily: 'Outfit, sans-serif' }}>
                      {faq.q}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ px: { xs: 2, md: 4 }, pb: { xs: 2, md: 4 }, pt: 0 }}>
                    <Typography variant="body1" sx={{ color: '#666', lineHeight: 1.7, fontSize: { xs: '0.8rem', md: '1.05rem' } }}>
                      {faq.a}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Stack>
          </Container>
        </Container>

        {/* --- FINAL CTA --- */}
        <Container maxWidth="lg" sx={{ pb: { xs: 3, md: 12 } }}>
          <Paper
            sx={{
              p: { xs: 3, md: 8 },
              borderRadius: { xs: '24px', md: '40px' },
              background: 'linear-gradient(135deg, rgba(222, 63, 94, 0.05) 0%, rgba(255, 142, 83, 0.05) 100%)',
              border: '1px solid rgba(222, 63, 94, 0.1)',
              color: '#1a1a1a',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Box sx={{ position: 'relative', zIndex: 2 }}>
              <Typography
                variant="h2"
                sx={{ fontFamily: 'var(--font-instrument-serif)', fontStyle: 'italic', mb: { xs: 2, md: 3 }, color: '#1a1a1a', fontSize: { xs: '1.5rem', md: '2.5rem' } }}
              >
                Your Wedding, Your Way
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  mb: { xs: 3, md: 5 },
                  color: '#4a4a4a',
                  maxWidth: '600px',
                  mx: 'auto',
                  fontSize: { xs: '0.8rem', md: '1.25rem' }
                }}
              >
                Join the couples who are planning beautiful Indian weddings
                without the burnout. Start free, upgrade when you need to.
              </Typography>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                sx={{ justifyContent: 'center' }}
              >
                <Button
                  component={Link}
                  href="/admin"
                  variant="contained"
                  size="large"
                  sx={{
                    bgcolor: '#DE3F5E',
                    color: 'white',
                    px: { xs: 3, md: 5 },
                    py: { xs: 1, md: 1.5 },
                    borderRadius: '32px',
                    fontSize: { xs: '0.85rem', md: '1.1rem' },
                    fontWeight: 'bold',
                    '&:hover': { bgcolor: '#C8365A' },
                  }}
                >
                  Create Your Wedding Free
                </Button>
                {/* Demo button can be linked to Calendly or kept as is for now with clear label */}
              </Stack>
              <Stack
                direction="row"
                spacing={3}
                sx={{ justifyContent: 'center', mt: 4, flexWrap: 'wrap' }}
              >
                <Chip
                  icon={<CheckCircle sx={{ color: '#DE3F5E !important' }} />}
                  label="No credit card required"
                  sx={{
                    bgcolor: 'transparent',
                    color: '#4a4a4a',
                    border: 'none',
                    fontWeight: 500
                  }}
                />
                <Chip
                  icon={<CheckCircle sx={{ color: '#DE3F5E !important' }} />}
                  label="Free forever plan"
                  sx={{
                    bgcolor: 'transparent',
                    color: '#4a4a4a',
                    border: 'none',
                    fontWeight: 500
                  }}
                />
              </Stack>
            </Box>
          </Paper>
        </Container>

        {/* --- FOOTER --- */}
        <Box sx={{ bgcolor: '#F5F5F5', color: '#1a1a1a', py: 8 }}>
          <Container maxWidth="lg">
            <Grid container spacing={4}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography
                  variant="h5"
                  sx={{
                    fontFamily: 'var(--font-instrument-serif)',
                    fontStyle: 'italic',
                    color: '#DE3F5E',
                    mb: 2,
                  }}
                >
                  Phera
                </Typography>
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
                  <Link href="/features" className="text-[#4a4a4a] hover:text-[#DE3F5E] transition-colors">
                    Features
                  </Link>
                  <Link href="/pricing" className="text-[#4a4a4a] hover:text-[#DE3F5E] transition-colors">
                    Pricing
                  </Link>
                  <Link href="/sim-kv" className="text-[#4a4a4a] hover:text-[#DE3F5E] transition-colors">
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
                  <IconButton sx={{ color: '#DE3F5E', bgcolor: alpha('#DE3F5E', 0.1) }}>
                    <Instagram />
                  </IconButton>
                  <IconButton sx={{ color: '#DE3F5E', bgcolor: alpha('#DE3F5E', 0.1) }}>
                    <Twitter />
                  </IconButton>
                  <IconButton sx={{ color: '#DE3F5E', bgcolor: alpha('#DE3F5E', 0.1) }}>
                    <LinkedIn />
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
      </Box>

      <LoginModal
        open={loginDialogOpen}
        onClose={() => setLoginDialogOpen(false)}
        onSuccess={() => {
          console.log('Login successful');
        }}
      />
    </OptimizedBackground>
  );
}
