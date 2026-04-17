'use client';

import { Box, Typography, Button, Container } from '@mui/material';
import Link from 'next/link';
import Image from 'next/image';
import OptimizedBackground from '@/components/ui/OptimizedBackground';
import { motion } from 'framer-motion';
import { COLORS, FONTS, RADII } from '@/lib/theme/tokens';

export default function NotFound() {
  return (
    <OptimizedBackground useAppDefault={true}>
      <Container maxWidth="sm">
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            px: 2,
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Box
              sx={{
                width: { xs: 150, md: 240 },
                height: { xs: 60, md: 100 },
                position: 'relative',
                mb: 4,
                mx: 'auto',
              }}
            >
              <Image
                src="/logo.svg"
                alt="Phera Logo"
                fill
                priority
                style={{
                  objectFit: 'contain',
                  filter: 'brightness(0)',
                }}
              />
            </Box>

            <Typography
              variant="h2"
              sx={{
                fontFamily: FONTS.display,
                fontSize: { xs: '3rem', md: '4.5rem' },
                color: COLORS.text.strong,
                mb: 1,
              }}
            >
              uh-oh
            </Typography>

            <Typography
              variant="h5"
              sx={{
                color: COLORS.text.muted,
                mb: 6,
                fontWeight: 400,
                lineHeight: 1.6,
                fontSize: { xs: '1.1rem', md: '1.5rem' },
              }}
            >
              looks like this page doesn't exist
            </Typography>

            <Button
              component={Link}
              href="/"
              variant="contained"
              size="large"
              sx={{
                bgcolor: COLORS.brand.primary,
                color: 'white',
                px: 6,
                py: 2,
                borderRadius: '40px',
                fontSize: '1.1rem',
                textTransform: 'none',
                fontWeight: 600,
                boxShadow: '0 4px 14px rgba(222, 63, 94, 0.39)',
                '&:hover': { 
                  bgcolor: COLORS.brand.primaryHover,
                  boxShadow: '0 6px 20px rgba(222, 63, 94, 0.23)',
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.2s',
              }}
            >
              Go Back Home
            </Button>
          </motion.div>
        </Box>
      </Container>
    </OptimizedBackground>
  );
}
