'use client';

import { Box } from '@mui/material';
import { COLORS, SHADOWS } from '@/lib/theme/tokens';

export type OrbState = 'idle' | 'listening' | 'thinking' | 'speaking';

/**
 * A soft, constantly-morphing "marble" orb for voice mode — blurred coloured
 * blobs drifting inside a clipped sphere, in Phera's warm rose-gold palette.
 * Pure CSS (no WebGL), so it runs everywhere.
 *
 * IMPORTANT (flicker fix): the keyframes and animation *durations* are STATIC —
 * they never depend on `state`. State only modulates smoothly-transitioned
 * properties (glow opacity + overall scale). Previously the keyframes/durations
 * were rewritten on every state change, which restarted all CSS animations and
 * made the orb visibly jump/flicker on each idle→listening→thinking→speaking
 * beat. Now the state change just glides.
 */
const BLOBS = [
  { color: COLORS.brand.primary, top: '8%', left: '14%', size: '74%', anim: 'phera-orb-1', dur: '15s' },
  { color: COLORS.cultural.coral, top: '26%', left: '40%', size: '70%', anim: 'phera-orb-2', dur: '17s' },
  { color: COLORS.cultural.saffron, top: '42%', left: '10%', size: '64%', anim: 'phera-orb-3', dur: '13s' },
  { color: COLORS.cultural.gold, top: '20%', left: '30%', size: '58%', anim: 'phera-orb-4', dur: '19s' },
];

const MOTION: Record<OrbState, { glow: number; scale: number }> = {
  idle: { glow: 0.16, scale: 1.0 },
  listening: { glow: 0.34, scale: 1.04 },
  thinking: { glow: 0.24, scale: 1.02 },
  speaking: { glow: 0.46, scale: 1.06 },
};

export function VoiceOrb({ state = 'idle', size = 170 }: { state?: OrbState; size?: number }) {
  const motion = MOTION[state];
  return (
    <Box
      sx={{
        position: 'relative',
        width: size,
        height: size,
        display: 'grid',
        placeItems: 'center',
        // Static keyframes — defined once, never depend on `state`.
        '@keyframes phera-orb-breathe': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.035)' },
        },
        '@keyframes phera-orb-glow': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.08)' },
        },
        '@keyframes phera-orb-1': {
          '0%': { transform: 'translate(0%, 0%) scale(1)' },
          '33%': { transform: 'translate(14%, 10%) scale(1.12)' },
          '66%': { transform: 'translate(-8%, 16%) scale(0.92)' },
          '100%': { transform: 'translate(0%, 0%) scale(1)' },
        },
        '@keyframes phera-orb-2': {
          '0%': { transform: 'translate(0%, 0%) scale(1)' },
          '33%': { transform: 'translate(-16%, 8%) scale(0.9)' },
          '66%': { transform: 'translate(10%, -12%) scale(1.15)' },
          '100%': { transform: 'translate(0%, 0%) scale(1)' },
        },
        '@keyframes phera-orb-3': {
          '0%': { transform: 'translate(0%, 0%) scale(1)' },
          '33%': { transform: 'translate(12%, -14%) scale(1.1)' },
          '66%': { transform: 'translate(16%, 8%) scale(0.95)' },
          '100%': { transform: 'translate(0%, 0%) scale(1)' },
        },
        '@keyframes phera-orb-4': {
          '0%': { transform: 'translate(0%, 0%) scale(1)' },
          '33%': { transform: 'translate(-12%, -10%) scale(1.08)' },
          '66%': { transform: 'translate(-14%, 12%) scale(0.9)' },
          '100%': { transform: 'translate(0%, 0%) scale(1)' },
        },
        // Respect reduced-motion: hold the orb still (WCAG 2.3.3).
        '@media (prefers-reduced-motion: reduce)': {
          '& *': { animation: 'none !important', transition: 'none !important' },
        },
      }}
    >
      {/* Outer glow — opacity carries the state (transitioned); a fixed slow
          scale pulse keeps it alive without restarting on state change. */}
      <Box
        sx={{
          position: 'absolute',
          inset: '-12%',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${COLORS.brand.primary}, transparent 70%)`,
          filter: 'blur(24px)',
          opacity: motion.glow,
          transition: 'opacity 0.6s ease',
          animation: 'phera-orb-glow 4.5s ease-in-out infinite',
        }}
      />
      {/* State-scale wrapper — the only thing that moves on a state change, and
          it transitions smoothly rather than snapping. */}
      <Box
        sx={{
          width: '100%',
          height: '100%',
          transform: `scale(${motion.scale})`,
          transition: 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {/* The sphere — fixed gentle breathe. */}
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            overflow: 'hidden',
            background: COLORS.bg.white,
            border: `1.5px solid ${COLORS.brand.primaryBorder}`,
            boxShadow: `inset 0 0 ${Math.round(size * 0.16)}px ${COLORS.bg.white}, ${SHADOWS.popover}`,
            animation: 'phera-orb-breathe 4s ease-in-out infinite',
          }}
        >
          {BLOBS.map((b) => (
            <Box
              key={b.anim}
              sx={{
                position: 'absolute',
                top: b.top,
                left: b.left,
                width: b.size,
                height: b.size,
                borderRadius: '50%',
                background: `radial-gradient(circle at 40% 40%, ${b.color}, transparent 68%)`,
                filter: `blur(${Math.round(size * 0.07)}px)`,
                opacity: 0.75,
                animation: `${b.anim} ${b.dur} ease-in-out infinite`,
              }}
            />
          ))}
          {/* Glossy highlight for sphere depth */}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: `radial-gradient(circle at 32% 28%, ${COLORS.bg.white}, transparent 42%)`,
              opacity: 0.55,
              mixBlendMode: 'screen',
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}

export default VoiceOrb;
