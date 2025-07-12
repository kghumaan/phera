'use client';

import { Box, Container, IconButton, Paper, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { Close as CloseIcon } from '@mui/icons-material';
import { ReactNode, useState, useEffect } from 'react';

interface FullScreenFormContainerProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
  paperHeight?: string;
}

export default function FullScreenFormContainer({
  title,
  onClose,
  children,
  maxWidth = 'sm',
  paperHeight,
}: FullScreenFormContainerProps) {
  const [viewportHeight, setViewportHeight] = useState('100vh');

  useEffect(() => {
    const updateHeight = () => {
      setViewportHeight(`${window.innerHeight}px`);
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    window.addEventListener('orientationchange', updateHeight);
    window.addEventListener('scroll', updateHeight); // Add scroll listener

    return () => {
      window.removeEventListener('resize', updateHeight);
      window.removeEventListener('orientationchange', updateHeight);
      window.removeEventListener('scroll', updateHeight);
    };
  }, []);

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: viewportHeight, // Use dynamic height
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        zIndex: 1400, // High z-index for modal-like behavior
      }}
    >
      <Container 
        maxWidth={maxWidth} 
        sx={{ 
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          alignItems: 'center',
          height: '100%', // Changed from minHeight: '100vh'
          pt: 0,
          pb: { xs: 2, sm: 3 },
          px: { xs: 2, sm: 3, md: 4 },
          overflow: 'hidden',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ 
            width: '100%', 
            height: '100%', // Add height: '100%' to fill container
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {/* Header */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            width: '100%',
            height: 56,
            mb: { xs: 0.5, sm: 1 }, 
            flexShrink: 0,
          }}>
            <IconButton
              onClick={onClose}
              sx={{
                color: '#000',
                backgroundColor: 'transparent',
                p: { xs: 1, sm: 1.5 },
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                },
              }}
            >
              <CloseIcon />
            </IconButton>
            
            <Typography 
              variant="h6" 
              sx={{ 
                fontFamily: 'Outfit', 
                color: '#141414', 
                fontWeight: 400,
                lineHeight: '1.26em',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                textAlign: 'center'
              }}
            >
              {title}
            </Typography>
            
            {/* Spacer to center the title */}
            <Box sx={{ width: { xs: 40, sm: 48 } }} />
          </Box>

          {/* White Container (Paper) */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 1.5, sm: 2.5 },
              borderRadius: 1,
              border: '1px solid #000',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              color: '#000000',
              display: 'flex',
              flexDirection: 'column',
              flex: 1, // Changed to flex:1 to fill remaining space
              width: '100%',
              overflow: 'hidden',
              minHeight: 0, // Allow it to shrink if needed
              height: paperHeight, // Apply paperHeight if provided
            }}
          >
            {children}
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
} 