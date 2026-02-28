'use client';

import {
  Box,
  Typography,
  Button,
  Stack,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
  LocationOnOutlined,
  CalendarTodayOutlined,
  AccessTime,
  ExpandMore,
  KeyboardArrowDown,
  ViewSidebar,
  Close,
} from '@mui/icons-material';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { weddingService, WeddingEvent, CarouselSlide } from '@/lib/supabase/wedding-service';
import { getTransportationSettings } from '@/lib/supabase/transportation-service';
import GuestList from '@/components/guest/GuestList';
import StreamlineIcon, { StreamlineIconName } from '@/components/ui/StreamlineIcon';
import EventDetailCarousel from './EventDetailCarousel';
import { getFrameConfig } from '@/lib/constants/images';

// Types
interface WeddingData {
  id: string;
  couple_name: string;
  wedding_date: string;
  wedding_date_display: string;
  venue_name: string;
  venue_location?: string;
  show_venue_location?: boolean | null;
  venue_flag: string;
  rsvp_deadline: string;
  welcome_text?: string;
  primary_color?: string;
  couple_images?: string[];
  frame_image_url?: string | null;
}

interface InfiniteScrollLayoutProps {
  wedding: WeddingData;
  weddingSlug: string;
  isBypassPin: boolean;
  hasRSVPed: boolean;
  rsvpResponse?: string;
  user: any;
  CountdownTimer: React.ComponentType<{ targetDate: string }>;
  headerRef?: React.RefObject<HTMLDivElement>;
  initialSection?: string;
}

interface ScheduleItem {
  id: string;
  name: string;
  time?: string | null;
  icon?: string | null;
  description?: string | null;
  location?: string | null;
  gradient_background?: string | null;
  is_major_event?: boolean | null;
  linked_event_id?: string | null;
}

interface ScheduleDay {
  id: string;
  date: string;
  day_name: string;
  events: ScheduleItem[];
}

interface TravelCard {
  id: string;
  title: string;
  content: any;
  image_url: string;
  button_text?: string | null;
  button_action?: string | null;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

interface RegistryItem {
  id: string;
  fund_name: string;
  emoji: string;
  external_url: string | null;
}

interface ShopItem {
  id: string;
  name: string;
  details?: string | null;
  url?: string | null;
  image_url?: string | null;
}

// Scroll-based Couple Image Carousel - changes image based on current section
const ScrollBasedCarousel = ({
  images = [],
  currentSectionIndex = 0,
  size = 500,
}: {
  images?: string[];
  currentSectionIndex: number;
  size?: number;
}) => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayIndex, setDisplayIndex] = useState(0);
  const previousSection = useRef(0);

  const carouselImages = images.length > 0 ? images : [
    '/images/couple/couple-1.jpg',
    '/images/couple/couple-2.jpg',
    '/images/couple/couple-3.jpeg',
    '/images/couple/couple-4.jpg',
    '/images/couple/couple-5.jpg',
    '/images/couple/couple-7.jpeg',
    '/images/couple/couple-8.jpg',
    '/images/couple/couple-9.jpeg'
  ];

  useEffect(() => {
    if (currentSectionIndex !== previousSection.current) {
      setIsTransitioning(true);

      setTimeout(() => {
        const imageIndex = currentSectionIndex % carouselImages.length;
        setDisplayIndex(imageIndex);
        setIsTransitioning(false);
      }, 300);

      previousSection.current = currentSectionIndex;
    }
  }, [currentSectionIndex, carouselImages.length]);

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Image
        src={carouselImages[displayIndex]}
        alt="Couple Photo"
        fill
        priority={displayIndex === 0}
        sizes="(max-width: 768px) 320px, 400px"
        style={{
          objectFit: 'cover',
          objectPosition: 'center',
          transition: 'filter 0.6s ease-in-out',
          filter: isTransitioning ? 'blur(5px)' : 'blur(0px)',
        }}
      />
    </Box>
  );
};

// Compact Guest List - shows limited height with expand option
const CompactGuestList = ({ weddingId, weddingSlug }: { weddingId: string; weddingSlug?: string }) => {
  return (
    <Box sx={{ width: '100%' }}>
      <GuestList weddingId={weddingId} weddingSlug={weddingSlug} compact initialTab={1} />
    </Box>
  );
};

