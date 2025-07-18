'use client';

import { Box, Container, Typography, IconButton, Stack, Button } from '@mui/material';
import { motion } from 'framer-motion';
import OptimizedBackground from '@/components/ui/OptimizedBackground';
import Link from 'next/link';
import { ArrowBack } from '@mui/icons-material';
import { useRouter } from 'next/navigation';

// Sample events data - this would come from your backend/config in the future
const weddingEvents = [
  {
    id: 1,
    slug: 'welcome-lunch-haldi',
    name: 'Welcome Lunch & Haldi',
    dress_code: 'Shades of Yellow',
    dress_code_emoji: '🌻',
    date: 'January 4',
    time: '12 PM',
  },
  {
    id: 2,
    slug: 'baraat-varmala-jaggo',
    name: 'Baraat, Varmala, & Jaggo',
    dress_code: 'Vibrant Indian Festive',
    dress_code_emoji: '🎊',
    date: 'January 4',
    time: '4 PM',
  },
  {
    id: 3,
    slug: 'anand-karaj',
    name: 'Anand Karaj',
    dress_code: 'Pastel Indian Traditional',
    dress_code_emoji: '🌸',
    date: 'January 5',
    time: '9:30 AM',
  },
  {
    id: 4,
    slug: 'pool-party',
    name: 'Pool Party',
    dress_code: 'Boho Beach Festival',
    dress_code_emoji: '☀️',
    date: 'January 5',
    time: '2 PM',
  },
  {
    id: 5,
    slug: 'reception',
    name: 'Sangeet & Reception',
    dress_code: 'Cocktail Glam',
    dress_code_emoji: '🪩',
    date: 'January 5',
    time: '7:30 PM',
  },
];
// Helper function to format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.getDate();
  return `${month} ${day}`;
};

export const getGradientImage = (slug: string) => {
  switch(slug) {
    case 'welcome-lunch-haldi':
      return 'GradientYellow.png';
    case 'baraat-varmala-jaggo':
      return 'GradientJaggo.png';
    case 'anand-karaj':
      return 'GradientCottonCandy.png';
    case 'pool-party':
      return 'GradientPoolParty.png';
    case 'reception':
      return 'GradientJaggo.png';
    default:
      return null;
  }
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
              onClick={() => router.push('/details')}
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
                <Link href={`/events/${event.slug}`} style={{ textDecoration: 'none' }}>
                  <Box
                    sx={{
                      borderRadius: '16px',
                      overflow: 'hidden',
                      boxShadow: '0px 0px 32px 0px rgba(0, 0, 0, 0.12)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        boxShadow: '0px 0px 40px 0px rgba(0, 0, 0, 0.16)',
                        transform: 'translateY(-2px)',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex' }}>
                      {getGradientImage(event.slug) && (
                        <Box 
                          sx={{ 
                            width: 8, 
                            flexShrink: 0, 
                            backgroundImage: `url(/images/backgrounds/${getGradientImage(event.slug)})`, 
                            backgroundSize: 'cover',
                            backgroundPosition: 'center' 
                          }} 
                        />
                      )}
                      <Box 
                        sx={{ 
                          flex: 1, 
                          display: 'flex', 
                          alignItems: 'center', 
                          px: 2, 
                          py: 2, 
                          backgroundColor: '#fff' 
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
                              fontSize: 22,
                              lineHeight: 1.3,
                              // color: getDressCodeColor(event.name),
                              color: '#000',
                              mb: 0.5,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                            }}
                          >
                            {event.dress_code_emoji} <span style={{fontWeight: 500}}>{event.dress_code}</span>
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
                            {event.date} @ {event.time}
                          </Typography>
                        </Box>
                        {/* Chevron Icon */}
                        <Box sx={{ ml: 2, display: 'flex', alignItems: 'center' }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M10 6L16 12L10 18" stroke="#858585" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </Link>
              </motion.div>
            ))}
          </Stack>
        </motion.div>
      </Container>

      {/* Sticky "Where to Shop" Footer */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 4,
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          borderTop: '1px solid rgba(0, 0, 0, 0.1)',
          px: 2,
          py: 2,
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Container maxWidth="sm">
          <Stack spacing={1.5} alignItems="center">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{ width: '100%' }}
            >
              <Button
                component={Link}
                href="/where-to-shop"
                variant="contained"
                size="large"
                fullWidth
                sx={{
                  backgroundColor: '#DE3F5E',
                  color: 'white',
                  py: 2,
                  fontSize: '1.1rem',
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
                Where to Shop
              </Button>
            </motion.div>
          </Stack>
        </Container>
      </Box>

      {/* Add bottom padding to prevent content from being hidden behind sticky footer */}
      <Box sx={{ height: 100 }} />
    </OptimizedBackground>
  );
} 