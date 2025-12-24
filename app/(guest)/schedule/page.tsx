'use client';

import { Box, Container, Typography, Stack, IconButton } from '@mui/material';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowBack, CalendarTodayOutlined, AccessTimeOutlined, LocationOnOutlined } from '@mui/icons-material';
import OptimizedBackground from '@/components/ui/OptimizedBackground';
import WhatsAppChannelModal from '@/components/shared/WhatsAppChannelModal';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useState } from 'react';

// Wedding schedule data from Figma design
const weddingSchedule = [
  {
    day: 'Sunday',
    date: 'Sunday - January 4, 2025',
    events: [
      {
        time: '11 AM',
        name: '🏨 Guest Arrival',
        description: 'Check in and dive straight into the festive fun (come dressed in your shades of yellow!)',
        location: 'The Palayana'
      },
      {
        time: '12 PM',
        name: '🥘 Welcome Lunch',
        description: 'Bright beachfront buffet in your sunny yellows—get ready to mingle and reunite.',
        location: 'Lawn'
      },
      {
        time: '1:30 PM',
        name: '🌻 Haldi Ceremony',
        description: 'Splash into the turmeric celebration—feel the buzz as we kick off the good vibes.',
        location: 'Lawn'
      },
      {
        time: '12 - 5 PM',
        name: '🪬 Mehendi Station',
        description: 'Stop by for live henna artistry—watch your hands transform into incredible works of art.',
        location: 'Thaipas'
      },
      {
        time: '3:30 PM',
        name: '🐎 KV\'s Baarat (Grooms Side)',
        description: 'Drums, music, and procession—join the vibrant celebration as we parade through the streets.',
        location: 'Resort Entrance'
      },
      {
        time: '5 PM',
        name: '🌺 Varmala & Vows',
        description: 'Exchange garlands and vows under a sunset sky—an intimate, colorful moment you won\'t want to miss.',
        location: 'Lawn'
      },
      {
        time: '6:30 - 10 PM',
        name: '🥁 Dinner & Jaggo',
        description: 'Eat, dance, repeat—savor the feast then let loose to pounding dhol beats.',
        location: 'Lawn'
      }
    ]
  },
  {
    day: 'Monday',
    date: 'Monday - January 5, 2025',
    events: [
      {
        time: '6:30 - 9:30 AM',
        name: '🍳 Breakfast',
        location: 'Basil Restaurant'
      },
      {
        time: '9:30 AM',
        name: '🤲 Anand Karaj (Wedding Ceremony)',
        location: 'Satnam House (transportation provided)'
      },
      {
        time: '12:30 PM',
        name: '🍽️ Lunch',
        location: 'Lawn'
      },
      {
        time: '2 PM',
        name: '🏊 Pool Party',
        location: 'Poolside & Beach'
      },
      {
        time: '7:30 PM',
        name: '🎉 Sangeet & Reception',
        location: 'Ballroom'
      },
      {
        time: '12 - Late',
        name: '🪩 Afterparty',
        location: 'Ballroom'
      }
    ]
  },
  {
    day: 'Tuesday',
    date: 'Tuesday - January 6, 2025',
    events: [
      {
        time: '6:30 - 11 AM',
        name: '🍳 Breakfast',
        location: 'Basil Restaurant'
      },
      {
        time: '12 PM',
        name: '🧳 Checkout',
        location: 'Hotel Lobby'
      }
    ]
  }
];

// Day card component with improved layout
const DayCard = ({ day, date, events, index }: { 
  day: string; 
  date: string; 
  events: any[]; 
  index: number; 
}) => (
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
      {/* Day and Date Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography
          variant="h4"
          sx={{
            fontFamily: 'Outfit',
            fontWeight: 600,
            color: '#141414',
            mb: 0,
          }}
        >
          {date}
          </Typography>
        {/* <Typography
          variant="body2"
          sx={{
            color: '#666',
            fontWeight: 500,
            fontSize: 16,
            letterSpacing: 0.5,
          }}
        >
          {date}
        </Typography> */}
      </Box>

      {/* Events */}
      <Stack spacing={3}>
        {events.map((event, eventIndex) => (
          <Box
            key={eventIndex}
            sx={{
              pb: eventIndex < events.length - 1 ? 3 : 0,
              borderBottom: eventIndex < events.length - 1 ? '1px solid rgba(0, 0, 0, 0.08)' : 'none',
            }}
          >
            {/* Event Title and Time Row */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 1,
                gap: 2,
              }}
            >
              <Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontFamily: 'Outfit',
                    fontWeight: 600,
                    color: '#141414',
                    // fontSize: '1rem',
                    lineHeight: 1.5,
                  }}
                >
                  {event.name}
                </Typography>
                {event.dressCode && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#858585',
                      fontSize: '0.85rem',
                      fontWeight: 400,
                      display: 'block',
                      mt: 0.2,
                    }}
                  >
                    {event.dressCode}
                  </Typography>
                )}
              </Box>
              <Typography
                variant="body2"
                sx={{
                  color: '#DE3F5E',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  letterSpacing: '0.07em',
                  textTransform: 'uppercase',
                  textAlign: 'right',
                  flexShrink: 0,
                }}
              >
                {event.time}
              </Typography>
            </Box>
            {/* Location */}
            {event.location && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationOnOutlined 
                  sx={{ fontSize: 16, color: '#858585' }} 
                />
                <Typography
                  variant="body1"
                  sx={{
                    color: '#858585',
                    fontSize: '1rem',
                    fontWeight: 400,
                  }}
                >
                  {event.location}
                </Typography>
              </Box>
            )}
          </Box>
        ))}
      </Stack>
    </Box>
  </motion.div>
);

export default function SchedulePage() {
  const router = useRouter();
  const { user, hasRSVPed, rsvpResponse } = useAuth();
  
  // Only show WhatsApp button if user has RSVP'd "yes" or "maybe"
  const shouldShowWhatsApp = hasRSVPed && (rsvpResponse === 'yes' || rsvpResponse === 'maybe');
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
  
  return (
    <OptimizedBackground 
      src="/images/backgrounds/jade.png"
      className="min-h-screen"
    >
      {/* Header */}
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
                fontFamily: 'Outfit',
                fontWeight: 400,
                fontSize: 18,
                lineHeight: 1.5,
                letterSpacing: '5.56%',
                textTransform: 'uppercase',
                color: '#141414',
              }}
            >
              SCHEDULE
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
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.516"/>
                </svg>
              </IconButton>
            ) : (
              <Box sx={{ width: 32, height: 32 }} /> // Spacer when WhatsApp button is hidden
            )}
          </Stack>
        </Container>
      </Box>

      {/* Main Content */}
      <Container 
        maxWidth={false}
        sx={{
          maxWidth: { xs: '100%', md: 600, lg: 700 },
          px: { xs: 2, md: 3 },
          pb: 4,
          pt: 10,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Schedule Cards */}
          <Box>
            {weddingSchedule.map((dayData, index) => (
              <DayCard
                key={index}
                day={dayData.day}
                date={dayData.date}
                events={dayData.events}
                index={index}
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
    </OptimizedBackground>
  );
} 