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
      height: 'calc(100vh - 200px)', // Account for header + bottom indicators + mobile browser bar
      minHeight: '400px',
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
          `url(/images/backgrounds/Gradient${eventSlug === 'baraat-varmala-jaggo' ? 'Jaggo' : 'Yellow'}.png)` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <CardContent
        sx={{
          p: isImage ? 0 : 3,
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
                fontSize: 16,
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
                    fontSize: 28,
                    lineHeight: 1.3,
                    textTransform: 'capitalize',
                    color: '#141414',
                    textAlign: 'center'
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
                fontSize: 16,
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
                    fontSize: 28,
                    lineHeight: 1.3,
                    textTransform: 'capitalize',
                    color: '#141414',
                    textAlign: 'center'
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
            Haldi
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
              mb: 1
            }}
          >
            What It Is
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
            A ritual where loved ones smear a turmeric–mustard–flour paste on the bride AND groom for cleansing, blessing, and pre-wedding glow-up time.
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
            Haldi
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
              mb: 1
            }}
          >
            Why it Matters
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
            Turmeric symbolizes purity, protection & prosperity. Expect playful folk songs, lots of laughter, and those iconic yellow highlights.
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
    // Slide 9 - Mehendi station content
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
            Mehendi station
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
              mb: 1
            }}
          >
            What It Is
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
            Live henna artists transform your hands into intricate, temporary works of art—each swirl and paisley a symbol of love and good fortune.
          </Typography>
        </Stack>
      )
    },
    // Slide 10 - Image 5
    {
      title: "Image 5",
      content: null,
      isImage: true,
      imageSrc: "/images/carousel/haldi/5.png"
    },
    // Slide 11 - Mehendi station Why it Matters content
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
            Mehendi station
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
              mb: 1
            }}
          >
            Why it Matters
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
            Beyond the beauty, mehendi is believed to bring luck, ward off evil, and strengthen the bond between the couple—and it's a chance for guests to relax, socialize, and get creative.
          </Typography>
        </Stack>
      )
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
              mb: 1
            }}
          >
            Vibrant Festive Hues
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
            Bold colors and rich fabrics → lehengas, sherwanis, bright sarees, vibrant turbans. Think celebration and joy!
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
    // Slide 3 - Baraat What It Is content
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
            Baraat
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
              mb: 1
            }}
          >
            What It Is
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
            The groom's grand entrance with dancing, music, and celebration as he arrives to meet his bride.
          </Typography>
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
              color: '#141414',
              opacity: 0.4,
              textAlign: 'center'
            }}
          >
            Varmala
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
              mb: 1
            }}
          >
            What It Is
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
            The beautiful ceremony where the bride and groom exchange floral garlands, symbolizing their acceptance of each other.
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
              color: '#141414',
              opacity: 0.4,
              textAlign: 'center'
            }}
          >
            Jaggo
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
              mb: 1
            }}
          >
            What It Is
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
            A spirited pre-wedding celebration where family and friends dance through the streets with decorated pots and dhol beats.
          </Typography>
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
              color: '#141414',
              opacity: 0.4,
              textAlign: 'center'
            }}
          >
            Music & Dance
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
              mb: 1
            }}
          >
            Bhangra & Dhol
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
            Traditional Punjabi folk music with dhol drums, energetic bhangra dancing, and celebration songs that get everyone moving!
          </Typography>
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
    // Slide 11 - Final celebration content
    {
      title: "Join the Celebration",
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
            Join the Celebration
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
              mb: 1
            }}
          >
            Let's Dance!
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
            Come ready to celebrate, dance, and be part of this joyous tradition. Your presence makes this celebration complete!
          </Typography>
        </Stack>
      )
    },
  ];

  // Anand Karaj event content
  const getAnandKarajContent = () => [
    {
      title: "Dress code",
      content: (
        <Stack spacing={3} alignItems="center" sx={{ position: 'relative', zIndex: 2 }}>
          <Typography variant="subtitle2" sx={{ fontFamily: 'Outfit', fontWeight: 600, fontSize: 16, lineHeight: 1.5, letterSpacing: '0.0625em', textTransform: 'uppercase', color: '#141414', opacity: 0.4, textAlign: 'center' }}>
            Dress code
          </Typography>
          <Typography variant="h2" sx={{ fontFamily: 'Instrument Serif', fontWeight: 400, fontSize: 40, lineHeight: 1.3, textTransform: 'capitalize', color: '#141414', textAlign: 'center', mb: 1 }}>
            Pastel
          </Typography>
          <Typography variant="body1" sx={{ fontFamily: 'Outfit', fontWeight: 300, fontSize: 16, lineHeight: 1.5, color: '#141414', textAlign: 'center', maxWidth: 281, px: 2 }}>
            Soft, gentle colors → blush pink, mint green, lavender, cream. Elegant and serene for this sacred ceremony.
          </Typography>
        </Stack>
      )
    },
    {
      title: "What It Is",
      content: (
        <Stack spacing={3} alignItems="center" sx={{ position: 'relative', zIndex: 2 }}>
          <Typography variant="subtitle2" sx={{ fontFamily: 'Outfit', fontWeight: 600, fontSize: 16, lineHeight: 1.5, letterSpacing: '0.0625em', textTransform: 'uppercase', color: '#141414', opacity: 0.4, textAlign: 'center' }}>
            Anand Karaj
          </Typography>
          <Typography variant="h2" sx={{ fontFamily: 'Instrument Serif', fontWeight: 400, fontSize: 40, lineHeight: 1.3, textTransform: 'capitalize', color: '#141414', textAlign: 'center', mb: 1 }}>
            What It Is
          </Typography>
          <Typography variant="body1" sx={{ fontFamily: 'Outfit', fontWeight: 300, fontSize: 16, lineHeight: 1.5, color: '#141414', textAlign: 'center', maxWidth: 281, px: 2 }}>
            The sacred Sikh wedding ceremony where the couple circles the Guru Granth Sahib four times, each representing a stage of spiritual union.
          </Typography>
        </Stack>
      )
    },
  ];

  // Pool Party event content
  const getPoolPartyContent = () => [
    {
      title: "Dress code",
      content: (
        <Stack spacing={3} alignItems="center" sx={{ position: 'relative', zIndex: 2 }}>
          <Typography variant="subtitle2" sx={{ fontFamily: 'Outfit', fontWeight: 600, fontSize: 16, lineHeight: 1.5, letterSpacing: '0.0625em', textTransform: 'uppercase', color: '#141414', opacity: 0.4, textAlign: 'center' }}>
            Dress code
          </Typography>
          <Typography variant="h2" sx={{ fontFamily: 'Instrument Serif', fontWeight: 400, fontSize: 40, lineHeight: 1.3, textTransform: 'capitalize', color: '#141414', textAlign: 'center', mb: 1 }}>
            Beach-Chic Loungewear
          </Typography>
          <Typography variant="body1" sx={{ fontFamily: 'Outfit', fontWeight: 300, fontSize: 16, lineHeight: 1.5, color: '#141414', textAlign: 'center', maxWidth: 281, px: 2 }}>
            Swimwear, cover-ups, linen shirts, flowy dresses. Bring sunscreen and prepare to splash!
          </Typography>
        </Stack>
      )
    },
    {
      title: "What It Is",
      content: (
        <Stack spacing={3} alignItems="center" sx={{ position: 'relative', zIndex: 2 }}>
          <Typography variant="subtitle2" sx={{ fontFamily: 'Outfit', fontWeight: 600, fontSize: 16, lineHeight: 1.5, letterSpacing: '0.0625em', textTransform: 'uppercase', color: '#141414', opacity: 0.4, textAlign: 'center' }}>
            Pool Party
          </Typography>
          <Typography variant="h2" sx={{ fontFamily: 'Instrument Serif', fontWeight: 400, fontSize: 40, lineHeight: 1.3, textTransform: 'capitalize', color: '#141414', textAlign: 'center', mb: 1 }}>
            What It Is
          </Typography>
          <Typography variant="body1" sx={{ fontFamily: 'Outfit', fontWeight: 300, fontSize: 16, lineHeight: 1.5, color: '#141414', textAlign: 'center', maxWidth: 281, px: 2 }}>
            A relaxed celebration by the pool with music, drinks, and fun games. Time to unwind and celebrate!
          </Typography>
        </Stack>
      )
    },
  ];

  // Reception event content
  const getReceptionContent = () => [
    {
      title: "Dress code",
      content: (
        <Stack spacing={3} alignItems="center" sx={{ position: 'relative', zIndex: 2 }}>
          <Typography variant="subtitle2" sx={{ fontFamily: 'Outfit', fontWeight: 600, fontSize: 16, lineHeight: 1.5, letterSpacing: '0.0625em', textTransform: 'uppercase', color: '#141414', opacity: 0.4, textAlign: 'center' }}>
            Dress code
          </Typography>
          <Typography variant="h2" sx={{ fontFamily: 'Instrument Serif', fontWeight: 400, fontSize: 40, lineHeight: 1.3, textTransform: 'capitalize', color: '#141414', textAlign: 'center', mb: 1 }}>
            Black-Tie
          </Typography>
          <Typography variant="body1" sx={{ fontFamily: 'Outfit', fontWeight: 300, fontSize: 16, lineHeight: 1.5, color: '#141414', textAlign: 'center', maxWidth: 281, px: 2 }}>
            Formal elegant attire → tuxedos, evening gowns, cocktail dresses. Time to dress to impress!
          </Typography>
        </Stack>
      )
    },
    {
      title: "What It Is",
      content: (
        <Stack spacing={3} alignItems="center" sx={{ position: 'relative', zIndex: 2 }}>
          <Typography variant="subtitle2" sx={{ fontFamily: 'Outfit', fontWeight: 600, fontSize: 16, lineHeight: 1.5, letterSpacing: '0.0625em', textTransform: 'uppercase', color: '#141414', opacity: 0.4, textAlign: 'center' }}>
            Reception
          </Typography>
          <Typography variant="h2" sx={{ fontFamily: 'Instrument Serif', fontWeight: 400, fontSize: 40, lineHeight: 1.3, textTransform: 'capitalize', color: '#141414', textAlign: 'center', mb: 1 }}>
            What It Is
          </Typography>
          <Typography variant="body1" sx={{ fontFamily: 'Outfit', fontWeight: 300, fontSize: 16, lineHeight: 1.5, color: '#141414', textAlign: 'center', maxWidth: 281, px: 2 }}>
            An elegant evening celebration with dinner, dancing, and speeches to honor the newlyweds.
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
            minHeight: 0, // Allow flex shrinking
            pb: 2, // Add padding bottom for mobile
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
            pb: { xs: 3, sm: 2 }, // Extra padding for mobile browser bar
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mb: { xs: 1, sm: 2 },
              mt: { xs: 2, sm: 4 },
            }}
          >
            <DiamondIndicators total={eventData.length} current={currentSlide} />
          </Box>
        </Box>
      </Box>
    </OptimizedBackground>
  );
}