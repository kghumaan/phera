'use client';

import { Box } from '@mui/material';
import { motion } from 'framer-motion';
import CustomRSVPForm from '@/components/guest/CustomRSVPForm';

export default function RSVPPage() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
        backgroundImage: 'url(/design-reference/backgrounds/BlueClouds.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Gradient Overlay */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.3) 100%)',
        }}
      />

      {/* Decorative Overlay */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1,
          backgroundImage: 'url(/design-reference/background-overlays/PedalsAndGreenPlantAndBirds.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.6,
          pointerEvents: 'none',
        }}
      />

      {/* RSVP Form */}
      <Box sx={{ position: 'relative', zIndex: 2 }}>
        <CustomRSVPForm />
      </Box>
    </Box>
  );
} 