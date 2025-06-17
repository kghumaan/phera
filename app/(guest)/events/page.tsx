'use client';

import { Box, Container, Typography, Card, CardContent, Stack, Chip, IconButton } from '@mui/material';
import { motion } from 'framer-motion';
import { 
  CalendarTodayOutlined, 
  LocationOnOutlined, 
  AccessTimeOutlined,
  FavoriteOutlined
} from '@mui/icons-material';
import OptimizedBackground from '@/components/ui/OptimizedBackground';
import Link from 'next/link';
import { ArrowBack } from '@mui/icons-material';

// Sample events data - this would come from your backend/config in the future
const weddingEvents = [
  {
    id: 1,
    name: 'Haldi Ceremony',
    description: 'A beautiful traditional ceremony where turmeric paste is applied to the bride and groom for good luck and purification.',
    date: '4 January, 2026',
    time: '10:00 AM - 12:00 PM',
    location: 'Garden Pavilion, The Palayana',
    dress_code: 'Traditional Yellow/Orange',
    cultural_significance: 'Turmeric is believed to ward off evil spirits and bring prosperity',
    emoji: '🌼'
  },
  {
    id: 2,
    name: 'Mehendi Ceremony',
    description: 'An artistic celebration where intricate henna designs are applied to hands and feet, accompanied by music and dance.',
    date: '4 January, 2026',
    time: '2:00 PM - 6:00 PM',
    location: 'Beachside Terrace, The Palayana',
    dress_code: 'Vibrant Colors (Green/Pink preferred)',
    cultural_significance: 'Henna symbolizes joy, beauty, and spiritual awakening',
    emoji: '✋'
  },
  {
    id: 3,
    name: 'Sangam (Welcome Party)',
    description: 'A joyful gathering to welcome all families and friends. Enjoy traditional music, dance, and delicious appetizers.',
    date: '4 January, 2026',
    time: '7:00 PM - 11:00 PM',
    location: 'Main Ballroom, The Palayana',
    dress_code: 'Semi-formal Indian/Western',
    cultural_significance: 'Bringing together two families as one',
    emoji: '🎉'
  },
  {
    id: 4,
    name: 'Main Wedding Ceremony',
    description: 'The sacred union ceremony with traditional rituals, vows, and blessings. A moment of pure love and commitment.',
    date: '5 January, 2026',
    time: '6:00 AM - 10:00 AM',
    location: 'Sacred Garden, The Palayana',
    dress_code: 'Traditional Formal (Red/Maroon/Gold)',
    cultural_significance: 'The sacred bond of marriage blessed by fire and witnessed by nature',
    emoji: '💒'
  },
  {
    id: 5,
    name: 'Reception Dinner',
    description: 'An elegant evening celebration with dinner, music, and dancing to honor the newly married couple.',
    date: '5 January, 2026',
    time: '7:00 PM - 12:00 AM',
    location: 'Grand Ballroom, The Palayana',
    dress_code: 'Formal/Cocktail Attire',
    cultural_significance: 'Celebrating the new beginning with family and friends',
    emoji: '🥂'
  },
  {
    id: 6,
    name: 'Farewell Brunch',
    description: 'A relaxed morning gathering to share memories, exchange contact information, and bid farewell until we meet again.',
    date: '6 January, 2026',
    time: '10:00 AM - 1:00 PM',
    location: 'Poolside Restaurant, The Palayana',
    dress_code: 'Casual Comfortable',
    cultural_significance: 'Blessing the couple for their journey ahead',
    emoji: '🌅'
  }
];

