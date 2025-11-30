'use client';

import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  Paper,
  Grid,
  useTheme,
  alpha,
} from '@mui/material';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Celebration,
  Devices,
  Security,
  ArrowForward,
} from '@mui/icons-material';
import AppHeader from '@/components/shared/AppHeader';
import OptimizedBackground from '@/components/ui/OptimizedBackground';
import { useState } from 'react';
import LoginModal from '@/components/auth/LoginModal';

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

export default function LandingPage() {
  const theme = useTheme();
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);

  const features = [
    {
      icon: <Devices fontSize="large" sx={{ color: '#DE3F5E' }} />,
      title: 'Guest Portal',
      description:
        'A mobile-first experience for your guests to RSVP, view events, and share memories.',
    },
    {
      icon: <Security fontSize="large" sx={{ color: '#DE3F5E' }} />,
      title: 'Secure Access',
      description:
        'PIN-based authentication ensuring your wedding details remain private and exclusive.',
    },
    {
      icon: <Celebration fontSize="large" sx={{ color: '#DE3F5E' }} />,
      title: 'Cultural Design',
      description:
        'Beautifully crafted interfaces inspired by traditional Indian wedding aesthetics.',
    },
  ];

  return (
    <OptimizedBackground useAppDefault={true} className="min-h-screen flex flex-col">
      <AppHeader
        variant="transparent"
        onLoginClick={() => setLoginDialogOpen(true)}
      />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          pt: { xs: 12, md: 16 },
          pb: 8,
        }}
      >
        <Container maxWidth="lg">
          <Stack spacing={{ xs: 8, md: 12 }}>
            {/* Hero Section */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeIn}
            >
              <Stack spacing={4} alignItems="center" textAlign="center">
                {/* <Box
                  sx={{
                    display: 'inline-block',
                    px: 2,
                    py: 0.5,
                    borderRadius: '16px',
                    bgcolor: alpha('#DE3F5E', 0.1),
                    color: '#DE3F5E',
                    typography: 'subtitle2',
                    fontWeight: 600,
                    letterSpacing: 1,
                    textTransform: 'uppercase',
                  }}
                >
                  Welcome to Phera
                </Box> */}

                <Typography
                  variant="h1"
                  sx={{
                    fontFamily: 'var(--font-instrument-serif)',
                    fontSize: { xs: '3rem', md: '4.5rem', lg: '5.5rem' },
                    lineHeight: 1.1,
                    color: '#1a1a1a',
                    maxWidth: '900px',
                  }}
                >
                  The Modern Indian Wedding Platform
                </Typography>

                <Typography
                  variant="body1"
                  sx={{
                    fontSize: { xs: '1.125rem', md: '1.25rem' },
                    color: '#4a4a4a',
                    maxWidth: '600px',
                    lineHeight: 1.6,
                  }}
                >
                  Seamlessly manage your wedding with a dual-experience platform designed for you and your guests.
                </Typography>

                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={2}
                  pt={2}
                  width={{ xs: '100%', sm: 'auto' }}
                >
                  <Button
                    component={Link}
                    href="/sim-kv"
                    variant="contained"
                    size="large"
                    endIcon={<ArrowForward />}
                    sx={{
                      bgcolor: '#DE3F5E',
                      color: 'white',
                      px: 4,
                      py: 1.5,
                      borderRadius: '32px',
                      fontSize: '1.125rem',
                      textTransform: 'none',
                      boxShadow: '0 8px 24px rgba(222, 63, 94, 0.25)',
                      '&:hover': {
                        bgcolor: '#C8365A',
                        boxShadow: '0 12px 32px rgba(222, 63, 94, 0.35)',
                      },
                    }}
                  >
                    View Demo Wedding
                  </Button>
                  <Button
                    onClick={() => setLoginDialogOpen(true)}
                    variant="outlined"
                    size="large"
                    sx={{
                      borderColor: '#DE3F5E',
                      color: '#DE3F5E',
                      px: 4,
                      py: 1.5,
                      borderRadius: '32px',
                      fontSize: '1.125rem',
                      textTransform: 'none',
                      borderWidth: 2,
                      '&:hover': {
                        borderWidth: 2,
                        bgcolor: alpha('#DE3F5E', 0.05),
                        borderColor: '#C8365A',
                      },
                    }}
                  >
                    Admin Login
                  </Button>
                </Stack>
              </Stack>
            </motion.div>

            {/* Features Section */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
              variants={staggerContainer}
            >
              <Grid container spacing={4} justifyContent="center">
                {features.map((feature, index) => (
                  <Grid size={{ xs: 12, md: 4 }} key={index}>
                    <motion.div variants={fadeIn}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 4,
                          height: '100%',
                          borderRadius: '32px',
                          bgcolor: 'rgba(255, 255, 255, 0.6)',
                          backdropFilter: 'blur(20px)',
                          border: '1px solid rgba(255, 255, 255, 0.8)',
                          transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                          '&:hover': {
                            transform: 'translateY(-8px)',
                            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.08)',
                          },
                        }}
                      >
                        <Stack spacing={2} alignItems="flex-start">
                          <Box
                            sx={{
                              p: 1.5,
                              borderRadius: '16px',
                              bgcolor: alpha('#DE3F5E', 0.1),
                              mb: 1,
                            }}
                          >
                            {feature.icon}
                          </Box>
                          <Typography
                            variant="h5"
                            sx={{
                              fontFamily: 'var(--font-instrument-serif)',
                              fontWeight: 600,
                            }}
                          >
                            {feature.title}
                          </Typography>
                          <Typography
                            variant="body1"
                            sx={{ color: '#5a5a5a', lineHeight: 1.6 }}
                          >
                            {feature.description}
                          </Typography>
                        </Stack>
                      </Paper>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>
            </motion.div>
          </Stack>
        </Container>
      </Box>

      <LoginModal
        open={loginDialogOpen}
        onClose={() => setLoginDialogOpen(false)}
        onSuccess={() => {
          console.log('Login successful');
        }}
      />
    </OptimizedBackground>
  );
}
