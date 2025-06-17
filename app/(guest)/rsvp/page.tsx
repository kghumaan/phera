'use client';

import { Box } from '@mui/material';
import { motion } from 'framer-motion';
import CustomRSVPForm from '@/components/guest/CustomRSVPForm';
import OptimizedBackground from '@/components/ui/OptimizedBackground';

export default function RSVPPage() {
  return (
    <OptimizedBackground 
      useAppDefault={true}
      className="min-h-screen"
    >
      {/* Gradient Overlay for better form readability */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.3) 100%)',
          zIndex: 1,
        }}
      />

      {/* RSVP Form */}
      <Box sx={{ position: 'relative', zIndex: 2 }}>
        <CustomRSVPForm />
      </Box>
    </OptimizedBackground>
  );
} 