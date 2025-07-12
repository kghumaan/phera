'use client';

import { Box, Container, Typography, Stack } from '@mui/material';
import { motion } from 'framer-motion';
import OptimizedBackground from '@/components/ui/OptimizedBackground';
import AppHeader from '@/components/shared/AppHeader';
import { CalendarTodayOutlined, AccessTimeOutlined, LocationOnOutlined } from '@mui/icons-material';

// Wedding schedule data
const weddingSchedule = [
  {
    day: 'Saturday',
    date: '4 January, 2026',
    events: [
      {
        time: '10:00 AM - 12:00 PM',
        name: 'Haldi Ceremony',
        location: 'Garden Pavilion, The Palayana',
        type: 'ceremony'
      },
      {
        time: '2:00 PM - 6:00 PM',
        name: 'Mehendi Ceremony',
        location: 'Beachside Terrace, The Palayana',
        type: 'ceremony'
      },
      {
        time: '7:00 PM - 11:00 PM',
        name: 'Jaggo',
        location: 'Courtyard, The Palayana',
        type: 'celebration'
      }
    ]
  },
  {
    day: 'Sunday',
    date: '5 January, 2026',
    events: [
      {
        time: '6:00 AM - 10:00 AM',
        name: 'Wedding Ceremony',
        location: 'Sacred Garden, The Palayana',
        type: 'ceremony'
      },
      {
        time: '7:00 PM - 12:00 AM',
        name: 'Reception Dinner',
        location: 'Grand Ballroom, The Palayana',
        type: 'celebration'
      }
    ]
  },
  {
    day: 'Monday',
    date: '6 January, 2026',
    events: [
      {
        time: '10:00 AM - 1:00 PM',
        name: 'Farewell Brunch',
        location: 'Poolside Restaurant, The Palayana',
        type: 'casual'
      }
    ]
  }
];

// Day card component
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
        borderRadius: 1.5,
        p: 3,
        mb: 3,
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      }}
    >
      {/* Day Header */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h5"
          sx={{
            fontFamily: 'Outfit',
            fontWeight: 700,
            color: '#141414',
            mb: 0.5,
          }}
        >
          {day}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CalendarTodayOutlined 
            sx={{ fontSize: 16, color: '#666' }} 
          />
          <Typography
            variant="body2"
            sx={{
              color: '#666',
              fontWeight: 500,
            }}
          >
            {date}
          </Typography>
        </Box>
      </Box>

      {/* Events */}
      <Stack spacing={2.5}>
        {events.map((event, eventIndex) => (
          <Box
            key={eventIndex}
            sx={{
              pb: eventIndex < events.length - 1 ? 2.5 : 0,
              borderBottom: eventIndex < events.length - 1 ? '1px solid rgba(0, 0, 0, 0.08)' : 'none',
            }}
          >
            {/* Time and Event Name Row */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 3,
                mb: 1,
              }}
            >
              {/* Time */}
              <Box
                sx={{
                  minWidth: 80,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <AccessTimeOutlined 
                  sx={{ fontSize: 16, color: '#DE3F5E' }} 
                />
                <Typography
                  variant="body2"
                  sx={{
                    color: '#DE3F5E',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                  }}
                >
                  {event.time.split(' - ')[0]}
                </Typography>
              </Box>

              {/* Event Name */}
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontFamily: 'Outfit',
                    fontWeight: 600,
                    color: '#141414',
                    fontSize: '1.1rem',
                  }}
                >
                  {event.name}
                </Typography>
              </Box>
            </Box>

            {/* Location Row - Full Width */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocationOnOutlined 
                sx={{ fontSize: 14, color: '#999' }} 
              />
              <Typography
                variant="body2"
                sx={{
                  color: '#999',
                  fontSize: '0.85rem',
                }}
              >
                {event.location}
              </Typography>
            </Box>
          </Box>
        ))}
      </Stack>
    </Box>
  </motion.div>
);

export default function SchedulePage() {
  return (
    <OptimizedBackground 
      useAppDefault={true}
      className="min-h-screen"
    >
      {/* Header */}
      <AppHeader 
        showBackButton={true}
        backHref="/details"
        variant="solid"
      />

      {/* Main Content */}
      <Container maxWidth="sm" sx={{ pb: 4 }}>
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

          {/* Additional Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Box
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                borderRadius: 1.5,
                p: 3,
                mt: 3,
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                textAlign: 'center',
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: '#666',
                  fontStyle: 'italic',
                  lineHeight: 1.6,
                }}
              >
                All events are located at The Palayana Resort. 
                Please refer to the travel guide for directions and accommodation details.
              </Typography>
            </Box>
          </motion.div>
        </motion.div>
      </Container>
    </OptimizedBackground>
  );
} 