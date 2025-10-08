'use client';

import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  Stack,
  useTheme,
  useMediaQuery,
  IconButton,
  Avatar
} from '@mui/material';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowBack } from '@mui/icons-material';
import { useAuth } from '@/lib/contexts/AuthContext';
import AppHeader from '@/components/shared/AppHeader';
import WhatsAppChannelModal from '@/components/shared/WhatsAppChannelModal';
import { useState } from 'react';

// Diamond decorative component
const DiamondDecoration = () => (
  <Box
    sx={{
      width: { xs: 50, sm: 65 },
      height: { xs: 12, sm: 16 },
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#D1B99F',
      my: { xs: 0.5, sm: 0 },
    }}
  >
    <svg width="65" height="16" viewBox="0 0 65 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clipPath="url(#clip0_173_729)">
        <path 
          fillRule="evenodd" 
          clipRule="evenodd" 
          d="M15.6025 9.22518C16.4176 8.62308 16.4176 7.37669 15.6025 6.77459L9.35693 2.16121C8.84471 1.78285 8.15445 1.78285 7.64223 2.16121L1.39661 6.77459C0.581523 7.37669 0.581523 8.62308 1.39661 9.22518L7.64223 13.8386C8.15445 14.217 8.84471 14.217 9.35693 13.8386L15.6025 9.22518Z" 
          fill="currentColor"
        />
      </g>
      <g clipPath="url(#clip1_173_729)">
        <path 
          fillRule="evenodd" 
          clipRule="evenodd" 
          d="M39.6025 9.22518C40.4176 8.62308 40.4176 7.37669 39.6025 6.77459L33.3569 2.16121C32.8447 1.78285 32.1545 1.78285 31.6422 2.16121L25.3966 6.77459C24.5815 7.37669 24.5815 8.62308 25.3966 9.22518L31.6422 13.8386C32.1545 14.217 32.8447 14.217 33.3569 13.8386L39.6025 9.22518Z" 
          fill="currentColor"
        />
      </g>
      <g clipPath="url(#clip2_173_729)">
        <path 
          fillRule="evenodd" 
          clipRule="evenodd" 
          d="M63.6025 9.22518C64.4176 8.62308 64.4176 7.37669 63.6025 6.77459L57.3569 2.16121C56.8447 1.78285 56.1545 1.78285 55.6422 2.16121L49.3966 6.77459C48.5815 7.37669 48.5815 8.62308 49.3966 9.22518L55.6422 13.8386C56.1545 14.217 56.8447 14.217 57.3569 13.8386L63.6025 9.22518Z" 
          fill="currentColor"
        />
      </g>
      <defs>
        <clipPath id="clip0_173_729">
          <rect width="16" height="16" fill="white" transform="matrix(0 1 -1 0 16.5 0)"/>
        </clipPath>
        <clipPath id="clip1_173_729">
          <rect width="16" height="16" fill="white" transform="matrix(0 1 -1 0 40.5 0)"/>
        </clipPath>
        <clipPath id="clip2_173_729">
          <rect width="16" height="16" fill="white" transform="matrix(0 1 -1 0 64.5 0)"/>
        </clipPath>
      </defs>
    </svg>
  </Box>
);

// Menu item component
const MenuItem = ({
  title,
  onClick
}: {
  title: string;
  onClick: () => void;
}) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    style={{ cursor: 'pointer', width: '100%' }}
  >
    <Box
      sx={{
        py: { xs: 1.5, sm: 2 },
        px: { xs: 3, sm: 4 },
        borderRadius: 2,
        transition: 'all 0.2s ease-in-out',
        width: '100%',
        textAlign: 'center',
        '&:hover': {
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
        },
      }}
    >
      <Typography
        variant="h6"
        sx={{
          fontFamily: 'Outfit',
          fontWeight: 400,
          fontSize: { xs: 16, sm: 18, md: 20 },
          lineHeight: 1.5,
          letterSpacing: '5.56%',
          textTransform: 'uppercase',
          color: '#141414',
          textAlign: 'center',
        }}
      >
        {title}
      </Typography>
    </Box>
  </motion.div>
);

