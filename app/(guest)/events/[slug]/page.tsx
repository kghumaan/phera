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
import { ArrowBack, ChevronLeft, ChevronRight } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import Image from 'next/image';
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
  isActive,
  index,
  isImage = false,
  imageSrc,
  eventSlug
}: { 
  title: string; 
  content: React.ReactNode; 
  isActive: boolean;
  index?: number;
  isImage?: boolean;
  imageSrc?: string;
  eventSlug?: string;
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
      height: '70vh', // Responsive height instead of fixed calculation
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
        maxWidth: { xs: 361, md: 600, lg: 700 },
        height: { xs: '100%', md: '96vh', lg: '96vh' },
        backgroundColor: (index === 0 || index === 2 || index === 4 || index === 6 || index === 8 || index === 10) ? 'transparent' : isImage ? '#FFFFFF' : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: (index === 0 || index === 2 || index === 4 || index === 6 || index === 8 || index === 10) ? 'none' : isImage ? 'none' : 'blur(10px)',
        borderRadius: '16px',
        boxShadow: '0px 0px 32px 0px rgba(0, 0, 0, 0.16)',
        border: (index === 0 || index === 2 || index === 4 || index === 6 || index === 8 || index === 10) ? '2px solid #FFFFFF' : isImage ? '2px solid #FFFFFF' : 'none',
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        backgroundImage: (index === 0 || index === 2 || index === 4 || index === 6 || index === 8 || index === 10) ? 
          `url(/images/backgrounds/Gradient${eventSlug === 'reception' ? 'Reception' : eventSlug === 'baraat-varmala-jaggo' ? 'Jaggo' : eventSlug === 'anand-karaj' ? 'CottonCandy' : eventSlug === 'pool-party' ? 'PoolParty' : 'Yellow'}.png)` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <CardContent
        sx={{
          p: isImage ? 0 : { xs: 3, md: 4, lg: 5 },
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {isImage && imageSrc ? (
          <Image
            src={imageSrc}
            alt={title}
            fill
            style={{
              objectFit: 'cover',
              borderRadius: '16px',
            }}
            sizes="(max-width: 768px) 100vw, 361px"
            priority={isActive}
          />
        ) : (index === 0 || index === 2 || index === 4 || index === 6 || index === 8 || index === 10) ? (
          content
        ) : (
          <Stack spacing={{ xs: 2, md: 3 }} alignItems="center">
            <Typography
              variant="h4"
              sx={{
                fontFamily: 'Outfit',
                fontWeight: 300,
                fontSize: { xs: 28, md: 36, lg: 40 },
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
                fontSize: { xs: 16, md: 18, lg: 20 },
                lineHeight: 1.5,
                color: '#474747',
              }}
            >
              {content}
            </Typography>
          </Stack>
        )}
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
    dress_code: 'Vibrant Indian Festive',
    dress_code_emoji: '🎊',
    date: 'January 4',
    time: '3:30 PM',
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
    dress_code_emoji: '🤵🏽',
    date: 'January 5',
    time: '7:30 PM',
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

  // Get dynamic content based on the event
  const getEventContent = (slug: string) => {
    switch (slug) {
      case 'welcome-lunch-haldi':
        return getHaldiContent();
      case 'baraat-varmala-jaggo':
        return getBaraatContent();
      case 'anand-karaj':
        return getAnandKarajContent();
      case 'pool-party':
        return getPoolPartyContent();
      case 'reception':
        return getReceptionContent();
      case 'after-party':
        return getAfterPartyContent();
      default:
        return getHaldiContent();
    }
  };

  // Haldi event content
  const getHaldiContent = () => [
    // Slide 1 - Dress code content
    {
      title: "Dress code",
      content: (
        <Stack spacing={3} alignItems="center" sx={{ position: 'relative', zIndex: 2 }}>
          <Typography 
            variant="subtitle2"
            sx={{ 
              fontFamily: 'Outfit',
              fontWeight: 600,
              fontSize: 16,
              lineHeight: 1.5,
              letterSpacing: '0.0625em',
              textTransform: 'uppercase',
              color: '#141414',
              opacity: 0.4,
              textAlign: 'center'
            }}
          >
            Dress code
          </Typography>
          
          <Typography 
            variant="h2"
            sx={{ 
              fontFamily: 'Instrument Serif',
              fontWeight: 400,
              fontSize: 40,
              lineHeight: 1.3,
              textTransform: 'capitalize',
              color: '#141414',
              textAlign: 'center',
              fontStyle: 'italic',
              mb: 1
            }}
          >
            Shades of yellow
          </Typography>
          
          <Typography 
            variant="body1"
            sx={{ 
              fontFamily: 'Outfit',
              fontWeight: 300,
              fontSize: 16,
              lineHeight: 1.5,
              color: '#141414',
              textAlign: 'center',
              maxWidth: 281,
              px: 2
            }}
          >
            Sunlit hues of yellow → light linens, cotton kurtas, floaty dresses (you might get messy). And don't forget your sunglasses!
          </Typography>
        </Stack>
      )
    },
    // Slide 2 - Image 1
    {
      title: "Image 1",
      content: null,
      isImage: true,
      imageSrc: "/images/carousel/haldi/1.png"
    },
    // Slide 3 - Outfit Ideas content
    {
      title: "Outfit Ideas",
      content: (
        <Stack spacing={4} alignItems="center" sx={{ position: 'relative', zIndex: 2 }}>
          {/* Women Section */}
          <Box sx={{ textAlign: 'center', width: '100%' }}>
            <Typography 
              variant="subtitle2"
              sx={{ 
                fontFamily: 'Outfit',
                fontWeight: 600,
                fontSize: { xs: 16, md: 18, lg: 20 },
                lineHeight: 1.5,
                letterSpacing: '0.0625em',
                textTransform: 'uppercase',
                color: '#141414',
                opacity: 0.4,
                textAlign: 'center',
                mb: 2
              }}
            >
              Women
            </Typography>
            
            <Stack spacing={1} sx={{ mb: 3 }}>
              {['Kaftans', 'Salwar Kameez', 'Sundresses', 'Co-ord Sets'].map((item) => (
                <Typography 
                  key={item}
                  variant="h6"
                  sx={{ 
                    fontFamily: 'Instrument Serif',
                    fontWeight: 400,
                    fontSize: { xs: 28, md: 34, lg: 38 },
                    lineHeight: 1.3,
                    textTransform: 'capitalize',
                    color: '#141414',
                    textAlign: 'center',
                    fontStyle: 'italic',
                  }}
                >
                  {item}
                </Typography>
              ))}
            </Stack>
          </Box>

          {/* Men Section */}
          <Box sx={{ textAlign: 'center', width: '100%' }}>
            <Typography 
              variant="subtitle2"
              sx={{ 
                fontFamily: 'Outfit',
                fontWeight: 600,
                fontSize: { xs: 16, md: 18, lg: 20 },
                lineHeight: 1.5,
                letterSpacing: '0.0625em',
                textTransform: 'uppercase',
                color: '#141414',
                opacity: 0.4,
                textAlign: 'center',
                mb: 2
              }}
            >
              Men
            </Typography>
            
            <Stack spacing={1}>
              {['Linen Shirts', 'Cotton Kurtas'].map((item) => (
                <Typography 
                  key={item}
                  variant="h6"
                  sx={{ 
                    fontFamily: 'Instrument Serif',
                    fontWeight: 400,
                    fontSize: { xs: 28, md: 34, lg: 38 },
                    lineHeight: 1.3,
                    textTransform: 'capitalize',
                    color: '#141414',
                    textAlign: 'center',
                    fontStyle: 'italic',
                  }}
                >
                  {item}
                </Typography>
              ))}
            </Stack>
          </Box>
        </Stack>
      )
    },
    // Slide 4 - Image 2
    {
      title: "Image 2",
      content: null,
      isImage: true,
      imageSrc: "/images/carousel/haldi/2.png"
    },
    // Slide 5 - What It Is content
    {
      title: "What It Is",
      content: (
        <Stack spacing={3} alignItems="center" sx={{ position: 'relative', zIndex: 2 }}>
          <Typography 
            variant="subtitle2"
            sx={{ 
              fontFamily: 'Outfit',
              fontWeight: 600,
              fontSize: 16,
              lineHeight: 1.5,
              letterSpacing: '0.0625em',
              textTransform: 'uppercase',
              color: '#141414',
              opacity: 0.4,
              textAlign: 'center'
            }}
          >
            The Ritual
          </Typography>
          
          <Typography 
            variant="h2"
            sx={{ 
              fontFamily: 'Instrument Serif',
              fontWeight: 400,
              fontSize: 40,
              lineHeight: 1.3,
              textTransform: 'capitalize',
              color: '#141414',
              textAlign: 'center',
              mb: 1,
              fontStyle: 'italic',
            }}
          >
            Haldi
          </Typography>
          
          <Typography 
            variant="body1"
            sx={{ 
              fontFamily: 'Outfit',
              fontWeight: 300,
              fontSize: 16,
              lineHeight: 1.5,
              color: '#141414',
              textAlign: 'center',
              maxWidth: 281,
              px: 2
            }}
          >
            A joyful ceremony where family and friends smear the couple with turmeric-paste - symbolizing purity, protection, and a radiant glow for the big day.
          </Typography>
        </Stack>
      )
    },
    // Slide 6 - Image 3
    {
      title: "Image 3",
      content: null,
      isImage: true,
      imageSrc: "/images/carousel/haldi/3.png"
    },
    // Slide 7 - Why it Matters content
    {
      title: "Why it Matters",
      content: (
        <Stack spacing={3} alignItems="center" sx={{ position: 'relative', zIndex: 2 }}>
          <Typography 
            variant="subtitle2"
            sx={{ 
              fontFamily: 'Outfit',
              fontWeight: 600,
              fontSize: 16,
              lineHeight: 1.5,
              letterSpacing: '0.0625em',
              textTransform: 'uppercase',
              color: '#141414',
              opacity: 0.4,
              textAlign: 'center'
            }}
          >
            The Ritual
          </Typography>
          
          <Typography 
            variant="h2"
            sx={{ 
              fontFamily: 'Instrument Serif',
              fontWeight: 400,
              fontSize: 40,
              lineHeight: 1.3,
              textTransform: 'capitalize',
              color: '#141414',
              textAlign: 'center',
              mb: 1,
              fontStyle: 'italic',
            }}
          >
            Mehendi
          </Typography>
          
          <Typography 
            variant="body1"
            sx={{ 
              fontFamily: 'Outfit',
              fontWeight: 300,
              fontSize: 16,
              lineHeight: 1.5,
              color: '#141414',
              textAlign: 'center',
              maxWidth: 281,
              px: 2
            }}
          >
            Live henna artists weave intricate patterns on your hands and feet—an ancient symbol of luck, love, and festive camaraderie.
          </Typography>
        </Stack>
      )
    },
    // Slide 8 - Image 4
    {
      title: "Image 4",
      content: null,
      isImage: true,
      imageSrc: "/images/carousel/haldi/4.png"
    },
  ];

  // Baraat event content
  const getBaraatContent = () => [
    // Slide 1 - Dress code content
    {
      title: "Dress code",
      content: (
        <Stack spacing={3} alignItems="center" sx={{ position: 'relative', zIndex: 2 }}>
          <Typography 
            variant="subtitle2"
            sx={{ 
              fontFamily: 'Outfit',
              fontWeight: 600,
              fontSize: 16,
              lineHeight: 1.5,
              letterSpacing: '0.0625em',
              textTransform: 'uppercase',
              color: '#FFFFFF',
              opacity: 0.7,
              textAlign: 'center'
            }}
          >
            Dress code
          </Typography>
          
          <Typography 
            variant="h2"
            sx={{ 
              fontFamily: 'Instrument Serif',
              fontWeight: 400,
              fontSize: 40,
              lineHeight: 1.3,
              textTransform: 'capitalize',
              color: '#FFFFFF',
              textAlign: 'center',
              mb: 1,
              fontStyle: 'italic',  
            }}
          >
            Vibrant Indian Festive
          </Typography>
          
          <Typography 
            variant="body1"
            sx={{ 
              fontFamily: 'Outfit',
              fontWeight: 300,
              fontSize: 16,
              lineHeight: 1.5,
              color: '#FFFFFF',
              textAlign: 'center',
              maxWidth: 281,
              px: 2
            }}
          >
            Keep it bright, colorful, and breezy—opt for lightweight silks, cotton-silk blends, chiffon or georgette in jewel tones and bold prints.
          </Typography>
        </Stack>
      )
    },
    // Slide 2 - Image 1
    {
      title: "Image 1",
      content: null,
      isImage: true,
      imageSrc: "/images/carousel/jaggo/1.png"
    },
    // Slide 3 - Outfit Ideas content
    {
      title: "Outfit Ideas",
      content: (
        <Stack spacing={4} alignItems="center" sx={{ position: 'relative', zIndex: 2 }}>
          <Box sx={{ textAlign: 'center', width: '100%' }}>
            <Typography 
              variant="subtitle2"
              sx={{ 
                fontFamily: 'Outfit',
                fontWeight: 600,
                fontSize: { xs: 16, md: 18, lg: 20 },
                lineHeight: 1.5,
                letterSpacing: '0.0625em',
                textTransform: 'uppercase',
                color: '#FFFFFF',
                opacity: 0.7,
                textAlign: 'center',
                mb: 2
              }}
            >
              Women
            </Typography>
            
            <Stack spacing={1} sx={{ mb: 3 }}>
              {[`Anarkali`, `Lehenga`, `Salwar Kameez`, `Co-ord Sets`].map((item) => (
                <Typography 
                  key={item}
                  variant="h6"
                  sx={{ 
                    fontFamily: 'Instrument Serif',
                    fontWeight: 400,
                    fontSize: { xs: 28, md: 34, lg: 38 },
                    lineHeight: 1.3,
                    textTransform: 'capitalize',
                    color: '#FFFFFF',
                    textAlign: 'center',
                    fontStyle: 'italic',
                  }}
                >
                  {item}
                </Typography>
              ))}
            </Stack>
          </Box>

          <Box sx={{ textAlign: 'center', width: '100%' }}>
            <Typography 
              variant="subtitle2"
              sx={{ 
                fontFamily: 'Outfit',
                fontWeight: 600,
                fontSize: { xs: 16, md: 18, lg: 20 },
                lineHeight: 1.5,
                letterSpacing: '0.0625em',
                textTransform: 'uppercase',
                color: '#FFFFFF',
                opacity: 0.7,
                textAlign: 'center',
                mb: 2
              }}
            >
              Men
            </Typography>
            
            <Stack spacing={1}>
              {[`Kurta Sets`, `Patterned Vests`, `Bandhgalas`].map((item) => (
                <Typography 
                  key={item}
                  variant="h6"
                  sx={{ 
                    fontFamily: 'Instrument Serif',
                    fontWeight: 400,
                    fontSize: { xs: 28, md: 34, lg: 38 },
                    lineHeight: 1.3,
                    textTransform: 'capitalize',
                    color: '#FFFFFF',
                    textAlign: 'center',
                    fontStyle: 'italic',
                  }}
                >
                  {item}
                </Typography>
              ))}
            </Stack>
          </Box>
        </Stack>
      )
    },
    // Slide 4 - Image 2
    {
      title: "Image 2",
      content: null,
      isImage: true,
      imageSrc: "/images/carousel/jaggo/2.png"
    },
    // Slide 5 - Varmala What It Is content
    {
      title: "What It Is",
      content: (
        <Stack spacing={3} alignItems="center" sx={{ position: 'relative', zIndex: 2 }}>
          <Typography 
            variant="subtitle2"
            sx={{ 
              fontFamily: 'Outfit',
              fontWeight: 600,
              fontSize: 16,
              lineHeight: 1.5,
              letterSpacing: '0.0625em',
              textTransform: 'uppercase',
              color: '#FFFFFF',
              opacity: 0.4,
              textAlign: 'center'
            }}
          >
            The Vibe
          </Typography>
          
          <Typography 
            variant="h2"
            sx={{ 
              fontFamily: 'Instrument Serif',
              fontWeight: 400,
              fontSize: 40,
              lineHeight: 1.3,
              textTransform: 'capitalize',
              color: '#FFFFFF',
              textAlign: 'center',
              mb: 1,
              fontStyle: 'italic',
            }}
          >
            Baraat
          </Typography>
          
          <Typography 
            variant="body1"
            sx={{ 
              fontFamily: 'Outfit',
              fontWeight: 300,
              fontSize: 16,
              lineHeight: 1.5,
              color: '#FFFFFF',
              textAlign: 'center',
              maxWidth: 281,
              px: 2
            }}
          >
            Groom’s crew bursts in on drums and trumpets, dancing him straight into the venue—an electrifying welcome that kicks off the celebration.
          </Typography>
        </Stack>
      )
    },
    // Slide 6 - Image 3
    {
      title: "Image 3",
      content: null,
      isImage: true,
      imageSrc: "/images/carousel/jaggo/3.png"
    },
    // Slide 7 - Jaggo What It Is content
    {
      title: "What It Is",
      content: (
        <Stack spacing={3} alignItems="center" sx={{ position: 'relative', zIndex: 2 }}>
          <Typography 
            variant="subtitle2"
            sx={{ 
              fontFamily: 'Outfit',
              fontWeight: 600,
              fontSize: 16,
              lineHeight: 1.5,
              letterSpacing: '0.0625em',
              textTransform: 'uppercase',
              color: '#FFFFFF',
              opacity: 0.4,
              textAlign: 'center'
            }}
          >
            The Moment
          </Typography>
          
          <Typography 
            variant="h2"
            sx={{ 
              fontFamily: 'Instrument Serif',
              fontWeight: 400,
              fontSize: 40,
              lineHeight: 1.3,
              textTransform: 'capitalize',
              color: '#FFFFFF',
              textAlign: 'center',
              mb: 1,
              fontStyle: 'italic',
            }}
          >
            Varmala & Vows
          </Typography>
          
          <Typography 
            variant="body1"
            sx={{ 
              fontFamily: 'Outfit',
              fontWeight: 300,
              fontSize: 16,
              lineHeight: 1.5,
              color: '#FFFFFF',
              textAlign: 'center',
              maxWidth: 281,
              px: 2
            }}
          >
        On the mandap, the couple swaps floral garlands and shares personal vows—an equal, heartfelt promise in one picture-perfect instant.          </Typography>
        </Stack>
      )
    },
    // Slide 8 - Image 4
    {
      title: "Image 4",
      content: null,
      isImage: true,
      imageSrc: "/images/carousel/jaggo/4.png"
    },
    // Slide 9 - Music & Dance content
    {
      title: "Music & Dance",
      content: (
        <Stack spacing={3} alignItems="center" sx={{ position: 'relative', zIndex: 2 }}>
          <Typography 
            variant="subtitle2"
            sx={{ 
              fontFamily: 'Outfit',
              fontWeight: 600,
              fontSize: 16,
              lineHeight: 1.5,
              letterSpacing: '0.0625em',
              textTransform: 'uppercase',
              color: '#FFFFFF',
              opacity: 0.4,
              textAlign: 'center'
            }}
          >
            The Ritual
          </Typography>
          
          <Typography 
            variant="h2"
            sx={{ 
              fontFamily: 'Instrument Serif',
              fontWeight: 400,
              fontSize: 40,
              lineHeight: 1.3,
              textTransform: 'capitalize',
              color: '#FFFFFF',
              textAlign: 'center',
              mb: 1,
              fontStyle: 'italic',
            }}
          >
            Jaggo
          </Typography>
          
          <Typography 
            variant="body1"
            sx={{ 
              fontFamily: 'Outfit',
              fontWeight: 300,
              fontSize: 16,
              lineHeight: 1.5,
              color: '#FFFFFF',
              textAlign: 'center',
              maxWidth: 281,
              px: 2
            }}
          >
        After dinner, the night ignites into a Punjabi “wake-up” party—guests circle the dance floor to pounding dhol and swirling dupattas, celebrating under lantern-lit trees.           </Typography>
        </Stack>
      )
    },
    // Slide 10 - Image 5
    {
      title: "Image 5",
      content: null,
      isImage: true,
      imageSrc: "/images/carousel/jaggo/5.png"
    },
  ];

  // Anand Karaj event content
  const getAnandKarajContent = () => [
    // Slide 1 - Dress code content
    {
      title: "Dress code",
      content: (
        <Stack spacing={3} alignItems="center" sx={{ position: 'relative', zIndex: 2 }}>
          <Typography 
            variant="subtitle2"
            sx={{ 
              fontFamily: 'Outfit',
              fontWeight: 600,
              fontSize: 16,
              lineHeight: 1.5,
              letterSpacing: '0.0625em',
              textTransform: 'uppercase',
              color: '#141414',
              opacity: 0.4,
              textAlign: 'center'
            }}
          >
            Dress code
          </Typography>
          
          <Typography 
            variant="h2"
            sx={{ 
              fontFamily: 'Instrument Serif',
              fontWeight: 400,
              fontSize: 40,
              lineHeight: 1.3,
              textTransform: 'capitalize',
              color: '#141414',
              textAlign: 'center',
              fontStyle: 'italic',
              mb: 1
            }}
          >
            Traditional Indian - Pastels
          </Typography>
          
          <Typography 
            variant="body1"
            sx={{ 
              fontFamily: 'Outfit',
              fontWeight: 300,
              fontSize: 16,
              lineHeight: 1.5,
              color: '#141414',
              textAlign: 'center',
              maxWidth: 281,
              px: 2
            }}
          >
            Show up in soft blush, mint, and lavender—think light chiffons or cotton‐silk kurtas and flowy dupattas. A head covering is required for this sacred Anand Karaj ceremony. Please no reds!
          </Typography>
        </Stack>
      )
    },
    // Slide 2 - Image 1
    {
      title: "Image 1",
      content: null,
      isImage: true,
      imageSrc: "/images/carousel/anand_karaj/1.png"
    },
    // Slide 3 - Traditional Outfit Ideas from Figma
    {
      title: "Traditional Outfit Ideas",
      content: (
        <Stack spacing={4} alignItems="center" sx={{ position: 'relative', zIndex: 2 }}>
          {/* Women Section */}
          <Box sx={{ textAlign: 'center', width: '100%' }}>
            <Typography 
              variant="subtitle2"
              sx={{ 
                fontFamily: 'Outfit',
                fontWeight: 600,
                fontSize: { xs: 16, md: 18, lg: 20 },
                lineHeight: 1.5,
                letterSpacing: '0.0625em',
                textTransform: 'uppercase',
                color: '#141414',
                opacity: 0.4,
                textAlign: 'center',
                mb: 2
              }}
            >
              Women
            </Typography>
            
            <Stack spacing={1} sx={{ mb: 3 }}>
              {['Lehengas', 'Anarkalis', 'Sarees', 'Salwar Kameez'].map((item) => (
                <Typography 
                  key={item}
                  variant="h6"
                  sx={{ 
                    fontFamily: 'Instrument Serif',
                    fontWeight: 400,
                    fontSize: { xs: 28, md: 34, lg: 38 },
                    lineHeight: 1.3,
                    textTransform: 'capitalize',
                    color: '#141414',
                    textAlign: 'center',
                    fontStyle: 'italic',
                  }}
                >
                  {item}
                </Typography>
              ))}
            </Stack>
          </Box>

          {/* Men Section */}
          <Box sx={{ textAlign: 'center', width: '100%' }}>
            <Typography 
              variant="subtitle2"
              sx={{ 
                fontFamily: 'Outfit',
                fontWeight: 600,
                fontSize: { xs: 16, md: 18, lg: 20 },
                lineHeight: 1.5,
                letterSpacing: '0.0625em',
                textTransform: 'uppercase',
                color: '#141414',
                opacity: 0.4,
                textAlign: 'center',
                mb: 2
              }}
            >
              Men
            </Typography>
            
            <Stack spacing={1}>
              {['Kurta Sets', 'Summer Suits', 'Sherwanis', 'Bandhgalas'].map((item) => (
                <Typography 
                  key={item}
                  variant="h6"
                  sx={{ 
                    fontFamily: 'Instrument Serif',
                    fontWeight: 400,
                    fontSize: { xs: 28, md: 34, lg: 38 },
                    lineHeight: 1.3,
                    textTransform: 'capitalize',
                    color: '#141414',
                    textAlign: 'center',
                    fontStyle: 'italic',
                  }}
                >
                  {item}
                </Typography>
              ))}
            </Stack>
          </Box>
        </Stack>
      )
    },
    // Slide 4 - Image 2
    {
      title: "Image 2",
      content: null,
      isImage: true,
      imageSrc: "/images/carousel/anand_karaj/2.png"
    },
    // Slide 5 - The Ceremony content from Figma
    {
      title: "The Ceremony",
      content: (
        <Stack spacing={3} alignItems="center" sx={{ position: 'relative', zIndex: 2 }}>
          <Typography 
            variant="subtitle2"
            sx={{ 
              fontFamily: 'Outfit',
              fontWeight: 600,
              fontSize: 16,
              lineHeight: 1.5,
              letterSpacing: '0.0625em',
              textTransform: 'uppercase',
              color: '#141414',
              opacity: 0.4,
              textAlign: 'center'
            }}
          >
            The ceremony
          </Typography>
          
          <Typography 
            variant="h2"
            sx={{ 
              fontFamily: 'Instrument Serif',
              fontWeight: 400,
              fontSize: 40,
              lineHeight: 1.3,
              textTransform: 'capitalize',
              color: '#141414',
              textAlign: 'center',
              mb: 1,
              fontStyle: 'italic',
            }}
          >
            Anand Karaj
          </Typography>
          
          <Typography 
            variant="body1"
            sx={{ 
              fontFamily: 'Outfit',
              fontWeight: 300,
              fontSize: 16,
              lineHeight: 1.5,
              color: '#141414',
              textAlign: 'center',
              maxWidth: 281,
              px: 2
            }}
          >
            A sacred Sikh ceremony where the couple circles the Guru Granth Sahib four times—each lap sealing vows through timeless hymns and equal partnership.
          </Typography>
        </Stack>
      )
    },
    // Slide 6 - Image 3
    {
      title: "Image 3",
      content: null,
      isImage: true,
      imageSrc: "/images/carousel/anand_karaj/3.png"
    }
  ];

  // Pool Party event content
  const getPoolPartyContent = () => [
    // Slide 1 - Dress code from Figma
    {
      title: "Dress code",
      content: (
        <Stack spacing={3} alignItems="center" sx={{ position: 'relative', zIndex: 2 }}>
          <Typography 
            variant="subtitle2"
            sx={{ 
              fontFamily: 'Outfit',
              fontWeight: 600,
              fontSize: 16,
              lineHeight: 1.5,
              letterSpacing: '0.0625em',
              textTransform: 'uppercase',
              color: '#141414',
              opacity: 0.4,
              textAlign: 'center'
            }}
          >
            Dress code
          </Typography>
          
          <Typography 
            variant="h2"
            sx={{ 
              fontFamily: 'Instrument Serif',
              fontWeight: 400,
              fontSize: 40,
              lineHeight: 1.3,
              textTransform: 'capitalize',
              color: '#141414',
              textAlign: 'center',
              fontStyle: 'italic',
              mb: 1
            }}
          >
            Boho Beach Festival
          </Typography>
          
          <Typography 
            variant="body1"
            sx={{ 
              fontFamily: 'Outfit',
              fontWeight: 300,
              fontSize: 16,
              lineHeight: 1.5,
              color: '#141414',
              textAlign: 'center',
              maxWidth: 281,
              px: 2
            }}
          >
            Day-Party Festival Vibes—bright swimwear under flowy kimonos or mesh cover-ups, oversized shades, and comfy slides or sandals.
          </Typography>
        </Stack>
      )
    },
    // Slide 2 - Image 1
    {
      title: "Image 1",
      content: null,
      isImage: true,
      imageSrc: "/images/carousel/pool_party/1.png"
    },
    // Slide 3 - Outfit Ideas content
    {
      title: "Outfit Ideas",
      content: (
        <Stack spacing={4} alignItems="center" sx={{ position: 'relative', zIndex: 2 }}>
          {/* Women Section */}
          <Box sx={{ textAlign: 'center', width: '100%' }}>
            <Typography 
              variant="subtitle2"
              sx={{ 
                fontFamily: 'Outfit',
                fontWeight: 600,
                fontSize: { xs: 16, md: 18, lg: 20 },
                lineHeight: 1.5,
                letterSpacing: '0.0625em',
                textTransform: 'uppercase',
                color: '#141414',
                opacity: 0.4,
                textAlign: 'center',
                mb: 2
              }}
            >
              Women
            </Typography>
            
            <Stack spacing={1} sx={{ mb: 3 }}>
              {['Swimsuits', 'Mesh Cover-ups', 'Flowy Kimonos', 'Crochet Tops'].map((item) => (
                <Typography 
                  key={item}
                  variant="h6"
                  sx={{ 
                    fontFamily: 'Instrument Serif',
                    fontWeight: 400,
                    fontSize: { xs: 28, md: 34, lg: 38 },
                    lineHeight: 1.3,
                    textTransform: 'capitalize',
                    color: '#141414',
                    textAlign: 'center',
                    fontStyle: 'italic',
                  }}
                >
                  {item}
                </Typography>
              ))}
            </Stack>
          </Box>

          {/* Men Section */}
          <Box sx={{ textAlign: 'center', width: '100%' }}>
            <Typography 
              variant="subtitle2"
              sx={{ 
                fontFamily: 'Outfit',
                fontWeight: 600,
                fontSize: { xs: 16, md: 18, lg: 20 },
                lineHeight: 1.5,
                letterSpacing: '0.0625em',
                textTransform: 'uppercase',
                color: '#141414',
                opacity: 0.4,
                textAlign: 'center',
                mb: 2
              }}
            >
              Men
            </Typography>
            
            <Stack spacing={1}>
              {['Swim Trunks', 'Linen Shirts', 'Tank Tops', 'Bucket Hats'].map((item) => (
                <Typography 
                  key={item}
                  variant="h6"
                  sx={{ 
                    fontFamily: 'Instrument Serif',
                    fontWeight: 400,
                    fontSize: { xs: 28, md: 34, lg: 38 },
                    lineHeight: 1.3,
                    textTransform: 'capitalize',
                    color: '#141414',
                    textAlign: 'center',
                    fontStyle: 'italic',
                  }}
                >
                  {item}
                </Typography>
              ))}
            </Stack>
          </Box>
        </Stack>
      )
    },
    // Slide 4 - Image 2
    {
      title: "Image 2",
      content: null,
      isImage: true,
      imageSrc: "/images/carousel/pool_party/2.png"
    },
    // Slide 5 - The Vibe content from Figma
    {
      title: "The Vibe",
      content: (
        <Stack spacing={3} alignItems="center" sx={{ position: 'relative', zIndex: 2 }}>
          <Typography 
            variant="subtitle2"
            sx={{ 
              fontFamily: 'Outfit',
              fontWeight: 600,
              fontSize: 16,
              lineHeight: 1.5,
              letterSpacing: '0.0625em',
              textTransform: 'uppercase',
              color: '#141414',
              opacity: 0.4,
              textAlign: 'center'
            }}
          >
            The vibe
          </Typography>
          
          <Typography 
            variant="h2"
            sx={{ 
              fontFamily: 'Instrument Serif',
              fontWeight: 400,
              fontSize: 40,
              lineHeight: 1.3,
              textTransform: 'capitalize',
              color: '#141414',
              textAlign: 'center',
              mb: 1,
              fontStyle: 'italic',
            }}
          >
            Pool Party
          </Typography>
          
          <Typography 
            variant="body1"
            sx={{ 
              fontFamily: 'Outfit',
              fontWeight: 300,
              fontSize: 16,
              lineHeight: 1.5,
              color: '#141414',
              textAlign: 'center',
              maxWidth: 281,
              px: 2
            }}
          >
            A daytime festival by water—splashy games, chilled cocktails, and laid-back beats under palm fronds, recharging you for the night ahead.
          </Typography>
        </Stack>
      )
    },
    // Slide 6 - Image 3
    {
      title: "Image 3",
      content: null,
      isImage: true,
      imageSrc: "/images/carousel/pool_party/3.png"
    }
  ];

  // Reception event content
  const getReceptionContent = () => [
    // Slide 1 - Dress code content (matching Figma design)
    {
      title: "Dress code",
      content: (
        <Stack spacing={3} alignItems="center" sx={{ position: 'relative', zIndex: 2 }}>
          <Typography 
            variant="subtitle2"
            sx={{ 
              fontFamily: 'Outfit',
              fontWeight: 600,
              fontSize: 16,
              lineHeight: 1.5,
              letterSpacing: '0.0625em',
              textTransform: 'uppercase',
              color: '#EBEBEB',
              opacity: 0.7,
              textAlign: 'center'
            }}
          >
            Dress code
          </Typography>
          
          <Typography 
            variant="h2"
            sx={{ 
              fontFamily: 'Instrument Serif',
              fontWeight: 400,
              fontSize: 40,
              lineHeight: 1.3,
              textTransform: 'capitalize',
              color: '#FFFFFF',
              textAlign: 'center',
              mb: 1,
              fontStyle: 'italic',
            }}
          >
            Cocktail Glam
          </Typography>
          
          <Typography 
            variant="body1"
            sx={{ 
              fontFamily: 'Outfit',
              fontWeight: 300,
              fontSize: 16,
              lineHeight: 1.5,
              color: '#FFFFFF',
              textAlign: 'center',
              maxWidth: 281,
              px: 2
            }}
          >
            Dress to impress—think sharp suits, elegant gowns, or chic lehengas and sherwanis in jewel tones and standout embellishments.
          </Typography>
        </Stack>
      )
    },
    // Slide 2 - Image 1
    {
      title: "Image 1",
      content: null,
      isImage: true,
      imageSrc: "/images/carousel/reception/1.png"
    },
    // Slide 3 - Detailed Dress Code (matching Figma design)
    {
      title: "Detailed Dress Code",
      content: (
        <Stack spacing={4} alignItems="center" sx={{ position: 'relative', zIndex: 2, px: 2 }}>
          {/* Women's Section */}
          <Stack spacing={2} alignItems="center">
            <Typography 
              variant="subtitle2"
              sx={{ 
                fontFamily: 'Outfit',
                fontWeight: 600,
                fontSize: { xs: 16, md: 18, lg: 20 },
                lineHeight: 1.5,
                letterSpacing: '0.0625em',
                textTransform: 'uppercase',
                color: '#EBEBEB',
                opacity: 0.7,
                textAlign: 'center'
              }}
            >
              Women
            </Typography>
            
            <Stack spacing={1} alignItems="center">
              <Typography 
                variant="h6"
                sx={{ 
                  fontFamily: 'Instrument Serif',
                  fontWeight: 400,
                  fontSize: { xs: 28, md: 34, lg: 38 },
                  lineHeight: 1.3,
                  textTransform: 'capitalize',
                  color: '#FFFFFF',
                  textAlign: 'center',
                  fontStyle: 'italic',
                }}
              >
                Evening Gowns
              </Typography>
              <Typography 
                variant="h6"
                sx={{ 
                  fontFamily: 'Instrument Serif',
                  fontWeight: 400,
                  fontSize: { xs: 28, md: 34, lg: 38 },
                  lineHeight: 1.3,
                  textTransform: 'capitalize',
                  color: '#FFFFFF',
                  textAlign: 'center',
                  fontStyle: 'italic',
                }}
              >
                Embellished Sarees
              </Typography>
              <Typography 
                variant="h6"
                sx={{ 
                  fontFamily: 'Instrument Serif',
                  fontWeight: 400,
                  fontSize: { xs: 28, md: 34, lg: 38 },
                  lineHeight: 1.3,
                  textTransform: 'capitalize',
                  color: '#FFFFFF',
                  textAlign: 'center',
                  fontStyle: 'italic',
                }}
              >
                Fusion Co-ord Sets
              </Typography>
              <Typography 
                variant="h6"
                sx={{ 
                  fontFamily: 'Instrument Serif',
                  fontWeight: 400,
                  fontSize: { xs: 28, md: 34, lg: 38 },
                  lineHeight: 1.3,
                  textTransform: 'capitalize',
                  color: '#FFFFFF',
                  textAlign: 'center',
                  fontStyle: 'italic',
                }}
              >
                Cocktail Lehengas
              </Typography>
            </Stack>
          </Stack>

          {/* Men's Section */}
          <Stack spacing={2} alignItems="center">
            <Typography 
              variant="subtitle2"
              sx={{ 
                fontFamily: 'Outfit',
                fontWeight: 600,
                fontSize: { xs: 16, md: 18, lg: 20 },
                lineHeight: 1.5,
                letterSpacing: '0.0625em',
                textTransform: 'uppercase',
                color: '#EBEBEB',
                opacity: 0.7,
                textAlign: 'center'
              }}
            >
              Men
            </Typography>
            
            <Stack spacing={1} alignItems="center">
              <Typography 
                variant="h6"
                sx={{ 
                  fontFamily: 'Instrument Serif',
                  fontWeight: 400,
                  fontSize: { xs: 28, md: 34, lg: 38 },
                  lineHeight: 1.3,
                  textTransform: 'capitalize',
                  color: '#FFFFFF',
                  textAlign: 'center',
                  fontStyle: 'italic',
                }}
              >
                Tuxedos & Dinner Suits
              </Typography>
              <Typography 
                variant="h6"
                sx={{ 
                  fontFamily: 'Instrument Serif',
                  fontWeight: 400,
                  fontSize: { xs: 28, md: 34, lg: 38 },
                  lineHeight: 1.3,
                  textTransform: 'capitalize',
                  color: '#FFFFFF',
                  textAlign: 'center',
                  fontStyle: 'italic',
                }}
              >
                Tailored Sherwanis
              </Typography>
              <Typography 
                variant="h6"
                sx={{ 
                  fontFamily: 'Instrument Serif',
                  fontWeight: 400,
                  fontSize: { xs: 28, md: 34, lg: 38 },
                  lineHeight: 1.3,
                  textTransform: 'capitalize',
                  color: '#FFFFFF',
                  textAlign: 'center',
                  fontStyle: 'italic',
                }}
              >
                Patterned Nehru Jackets
              </Typography>
            </Stack>
          </Stack>
        </Stack>
      )
    },
    // Slide 4 - Image 2
    {
      title: "Image 2",
      content: null,
      isImage: true,
      imageSrc: "/images/carousel/reception/2.png"
    },
    // Slide 5 - The Celebration (matching Figma design)
    {
      title: "The Celebration",
      content: (
        <Stack spacing={3} alignItems="center" sx={{ position: 'relative', zIndex: 2 }}>
          <Typography 
            variant="subtitle2"
            sx={{ 
              fontFamily: 'Outfit',
              fontWeight: 600,
              fontSize: 16,
              lineHeight: 1.5,
              letterSpacing: '0.0625em',
              textTransform: 'uppercase',
              color: '#EBEBEB',
              opacity: 0.7,
              textAlign: 'center'
            }}
          >
            The celebration
          </Typography>
          
          <Typography 
            variant="h2"
            sx={{ 
              fontFamily: 'Instrument Serif',
              fontWeight: 400,
              fontSize: 40,
              lineHeight: 1.5,
              textTransform: 'capitalize',
              color: '#FFFFFF',
              textAlign: 'center',
              mb: 1,
              fontStyle: 'italic',
            }}
          >
            Sangeet & Reception
          </Typography>
          
          <Typography 
            variant="body1"
            sx={{ 
              fontFamily: 'Outfit',
              fontWeight: 300,
              fontSize: 16,
              lineHeight: 1.5,
              color: '#FFFFFF',
              textAlign: 'center',
              maxWidth: 281,
              px: 2
            }}
          >
            Evening kicks off with a high-energy Sangeet of choreographed dances, then flows into a formal Reception of dinner, toasts, and first dances—a perfect blend of party and polish.
          </Typography>
        </Stack>
      )
    },
    // Slide 6 - Image 3
    {
      title: "Image 3",
      content: null,
      isImage: true,
      imageSrc: "/images/carousel/reception/3.png"
    },
    // Slide 7 - The Vibe (matching Figma design)
    {
      title: "The Vibe",
      content: (
        <Stack spacing={3} alignItems="center" sx={{ position: 'relative', zIndex: 2 }}>
          <Typography 
            variant="subtitle2"
            sx={{ 
              fontFamily: 'Outfit',
              fontWeight: 600,
              fontSize: 16,
              lineHeight: 1.5,
              letterSpacing: '0.0625em',
              textTransform: 'uppercase',
              color: '#EBEBEB',
              opacity: 0.7,
              textAlign: 'center'
            }}
          >
            The Vibe
          </Typography>
          
          <Typography 
            variant="h2"
            sx={{ 
              fontFamily: 'Instrument Serif',
              fontWeight: 400,
              fontSize: 40,
              lineHeight: 1.5,
              textTransform: 'capitalize',
              color: '#FFFFFF',
              textAlign: 'center',
              mb: 1,
              fontStyle: 'italic',
            }}
          >
            Afterparty
          </Typography>
          
          <Typography 
            variant="body1"
            sx={{ 
              fontFamily: 'Outfit',
              fontWeight: 300,
              fontSize: 16,
              lineHeight: 1.5,
              color: '#FFFFFF',
              textAlign: 'center',
              maxWidth: 281,
              px: 2
            }}
          >
            The night continues with pulsing beats, craft cocktails, and a dance floor that stays hot until the wee hours.
          </Typography>
        </Stack>
      )
    },
  ];

  // After Party event content
  const getAfterPartyContent = () => [
    {
      title: "Dress code",
      content: (
        <Stack spacing={3} alignItems="center" sx={{ position: 'relative', zIndex: 2 }}>
          <Typography variant="subtitle2" sx={{ fontFamily: 'Outfit', fontWeight: 600, fontSize: 16, lineHeight: 1.5, letterSpacing: '0.0625em', textTransform: 'uppercase', color: '#141414', opacity: 0.4, textAlign: 'center' }}>
            Dress code
          </Typography>
          <Typography variant="h2" sx={{ fontFamily: 'Instrument Serif', fontWeight: 400, fontSize: 40, lineHeight: 1.3, textTransform: 'capitalize', color: '#141414', textAlign: 'center', mb: 1 }}>
            Neon Festival Rave
          </Typography>
          <Typography variant="body1" sx={{ fontFamily: 'Outfit', fontWeight: 300, fontSize: 16, lineHeight: 1.5, color: '#141414', textAlign: 'center', maxWidth: 281, px: 2 }}>
            Bright neon colors, glow sticks, comfortable dancing shoes. Let's party until dawn!
          </Typography>
        </Stack>
      )
    },
    {
      title: "What It Is",
      content: (
        <Stack spacing={3} alignItems="center" sx={{ position: 'relative', zIndex: 2 }}>
          <Typography variant="subtitle2" sx={{ fontFamily: 'Outfit', fontWeight: 600, fontSize: 16, lineHeight: 1.5, letterSpacing: '0.0625em', textTransform: 'uppercase', color: '#141414', opacity: 0.4, textAlign: 'center' }}>
            After Party
          </Typography>
          <Typography variant="h2" sx={{ fontFamily: 'Instrument Serif', fontWeight: 400, fontSize: 40, lineHeight: 1.3, textTransform: 'capitalize', color: '#141414', textAlign: 'center', mb: 1 }}>
            What It Is
          </Typography>
          <Typography variant="body1" sx={{ fontFamily: 'Outfit', fontWeight: 300, fontSize: 16, lineHeight: 1.5, color: '#141414', textAlign: 'center', maxWidth: 281, px: 2 }}>
            An epic late-night celebration with DJ, dancing, and high-energy fun to cap off the wedding festivities.
          </Typography>
        </Stack>
      )
    },
  ];

  // Get the event data based on current event
  const eventData = getEventContent(currentEvent?.slug || 'welcome-lunch-haldi');

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
          minHeight: '100svh',
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
            py: { xs: 2, md: 4 },
          }}
        >
          <Stack spacing={3} alignItems="center" sx={{ width: '100%' }}>
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
                    index={index}
                    isImage={(card as any).isImage}
                    imageSrc={(card as any).imageSrc}
                    eventSlug={currentEvent?.slug}
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
                  disabled={currentSlide === eventData.length - 1}
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

        {/* Bottom indicators */}
        <Box
          sx={{
            position: 'relative',
            zIndex: 3,
            flexShrink: 0,
            pb: { xs: 4, sm: 2 }, // Extra padding for mobile browser bar
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