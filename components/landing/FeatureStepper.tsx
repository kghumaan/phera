'use client';

/**
 * Sticky scrolling feature stepper.
 *
 * Replaces the older FeaturesIntro + FeaturesCarousel combo with the
 * "left scrolls, right is sticky" layout from the landing design package.
 *
 * - Left column: per-step copy blocks, each ~70vh tall. The currently-active
 *   step is full-opacity; others dim.
 * - Right column: sticky viewport with a tinted card per step that
 *   crossfades when the active step changes.
 * - A vertical progress rail sits to the left of the viewport with one dot
 *   per step; dots fill in as you scroll.
 * - On mobile (< 960px) the layout collapses to a single column, the
 *   sticky viewport becomes inline (one mock per step), and the rail hides.
 */

import { useEffect, useRef, useState } from 'react';
import { Box, Container, Stack, Typography } from '@mui/material';
import Image from 'next/image';
import { COLORS, FONTS } from '@/lib/theme/tokens';
import EyebrowLabel from './EyebrowLabel';
import BroadcastAnimation from './BroadcastAnimation';

interface Step {
  tag: string;
  title: string;
  copy: string;
  bullets: string[];
  tint: string;
  /** Render function - receives a `dense` flag for compact mobile mocks. */
  mock: (dense: boolean) => React.ReactNode;
}

