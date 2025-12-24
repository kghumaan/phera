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
import { ArrowBack, ChevronRight } from '@mui/icons-material';
import OptimizedBackground from '@/components/ui/OptimizedBackground';
import WhatsAppChannelModal from '@/components/shared/WhatsAppChannelModal';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useState } from 'react';

export default function RegistryPage() {
  const router = useRouter();
  const { user, hasRSVPed, rsvpResponse } = useAuth();
  
  // Only show WhatsApp button if user has RSVP'd "yes" or "maybe"
  const shouldShowWhatsApp = hasRSVPed && (rsvpResponse === 'yes' || rsvpResponse === 'maybe');
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);

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
              }}
            >
              Registry
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

      {/* Main Content */}
      <Container
        maxWidth={false}
        sx={{
          maxWidth: { xs: '100%', md: 600, lg: 700 },
          px: { xs: 2, md: 3 },
          pb: 4,
          pt: 10,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ width: '100%' }}
        >
          <Stack spacing={{ xs: 3, md: 4 }} alignItems="center">
            {/* Fund Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              style={{ width: '100%' }}
            >
              <Box
                component="button"
                onClick={() => router.push('/registry/new-home-fund')}
                sx={{
                  display: 'block',
                  width: '100%',
                  textDecoration: 'none',
                  border: 'none',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.15)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    boxShadow: '0px 8px 30px rgba(0, 0, 0, 0.25)',
                    transform: 'translateY(-4px)',
                  },
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: { xs: 2, sm: 2.5, md: 3 },
                    padding: { xs: 3, sm: 3.5, md: 4, lg: 5 },
                    backgroundColor: '#ffffff',
                  }}
                >
                  {/* Fund Name */}
                  <Typography
                    variant="h4"
                    sx={{
                      fontFamily: 'Outfit',
                      fontWeight: 600,
                      fontSize: { xs: 20, sm: 24, md: 28, lg: 32 },
                      lineHeight: 1.2,
                      color: '#141414',
                    }}
                  >
                    🏠 New Home Fund
                  </Typography>

                  <ChevronRight
                    sx={{
                      color: '#141414',
                      fontSize: { xs: 28, sm: 32, md: 40, lg: 48 },
                      flexShrink: 0,
                    }}
                  />
                </Box>
              </Box>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              style={{ width: '100%' }}
            >
              <Box
                component="button"
                onClick={() => router.push('/registry/honeymoon-fund')}
                sx={{
                  display: 'block',
                  width: '100%',
                  textDecoration: 'none',
                  border: 'none',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.15)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    boxShadow: '0px 8px 30px rgba(0, 0, 0, 0.25)',
                    transform: 'translateY(-4px)',
                  },
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: { xs: 2, sm: 2.5, md: 3 },
                    padding: { xs: 3, sm: 3.5, md: 4, lg: 5 },
                    backgroundColor: '#ffffff',
                  }}
                >
                  {/* Fund Name */}
                  <Typography
                    variant="h4"
                    sx={{
                      fontFamily: 'Outfit',
                      fontWeight: 600,
                      fontSize: { xs: 20, sm: 24, md: 28, lg: 32 },
                      lineHeight: 1.2,
                      color: '#141414',
                    }}
                  >
                    ✈️ Honeymoon Fund
                  </Typography>

                  <ChevronRight
                    sx={{
                      color: '#141414',
                      fontSize: { xs: 28, sm: 32, md: 40, lg: 48 },
                      flexShrink: 0,
                    }}
                  />
                </Box>
              </Box>
            </motion.div>
          </Stack>
        </motion.div>
      </Container>

      {/* WhatsApp Channel Modal */}
      <WhatsAppChannelModal 
        open={whatsAppModalOpen}
        onClose={() => setWhatsAppModalOpen(false)}
      />
    </OptimizedBackground>
  );
}