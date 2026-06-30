'use client';

import { Box, Container, Typography, Stack, IconButton, useTheme, useMediaQuery } from '@mui/material';
import { motion } from 'framer-motion';
import { ArrowBack } from '@mui/icons-material';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import OptimizedBackground from '@/components/ui/OptimizedBackground';
import AppHeader from '@/components/shared/AppHeader';
import { useWedding } from '@/lib/contexts/WeddingContext';
import { weddingService, type WeddingEvent } from '@/lib/supabase/wedding-service';
import { COLORS, RADII, FONTS } from '@/lib/theme/tokens';

/** First image slide on an event, if any — gives each function a visual. */
function firstImage(event: WeddingEvent): string | null {
  return event.carousel_slides?.find((s) => s.type === 'image' && s.src)?.src ?? null;
}

/** outfit_ideas_* are stored as JSON — read defensively as a string list. */
function asList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}

/**
 * Guest-facing "First Indian wedding?" cultural guide. A warm primer for
 * non-Indian / reverse-destination guests that reuses the couple's existing
 * per-event data (significance, dress code, outfit ideas, images) — so they
 * know what each function is and what to wear, without the couple writing
 * anything new. See docs/SERVICES-CATALOG.md (reverse-destination guide).
 */
export default function CulturalGuidePage() {
  const params = useParams();
  const weddingSlug = params.weddingSlug as string;

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const router = useRouter();
  const { wedding } = useWedding();

  const [events, setEvents] = useState<WeddingEvent[]>([]);

  useEffect(() => {
    if (!wedding?.id) return;
    weddingService.getWeddingEvents(wedding.id).then(setEvents);
  }, [wedding?.id]);

  return (
    <OptimizedBackground
      src={wedding?.background_image || undefined}
      useAppDefault={!wedding?.background_image}
      className="min-h-screen"
    >
      {/* Desktop header */}
      {!isMobile && (
        <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10, backgroundColor: 'transparent' }}>
          <AppHeader variant="transparent" showBackButton backHref={`/${weddingSlug}/details`} />
        </Box>
      )}

      {/* Mobile header */}
      {isMobile && (
        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 2, pt: 2, pb: 2 }}>
          <Container maxWidth={false} sx={{ maxWidth: { xs: 361, md: 600, lg: 700 }, px: { xs: 2, md: 3 } }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <IconButton
                onClick={() => router.back()}
                sx={{
                  color: COLORS.text.strong,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
                }}
              >
                <ArrowBack />
              </IconButton>
              <Typography
                variant="h6"
                sx={{ fontWeight: 400, fontSize: 18, lineHeight: 1.5, textTransform: 'uppercase', color: COLORS.text.strong }}
              >
                The Guide
              </Typography>
              <Box sx={{ width: 32, height: 32 }} />
            </Stack>
          </Container>
        </Box>
      )}

      <Container
        maxWidth={false}
        sx={{ maxWidth: { xs: '100%', md: 800, lg: 900 }, px: { xs: 2, md: 4 }, pb: 6, pt: { xs: 10, md: 14 } }}
      >
        {/* Intro — the warm primer for a first Indian wedding */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <Typography
            sx={{
              fontFamily: FONTS.display,
              fontSize: { xs: '2rem', md: '2.75rem' },
              lineHeight: 1.1,
              color: COLORS.text.strong,
              mb: 1.5,
            }}
          >
            First Indian wedding?
          </Typography>
          <Typography variant="body1" sx={{ color: COLORS.text.muted, lineHeight: 1.7, maxWidth: 640, mb: 5 }}>
            An Indian wedding is a celebration of several days and several functions — each with its own meaning, mood,
            and dress code. Here&apos;s what to expect, and what to wear, so you can relax and enjoy every moment.
          </Typography>
        </motion.div>

        {/* One card per function */}
        <Stack spacing={3}>
          {events.map((event, index) => {
            const image = firstImage(event);
            const significance = event.ritual_description || null;
            const dress = event.dress_code_description || event.dress_code || null;
            const women = asList(event.outfit_ideas_women);
            const men = asList(event.outfit_ideas_men);
            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.3) }}
              >
                <Box
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: RADII.lg,
                    border: `1px solid ${COLORS.border.default}`,
                    overflow: 'hidden',
                  }}
                >
                  {image && (
                    <Box
                      component="img"
                      src={image}
                      alt={event.name}
                      sx={{ width: '100%', height: { xs: 180, md: 240 }, objectFit: 'cover', display: 'block' }}
                    />
                  )}
                  <Box sx={{ p: { xs: 2.5, md: 3.5 } }}>
                    {event.ritual_name && (
                      <Typography
                        variant="overline"
                        sx={{ color: COLORS.brand.primary, fontWeight: 700, letterSpacing: '0.08em' }}
                      >
                        {event.ritual_name}
                      </Typography>
                    )}
                    <Typography
                      sx={{
                        fontFamily: FONTS.display,
                        fontSize: { xs: '1.6rem', md: '2rem' },
                        lineHeight: 1.15,
                        color: COLORS.text.strong,
                        mb: significance ? 1.5 : 1,
                      }}
                    >
                      {event.name}
                    </Typography>
                    {significance && (
                      <Typography variant="body2" sx={{ color: COLORS.text.subtle, lineHeight: 1.7, mb: dress ? 2.5 : 0 }}>
                        {significance}
                      </Typography>
                    )}
                    {dress && (
                      <Box>
                        <Typography
                          variant="subtitle2"
                          sx={{ color: COLORS.text.strong, fontWeight: 700, mb: 0.5 }}
                        >
                          What to wear
                        </Typography>
                        <Typography variant="body2" sx={{ color: COLORS.text.subtle, lineHeight: 1.7 }}>
                          {dress}
                        </Typography>
                        {(women.length > 0 || men.length > 0) && (
                          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 1.5 }}>
                            {women.length > 0 && (
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="caption" sx={{ color: COLORS.text.muted, fontWeight: 700 }}>
                                  Women
                                </Typography>
                                <Typography variant="body2" sx={{ color: COLORS.text.subtle, lineHeight: 1.6 }}>
                                  {women.join(' · ')}
                                </Typography>
                              </Box>
                            )}
                            {men.length > 0 && (
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="caption" sx={{ color: COLORS.text.muted, fontWeight: 700 }}>
                                  Men
                                </Typography>
                                <Typography variant="body2" sx={{ color: COLORS.text.subtle, lineHeight: 1.6 }}>
                                  {men.join(' · ')}
                                </Typography>
                              </Box>
                            )}
                          </Stack>
                        )}
                      </Box>
                    )}
                  </Box>
                </Box>
              </motion.div>
            );
          })}

          {events.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="body1" sx={{ color: COLORS.text.subtle }}>
                The couple hasn&apos;t added their events yet — check back soon.
              </Typography>
            </Box>
          )}
        </Stack>
      </Container>
    </OptimizedBackground>
  );
}