const STEPS: Step[] = [
  {
    tag: 'STEP 01 · Guest list',
    title: 'Bring your guest list. We take it from there.',
    copy:
      "Drop in a spreadsheet, paste from Google Contacts, or send us a photo of your handwritten list. Once it's in, we know who to reach out to, who's coming, who's asking the same question for the third time - and how to seat their family across the weekend.",
    bullets: [
      'Smart import - CSV, paste, or messy notes',
      'De-dupe, family grouping, side tagging done for you',
      'Becomes the source of truth for RSVPs, rooms & shuttles',
    ],
    tint: 'rgba(222,63,94,0.06)',
    mock: () => <ScreenshotMock src="/images/feature_images/rsvp_collection.png" alt="Guest list & RSVPs" />,
  },
  {
    tag: 'STEP 02 · Wedding website',
    title: 'A site that actually gets used.',
    copy:
      'The digital invitation for this generation - schedule, venues, RSVP, registry, and a built-in cultural guide for the friends flying in from abroad. So when a non-desi friend asks what to wear to the sangeet, the answer is already on their phone.',
    bullets: [
      'Schedule, FAQ, registry, PIN-gated events',
      'Built-in cultural guide - what to wear, what to expect',
      'DIY, AI-assisted, or 1-on-1 with our team',
    ],
    tint: 'rgba(255,153,51,0.07)',
    mock: () => <ScreenshotMock src="/images/feature_images/wedding_website.png" alt="Wedding website" />,
  },
  {
    tag: 'STEP 03 · WhatsApp bot',
    title: 'Save-the-dates, invites, and a 24/7 reply bot.',
    copy:
      "Flip it on and we WhatsApp every guest on a timeline we tuned by living through it. Behind the scenes, we auto-build a knowledge bank for your dates and city - weather, hotels, restaurants, dress codes - so the bot answers like a local who's been to your wedding twice already.",
    bullets: [
      'Save-the-dates → RSVPs → travel forms, all on schedule',
      '24/7 reply bot trained on your wedding + your city',
      'You text us back; we update everything for you',
    ],
    tint: 'rgba(32,201,151,0.07)',
    mock: () => (
      <Box
        sx={{
          width: '100%',
          height: '100%',
          minHeight: { xs: 320, md: 0 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          '& > *': { transform: { xs: 'scale(0.78)', md: 'scale(0.86)' }, transformOrigin: 'center center' },
        }}
      >
        <BroadcastAnimation />
      </Box>
    ),
  },
  {
    tag: 'STEP 04 · Rooms',
    title: 'Room assignments, without the politics.',
    copy:
      'Upload a floor plan or hotel block and we help place every guest - siblings together, the loud cousins on a different floor than your in-laws, the late arrivals near the lobby. The puzzle that usually eats a Sunday afternoon, solved before lunch.',
    bullets: [
      'Drag-and-drop floor plan editor',
      'Smart suggestions based on family + side',
      'Per-guest room cards delivered via WhatsApp',
    ],
    tint: 'rgba(108,92,231,0.06)',
    mock: () => <RoomsPlaceholder />,
  },
  {
    tag: 'STEP 05 · Transportation',
    title: 'Shuttles, airport pickups, venue transfers.',
    copy:
      "We collect every flight, optimize shuttle routes, and ping pickups before guests even land. Uncle Raj at 4 AM is no longer your problem - he gets a WhatsApp with his driver's name, license plate, and a real-time map.",
    bullets: [
      'Auto-collect flight info via WhatsApp',
      'Optimized shuttle routes + driver dispatch',
      'Live arrival board for the family',
    ],
    tint: 'rgba(59,130,246,0.06)',
    mock: () => <ScreenshotMock src="/images/feature_images/travel_coordination.png" alt="Travel & shuttles" />,
  },
  {
    tag: 'STEP 06 · Vendor agent',
    title: 'We sit in your vendor chats.',
    copy:
      "Add us as a member of your caterer, florist, decor, and DJ groups. We summarize every thread, surface the action items, and chase the things you'd otherwise forget at 11pm. Nothing falls through the cracks because nobody's the project manager.",
    bullets: [
      'Reads your vendor WhatsApp groups for you',
      'Daily digest, action items, blockers',
      'Flags risks before they become disasters',
    ],
    tint: 'rgba(212,175,55,0.08)',
    mock: () => <ScreenshotMock src="/images/feature_images/coordinator1.png" alt="Vendor coordinator" />,
  },
];

export default function FeatureStepper() {
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const stepRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    const onScroll = () => {
      const vh = window.innerHeight;
      const center = vh * 0.45;
      let idx = 0;
      let prog = 0;
      for (let i = 0; i < stepRefs.current.length; i++) {
        const el = stepRefs.current[i];
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (r.top <= center) {
          idx = i;
          const span = r.height || 1;
          prog = Math.max(0, Math.min(1, (center - r.top) / span));
        }
      }
      setActive(idx);
      setProgress(prog);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <Box
      component="section"
      id="features"
      sx={{
        py: { xs: 8, md: 14 },
        bgcolor: '#FBF7F1',
        position: 'relative',
        isolation: 'isolate',
        // Pressed-flowers texture overlay (matches the design's
        // `.bg-pressed-subtle` rule). Sits behind content via z-index: -1
        // and multiply-blends with the cream base so the floral pattern
        // reads as a soft grain rather than as imagery on top.
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          backgroundImage: 'url("/images/backgrounds/pressed-flowers-subtle.webp")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.32,
          mixBlendMode: 'multiply',
          zIndex: -1,
          pointerEvents: 'none',
        },
      }}
    >
      <Container
        maxWidth="xl"
        sx={{
          // Match the WhatsApp Concierge section's roomy padding so all
          // non-hero sections share the same horizontal rhythm.
          px: { xs: 2.5, md: 6, lg: 10 },
        }}
      >
        <Stack
          spacing={2}
          sx={{ alignItems: 'flex-start', mb: { xs: 5, md: 4 } }}
        >
          <EyebrowLabel>The full kit</EyebrowLabel>
          <Typography
            variant="h2"
            sx={{
              fontFamily: FONTS.display,
              fontStyle: 'italic',
              // Capped at the design's max (76px / 4.75rem); was overshooting
              // at lg with 6rem which made the headline feel oversized.
              fontSize: { xs: '2.25rem', sm: '3rem', md: '4rem', lg: '4.75rem' },
              lineHeight: 1.02,
              letterSpacing: '-0.025em',
              color: COLORS.text.strong,
              maxWidth: '18ch',
              textWrap: 'balance',
            }}
          >
            One platform. Everything coordinated.
          </Typography>
        </Stack>

        <Box
          sx={{
            display: 'grid',
            // With the wider xl Container both columns now have generous
            // room. Ratio brought closer to 1:1 so the right viewport feels
            // properly substantial - design parity is roughly 1.05fr 1fr.
            gridTemplateColumns: { xs: '1fr', md: '1.1fr 1fr' },
            columnGap: { md: 5, lg: 8 },
            rowGap: { xs: 4, md: 0 },
            alignItems: 'flex-start',
          }}
        >
          {/* LEFT - scrolling copy */}
          <Box>
            {STEPS.map((s, i) => (
              <Box
                key={s.tag}
                ref={(el: HTMLDivElement | null) => {
                  stepRefs.current[i] = el;
                }}
                sx={{
                  minHeight: { xs: 'auto', md: '70vh' },
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  pr: { md: 1 },
                  py: { xs: 2, md: 0 },
                  opacity: { xs: 1, md: active === i ? 1 : 0.45 },
                  transition: 'opacity 0.5s ease',
                }}
              >
                <Box sx={{ mb: 2 }}>
                  <EyebrowLabel>{s.tag}</EyebrowLabel>
                </Box>
                <Typography
                  variant="h2"
                  sx={{
                    fontFamily: FONTS.display,
                    fontStyle: 'italic',
                    // fontSize: { xs: '1.85rem', md: '2.5rem', lg: '3.25rem' },
                    lineHeight: 1.04,
                    letterSpacing: '-0.02em',
                    color: COLORS.text.strong,
                    // Character-width cap to break the headline naturally
                    // (NOT a pixel value - the previous `18` collapsed every
                    // word onto its own line).
                    maxWidth: '18ch',
                    textWrap: 'balance',
                  }}
                >
                  {s.title}
                </Typography>
                <Typography
                  sx={{
                    fontSize: { xs: '0.95rem', md: '1.05rem' },
                    color: COLORS.text.muted,
                    mt: 2,
                    lineHeight: 1.55,
                    maxWidth: '46ch',
                  }}
                >
                  {s.copy}
                </Typography>
                <Stack component="ul" spacing={1} sx={{ mt: 3, p: 0, listStyle: 'none' }}>
                  {s.bullets.map((b) => (
                    <Box
                      key={b}
                      component="li"
                      sx={{
                        display: 'flex',
                        gap: 1.5,
                        alignItems: 'flex-start',
                        fontSize: { xs: '0.9rem', md: '0.95rem' },
                        color: COLORS.text.strong,
                        lineHeight: 1.5,
                      }}
                    >
                      <Box
                        component="span"
                        sx={{
                          display: 'inline-block',
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          bgcolor: COLORS.brand.primary,
                          mt: '8px',
                          flex: 'none',
                        }}
                      />
                      {b}
                    </Box>
                  ))}
                </Stack>

                {/* Mobile inline mock - renders right under each step's copy.
                    Hidden on desktop, where the sticky viewport on the right
                    handles the visuals. */}
                <Box
                  sx={{
                    display: { xs: 'block', md: 'none' },
                    mt: 3,
                    borderRadius: '20px',
                    border: '1px solid rgba(0,0,0,0.06)',
                    bgcolor: s.tint,
                    p: 2,
                    height: 360,
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  {s.mock(true)}
                </Box>
              </Box>
            ))}
          </Box>

          {/* RIGHT - sticky viewport (desktop only) */}
          <Box
            sx={{
              display: { xs: 'none', md: 'block' },
              position: 'sticky',
              top: 'calc(50vh - 280px)',
              height: 560,
            }}
          >
            {/* progress rail */}
            <Box
              aria-hidden
              sx={{
                position: 'absolute',
                left: -32,
                top: 8,
                bottom: 8,
                width: 2,
                bgcolor: 'rgba(0,0,0,0.07)',
                borderRadius: 2,
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  width: '100%',
                  height: `${((active + progress) / STEPS.length) * 100}%`,
                  bgcolor: COLORS.brand.primary,
                  borderRadius: 2,
                  transition: 'height 0.25s ease',
                }}
              />
              {STEPS.map((_, i) => (
                <Box
                  key={i}
                  sx={{
                    position: 'absolute',
                    left: '50%',
                    top: `${(i / (STEPS.length - 1)) * 100}%`,
                    transform: 'translate(-50%, -50%)',
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    bgcolor: i <= active ? COLORS.brand.primary : 'white',
                    border: `2px solid ${i <= active ? COLORS.brand.primary : 'rgba(0,0,0,0.15)'}`,
                    transition: 'all 0.3s ease',
                  }}
                />
              ))}
            </Box>

            {/* tinted viewport */}
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                height: '100%',
                borderRadius: '24px',
                bgcolor: STEPS[active].tint,
                border: '1px solid rgba(0,0,0,0.06)',
                p: { md: 3, lg: 4 },
                overflow: 'hidden',
                transition: 'background-color 0.6s ease',
              }}
            >
              {/* corner counter */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 18,
                  right: 22,
                  fontFamily: 'var(--font-mono, "DM Mono"), monospace',
                  fontSize: '0.7rem',
                  letterSpacing: '0.16em',
                  color: COLORS.text.subtle,
                  zIndex: 3,
                }}
              >
                {String(active + 1).padStart(2, '0')} / {String(STEPS.length).padStart(2, '0')}
              </Box>

              {STEPS.map((s, i) => {
                const isActive = i === active;
                const isPrev = i < active;
                return (
                  <Box
                    key={i}
                    sx={{
                      position: 'absolute',
                      inset: { md: 24, lg: 32 },
                      opacity: isActive ? 1 : 0,
                      transform: isActive
                        ? 'translateY(0) scale(1)'
                        : isPrev
                          ? 'translateY(-24px) scale(0.97)'
                          : 'translateY(24px) scale(0.97)',
                      transition: 'opacity 0.55s ease, transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
                      pointerEvents: isActive ? 'auto' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Box sx={{ width: '100%', height: '100%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {s.mock(false)}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   Per-step mocks - kept simple, all sized to fill the sticky viewport.
   ────────────────────────────────────────────────────────────────────── */

function ScreenshotMock({ src, alt }: { src: string; alt: string }) {
  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        position: 'relative',
        borderRadius: '14px',
        overflow: 'hidden',
        bgcolor: 'white',
        boxShadow: '0 24px 60px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.04)',
      }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 960px) 100vw, 520px"
        style={{ objectFit: 'cover', objectPosition: 'top' }}
      />
    </Box>
  );
}

function RoomsPlaceholder() {
  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        borderRadius: '14px',
        bgcolor: 'white',
        border: '1px solid rgba(0,0,0,0.05)',
        boxShadow: '0 16px 40px rgba(0,0,0,0.06)',
        p: { xs: 2, md: 3 },
        display: 'flex',
        flexDirection: 'column',
        gap: 1.25,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
        <Typography
          sx={{
            fontFamily: 'var(--font-mono, "DM Mono"), monospace',
            fontSize: '0.65rem',
            letterSpacing: '0.16em',
            color: COLORS.text.subtle,
            textTransform: 'uppercase',
          }}
        >
          Floor 3 · Grand Hyatt
        </Typography>
        <Typography
          sx={{
            fontFamily: FONTS.display,
            fontStyle: 'italic',
            fontSize: '1.1rem',
            color: COLORS.text.strong,
          }}
        >
          14 of 18 placed
        </Typography>
      </Box>
      <Box
        sx={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gridAutoRows: 'minmax(48px, 1fr)',
          gap: 1,
        }}
      >
        {[
          { label: '301 · Sharma family', tone: 'side-bride' },
          { label: '302 · Verma + 2', tone: 'side-bride' },
          { label: '303 · Empty', tone: 'empty' },
          { label: '304 · Khan', tone: 'side-groom' },
          { label: '305 · Mehta', tone: 'side-bride' },
          { label: '306 · Patel', tone: 'side-groom' },
          { label: '307 · Rao + 1', tone: 'side-bride' },
          { label: '308 · Singh', tone: 'side-bride' },
          { label: '309 · Empty', tone: 'empty' },
          { label: '310 · Kapoor', tone: 'side-groom' },
          { label: '311 · Nair', tone: 'side-groom' },
          { label: '312 · Bhatia', tone: 'side-bride' },
        ].map((r, idx) => {
          const palette: Record<string, { bg: string; border: string; fg: string }> = {
            'side-bride': {
              bg: 'rgba(222,63,94,0.08)',
              border: 'rgba(222,63,94,0.18)',
              fg: COLORS.brand.primary,
            },
            'side-groom': {
              bg: 'rgba(59,130,246,0.08)',
              border: 'rgba(59,130,246,0.2)',
              fg: '#1d4ed8',
            },
            empty: {
              bg: 'rgba(0,0,0,0.03)',
              border: 'rgba(0,0,0,0.08)',
              fg: COLORS.text.faint,
            },
          };
          const p = palette[r.tone];
          return (
            <Box
              key={idx}
              sx={{
                gridColumn: 'span 2',
                bgcolor: p.bg,
                border: `1px solid ${p.border}`,
                color: p.fg,
                borderRadius: '8px',
                px: 1,
                py: 0.75,
                fontSize: '0.7rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                lineHeight: 1.2,
              }}
            >
              {r.label}
            </Box>
          );
        })}
      </Box>
      <Box
        sx={{
          mt: 1,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          px: 1.5,
          py: 1,
          borderRadius: '10px',
          bgcolor: 'rgba(108,92,231,0.06)',
          border: '1px dashed rgba(108,92,231,0.25)',
        }}
      >
        <Typography
          sx={{
            fontFamily: 'var(--font-mono, "DM Mono"), monospace',
            fontSize: '0.65rem',
            letterSpacing: '0.16em',
            color: '#6C5CE7',
            textTransform: 'uppercase',
          }}
        >
          Suggested · 4 unplaced
        </Typography>
        <Typography sx={{ fontSize: '0.75rem', color: COLORS.text.muted }}>
          Late arrivals → 312, 313 (near lobby)
        </Typography>
      </Box>
    </Box>
  );
}