export default function InfiniteScrollLayout({
  wedding,
  weddingSlug,
  isBypassPin,
  hasRSVPed,
  rsvpResponse,
  user,
  CountdownTimer,
  headerRef,
  initialSection,
}: InfiniteScrollLayoutProps) {
  const [currentSection, setCurrentSection] = useState(0);
  const [guestListExpanded, setGuestListExpanded] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const lastScrollY = useRef(0);

  // Section data states
  const [schedule, setSchedule] = useState<ScheduleDay[]>([]);
  const [travelCards, setTravelCards] = useState<TravelCard[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [registry, setRegistry] = useState<RegistryItem[]>([]);
  const [shops, setShops] = useState<ShopItem[]>([]);
  const [weddingEvents, setWeddingEvents] = useState<WeddingEvent[]>([]);

  // Event detail carousel state
  const [selectedEvent, setSelectedEvent] = useState<WeddingEvent | null>(null);
  const [showEventCarousel, setShowEventCarousel] = useState(false);

  const [hasSchedule, setHasSchedule] = useState(false);
  const [hasTravel, setHasTravel] = useState(false);
  const [hasFAQs, setHasFAQs] = useState(false);
  const [hasRegistry, setHasRegistry] = useState(false);
  const [hasShops, setHasShops] = useState(false);
  const [hasTransportation, setHasTransportation] = useState(false);

  // Section refs for scroll tracking
  const homeRef = useRef<HTMLDivElement>(null);
  const scheduleRef = useRef<HTMLDivElement>(null);
  const travelRef = useRef<HTMLDivElement>(null);
  const faqRef = useRef<HTMLDivElement>(null);
  const registryRef = useRef<HTMLDivElement>(null);
  const shopRef = useRef<HTMLDivElement>(null);

  const primaryColor = '#DE3F5E'; // Force primary pink as requested

  // Fetch section data
  useEffect(() => {
    const fetchSectionData = async () => {
      if (!wedding.id) return;

      try {
        const [scheduleData, travelData, faqData, registryData, shopData, eventsData] = await Promise.all([
          weddingService.getWeddingSchedule(wedding.id),
          weddingService.getTravelCards(wedding.id),
          weddingService.getFAQs(wedding.id),
          weddingService.getRegistry(wedding.id),
          weddingService.getShops(wedding.id),
          weddingService.getWeddingEvents(wedding.id),
        ]);

        if (eventsData && eventsData.length > 0) {
          setWeddingEvents(eventsData);
        }

        if (scheduleData && scheduleData.length > 0) {
          const mappedSchedule: ScheduleDay[] = scheduleData.map(day => ({
            id: day.id,
            date: day.date,
            day_name: day.day_name,
            events: day.events.map(event => ({
              id: event.id,
              name: event.name,
              time: event.time,
              icon: event.icon,
              description: event.description,
              location: event.location,
              gradient_background: event.gradient_background,
              is_major_event: event.is_major_event,
              linked_event_id: (event as any).linked_event_id,
            })),
          }));
          setSchedule(mappedSchedule);
          setHasSchedule(true);
        }

        if (travelData && travelData.length > 0) {
          setTravelCards(travelData as TravelCard[]);
          setHasTravel(true);
        }

        if (faqData && faqData.length > 0) {
          setFaqs(faqData as FAQ[]);
          setHasFAQs(true);
        }

        if (registryData && registryData.length > 0) {
          setRegistry(registryData as RegistryItem[]);
          setHasRegistry(true);
        }

        if (shopData && shopData.length > 0) {
          setShops(shopData as ShopItem[]);
          setHasShops(true);
        }

        // Check if transportation is configured
        const transportationSettings = await getTransportationSettings(wedding.id);
        if (transportationSettings && transportationSettings.setup_complete) {
          setHasTransportation(true);
        }
      } catch (error) {
        console.error('Error fetching section data:', error);
      }
    };

    fetchSectionData();
  }, [wedding.id]);

  // Helper function to calculate current section based on scroll position
  const calculateCurrentSection = () => {
    const scrollPosition = window.scrollY + window.innerHeight / 3;

    const sections = [
      { ref: homeRef, index: 0 },
      { ref: scheduleRef, index: 1 },
      { ref: travelRef, index: 2 },
      { ref: faqRef, index: 3 },
      { ref: registryRef, index: 4 },
      { ref: shopRef, index: 5 },
    ].filter(s => s.ref.current);

    let sectionIndex = 0;
    for (let i = sections.length - 1; i >= 0; i--) {
      const section = sections[i];
      if (section.ref.current) {
        const rect = section.ref.current.getBoundingClientRect();
        const sectionTop = rect.top + window.scrollY;

        if (scrollPosition >= sectionTop) {
          sectionIndex = section.index;
          break;
        }
      }
    }
    return sectionIndex;
  };

  // Scroll tracking for image rotation with debouncing + header visibility
  useEffect(() => {
    let debounceTimer: NodeJS.Timeout | null = null;
    let pendingSection: number | null = null;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const newSectionIndex = calculateCurrentSection();

      // Header visibility control
      if (headerRef?.current) {
        if (currentScrollY < 50) {
          headerRef.current.style.transform = 'translateY(0)';
        } else if (currentScrollY > lastScrollY.current) {
          // Scrolling down - hide header
          headerRef.current.style.transform = 'translateY(-96px)';
        } else if (currentScrollY < lastScrollY.current) {
          // Scrolling up - show header
          headerRef.current.style.transform = 'translateY(0)';
        }
      }
      lastScrollY.current = currentScrollY;

      // Close carousel when scrolling away from schedule section
      // AND immediately set the correct image (no debounce) so frame appears with right image
      if (showEventCarousel && newSectionIndex !== 1) {
        // Set the correct section image FIRST, before hiding carousel
        setCurrentSection(newSectionIndex);
        // Then hide the carousel - frame will show with correct image already set
        setShowEventCarousel(false);
        setSelectedEvent(null);
        // Clear any pending debounce since we just set the section
        if (debounceTimer) {
          clearTimeout(debounceTimer);
        }
        pendingSection = newSectionIndex;
        return;
      }

      // Debounce the image change - only update after user settles for 150ms
      // This only applies when carousel is NOT showing
      if (newSectionIndex !== pendingSection) {
        pendingSection = newSectionIndex;

        if (debounceTimer) {
          clearTimeout(debounceTimer);
        }

        debounceTimer = setTimeout(() => {
          setCurrentSection(newSectionIndex);
        }, 150);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [hasSchedule, hasTravel, hasFAQs, hasRegistry, hasShops, showEventCarousel, headerRef]);

  const coupleData = {
    names: wedding.couple_name,
    date: wedding.wedding_date_display,
    weddingDate: wedding.wedding_date,
    venue: wedding.venue_name,
    venueLocation: wedding.venue_location || '',
    showVenueLocation: wedding.show_venue_location !== false,
    flag: wedding.venue_flag,
    rsvpDeadline: wedding.rsvp_deadline,
    coupleImages: wedding.couple_images || [],
  };

  // Helper to find linked event for a schedule item
  // First tries by ID, then falls back to fuzzy matching by name/slug
  const findLinkedEvent = (linkedEventId: string | null | undefined, eventName?: string): WeddingEvent | null => {
    // Try by ID first
    if (linkedEventId) {
      const byId = weddingEvents.find(e => e.id === linkedEventId);
      if (byId) return byId;
    }
    // Fallback: try to match by name with fuzzy matching
    if (eventName) {
      const normalizedName = eventName.toLowerCase().trim();

      // Exact match first
      const exactMatch = weddingEvents.find(e =>
        e.name.toLowerCase().trim() === normalizedName ||
        e.slug?.toLowerCase() === normalizedName.replace(/\s+/g, '-')
      );
      if (exactMatch) return exactMatch;

      // Partial/fuzzy match - check if schedule item name contains event name or vice versa
      // e.g., "Haldi & Welcome Lunch" should match "Haldi"
      const partialMatch = weddingEvents.find(e => {
        const eventNameLower = e.name.toLowerCase().trim();
        const eventSlug = e.slug?.toLowerCase() || '';

        // Check if either name contains the other
        return normalizedName.includes(eventNameLower) ||
          eventNameLower.includes(normalizedName) ||
          normalizedName.includes(eventSlug) ||
          eventSlug.includes(normalizedName.replace(/\s+/g, '-'));
      });
      if (partialMatch) return partialMatch;
    }
    return null;
  };

  // Handle Learn More click
  const handleLearnMoreClick = (event: ScheduleItem) => {
    const linkedEvent = findLinkedEvent(event.linked_event_id, event.name);
    if (linkedEvent && linkedEvent.carousel_slides && linkedEvent.carousel_slides.length > 0) {
      setSelectedEvent(linkedEvent);
      setShowEventCarousel(true);
    }
  };

  // Close event carousel
  const handleCloseEventCarousel = () => {
    setShowEventCarousel(false);
    setSelectedEvent(null);
  };

  // Scroll to a section ref and close nav
  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    setNavOpen(false);
    setTimeout(() => {
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
  };

  // Section ref map for navigation
  const sectionRefMap: Record<string, React.RefObject<HTMLDivElement>> = {
    schedule: scheduleRef as React.RefObject<HTMLDivElement>,
    travel: travelRef as React.RefObject<HTMLDivElement>,
    faq: faqRef as React.RefObject<HTMLDivElement>,
    registry: registryRef as React.RefObject<HTMLDivElement>,
    shopping: shopRef as React.RefObject<HTMLDivElement>,
  };

  // Scroll to initial section after content loads
  useEffect(() => {
    if (!initialSection) return;
    const ref = sectionRefMap[initialSection];
    if (!ref) return;
    const timer = setTimeout(() => {
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 200);
    return () => clearTimeout(timer);
  }, [initialSection, schedule, travelCards, faqs, registry, shops]);

  // Listen for postMessage navigation from admin panel
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'NAVIGATE_TO_SECTION') {
        const ref = sectionRefMap[event.data.section];
        if (ref?.current) {
          ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Helper to render travel card content
  const renderTravelContent = (content: any) => {
    if (Array.isArray(content)) {
      return content.map((item, idx) => (
        <Typography
          key={idx}
          variant="body1"
          sx={{
            color: '#474747',
            fontSize: { md: '0.85rem', lg: '0.9rem', xl: '0.95rem' },
            lineHeight: 1.7,
            mb: idx < content.length - 1 ? 1.5 : 0,
          }}
        >
          {typeof item === 'string' ? item : (item?.p ?? JSON.stringify(item))}
        </Typography>
      ));
    }
    if (typeof content === 'string') {
      return (
        <Typography
          variant="body1"
          sx={{
            color: '#474747',
            fontSize: { md: '0.85rem', lg: '0.9rem', xl: '0.95rem' },
            lineHeight: 1.7,
          }}
        >
          {content}
        </Typography>
      );
    }
    return null;
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        width: '100%',
        position: 'relative',
      }}
    >
      {/* Main Content Area */}
      <Box
        sx={{
          display: 'flex',
          flex: 1,
          width: '100%',
          position: 'relative',
          minHeight: '100vh',
        }}
      >
        {/* Left Side - Scrollable Content */}
        <Box
          sx={{
            flex: '0 0 60%',
            maxWidth: '60%',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            position: 'relative',
            zIndex: 1,
            pl: { md: 22, lg: 26, xl: 30 },
            pr: { md: 3, lg: 4, xl: 5 },
            pt: {
              md: 'calc(50vh - 152px)',
              lg: 'calc(50vh - 176px)',
              xl: 'calc(50vh - 208px)'
            },
            pb: { md: 15, lg: 15, xl: 15 },
          }}
        >
          {/* Home Section */}
          <motion.div
            ref={homeRef}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            style={{ width: '100%' }}
          >
            <Stack spacing={3} alignItems="flex-start" textAlign="left" sx={{ width: '100%', maxWidth: { md: 480, lg: 540, xl: 650 } }}>
              {/* Names */}
              <Typography
                variant="h2"
                sx={{
                  fontSize: { md: '2.8rem', lg: '3.2rem', xl: '3.8rem' },
                  color: '#000',
                  lineHeight: 1.2,
                  fontFamily: 'var(--font-instrument-serif)',
                  fontStyle: 'italic',
                }}
              >
                {coupleData.names}
              </Typography>

              {/* Date and Action Icons */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#000',
                    fontSize: { md: '0.88rem', lg: '1rem', xl: '1.12rem' },
                    fontWeight: 600,
                  }}
                >
                  {coupleData.date}
                </Typography>
                <Stack direction="row" spacing={1.5}>
                  <IconButton
                    sx={{
                      backgroundColor: 'rgba(0, 0, 0, 0.15)',
                      border: '1px solid rgba(0, 0, 0, 0.25)',
                      width: { md: 32, lg: 35, xl: 38 },
                      height: { md: 32, lg: 35, xl: 38 },
                      color: '#000',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.25)',
                        borderColor: 'rgba(0, 0, 0, 0.35)',
                      },
                    }}
                    onClick={() => {
                      const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(coupleData.names)}&location=${encodeURIComponent(coupleData.venue)}&dates=${coupleData.weddingDate.replace(/-/g, '')}/${coupleData.weddingDate.replace(/-/g, '')}`;
                      window.open(googleCalUrl, '_blank');
                    }}
                  >
                    <CalendarTodayOutlined sx={{ fontSize: { md: '0.88rem', lg: '1rem', xl: '1.12rem' }, color: '#000' }} />
                  </IconButton>
                  <IconButton
                    sx={{
                      backgroundColor: 'rgba(0, 0, 0, 0.15)',
                      border: '1px solid rgba(0, 0, 0, 0.25)',
                      width: { md: 32, lg: 35, xl: 38 },
                      height: { md: 32, lg: 35, xl: 38 },
                      color: '#000',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.25)',
                        borderColor: 'rgba(0, 0, 0, 0.35)',
                      },
                    }}
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: coupleData.names,
                          text: `Join us for our wedding on ${coupleData.date}!`,
                          url: window.location.href,
                        });
                      }
                    }}
                  >
                    <Box
                      component="svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      sx={{
                        width: { md: '0.88rem', lg: '1rem', xl: '1.12rem' },
                        height: { md: '0.88rem', lg: '1rem', xl: '1.12rem' },
                        color: '#000',
                      }}
                    >
                      <path d="M12 2L12 16M12 2L8 6M12 2L16 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M20 14V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </Box>
                  </IconButton>
                </Stack>
              </Box>

              {/* Location */}
              <Box
                onClick={() => {
                  if ((user && hasRSVPed) || isBypassPin) {
                    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(coupleData.venue)}`;
                    window.open(mapsUrl, '_blank');
                  }
                }}
                sx={{
                  cursor: ((user && hasRSVPed) || isBypassPin) ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  '&:hover': ((user && hasRSVPed) || isBypassPin) ? { opacity: 0.8 } : {},
                }}
              >
                <LocationOnOutlined sx={{ color: '#666', fontSize: { md: '0.88rem', lg: '1rem', xl: '1.12rem' } }} />
                {((user && hasRSVPed) || isBypassPin) ? (
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#000',
                        fontSize: { md: '0.8rem', lg: '0.88rem', xl: '1rem' },
                        textDecoration: 'underline',
                      }}
                    >
                      {coupleData.venue}{coupleData.showVenueLocation && coupleData.venueLocation ? `, ${coupleData.venueLocation}` : ''}
                    </Typography>
                    <Typography sx={{ fontSize: { md: '0.88rem', lg: '1rem', xl: '1.12rem' } }}>
                      {coupleData.flag}
                    </Typography>
                  </Stack>
                ) : (
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#000',
                      fontSize: { md: '0.8rem', lg: '0.88rem', xl: '1rem' },
                    }}
                  >
                    <strong>RSVP</strong> to see location
                  </Typography>
                )}
              </Box>

              {/* Welcome Text */}
              <Typography
                variant="body1"
                sx={{
                  color: '#333',
                  fontSize: { md: '0.8rem', lg: '0.88rem', xl: '1rem' },
                  lineHeight: 1.6,
                  maxWidth: { md: 480, lg: 540, xl: 650 },
                }}
              >
                {wedding.welcome_text}
              </Typography>

              {/* Countdown Timer */}
              <Box sx={{ mt: 1, width: '100%', maxWidth: { md: 480, lg: 540, xl: 650 } }}>
                <CountdownTimer targetDate={coupleData.weddingDate} />
              </Box>

              {/* RSVP Button */}
              {!isBypassPin && (!user || !hasRSVPed) && (
                <Box sx={{ mt: 0, width: '100%', maxWidth: { md: 480, lg: 540, xl: 650 } }}>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} style={{ width: '100%' }}>
                    <Button
                      component={Link}
                      href={`/${weddingSlug}/rsvp`}
                      variant="contained"
                      size="large"
                      fullWidth
                      sx={{
                        backgroundColor: primaryColor,
                        color: 'white',
                        py: 1.2,
                        fontSize: { md: '0.8rem', lg: '0.88rem' },
                        fontWeight: 600,
                        borderRadius: '32px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        boxShadow: '0 4px 16px rgba(222, 63, 94, 0.3)',
                        '&:hover': {
                          backgroundColor: '#C8365A',
                          boxShadow: '0 6px 20px rgba(222, 63, 94, 0.4)',
                        },
                      }}
                    >
                      RSVP
                    </Button>
                  </motion.div>
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#777',
                      fontSize: '0.85rem',
                      textAlign: 'center',
                      lineHeight: 1.4,
                      mt: 1.5,
                    }}
                  >
                    Let us know you&apos;re coming by {coupleData.rsvpDeadline}
                  </Typography>
                </Box>
              )}

              {/* Guest List - Compact version with expand */}
              {((user && hasRSVPed) || isBypassPin) && (
                <Box sx={{ mt: 2, width: '100%', maxWidth: { md: 480, lg: 540, xl: 650 } }}>
                  <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true, margin: '-100px' }}
                  >
                    <CompactGuestList weddingId={wedding.id} weddingSlug={weddingSlug} />
                  </motion.div>
                </Box>
              )}
            </Stack>
          </motion.div>

          {/* Additional Sections - Only show if RSVP'd */}
          {((user && hasRSVPed) || isBypassPin) && (
            <Box
              sx={{
                width: '100%',
                display: 'flex',
                justifyContent: 'flex-start',
                mt: 6,
                position: 'relative',
              }}
            >

              <Stack
                spacing={10}
                sx={{
                  width: '100%',
                  maxWidth: { md: 480, lg: 540, xl: 650 },
                  position: 'relative',
                  zIndex: 1,
                  pb: 15,
                }}
              >
                {/* Schedule Section */}
                {hasSchedule && (
                  <Box ref={scheduleRef} sx={{ scrollMarginTop: '48px' }}>
                    <motion.div
                      initial={{ opacity: 0, y: 40 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6 }}
                      viewport={{ once: true, margin: '-100px' }}
                    >
                      <Typography
                        variant="h3"
                        sx={{
                          color: '#000',
                          mb: 3,
                        }}
                      >
                        Schedule
                      </Typography>

                      <Stack spacing={5}>
                        {schedule.map((day) => (
                          <Box key={day.id}>
                            <Typography
                              variant="h4"
                              sx={{
                                color: '#000',
                                mb: 3,
                                fontSize: { md: '1rem', lg: '1.12rem' },
                                textAlign: 'left',
                              }}
                            >
                              {day.day_name}, {day.date}
                            </Typography>

                            <Box sx={{ position: 'relative', pl: 7 }}>
                              {/* Vertical Timeline Line */}
                              <Box
                                sx={{
                                  position: 'absolute',
                                  left: 7.5, // Center of the 15px icon/dot
                                  top: 10,
                                  bottom: 10,
                                  width: '1px',
                                  backgroundColor: '#E5E5E5',
                                  zIndex: 0,
                                }}
                              />

                              <Stack spacing={4}>
                                {day.events.map((event) => {
                                  const isMajor = event.is_major_event;
                                  const bgUrl = event.gradient_background ? `/images/backgrounds/${event.gradient_background}` : null;

                                  return (
                                    <Box key={event.id} sx={{ position: 'relative' }}>
                                      {/* Timeline Node */}
                                      <Box
                                        sx={{
                                          position: 'absolute',
                                          left: -53, // Adjust for 1px line + 8px dot
                                          top: isMajor ? 44 : 6,
                                          width: isMajor ? 12 : 8,
                                          height: isMajor ? 12 : 8,
                                          borderRadius: '50%',
                                          backgroundColor: isMajor ? '#111' : '#D1D1D1',
                                          zIndex: 2,
                                        }}
                                      />

                                      <Paper
                                        elevation={isMajor ? 4 : 0}
                                        sx={{
                                          flex: 1,
                                          p: isMajor ? 3 : 0,
                                          mb: isMajor ? 2 : 0,
                                          backgroundColor: isMajor ? 'rgba(255, 255, 255, 0.95)' : 'transparent',
                                          backgroundImage: bgUrl ? `linear-gradient(rgba(255, 255, 255, 0.65), rgba(255, 255, 255, 0.65)), url(${bgUrl})` : 'none',
                                          backgroundSize: 'cover',
                                          backgroundPosition: 'center',
                                          borderRadius: isMajor ? '16px' : 0,
                                          border: isMajor ? 'none' : 'none',
                                          position: 'relative',
                                          overflow: 'hidden',
                                          boxShadow: isMajor ? '0 8px 30px rgba(0,0,0,0.08)' : 'none',
                                          transition: 'transform 0.3s ease',
                                          '&:hover': isMajor ? { transform: 'scale(1.01)' } : {},
                                        }}
                                      >
                                        <Box sx={{ position: 'relative', zIndex: 1 }}>
                                          <Typography
                                            variant={isMajor ? "h5" : "body1"}
                                            sx={{
                                              fontWeight: isMajor ? 600 : 500,
                                              color: '#141414',
                                              fontSize: isMajor ? undefined : '0.95rem',
                                              mb: 0.5,
                                              lineHeight: 1.1,
                                            }}
                                          >
                                            {event.name}
                                          </Typography>

                                          {event.time && (
                                            <Typography
                                              variant="body2"
                                              sx={{
                                                color: isMajor ? '#000' : '#888',
                                                fontFamily: 'Outfit',
                                                fontSize: isMajor ? '1rem' : '0.85rem',
                                                fontWeight: isMajor ? 600 : 400,
                                                mb: 0.5,
                                                letterSpacing: isMajor ? '0.5px' : 'normal',
                                              }}
                                            >
                                              {event.time}
                                            </Typography>
                                          )}

                                          {isMajor && event.description && (
                                            <Typography
                                              variant="body1"
                                              sx={{
                                                color: '#333',
                                                lineHeight: 1.6,
                                                mt: 2,
                                                mb: 2,
                                                fontFamily: 'Outfit',
                                                maxWidth: '95%',
                                                fontSize: '0.95rem',
                                              }}
                                            >
                                              {event.description}
                                            </Typography>
                                          )}

                                          {/* Location and Learn More row */}
                                          {isMajor && (
                                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1.5 }}>
                                              {/* Location */}
                                              {event.location ? (
                                                <Stack direction="row" spacing={0.75} alignItems="center">
                                                  <LocationOnOutlined sx={{ fontSize: 18, color: '#111' }} />
                                                  <Typography
                                                    sx={{
                                                      color: '#111',
                                                      fontSize: '0.9rem',
                                                      fontFamily: 'Outfit',
                                                      fontWeight: 500,
                                                    }}
                                                  >
                                                    {event.location}
                                                  </Typography>
                                                </Stack>
                                              ) : (
                                                <Box />
                                              )}

                                              {/* Learn More Link */}
                                              {(() => {
                                                const linkedEvent = findLinkedEvent(event.linked_event_id, event.name);
                                                const hasSlides = linkedEvent && linkedEvent.carousel_slides && linkedEvent.carousel_slides.length > 0;
                                                if (!hasSlides) return null;
                                                return (
                                                  <Box
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      handleLearnMoreClick(event);
                                                    }}
                                                    sx={{
                                                      display: 'flex',
                                                      alignItems: 'center',
                                                      gap: 0.5,
                                                      cursor: 'pointer',
                                                      '&:hover': {
                                                        '& .learn-more-text': {
                                                          textDecoration: 'underline',
                                                        },
                                                      },
                                                    }}
                                                  >
                                                    <Typography
                                                      className="learn-more-text"
                                                      sx={{
                                                        color: primaryColor,
                                                        fontSize: '0.9rem',
                                                        fontFamily: 'Outfit',
                                                        fontWeight: 500,
                                                      }}
                                                    >
                                                      Learn More
                                                    </Typography>
                                                    <Typography
                                                      sx={{
                                                        color: primaryColor,
                                                        fontSize: '0.9rem',
                                                        fontFamily: 'Outfit',
                                                        fontWeight: 500,
                                                      }}
                                                    >
                                                      →
                                                    </Typography>
                                                  </Box>
                                                );
                                              })()}
                                            </Stack>
                                          )}
                                        </Box>
                                      </Paper>
                                    </Box>
                                  );
                                })}
                              </Stack>
                            </Box>
                          </Box>
                        ))}
                      </Stack>
                    </motion.div>
                  </Box>
                )}

                {/* Travel & Stay Section */}
                {hasTravel && (
                  <Box ref={travelRef} sx={{ scrollMarginTop: '48px' }}>
                    <motion.div
                      initial={{ opacity: 0, y: 40 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6 }}
                      viewport={{ once: true, margin: '-100px' }}
                    >
                      <Typography
                        variant="h3"
                        sx={{
                          color: '#000',
                          mb: 3,
                        }}
                      >
                        Travel & Stay
                      </Typography>

                      <Stack spacing={3}>
                        {travelCards.map((card) => (
                          <Paper
                            key={card.id}
                            elevation={0}
                            sx={{
                              backgroundColor: 'rgba(255, 255, 255, 0.8)',
                              borderRadius: 2, // 16px
                              overflow: 'hidden',
                              border: '1px solid rgba(0,0,0,0.08)',
                            }}
                          >
                            {card.image_url && (
                              <Box sx={{ position: 'relative', width: '100%', height: 280 }}>
                                <Image
                                  src={card.image_url}
                                  alt={card.title}
                                  fill
                                  priority
                                  style={{ objectFit: 'cover' }}
                                />
                              </Box>
                            )}
                            <Box sx={{ p: 3 }}>
                              <Typography
                                variant="h5"
                                sx={{
                                  fontFamily: 'Outfit',
                                  fontWeight: 600,
                                  color: '#141414',
                                  mb: 1.5,
                                  fontSize: { md: '0.88rem', lg: '1rem' },
                                }}
                              >
                                {card.title}
                              </Typography>
                              <Box sx={{ fontSize: '0.9rem', lineHeight: 1.6, color: '#333' }}>
                                {renderTravelContent(card.content)}
                              </Box>
                              {card.button_text && card.button_action && (
                                <Button
                                  onClick={() => window.open(card.button_action!, '_blank')}
                                  variant="contained"
                                  sx={{
                                    mt: 2,
                                    bgcolor: primaryColor,
                                    color: 'white',
                                    textTransform: 'none',
                                    borderRadius: '32px',
                                    px: 3,
                                    py: 0.75,
                                    fontWeight: 600,
                                    fontSize: '0.9rem',
                                    '&:hover': {
                                      bgcolor: primaryColor,
                                      opacity: 0.9,
                                    },
                                  }}
                                >
                                  {card.button_text}
                                </Button>
                              )}
                            </Box>
                          </Paper>
                        ))}
                      </Stack>
                    </motion.div>
                  </Box>
                )}

                {/* Q&A Section */}
                {hasFAQs && (
                  <Box ref={faqRef} sx={{ scrollMarginTop: '48px' }}>
                    <motion.div
                      initial={{ opacity: 0, y: 40 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6 }}
                      viewport={{ once: true, margin: '-100px' }}
                    >
                      <Typography
                        variant="h3"
                        sx={{
                          color: '#000',
                          mb: 3,
                        }}
                      >
                        Q & A
                      </Typography>

                      <Stack spacing={1.5}>
                        {faqs.map((faq) => (
                          <Accordion
                            key={faq.id}
                            elevation={0}
                            sx={{
                              backgroundColor: 'rgba(255, 255, 255, 0.8)',
                              borderRadius: '12px !important',
                              border: '1px solid rgba(0,0,0,0.08)',
                              '&:before': { display: 'none' },
                              '&.Mui-expanded': {
                                margin: 0,
                                borderColor: primaryColor,
                              },
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                borderColor: primaryColor,
                                backgroundColor: 'white',
                              }
                            }}
                          >
                            <AccordionSummary
                              expandIcon={<ExpandMore sx={{ color: primaryColor, fontSize: 20 }} />}
                              sx={{
                                px: 2.5,
                                py: 0.5,
                                '& .MuiAccordionSummary-content': { my: 1.5 },
                              }}
                            >
                              <Typography
                                sx={{
                                  fontFamily: 'Outfit',
                                  fontWeight: 600,
                                  color: '#141414',
                                  fontSize: { md: '0.95rem', lg: '1.05rem' },
                                }}
                              >
                                {faq.question}
                              </Typography>
                            </AccordionSummary>
                            <AccordionDetails sx={{ px: 2.5, pt: 0, pb: 3 }}>
                              <Typography
                                sx={{
                                  color: '#333',
                                  fontSize: '0.9rem',
                                  lineHeight: 1.7,
                                  fontFamily: 'Outfit',
                                }}
                              >
                                {faq.answer}
                              </Typography>
                            </AccordionDetails>
                          </Accordion>
                        ))}
                      </Stack>
                    </motion.div>
                  </Box>
                )}

                {/* Registry Section */}
                {hasRegistry && (
                  <Box ref={registryRef} sx={{ scrollMarginTop: '48px' }}>
                    <motion.div
                      initial={{ opacity: 0, y: 40 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6 }}
                      viewport={{ once: true, margin: '-100px' }}
                    >
                      <Typography
                        variant="h3"
                        sx={{
                          color: '#000',
                          mb: 3,
                        }}
                      >
                        Registry
                      </Typography>

                      <Typography
                        variant="body1"
                        sx={{
                          color: '#666',
                          fontSize: { md: '0.85rem', lg: '0.9rem' },
                          lineHeight: 1.7,
                          mb: 3,
                        }}
                      >
                        Your presence is enough of a present to us! But for those of you who are stubborn, we&apos;ve put together a wish-list to help you out.
                      </Typography>

                      <Stack spacing={1.5}>
                        {registry.map((item) => (
                          <Button
                            key={item.id}
                            onClick={() => item.external_url && window.open(item.external_url, '_blank')}
                            variant="contained"
                            fullWidth
                            sx={{
                              bgcolor: primaryColor,
                              color: 'white',
                              py: 1.5,
                              borderRadius: '32px',
                              fontSize: { md: '0.9rem', lg: '1rem' },
                              textTransform: 'none',
                              fontWeight: 600,
                              px: 3,
                              boxShadow: '0 4px 14px rgba(222, 63, 94, 0.25)',
                              '&:hover': {
                                bgcolor: primaryColor,
                                opacity: 0.9,
                                boxShadow: '0 6px 20px rgba(222, 63, 94, 0.35)',
                              },
                            }}
                          >
                            <span style={{ marginRight: 10, fontSize: '1.2rem' }}>{item.emoji}</span>
                            {item.fund_name}
                          </Button>
                        ))}
                      </Stack>
                    </motion.div>
                  </Box>
                )}

                {/* Where to Shop Section */}
                {hasShops && (
                  <Box ref={shopRef} sx={{ scrollMarginTop: '48px' }}>
                    <motion.div
                      initial={{ opacity: 0, y: 40 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6 }}
                      viewport={{ once: true, margin: '-100px' }}
                    >
                      <Typography
                        variant="h3"
                        sx={{
                          color: '#000',
                          mb: 3,
                        }}
                      >
                        Where to Shop
                      </Typography>

                      <Stack spacing={2}>
                        {shops.map((shop) => (
                          <Paper
                            key={shop.id}
                            elevation={0}
                            sx={{
                              p: 2,
                              backgroundColor: 'rgba(255, 255, 255, 0.8)',
                              borderRadius: 2,
                              border: '1px solid rgba(0,0,0,0.08)',
                              cursor: shop.url ? 'pointer' : 'default',
                              transition: 'all 0.3s ease',
                              '&:hover': shop.url ? {
                                backgroundColor: 'white',
                                borderColor: primaryColor,
                                boxShadow: '0 8px 24px rgba(0,0,0,0.05)',
                                transform: 'translateY(-2px)',
                              } : {},
                            }}
                            onClick={() => shop.url && window.open(shop.url, '_blank')}
                          >
                            <Box sx={{
                              display: 'flex',
                              flexDirection: { xs: 'column', sm: 'row' },
                              alignItems: { xs: 'flex-start', sm: 'center' },
                              justifyContent: 'space-between',
                              gap: 2
                            }}>
                              <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1 }}>
                                {shop.image_url && (
                                  <Box
                                    sx={{
                                      width: 70,
                                      height: 70,
                                      borderRadius: 1.5,
                                      overflow: 'hidden',
                                      position: 'relative',
                                      flexShrink: 0,
                                    }}
                                  >
                                    <Image
                                      src={shop.image_url}
                                      alt={shop.name}
                                      fill
                                      style={{ objectFit: 'cover' }}
                                    />
                                  </Box>
                                )}
                                <Box sx={{ flex: 1 }}>
                                  <Typography
                                    variant="h6"
                                    sx={{
                                      fontFamily: 'Outfit',
                                      fontWeight: 600,
                                      color: '#141414',
                                      fontSize: { md: '0.95rem', lg: '1.05rem' },
                                      mb: 0.25,
                                    }}
                                  >
                                    {shop.name}
                                  </Typography>
                                  {shop.details && (
                                    <Typography
                                      sx={{
                                        color: '#444',
                                        fontSize: '0.85rem',
                                        lineHeight: 1.5,
                                        fontFamily: 'Outfit',
                                      }}
                                    >
                                      {shop.details}
                                    </Typography>
                                  )}
                                </Box>
                              </Stack>
                              {shop.url && (
                                <Button
                                  variant="outlined"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(shop.url!, '_blank');
                                  }}
                                  sx={{
                                    borderColor: primaryColor,
                                    color: primaryColor,
                                    borderRadius: '32px',
                                    textTransform: 'none',
                                    px: 3,
                                    py: 0.75,
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    flexShrink: 0,
                                    alignSelf: { xs: 'stretch', sm: 'center' },
                                    '&:hover': {
                                      borderColor: primaryColor,
                                      bgcolor: 'rgba(222, 63, 94, 0.05)',
                                    }
                                  }}
                                >
                                  Visit Store
                                </Button>
                              )}
                            </Box>
                          </Paper>
                        ))}
                      </Stack>
                    </motion.div>
                  </Box>
                )}

                {/* Bottom Actions */}
                <Stack direction="row" spacing={2} sx={{ pt: 3 }}>
                  <Button
                    component={Link}
                    href={`/${weddingSlug}/rsvp`}
                    variant="outlined"
                    sx={{
                      color: primaryColor,
                      borderColor: primaryColor,
                      fontSize: '0.85rem',
                      textTransform: 'none',
                      borderRadius: '32px',
                      px: 3,
                      fontWeight: 600,
                      '&:hover': {
                        borderColor: primaryColor,
                        bgcolor: 'rgba(222, 63, 94, 0.05)',
                      },
                    }}
                  >
                    Change RSVP
                  </Button>
                  {hasTransportation && (
                    <Button
                      component={Link}
                      href={`/${weddingSlug}/transportation`}
                      variant="contained"
                      sx={{
                        bgcolor: primaryColor,
                        color: 'white',
                        fontSize: '0.85rem',
                        textTransform: 'none',
                        borderRadius: '32px',
                        px: 3,
                        fontWeight: 600,
                        '&:hover': {
                          bgcolor: '#C8365A',
                        },
                      }}
                    >
                      Reserve Transportation
                    </Button>
                  )}
                </Stack>
              </Stack>
            </Box>
          )}
        </Box>

        {/* Right Side - Fixed Couple Image OR Event Detail Carousel */}
        {showEventCarousel && selectedEvent ? (
          <EventDetailCarousel
            eventName={selectedEvent.name}
            slides={selectedEvent.carousel_slides}
            textColor={selectedEvent.text_color || '#FFFFFF'}
            gradientBackground={selectedEvent.gradient_background || null}
            onClose={handleCloseEventCarousel}
          />
        ) : (
          <Box
            sx={{
              position: 'fixed',
              right: 0,
              top: 0,
              width: '40%',
              height: '100vh',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              pl: { md: 2.4, lg: 3.2, xl: 4.8 },
              pr: { md: 2.4, lg: 3.2, xl: 4.8 },
              gap: 2,
              alignItems: 'center',
              pointerEvents: 'auto',
              zIndex: 0,
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  maxWidth: { md: 304, lg: 352, xl: 416 },
                  aspectRatio: '1',
                }}
              >
                {/* Couple Image */}
                <Box
                  sx={{
                    position: 'absolute',
                    ...getFrameConfig(wedding.frame_image_url),
                    overflow: 'hidden',
                    zIndex: 1,
                  }}
                >
                  <ScrollBasedCarousel
                    images={coupleData.coupleImages}
                    currentSectionIndex={currentSection}
                    size={500}
                  />
                </Box>

                {/* Frame Background */}
                <Image
                  src={wedding.frame_image_url || "/images/frames/frame-1.png"}
                  alt="Decorative frame"
                  fill
                  priority
                  sizes="(max-width: 1200px) 500px, (max-width: 1600px) 600px, 700px"
                  style={{
                    objectFit: 'contain',
                    objectPosition: 'center',
                    zIndex: 3,
                    pointerEvents: 'none',
                  }}
                />
              </Box>
            </motion.div>
          </Box>
        )}

      </Box>

      {/* Floating Menu Button */}
      <Box
        onClick={() => setNavOpen(true)}
        sx={{
          position: 'fixed',
          left: 24,
          bottom: 24,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 2.5,
          py: 1.75,
          borderRadius: '100px',
          backgroundColor: '#1a1a1a',
          color: 'white',
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
          userSelect: 'none',
          '&:hover': {
            backgroundColor: '#000',
            boxShadow: '0 6px 20px rgba(0,0,0,0.35)',
          },
        }}
      >
        <ViewSidebar sx={{ fontSize: 24, color: 'white' }} />
        <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: 'white', letterSpacing: '0.03em' }}>
          Menu
        </Typography>
      </Box>

      {/* Sidebar Overlay + Drawer */}
      <AnimatePresence>
        {navOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setNavOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0,0,0,0.3)',
                zIndex: 60,
              }}
            />

            {/* Sidebar Panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              style={{
                position: 'fixed',
                left: 0,
                top: 0,
                bottom: 0,
                width: 280,
                zIndex: 70,
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#FAF6F1',
                backgroundImage: 'url(/images/backgrounds/pearl.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {/* Close Button */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2 }}>
                <IconButton
                  onClick={() => setNavOpen(false)}
                  sx={{
                    color: '#1a1a1a',
                    '&:hover': { backgroundColor: 'rgba(0,0,0,0.06)' },
                  }}
                >
                  <Close />
                </IconButton>
              </Box>

              {/* Nav Items */}
              <Box
                sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 0,
                  pb: 4,
                }}
              >
                {/* Home is always shown */}
                <NavItem label="Home" onClick={() => scrollToSection(homeRef as React.RefObject<HTMLDivElement>)} />

                {hasSchedule && (
                  <>
                    <DiamondSeparator />
                    <NavItem label="Schedule" onClick={() => scrollToSection(scheduleRef as React.RefObject<HTMLDivElement>)} />
                  </>
                )}

                {hasTravel && (
                  <>
                    <DiamondSeparator />
                    <NavItem label="Travel & Stay" onClick={() => scrollToSection(travelRef as React.RefObject<HTMLDivElement>)} />
                  </>
                )}

                {hasFAQs && (
                  <>
                    <DiamondSeparator />
                    <NavItem label="Q & A" onClick={() => scrollToSection(faqRef as React.RefObject<HTMLDivElement>)} />
                  </>
                )}

                {hasRegistry && (
                  <>
                    <DiamondSeparator />
                    <NavItem label="Registry" onClick={() => scrollToSection(registryRef as React.RefObject<HTMLDivElement>)} />
                  </>
                )}

                {hasShops && (
                  <>
                    <DiamondSeparator />
                    <NavItem label="Where to Shop" onClick={() => scrollToSection(shopRef as React.RefObject<HTMLDivElement>)} />
                  </>
                )}

                {hasTransportation && (
                  <>
                    <DiamondSeparator />
                    <NavItem label="Transportation" onClick={() => {
                      setNavOpen(false);
                      window.location.href = `/${weddingSlug}/transportation`;
                    }} />
                  </>
                )}
              </Box>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </Box>
  );
}

