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
import { useRouter, useParams } from 'next/navigation';
import { ArrowBack, ChevronLeft, ChevronRight } from '@mui/icons-material';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useState, useEffect } from 'react';
import OptimizedBackground from '@/components/ui/OptimizedBackground';
import WhatsAppChannelModal from '@/components/shared/WhatsAppChannelModal';
import AppHeader from '@/components/shared/AppHeader';
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
  onButtonClick,
  isWhatsAppButton
}: { 
  title: string; 
  content: React.ReactNode[]; 
  image?: string; 
  isActive: boolean;
  buttonText?: string;
  isDisabled?: boolean;
  onButtonClick?: () => void;
  isWhatsAppButton?: boolean;
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
      height: '75svh', // Use small viewport height to account for mobile browser chrome
      minHeight: '500px', // Minimum height for smaller screens
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '0 16px', // Add horizontal padding for smaller screens
    }}
  >
    <Card
      sx={{
        width: '100%',
        maxWidth: { xs: 361, md: 600, lg: 700 },
        height: { xs: '100%', md: '88svh', lg: '90svh' },
        mx: { xs: 0, md: 2 }, // Additional margin on medium+ screens
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
          p: { xs: 2.5, md: 4, lg: 5 },
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
        }}
      >
        <Stack spacing={{ xs: 1, md: 2 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 400,
              fontSize: { xs: 28, md: 36, lg: 40 },
              lineHeight: 1.3,
              color: '#141414',
              textAlign: 'left',
            }}
          >
            {title}
          </Typography>
          <Stack spacing={{ xs: 1, md: 1 }}>
            {content.map((paragraph, index) => (
              <Typography
                key={index}
                variant="body1"
                component="div"
                sx={{
                  fontWeight: 400,
                  fontSize: { xs: 16, md: 18, lg: 20 },
                  lineHeight: 1.5,
                  color: '#474747',
                  textAlign: 'left',
                }}
              >
                {paragraph}
              </Typography>
            ))}
          </Stack>
        </Stack>
        {/* Spacer to push button to bottom */}
        <Box sx={{ flex: 1 }} />
        
        {buttonText && (
          <Box sx={{ mt: 'auto', pt: { xs: 3, md: 4 } }}>
            <Button
              variant={isWhatsAppButton ? "contained" : "outlined"}
              disabled={isDisabled}
              onClick={onButtonClick}
              sx={{
                width: '100%',
                borderRadius: 80,
                padding: { xs: '12px 20px', md: '16px 28px' },
                textTransform: 'uppercase',
                fontWeight: 700,
                fontSize: { xs: 16, md: 18, lg: 20 },
                letterSpacing: '6.25%',
                ...(isWhatsAppButton ? {
                  backgroundColor: isDisabled ? '#BCBCBC' : '#000',
                  color: '#fff',
                  '&:hover': {
                    backgroundColor: isDisabled ? '#BCBCBC' : '#333',
                  },
                } : {
                  color: isDisabled ? '#BCBCBC' : '#DE3F5E',
                  borderColor: isDisabled ? '#BCBCBC' : '#DE3F5E',
                })
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
          src={image}
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
  const params = useParams();
  const weddingId = params.weddingSlug as string;

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const router = useRouter();
  const { user, hasRSVPed, rsvpResponse } = useAuth();

  // Only show WhatsApp button if user has RSVP'd "yes" or "maybe"
  const shouldShowWhatsApp = hasRSVPed && (rsvpResponse === 'yes' || rsvpResponse === 'maybe');
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);

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
      content: [
        "Your rooms at The Palayana are taken care of for January 4th & 5th. Get ready to celebrate right on the beach - the resort is absolutely gorgeous!",
        "We'll share room assignments closer to the date."
      ],
      image: "/images/travel_stay/1.png",
    },
    {
      title: "Book additional nights at The Palayana 🏝️",
      content: [
        <>Want to stay longer? Book additional nights as soon as possible since the hotel fills up fast! Use the link below or email <a href={`mailto:vidhi@thepalayana.com?cc=booking@thepalayana.com&subject=${encodeURIComponent('Phera Wedding - ' + weddingId + ' - Additional Nights')}&body=Requesting%20additional%20nights%20for%20[dates].`} style={{color: '#DE3F5E', textDecoration: 'none'}}>vidhi@thepalayana.com</a> and CC <a href={`mailto:booking@thepalayana.com?cc=vidhi@thepalayana.com&subject=${encodeURIComponent('Phera Wedding - ' + weddingId + ' - Additional Nights')}&body=Requesting%20additional%20nights%20for%20[dates].`} style={{color: '#DE3F5E', textDecoration: 'none'}}>booking@thepalayana.com</a> if you'd prefer to stay in the same room we assign to you for the 4th and 5th.</>
      ],
      image: "/images/travel_stay/2.png",
      buttonText: "booking link",
      onButtonClick: () => window.open('https://bit.ly/45TiuuI', '_blank'),
    },
    {
      title: "Coming to Bangkok first? 🏙️",
      content: [
        "If you're planning to arrive early, we'll be in Bangkok for New Year's Eve. No formal plans yet, but you're welcome to join whatever we end up doing.",
        "Plus, Bangkok is ‘the best city in world’ according to Sim so it’s worth the trip 👀"
      ],
      image: "/images/travel_stay/3.png",
      buttonText: "Sim’s bangkok guide",
      onButtonClick: () => window.open('https://docs.google.com/document/d/1JedCbzdZkMiRaI37d-5wP59qipdAJW97RPLkTMx6reI/edit?tab=t.0', '_blank'),
    },
    {
      title: "Where to stay in Bangkok 🗺️",
      content: [
        "Sukhumvit (Asok, Phrom Phong, Thong Lo) is our top pick for max convenience - food, nightlife, shopping, it’s the heart of the city. And it’s where Sim grew up!",
        "Silom/Sathorn for a quieter residential vibe, Riverside for fancy hotels and upscale vibes, Chinatown if you’re looking for a local experience and boutique hotels (or ratchet hostels 😜)."
      ],
      image: "/images/travel_stay/4.png",
    },
    {
      title: "Getting to Hua Hin 🚌",
      content: [
        "Hua Hin is a ~3-hour drive from Bangkok. We can help organize transportation for your group (more info on this coming soon). Transportation will cost $25-$35 per person for a round trip.",
        "You can also rent a car if you prefer to drive yourself - just remember they drive on the left side of the road!",
        "FYI, celebrations start in Hua Hin at 12pm on Jan 4th so we highly recommend arriving in Bangkok by at least Jan 3rd."
      ],
      image: "/images/travel_stay/5.png",
    },
    {
      title: "Weather &  what to expect 🌤️",
      content: [
        "January weather is lovely - around 75-85°F (24-29°C). Pack light and bring sunscreen!",
        "There are specific dress codes for each wedding event, so check the link below for details."
      ],
      image: "/images/travel_stay/6.png",
      buttonText: "Dress Code",
      onButtonClick: () => router.push(`/${weddingId}/events`),
    },
    {
      title: "Money stuff 💰",
      content: [
        "Thailand uses Thai Baht (roughly 1 USD = 35 THB, 1 INR = 0.4 THB). We recommend getting cash from a currency exchange since ATMs here have high fees.",
        "Most places accept cards, but local stores and 7-Elevens will require cash."
      ],
      image: "/images/travel_stay/7.png",
    },
    {
      title: "Staying in touch 📱",
      content: [
        "We'll be using WhatsApp for updates and coordination so make sure you have the app downloaded on your phone.",
        "Download the app and use the button below to join our wedding channel!"
      ],
      image: "/images/travel_stay/8.png",
      buttonText: "Join Whatsapp Channel",
      isDisabled: !shouldShowWhatsApp, // Disable if user can't access WhatsApp
      isWhatsAppButton: true,
      onButtonClick: () => {
        // Only show WhatsApp modal if user has RSVP'd "yes" or "maybe"
        if (shouldShowWhatsApp) {
          setWhatsAppModalOpen(true);
        }
      },
    },
    {
      title: "We're so excited to celebrate with you! 🎉",
      content: [
        "That's everything you should need for now! If you have any questions about travel, the wedding, or anything else, just reach out - we're always happy to help."
      ],
      image: "/images/travel_stay/9.png",
      buttonText: "Back to menu",
      onButtonClick: () => router.push(`/${weddingId}/details`),
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
          minHeight: '100svh',
          overflow: 'hidden',
          touchAction: 'pan-x',
        }}
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
              backHref={`/${weddingId}/details`}
            />
          </Box>
        )}

        {/* Mobile Header with back button */}
        {isMobile && (
          <Box
            sx={{
              position: 'relative',
              zIndex: 2,
              pt: 2,
              pb: 2,
              flexShrink: 0,
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
        )}

        {/* Main carousel content */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            zIndex: 2,
            // py: { xs: 2, md: 4 },
          }}
        >
          <Stack spacing={2} alignItems="center" sx={{ width: '100%' }}>
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
                    isWhatsAppButton={card.isWhatsAppButton}
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
                    width: 48,
                    height: 48,
                    color: '#000',
                    backgroundColor: 'rgba(255, 255, 255, 0.5)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.7)',
                    },
                    '&:disabled': {
                      opacity: 0.3,
                    },
                  }}
                >
                  <ChevronLeft sx={{ fontSize: 32 }} />
                </IconButton>
                <IconButton
                  onClick={() => handleSlideChange('next')}
                  disabled={currentSlide === travelData.length - 1}
                  sx={{
                    width: 48,
                    height: 48,
                    color: '#000',
                    backgroundColor: 'rgba(255, 255, 255, 0.5)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.7)',
                    },
                    '&:disabled': {
                      opacity: 0.3,
                    },
                  }}
                >
                  <ChevronRight sx={{ fontSize: 32 }} />
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

      {/* WhatsApp Channel Modal */}
      <WhatsAppChannelModal 
        open={whatsAppModalOpen}
        onClose={() => setWhatsAppModalOpen(false)}
      />
    </OptimizedBackground>
  );
}