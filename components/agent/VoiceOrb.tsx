'use client';

import { Box } from '@mui/material';
import { COLORS } from '@/lib/theme/tokens';

export type OrbState = 'idle' | 'listening' | 'thinking' | 'speaking';

/**
 * A soft, constantly-morphing "marble" orb for voice mode — blurred coloured
 * blobs drifting inside a clipped sphere, like the ChatGPT/Claude voice visual
 * but in Phera's warm rose-gold palette. Pure CSS (no WebGL), so it runs
 * everywhere. `state` modulates the motion: calmer when idle, breathing while
 * listening, swirling while thinking, pulsing while speaking.
 */
const BLOBS = [
  { color: COLORS.brand.primary, top: '8%', left: '14%', size: '74%', anim: 'phera-orb-1' },
  { color: COLORS.cultural.coral, top: '26%', left: '40%', size: '70%', anim: 'phera-orb-2' },
  { color: COLORS.cultural.saffron, top: '42%', left: '10%', size: '64%', anim: 'phera-orb-3' },
  { color: COLORS.cultural.gold, top: '20%', left: '30%', size: '58%', anim: 'phera-orb-4' },
];

// Per-state motion: [blob speed multiplier, breathing duration, glow strength].
const MOTION: Record<OrbState, { speed: number; breathe: string; glow: number; scale: number }> = {
  idle: { speed: 1.6, breathe: '9s', glow: 0.18, scale: 1.0 },
  listening: { speed: 1.0, breathe: '3.4s', glow: 0.34, scale: 1.05 },
  thinking: { speed: 0.55, breathe: '2.2s', glow: 0.28, scale: 1.03 },
  speaking: { speed: 0.7, breathe: '1.5s', glow: 0.45, scale: 1.08 },
};

export function VoiceOrb({ state = 'idle', size = 220 }: { state?: OrbState; size?: number }) {
  const motion = MOTION[state];
  return (
    <Box
      sx={{
        position: 'relative',
        width: size,
        height: size,
        display: 'grid',
        placeItems: 'center',
        '@keyframes phera-orb-breathe': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: `scale(${motion.scale})` },
        },
        '@keyframes phera-orb-glow': {
          '0%, 100%': { opacity: motion.glow * 0.6 },
          '50%': { opacity: motion.glow },
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
      }}
    >
      {/* Outer breathing glow */}
      <Box
        sx={{
          position: 'absolute',
          inset: '-12%',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${COLORS.brand.primary}, transparent 70%)`,
          filter: 'blur(24px)',
          animation: `phera-orb-glow ${motion.breathe} ease-in-out infinite`,
        }}
      />
      {/* The sphere */}
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          overflow: 'hidden',
          background: COLORS.bg.white,
          boxShadow: `inset 0 0 ${size * 0.18}px ${COLORS.bg.white}`,
          animation: `phera-orb-breathe ${motion.breathe} ease-in-out infinite`,
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
              animation: `${b.anim} ${(14 * motion.speed).toFixed(1)}s ease-in-out infinite`,
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
  );
}

export default VoiceOrb;
