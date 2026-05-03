'use client';

import {
  Box,
  Container,
  Grid,
  IconButton,
  Paper,
  Stack,
  Typography,
  alpha,
} from '@mui/material';
import { Instagram, Language, LinkedIn } from '@mui/icons-material';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { COLORS, FONTS } from '@/lib/theme/tokens';

interface AboutSectionProps {
  /**
   * `page` is for the standalone /about route (top of page, big margins).
   * `embedded` is for the landing page (sits between other sections).
   */
  variant?: 'page' | 'embedded';
  /**
   * Optional eyebrow rendered above the headline in the right column.
   * Used by the landing page to position "Origin" directly above the
   * "Modern coordination for Indian weddings" headline.
   */
  eyebrow?: React.ReactNode;
}

export default function AboutSection({ variant = 'embedded', eyebrow }: AboutSectionProps) {
  const isPage = variant === 'page';

  return (
    <Box
      component="section"
      sx={{
        // Embedded variant uses the same py rhythm as every other
        // non-hero section on the landing page (`py: 8 / 14`) so the
        // headline sits clear of the section top instead of bumping it.
        // Standalone /about page (variant='page') keeps generous padding.
        py: isPage ? { xs: 12, md: 20 } : { xs: 8, md: 14 },
      }}
    >
      <Container
        maxWidth="xl"
        sx={{ px: { xs: 2.5, md: 6, lg: 10 } }}
      >
        <Grid container spacing={{ xs: 6, md: 10 }} alignItems="center">
          <Grid size={{ xs: 12, md: 6 }}>
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.8 }}
            >
              {/* Layered frame: a tilted brand-tinted backing tile pokes
                  out behind a 10px-white-bordered square photo, with a
                  small italic date pill overlapping the bottom-right
                  corner. Matches the design's Story photo frame exactly. */}
              <Box
                sx={{
                  position: 'relative',
                  maxWidth: 480,
                  mx: 'auto',
                }}
              >
                {/* Tilted gradient backing tile */}
                <Box
                  aria-hidden
                  sx={{
                    position: 'absolute',
                    inset: -18,
                    borderRadius: '28px',
                    background:
                      'linear-gradient(135deg, rgba(222,63,94,0.18), rgba(255,153,51,0.14))',
                    transform: 'rotate(-2deg)',
                    zIndex: 0,
                  }}
                />
                {/* Photo with thick white border + drop shadow */}
                <Box
                  sx={{
                    position: 'relative',
                    borderRadius: '22px',
                    overflow: 'hidden',
                    border: '10px solid white',
                    boxShadow: '0 30px 60px rgba(0,0,0,0.12)',
                    aspectRatio: '1 / 1',
                    bgcolor: '#F7F1E8',
                    zIndex: 1,
                  }}
                >
                  <Image
                    src="/images/couple/couple-8.jpg"
                    alt="Sim and KV - founders of Phera"
                    fill
                    sizes="(max-width: 768px) 90vw, 480px"
                    style={{ objectFit: 'cover' }}
                    priority={isPage}
                  />
                </Box>
                {/* Floating date pill */}
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: -18,
                    right: -10,
                    bgcolor: 'white',
                    borderRadius: '14px',
                    px: 2,
                    py: 1.25,
                    boxShadow: '0 12px 32px rgba(0,0,0,0.10)',
                    border: '1px solid rgba(0,0,0,0.05)',
                    fontFamily: FONTS.display,
                    fontStyle: 'italic',
                    fontSize: '1rem',
                    color: COLORS.text.strong,
                    zIndex: 2,
                    whiteSpace: 'nowrap',
                  }}
                >
                  Sim &amp; KV  ·  Feb 2025
                </Box>
              </Box>
            </motion.div>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <Stack spacing={{ xs: 3, md: 4 }}>
                <Box>
                  {eyebrow && <Box sx={{ mb: 2 }}>{eyebrow}</Box>}
                  <Typography
                    component={isPage ? 'h1' : 'h2'}
                    variant="h2"
                    sx={{
                      fontFamily: FONTS.display,
                      fontStyle: 'italic',
                      fontSize: { xs: '2.5rem', sm: '3rem', md: '4rem' },
                      color: COLORS.text.strong,
                      mb: 2,
                      lineHeight: 1.05,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    We built the team
                    <br />
                    we wish we had.
                  </Typography>
                  <Box
                    sx={{
                      width: '60px',
                      height: '4px',
                      bgcolor: COLORS.brand.primary,
                      borderRadius: '2px',
                      mb: { xs: 2, md: 4 },
                    }}
                  />
                </Box>

                <Typography
                  variant="body2"
                  sx={{
                    fontSize: { xs: '1rem', md: '1.2rem' },
                    lineHeight: 1.8,
                    color: COLORS.text.muted,
                    fontWeight: 400,
                  }}
                >
                  We built Phera because we were that &ldquo;frustrated couple.&rdquo; Planning an Indian wedding comes with a
                  level of complexity that most global platforms just don&apos;t understand. Between managing guest lists spanning continents,
                  explaining traditional rituals to our non-desi friends, and handling endless WhatsApp queries, we knew there
                  had to be a better way.
                </Typography>

                <Typography
                  variant="body2"
                  sx={{
                    fontSize: { xs: '1rem', md: '1.2rem' },
                    lineHeight: 1.8,
                    color: COLORS.text.muted,
                    fontWeight: 400,
                  }}
                >
                  What started as a tool built for our own special day has now grown into a platform we&apos;re opening up
                  for everyone else. We want to bring back the joy of planning and let you focus on what really matters&mdash;celebrating your love.
                </Typography>

                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 2.5, md: 3 },
                    bgcolor: alpha(COLORS.brand.primary, 0.04),
                    borderRadius: '24px',
                    border: '1px solid',
                    borderColor: alpha(COLORS.brand.primary, 0.1),
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: { xs: '0.95rem', md: '1rem' },
                      color: COLORS.text.subtle,
                      fontStyle: 'italic',
                      lineHeight: 1.7,
                    }}
                  >
                    &ldquo;We&apos;re a young product and always improving. If you have suggestions or just want to chat about your
                    wedding, please shoot us a message!&rdquo;
                  </Typography>
                </Paper>

                <Stack spacing={2}>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 'bold', color: COLORS.text.strong }}
                  >
                    Connect with the founders:
                  </Typography>

                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    justifyContent="space-between"
                    alignItems={{ xs: 'flex-start', sm: 'center' }}
                    spacing={{ xs: 2, sm: 3 }}
                    sx={{ width: '100%' }}
                  >
                    <FounderRow
                      name="Sim"
                      links={[
                        { icon: <Instagram sx={{ fontSize: '1rem' }} />, href: 'https://www.instagram.com/simransimranaway/' },
                        { icon: <LinkedIn sx={{ fontSize: '1rem' }} />, href: 'https://www.linkedin.com/in/simransavani/' },
                        { icon: <Language sx={{ fontSize: '1rem' }} />, href: 'https://simmetrystudios.com' },
                      ]}
                    />
                    <FounderRow
                      name="KV"
                      align="right"
                      links={[
                        { icon: <Instagram sx={{ fontSize: '1rem' }} />, href: 'https://www.instagram.com/kvghumaan/' },
                        { icon: <LinkedIn sx={{ fontSize: '1rem' }} />, href: 'https://www.linkedin.com/in/kv-ghumaan-132863a3/' },
                      ]}
                    />
                  </Stack>
                </Stack>
              </Stack>
            </motion.div>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

interface FounderRowProps {
  name: string;
  align?: 'left' | 'right';
  links: { icon: React.ReactNode; href: string }[];
}

function FounderRow({ name, align = 'left', links }: FounderRowProps) {
  return (
    <Stack direction="row" spacing={2} alignItems="center">
      <Typography
        sx={{ fontWeight: 700, color: COLORS.text.strong, textAlign: align }}
      >
        {name}
      </Typography>
      <Stack direction="row" spacing={1}>
        {links.map((link, idx) => (
          <IconButton
            key={idx}
            component="a"
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              color: COLORS.brand.primary,
              bgcolor: alpha(COLORS.brand.primary, 0.1),
              '&:hover': { bgcolor: alpha(COLORS.brand.primary, 0.2) },
              width: 32,
              height: 32,
            }}
          >
            {link.icon}
          </IconButton>
        ))}
      </Stack>
    </Stack>
  );
}
