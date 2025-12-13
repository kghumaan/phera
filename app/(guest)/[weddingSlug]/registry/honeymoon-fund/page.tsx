'use client';

import { Box, Container, Typography, IconButton, Stack, Button } from '@mui/material';
import { motion } from 'framer-motion';
import OptimizedBackground from '@/components/ui/OptimizedBackground';
import { useRouter } from 'next/navigation';
import { ArrowBack } from '@mui/icons-material';
import { useParams } from 'next/navigation';
import { useState } from 'react';

export default function HoneymoonFundPage() {
  const params = useParams();
  const weddingId = params.weddingSlug as string;
  
  const router = useRouter();
  
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
              onClick={() => router.push(`/${weddingId}/registry`)}
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
              Honeymoon Fund
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
              textAlign: 'center',
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
              Honeymoon Fund
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
              Join us on our dream honeymoon adventure! Your contribution will help us create unforgettable memories as we start our married life together.
            </Typography>
            
            <Button
              variant="contained"
              href="https://www.zola.com/registry/simranandkaranvir"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                backgroundColor: '#DE3F5E',
                color: 'white',
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600,
                borderRadius: '32px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                boxShadow: '0 4px 16px rgba(222, 63, 94, 0.3)',
                '&:hover': {
                  backgroundColor: '#C8365A',
                  boxShadow: '0 6px 20px rgba(222, 63, 94, 0.4)',
                },
              }}
            >
              Contribute Now
            </Button>
          </Box>
        </motion.div>
      </Container>
    </OptimizedBackground>
  );
}