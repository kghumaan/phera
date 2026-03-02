'use client';

import { Box, Container, Typography, IconButton, Stack, useTheme, useMediaQuery, CircularProgress } from '@mui/material';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import OptimizedBackground from '@/components/ui/OptimizedBackground';
import AppHeader from '@/components/shared/AppHeader';
import { useRouter } from 'next/navigation';
import { ArrowBack } from '@mui/icons-material';
import { useParams } from 'next/navigation';
import { useWedding } from '@/lib/contexts/WeddingContext';
import type { WeddingShop } from '@/lib/supabase/wedding-service';

export default function WhereToShopPage() {
  const params = useParams();
  const weddingId = params.weddingSlug as string;

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const router = useRouter();
  const { wedding, shops: contextShops, isLoading: contextLoading } = useWedding();
  const [shops, setShops] = useState<WeddingShop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!contextLoading) {
      setShops(contextShops);
      setLoading(false);
    }
  }, [contextShops, contextLoading]);

  return (
    <OptimizedBackground
      src="/images/backgrounds/aquarium.png"
      className="min-h-screen"
    >
      {/* Desktop Header - AppHeader with consistent styling */}
      {!isMobile && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10,
            backgroundColor: 'transparent',
          }}
        >
          <AppHeader
            variant="transparent"
            showBackButton={true}
            backHref={`/${weddingId}/events`}
          />
        </Box>
      )}

      {/* Mobile Header */}
      {isMobile && (
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
                onClick={() => router.push(`/${weddingId}/events`)}
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
      )}

      {/* Main Content */}
      <Container
        maxWidth={false}
        sx={{
          maxWidth: { xs: '100%', md: 800, lg: 900 },
          px: { xs: 2, md: 4 },
          pb: 4,
          pt: { xs: 10, md: 14 },
          ...(loading || shops.length === 0 ? {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '80vh',
          } : {}),
        }}
      >
        {loading ? (
          <CircularProgress sx={{ color: wedding?.primary_color || '#DE3F5E' }} />
        ) : shops.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Typography
              sx={{
                fontSize: 18,
                color: '#6a6a6a',
                textAlign: 'center',
              }}
            >
              No shops configured yet.
            </Typography>
          </motion.div>
        ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Stack spacing={2}>
            {/* Description */}
            <Typography
              variant="body2"
              sx={{
                fontWeight: 300,
                fontSize: 16,
                lineHeight: 1.5,
                color: '#141414',
                textAlign: 'center',
                mb: 2,
              }}
            >
             Online boutiques that ship internationally with reasonable timelines and prices.
            </Typography>

            {/* Store Cards */}
            <Stack spacing={2}>
              {shops.map((shop, index) => (
                <motion.div
                  key={shop.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                >
                  <Box
                    component="a"
                    href={shop.url || undefined}
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
                            fontWeight: 500,
                            fontSize: 20,
                            lineHeight: 1.3,
                            color: '#141414',
                            mb: 1,
                          }}
                        >
                          {shop.name}
                        </Typography>

                        {/* Store Details */}
                        {shop.details && (
                        <Stack spacing={0.5}>
                          {shop.details.split('\n').map((detail, idx) => (
                            <Typography
                              key={idx}
                              component="div"
                              variant="body2"
                              sx={{
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
                                component="span"
                                sx={{
                                  width: 4,
                                  height: 4,
                                  backgroundColor: '#141414',
                                  borderRadius: '50%',
                                  flexShrink: 0,
                                  display: 'inline-block',
                                }}
                              />
                              <span>{detail}</span>
                            </Typography>
                          ))}
                        </Stack>
                        )}
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
        )}
      </Container>
    </OptimizedBackground>
  );
} 