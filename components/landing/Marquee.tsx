'use client';

/**
 * Right-to-left scrolling ticker used directly below the hero.
 *
 * Renders the keywords twice in-place so the CSS translateX(-50%) loop is
 * seamless. Edges fade with a mask so words don't pop in/out at the bounds.
 * Pauses on hover.
 */

import { Box } from '@mui/material';
import { FONTS, COLORS } from '@/lib/theme/tokens';

const DEFAULT_WORDS = [
  'Save the dates',
  'RSVPs',
  'Dietary needs',
  'Plus-ones',
  'Flight numbers',
  'Hotel blocks',
  'Shuttle pickups',
  'Dress codes',
  'Visa walkthroughs',
  'Vendor coordination',
  'Cultural briefings',
  'Day-of details',
];

function LotusGlyph({ size = 18, color = 'rgba(255, 153, 51, 0.7)' }: { size?: number; color?: string }) {
  return (
    <Box
      component="svg"
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      sx={{ flex: 'none' }}
    >
      <path d="M27.69 14.29c.82 1.07 1.69 2.2 2.16 3.5.7 1.93.83 4.16.4 6.15-.38 1.82-1.02 3.11-1.96 4.7-1.58 2.62-3.09 4.36-3.64 7.52-.18 1.02-.1 2.13-.24 3.13-.02.13-.16.46-.23.57-.11.18-.37.21-.5.02-.2-.28-.24-1.26-.27-1.65-.18-2.16-.36-4.07-1.52-5.98-2.07-3.4-4.39-6.36-4.47-10.55-.06-2.86 1.44-5.49 3.07-7.74 1.13-1.56 2.05-2.82 2.84-4.62.27-.62.49-1.49.77-2.07.09-.18.27-.35.46-.22.28.18.3 1.42.36 1.78.4 2.25 1.43 3.71 2.77 5.46zM26.5 18.63c-.12-.14-.05-.66-.07-.87-.18-1.77-.65-2.12-1.43-3.55-.14-.25-.48-1.35-.76-1.33-.18.02-.18.52-.21.64-.23.78-.49 1.56-.95 2.22-1.24 1.77-2.46 2.64-3.01 4.93-.56 2.32-.33 3.79.57 5.58.72 1.44 1.33 1.58 2.47 2.46.58.45 1.79.22 2.52-.31.63-.46 1.55-2.02 1.95-2.67 1.09-1.79 1.07-5.28-.6-6.84-.12-.11-.43-.19-.48-.25z" fill={color} />
      <path d="M35.27 36.42c-1.69 1.58-3.94 2.59-6.19 3.15-.78.2-1.58.34-2.35.4-.25.02-.54.19-.81.16l-.13-.3c0-.05.17-.12.23-.18 2.42-2.62 2.46-6.35 3.75-9.55 1.61-3.97 5.09-6.33 9.33-6.9.16-.02.37-.16.57-.11.16.04.34.2.32.38-.02.13-.43.77-.53 1.04-1.5 4.2-.6 8.55-4.19 11.91zM16.47 38.81c-1.62-.62-3.54-1.78-4.58-3.2-2.06-2.81-2.37-6.29-3.11-9.59-.15-.68-.32-1.17-.59-1.82-.12-.29-.55-.74-.1-.95.28-.14.6-.04.9 0 5.06.73 8.38 3.95 9.75 8.74.82 2.86.81 5.11 2.99 7.42.17.18.61.36.33.7-.14.17-.87 0-1.1-.04-1.5-.3-3.08-.71-4.49-1.26zM12.41 37.43c1.23 1.12 2.78 2.05 4.34 2.64.25.1.55.22.82.23l-.09.32-2.15.32C11.09 41.34 7.19 39.87 4.96 36.21c-.81-1.34-1.26-2.85-2.45-3.94-.2-.18-.51-.25-.52-.56-.01-.24.18-.31.38-.38 2.08-.67 4.87 0 6.67 1.16.35.22.51.98.69 1.34.61 1.28 1.61 2.62 2.67 3.59zM30.39 40.54c-.09-.1-.08-.21.04-.27.2-.1.77-.18 1.03-.27 2.56-.9 5.74-3.58 6.86-6.05.23-.51.33-1.27.85-1.56 1.02-.56 1.95-1.01 3.13-1.18 1.28-.18 2.01-.25 3.26.13.23.07.5-.03.42.36-.05.28-.25.31-.4.47-.54.6-1.03 1.18-1.45 1.88-1.21 2.04-1.96 4.14-4.21 5.4-2.75 1.54-4.84 1.7-7.96 1.39-.32-.03-1.39-.08-1.57-.29zM25.79 19.11c.5.13.71.45.94.87.22.4.57 1.31.62 1.79.1.88-.03 2.34-.43 3.13-.39.76-.69 1.49-1.35 2.01-1 .8-2.47.16-2.69 0-.77-.54-1.57-1.34-2-3.23-.46-2.03.13-4.22 1.39-5.76.52-.63 1.4-1.39 1.77-2.1.09-.16.25-.91.31-.92.11-.03.15.05.21.11.06.06.89 1.37.94 1.48.33.74.18 1.82.29 2.62z" fill={color} />
    </Box>
  );
}