export default function DetailsPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const router = useRouter();
  const { user, hasRSVPed, rsvpResponse } = useAuth();
  
  // Only show WhatsApp button if user has RSVP'd "yes" or "maybe"
  const shouldShowWhatsApp = hasRSVPed && (rsvpResponse === 'yes' || rsvpResponse === 'maybe');
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);

  const handleBack = () => {
    router.push('/');
  };

  const handleMenuItemClick = (item: string) => {
    // Navigate to specific sections - you can implement these routes later
    switch (item) {
      case 'Travel & Stay':
        router.push('/travel');
        break;
      case 'Events & Dress code':
        router.push('/events');
        break;
      case 'Q & A':
        router.push('/faq');
        break;
      case 'Schedule':
        router.push('/schedule');
        break;
      case 'Registry':
        router.push('/registry');
        break;
      case 'Change RSVP':
        router.push('/rsvp');
        break;
      default:
        console.log(`Navigate to ${item}`);
    }
  };

  return (
    <Box
      sx={{
        height: '100dvh', // Use dynamic viewport height for mobile
        minHeight: '100vh', // Fallback for older browsers
        display: 'flex',
        flexDirection: 'column',
        backgroundImage: 'url(/images/backgrounds/pearl.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        overflow: 'hidden', // Prevent scrolling
        position: 'fixed', // Fix position to prevent mobile scroll
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      {/* Header with back button */}
      <Box
        sx={{
          position: 'absolute', // Changed to absolute positioning
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
            
            {/* WhatsApp Button - Only show if user RSVP'd yes or maybe */}
            {shouldShowWhatsApp && (
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
            )}
          </Stack>
        </Container>
      </Box>

      {/* Main Content */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 1,
          paddingTop: '80px', // Add top padding to clear the header
          paddingBottom: '40px', // Add bottom padding for balance
          overflow: 'auto', // Allow scrolling if content is too tall
        }}
      >
        <Container
          maxWidth={false}
          sx={{
            maxWidth: { xs: '100%', md: 600, lg: 700 },
            px: { xs: 2, md: 3 },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            py: 2,
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{ width: '100%' }}
          >
            <Stack spacing={{ xs: 1.5, sm: 2, md: 3 }} alignItems="center" sx={{ justifyContent: 'center' }}>
              {/* Menu Items */}
              <Stack
                spacing={{ xs: 1.5, sm: 2 }}
                sx={{
                  width: '100%',
                  maxWidth: { xs: '90%', sm: 361, md: 500, lg: 600 },
                  alignItems: 'center',
                }}
              >
                <MenuItem 
                  title="Travel & Stay" 
                  onClick={() => handleMenuItemClick('Travel & Stay')} 
                />
                <DiamondDecoration />
                <MenuItem 
                  title="Events & Dress code" 
                  onClick={() => handleMenuItemClick('Events & Dress code')} 
                />
                <DiamondDecoration />
                <MenuItem 
                  title="Q & A" 
                  onClick={() => handleMenuItemClick('Q & A')} 
                />
                <DiamondDecoration />
                <MenuItem 
                  title="Schedule" 
                  onClick={() => handleMenuItemClick('Schedule')} 
                />
                <DiamondDecoration />
                <MenuItem 
                  title="Registry" 
                  onClick={() => handleMenuItemClick('Registry')} 
                />
                <DiamondDecoration />
                <MenuItem 
                  title="Change RSVP" 
                  onClick={() => handleMenuItemClick('Change RSVP')} 
                />
              </Stack>
            </Stack>
          </motion.div>
        </Container>
      </Box>

      {/* WhatsApp Channel Modal */}
      <WhatsAppChannelModal 
        open={whatsAppModalOpen}
        onClose={() => setWhatsAppModalOpen(false)}
      />
    </Box>
  );
} 