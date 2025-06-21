'use client';

import { Box, Container, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import OptimizedBackground from '@/components/ui/OptimizedBackground';
import AppHeader from '@/components/shared/AppHeader';
import Link from 'next/link';

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
  // {
  //   id: 4,
  //   slug: 'wedding-ceremony',
  //   name: 'Wedding Ceremony',
  //   description: 'The sacred union ceremony with traditional rituals, vows, and blessings. A moment of pure love and commitment.',
  //   date: '5 January, 2026',
  //   time: '6:00 AM - 10:00 AM',
  //   location: 'Sacred Garden, The Palayana',
  //   dress_code: 'Traditional Formal (Red/Maroon/Gold)',
  //   cultural_significance: 'The sacred bond of marriage blessed by fire and witnessed by nature',
  //   gradient: 'linear-gradient(135deg, rgba(211, 47, 47, 0.8) 0%, rgba(244, 67, 54, 0.8) 50%, rgba(239, 83, 80, 0.8) 100%)',
  //   image: '/images/backgrounds/rose.jpg'
  // },
  // {
  //   id: 5,
  //   slug: 'reception-dinner',
  //   name: 'Reception Dinner',
  //   description: 'An elegant evening celebration with dinner, music, and dancing to honor the newly married couple.',
  //   date: '5 January, 2026',
  //   time: '7:00 PM - 12:00 AM',
  //   location: 'Grand Ballroom, The Palayana',
  //   dress_code: 'Formal/Cocktail Attire',
  //   cultural_significance: 'Celebrating the new beginning with family and friends',
  //   gradient: 'linear-gradient(135deg, rgba(123, 31, 162, 0.8) 0%, rgba(156, 39, 176, 0.8) 50%, rgba(186, 104, 200, 0.8) 100%)',
  //   image: '/images/backgrounds/pool-optimized.jpg'
  // },
  // {
  //   id: 6,
  //   slug: 'farewell-brunch',
  //   name: 'Farewell Brunch',
  //   description: 'A relaxed morning gathering to share memories, exchange contact information, and bid farewell until we meet again.',
  //   date: '6 January, 2026',
  //   time: '10:00 AM - 1:00 PM',
  //   location: 'Poolside Restaurant, The Palayana',
  //   dress_code: 'Casual Comfortable',
  //   cultural_significance: 'Blessing the couple for their journey ahead',
  //   gradient: 'linear-gradient(135deg, rgba(255, 152, 0, 0.8) 0%, rgba(255, 183, 77, 0.8) 50%, rgba(255, 204, 2, 0.8) 100%)',
  //   image: '/images/backgrounds/pool2-optimized.jpg'
  // }
];

// Helper function to format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.getDate();
  return `${month} ${day}`;
};

export default function GuestEventsPage() {
  return (
    <OptimizedBackground 
      useAppDefault={true}
      className="min-h-screen"
    >
      {/* Header */}
      <AppHeader 
        showBackButton={true}
        backHref="/"
        variant="solid"
      />

      {/* Main Content */}
      <Container maxWidth="sm" sx={{ pb: 4, px: 0 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Event Tiles */}
          <Box className="space-y-1">
            {weddingEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <Link 
                  href={`/events/${event.slug}`}
                  style={{ textDecoration: 'none', display: 'block' }}
                >
                  <Box
                    sx={{
                      height: 180,
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'flex-end',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                      '&:hover': {
                        transform: 'scale(1.02)',
                      },
                    }}
                  >
                    {/* Background Image */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundImage: `url(${event.image})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                      }}
                    />
                    
                    {/* Pattern overlay */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'url(/images/overlays/petals-birds.png) no-repeat center',
                        backgroundSize: 'cover',
                        opacity: 0.05,
                      }}
                    />
                    
                    {/* Content */}
                    <Box
                      sx={{
                        p: 4,
                        pb: 3,
                        color: 'white',
                        position: 'relative',
                        zIndex: 2,
                        width: '100%',
                      }}
                    >
                      <Typography
                        variant="h4"
                        sx={{
                          fontWeight: 700,
                          fontSize: { xs: '1.75rem', sm: '2rem' },
                          mb: 1,
                          textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                        }}
                      >
                        {event.name}
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{
                          opacity: 0.95,
                          fontWeight: 600,
                          mb: 0.5,
                          textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
                        }}
                      >
                        {event.time}
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{
                          opacity: 0.85,
                          fontWeight: 500,
                          textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
                        }}
                      >
                        {formatDate(event.date)}
                      </Typography>
                    </Box>

                    {/* Subtle gradient overlay for better text readability */}
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '70%',
                        background: 'linear-gradient(to top, rgba(0, 0, 0, 0.6), transparent)',
                        zIndex: 1,
                      }}
                    />
                  </Box>
                </Link>
              </motion.div>
            ))}
          </Box>
        </motion.div>
      </Container>
    </OptimizedBackground>
  );
} 