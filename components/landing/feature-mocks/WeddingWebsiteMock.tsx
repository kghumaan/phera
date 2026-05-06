'use client';

/**
 * FeatureStepper Step 02 mock — "A site that actually gets used."
 *
 * Static composition: the couple's wedding website (desktop) with a
 * compact phone in the corner showing the per-event mobile carousel.
 *
 * The browser image dictates its own height (width:100% / height:auto),
 * so the frame always fits the screenshot exactly — no aspect-ratio
 * math, no letterboxing, no edge clipping when the source image is
 * swapped for a taller version.
 *
 * Carousel container aspect is still locked to the source so the phone
 * stays a phone:
 *   carousel.png   726 × 1400  → aspect 0.519
 *
 * The phone uses a plain rounded-rectangle device outline (not the
 * IPhoneMockup) — at the small sizes here the iPhone bezel + dynamic
 * island read messy; a clean frame matches the image's own chrome.
 */

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Box } from '@mui/material';
import { COLORS } from '@/lib/theme/tokens';

const BROWSER_SRC = '/images/feature_images/browser.png';
const CAROUSEL_SRC = '/images/feature_images/carousel.png';
const BROWSER_CHROME_HEIGHT = 30;
const BROWSER_IMG_W = 3456;
const BROWSER_IMG_H = 1750;
const PHONE_IMG_ASPECT = 726 / 1400;    // ≈ 0.519

export default function WeddingWebsiteMock() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 60);
    return () => clearTimeout(t);
  }, []);

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        position: 'relative',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        // Browser anchored near the top; bottom padding leaves room for
        // the (now larger) phone to overhang.
        px: { xs: 0.5, md: 1 },
        pt: { xs: 0, md: 0 },
        pb: { xs: 4, md: 5 },
      }}
    >
      {/* BROWSER — content area aspect locked to the image */}
      <Box
        sx={{
          width: '100%',
          borderRadius: '14px',
          overflow: 'hidden',
          border: '1px solid rgba(0,0,0,0.1)',
          bgcolor: '#FBF7F1',
          display: 'flex',
          flexDirection: 'column',
          opacity: ready ? 1 : 0,
          transition: 'opacity 0.5s ease',
        }}
      >
        {/* Chrome */}
        <Box
          sx={{
            flex: 'none',
            height: BROWSER_CHROME_HEIGHT,
            bgcolor: '#F1ECE3',
            borderBottom: '1px solid rgba(0,0,0,0.06)',
            px: 1.25,
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
          }}
        >
          {['#FF6058', '#FFBD2E', '#28CA41'].map((c, i) => (
            <Box
              key={i}
              sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: c, flex: 'none' }}
            />
          ))}
          <Box
            sx={{
              ml: 1,
              flex: 1,
              minWidth: 0,
              bgcolor: 'rgba(255,255,255,0.7)',
              borderRadius: '4px',
              px: 0.85,
              py: 0.25,
              fontSize: '0.7rem',
              color: COLORS.text.subtle,
              fontFamily: 'var(--mono), monospace',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              textAlign: 'center',
            }}
          >
            phera.io/priya-arjun
          </Box>
        </Box>

        {/* Page content — image drives its own height. width:100% +
            height:auto means the rendered frame always matches the
            image's natural aspect, even after the source is swapped. */}
        <Box sx={{ width: '100%', bgcolor: '#FBF7F1', lineHeight: 0 }}>
          <Image
            src={BROWSER_SRC}
            alt="Wedding website preview"
            width={BROWSER_IMG_W}
            height={BROWSER_IMG_H}
            sizes="(max-width: 900px) 100vw, 600px"
            style={{ width: '100%', height: 'auto', display: 'block' }}
            priority={false}
          />
        </Box>
      </Box>

      {/* PHONE — simple rounded-rect device, aspect locked to carousel.png */}
      <Box
        sx={{
          position: 'absolute',
          right: { xs: 8, md: 18 },
          bottom: { xs: 0, md: 4 },
          width: { xs: '34%', sm: '32%', md: '30%' },
          aspectRatio: `${PHONE_IMG_ASPECT}`,
          borderRadius: '20px',
          padding: '6px',
          bgcolor: '#1a1a1a',
          opacity: ready ? 1 : 0,
          transform: ready ? 'translateY(0)' : 'translateY(8px)',
          transition: 'opacity 0.6s ease 0.18s, transform 0.6s ease 0.18s',
        }}
      >
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            height: '100%',
            borderRadius: '14px',
            overflow: 'hidden',
            bgcolor: '#000',
          }}
        >
          <Image
            src={CAROUSEL_SRC}
            alt="Mobile event carousel"
            fill
            sizes="(max-width: 900px) 30vw, 180px"
            style={{ objectFit: 'cover' }}
            priority={false}
          />
        </Box>
      </Box>
    </Box>
  );
}
