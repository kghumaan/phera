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
      src="/images/backgrounds/lavendar.png"
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
              }}
            >
              Registry
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
          <Stack spacing={1.5}>
            {/* Fund Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <Box
                component="button"
                onClick={() => router.push('/registry/honeymoon-fund')}
                sx={{
                  display: 'block',
                  width: '100%',
                  textDecoration: 'none',
                  border: 'none',
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
                    alignItems: 'stretch',
                    gap: 0.5,
                    padding: 2,
                    backgroundColor: '#ffffff',
                  }}
                >
                  <Box sx={{ flex: 1, textAlign: 'left' }}>
                    {/* Fund Name */}
                    <Typography
                      variant="h6"
                      sx={{
                        fontFamily: 'Outfit',
                        fontWeight: 500,
                        fontSize: 24,
                        lineHeight: 1.3,
                        color: '#141414',
                        mb: 1,
                      }}
                    >
                      🌙 Honeymoon Fund
                    </Typography>
                    
                    {/* Fund Description */}
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
                      Contribute toward our dream getaway—shoreline dinners, guided tours, and memorable experiences.
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <Box
                component="button"
                onClick={() => router.push('/registry/new-home-fund')}
                sx={{
                  display: 'block',
                  width: '100%',
                  textDecoration: 'none',
                  border: 'none',
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
                    alignItems: 'stretch',
                    gap: 0.5,
                    padding: 2,
                    backgroundColor: '#ffffff',
                  }}
                >
                  <Box sx={{ flex: 1, textAlign: 'left' }}>
                    {/* Fund Name */}
                    <Typography
                      variant="h6"
                      sx={{
                        fontFamily: 'Outfit',
                        fontWeight: 500,
                        fontSize: 24,
                        lineHeight: 1.3,
                        color: '#141414',
                        mb: 1,
                      }}
                    >
                      🏠 New Home Fund
                    </Typography>
                    
                    {/* Fund Description */}
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
                      Help us settle into our next place—furnishings, cookware, and the little touches that make it feel like home.
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </motion.div>
          </Stack>
        </motion.div>
      </Container>
    </OptimizedBackground>
  );
}