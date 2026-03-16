'use client';

import {
  Box,
  Container,
  Typography,
  Stack,
  IconButton,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowBack, ChevronLeft, ChevronRight, LocationOnOutlined } from '@mui/icons-material';
import OptimizedBackground from '@/components/ui/OptimizedBackground';
import WhatsAppChannelModal from '@/components/shared/WhatsAppChannelModal';
import AppHeader from '@/components/shared/AppHeader';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useWedding } from '@/lib/contexts/WeddingContext';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { ScheduleItem, WeddingEvent } from '@/lib/supabase/wedding-service';
import { SlideContent, DiamondIndicators } from '@/components/guest/EventDetailCarousel';

// Parse a date string in either ISO (yyyy-MM-dd) or legacy ("Monday - December 14, 2026") format
function parseScheduleDate(dateStr: string): Date {
  try {
    let parsed = parseISO(dateStr);
    if (isNaN(parsed.getTime())) {
      const cleaned = dateStr.replace(/\s*-\s*/, ', ');
      parsed = new Date(cleaned);
    }
    if (!isNaN(parsed.getTime())) return parsed;
  } catch { /* fallback */ }
  return new Date(0);
}

// Format ISO date to display format
function formatScheduleDate(dateStr: string): string {
  const parsed = parseScheduleDate(dateStr);
  if (parsed.getTime() !== 0) {
    return format(parsed, 'EEEE - MMMM d, yyyy');
  }
  return dateStr;
}

function getBarColor(gradientBackground: string | null | undefined): string {
  if (gradientBackground && gradientBackground.startsWith('#')) return gradientBackground;
  return '#DE3F5E';
}

// Major event card with color bar (matches admin MajorEventCard style)
const MajorEventRow = ({
  event,
  primaryColor,
  onMoreDetails,
}: {
  event: ScheduleItem;
  primaryColor?: string;
  onMoreDetails?: () => void;
}) => {
  const barColor = getBarColor(event.gradient_background);

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 2,
        alignItems: 'stretch',
      }}
    >
      {/* Color bar */}
      <Box sx={{ width: 8, bgcolor: barColor, borderRadius: '4px', flexShrink: 0, alignSelf: 'stretch' }} />

      {/* Content */}
      <Box sx={{ flex: 1, minWidth: 0, py: 0.5 }}>
        <Typography
          sx={{
            fontWeight: 600,
            color: '#141414',
            fontSize: '1.1rem',
            mb: 0.5,
          }}
        >
          {event.name}
        </Typography>
        {event.description && (
          <Typography
            sx={{
              color: '#858585',
              fontSize: '0.95rem',
              lineHeight: 1.5,
              mb: 1.5,
            }}
          >
            {event.description}
          </Typography>
        )}
        <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ mb: event.linked_event_id ? 1.5 : 0 }}>
          {event.time && (
            <Typography sx={{ color: primaryColor || '#DE3F5E', fontSize: '0.875rem', fontWeight: 600 }}>
              {'⏰  '}{event.time}
            </Typography>
          )}
          {event.location && (
            <Typography sx={{ color: '#6a6a6a', fontSize: '0.875rem' }}>
              {'📍 '}{event.location}
            </Typography>
          )}
          {event.dress_code && (
            <Typography sx={{ color: '#6a6a6a', fontSize: '0.875rem' }}>
              {'👗 '}{event.dress_code}
            </Typography>
          )}
        </Stack>
        {event.linked_event_id && onMoreDetails && (
          <Box
            onClick={onMoreDetails}
            sx={{ cursor: 'pointer', display: 'inline-block' }}
          >
            <Typography sx={{ color: '#DE3F5E', fontSize: '0.875rem' }}>
              <Box component="span" sx={{ fontWeight: 700, textDecoration: 'underline' }}>More details</Box>
              {' >'}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

// Minor event row (simpler, no color bar)
const MinorEventRow = ({
  event,
  primaryColor,
}: {
  event: ScheduleItem;
  primaryColor?: string;
}) => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 2,
    }}
  >
    <Box>
      <Typography
        variant="h6"
        sx={{
          color: '#141414',
          lineHeight: 1.5,
        }}
      >
        {event.name}
      </Typography>
      {event.location && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
          <LocationOnOutlined sx={{ fontSize: 16, color: '#858585' }} />
          <Typography variant="body2" sx={{ color: '#858585' }}>
            {event.location}
          </Typography>
        </Box>
      )}
    </Box>
    {event.time && (
      event.time.includes('-') ? (
        <Stack spacing={0} sx={{ flexShrink: 0, textAlign: 'right' }}>
          {event.time.split('-').map((part: string, i: number) => (
            <Typography
              key={i}
              variant="body2"
              sx={{
                color: primaryColor || '#DE3F5E',
                fontWeight: 600,
                letterSpacing: '0.07em',
                textTransform: 'uppercase',
                lineHeight: 1.3,
              }}
            >
              {part.trim()}
            </Typography>
          ))}
        </Stack>
      ) : (
        <Typography
          variant="body2"
          sx={{
            color: primaryColor || '#DE3F5E',
            fontWeight: 600,
            letterSpacing: '0.07em',
            textTransform: 'uppercase',
            textAlign: 'right',
            flexShrink: 0,
          }}
        >
          {event.time}
        </Typography>
      )
    )}
  </Box>
);

