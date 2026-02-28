'use client';

import { Box, Button, Card, Chip, Stack, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { trackAgentCardClick } from '@/lib/utils/analytics';

interface AgentCardProps {
  id: string;
  name: string;
  persona: string;
  emoji: string;
  tagline: string;
  problem: string;
  solution: string;
  keyPoints: string[];
  pricing: number;
  badge: string;
  ctaType: 'waitlist' | 'pre-order' | 'learn-more';
  onCtaClick: (agentId: string, ctaType: string) => void;
}

export default function AgentCard({
  id,
  name,
  persona,
  emoji,
  tagline,
  problem,
  solution,
  keyPoints,
  pricing,
  badge,
  ctaType,
  onCtaClick,
}: AgentCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -5 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Card
        sx={{
          p: 3.5,
          height: '620px',
          width: { xs: '280px', sm: '320px', md: '360px' },
          borderRadius: '24px',
          bgcolor: 'white',
          color: '#1a1a1a',
          border: '1px solid',
          borderColor: isHovered ? '#DE3F5E' : 'rgba(0, 0, 0, 0.08)',
          transition: 'all 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          cursor: 'pointer',
          boxShadow: isHovered
            ? '0 12px 40px rgba(222, 63, 94, 0.15)'
            : '0 4px 20px rgba(0, 0, 0, 0.05)',
        }}
        onClick={() => {
          trackAgentCardClick(id);
          onCtaClick(id, 'card-click');
        }}
      >
        <Stack spacing={3} sx={{ flex: 1 }}>
          {/* Emoji and Badge */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}
          >
            <Box
              sx={{
                fontSize: '4rem',
                lineHeight: 1,
              }}
            >
              {emoji}
            </Box>
            <Chip
              label={badge}
              size="small"
              sx={{
                bgcolor: '#FFF3E0',
                color: '#E65100',
                fontWeight: 700,
                fontSize: '0.75rem',
                height: '28px',
                px: 1,
              }}
            />
          </Box>

          {/* Name and Tagline */}
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: '#1a1a1a',
                mb: 0.5,
              }}
            >
              {name} {persona}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: '#DE3F5E',
                fontWeight: 500,
                fontSize: '1rem',
              }}
            >
              {tagline}
            </Typography>
          </Box>

          {/* Key Points */}
          <Box sx={{ flex: 1 }}>
            <Stack spacing={1.5}>
              {keyPoints.map((point, idx) => (
                <Box
                  key={idx}
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1.5,
                  }}
                >
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      bgcolor: '#DE3F5E',
                      mt: 1,
                      flexShrink: 0,
                    }}
                  />
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#4a4a4a',
                      lineHeight: 1.6,
                      fontSize: '1rem',
                    }}
                  >
                    {point}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>

          {/* Quote at bottom */}
          <Typography
            variant="body2"
            sx={{
              color: '#666',
              fontStyle: 'italic',
              lineHeight: 1.5,
              fontSize: '0.9rem',
              borderLeft: '3px solid #DE3F5E',
              pl: 2,
              py: 1,
            }}
          >
            "{problem}"
          </Typography>

          {/* Pricing */}
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: '#1a1a1a',
              pt: 1,
            }}
          >
            ${pricing}
            <Typography
              component="span"
              variant="body2"
              sx={{ color: '#666', fontWeight: 400, ml: 0.5 }}
            >
              /wedding
            </Typography>
          </Typography>

          {/* Details Button */}
          <Button
            variant="outlined"
            fullWidth
            onClick={(e) => {
              e.stopPropagation();
              onCtaClick(id, 'learn-more');
            }}
            sx={{
              borderColor: '#DE3F5E',
              color: '#DE3F5E',
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 600,
              py: 1,
              fontSize: '0.95rem',
              mt: 'auto',
              '&:hover': {
                borderColor: '#C8365A',
                bgcolor: 'rgba(222, 63, 94, 0.05)',
              },
            }}
          >
            Details
          </Button>
        </Stack>
      </Card>
    </motion.div>
  );
}

