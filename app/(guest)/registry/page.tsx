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
                mb: 3,
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
              }}
            >
              Coming soon...
            </Typography>
          </motion.div>
        </Container>
      </Box>
    </OptimizedBackground>
  );
}