export interface MarqueeProps {
  words?: string[];
  /**
   * Optional CSS background. Defaults to the design's translucent white
   * (`rgba(255,255,255,0.4)`) which pairs with the backdrop-filter blur to
   * create the "floats on clouds" look at the bottom of the hero. Override
   * if you need a flat color elsewhere.
   */
  background?: string;
  /**
   * Apply backdrop-filter: blur(...) to the strip. Defaults to '6px' to
   * match the design. Pass 'none' to disable.
   */
  backdropBlur?: string;
}

export default function Marquee({
  words = DEFAULT_WORDS,
  background = 'rgba(255, 255, 255, 0.4)',
  backdropBlur = 'blur(6px)',
}: MarqueeProps) {
  return (
    <Box
      component="section"
      sx={{
        // Design: padding: 14px 0
        py: '14px',
        background,
        backdropFilter: backdropBlur,
        WebkitBackdropFilter: backdropBlur,
        borderTop: '1px solid rgba(0, 0, 0, 0.1)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
        position: 'relative',
        zIndex: 2,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          overflow: 'hidden',
          width: '100%',
          userSelect: 'none',
          maskImage: 'linear-gradient(90deg, transparent 0, black 5%, black 95%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(90deg, transparent 0, black 5%, black 95%, transparent 100%)',
          '&:hover .marquee-track': {
            animationPlayState: 'paused',
          },
          '@keyframes marquee-scroll': {
            from: { transform: 'translateX(0)' },
            to: { transform: 'translateX(-50%)' },
          },
        }}
      >
        <Box
          className="marquee-track"
          sx={{
            display: 'flex',
            flexShrink: 0,
            gap: { xs: 4, md: 6 },
            pr: { xs: 4, md: 6 },
            animation: 'marquee-scroll 50s linear infinite',
            alignItems: 'center',
            color: COLORS.text.muted,
          }}
        >
          {Array.from({ length: 2 }).flatMap((_, k) =>
            words.map((w, i) => (
              <Box
                key={`${k}-${i}`}
                sx={{ display: 'flex', alignItems: 'center', gap: { xs: 4, md: 6 } }}
              >
                <Box
                  component="span"
                  sx={{
                    fontFamily: FONTS.display,
                    fontStyle: 'italic',
                    fontSize: { xs: '1.2rem', md: '1.6rem' },
                    color: COLORS.text.muted,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {w}
                </Box>
                <LotusGlyph size={18} />
              </Box>
            )),
          )}
        </Box>
      </Box>
    </Box>
  );
}
