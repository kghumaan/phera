'use client';

import { 
  Box, 
  Container, 
  Typography,
  Stack
} from '@mui/material';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import OptimizedBackground from '@/components/ui/OptimizedBackground';
import { useEffect, useState } from 'react';
import Confetti from 'react-confetti';

export default function SuccessPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/registry');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <>
      <Confetti
        width={typeof window !== 'undefined' ? window.innerWidth : 1200}
        height={typeof window !== 'undefined' ? window.innerHeight : 800}
        recycle={false}
        numberOfPieces={200}
        gravity={0.3}
      />
      <OptimizedBackground
        src="/images/backgrounds/lavendar.png"
        alt="Lavendar Background"
        priority={true}
      >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Container maxWidth="sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            style={{ textAlign: 'center' }}
          >
            <Stack spacing={3} alignItems="center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                {/* <Typography
                  sx={{
                    fontSize: 80,
                    lineHeight: 1,
                  }}
                >
                  💝
                </Typography> */}
              </motion.div>

              <Typography
                variant="h4"
                sx={{
                  fontFamily: 'Instrument Serif',
                  fontWeight: 400,
                  fontSize: 32,
                  lineHeight: 1.3,
                  color: '#141414',
                  fontStyle: 'italic',
                }}
              >
                Thank You!
              </Typography>

              <Typography
                variant="body1"
                sx={{
                  fontFamily: 'Outfit',
                  fontWeight: 300,
                  fontSize: 16,
                  lineHeight: 1.5,
                  color: '#474747',
                  textAlign: 'center',
                  maxWidth: 400,
                }}
              >
                Your generous contribution means the world to us. Thank you for being part of our special journey!
              </Typography>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Box
                  component="button"
                  onClick={() => router.push('/registry')}
                  sx={{
                    backgroundColor: '#141414',
                    color: '#fff',
                    borderRadius: '16px',
                    border: 'none',
                    py: 2,
                    px: 4,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontFamily: 'Outfit',
                    fontSize: 14,
                    fontWeight: 500,
                    '&:hover': {
                      backgroundColor: '#2a2a2a',
                    },
                  }}
                >
                  Return to Registry ({countdown}s)
                </Box>
              </motion.div>
            </Stack>
          </motion.div>
        </Container>
      </Box>
    </OptimizedBackground>
    </>
  );
}