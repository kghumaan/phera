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

// Diamond decorative component
const DiamondDecoration = () => (
  <Box
    sx={{
      width: 65,
      height: 16,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#D1B99F',
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
    style={{ cursor: 'pointer' }}
  >
    <Box
      sx={{
        py: 2,
        px: 4,
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
          fontSize: 18,
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
  const { user, rsvpResponse } = useAuth();

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
        <Container maxWidth="sm">
          <Stack direction="row" alignItems="center" justifyContent="flex-start">
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
          maxHeight: '100%', // Ensure content doesn't exceed container
          marginTop: '-40px',
          paddingBottom: '20px', // Add bottom padding for balance
          // Removed marginTop offset since header is now absolutely positioned
        }}
      >
        <Container maxWidth="sm" sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{ width: '100%' }}
          >
            <Stack spacing={3} alignItems="center" sx={{ justifyContent: 'center' }}>
              {/* Menu Items */}
              <Stack 
                spacing={2} 
                sx={{ 
                  width: '100%', 
                  maxWidth: 361,
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
              </Stack>
            </Stack>
          </motion.div>
        </Container>
      </Box>
    </Box>
  );
} 