// Day card component
const DayCard = ({
  date,
  events,
  index,
  primaryColor,
  weddingEvents,
  onMoreDetails,
}: {
  date: string;
  events: ScheduleItem[];
  index: number;
  primaryColor?: string;
  weddingEvents: WeddingEvent[];
  onMoreDetails: (event: WeddingEvent) => void;
}) => {
  const formattedDate = formatScheduleDate(date);

  const handleMoreDetails = (item: ScheduleItem) => {
    if (!item.linked_event_id) return;
    const linkedEvent = weddingEvents.find(e => e.id === item.linked_event_id);
    if (linkedEvent && linkedEvent.carousel_slides?.length > 0) {
      onMoreDetails(linkedEvent);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Box
        sx={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          p: 3,
          mb: 2,
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* Date Header */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h5"
            sx={{
              color: '#141414',
              mb: 0,
            }}
          >
            {formattedDate}
          </Typography>
        </Box>

        {/* Events */}
        {events.length === 0 ? (
          <Typography
            sx={{
              color: '#999',
              fontStyle: 'italic',
              fontSize: '1rem',
              textAlign: 'center',
              py: 2,
            }}
          >
            Stay Tuned...
          </Typography>
        ) : (
          <Stack spacing={3}>
            {events.map((event, eventIndex) => (
              <Box
                key={event.id || eventIndex}
                sx={{
                  pb: eventIndex < events.length - 1 ? 3 : 0,
                  borderBottom: eventIndex < events.length - 1 ? '1px solid rgba(0, 0, 0, 0.08)' : 'none',
                }}
              >
                {event.is_major_event ? (
                  <MajorEventRow
                    event={event}
                    primaryColor={primaryColor}
                    onMoreDetails={() => handleMoreDetails(event)}
                  />
                ) : (
                  <MinorEventRow event={event} primaryColor={primaryColor} />
                )}
              </Box>
            ))}
          </Stack>
        )}
      </Box>
    </motion.div>
  );
};

// Full-screen carousel overlay for "More Details"
const CarouselOverlay = ({
  event,
  primaryColor,
  onClose,
  weddingBackground,
}: {
  event: WeddingEvent;
  primaryColor?: string;
  onClose: () => void;
  weddingBackground?: string;
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = event.carousel_slides || [];
  const totalSlides = slides.length;
  const textColor = event.text_color || '#FFFFFF';
  const gradientBackground = event.gradient_background || null;

  if (slides.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Background — uses the wedding's main background */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundImage: weddingBackground
              ? `url(${weddingBackground})`
              : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundColor: weddingBackground ? undefined : '#1a1a1a',
          }}
        />
        {/* Back button */}
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: 16,
            left: 16,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            color: '#000',
            zIndex: 20,
            '&:hover': { backgroundColor: 'rgba(255, 255, 255, 1)' },
          }}
        >
          <ArrowBack />
        </IconButton>

        {/* Event name header */}
        <Typography
          variant="h6"
          sx={{
            position: 'relative',
            zIndex: 10,
            fontSize: 14,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: '#fff',
            mb: 3,
            textAlign: 'center',
          }}
        >
          {event.name}
        </Typography>

        {/* Carousel card */}
        <Card
          sx={{
            position: 'relative',
            zIndex: 10,
            width: '90%',
            maxWidth: 380,
            height: '65vh',
            maxHeight: 650,
            backgroundColor: 'transparent',
            borderRadius: '24px',
            boxShadow: '0px 0px 32px 0px rgba(0, 0, 0, 0.16)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            backgroundImage: gradientBackground
              ? `url(/images/backgrounds/${gradientBackground})`
              : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        >
          <CardContent
            sx={{
              p: slides[currentSlide]?.type === 'image' ? 0 : { xs: 3, md: 4 },
              '&:last-child': { pb: slides[currentSlide]?.type === 'image' ? 0 : undefined },
              flexGrow: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
              position: 'relative',
              zIndex: 1,
              height: '100%',
            }}
          >
            <SlideContent
              slide={slides[currentSlide]}
              textColor={textColor}
              gradientBackground={gradientBackground}
              isGradientSlide={currentSlide % 2 === 0}
            />
          </CardContent>
        </Card>

        {/* Navigation arrows */}
        <Box
          sx={{
            position: 'relative',
            zIndex: 10,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 3,
            mt: 3,
          }}
        >
          <IconButton
            onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
            disabled={currentSlide === 0}
            sx={{
              width: 48,
              height: 48,
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              color: '#000',
              '&:hover': { backgroundColor: '#fff' },
              '&:disabled': {
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                color: 'rgba(0, 0, 0, 0.3)',
              },
            }}
          >
            <ChevronLeft sx={{ fontSize: 28 }} />
          </IconButton>

          <IconButton
            onClick={() => setCurrentSlide(Math.min(totalSlides - 1, currentSlide + 1))}
            disabled={currentSlide === totalSlides - 1}
            sx={{
              width: 48,
              height: 48,
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              color: '#000',
              '&:hover': { backgroundColor: '#fff' },
              '&:disabled': {
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                color: 'rgba(0, 0, 0, 0.3)',
              },
            }}
          >
            <ChevronRight sx={{ fontSize: 28 }} />
          </IconButton>
        </Box>

        {/* Diamond indicators */}
        {totalSlides > 1 && (
          <Box sx={{ position: 'relative', zIndex: 10, mt: 3 }}>
            <DiamondIndicators total={totalSlides} current={currentSlide} activeColor={primaryColor} />
          </Box>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default function SchedulePage() {
  const params = useParams();
  const weddingSlug = params.weddingSlug as string;

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const router = useRouter();
  const { user, hasRSVPed, rsvpResponse } = useAuth();
  const { wedding, schedule, events } = useWedding();

  // Only show WhatsApp button if user has RSVP'd "yes" or "maybe"
  const shouldShowWhatsApp = hasRSVPed && (rsvpResponse === 'yes' || rsvpResponse === 'maybe');
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<WeddingEvent | null>(null);

  const primaryColor = wedding?.primary_color || undefined;

  return (
    <OptimizedBackground
      src="/images/backgrounds/jade.png"
      className="min-h-screen"
    >
      {/* Desktop Header - AppHeader with consistent styling */}
      {!isMobile && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10,
            backgroundColor: 'transparent',
          }}
        >
          <AppHeader
            variant="transparent"
            showBackButton={true}
            backHref={`/${weddingSlug}/details`}
          />
        </Box>
      )}

      {/* Mobile Header */}
      {isMobile && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 2,
            pt: 2,
            pb: 2,
          }}
        >
          <Container
            maxWidth={false}
            sx={{
              maxWidth: { xs: 361, md: 600, lg: 700 },
              px: { xs: 2, md: 3 },
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <IconButton
                onClick={() => router.back()}
                sx={{
                  color: '#000',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  },
                }}
              >
                <ArrowBack />
              </IconButton>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 400,
                  fontSize: 18,
                  lineHeight: 1.5,
                  letterSpacing: '5.56%',
                  textTransform: 'uppercase',
                  color: '#141414',
                }}
              >
                SCHEDULE & EVENTS
              </Typography>

              {/* WhatsApp Button - Only show if user RSVP'd yes or maybe */}
              {shouldShowWhatsApp ? (
                <IconButton
                  onClick={() => setWhatsAppModalOpen(true)}
                  sx={{
                    width: 32,
                    height: 32,
                    backgroundColor: '#000',
                    color: '#fff',
                    '&:hover': {
                      backgroundColor: '#333',
                      transform: 'scale(1.05)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.516" />
                  </svg>
                </IconButton>
              ) : (
                <Box sx={{ width: 32, height: 32 }} /> // Spacer when WhatsApp button is hidden
              )}
            </Stack>
          </Container>
        </Box>
      )}

      {/* Main Content */}
      <Container
        maxWidth={false}
        sx={{
          maxWidth: { xs: '100%', md: 800, lg: 900 },
          px: { xs: 2, md: 4 },
          pb: 4,
          pt: { xs: 10, md: 14 },
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Schedule Cards */}
          <Box>
            {[...schedule].sort((a, b) => parseScheduleDate(a.date).getTime() - parseScheduleDate(b.date).getTime()).map((day, index) => (
              <DayCard
                key={day.id}
                date={day.date}
                events={day.events}
                index={index}
                primaryColor={primaryColor}
                weddingEvents={events}
                onMoreDetails={(event) => setSelectedEvent(event)}
              />
            ))}
          </Box>
        </motion.div>
      </Container>

      {/* WhatsApp Channel Modal */}
      <WhatsAppChannelModal
        open={whatsAppModalOpen}
        onClose={() => setWhatsAppModalOpen(false)}
      />

      {/* Carousel Overlay */}
      {selectedEvent && (
        <CarouselOverlay
          event={selectedEvent}
          primaryColor={primaryColor}
          onClose={() => setSelectedEvent(null)}
          weddingBackground={wedding?.background_image || undefined}
        />
      )}
    </OptimizedBackground>
  );
}
