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
  TextField,
  Alert,
  CircularProgress,
} from '@mui/material';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowForward,
  SentimentDissatisfied,
  Warning,
  Flight,
  Chat,
  EventAvailable,
  WhatsApp,
  CalendarMonth,
  People,
  Web,
  CheckCircle,
  Handyman,
  Public,
  ExpandMore,
  Storefront,
  Groups,
  Star,
  Instagram,
  Twitter,
  LinkedIn,
} from '@mui/icons-material';
import AppHeader from '@/components/shared/AppHeader';
import OptimizedBackground from '@/components/ui/OptimizedBackground';
import { useState, useRef, useEffect } from 'react';
import LoginModal from '@/components/auth/LoginModal';
import AgentCard from '@/components/landing/AgentCard';
import AgentModal from '@/components/landing/AgentModal';

// --- Data & Content ---

const painPoints = [
  {
    title: 'The Coordination Nightmare',
    description: 'Hundreds of guests, multiple events, different venues—chaos.',
    icon: <SentimentDissatisfied color="error" fontSize="large" />,
  },
  {
    title: 'RSVP Chaos',
    description: 'Texts, calls, spreadsheets. Who is actually coming?',
    icon: <Warning color="error" fontSize="large" />,
  },
  {
    title: 'Travel Coordination',
    description: 'Tracking flights, hotels, and 50+ airport pickups.',
    icon: <Flight color="error" fontSize="large" />,
  },
  {
    title: 'The WhatsApp Spiral',
    description: 'Five groups, lost messages, info buried under spam.',
    icon: <Chat color="error" fontSize="large" />,
  },
];

const keyFeatures = [
  {
    title: 'Smart RSVP',
    description: 'Digital invites, plus-ones, and real-time tracking.',
    icon: <EventAvailable fontSize="large" sx={{ color: '#DE3F5E' }} />,
    badge: 'FREE',
  },
  {
    title: 'Privacy & Control',
    description: 'Secure PIN access. You decide who sees what.',
    icon: <CheckCircle fontSize="large" sx={{ color: '#DE3F5E' }} />,
    badge: 'NEW',
  },
  {
    title: 'Team Collaboration',
    description: 'Invite parents or planners to help manage the chaos.',
    icon: <Groups fontSize="large" sx={{ color: '#DE3F5E' }} />,
    badge: 'NEW',
  },
  {
    title: 'Shopping Guide',
    description: 'Share curated shops and outfit ideas for every event.',
    icon: <Storefront fontSize="large" sx={{ color: '#DE3F5E' }} />,
    badge: 'NEW',
  },
  {
    title: 'WhatsApp-Native',
    description: 'One click for guests to join your official group.',
    icon: <WhatsApp fontSize="large" sx={{ color: '#DE3F5E' }} />,
    badge: 'INCLUDED',
  },
  {
    title: 'Custom Event Pages',
    description: 'Share your story, registry, and itinerary beautifully.',
    icon: <Web fontSize="large" sx={{ color: '#DE3F5E' }} />,
    badge: 'INCLUDED',
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
      'WhatsApp integration',
      'Photo galleries',
      'Registry pages',
      'Schedule display',
    ],
    buttonText: 'Start Free',
    highlight: false,
  },
  {
    name: 'DESTINATION BUNDLE',
    price: '$179',
    originalPrice: '$247',
    description: 'Essential agents for destination weddings',
    features: [
      'Travel Expert agent',
      'Emcee agent',
      'Chef agent',
      'Guest Concierge agent',
      'Timeline Orchestrator agent',
      'Save $68 vs. individual purchase',
    ],
    buttonText: 'Join Waitlist',
    highlight: true,
    badge: 'COMING SOON',
  },
  {
    name: 'FULL SERVICE',
    price: '$299',
    originalPrice: '$423',
    description: 'All 12 agents for complete coverage',
    features: [
      'All agents included',
      'Travel, Emcee, Chef, DJ',
      'Concierge, Vendor Liaison',
      'Photography, Timeline',
      'Stylist, Budget, Cultural Guide',
      'Registry Concierge',
      'Save $124 vs. individual purchase',
    ],
    buttonText: 'Join Waitlist',
    highlight: false,
    badge: 'COMING SOON',
  },
];

const comparisonData = [
  { item: 'Wedding Planner', cost: '$3,000 - $10,000' },
  { item: 'Day-of Coordinator', cost: '$1,000 - $3,000' },
  { item: 'RSVP Service', cost: '$200 - $500' },
  { item: 'Travel Coordination', cost: '$500 - $1,500' },
];

