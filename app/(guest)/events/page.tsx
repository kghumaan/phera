'use client';

import { Box, Container, Typography, IconButton, Stack } from '@mui/material';
import { motion } from 'framer-motion';
import OptimizedBackground from '@/components/ui/OptimizedBackground';
import Link from 'next/link';
import { ArrowBack } from '@mui/icons-material';
import { useRouter } from 'next/navigation';

// Sample events data - this would come from your backend/config in the future
const weddingEvents = [
  {
    id: 1,
    slug: 'haldi-ceremony',
    name: 'Haldi Ceremony',
    description: 'A beautiful traditional ceremony where turmeric paste is applied to the bride and groom for good luck and purification.',
    date: '4 January, 2026',
    time: '10:00 AM - 12:00 PM',
    location: 'Garden Pavilion, The Palayana',
    dress_code: 'Traditional Yellow/Orange',
    cultural_significance: 'Turmeric is believed to ward off evil spirits and bring prosperity',
    image: '/images/backgrounds/haldi-optimized.jpg'
  },
  {
    id: 2,
    slug: 'mehendi-ceremony',
    name: 'Mehendi Ceremony',
    description: 'An artistic celebration where intricate henna designs are applied to hands and feet, accompanied by music and dance.',
    date: '4 January, 2026',
    time: '2:00 PM - 6:00 PM',
    location: 'Beachside Terrace, The Palayana',
    dress_code: 'Vibrant Colors (Green/Pink preferred)',
    cultural_significance: 'Henna symbolizes joy, beauty, and spiritual awakening',
    image: '/images/backgrounds/mehndi-optimized.jpg'
  },
  {
    id: 3,
    slug: 'jaggo',
    name: 'Jaggo',
    description: 'A joyful gathering to welcome all families and friends. Enjoy traditional music, dance, and delicious appetizers.',
    date: '4 January, 2026',
    time: '7:00 PM - 11:00 PM',
    location: 'Courtyard, The Palayana',
    dress_code: 'Semi-formal Indian/Western',
    cultural_significance: 'Bringing together two families as one',
    image: '/images/backgrounds/jaggo-optimized.jpg'
  },
  {
    id: 4,
    slug: 'wedding-ceremony',
    name: 'Wedding Ceremony',
    description: 'The sacred union ceremony with traditional rituals, vows, and blessings. A moment of pure love and commitment.',
    date: '5 January, 2026',
    time: '6:00 AM - 10:00 AM',
    location: 'Sacred Garden, The Palayana',
    dress_code: 'Traditional Formal (Red/Maroon/Gold)',
    cultural_significance: 'The sacred bond of marriage blessed by fire and witnessed by nature',
    gradient: 'linear-gradient(135deg, rgba(211, 47, 47, 0.8) 0%, rgba(244, 67, 54, 0.8) 50%, rgba(239, 83, 80, 0.8) 100%)',
    image: '/images/backgrounds/blue-clouds.jpg'
  },
  {
    id: 5,
    slug: 'reception-dinner',
    name: 'Reception Dinner',
    description: 'An elegant evening celebration with dinner, music, and dancing to honor the newly married couple.',
    date: '5 January, 2026',
    time: '7:00 PM - 12:00 AM',
    location: 'Grand Ballroom, The Palayana',
    dress_code: 'Formal/Cocktail Attire',
    cultural_significance: 'Celebrating the new beginning with family and friends',
    gradient: 'linear-gradient(135deg, rgba(123, 31, 162, 0.8) 0%, rgba(156, 39, 176, 0.8) 50%, rgba(186, 104, 200, 0.8) 100%)',
    image: '/images/backgrounds/pool-optimized.jpg'
  },
  {
    id: 6,
    slug: 'farewell-brunch',
    name: 'Farewell Brunch',
    description: 'A relaxed morning gathering to share memories, exchange contact information, and bid farewell until we meet again.',
    date: '6 January, 2026',
    time: '10:00 AM - 1:00 PM',
    location: 'Poolside Restaurant, The Palayana',
    dress_code: 'Casual Comfortable',
    cultural_significance: 'Blessing the couple for their journey ahead',
    gradient: 'linear-gradient(135deg, rgba(255, 152, 0, 0.8) 0%, rgba(255, 183, 77, 0.8) 50%, rgba(255, 204, 2, 0.8) 100%)',
    image: '/images/backgrounds/pool2-optimized.jpg'
  }
];

// Helper function to format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.getDate();
  return `${month} ${day}`;
};

export default function GuestEventsPage() {
  const router = useRouter();
  return (
    <OptimizedBackground 
      src="/images/backgrounds/aquarium.png"
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
              Events & Dress Code
            </Typography>
            <Box sx={{ width: 48 }} /> {/* Spacer */}
          </Stack>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxWidth="sm" sx={{ pb: 4, px: 2, pt: 10 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Event Cards */}
          <Stack spacing={2}>
            {weddingEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Box
                  sx={{
                    backgroundColor: '#fff',
                    borderRadius: '16px',
                    boxShadow: '0px 0px 32px 0px rgba(0, 0, 0, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    px: 2,
                    py: 2,
                    mb: 0,
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    {/* Event Title */}
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontFamily: 'Outfit',
                        fontWeight: 600,
                        fontSize: 14,
                        lineHeight: 1.5,
                        letterSpacing: '0.07em',
                        textTransform: 'uppercase',
                        color: '#474747',
                        mb: 0.5,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {event.name}
                    </Typography>
                    {/* Dress Code (emoji + text) */}
                    <Typography
                      variant="h6"
                      sx={{
                        fontFamily: 'Outfit',
                        fontWeight: 500,
                        fontSize: 24,
                        lineHeight: 1.3,
                        // color: getDressCodeColor(event.name),
                        color: '#000',
                        mb: 0.5,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      {getDressCodeEmoji(event.name)} {event.dress_code}
                    </Typography>
                    {/* Date/Time */}
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: 'Outfit',
                        fontWeight: 300,
                        fontSize: 16,
                        lineHeight: 1.5,
                        color: '#858585',
                      }}
                    >
                      {event.date} @ {event.time.split(' - ')[0]}
                    </Typography>
                  </Box>
                  {/* Chevron Icon */}
                  <Box sx={{ ml: 2, display: 'flex', alignItems: 'center' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10 6L16 12L10 18" stroke="#858585" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </Box>
                </Box>
              </motion.div>
            ))}
          </Stack>
        </motion.div>
      </Container>
    </OptimizedBackground>
  );
} 

// Add helper functions for emoji and color
function getDressCodeEmoji(eventName: string) {
  if (/haldi/i.test(eventName)) return '🌻';
  if (/mehendi/i.test(eventName)) return '🌈';
  if (/jaggo/i.test(eventName)) return '🎉';
  if (/wedding/i.test(eventName) || /anand/i.test(eventName)) return '🌸';
  if (/pool/i.test(eventName)) return '🏖️';
  if (/reception/i.test(eventName)) return '🤵🏽';
  if (/farewell|after/i.test(eventName)) return '🎆';
  return '🎊';
}
function getDressCodeColor(eventName: string) {
  if (/haldi/i.test(eventName)) return '#FFA100';
  if (/mehendi/i.test(eventName)) return '#911BBF';
  if (/jaggo/i.test(eventName)) return '#B1C614';
  if (/wedding/i.test(eventName) || /anand/i.test(eventName)) return '#E78D9F';
  if (/pool/i.test(eventName)) return '#16877A';
  if (/reception/i.test(eventName)) return '#141414';
  if (/farewell|after/i.test(eventName)) return '#B1C614';
  return '#858585';
} 