// Sidebar nav item
const NavItem = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <motion.div
    whileHover={{ scale: 1.03 }}
    whileTap={{ scale: 0.97 }}
    onClick={onClick}
    style={{ cursor: 'pointer', width: '100%', textAlign: 'center' }}
  >
    <Box
      sx={{
        py: 1.5,
        px: 3,
        transition: 'background 0.2s',
        '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' },
      }}
    >
      <Typography
        sx={{
          fontFamily: 'Outfit',
          fontWeight: 400,
          fontSize: '0.95rem',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: '#141414',
          textAlign: 'center',
        }}
      >
        {label}
      </Typography>
    </Box>
  </motion.div>
);

// Diamond separator for sidebar
const DiamondSeparator = () => (
  <Box
    sx={{
      color: '#D1B99F',
      display: 'flex',
      justifyContent: 'center',
      my: 0.25,
    }}
  >
    <svg width="40" height="12" viewBox="0 0 40 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9.6025 7.22518C10.4176 6.62308 10.4176 5.37669 9.6025 4.77459L5.35693 1.66121C4.84471 1.28285 4.15445 1.28285 3.64223 1.66121L-0.60339 4.77459C-1.41848 5.37669 -1.41848 6.62308 -0.60339 7.22518L3.64223 10.3386C4.15445 10.717 4.84471 10.717 5.35693 10.3386L9.6025 7.22518Z"
        fill="currentColor"
        transform="translate(10, 0)"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9.6025 7.22518C10.4176 6.62308 10.4176 5.37669 9.6025 4.77459L5.35693 1.66121C4.84471 1.28285 4.15445 1.28285 3.64223 1.66121L-0.60339 4.77459C-1.41848 5.37669 -1.41848 6.62308 -0.60339 7.22518L3.64223 10.3386C4.15445 10.717 4.84471 10.717 5.35693 10.3386L9.6025 7.22518Z"
        fill="currentColor"
        transform="translate(25, 0)"
      />
    </svg>
  </Box>
);