const audienceTypes = [
  {
    title: 'Destination Weddings',
    icon: <Flight sx={{ fontSize: 40 }} />,
    text: 'Planning from abroad? We handle the complex coordination.',
  },
  {
    title: 'Multi-Day Events',
    icon: <CalendarMonth sx={{ fontSize: 40 }} />,
    text: 'Mehndi, Sangeet, Haldi? Manage every event in one place.',
  },
  {
    title: 'DIY Couples',
    icon: <Handyman sx={{ fontSize: 40 }} />,
    text: 'Professional-grade tools without the professional price tag.',
  },
  {
    title: 'Cross-Cultural',
    icon: <Public sx={{ fontSize: 40 }} />,
    text: 'Help non-Indian guests understand traditions and customs.',
  },
];

const testimonials = [
  {
    quote:
      'We had guests coming from 7 different countries. Phera was a lifesaver—everyone knew exactly where to be and when.',
    author: 'Priya & Arjun',
    detail: 'Bay Area → Goa Wedding',
  },
  {
    quote:
      'I was ready to hire a $5,000 coordinator. Phera did everything they would have done for a fraction of the cost.',
    author: 'Simran & Raj',
    detail: 'London → Udaipur Wedding',
  },
  {
    quote:
      'The RSVP tracking alone was worth it. We had 400 guests across 5 events. I knew exactly who was coming to what.',
    author: 'Meera & Vikram',
    detail: 'Chicago Wedding',
  },
];

