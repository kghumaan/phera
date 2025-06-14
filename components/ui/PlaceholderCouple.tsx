'use client';

import { Box, Avatar, Stack } from '@mui/material';
import { motion } from 'framer-motion';

interface PlaceholderCoupleProps {
  size?: number;
}

export function PlaceholderCouple({ size = 300 }: PlaceholderCoupleProps) {
  return (
    <Stack
      direction="row"
      spacing={-2}
      alignItems="center"
      justifyContent="center"
      sx={{ 
        width: size,
        height: size,
        position: 'relative',
        mx: 'auto',
        background: 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)',
        borderRadius: 4,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'url("/design-reference/background-overlays/PedalsAndGreenPlantAndBirds.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.3,
          zIndex: 1,
        }
      }}
    >
      {/* Simulated couple photo */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1, delay: 0.2 }}
        style={{ position: 'relative', zIndex: 2 }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <Avatar
            sx={{
              width: 80,
              height: 80,
              bgcolor: '#8B4513',
              fontSize: '2rem',
              border: '3px solid white',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            }}
          >
            👨🏽
          </Avatar>
          <Avatar
            sx={{
              width: 80,
              height: 80,
              bgcolor: '#D2691E',
              fontSize: '2rem',
              border: '3px solid white',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            }}
          >
            👩🏽
          </Avatar>
        </Stack>
      </motion.div>
      
      {/* Decorative hearts */}
      <motion.div
        animate={{ rotate: [0, 10, -10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        style={{
          position: 'absolute',
          top: '15%',
          right: '15%',
          fontSize: '1.5rem',
          zIndex: 3,
        }}
      >
        💖
      </motion.div>
      
      <motion.div
        animate={{ rotate: [0, -10, 10, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
        style={{
          position: 'absolute',
          bottom: '15%',
          left: '15%',
          fontSize: '1.2rem',
          zIndex: 3,
        }}
      >
        💕
      </motion.div>
    </Stack>
  );
} 