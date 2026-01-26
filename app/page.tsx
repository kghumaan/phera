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
} from '@mui/icons-material';
import AppHeader from '@/components/shared/AppHeader';
import OptimizedBackground from '@/components/ui/OptimizedBackground';
import { useState } from 'react';
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
          p: large ? { xs: 4, md: 6 } : 4,
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
            sx={{ justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}
          >
            <Box sx={{ 
              p: 1.5, 
              borderRadius: '16px', 
              bgcolor: isDark ? alpha('#fff', 0.1) : alpha('#DE3F5E', 0.05),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
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
                  fontSize: '0.7rem',
                  letterSpacing: '0.5px',
                  border: badge === 'PRO' ? '1px solid rgba(222, 63, 94, 0.1)' : 'none'
                }}
              />
            )}
          </Stack>
          
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 800, 
              mb: 2, 
              fontFamily: 'var(--font-instrument-serif)',
              fontSize: large ? { xs: '2rem', md: '3rem' } : { xs: '1.5rem', md: '1.75rem' },
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
              fontSize: large ? '1.25rem' : '1.1rem',
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
              <Typography
                variant="h1"
                sx={{
                  fontFamily: 'var(--font-instrument-serif)',
                  fontSize: { xs: '2rem', md: '3.5rem', lg: '4.5rem' },
                  lineHeight: 1.1,
                  color: '#1a1a1a',
                  maxWidth: '1000px',
                }}
              >
                Destination Wedding,
                <br />
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
                  fontSize: { xs: '1.25rem', md: '1.75rem' },
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
                  fontSize: { xs: '1rem', md: '1.25rem' },
                  color: '#4a4a4a',
                  maxWidth: '800px',
                  lineHeight: 1.6,
                  fontWeight: 400,
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
        <Container maxWidth="xl" sx={{ py: 14 }}>
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
                mb: 10,
                fontSize: { xs: '2rem', md: '3.5rem', lg: '4.5rem' },
                color: '#1a1a1a',
                maxWidth: '1000px',
                mx: 'auto',
                lineHeight: 1.1,
              }}
            >
              Wedding Planning shouldn't feel like a <Box component="span" sx={{ color: '#DE3F5E', fontStyle: 'italic' }}>Second Job</Box>
            </Typography>

            <Box 
              sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' },
                gap: { xs: 4, lg: 6 },
                perspective: '1200px',
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
                >
                  <Paper
                    elevation={0}
                    sx={{
                      p: { xs: 4, md: 6 },
                      height: '100%',
                      minHeight: { md: '350px' },
                      bgcolor: point.color,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 3,
                      position: 'relative',
                      // Post-it Fold Effect: The polygon clips the top-right corner
                      clipPath: 'polygon(0 0, calc(100% - 40px) 0, 100% 40px, 100% 100%, 0 100%)',
                      // Use filter: drop-shadow instead of boxShadow to follow the clipped shape
                      filter: 'drop-shadow(8px 8px 0px rgba(0,0,0,0.02))',
                      transition: 'filter 0.3s ease',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        width: '40px',
                        height: '40px',
                        bgcolor: alpha('#000', 0.1),
                        clipPath: 'polygon(0 0, 100% 100%, 0 100%)',
                        zIndex: 2,
                      }
                    }}
                  >
                    <Box sx={{ minHeight: '80px', display: 'flex', alignItems: 'center' }}>
                      {typeof point.icon === 'string' ? (
                        <Typography sx={{ fontSize: '4rem' }}>
                          {point.icon}
                        </Typography>
                      ) : (
                        point.icon
                      )}
                    </Box>
                    
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 800, 
                        color: '#1a1a1a',
                        fontFamily: 'var(--font-instrument-serif)',
                        lineHeight: 1.1,
                        fontSize: { xs: '1.5rem', md: '2rem' }
                      }}
                    >
                      {point.title}
                    </Typography>
                    
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        color: '#4a4a4a',
                        lineHeight: 1.6,
                        fontWeight: 450,
                        fontSize: { xs: '1rem', md: '1.15rem' }
                      }}
                    >
                      {point.description}
                    </Typography>

                    <Box 
                      sx={{ 
                        position: 'absolute', 
                        bottom: -20, 
                        right: -20, 
                        fontSize: '10rem', 
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
          </motion.div>
        </Container>

        {/* --- SOLUTION & FEATURES (Bento Grid) --- */}
        <Box sx={{ bgcolor: alpha('#DE3F5E', 0.03), py: 14 }}>
          <Container maxWidth="xl">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              <Stack spacing={2} sx={{ textAlign: 'center', mb: 10, alignItems: 'center' }}>
                <Typography
                  variant="overline"
                  sx={{ color: '#DE3F5E', fontWeight: 800, letterSpacing: '2px' }}
                >
                  THE SOLUTION
                </Typography>
                <Typography
                  variant="h2"
                  sx={{
                    fontFamily: 'var(--font-instrument-serif)',
                    fontSize: { xs: '2.5rem', md: '3.5rem', lg: '4.5rem' },
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
                    fontSize: { xs: '1.1rem', md: '1.35rem' },
                    lineHeight: 1.6,
                    mt: 3,
                    opacity: 0.9
                  }}
                >
                  Ditch the messy spreadsheets and fragmented group chats. Phera brings your 
                  entire wedding coordination into one powerful, integrated system.
                </Typography>
              </Stack>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                  gridAutoRows: 'minmax(250px, auto)',
                  gap: 3,
                }}
              >
                {/* 1. Smart RSVP & Multi-Event (Large Feature) */}
                <Box sx={{ gridColumn: { md: '1 / span 2' }, gridRow: { md: '1 / span 2' } }}>
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
                <Box sx={{ gridColumn: { md: '3 / span 1' }, gridRow: { md: '1 / span 2' } }}>
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
                <Box>
                  <FeatureCard 
                    title="Travel Coordination"
                    description="Collect flight details and organize airport pickups seamlessly."
                    icon={keyFeatures[2].icon}
                    badge="PRO"
                  />
                </Box>

                {/* 4. PIN Privacy */}
                <Box>
                  <FeatureCard 
                    title="VIP Privacy"
                    description="PIN-based access codes for family, individuals, and VIPs."
                    icon={keyFeatures[3].icon}
                    badge="FREE"
                  />
                </Box>

                {/* 5. Gift Registry */}
                <Box>
                  <FeatureCard 
                    title="Modern Registry"
                    description="Secure cash gifts and honeymoon funds via Stripe."
                    icon={keyFeatures[5].icon}
                    badge="PRO"
                  />
                </Box>
              </Box>
            </motion.div>
          </Container>
        </Box>

        {/* --- WHATSAPP AGENT SHOWCASE --- */}
        <Box sx={{ py: { xs: 8, md: 4 }, bgcolor: '#075E54', color: 'white', position: 'relative', overflow: 'hidden' }}>
          {/* Decorative background circle */}
          <Box sx={{
            position: 'absolute',
            top: -100,
            right: -100,
            width: 400,
            height: 400,
            bgcolor: 'rgba(255,255,255,0.1)',
            borderRadius: '50%',
          }} />
          
          <Container maxWidth="xl">
            <Grid container spacing={8} alignItems="center">
              <Grid size={{ xs: 12, md: 6 }}>
                <motion.div
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeIn}
                >
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                    <WhatsApp sx={{ fontSize: { xs: '3rem', md: '5rem' }, color: '#25D366' }} />
                    <Typography
                      variant="h2"
                      sx={{
                        fontFamily: 'var(--font-instrument-serif)',
                        fontSize: { xs: '2.5rem', md: '4rem', lg: '5rem' },
                        lineHeight: 1.1,
                      }}
                    >
                      Your 24/7 Wedding Concierge
                    </Typography>
                  </Stack>
                  <Typography variant="h6" sx={{ mb: 6, opacity: 0.9, fontWeight: 400, fontSize: { xs: '1.1rem', md: '1.4rem' }, lineHeight: 1.4 }}>
                    Stop being your guests' personal assistant. Let our intelligent WhatsApp
                    Concierge handle the repetitive questions so you can focus on your celebration.
                  </Typography>
                  
                  <List sx={{ mb: 4 }}>
                    {[
                      { icon: <SupportAgent />, text: "Answers FAQs about schedule, venue, and dress code" },
                      { icon: <DirectionsBus />, text: "Coordinates shuttle sign-ups and airport pickups" },
                      { icon: <Campaign />, text: "Broadcasts urgent updates to your entire guest list" },
                      { icon: <Check />, text: "All data comes directly from your wedding website" }
                    ].map((item, idx) => (
                      <ListItem key={idx} sx={{ px: 0 }}>
                        <ListItemIcon sx={{ color: '#25D366', minWidth: 40 }}>
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText 
                          primary={item.text} 
                          primaryTypographyProps={{ fontSize: '1.25rem' }}
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
                      px: 5,
                      py: 2,
                      borderRadius: '32px',
                      fontSize: '1.25rem',
                      fontWeight: 'bold',
                      textTransform: 'none',
                      mt: 2,
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
                      borderRadius: '50px',
                      bgcolor: '#EFE7DE', // WhatsApp chat bg (classic beige/pattern) or use image
                      width: '440px', // Wider phone
                      height: '900px', // Taller phone
                      mx: 'auto',
                      position: 'relative',
                      border: '18px solid #1a1a1a',
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
                       width: '120px', 
                       height: '30px', 
                       bgcolor: '#1a1a1a', 
                       borderBottomLeftRadius: '16px',
                       borderBottomRightRadius: '16px',
                       zIndex: 20
                     }} />

                     {/* Custom WhatsApp Header */}
                     <Box sx={{ 
                       bgcolor: '#202C33', // Dark header
                       color: 'primary.contrastText',
                       pt: 6, // Space for notch/status bar
                       pb: 1.5,
                       px: 1,
                       display: 'flex',
                       alignItems: 'center',
                       boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                       zIndex: 10
                     }}>
                        <Stack direction="row" alignItems="center" spacing={0} sx={{ mr: 1, color: 'white' }}>
                          <ArrowBack sx={{ fontSize: '1.75rem' }} />
                        </Stack>

                        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flexGrow: 1 }}>
                          <Avatar 
                            src="/Phera Logomark.jpg" 
                            sx={{ width: 42, height: 42 }}
                          />
                          <Box>
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'white', lineHeight: 1.2, fontSize: '1.1rem' }}>
                                Phera
                              </Typography>
                              <Verified sx={{ fontSize: '1.1rem', color: '#2979FF' }} />
                            </Stack>
                          </Box>
                        </Stack>
                     </Box>

                     {/* Chat Area */}
                     <Stack spacing={2} sx={{ p: 2, flexGrow: 1, overflowY: 'auto' }}>
                       {/* Date Separator */}
                       <Box sx={{ alignSelf: 'center', bgcolor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', px: 1.5, py: 0.5, borderRadius: '8px', mb: 2 }}>
                         <Typography variant="caption" sx={{ color: '#54656F', fontWeight: 500, bgcolor: '#FFF', px: 1, py: 0.5, borderRadius: '8px', boxShadow: '0 1px 0.5px rgba(0,0,0,0.1)' }}>
                           Today
                         </Typography>
                       </Box>

                       {/* Chat Bubble Guest */}
                       <Box sx={{ alignSelf: 'flex-start', bgcolor: 'white', p: 1.5, borderRadius: '0px 12px 12px 12px', maxWidth: '85%', boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)', position: 'relative' }}>
                          {/* Triangle */}
                          <Box sx={{ position: 'absolute', top: 0, left: -8, width: 0, height: 0, borderTop: '12px solid white', borderLeft: '12px solid transparent' }} />
                         
                         <Typography variant="body2" sx={{ color: '#111b21', fontSize: '0.95rem', lineHeight: 1.3 }}>
                           Hey! What time is the shuttle for the Sangeet leaving?
                         </Typography>
                         <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: '#667781', textAlign: 'right', fontSize: '0.7rem' }}>
                           10:42 AM
                         </Typography>
                       </Box>

                       {/* Chat Bubble Bot */}
                       <Box sx={{ alignSelf: 'flex-end', bgcolor: '#E7FFDB', p: 1.5, borderRadius: '12px 0px 12px 12px', maxWidth: '85%', boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)', position: 'relative' }}>
                          {/* Triangle */}
                          <Box sx={{ position: 'absolute', top: 0, right: -8, width: 0, height: 0, borderTop: '12px solid #E7FFDB', borderRight: '12px solid transparent' }} />

                         <Typography variant="body2" sx={{ color: '#111b21', fontSize: '0.95rem', lineHeight: 1.3 }}>
                           Hi! The Sangeet shuttles start leaving from <strong>Grand Hyatt Lobby</strong> at <strong>6:30 PM</strong>.
                         </Typography>
                         <Typography variant="body2" sx={{ mt: 1, color: '#111b21', fontSize: '0.95rem' }}>
                           Would you like to reserve a seat? 🚐
                         </Typography>
                         <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', mt: 0.5, color: '#667781', fontSize: '0.7rem', gap: 0.5 }}>
                           10:42 AM <Check sx={{ fontSize: '1rem', color: '#53bdeb' }} />
                         </Typography>
                       </Box>
                       
                       {/* Chat Bubble Guest */}
                       <Box sx={{ alignSelf: 'flex-start', bgcolor: 'white', p: 1.5, borderRadius: '0px 12px 12px 12px', maxWidth: '85%', boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)', position: 'relative' }}>
                          {/* Triangle */}
                          <Box sx={{ position: 'absolute', top: 0, left: -8, width: 0, height: 0, borderTop: '12px solid white', borderLeft: '12px solid transparent' }} />

                         <Typography variant="body2" sx={{ color: '#111b21', fontSize: '0.95rem' }}>
                           Yes please, for 2 people.
                         </Typography>
                         <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: '#667781', textAlign: 'right', fontSize: '0.7rem' }}>
                           10:43 AM
                         </Typography>
                       </Box>

                       {/* Chat Bubble Bot */}
                       <Box sx={{ alignSelf: 'flex-end', bgcolor: '#E7FFDB', p: 1.5, borderRadius: '12px 0px 12px 12px', maxWidth: '85%', boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)', position: 'relative' }}>
                          {/* Triangle */}
                          <Box sx={{ position: 'absolute', top: 0, right: -8, width: 0, height: 0, borderTop: '12px solid #E7FFDB', borderRight: '12px solid transparent' }} />

                        <Typography variant="body2" sx={{ color: '#111b21', fontSize: '0.95rem' }}>
                           Done! ✅ I've reserved 2 seats for you on the 6:30 PM shuttle.
                         </Typography>
                         <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', mt: 0.5, color: '#667781', fontSize: '0.7rem', gap: 0.5 }}>
                           10:43 AM <Check sx={{ fontSize: '1rem', color: '#53bdeb' }} />
                         </Typography>
                       </Box>

                       {/* Chat Bubble Guest (Kill Time) */}
                       <Box sx={{ alignSelf: 'flex-start', bgcolor: 'white', p: 1.5, borderRadius: '0px 12px 12px 12px', maxWidth: '85%', boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)', position: 'relative' }}>
                          {/* Triangle */}
                          <Box sx={{ position: 'absolute', top: 0, left: -8, width: 0, height: 0, borderTop: '12px solid white', borderLeft: '12px solid transparent' }} />

                         <Typography variant="body2" sx={{ color: '#111b21', fontSize: '0.95rem' }}>
                           We have some free time before the reception. Any recommendations nearby?
                         </Typography>
                         <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: '#667781', textAlign: 'right', fontSize: '0.7rem' }}>
                           11:15 AM
                         </Typography>
                       </Box>

                       {/* Chat Bubble Bot (Recommendation) */}
                       <Box sx={{ alignSelf: 'flex-end', bgcolor: '#E7FFDB', p: 1.5, borderRadius: '12px 0px 12px 12px', maxWidth: '85%', boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)', position: 'relative' }}>
                          {/* Triangle */}
                          <Box sx={{ position: 'absolute', top: 0, right: -8, width: 0, height: 0, borderTop: '12px solid #E7FFDB', borderRight: '12px solid transparent' }} />

                        <Typography variant="body2" sx={{ color: '#111b21', fontSize: '0.95rem' }}>
                           Absolutely! 🌴 The <strong>Oasis Spa</strong> is just a 5-min walk, or grab a coffee at <strong>Blue Tokai</strong>.
                         </Typography>
                         <Typography variant="body2" sx={{ mt: 1, color: '#111b21', fontSize: '0.95rem' }}>
                           Check out the full guide here:
                         </Typography>
                         {/* Link Preview Mockup */}
                         <Box sx={{ mt: 1, bgcolor: '#CFE9BA', p: 1, borderRadius: '8px', borderLeft: '4px solid #53bdeb' }}>
                           <Typography variant="caption" sx={{ color: '#007AFF', fontWeight: 600 }}>maps.google.com</Typography>
                           <Typography variant="body2" sx={{ fontSize: '0.85rem', color: '#111b21' }}>Udaipur Local Guide • Best Cafes & Spas</Typography>
                         </Box>
                         <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', mt: 0.5, color: '#667781', fontSize: '0.7rem', gap: 0.5 }}>
                           11:15 AM <Check sx={{ fontSize: '1rem', color: '#53bdeb' }} />
                         </Typography>
                       </Box>
                     </Stack>
                  </Paper>
                </motion.div>
              </Grid>
            </Grid>
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
                'Enable Power Features',
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
                        'Customize your design, add events, and setup details in 10 minutes.'}
                      {idx === 1 &&
                        'Enable advanced features like WhatsApp Concierge and Travel Coordination.'}
                      {idx === 2 &&
                        'Share your beautiful website. Guests RSVP and get details instantly.'}
                      {idx === 3 &&
                        'Track RSVPs, coordinate logistics, and broadcast updates to everyone.'}
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
                Simple, Transparent Pricing
              </Typography>
              <Typography variant="h6" sx={{ color: '#4a4a4a' }}>
                Start free, upgrade for power features. No hidden fees.
              </Typography>
            </Stack>

            <Grid container spacing={4} sx={{ alignItems: 'flex-start', justifyContent: 'center' }}>
              {pricingTiers.map((tier, idx) => (
                <Grid size={{ xs: 12, md: 5 }} key={idx}>
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
                      component={Link}
                      href="/admin"
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