const weddingAgents = [
  {
    id: 'travel-expert',
    name: 'Travel Expert',
    persona: 'Maya',
    emoji: '🌍',
    tagline: 'Your wedding coordinator',
    problem: 'Coordinating 50+ flights and shuttles?',
    solution: 'Aggregates flight details and groups arrivals automatically.',
    keyPoints: [
      'Collects flight details',
      'Groups by arrival time',
      'Coordinates shuttles',
    ],
    pricing: 49,
    badge: 'COMING SOON',
    ctaType: 'waitlist' as const,
  },
  {
    id: 'emcee',
    name: 'Emcee',
    persona: 'Rohan',
    emoji: '📢',
    tagline: 'Your event announcer',
    problem: 'Guests missing updates?',
    solution: 'Sends WhatsApp broadcasts to keep everyone in the loop.',
    keyPoints: [
      'WhatsApp broadcasts',
      'Real-time updates',
      'Multi-language',
    ],
    pricing: 39,
    badge: 'COMING SOON',
    ctaType: 'waitlist' as const,
  },
  {
    id: 'chef',
    name: 'Chef',
    persona: 'Anjali',
    emoji: '👨‍🍳',
    tagline: 'Your culinary coordinator',
    problem: 'Overwhelmed by dietary needs?',
    solution: 'Analyzes allergies and suggests safe, balanced menus.',
    keyPoints: [
      'Tracks restrictions',
      'Suggests menus',
      'Local alternatives',
    ],
    pricing: 59,
    badge: 'COMING SOON',
    ctaType: 'pre-order' as const,
  },
  {
    id: 'dj',
    name: 'DJ',
    persona: 'Karan',
    emoji: '🎵',
    tagline: 'Your music curator',
    problem: 'Chaotic song requests?',
    solution: 'Curates cultural playlists and filters the noise.',
    keyPoints: [
      'Curates playlists',
      'Balances styles',
      'Filters content',
    ],
    pricing: 29,
    badge: 'COMING SOON',
    ctaType: 'waitlist' as const,
  },
  {
    id: 'concierge',
    name: 'Guest Concierge',
    persona: 'Priya',
    emoji: '🛎️',
    tagline: 'Your 24/7 guest assistant',
    problem: 'Answering repetitive questions?',
    solution: 'An AI chatbot that answers guests via WhatsApp/SMS.',
    keyPoints: [
      'AI guest chatbot',
      'Local recommendations',
      'Cultural context',
    ],
    pricing: 49,
    badge: 'COMING SOON',
    ctaType: 'learn-more' as const,
  },
  {
    id: 'vendor-liaison',
    name: 'Vendor Liaison',
    persona: 'Aditya',
    emoji: '📋',
    tagline: 'Your vendor coordinator',
    problem: 'Juggling contracts and timelines?',
    solution: 'Tracks payments and manages day-of vendor check-ins.',
    keyPoints: [
      'Tracks contracts',
      'Timeline updates',
      'Vendor check-ins',
    ],
    pricing: 39,
    badge: 'COMING SOON',
    ctaType: 'waitlist' as const,
  },
  {
    id: 'photographer',
    name: 'Photography Coordinator',
    persona: 'Nisha',
    emoji: '📸',
    tagline: 'Your photo organizer',
    problem: 'Missing special moments?',
    solution: 'Creates shot lists and collects guest photos in one place.',
    keyPoints: [
      'Creates shot lists',
      'Collects guest photos',
      'Organizes groups',
    ],
    pricing: 29,
    badge: 'COMING SOON',
    ctaType: 'waitlist' as const,
  },
  {
    id: 'timeline',
    name: 'Timeline Orchestrator',
    persona: 'Vikram',
    emoji: '⏰',
    tagline: 'Your schedule keeper',
    problem: 'Worried about delays?',
    solution: 'Builds dynamic timelines and alerts the wedding party.',
    keyPoints: [
      'Detailed timelines',
      'Party alerts',
      'Live adjustments',
    ],
    pricing: 39,
    badge: 'COMING SOON',
    ctaType: 'pre-order' as const,
  },
  {
    id: 'stylist',
    name: 'Outfit Stylist',
    persona: 'Kavya',
    emoji: '👗',
    tagline: 'Your fashion advisor',
    problem: 'Guests confused about attire?',
    solution: 'Suggests outfits and explains cultural dress codes.',
    keyPoints: [
      'Outfit suggestions',
      'Color coordination',
      'Cultural guides',
    ],
    pricing: 29,
    badge: 'COMING SOON',
    ctaType: 'waitlist' as const,
  },
  {
    id: 'budget',
    name: 'Budget Advisor',
    persona: 'Rahul',
    emoji: '💰',
    tagline: 'Your financial planner',
    problem: 'Losing track of expenses?',
    solution: 'Tracks spending and suggests cost-saving alternatives.',
    keyPoints: [
      'Tracks expenses',
      'Suggests savings',
      'Spending reports',
    ],
    pricing: 39,
    badge: 'COMING SOON',
    ctaType: 'learn-more' as const,
  },
  {
    id: 'cultural-guide',
    name: 'Cultural Guide',
    persona: 'Lakshmi',
    emoji: '🕉️',
    tagline: 'Your tradition educator',
    problem: 'Guests confused by rituals?',
    solution: 'Explains traditions and etiquette to non-Indian guests.',
    keyPoints: [
      'Explains rituals',
      'Etiquette guides',
      'Multi-language',
    ],
    pricing: 19,
    badge: 'COMING SOON',
    ctaType: 'waitlist' as const,
  },
  {
    id: 'registry',
    name: 'Registry Concierge',
    persona: 'Sanjay',
    emoji: '🎁',
    tagline: 'Your gift coordinator',
    problem: 'Registry chaos?',
    solution: 'Coordinates group gifts and tracks all contributions.',
    keyPoints: [
      'Gift coordination',
      'Group gifting',
      'Tracks contributions',
    ],
    pricing: 29,
    badge: 'COMING SOON',
    ctaType: 'pre-order' as const,
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
    q: 'What are "Smart Agents" and how do they work?',
    a: 'Smart Agents are specialized AI-powered assistants that handle specific wedding tasks like travel coordination, guest communication, or menu planning. You start free and add only the agents you need.',
  },
  {
    q: 'When will agents be available?',
    a: 'We\'re launching agents in phases starting Q2 2025. Join the waitlist for early access and exclusive discounts.',
  },
  {
    q: 'Do I have to buy all the agents?',
    a: 'Not at all! Each agent is optional. Pick only what you need—one agent, a bundle, or none. The core platform stays free forever.',
  },
  {
    q: 'Can I try agents before buying?',
    a: 'Yes! We\'ll offer free trials for all agents once they launch. Pre-order customers get extended trial periods.',
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

export default function LandingPage() {
  const theme = useTheme();
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<typeof weddingAgents[0] | null>(null);
  const [agentModalOpen, setAgentModalOpen] = useState(false);
  const [agentModalType, setAgentModalType] = useState<'waitlist' | 'pre-order' | 'learn-more'>('waitlist');
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);
  const [waitlistError, setWaitlistError] = useState('');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [thumbWidth, setThumbWidth] = useState(83); // Default to ~33% of 250px

  const handleAgentClick = (agentId: string, ctaType: string) => {
    const agent = weddingAgents.find((a) => a.id === agentId);
    if (agent) {
      setSelectedAgent(agent);
      if (ctaType === 'card-click' || ctaType === 'learn-more') {
        setAgentModalType('learn-more');
      } else {
        setAgentModalType(ctaType as 'waitlist' | 'pre-order' | 'learn-more');
      }
      setAgentModalOpen(true);
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const updateScrollProgress = () => {
      const scrollLeft = container.scrollLeft;
      const scrollWidth = container.scrollWidth - container.clientWidth;
      const progress = scrollWidth > 0 ? scrollLeft / scrollWidth : 0;
      setScrollProgress(progress);
      
      // Calculate thumb width (250px is the scrollbar track width)
      const visibleWidth = container.clientWidth;
      const totalWidth = container.scrollWidth;
      const calculatedThumbWidth = Math.max(30, (visibleWidth / totalWidth) * 250);
      setThumbWidth(calculatedThumbWidth);
    };

    container.addEventListener('scroll', updateScrollProgress);
    updateScrollProgress(); // Initial calculation

    // Also update on resize
    const resizeObserver = new ResizeObserver(updateScrollProgress);
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener('scroll', updateScrollProgress);
      resizeObserver.disconnect();
    };
  }, []);

  const handleWaitlistSubmit = async () => {
    if (!waitlistEmail) return;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(waitlistEmail)) {
      setWaitlistError('Please enter a valid email address');
      return;
    }

    setWaitlistLoading(true);
    setWaitlistError('');

    try {
      // Submit to waitlist for all agents (general waitlist)
      const response = await fetch('/api/agents/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: waitlistEmail,
          agent_id: 'all-agents',
          cta_type: 'waitlist',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit');
      }

      setWaitlistSuccess(true);
      setWaitlistEmail('');

      // Reset success message after 3 seconds
      setTimeout(() => {
        setWaitlistSuccess(false);
      }, 3000);
    } catch (err) {
      setWaitlistError('Something went wrong. Please try again.');
    } finally {
      setWaitlistLoading(false);
    }
  };

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
        <Container maxWidth="lg" sx={{ pt: { xs: 16, md: 24 }, pb: 10 }}>
          <motion.div initial="hidden" animate="visible" variants={fadeIn}>
            <Stack spacing={4} sx={{ alignItems: 'center', textAlign: 'center' }}>
              {/* <Chip
                label="Welcome to Phera"
                sx={{
                  bgcolor: alpha('#DE3F5E', 0.1),
                  color: '#DE3F5E',
                  fontWeight: 600,
                  borderRadius: '16px',
                  px: 1,
                }}
              /> */}
              <Typography
                variant="h1"
                sx={{
                  fontFamily: 'var(--font-instrument-serif)',
                  fontSize: { xs: '2.5rem', md: '4.5rem', lg: '5.5rem' },
                  lineHeight: 1.1,
                  color: '#1a1a1a',
                  maxWidth: '1000px',
                }}
              >
                Your Indian Wedding,
                <br /> Minus the Chaos
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  fontSize: { xs: '1.1rem', md: '1.5rem' },
                  color: '#4a4a4a',
                  maxWidth: '800px',
                  lineHeight: 1.6,
                  fontWeight: 400,
                }}
              >
                Start free. Add smart AI agents only when you need extra help.
                Your wedding, your way.
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
                    px: 5,
                    py: 1.5,
                    borderRadius: '32px',
                    fontSize: '1.1rem',
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
                    px: 5,
                    py: 1.5,
                    borderRadius: '32px',
                    fontSize: '1.1rem',
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
        <Container maxWidth="lg" sx={{ py: 8 }}>
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
                mb: 6,
                fontSize: { xs: '2rem', md: '3rem' },
                color: '#1a1a1a',
              }}
            >
              Planning Shouldn't Feel Like a Full-Time Job
            </Typography>
            <Grid container spacing={3}>
              {painPoints.map((point, idx) => (
                <Grid size={{ xs: 12, sm: 6, md: 3 }} key={idx}>
                  <Paper
                    sx={{
                      p: 3,
                      height: '100%',
                      borderRadius: '24px',
                      bgcolor: alpha('#fff', 0.9),
                      backdropFilter: 'blur(10px)',
                      color: '#1a1a1a',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                    }}
                  >
                    <Stack spacing={2}>
                      {point.icon}
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1a1a1a' }}>
                        {point.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#4a4a4a' }}>
                        {point.description}
                      </Typography>
                    </Stack>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </motion.div>
        </Container>

        {/* --- SOLUTION & FEATURES --- */}
        <Box sx={{ bgcolor: alpha('#DE3F5E', 0.03), py: 10 }}>
          <Container maxWidth="lg">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              <Stack spacing={2} sx={{ textAlign: 'center', mb: 8, alignItems: 'center' }}>
                <Typography
                  variant="overline"
                  color="primary"
                  sx={{ fontWeight: 'bold', fontSize: '1rem' }}
                >
                  THE SOLUTION
                </Typography>
                <Typography
                  variant="h2"
                  sx={{
                    fontFamily: 'var(--font-instrument-serif)',
                    fontSize: { xs: '2.5rem', md: '3.5rem' },
                    color: '#1a1a1a',
                  }}
                >
                  One Platform. Every Detail. Zero Stress.
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    maxWidth: '700px',
                    mx: 'auto',
                    color: '#4a4a4a',
                    textAlign: 'center',
                  }}
                >
                  Phera is the modern wedding platform built specifically for
                  Indian weddings. We've combined everything you need into one
                  beautiful system.
                </Typography>
              </Stack>

              <Grid container spacing={4}>
                {keyFeatures.map((feature, idx) => (
                  <Grid size={{ xs: 12, md: 4 }} key={idx}>
                    <motion.div variants={fadeIn}>
                      <Paper
                        sx={{
                          p: 4,
                          height: '100%',
                          borderRadius: '24px',
                          color: '#1a1a1a',
                          bgcolor: 'white',
                          transition: 'all 0.3s',
                          '&:hover': {
                            transform: 'translateY(-5px)',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                          },
                        }}
                      >
                        <Stack spacing={2}>
                          <Stack
                            direction="row"
                            sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}
                          >
                            {feature.icon}
                            <Chip
                              label={feature.badge}
                              size="small"
                              sx={{
                                bgcolor:
                                  feature.badge === 'FREE'
                                    ? '#E0F2F1'
                                    : '#F3E5F5',
                                color:
                                  feature.badge === 'FREE'
                                    ? '#00695C'
                                    : '#7B1FA2',
                                fontWeight: 700,
                              }}
                            />
                          </Stack>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1a1a1a' }}>
                            {feature.title}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{ lineHeight: 1.6, color: '#4a4a4a' }}
                          >
                            {feature.description}
                          </Typography>
                        </Stack>
                      </Paper>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>
            </motion.div>
          </Container>
        </Box>

        {/* --- SMART WEDDING AGENTS --- */}
        <Box sx={{ py: 2, bgcolor: alpha('#DE3F5E', 0.02) }}>
          {/* Header Section - Within Container */}
          <Container maxWidth="lg">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              <Stack spacing={2} sx={{ textAlign: 'center', mb: 3, alignItems: 'center' }}>
                <Typography
                  variant="h2"
                  sx={{
                    fontFamily: 'var(--font-instrument-serif)',
                    fontSize: { xs: '2.5rem', md: '4rem' },
                    color: '#1a1a1a',
                  }}
                >
                  Meet Your Wedding Dream Team
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    maxWidth: '800px',
                    mx: 'auto',
                    color: '#4a4a4a',
                    fontWeight: 400,
                    textAlign: 'center',
                    fontSize: { xs: '1.1rem', md: '1.3rem' },
                  }}
                >
                  We're not here to take away the magic—just to handle the tedious logistics and administrative tasks that bog you down. Get personalized starting points for the not-so-fun stuff, so you can focus on what truly matters: celebrating your love.
                </Typography>
              </Stack>
            </motion.div>
          </Container>

          {/* Horizontal Scroll Container - Full Width */}
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <Box
              sx={{
                width: '90%',
                maxWidth: '100%',
              }}
            >
              <Box
                ref={scrollContainerRef}
                sx={{
                  display: 'flex',
                  gap: 3,
                  overflowX: 'auto',
                  overflowY: 'visible',
                  pb: 2,
                  minHeight: '675px',
                  alignItems: 'flex-start',
                  scrollbarWidth: 'none', // Firefox
                  '&::-webkit-scrollbar': {
                    display: 'none', // Chrome, Safari
                  },
                }}
              >
                {weddingAgents.map((agent) => (
                  <Box key={agent.id} sx={{ flexShrink: 0 }}>
                    <AgentCard
                      {...agent}
                      onCtaClick={handleAgentClick}
                    />
                  </Box>
                ))}
              </Box>
              
              {/* Custom Scrollbar Indicator */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  width: '100%',
                  mt: 2,
                }}
              >
                <Box
                  sx={{
                    width: '250px',
                    height: '6px',
                    bgcolor: 'rgba(0, 0, 0, 0.05)',
                    borderRadius: '3px',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      height: '100%',
                      width: `${thumbWidth}px`,
                      bgcolor: '#DE3F5E',
                      borderRadius: '3px',
                      transform: `translateX(${scrollProgress * (250 - thumbWidth)}px)`,
                      transition: 'transform 0.1s ease-out',
                    }}
                  />
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Waitlist Form - Under Horizontal Scroll */}
          <Container maxWidth="md" sx={{ mt: 6, mb: 4 }}>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <Stack spacing={3} sx={{ alignItems: 'center' }}>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 600,
                    color: '#1a1a1a',
                    textAlign: 'center',
                  }}
                >
                  Get notified when agents are available
                </Typography>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={2}
                  sx={{ width: '100%', maxWidth: '600px' }}
                >
                  <TextField
                    fullWidth
                    type="email"
                    placeholder="Enter your email"
                    value={waitlistEmail}
                    onChange={(e) => {
                      setWaitlistEmail(e.target.value);
                      setWaitlistError('');
                    }}
                    disabled={waitlistLoading || waitlistSuccess}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        bgcolor: 'white',
                        '& fieldset': {
                          borderColor: waitlistError ? '#d32f2f' : 'rgba(0, 0, 0, 0.23)',
                        },
                        '&:hover fieldset': {
                          borderColor: waitlistError ? '#d32f2f' : 'rgba(0, 0, 0, 0.4)',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#DE3F5E',
                        },
                      },
                    }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleWaitlistSubmit}
                    disabled={waitlistLoading || waitlistSuccess || !waitlistEmail}
                    sx={{
                      bgcolor: '#DE3F5E',
                      color: 'white',
                      borderRadius: '12px',
                      textTransform: 'none',
                      fontWeight: 600,
                      px: 4,
                      py: 1.5,
                      minWidth: { xs: '100%', sm: '180px' },
                      '&:hover': {
                        bgcolor: '#C8365A',
                      },
                      '&:disabled': {
                        bgcolor: '#ccc',
                      },
                    }}
                  >
                    {waitlistLoading ? (
                      <CircularProgress size={24} sx={{ color: 'white' }} />
                    ) : waitlistSuccess ? (
                      'Subscribed!'
                    ) : (
                      'Notify Me'
                    )}
                  </Button>
                </Stack>
                {waitlistError && (
                  <Alert
                    severity="error"
                    onClose={() => setWaitlistError('')}
                    sx={{ width: '100%', maxWidth: '600px', borderRadius: '12px' }}
                  >
                    {waitlistError}
                  </Alert>
                )}
                {waitlistSuccess && (
                  <Alert
                    severity="success"
                    sx={{ width: '100%', maxWidth: '600px', borderRadius: '12px' }}
                  >
                    🎉 You're on the list! Check your email for confirmation.
                  </Alert>
                )}
              </Stack>
            </motion.div>
          </Container>

          {/* Bundle Deals Section - Within Container */}
          <Container maxWidth="lg">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              <Box sx={{ textAlign: 'center', mt: 6 }}>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={2}
                  sx={{ justifyContent: 'center', alignItems: 'center' }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      color: '#1a1a1a',
                      fontWeight: 600,
                    }}
                  >
                    Want them all?
                  </Typography>
                  <Stack direction="row" spacing={2}>
                    <Paper
                      sx={{
                        px: 3,
                        py: 1.5,
                        bgcolor: 'rgba(222, 63, 94, 0.05)',
                        borderRadius: '12px',
                        border: '1px solid rgba(222, 63, 94, 0.2)',
                      }}
                    >
                      <Typography variant="body2" sx={{ color: '#666', fontSize: '0.85rem' }}>
                        Destination Bundle
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#DE3F5E' }}>
                        $179 <Typography component="span" variant="caption" sx={{ color: '#999', textDecoration: 'line-through' }}>$247</Typography>
                      </Typography>
                    </Paper>
                    <Paper
                      sx={{
                        px: 3,
                        py: 1.5,
                        bgcolor: 'rgba(222, 63, 94, 0.08)',
                        borderRadius: '12px',
                        border: '2px solid #DE3F5E',
                      }}
                    >
                      <Typography variant="body2" sx={{ color: '#666', fontSize: '0.85rem' }}>
                        Full Service Bundle
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#DE3F5E' }}>
                        $299 <Typography component="span" variant="caption" sx={{ color: '#999', textDecoration: 'line-through' }}>$423</Typography>
                      </Typography>
                    </Paper>
                  </Stack>
                </Stack>
              </Box>
            </motion.div>
          </Container>
        </Box>

        {/* --- HOW IT WORKS --- */}
        <Container maxWidth="lg" sx={{ py: 10 }}>
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
                mb: 8,
                fontSize: { xs: '2rem', md: '3rem' },
                color: '#1a1a1a',
              }}
            >
              From Engaged to Married in 4 Steps
            </Typography>
            <Grid container spacing={4}>
              {[
                'Create Your Wedding',
                'Pick Your Modules',
                'Invite Your Guests',
                'Manage with Ease',
              ].map((step, idx) => (
                <Grid size={{ xs: 12, sm: 6, md: 3 }} key={idx}>
                  <Stack spacing={2} sx={{ alignItems: 'center', textAlign: 'center' }}>
                    <Box
                      sx={{
                        width: 60,
                        height: 60,
                        borderRadius: '50%',
                        bgcolor: '#DE3F5E',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        mb: 2,
                      }}
                    >
                      {idx + 1}
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1a1a1a' }}>
                      {step}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#4a4a4a' }}>
                      {idx === 0 &&
                        'Customize your design and add details in 10 minutes.'}
                      {idx === 1 &&
                        'Start free, add agents later. Pick only the helpers you need—travel, chef, DJ, and more.'}
                      {idx === 2 &&
                        'Share your beautiful website. Guests RSVP and get details.'}
                      {idx === 3 &&
                        'Track RSVPs, coordinate logistics, and handle vendors.'}
                    </Typography>
                  </Stack>
                </Grid>
              ))}
            </Grid>
          </motion.div>
        </Container>

        {/* --- PRICING --- */}
        <Box sx={{ bgcolor: '#FAFAFA', py: 12 }}>
          <Container maxWidth="lg">
            <Stack spacing={2} sx={{ textAlign: 'center', mb: 8 }}>
              <Typography
                variant="h2"
                sx={{
                  fontFamily: 'var(--font-instrument-serif)',
                  fontSize: { xs: '2.5rem', md: '3.5rem' },
                  color: '#1a1a1a',
                }}
              >
                Choose Your Experience
              </Typography>
              <Typography variant="h6" sx={{ color: '#4a4a4a' }}>
                Start free, add what you need. No hidden fees.
              </Typography>
            </Stack>

            <Grid container spacing={4} sx={{ alignItems: 'flex-start' }}>
              {pricingTiers.map((tier, idx) => (
                <Grid size={{ xs: 12, md: 4 }} key={idx}>
                  <Paper
                    elevation={tier.highlight ? 8 : 0}
                    sx={{
                      p: 4,
                      borderRadius: '24px',
                      bgcolor: 'white',
                      color: '#1a1a1a',
                      border: tier.highlight
                        ? '2px solid #DE3F5E'
                        : '1px solid #E0E0E0',
                      position: 'relative',
                      top: tier.highlight ? -20 : 0,
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                      }
                    }}
                  >
                    {tier.highlight && (
                      <Chip
                        label="MOST POPULAR"
                        sx={{
                          position: 'absolute',
                          top: -12,
                          right: 24,
                          bgcolor: '#DE3F5E',
                          color: 'white',
                          fontWeight: 'bold',
                        }}
                      />
                    )}
                    {(tier as any).badge && (
                      <Chip
                        label={(tier as any).badge}
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 16,
                          right: 16,
                          bgcolor: '#FFF3E0',
                          color: '#E65100',
                          fontWeight: 700,
                          fontSize: '0.7rem',
                        }}
                      />
                    )}
                    <Typography
                      variant="overline"
                      sx={{ fontWeight: 'bold', opacity: 0.7, color: '#DE3F5E' }}
                    >
                      {tier.name}
                    </Typography>
                    <Box sx={{ my: 2 }}>
                      <Typography variant="h3" sx={{ fontWeight: 'bold', display: 'inline' }}>
                        {tier.price}
                      </Typography>
                      {(tier as any).originalPrice && (
                        <Typography
                          component="span"
                          variant="h6"
                          sx={{
                            ml: 2,
                            textDecoration: 'line-through',
                            color: '#999',
                          }}
                        >
                          {(tier as any).originalPrice}
                        </Typography>
                      )}
                    </Box>
                    <Typography variant="body2" sx={{ mb: 4, color: '#4a4a4a' }}>
                      {tier.description}
                    </Typography>

                    <List dense sx={{ mb: 4 }}>
                      {tier.features.map((feature, fIdx) => (
                        <ListItem key={fIdx} disableGutters>
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <CheckCircle
                              sx={{
                                color: '#DE3F5E',
                                fontSize: 20,
                              }}
                            />
                          </ListItemIcon>
                          <ListItemText 
                            primary={feature}
                            primaryTypographyProps={{
                              sx: { color: '#1a1a1a' }
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>

                    <Button
                      fullWidth
                      variant={tier.highlight ? 'contained' : 'outlined'}
                      sx={{
                        borderRadius: '32px',
                        py: 1.5,
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
                      {tier.buttonText}
                    </Button>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>

        {/* --- COST SAVINGS & AUDIENCE --- */}
        <Container maxWidth="lg" sx={{ py: 10 }}>
          <Grid container spacing={8}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography
                variant="h3"
                sx={{ fontFamily: 'var(--font-instrument-serif)', mb: 4, color: '#1a1a1a' }}
              >
                What You're Replacing
              </Typography>
              <Stack spacing={2}>
                {comparisonData.map((row, idx) => (
                  <Stack
                    key={idx}
                    direction="row"
                    sx={{ justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.1)', pb: 1 }}
                  >
                    <Typography variant="body1" sx={{ fontWeight: '500', color: '#1a1a1a' }}>
                      {row.item}
                    </Typography>
                    <Typography variant="body1" color="error.main">
                      {row.cost}
                    </Typography>
                  </Stack>
                ))}
                <Stack
                  direction="row"
                  sx={{ justifyContent: 'space-between', pt: 2 }}
                >
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1a1a1a' }}>
                    Total Potential Cost
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }} color="error.main">
                    $5,000+
                  </Typography>
                </Stack>
                <Box
                  sx={{
                    p: 3,
                    bgcolor: '#E0F2F1',
                    borderRadius: '16px',
                    mt: 2,
                  }}
                >
                  <Stack
                    direction="row"
                    sx={{ justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <Typography
                      variant="h6"
                      color="primary.dark"
                      sx={{ fontWeight: 'bold' }}
                    >
                      Phera Full Package
                    </Typography>
                    <Typography
                      variant="h4"
                      color="primary.dark"
                      sx={{ fontWeight: 'bold' }}
                    >
                      $599
                    </Typography>
                  </Stack>
                </Box>
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Typography
                variant="h3"
                sx={{ fontFamily: 'var(--font-instrument-serif)', mb: 4, color: '#1a1a1a' }}
              >
                Built For You
              </Typography>
              <Grid container spacing={2}>
                {audienceTypes.map((type, idx) => (
                  <Grid size={{ xs: 12, sm: 6 }} key={idx}>
                    <Card
                      sx={{
                        p: 3,
                        height: '100%',
                        borderRadius: '20px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                        bgcolor: 'white',
                        color: '#1a1a1a',
                      }}
                    >
                      <Box sx={{ color: '#DE3F5E', mb: 2 }}>{type.icon}</Box>
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#1a1a1a' }}>
                        {type.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#4a4a4a' }}>
                        {type.text}
                      </Typography>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>
        </Container>

        {/* --- TESTIMONIALS --- */}
        <Box sx={{ bgcolor: '#FFF5F5', py: 10 }}>
          <Container maxWidth="lg">
            <Typography
              variant="h2"
              align="center"
              sx={{ fontFamily: 'var(--font-instrument-serif)', mb: 8, color: '#1a1a1a' }}
            >
              Real Couples, Real Relief
            </Typography>
            <Grid container spacing={4}>
              {testimonials.map((t, idx) => (
                <Grid size={{ xs: 12, md: 4 }} key={idx}>
                  <Card
                    sx={{
                      p: 4,
                      height: '100%',
                      borderRadius: '24px',
                      border: 'none',
                      boxShadow: '0 8px 30px rgba(222, 63, 94, 0.08)',
                      bgcolor: 'white',
                      color: '#1a1a1a',
                      }}
                    >
                    <Stack spacing={2} sx={{ height: '100%', justifyContent: 'space-between' }}>
                      <Typography
                        variant="body1"
                        sx={{ fontStyle: 'italic', fontSize: '1.1rem', color: '#4a4a4a' }}
                      >
                        "{t.quote}"
                      </Typography>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#1a1a1a' }}>
                          {t.author}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#5a5a5a' }}>
                          {t.detail}
                        </Typography>
                      </Box>
                    </Stack>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>

        {/* --- FAQ --- */}
        <Container maxWidth="md" sx={{ py: 10 }}>
          <Typography
            variant="h2"
            align="center"
            sx={{ fontFamily: 'var(--font-instrument-serif)', mb: 6, color: '#1a1a1a' }}
          >
            Questions? We've Got Answers.
          </Typography>
          <Stack spacing={2}>
            {faqs.map((faq, idx) => (
              <Accordion
                key={idx}
                elevation={0}
                sx={{
                  bgcolor: 'white',
                  border: '1px solid rgba(0,0,0,0.08)',
                  borderRadius: '16px !important',
                  '&:before': { display: 'none' },
                }}
              >
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: '500', color: '#1a1a1a' }}>
                    {faq.q}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body1" sx={{ color: '#4a4a4a' }}>
                    {faq.a}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Stack>
        </Container>

        {/* --- FINAL CTA --- */}
        <Container maxWidth="lg" sx={{ pb: 12 }}>
          <Paper
            sx={{
              p: { xs: 4, md: 8 },
              borderRadius: '40px',
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
                sx={{ fontFamily: 'var(--font-instrument-serif)', mb: 3, color: '#1a1a1a' }}
              >
                Your Wedding, Your Way
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  mb: 5,
                  color: '#4a4a4a',
                  maxWidth: '600px',
                  mx: 'auto',
                }}
              >
                Join the couples who are planning beautiful Indian weddings
                without the burnout. Start free, add what you need.
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
                    px: 5,
                    py: 1.5,
                    borderRadius: '32px',
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    '&:hover': { bgcolor: '#C8365A' },
                  }}
                >
                  Create Your Wedding Free
                </Button>
                <Button
                  component={Link}
                  href="/demo"
                  variant="outlined"
                  size="large"
                  sx={{
                    borderColor: '#DE3F5E',
                    color: '#DE3F5E',
                    px: 5,
                    py: 1.5,
                    borderRadius: '32px',
                    fontSize: '1.1rem',
                    border: '2px solid',
                    '&:hover': {
                      borderColor: '#C8365A',
                      bgcolor: alpha('#DE3F5E', 0.05),
                      border: '2px solid',
                    },
                  }}
                >
                  Schedule a Demo
                </Button>
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
                  <Link href="#" className="text-[#4a4a4a] hover:text-[#DE3F5E] transition-colors">
                    Features
                  </Link>
                  <Link href="#" className="text-[#4a4a4a] hover:text-[#DE3F5E] transition-colors">
                    Pricing
                  </Link>
                  <Link href="#" className="text-[#4a4a4a] hover:text-[#DE3F5E] transition-colors">
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
                  <Link href="#" className="text-[#4a4a4a] hover:text-[#DE3F5E] transition-colors">
                    About Us
                  </Link>
                  <Link href="#" className="text-[#4a4a4a] hover:text-[#DE3F5E] transition-colors">
                    Contact
                  </Link>
                  <Link href="#" className="text-[#4a4a4a] hover:text-[#DE3F5E] transition-colors">
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
              <Typography variant="body2" sx={{ color: '#5a5a5a' }}>
                © {new Date().getFullYear()} Phera. All rights reserved.
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

      <AgentModal
        open={agentModalOpen}
        onClose={() => {
          setAgentModalOpen(false);
          setSelectedAgent(null);
        }}
        agent={selectedAgent}
        modalType={agentModalType}
      />
    </OptimizedBackground>
  );
}
