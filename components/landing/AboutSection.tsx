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
}

export default function AboutSection({ variant = 'embedded' }: AboutSectionProps) {
  const isPage = variant === 'page';

  return (
    <Box
      component="section"
      sx={{
        py: isPage ? { xs: 12, md: 20 } : { xs: 6, md: 10 },
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={{ xs: 6, md: 10 }} alignItems="center">
          <Grid size={{ xs: 12, md: 6 }}>
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.8 }}
            >
              <Box
                sx={{
                  position: 'relative',
                  borderRadius: '40px',
                  overflow: 'hidden',
                  aspectRatio: '1/1',
                  boxShadow: '0 30px 60px rgba(0,0,0,0.1)',
                  border: '8px solid white',
                  maxWidth: { xs: '420px', md: 'none' },
                  mx: 'auto',
                }}
              >
                <Image
                  src="/images/couple/couple-8.jpg"
                  alt="Founders of Phera"
                  fill
                  sizes="(max-width: 768px) 90vw, 50vw"
                  style={{ objectFit: 'cover' }}
                  priority={isPage}
                />
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
                  <Typography
                    component={isPage ? 'h1' : 'h2'}
                    variant="h2"
                    sx={{
                      fontFamily: FONTS.display,
                      fontStyle: 'italic',
                      fontSize: { xs: '2.5rem', sm: '3rem', md: '4rem' },
                      color: COLORS.text.strong,
                      mb: 2,
                      lineHeight: 1.1,
                    }}
                  >
                    Modern coordination for Indian weddings
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
