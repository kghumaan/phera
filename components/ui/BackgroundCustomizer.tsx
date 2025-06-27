'use client';

import { Box, Button, Stack, Typography, Paper, Chip } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

interface BackgroundOption {
  name: string;
  path: string;
  preview: string;
}

interface BackgroundCustomizerProps {
  onBackgroundChange?: (backgroundPath: string) => void;
}

const backgrounds: BackgroundOption[] = [
  {
    name: 'Blue Clouds',
    path: '/images/backgrounds/blue-clouds.jpg',
    preview: '☁️'
  },
  {
    name: 'Green',
    path: '/images/backgrounds/green.jpg',
    preview: '🌿'
  },
  {
    name: 'Rose',
    path: '/images/backgrounds/rose.jpg',
    preview: '🌹'
  },
  {
    name: 'Haldi',
    path: '/images/backgrounds/haldi-optimized.jpg',
    preview: '💛'
  },
  {
    name: 'Mehndi',
    path: '/images/backgrounds/mehndi-optimized.jpg',
    preview: '🎨'
  },
  {
    name: 'Pool',
    path: '/images/backgrounds/pool-optimized.jpg',
    preview: '🏊‍♀️'
  }
];

export function BackgroundCustomizer({ onBackgroundChange }: BackgroundCustomizerProps) {
  const [selectedBackground, setSelectedBackground] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleBackgroundChange = (index: number) => {
    setSelectedBackground(index);
    onBackgroundChange?.(backgrounds[index].path);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Paper
        elevation={3}
        sx={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          p: 2,
          borderRadius: 3,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          zIndex: 1000,
          minWidth: 200,
        }}
      >
        <Stack spacing={2}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
              Background
            </Typography>
            <Button
              size="small"
              onClick={() => setIsExpanded(!isExpanded)}
              sx={{ minWidth: 'auto', p: 0.5 }}
            >
              {isExpanded ? '▼' : '▲'}
            </Button>
          </Box>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Stack spacing={3}>
                  {/* Background Selection */}
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                      Choose Background
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {backgrounds.map((bg, index) => (
                        <Chip
                          key={bg.name}
                          label={`${bg.preview} ${bg.name}`}
                          onClick={() => handleBackgroundChange(index)}
                          variant={selectedBackground === index ? 'filled' : 'outlined'}
                          color={selectedBackground === index ? 'primary' : 'default'}
                          size="small"
                          sx={{ fontSize: '0.75rem', mb: 1 }}
                        />
                      ))}
                    </Stack>
                  </Box>

                  {/* Quick Preview */}
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                      Preview
                    </Typography>
                    <Box
                      sx={{
                        width: '100%',
                        height: 60,
                        borderRadius: 2,
                        overflow: 'hidden',
                        position: 'relative',
                        border: '1px solid #e0e0e0',
                      }}
                    >
                      {/* Preview Background */}
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundImage: `url(${backgrounds[selectedBackground].path})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        }}
                      />
                    </Box>
                  </Box>
                </Stack>
              </motion.div>
            )}
          </AnimatePresence>
        </Stack>
      </Paper>
    </motion.div>
  );
} 