'use client';

import { Box, Container, Typography, IconButton, Stack } from '@mui/material';
import { motion } from 'framer-motion';
import OptimizedBackground from '@/components/ui/OptimizedBackground';
import { useRouter } from 'next/navigation';
import { ArrowBack } from '@mui/icons-material';
import { useParams } from 'next/navigation';
import { useState } from 'react';

export default function EventDetailPage() {
  const params = useParams();
  const weddingId = params.weddingId as string;
  const eventSlug = params.slug as string;
  
  const router = useRouter();
  
  // For now, we'll display a basic event detail page based on the slug
  // In a real implementation, you'd fetch event details from a database/API
  const eventName = eventSlug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

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
                fontFamily: 'Outfit',
                fontWeight: 400,
                fontSize: 18,
                lineHeight: 1.5,
                letterSpacing: '5.56%',
                textTransform: 'uppercase',
                color: '#141414',
              }}
            >
              Event Details
            </Typography>
            <Box sx={{ width: 48 }} /> {/* Spacer */}
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
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Box
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              p: 4,
              boxShadow: '0px 0px 32px 0px rgba(0, 0, 0, 0.12)',
            }}
          >
            <Typography
              variant="h4"
              sx={{
                fontFamily: 'Outfit',
                fontWeight: 600,
                fontSize: 28,
                lineHeight: 1.3,
                color: '#141414',
                mb: 2,
              }}
            >
              {eventName}
            </Typography>
            
            <Typography
              variant="body1"
              sx={{
                fontFamily: 'Outfit',
                fontWeight: 400,
                fontSize: 18,
                lineHeight: 1.5,
                color: '#141414',
                mb: 3,
              }}
            >
              Event details for {eventName} at {weddingId}'s wedding will be displayed here.
            </Typography>
            
            <Typography
              variant="body2"
              sx={{
                fontFamily: 'Outfit',
                fontWeight: 300,
                fontSize: 16,
                lineHeight: 1.5,
                color: '#666',
                fontStyle: 'italic',
              }}
            >
              Event slug: {eventSlug}
            </Typography>
          </Box>
        </motion.div>
      </Container>
    </OptimizedBackground>
  );
}