export default function GuestEventsPage() {
  return (
    <OptimizedBackground 
      useAppDefault={true}
      className="min-h-screen"
    >
      {/* Header */}
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
        }}
      >
        <Container maxWidth="sm">
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              py: 2,
              gap: 2,
            }}
          >
            <IconButton 
              component={Link} 
              href="/"
              sx={{
                backgroundColor: 'rgba(0, 0, 0, 0.1)',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.2)',
                },
              }}
            >
              <ArrowBack />
            </IconButton>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 600,
                color: '#333',
                flex: 1,
              }}
            >
              Wedding Events
            </Typography>
            <Box
              component="img"
              src="/logo.svg"
              alt="Phera Logo"
              sx={{
                height: 32,
                width: 'auto',
                filter: 'brightness(0)',
              }}
            />
          </Box>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxWidth="sm" sx={{ pb: 4 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Header Section */}
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                color: '#333',
                mb: 2,
                fontSize: { xs: '2rem', sm: '2.5rem' },
              }}
            >
              ✨ Celebration Schedule
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: '#666',
                fontSize: '1.1rem',
                maxWidth: 400,
                mx: 'auto',
                lineHeight: 1.6,
              }}
            >
              Join us for three days of love, tradition, and joyful celebration in beautiful Thailand 🇹🇭
            </Typography>
          </Box>

          {/* Events List */}
          <Stack spacing={3}>
            {weddingEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: 3,
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                    overflow: 'hidden',
                    position: 'relative',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
                    },
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  {/* Event Header */}
                  <Box
                    sx={{
                      background: `linear-gradient(135deg, 
                        ${index % 3 === 0 ? '#FF6B6B, #FF8E53' : 
                          index % 3 === 1 ? '#4ECDC4, #44A08D' : 
                          '#A8E6CF, #7FCDCD'})`,
                      p: 3,
                      pb: 2,
                      color: 'white',
                      position: 'relative',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography variant="h2" sx={{ mr: 2, fontSize: '2rem' }}>
                        {event.emoji}
                      </Typography>
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="h5"
                          sx={{
                            fontWeight: 700,
                            mb: 0.5,
                          }}
                        >
                          {event.name}
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <CalendarTodayOutlined sx={{ fontSize: '1rem' }} />
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {event.date}
                          </Typography>
                        </Stack>
                      </Box>
                    </Box>
                  </Box>

                  <CardContent sx={{ p: 3 }}>
                    <Typography
                      variant="body1"
                      sx={{
                        color: '#555',
                        mb: 3,
                        lineHeight: 1.7,
                        fontSize: '1rem',
                      }}
                    >
                      {event.description}
                    </Typography>

                    <Stack spacing={2}>
                      {/* Time */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <AccessTimeOutlined sx={{ color: '#666', fontSize: '1.2rem' }} />
                        <Typography variant="body2" sx={{ color: '#666', fontWeight: 500 }}>
                          {event.time}
                        </Typography>
                      </Box>

                      {/* Location */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <LocationOnOutlined sx={{ color: '#666', fontSize: '1.2rem' }} />
                        <Typography variant="body2" sx={{ color: '#666', fontWeight: 500 }}>
                          {event.location}
                        </Typography>
                      </Box>
                    </Stack>

                    {/* Dress Code */}
                    <Box sx={{ mt: 3 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          color: '#333',
                          fontWeight: 600,
                          mb: 1,
                        }}
                      >
                        👗 Dress Code
                      </Typography>
                      <Chip
                        label={event.dress_code}
                        size="small"
                        sx={{
                          backgroundColor: 'rgba(0, 0, 0, 0.08)',
                          color: '#333',
                          fontWeight: 500,
                        }}
                      />
                    </Box>

                    {/* Cultural Significance */}
                    <Box
                      sx={{
                        mt: 3,
                        p: 2,
                        backgroundColor: 'rgba(255, 193, 7, 0.1)',
                        borderRadius: 2,
                        border: '1px solid rgba(255, 193, 7, 0.2)',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <FavoriteOutlined sx={{ color: '#FF9800', fontSize: '1rem' }} />
                        <Typography
                          variant="subtitle2"
                          sx={{
                            color: '#E65100',
                            fontWeight: 600,
                          }}
                        >
                          Cultural Significance
                        </Typography>
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#E65100',
                          fontStyle: 'italic',
                          lineHeight: 1.5,
                        }}
                      >
                        {event.cultural_significance}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </Stack>

          {/* Footer Message */}
          <Box sx={{ textAlign: 'center', py: 4, mt: 4 }}>
            <Typography
              variant="body1"
              sx={{
                color: '#555',
                fontSize: '1rem',
                fontStyle: 'italic',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                borderRadius: 3,
                p: 3,
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              🙏 Your presence at these sacred celebrations would mean the world to us. 
              Each ceremony is a thread in the beautiful tapestry of our union.
            </Typography>
          </Box>
        </motion.div>
      </Container>
    </OptimizedBackground>
  );
} 