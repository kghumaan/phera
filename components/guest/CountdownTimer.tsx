'use client';

import { Box, Typography, Paper, useTheme, useMediaQuery } from '@mui/material';
import { motion } from 'framer-motion';
import { useCountdown } from '@/lib/hooks/useCountdown';
import { animations } from '@/lib/animations/cultural';

interface CountdownTimerProps {
  targetDate: string;
}

export function CountdownTimer({ targetDate }: CountdownTimerProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const timeLeft = useCountdown(targetDate);

  // Hide countdown when date is TBD (epoch sentinel)
  if (new Date(targetDate).getTime() === 0) return null;

  const timeUnits = [
    { label: 'Days', value: timeLeft.days },
    { label: 'Hours', value: timeLeft.hours },
    { label: 'Minutes', value: timeLeft.minutes },
    { label: 'Seconds', value: timeLeft.seconds },
  ];

  return (
    <motion.div
      initial={animations.heroFadeIn.initial}
      animate={animations.heroFadeIn.animate}
      transition={animations.heroFadeIn.transition}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: { xs: 2, md: 3 },
          justifyContent: 'center',
          alignItems: 'center',
          mb: 4,
        }}
      >
        {timeUnits.map((unit, index) => (
          <motion.div
            key={unit.label}
            animate={animations.countdownPulse.animate}
            transition={{
              ...animations.countdownPulse.transition,
              delay: index * 0.1,
            }}
          >
            <Paper
              elevation={3}
              sx={{
                p: { xs: 2, md: 3 },
                textAlign: 'center',
                background: `linear-gradient(135deg, ${theme.palette.primary.main}15, ${theme.palette.secondary.main}15)`,
                border: `1px solid ${theme.palette.primary.main}30`,
                borderRadius: 3,
                minWidth: { xs: 80, md: 100 },
                backdropFilter: 'blur(10px)',
              }}
            >
              <Typography
                variant="h3"
                component="div"
                sx={{
                  fontWeight: 700,
                  color: theme.palette.primary.main,
                  fontSize: { xs: '2rem', md: '2.5rem' },
                  lineHeight: 1,
                }}
              >
                {unit.value.toString().padStart(2, '0')}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: theme.palette.text.secondary,
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  fontSize: { xs: '0.75rem', md: '0.875rem' },
                  mt: 0.5,
                }}
              >
                {unit.label}
              </Typography>
            </Paper>
          </motion.div>
        ))}
      </Box>
    </motion.div>
  );
} 