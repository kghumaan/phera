'use client';

/**
 * Section anchor links rendered inside the AppHeader on the landing page.
 *
 * Injected via AppHeader's `rightSlot` so they sit next to the auth/avatar
 * controls. Hidden under 900px so the mobile header stays clean.
 *
 * Anchors map to the matching `<section id="…">` in each landing block.
 * Click handler runs a custom rAF tween (easeInCubic — slow start,
 * accelerating into the destination) instead of the browser's default
 * jump or symmetric `scroll-behavior: smooth`.
 */

import { Box } from '@mui/material';
import { COLORS } from '@/lib/theme/tokens';

const LINKS: { label: string; targetId: string }[] = [
  { label: 'Service', targetId: 'service' },
  { label: 'Pricing', targetId: 'pricing' },
  { label: 'Story', targetId: 'story' },
  { label: 'FAQ', targetId: 'faq' },
];

// Reserve space at the top so the section title doesn't land behind the
// fixed AppHeader. Header collapses to ~60px once scrolled; 88px gives a
// small breathing margin below it.
const HEADER_OFFSET_PX = 88;
const SCROLL_DURATION_MS = 900;

const easeInCubic = (t: number) => t * t * t;

function smoothScrollTo(targetY: number) {
  const startY = window.scrollY;
  const distance = targetY - startY;
  if (Math.abs(distance) < 1) return;
  const startTime = performance.now();

  const step = (now: number) => {
    const progress = Math.min((now - startTime) / SCROLL_DURATION_MS, 1);
    window.scrollTo(0, startY + distance * easeInCubic(progress));
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

export default function HomeNavLinks() {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const el = document.getElementById(targetId);
    if (!el) return;
    const targetY = el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET_PX;
    smoothScrollTo(targetY);
    if (typeof history !== 'undefined' && history.pushState) {
      history.pushState(null, '', `#${targetId}`);
    }
  };

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
          component="a"
          href={`#${l.targetId}`}
          onClick={(e: React.MouseEvent<HTMLAnchorElement>) => handleClick(e, l.targetId)}
          sx={{
            fontSize: '0.875rem',
            fontWeight: 500,
            color: COLORS.text.strong,
            textDecoration: 'none',
            opacity: 0.85,
            cursor: 'pointer',
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
