'use client';

/**
 * Landing page section — surfaces the vendor directory as a feature.
 * Sits between FAQSection and FinalCTASection.
 *
 * Shows a static trio of curated vendor cards + a "list your business" CTA.
 * No live fetching — avoids a loading state on the landing page.
 */

import { Box, Grid, Stack, Typography } from '@mui/material';
import Link from 'next/link';
import { motion } from 'framer-motion';
import StarIcon from '@mui/icons-material/Star';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { COLORS, RADII, FONTS } from '@/lib/theme/tokens';
import { Reveal, SectionHeader } from './design-primitives';
import { VENDOR_DIRECTORY_BLURB } from '@/lib/landing/vendor-directory-copy';

/* ─── static highlight cards (hand-picked from seed data) ─────────────────── */

const HIGHLIGHT_VENDORS = [
  {
    name: 'Joseph Radhik',
    category: 'Photographer',
    city: 'Goa',
    flag: '🇮🇳',
    rating: 4.9,
    price: '$5K–$20K',
    note: 'Internationally acclaimed candid storytelling',
    color: '#DE3F5E',
  },
  {
    name: 'Weddings by Neeraj Kamra',
    category: 'Wedding Planner',
    city: 'Jodhpur',
    flag: '🇮🇳',
    rating: 4.9,
    price: '$20K–$200K',
    note: 'Umaid Bhawan & Mehrangarh Fort specialist',
    color: '#7C3AED',
  },
  {
    name: 'Shaadi by Ritu',
    category: 'Wedding Planner',
    city: 'Dubai',
    flag: '🇦🇪',
    rating: 4.9,
    price: '$15K–$80K',
    note: 'Atlantis · Burj Al Arab · desert venues',
    color: '#0E7C5B',
  },
];

const CITY_CHIPS = ['Goa', 'Udaipur', 'Jaipur', 'Jodhpur', 'Bali', 'Bangkok', 'Dubai', 'Kerala', 'Rishikesh'];
const CATEGORY_CHIPS = ['Photographers', 'DJs', 'Mehendi', 'Planners', 'Decorators', 'Makeup'];


