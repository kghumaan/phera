'use client';

import { 
  Box, 
  Container, 
  Typography, 
  IconButton,
  Stack
} from '@mui/material';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowBack } from '@mui/icons-material';
import OptimizedBackground from '@/components/ui/OptimizedBackground';

export default function RegistryPage() {
  const router = useRouter();

  const handleBack = () => {
    router.push('/details');
  };

  return (
    <OptimizedBackground
      src="/images/backgrounds/pearl.png"
      alt="Pearl Background"
      priority={true}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
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
                Registry
              </Typography>
              <Box sx={{ width: 48 }} /> {/* Spacer */}
            </Stack>
          </Container>
        </Box>

        {/* Main Content */}
        <Container maxWidth="sm" sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{ width: '100%', textAlign: 'center' }}
          >
            <Typography
              variant="h4"
              sx={{
                fontFamily: 'Instrument Serif',
                fontWeight: 400,
                fontSize: 32,
                lineHeight: 1.3,
                color: '#141414',
                mb: 2,
              }}
            >
              Registry
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontFamily: 'Outfit',
                fontWeight: 300,
                fontSize: 16,
                lineHeight: 1.5,
                color: '#474747',
                mb: 4,
              }}
            >
              Help us start our new journey together by contributing to our future.
            </Typography>
            
            <Stack spacing={2} sx={{ maxWidth: 400, mx: 'auto' }}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Box
                  component="button"
                  onClick={() => router.push('/registry/honeymoon-fund')}
                  sx={{
                    width: '100%',
                    backgroundColor: '#141414',
                    color: '#fff',
                    borderRadius: '16px',
                    border: 'none',
                    py: 3,
                    px: 3,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontFamily: 'Outfit',
                    fontSize: 16,
                    fontWeight: 500,
                    '&:hover': {
                      backgroundColor: '#2a2a2a',
                    },
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: 'Outfit',
                      fontSize: 18,
                      fontWeight: 600,
                      mb: 0.5,
                    }}
                  >
                    🏝️ Honeymoon Fund
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: 'Outfit',
                      fontSize: 14,
                      fontWeight: 300,
                      opacity: 0.8,
                    }}
                  >
                    Help create unforgettable memories
                  </Typography>
                </Box>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Box
                  component="button"
                  onClick={() => router.push('/registry/new-home-fund')}
                  sx={{
                    width: '100%',
                    backgroundColor: '#141414',
                    color: '#fff',
                    borderRadius: '16px',
                    border: 'none',
                    py: 3,
                    px: 3,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontFamily: 'Outfit',
                    fontSize: 16,
                    fontWeight: 500,
                    '&:hover': {
                      backgroundColor: '#2a2a2a',
                    },
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: 'Outfit',
                      fontSize: 18,
                      fontWeight: 600,
                      mb: 0.5,
                    }}
                  >
                    🏡 New Home Fund
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: 'Outfit',
                      fontSize: 14,
                      fontWeight: 300,
                      opacity: 0.8,
                    }}
                  >
                    Help us build our nest together
                  </Typography>
                </Box>
              </motion.div>
            </Stack>
          </motion.div>
        </Container>
      </Box>
    </OptimizedBackground>
  );
}