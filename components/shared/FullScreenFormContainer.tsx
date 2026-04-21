'use client';

import { Box, Container, IconButton, Paper, Typography, useTheme, useMediaQuery } from '@mui/material';
import { motion } from 'framer-motion';
import { Close as CloseIcon } from '@mui/icons-material';
import { ReactNode, useState, useEffect } from 'react';
import { COLORS, RADII } from '@/lib/theme/tokens';

interface FullScreenFormContainerProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
}

export default function FullScreenFormContainer({
  title,
  onClose,
  children,
  maxWidth = 'sm',
}: FullScreenFormContainerProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [viewportHeight, setViewportHeight] = useState('100vh');

  useEffect(() => {
    const updateHeight = () => {
      setViewportHeight(`${window.innerHeight}px`);
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    window.addEventListener('orientationchange', updateHeight);
    window.addEventListener('scroll', updateHeight);

    return () => {
      window.removeEventListener('resize', updateHeight);
      window.removeEventListener('orientationchange', updateHeight);
      window.removeEventListener('scroll', updateHeight);
    };
  }, []);

  return (
    <Box
      sx={{
        position: isMobile ? 'fixed' : 'relative',
        top: isMobile ? 0 : 'auto',
        left: isMobile ? 0 : 'auto',
        right: isMobile ? 0 : 'auto',
        height: isMobile ? viewportHeight : 'auto',
        width: isMobile ? 'auto' : '100%',
        maxWidth: isMobile ? 'none' : { md: 550, lg: 600, xl: 650 },
        mx: isMobile ? 0 : 'auto',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        zIndex: isMobile ? 1400 : 1,
      }}
    >
      {/* Header - Only show on mobile, pinned to top */}
      {isMobile && (
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          height: 56,
          mt: 1.5,
          px: { xs: 2, sm: 3 },
          flexShrink: 0,
        }}>
          <IconButton
            onClick={onClose}
            sx={{
              color: COLORS.text.strong,
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
              color: COLORS.text.strong,
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
      )}

      <Container
        maxWidth={isMobile ? maxWidth : false}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          alignItems: 'center',
          flex: isMobile ? 1 : 'none',
          minHeight: 0,
          px: { xs: 2, sm: 3, md: 0 },
          overflow: 'hidden',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {/* White Container (Paper) */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 1.5, sm: 2.5, md: 4 },
              borderRadius: { xs: 1, md: 2 },
              border: '1px solid #000',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              color: COLORS.text.strong,
              display: 'flex',
              flexDirection: 'column',
              flex: 'none',
              width: '100%',
              overflow: 'hidden',
              // Fixed height on mobile so it stays consistent across steps
              height: isMobile ? '75svh' : 'auto',
              minHeight: isMobile ? 0 : { md: 600, lg: 650 },
              maxHeight: isMobile ? 'none' : { md: '80vh', lg: '85vh' },
            }}
          >
            {children}
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
}