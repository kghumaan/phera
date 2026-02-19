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
import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, useScroll, useTransform, useMotionValueEvent } from 'framer-motion';
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
} from '@mui/icons-material';
import AppHeader from '@/components/shared/AppHeader';
import OptimizedBackground from '@/components/ui/OptimizedBackground';
import StreamlineIcon from '@/components/ui/StreamlineIcon';
import LoginModal from '@/components/auth/LoginModal';
import UpgradeModal from '@/components/admin/UpgradeModal';
import { useAuth } from '@/lib/contexts/AuthContext';
import WhatsAppConcierge from '@/components/ui/WhatsAppConcierge';

// --- Data & Content ---

// Combined features with problem + solution
const features = [
  {
    id: 'website-creation',
    title: 'Wedding Website',
    problem: 'Every wedding website template out there looks the same... and none of them get Indian weddings!',
    solution: 'Beautiful custom website built to feel like an Indian wedding.',
    imagePlaceholder: 'Demo: Beautiful wedding website preview on multiple devices',
    featureImage: '/images/feature_images/wedding_website.png',
    frameType: 'desktop' as const,
  },
  {
    id: 'rsvp-management',
    title: 'RSVP Collection',
    problem: 'Who\'s vegetarian? Is this uncle bringing his whole family? Did anyone actually reply to that WhatsApp message??',
    solution: 'Simplified RSVP process to collect all the details, viewable in one dashboard.',
    imagePlaceholder: 'Demo: RSVP dashboard showing responses with dietary info',
    featureImage: '/images/feature_images/rsvp_collection.png',
    frameType: 'desktop' as const,
  },
  {
    id: 'multi-event',
    title: 'Multi-Event Support',
    problem: 'Haldi on Thursday, Ceremony on Friday, Sangeet on Saturday... and my international guests are clueless...',
    solution: 'Display multi-day events with explanations for rituals, traditions, and dress codes—especially for international guests.',
    imagePlaceholder: 'Demo: Event pages for Sangeet, Mehendi, and Reception',
    featureImage: '/images/feature_images/multi_event.png',
    frameType: 'desktop' as const,
  },
  {
    id: 'guest-access',
    title: 'Guest Access Control',
    problem: 'This auntie isn\'t invited to my cocktail party…',
    solution: 'Create different PINs so guests only see the events they\'re invited to. Even control who gets a plus one!',
    imagePlaceholder: 'Demo: PIN-based access control for different guest groups',
    featureImage: '/images/feature_images/guest_access.png',
    frameType: 'mobile' as const,
  },
  {
    id: 'travel-coordination',
    title: 'Travel Coordination',
    problem: 'When\'s this friend arriving? When\'s the vendor landing? How many shuttles do I book??',
    solution: 'View everyone\'s arrival times and let guests sign up for shuttles — all in one place.',
    imagePlaceholder: 'Demo: Travel dashboard with flight arrivals and shuttle schedule',
    featureImage: '/images/feature_images/travel_coordination.png',
    frameType: 'desktop' as const,
    isPro: true,
  },
  {
    id: 'guest-communication',
    title: 'Guest Communication',
    problem: 'I have 30 unread messages from guests about this or that… I don\'t have time for this!',
    solution: '24/7 WhatsApp Agent that knows all your wedding details, ready to answer questions and even recommend what to do in the city!',
    imagePlaceholder: 'Demo: WhatsApp conversation with AI concierge helping guest',
    frameType: 'mobile' as const,
    customComponent: <WhatsAppConcierge />,
    isPro: true,
  },
  {
    id: 'task-management',
    title: 'Task Management',
    problem: 'I need to talk to the decorator, send the DJ my song list, buy welcome gifts… I can\'t keep track!',
    solution: 'Ramble to our voice agent anytime and we\'ll organize your to-do items so you don\'t forget anything.',
    imagePlaceholder: 'Demo: Voice recording being converted to organized task list',
    featureImage: '/images/feature_images/task_management.png',
    frameType: 'desktop' as const,
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
    price: '$199',
    description: 'Advanced features for destination weddings',
    features: [
      'Everything in Basic, plus:',
      'Build website with AI',
      'Voice-to-task manager',
      'WhatsApp Concierge Agent',
      'Travel & shuttle coordination',
      'Registry integration',
      'Premium themes & backgrounds',
      'Priority support',
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


// --- Features Scroll Section Component ---

interface FeatureItem {
  id: string;
  title: string;
  problem: string;
  solution: string;
  imagePlaceholder: string;
  featureImage?: string;
  customComponent?: React.ReactNode;
  frameType?: 'desktop' | 'mobile' | 'none';
  isPro?: boolean;
}

const FeaturesSection = ({ items }: { items: FeatureItem[] }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Use framer-motion for reliable scroll tracking
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Map the scroll progress (0-1) to the active index
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
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
                  fontSize: { md: '3rem', lg: '4rem' },
                  lineHeight: 1.1,
                  color: '#1a1a1a',
                  mb: 5,
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
                      sx={{
                        py: isActive ? 3 : 1.5,
                        borderBottom: idx < items.length - 1 ? '1px solid' : 'none',
                        borderColor: alpha('#000', 0.06),
                        transition: 'padding 0.3s ease',
                        opacity: isActive ? 1 : 0.35,
                      }}
                    >
                      {/* Title - Not bold, left aligned always */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Typography
                          sx={{
                            color: '#1a1a1a',
                            fontSize: isActive ? { md: '2rem', lg: '2.5rem' } : { md: '1.15rem', lg: '1.35rem' },
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
                              fontSize: { md: '1.5rem', lg: '1.5rem' },
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
                              fontSize: { md: '1.5rem', lg: '1.5rem' },
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
                      <Box sx={{ width: '100%', lineHeight: 0 }}>
                        <Box
                          component="img"
                          src={item.featureImage}
                          alt={item.title}
                          sx={{
                            width: '100%',
                            height: 'auto',
                            display: 'block',
                          }}
                        />
                      </Box>
                    </Box>
                  )}

                  {(item.featureImage || item.customComponent) && item.frameType === 'mobile' && (
                    /* Mobile Phone Frame — large, positioned toward right */
                    <Box
                      sx={{
                        width: { md: '480px', lg: '540px' },
                        aspectRatio: '9 / 17',
                        mx: 'auto',
                        borderRadius: '48px',
                        overflow: 'hidden',
                        boxShadow: '0 30px 80px rgba(0,0,0,0.22), 0 10px 30px rgba(0,0,0,0.12)',
                        bgcolor: '#1a1a1a',
                        border: '16px solid #1a1a1a',
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
                          width: '135px',
                          height: '30px',
                          bgcolor: '#1a1a1a',
                          borderBottomLeftRadius: '18px',
                          borderBottomRightRadius: '18px',
                          zIndex: 20,
                        }}
                      />
                      {/* Phone Screen */}
                      <Box
                        sx={{
                          borderRadius: '34px',
                          overflow: 'hidden',
                          lineHeight: 0,
                          height: '100%',
                        }}
                      >
                        {item.customComponent ? (
                          item.customComponent
                        ) : (
                          <Box
                            component="img"
                            src={item.featureImage}
                            alt={item.title}
                            sx={{
                              width: '100%',
                              height: '100%',
                              display: 'block',
                              objectFit: 'cover',
                              objectPosition: 'top',
                            }}
                          />
                        )}
                      </Box>
                    </Box>
                  )}

                  {!item.featureImage && !item.customComponent && (
                    /* Placeholder for features without images (Guest Communication) */
                    <Paper
                      elevation={0}
                      sx={{
                        width: '100%',
                        maxWidth: '600px',
                        height: '400px',
                        borderRadius: '24px',
                        bgcolor: alpha('#DE3F5E', 0.03),
                        border: '1px solid',
                        borderColor: alpha('#000', 0.06),
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        p: 5,
                      }}
                    >
                      <Box
                        sx={{
                          width: '100%',
                          height: '280px',
                          bgcolor: 'white',
                          borderRadius: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '2px dashed',
                          borderColor: alpha('#DE3F5E', 0.2),
                        }}
                      >
                        <Typography
                          sx={{
                            color: '#999',
                            textAlign: 'center',
                            px: 4,
                            fontStyle: 'italic',
                            fontSize: '1.1rem',
                          }}
                        >
                          {item.imagePlaceholder}
                        </Typography>
                      </Box>
                    </Paper>
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
                {item.featureImage && item.frameType === 'desktop' && (
                  <Box
                    sx={{
                      borderRadius: '10px 0 0 10px',
                      overflow: 'hidden',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                      bgcolor: 'white',
                      border: '1px solid',
                      borderColor: alpha('#000', 0.08),
                      mb: 3,
                      mr: -3, // Extend to right edge on mobile
                      width: 'calc(100% + 24px)',
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
                    <Box component="img" src={item.featureImage} alt={item.title} sx={{ width: '100%', height: 'auto', display: 'block' }} />
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
                          <Box
                            component="img"
                            src={item.featureImage}
                            alt={item.title}
                            sx={{ width: '100%', height: 'auto', display: 'block' }}
                          />
                        )}
                      </Box>
                    </Box>
                  </Box>
                )}
                {!item.featureImage && (
                  <Box
                    sx={{
                      width: '100%',
                      height: '180px',
                      bgcolor: alpha('#DE3F5E', 0.03),
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 3,
                      border: '2px dashed',
                      borderColor: alpha('#DE3F5E', 0.2),
                    }}
                  >
                    <Typography sx={{ color: '#999', textAlign: 'center', px: 2, fontStyle: 'italic', fontSize: '0.85rem' }}>
                      {item.imagePlaceholder}
                    </Typography>
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
    </>
  );
};

export default function LandingPage() {
  const { user } = useAuth();
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [pendingProAction, setPendingProAction] = useState(false);
  const [selectedPricingTier, setSelectedPricingTier] = useState(1); // Start with Pro tier
  const [roadmapIndex, setRoadmapIndex] = useState(0);

  const roadmapRef = useRef<HTMLDivElement>(null);

  const handleProAction = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (user) {
      setUpgradeModalOpen(true);
    } else {
      setPendingProAction(true);
      setLoginDialogOpen(true);
    }
  };

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
                    fontSize: { xs: '3.2rem', md: '4.5rem', lg: '6rem' },
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
                    fontSize: { xs: '1.35rem', md: '1.75rem' },
                    fontWeight: 600,
                    color: '#1a1a1a',
                    maxWidth: '800px',
                    lineHeight: 1.4,
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
                    href="/auth/signup"
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
                  {/* <Button
                    component={Link}
                    href="/simran-karanvir"

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
                  </Button> */}
                </Stack>
              </Stack>
            </motion.div>
          </Container>
        </Box>

        {/* --- FEATURES SECTION --- */}
        <Box id="features">
          <FeaturesSection items={features} />
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
                  <WhatsAppConcierge
                    sx={{
                      width: { xs: '100%', sm: '340px', md: '380px' },
                      height: { xs: '500px', md: '780px' },
                      maxWidth: { xs: '320px', md: '420px' },
                      mx: 'auto',
                      border: { xs: '8px solid #1a1a1a', md: '14px solid #1a1a1a' },
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
        <Box id="pricing" sx={{ bgcolor: '#F0F2F5', py: { xs: 3, md: 14 } }}>
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
                                fontSize: { xs: '0.9rem', md: '1.05rem' },
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
                        }
                      }}
                      component={tier.name === 'PRO' ? 'button' : Link}
                      href={tier.name === 'PRO' ? undefined : "/auth/signup"}
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
                  href="/auth/signup"
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
                    textTransform: 'none',
                    '&:hover': { bgcolor: '#C8365A' },
                  }}
                >
                  Get Started for Free
                </Button>
                {/* Demo button can be linked to Calendly or kept as is for now with clear label */}
              </Stack>
              <Stack
                direction="row"
                spacing={3}
                sx={{ justifyContent: 'center', mt: 4, flexWrap: 'wrap' }}
              >
                <Chip
                  icon={<StreamlineIcon name="check-circle" sx={{ color: '#DE3F5E !important', width: 24, height: 24 }} />}
                  label="No credit card required"
                  sx={{
                    bgcolor: 'transparent',
                    color: '#4a4a4a',
                    border: 'none',
                    fontWeight: 500,
                    fontSize: '1.1rem',
                  }}
                />
                <Chip
                  icon={<StreamlineIcon name="check-circle" sx={{ color: '#DE3F5E !important', width: 24, height: 24 }} />}
                  label="Free forever plan"
                  sx={{
                    bgcolor: 'transparent',
                    color: '#4a4a4a',
                    border: 'none',
                    fontWeight: 500,
                    fontSize: '1.1rem',
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
                  <Link href="#features" className="text-[#4a4a4a] hover:text-[#DE3F5E] transition-colors">
                    Features
                  </Link>
                  <Link href="#pricing" className="text-[#4a4a4a] hover:text-[#DE3F5E] transition-colors">
                    Pricing
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
                    href="mailto:kv@phera.io"
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

      <LoginModal
        open={loginDialogOpen}
        onClose={() => {
          setLoginDialogOpen(false);
          setPendingProAction(false);
        }}
        onSuccess={() => {
          console.log('Login successful');
          if (pendingProAction) {
            setUpgradeModalOpen(true);
            setPendingProAction(false);
          }
        }}
      />

      <UpgradeModal
        open={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
      />
    </OptimizedBackground >
  );
}
