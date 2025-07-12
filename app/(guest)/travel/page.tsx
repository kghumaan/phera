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
  Button,
} from '@mui/material';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowBack } from '@mui/icons-material';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useState, useEffect } from 'react';
import OptimizedBackground from '@/components/ui/OptimizedBackground';
import Link from 'next/link';

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

// Travel card component
const TravelCard = ({ 
  title, 
  content, 
  image, 
  isActive,
  buttonText,
  isDisabled,
  onButtonClick
}: { 
  title: string; 
  content: React.ReactNode; 
  image?: string; 
  isActive: boolean;
  buttonText?: string;
  isDisabled?: boolean;
  onButtonClick?: () => void;
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
      height: '70vh', // Responsive height instead of fixed 596px
      minHeight: '500px', // Minimum height for smaller screens
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
      {/* Content section - now at the top */}
      <CardContent
        sx={{
          p: 2.5,
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
        }}
      >
        <Stack spacing={1}>
          <Typography
            variant="h4"
            sx={{
              fontFamily: 'Outfit',
              fontWeight: 400,
              fontSize: 28,
              lineHeight: 1.3,
              color: '#141414',
              textAlign: 'left',
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
              textAlign: 'left',
            }}
          >
            {content}
          </Typography>
        </Stack>
        {buttonText && (
          <Box sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              disabled={isDisabled}
              onClick={onButtonClick}
              sx={{
                width: '100%',
                borderRadius: 80,
                padding: '12px 20px',
                textTransform: 'uppercase',
                fontWeight: 700,
                fontSize: 16,
                letterSpacing: '6.25%',
                color: isDisabled ? '#BCBCBC' : '#DE3F5E',
                borderColor: isDisabled ? '#BCBCBC' : '#DE3F5E',
              }}
            >
              {buttonText}
            </Button>
          </Box>
        )}
      </CardContent>

      {/* Image section - now at the bottom */}
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: '40%', // Make image section responsive too
          minHeight: 200,
          overflow: 'hidden',
        }}
      >
        <Box
          component="img"
          src={image || '/images/travel_stay/Frame 1000004400.png'}
          alt="Travel destination"
          sx={{
            width: '120%',
            height: '100%',
            objectFit: 'cover',
            position: 'absolute',
            top: 0,
          }}
        />
      </Box>
    </Card>
  </motion.div>
);

