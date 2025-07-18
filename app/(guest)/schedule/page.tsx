'use client';

import { Box, Container, Typography, Stack, IconButton } from '@mui/material';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowBack, CalendarTodayOutlined, AccessTimeOutlined, LocationOnOutlined } from '@mui/icons-material';
import OptimizedBackground from '@/components/ui/OptimizedBackground';

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
        time: '2 PM',
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
        time: '4 PM',
        name: '🐎 KV\'s Baarat (Grooms Side)',
        description: 'Drums, music, and procession—join the vibrant celebration as we parade through the streets.',
        location: 'Resort Entrance'
      },
      {
        time: '5:30 PM',
        name: '🌺 Varmala & Vows',
        description: 'Exchange garlands and vows under a sunset sky—an intimate, colorful moment you won\'t want to miss.',
        location: 'Lawn'
      },
      {
        time: '7 - 10 PM',
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
        time: '7:30 - 9:30 AM',
        name: '🍳 Breakfast',
        location: 'Basil Restaurant'
      },
      {
        time: '9:30 AM',
        name: '🤲 Anand Karaj (Wedding Ceremony)',
        location: 'Satnam House (transportation provided)'
      },
      {
        time: '2 PM',
        name: '☀️ Lunch & Pool Party',
        location: 'Poolside & Beach'
      },
      {
        time: '7:30 PM',
        name: '🎉 Sangeet & Reception',
        location: 'Ballroom'
      },
      {
        time: '12 - 3 AM',
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
        time: '7:30 - 11 AM',
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
        <Container maxWidth="sm">
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
            <Box sx={{ width: 48 }} /> {/* Spacer */}
          </Stack>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxWidth="sm" sx={{ pb: 4, pt: 10 }}>
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
    </OptimizedBackground>
  );
} 