'use client';

import { Box, Container, Typography, IconButton, Stack, Link } from '@mui/material';
import { motion } from 'framer-motion';
import OptimizedBackground from '@/components/ui/OptimizedBackground';
import { useRouter } from 'next/navigation';
import { ArrowBack } from '@mui/icons-material';

// Store data based on the Figma design
const stores = [
  {
    name: 'House of Indya',
    details: 'Ships to US in 5–7 business days\nAvg. outfit $30–$250',
    url: 'https://www.houseofindya.com'
  },
  {
    name: 'Lashkaraa',
    details: 'Ships to US in 10–14 business days\nAvg. outfit $60–$180',
    url: 'https://www.lashkaraa.com'
  },
  {
    name: 'Utsav Fashion',
    details: 'Ships to US in 5–7 business days\nAvg. outfit $50–$200',
    url: 'https://www.utsavfashion.com'
  },
  {
    name: 'KALKI Fashion',
    details: 'Ships to US in 7–14 business days\nAvg. outfit $120–$350',
    url: 'https://www.kalkifashion.com'
  },
  {
    name: 'Mulmul',
    details: 'Ships to US in 4–5 business days\nAvg. outfit $150–$300',
    url: 'https://shopmulmul.com/'
  },
  {
    name: 'KYNAH',
    details: 'Ready-to-ship from Los Angeles in 4–7 business days\nAvg. outfit $140–$1,000',
    url: 'https://shopkynah.com/'
  },
  {
    name: 'Mirraw',
    details: 'Ships to US in 7–12 business days\nAvg. outfit $50–$150',
    url: 'https://www.mirraw.com'
  },
  {
    name: 'Cbazaar',
    details: 'Ships to US in 7–10 business days\nAvg. outfit $30–$80',
    url: 'https://www.cbazaar.com'
  },
  {
    name: 'Fabricoz USA',
    details: 'US-domestic shipping in 3–5 business days\nAvg. outfit $60–$200',
    url: 'https://www.fabricoz.com'
  }
];

export default function WhereToShopPage() {
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
              onClick={() => router.push('/events')}
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
              Where to Shop
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
          <Stack spacing={2}>
            {/* Description */}
            <Typography
              variant="body1"
              sx={{
                fontFamily: 'Outfit',
                fontWeight: 300,
                fontSize: 16,
                lineHeight: 1.5,
                color: '#141414',
                textAlign: 'center',
                mb: 2,
              }}
            >
              For our US-based guests: online boutiques that ship stateside with reasonable timelines and prices.
            </Typography>

            {/* Store Cards */}
            <Stack spacing={2}>
              {stores.map((store, index) => (
                <motion.div
                  key={store.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                >
                  <Box
                    component="a"
                    href={store.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      display: 'block',
                      textDecoration: 'none',
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
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        padding: 2,
                        backgroundColor: '#ffffff',
                      }}
                    >
                      <Box sx={{ flex: 1 }}>
                        {/* Store Name */}
                        <Typography
                          variant="h6"
                          sx={{
                            fontFamily: 'Outfit',
                            fontWeight: 500,
                            fontSize: 20,
                            lineHeight: 1.3,
                            color: '#141414',
                            mb: 1,
                          }}
                        >
                          {store.name}
                        </Typography>
                        
                        {/* Store Details */}
                        <Stack spacing={0.5}>
                          {store.details.split('\n').map((detail, idx) => (
                            <Typography
                              key={idx}
                              variant="body2"
                              sx={{
                                fontFamily: 'Outfit',
                                fontWeight: 300,
                                fontSize: 16,
                                lineHeight: 1.5,
                                color: '#141414',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                              }}
                            >
                              <Box
                                sx={{
                                  width: 4,
                                  height: 4,
                                  backgroundColor: '#141414',
                                  borderRadius: '50%',
                                  flexShrink: 0,
                                }}
                              />
                              <span>{detail}</span>
                            </Typography>
                          ))}
                        </Stack>
                      </Box>
                      
                      {/* Outward Arrow Icon */}
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M7 17L17 7M17 7H7M17 7V17" stroke="#141414" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </Box>
                    </Box>
                  </Box>
                </motion.div>
              ))}
            </Stack>
          </Stack>
        </motion.div>
      </Container>
    </OptimizedBackground>
  );
} 