export default function TravelPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const router = useRouter();
  const { user } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);

  // Disable scrolling when component mounts
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  const travelData = [
    {
      title: "We've got your stay covered ✨",
      content: <>Your rooms at The Palayana are taken care of for January 4th & 5th. Get ready to celebrate right on the beach - the resort is absolutely gorgeous!<br /><br />We'll share room assignments closer to the date.</>,
      image: "/images/travel_stay/1.png",
    },
    {
      title: "Book additional nights at The Palayana 🏝️",
      content: <>Want to stay longer? Book additional nights as soon as possible since the hotel fills up fast! Use the link below or email <a href={`mailto:vidhi@thepalayana.com?cc=booking@thepalayana.com&subject=Simran%20x%20Karanvir%20wedding%20-%20Additional%20Nights&body=Requesting%20additional%20nights%20for%20[dates].`} style={{color: '#DE3F5E', textDecoration: 'none'}}>vidhi@thepalayana.com</a> and CC <a href={`mailto:vidhi@thepalayana.com?cc=booking@thepalayana.com&subject=Simran%20x%20Karanvir%20wedding%20-%20Additional%20Nights&body=Requesting%20additional%20nights%20for%20[dates].`} style={{color: '#DE3F5E', textDecoration: 'none'}}>booking@thepalayana.com</a> if you’d prefer to stay in the same room we assign to you for the 4th and 5th.</>,
      image: "/images/travel_stay/2.png",
      buttonText: "booking link",
      onButtonClick: () => window.open('https://bit.ly/45TiuuI', '_blank'),
    },
    {
      title: "Coming to Bangkok first? 🏙️",
      content: <>If you're planning to arrive early, we'll be in Bangkok for New Year's Eve. No formal plans yet, but you're welcome to join whatever we end up doing.<br /><br />Plus, Bangkok is ‘the best city in world’ according to Sim so it’s worth the trip 👀</>,
      image: "/images/travel_stay/3.png",
      buttonText: "Sim’s bangkok guide",
      onButtonClick: () => window.open('https://docs.google.com/document/d/1JedCbzdZkMiRaI37d-5wP59qipdAJW97RPLkTMx6reI/edit?tab=t.0', '_blank'),
    },
    {
      title: "Where to stay in Bangkok 🗺️",
      content: <>Sukhumvit is our top pick for max convenience - food, nightlife, shopping, it’s the heart of the city. And it’s where Sim grew up! <br /><br />Silom/Sathorn for a quieter residential vibe, Riverside for fancy hotels and upscale vibes, Chinatown if you’re looking for a local experience and boutique hotels (or ratchet hostels 😜).</>,
      image: "/images/travel_stay/4.png",
    },
    {
      title: "Getting to Hua Hin 🚌",
      content: <>It's about a 3-hour drive from Bangkok, and we're organizing buses that leave on January 4th morning from a central location (more details on that later).<br /><br />You can also rent a car if you prefer to drive yourself - just remember they drive on the left side of the road here!<br /><br />FYI, celebrations start at 12pm on Jan 4th so we highly recommend arriving in Bangkok by at least Jan 3rd.</>,
      image: "/images/travel_stay/5.png",
    },
    {
      title: "Weather &  what to expect 🌤️",
      content: <>January weather is lovely - around 75-85°F (24-29°C). Pack light and bring sunscreen! <br /><br />There are specific dress codes for each wedding event, so check the link below for details.</>,
      image: "/images/travel_stay/6.png",
      buttonText: "Dress Code",
      // TODO: Add actual link for Dress Code
    },
    {
      title: "Money stuff 💰",
      content: <>Thailand uses Thai Baht (roughly 1 USD = 35 THB, 1 INR = 0.4 THB). We recommend getting cash from a currency exchange since ATMs here have high fees. <br /><br />Most places accept cards, but local stores and 7-Elevens will require cash.</>,
      image: "/images/travel_stay/7.png",
    },
    {
      title: "Staying in touch 📱",
      content: <>We'll be using WhatsApp for updates and coordination so make sure you have the app downloaded on your phone. <br /><br />Also, keep checking back here - we'll add more details as we get closer.</>,
      image: "/images/travel_stay/8.png",
      buttonText: "link coming soon",
      isDisabled: true,
    },
    {
      title: "We’re so excited to celebrate with you! 🎉",
      content: <>That's everything you should need for now! If you have any questions about travel, the wedding, or anything else, just reach out - we're always happy to help.</>,
      image: "/images/travel_stay/9.png",
      buttonText: "Back to menu",
      onButtonClick: () => router.push('/details'),
    },
  ];

  const handleBack = () => {
    router.back();
  };

  const handleSlideChange = (direction: 'next' | 'prev') => {
    if (direction === 'next') {
      setCurrentSlide((prev) => (prev + 1) % travelData.length);
    } else {
      setCurrentSlide((prev) => (prev - 1 + travelData.length) % travelData.length);
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

  return (
    <OptimizedBackground
      src="/images/backgrounds/rose-quartz.png"
      alt="Rose Quartz Background"
      priority={true}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          touchAction: 'pan-x',
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
                Travel & Stay
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
                // Only trigger on tap/click, not drag
                // Get the bounding rect of the Box
                const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                const x = e.clientX - rect.left; // x position within the element
                if (x < rect.width / 2) {
                  // Tap on left half
                  handleSlideChange('prev');
                } else {
                  // Tap on right half
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
                {travelData.map((card, index) => (
                  <TravelCard
                    key={index}
                    title={card.title}
                    content={card.content}
                    image={card.image}
                    isActive={index === currentSlide}
                    buttonText={card.buttonText}
                    isDisabled={card.isDisabled}
                    onButtonClick={card.onButtonClick}
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
                  disabled={currentSlide === travelData.length - 1}
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

        {/* Bottom indicators and home indicator */}
        <Box
          sx={{
            position: 'relative',
            zIndex: 3,
            flexShrink: 0,
          }}
        >
          {/* Diamond indicators */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mb: 2,
              mt: 4,
            }}
          >
            <DiamondIndicators total={travelData.length} current={currentSlide} />
          </Box>
        </Box>
      </Box>
    </OptimizedBackground>
  );
}