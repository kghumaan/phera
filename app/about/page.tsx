'use client';

import {
  Container,
  Typography,
  Box,
  Stack,
  Grid,
  IconButton,
  alpha,
  Paper
} from '@mui/material';
import {
  Instagram,
  Email,
  WhatsApp,
  LinkedIn,
  Language
} from '@mui/icons-material';
import Image from 'next/image';
import { motion } from 'framer-motion';
import AppHeader from '@/components/shared/AppHeader';
import OptimizedBackground from '@/components/ui/OptimizedBackground';
import { BACKGROUNDS } from '@/lib/constants/images';
import AppFooter from '@/components/shared/AppFooter';


export default function AboutPage() {
  return (
    <OptimizedBackground src={BACKGROUNDS.ROSE_QUARTZ} className="min-h-screen flex flex-col">

      <AppHeader variant="transparent" />

      <Box component="main" sx={{ flexGrow: 1, pt: { xs: 12, md: 20 }, pb: 10 }}>
        <Container maxWidth="lg">
          <Grid container spacing={{ xs: 6, md: 10 }} alignItems="center">
            {/* --- Image Section --- */}
            <Grid size={{ xs: 12, md: 6 }}>
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                <Box
                  sx={{
                    position: 'relative',
                    borderRadius: '40px',
                    overflow: 'hidden',
                    aspectRatio: '1/1',
                    boxShadow: '0 30px 60px rgba(0,0,0,0.1)',
                    border: '8px solid white',
                  }}
                >
                  <Image
                    src="/images/couple/couple-8.jpg"
                    alt="Founders of Phera"
                    fill
                    style={{ objectFit: 'cover' }}
                    priority
                  />
                </Box>
              </motion.div>
            </Grid>

            {/* --- Content Section --- */}
            <Grid size={{ xs: 12, md: 6 }}>
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <Stack spacing={4}>
                  <Box>
                    <Typography
                      variant="h2"
                      sx={{
                        fontFamily: 'var(--font-instrument-serif)',
                        fontStyle: 'italic',
                        fontSize: { xs: '3rem', md: '4.5rem' },
                        color: '#1a1a1a',
                        mb: 2,
                        lineHeight: 1.1,
                      }}
                    >
                      Our Story
                    </Typography>
                    <Box
                      sx={{
                        width: '60px',
                        height: '4px',
                        bgcolor: '#DE3F5E',
                        borderRadius: '2px',
                        mb: 4,
                      }}
                    />
                  </Box>

                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: '1.2rem',
                      lineHeight: 1.8,
                      color: '#444',
                      fontWeight: 400,
                    }}
                  >
                    We built Phera because we were that "frustrated couple." Planning an Indian wedding comes with a
                    level of complexity that most global platforms just don't understand. Between managing guest lists spanning continents,
                    explaining traditional rituals to our non-desi friends, and handling endless WhatsApp queries, we knew there
                    had to be a better way.
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: '1.2rem',
                      lineHeight: 1.8,
                      color: '#444',
                      fontWeight: 400,
                    }}
                  >
                    What started as a tool built for our own special day has now grown into a platform we're opening up
                    for everyone else. We want to bring back the joy of planning and let you focus on what really matters—celebrating your love.
                  </Typography>

                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      bgcolor: alpha('#DE3F5E', 0.04),
                      borderRadius: '24px',
                      border: '1px solid',
                      borderColor: alpha('#DE3F5E', 0.1),
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: '1rem',
                        color: '#666',
                        fontStyle: 'italic',
                      }}
                    >
                      "We're a young product and always improving. If you have suggestions or just want to chat about your
                      wedding, please shoot us a message!"
                    </Typography>
                  </Paper>

                  <Stack spacing={3}>
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: 'bold', color: '#1a1a1a' }}
                    >
                      Connect with the founders:
                    </Typography>

                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      justifyContent="space-between"
                      alignItems={{ xs: 'flex-start', sm: 'center' }}
                      spacing={3}
                      sx={{ width: '100%' }}
                    >
                      {/* Sim (Left) */}
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Typography sx={{ fontWeight: 700, color: '#1a1a1a' }}>Sim</Typography>
                        <Stack direction="row" spacing={1}>
                          <IconButton
                            component="a"
                            href="https://www.instagram.com/simransimranaway/"
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                              color: '#DE3F5E',
                              bgcolor: alpha('#DE3F5E', 0.1),
                              '&:hover': { bgcolor: alpha('#DE3F5E', 0.2) },
                              width: 32,
                              height: 32,
                            }}
                          >
                            <Instagram sx={{ fontSize: '1rem' }} />
                          </IconButton>
                          <IconButton
                            component="a"
                            href="https://www.linkedin.com/in/simransavani/"
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                              color: '#DE3F5E',
                              bgcolor: alpha('#DE3F5E', 0.1),
                              '&:hover': { bgcolor: alpha('#DE3F5E', 0.2) },
                              width: 32,
                              height: 32,
                            }}
                          >
                            <LinkedIn sx={{ fontSize: '1rem' }} />
                          </IconButton>
                          <IconButton
                            component="a"
                            href="https://simmetrystudios.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                              color: '#DE3F5E',
                              bgcolor: alpha('#DE3F5E', 0.1),
                              '&:hover': { bgcolor: alpha('#DE3F5E', 0.2) },
                              width: 32,
                              height: 32,
                            }}
                          >
                            <Language sx={{ fontSize: '1rem' }} />
                          </IconButton>
                        </Stack>
                      </Stack>

                      {/* KV (Right) */}
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Typography sx={{ fontWeight: 700, color: '#1a1a1a', textAlign: 'right' }}>KV</Typography>

                        <Stack direction="row" spacing={1}>
                          <IconButton
                            component="a"
                            href="https://www.instagram.com/kvghumaan/"
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                              color: '#DE3F5E',
                              bgcolor: alpha('#DE3F5E', 0.1),
                              '&:hover': { bgcolor: alpha('#DE3F5E', 0.2) },
                              width: 32,
                              height: 32,
                            }}
                          >
                            <Instagram sx={{ fontSize: '1rem' }} />
                          </IconButton>
                          <IconButton
                            component="a"
                            href="https://www.linkedin.com/in/kv-ghumaan-132863a3/"
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                              color: '#DE3F5E',
                              bgcolor: alpha('#DE3F5E', 0.1),
                              '&:hover': { bgcolor: alpha('#DE3F5E', 0.2) },
                              width: 32,
                              height: 32,
                            }}
                          >
                            <LinkedIn sx={{ fontSize: '1rem' }} />
                          </IconButton>
                        </Stack>
                      </Stack>
                    </Stack>
                  </Stack>
                </Stack>
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      </Box>
      <AppFooter />
    </OptimizedBackground>
  );
}

