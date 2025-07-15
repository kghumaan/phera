'use client';

import { 
  Box, 
  Container, 
  Typography, 
  IconButton,
  Card,
  CardContent,
  Stack,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { motion } from 'framer-motion';
import { useRouter, useParams } from 'next/navigation';
import { ArrowBack } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import OptimizedBackground from '@/components/ui/OptimizedBackground';

// Diamond indicators component
const DiamondIndicators = ({ total, current }: { total: number; current: number }) => (
  <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
    {[...Array(total)].map((_, index) => (
      <Box
        key={index}
        sx={{
          width: 12,
          height: 12,
          position: 'relative',
        }}
      >
        <svg width="12" height="12" viewBox="0 0 11 10" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" clipRule="evenodd" d="M10.1038 6.00065C10.6321 5.50893 10.6321 4.49105 10.1038 3.99933L6.05569 0.231742C5.7237 -0.0772472 5.2763 -0.0772472 4.94431 0.231742L0.896222 3.99933C0.367926 4.49105 0.367926 5.50893 0.896222 6.00065L4.94431 9.76823C5.2763 10.0773 5.7237 10.0773 6.05569 9.76823L10.1038 6.00065Z" fill={index === current ? '#DE3F5E' : '#D7A393'}/>
        </svg>
      </Box>
    ))}
  </Stack>
);

// Event card component
const EventCard = ({ 
  title, 
  content, 
  isActive
}: { 
  title: string; 
  content: React.ReactNode; 
  isActive: boolean;
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ 
      opacity: isActive ? 1 : 0.3, 
      scale: isActive ? 1 : 0.9 
    }}
    transition={{ duration: 0.3 }}
    style={{
      width: '100vw',
      maxWidth: '100%',
      height: '70vh',
      minHeight: '500px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '0 16px',
    }}
  >
    <Card
      sx={{
        width: '100%',
        maxWidth: 361,
        height: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        boxShadow: '0px 0px 32px 0px rgba(0, 0, 0, 0.12)',
        border: 'none',
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <CardContent
        sx={{
          p: 3,
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        <Stack spacing={2} alignItems="center">
          <Typography
            variant="h4"
            sx={{
              fontFamily: 'Outfit',
              fontWeight: 400,
              fontSize: 28,
              lineHeight: 1.3,
              color: '#141414',
            }}
          >
            {title}
          </Typography>
          <Typography
            variant="body1"
            component="div"
            sx={{
              fontFamily: 'Outfit',
              fontWeight: 400,
              fontSize: 16,
              lineHeight: 1.5,
              color: '#474747',
            }}
          >
            {content}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  </motion.div>
);

// Events data matching the main events page
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
    dress_code: 'Vibrant Festive Hues',
    dress_code_emoji: '🎊',
    date: 'January 4',
    time: '4 PM',
  },
  {
    id: 3,
    slug: 'anand-karaj',
    name: 'Anand Karaj (Wedding Ceremony)',
    dress_code: 'Pastel',
    dress_code_emoji: '🌸',
    date: 'January 5',
    time: '9:30 AM',
  },
  {
    id: 4,
    slug: 'pool-party',
    name: 'Pool Party',
    dress_code: 'Beach-Chic Loungewear',
    dress_code_emoji: '🏖️',
    date: 'January 5',
    time: '2 PM',
  },
  {
    id: 5,
    slug: 'reception',
    name: 'Reception',
    dress_code: 'Black-Tie',
    dress_code_emoji: '🤵🏽',
    date: 'January 5',
    time: '7:30 PM',
  },
  {
    id: 6,
    slug: 'after-party',
    name: 'After Party',
    dress_code: 'Neon Festival Rave',
    dress_code_emoji: '🎆',
    date: 'January 5',
    time: '11:45 PM',
  },
];

export default function EventDetailPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const router = useRouter();
  const params = useParams();
  const [currentSlide, setCurrentSlide] = useState(0);

  // Find the current event
  const currentEvent = weddingEvents.find(event => event.slug === params.slug);

  // Disable scrolling when component mounts
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  // Sample data for 3 blank cards
  const eventData = [
    {
      title: "Card 1",
      content: "This is a placeholder for the first card. Content will be added based on the specific event details.",
    },
    {
      title: "Card 2", 
      content: "This is a placeholder for the second card. Content will be added based on the specific event details.",
    },
    {
      title: "Card 3",
      content: "This is a placeholder for the third card. Content will be added based on the specific event details.",
    },
  ];

  const handleBack = () => {
    router.push('/events');
  };

  const handleSlideChange = (direction: 'next' | 'prev') => {
    if (direction === 'next') {
      setCurrentSlide((prev) => (prev + 1) % eventData.length);
    } else {
      setCurrentSlide((prev) => (prev - 1 + eventData.length) % eventData.length);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const startX = touch.clientX;
    
    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      const currentX = touch.clientX;
      const diffX = startX - currentX;
      
      if (Math.abs(diffX) > 50) {
        if (diffX > 0) {
          handleSlideChange('next');
        } else {
          handleSlideChange('prev');
        }
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      }
    };
    
    const handleTouchEnd = () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
    
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
  };

  // If event not found, show error
  if (!currentEvent) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>Event not found</Typography>
      </Box>
    );
  }

  return (
    <OptimizedBackground
      src="/images/backgrounds/aquarium.png"
      alt="Aquarium Background"
      priority={true}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          touchAction: 'pan-x',
          minHeight: '100vh',
        }}
      >
        {/* Header with back button */}
        <Box
          sx={{
            position: 'relative',
            zIndex: 2,
            pt: 2,
            pb: 2,
            flexShrink: 0,
          }}
        >
          <Container maxWidth="sm">
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <IconButton
                onClick={handleBack}
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
                  textAlign: 'center',
                }}
              >
                {currentEvent.name}
              </Typography>
              <Box sx={{ width: 48 }} />
            </Stack>
          </Container>
        </Box>

        {/* Main carousel content */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            zIndex: 2,
          }}
        >
          <Stack spacing={3} alignItems="center" sx={{ width: '100%', height: '100%', justifyContent: 'center' }}>
            {/* Carousel container */}
            <Box
              sx={{
                width: '100vw',
                display: 'flex',
                justifyContent: 'flex-start',
                position: 'relative',
                overflow: 'hidden',
              }}
              onTouchStart={handleTouchStart}
              onClick={(e) => {
                const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                const x = e.clientX - rect.left;
                if (x < rect.width / 2) {
                  handleSlideChange('prev');
                } else {
                  handleSlideChange('next');
                }
              }}
            >
              <Stack 
                direction="row" 
                spacing={0}
                sx={{
                  transform: `translateX(-${currentSlide * 100}vw)`,
                  transition: 'transform 0.3s ease-in-out',
                  width: 'max-content',
                }}
              >
                {eventData.map((card, index) => (
                  <EventCard
                    key={index}
                    title={card.title}
                    content={card.content}
                    isActive={index === currentSlide}
                  />
                ))}
              </Stack>
            </Box>

            {/* Navigation buttons for desktop */}
            {!isMobile && (
              <Stack direction="row" spacing={2} justifyContent="center">
                <IconButton
                  onClick={() => handleSlideChange('prev')}
                  disabled={currentSlide === 0}
                  sx={{
                    color: '#000',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    },
                    '&:disabled': {
                      opacity: 0.3,
                    },
                  }}
                >
                  ←
                </IconButton>
                <IconButton
                  onClick={() => handleSlideChange('next')}
                  disabled={currentSlide === eventData.length - 1}
                  sx={{
                    color: '#000',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    },
                    '&:disabled': {
                      opacity: 0.3,
                    },
                  }}
                >
                  →
                </IconButton>
              </Stack>
            )}
          </Stack>
        </Box>

        {/* Bottom indicators */}
        <Box
          sx={{
            position: 'relative',
            zIndex: 3,
            flexShrink: 0,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mb: 2,
              mt: 4,
            }}
          >
            <DiamondIndicators total={eventData.length} current={currentSlide} />
          </Box>
        </Box>
      </Box>
    </OptimizedBackground>
  );
}