export default function VendorSpotlightSection() {
  return (
    <Box
      component="section"
      id="vendors"
      sx={{
        py: { xs: 10, md: 14 },
        bgcolor: '#FBF7F1',
        borderTop: '1px solid rgba(0,0,0,0.06)',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        overflow: 'hidden',
      }}
    >
      <div className="container">
        {/* Header */}
        <Reveal>
          <SectionHeader
            eyebrow="Vendor directory"
            title={
              <>
                Every vendor you need,<br />
                <em>already waiting.</em>
              </>
            }
            kicker={VENDOR_DIRECTORY_BLURB}
            align="center"
          />
        </Reveal>

        {/* City + category chips */}
        <Reveal delay={1}>
          <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', gap: 1.5, alignItems: 'center' }}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
              {CITY_CHIPS.map((c) => (
                <Box
                  key={c}
                  sx={{
                    px: 1.5,
                    py: 0.5,
                    borderRadius: '999px',
                    border: '1px solid rgba(0,0,0,0.12)',
                    fontSize: '0.8rem',
                    fontFamily: FONTS.body,
                    color: COLORS.text.muted,
                    bgcolor: 'white',
                  }}
                >
                  {c}
                </Box>
              ))}
            </Box>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
              {CATEGORY_CHIPS.map((c) => (
                <Box
                  key={c}
                  sx={{
                    px: 1.5,
                    py: 0.5,
                    borderRadius: '999px',
                    border: `1px solid ${COLORS.brand.primary}22`,
                    fontSize: '0.8rem',
                    fontFamily: FONTS.body,
                    color: COLORS.brand.primary,
                    bgcolor: `${COLORS.brand.primary}08`,
                  }}
                >
                  {c}
                </Box>
              ))}
            </Box>
          </Box>
        </Reveal>

        {/* Vendor highlight cards */}
        <Grid container spacing={2.5} sx={{ mt: 5 }}>
          {HIGHLIGHT_VENDORS.map((v, i) => (
            <Grid key={v.name} size={{ xs: 12, sm: 4 }}>
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: [0.25, 0.1, 0.25, 1] }}
                style={{ height: '100%' }}
              >
                <Box
                  sx={{
                    bgcolor: 'white',
                    borderRadius: RADII.lg,
                    border: '1px solid rgba(0,0,0,0.07)',
                    p: 2.5,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.5,
                    transition: 'box-shadow 0.2s ease, transform 0.2s ease',
                    '&:hover': {
                      boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  {/* Avatar + meta */}
                  <Stack direction="row" spacing={1.5} alignItems="flex-start">
                    <Box
                      sx={{
                        width: 42,
                        height: 42,
                        borderRadius: RADII.md,
                        bgcolor: v.color,
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1rem',
                        fontWeight: 700,
                        fontFamily: FONTS.body,
                        flexShrink: 0,
                      }}
                    >
                      {v.name[0]}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        sx={{ fontWeight: 600, fontSize: '0.95rem', fontFamily: FONTS.body, lineHeight: 1.3 }}
                      >
                        {v.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: COLORS.text.subtle }}>
                        {v.category} · {v.flag} {v.city}
                      </Typography>
                    </Box>
                  </Stack>

                  {/* Note */}
                  <Typography variant="body2" sx={{ color: COLORS.text.muted, lineHeight: 1.5, flex: 1 }}>
                    {v.note}
                  </Typography>

                  {/* Rating + price */}
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Stack direction="row" spacing={0.4} alignItems="center">
                      <StarIcon sx={{ fontSize: 13, color: '#F59E0B' }} />
                      <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, fontFamily: FONTS.body }}>
                        {v.rating}
                      </Typography>
                    </Stack>
                    <Typography sx={{ fontSize: '0.8rem', color: COLORS.brand.primary, fontWeight: 600, fontFamily: FONTS.body }}>
                      {v.price}
                    </Typography>
                    <Box sx={{ ml: 'auto' }}>
                      <Box
                        sx={{
                          px: 1.25,
                          py: 0.4,
                          borderRadius: '999px',
                          bgcolor: `${COLORS.brand.primary}10`,
                          border: `1px solid ${COLORS.brand.primary}22`,
                          fontSize: '0.72rem',
                          color: COLORS.brand.primary,
                          fontWeight: 600,
                          fontFamily: FONTS.body,
                        }}
                      >
                        NRI exp.
                      </Box>
                    </Box>
                  </Stack>
                </Box>
              </motion.div>
            </Grid>
          ))}
        </Grid>

        {/* CTA row */}
        <Reveal delay={2}>
          <Box
            sx={{
              mt: 6,
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Primary — public, no-login directory at /vendors. */}
            <Box
              component={Link}
              href="/vendors"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                px: 3,
                py: 1.5,
                borderRadius: RADII.md,
                bgcolor: COLORS.brand.primary,
                color: 'white',
                fontFamily: FONTS.body,
                fontWeight: 600,
                fontSize: '0.95rem',
                textDecoration: 'none',
                transition: 'background 0.18s ease',
                '&:hover': { bgcolor: COLORS.brand.primaryHover },
              }}
            >
              Browse all vendors
            </Box>

            {/* Secondary — vendor self-enroll */}
            <Box
              component={Link}
              href="/vendors/join"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.75,
                px: 3,
                py: 1.5,
                borderRadius: RADII.md,
                border: '1.5px solid rgba(0,0,0,0.14)',
                color: COLORS.text.strong,
                fontFamily: FONTS.body,
                fontWeight: 500,
                fontSize: '0.95rem',
                textDecoration: 'none',
                bgcolor: 'white',
                transition: 'border-color 0.18s ease, color 0.18s ease',
                '&:hover': { borderColor: COLORS.brand.primary, color: COLORS.brand.primary },
              }}
            >
              Are you a wedding vendor?
              <OpenInNewIcon sx={{ fontSize: 15 }} />
            </Box>
          </Box>
        </Reveal>
      </div>
    </Box>
  );
}
