'use client';

/**
 * Section anchor links rendered inside the AppHeader on the landing page.
 *
 * Injected via AppHeader's `rightSlot` so they sit next to the auth/avatar
 * controls. Hidden under 900px so the mobile header stays clean.
 *
 * Anchors:
 *   - #features → FeatureStepper section
 *   - #pricing  → Pricing section
 *   - #about    → Origin / About section
 *   - #faq      → FAQ section
 */

import { Box } from '@mui/material';
import Link from 'next/link';
import { COLORS } from '@/lib/theme/tokens';

const LINKS: { label: string; href: string }[] = [
  { label: 'Service', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Story', href: '#about' },
  { label: 'FAQ', href: '#faq' },
];

export default function HomeNavLinks() {
  return (
    <Box
      component="nav"
      sx={{
        display: { xs: 'none', md: 'flex' },
        alignItems: 'center',
        gap: { md: 3, lg: 3.5 },
        mr: { md: 1.5, lg: 2 },
      }}
    >
      {LINKS.map((l) => (
        <Box
          key={l.label}
          component={Link}
          href={l.href}
          sx={{
            fontSize: '0.875rem',
            fontWeight: 500,
            color: COLORS.text.strong,
            textDecoration: 'none',
            opacity: 0.85,
            transition: 'opacity 0.2s ease, color 0.2s ease',
            '&:hover': {
              opacity: 1,
              color: COLORS.brand.primary,
            },
          }}
        >
          {l.label}
        </Box>
      ))}
    </Box>
  );
}
