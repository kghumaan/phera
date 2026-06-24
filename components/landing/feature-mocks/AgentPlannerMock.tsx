'use client';

/**
 * FeatureStepper Step 01 mock — "One AI planner. Just talk to it."
 *
 * Depicts Phera's flagship: a single AI wedding planner you drive by chat or
 * voice. The couple speaks/types plain requests; the agent replies AND
 * mutates the real wedding data — shown as "updated" chips that land after
 * each turn (dates/venue, then a guest). Mirrors the actual Planner page
 * (app/admin/[weddingSlug]/assistant) + tool-call audit trail.
 *
 * Narrative (~12s loop):
 *   t=0      header fades in
 *   t=0.5s   user voice bubble #1 (venue/date)
 *   t=1.8s   agent typing dots
 *   t=2.6s   agent reply #1
 *   t=3.3s   data chips: Dates, Venue
 *   t=5.0s   user voice bubble #2 (add guest)
 *   t=6.2s   agent typing
 *   t=7.0s   agent reply #2
 *   t=7.6s   data chip: Guest added
 *   t=9s     held
 *   t=12s    restart
 */

import { useEffect, useState } from 'react';
import { Box, Stack } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { COLORS, FONTS, RADII } from '@/lib/theme/tokens';

type Role = 'user' | 'agent';
interface Bubble {
  role: Role;
  text: string;
  voice?: boolean;
}
interface Chip {
  label: string;
  value: string;
}

const BUBBLES: Bubble[] = [
  { role: 'user', voice: true, text: "We're getting married the second weekend of March 2027, in Goa near Anjuna." },
  { role: 'agent', text: 'Love it — Anjuna in March is gorgeous. Locking it in now.' },
  { role: 'user', text: 'Add my cousin Neha, she\'s coming with her husband. +1 415 555 9876.' },
  { role: 'agent', text: 'Done — Neha\'s on the list as a party of 2. Want me to start your room block next?' },
];

const CHIPS: Chip[] = [
  { label: 'Dates', value: 'Mar 13–14, 2027' },
  { label: 'Venue', value: 'Anjuna, Goa' },
  { label: 'Guest added', value: 'Neha · party of 2' },
];

const LOOP_MS = 12000;

export default function AgentPlannerMock() {
  const [tick, setTick] = useState(0);
  const [bubbleStep, setBubbleStep] = useState(0);
  const [typing, setTyping] = useState(false);
  const [chipStep, setChipStep] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const timeouts = new Set<ReturnType<typeof setTimeout>>();
    const after = (ms: number, fn: () => void) => {
      const t = setTimeout(() => {
        timeouts.delete(t);
        if (!cancelled) fn();
      }, ms);
      timeouts.add(t);
    };
    const cycle = () => {
      if (cancelled) return;
      timeouts.forEach(clearTimeout);
      timeouts.clear();
      setBubbleStep(0);
      setChipStep(0);
      setTyping(false);
      setTick((t) => t + 1);

      after(500, () => setBubbleStep(1)); // user #1
      after(1800, () => setTyping(true));
      after(2600, () => {
        setTyping(false);
        setBubbleStep(2); // agent #1
      });
      after(3300, () => setChipStep(1)); // Dates
      after(3700, () => setChipStep(2)); // Venue
      after(5000, () => setBubbleStep(3)); // user #2
      after(6200, () => setTyping(true));
      after(7000, () => {
        setTyping(false);
        setBubbleStep(4); // agent #2
      });
      after(7600, () => setChipStep(3)); // Guest added
      after(LOOP_MS, cycle);
    };
    cycle();
    return () => {
      cancelled = true;
      timeouts.forEach(clearTimeout);
    };
  }, []);

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        bgcolor: 'white',
        borderRadius: RADII.lg,
        border: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 24px 60px rgba(0,0,0,0.08)',
        p: { xs: 2, md: 2.25 },
        display: 'flex',
        flexDirection: 'column',
        gap: 1.25,
        overflow: 'hidden',
        fontFamily: FONTS.body,
      }}
    >
      {/* Header */}
      <Stack direction="row" spacing={1.25} alignItems="center" sx={{ flex: 'none' }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: RADII.sm,
            bgcolor: COLORS.brand.primary,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 'none',
            boxShadow: '0 2px 6px rgba(222,63,94,0.28)',
          }}
        >
          <SparkleIcon size={17} fill="white" />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ fontSize: '1rem', fontWeight: 600, color: COLORS.text.strong }}>Your AI planner</Box>
          <Box
            sx={{
              fontSize: '0.78rem',
              color: COLORS.text.subtle,
              fontFamily: 'var(--mono), monospace',
            }}
          >
            chat &amp; voice · updates everything for you
          </Box>
        </Box>
        <MicIcon />
      </Stack>
      <Box sx={{ height: '1px', bgcolor: 'rgba(0,0,0,0.06)', flex: 'none' }} />

      {/* Conversation */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 0.6,
          overflow: 'hidden',
        }}
      >
        <AnimatePresence initial={false}>
          {BUBBLES.map((b, i) =>
            i < bubbleStep ? (
              <motion.div
                key={`${tick}-b-${i}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                style={{ display: 'flex', justifyContent: b.role === 'user' ? 'flex-end' : 'flex-start' }}
              >
                <BubbleView bubble={b} />
              </motion.div>
            ) : null,
          )}
        </AnimatePresence>

        {typing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ display: 'flex', justifyContent: 'flex-start' }}
          >
            <Box
              sx={{
                bgcolor: COLORS.bg.subtle,
                border: `1px solid ${COLORS.border.faint}`,
                borderRadius: RADII.md,
                px: 1.25,
                py: 0.9,
                display: 'flex',
                gap: 0.5,
              }}
            >
              {[0, 1, 2].map((d) => (
                <Box
                  key={d}
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    bgcolor: COLORS.text.faint,
                    animation: `ap-bounce 1s ${d * 0.15}s infinite ease-in-out`,
                  }}
                />
              ))}
            </Box>
          </motion.div>
        )}
      </Box>

      {/* Data updated chips */}
      <Box sx={{ flex: 'none', display: 'flex', flexWrap: 'wrap', gap: 0.5, minHeight: 26 }}>
        <AnimatePresence initial={false}>
          {CHIPS.map((c, i) =>
            i < chipStep ? (
              <motion.div
                key={`${tick}-c-${i}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
              >
                <UpdatedChip chip={c} />
              </motion.div>
            ) : null,
          )}
        </AnimatePresence>
      </Box>

      <style>{`
        @keyframes ap-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
          40%           { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </Box>
  );
}

function BubbleView({ bubble }: { bubble: Bubble }) {
  const isUser = bubble.role === 'user';
  return (
    <Box
      sx={{
        maxWidth: '82%',
        px: 1.25,
        py: 0.9,
        borderRadius: RADII.md,
        bgcolor: isUser ? COLORS.brand.primarySubtle : COLORS.bg.subtle,
        border: `1px solid ${isUser ? COLORS.brand.primaryBorder : COLORS.border.faint}`,
      }}
    >
      <Stack direction="row" spacing={0.6} alignItems="flex-start">
        {bubble.voice && (
          <Box sx={{ mt: '2px', flex: 'none' }}>
            <MicIcon size={13} color={COLORS.brand.primary} />
          </Box>
        )}
        <Box sx={{ fontSize: '0.82rem', lineHeight: 1.4, color: COLORS.text.strong }}>{bubble.text}</Box>
      </Stack>
    </Box>
  );
}

function UpdatedChip({ chip }: { chip: Chip }) {
  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        bgcolor: COLORS.accent.successBg,
        border: `1px solid ${COLORS.accent.success}33`,
        borderRadius: '999px',
        px: 0.9,
        py: 0.35,
      }}
    >
      <CheckIcon />
      <Box
        sx={{
          fontSize: '0.68rem',
          fontFamily: 'var(--mono), monospace',
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: COLORS.accent.successText,
        }}
      >
        {chip.label}
      </Box>
      <Box sx={{ fontSize: '0.72rem', color: COLORS.text.muted }}>{chip.value}</Box>
    </Box>
  );
}

function SparkleIcon({ size = 11, fill = COLORS.brand.primary }: { size?: number; fill?: string }) {
  return (
    <Box component="svg" viewBox="0 0 16 16" sx={{ width: size, height: size, color: fill, flex: 'none' }}>
      <path
        fill="currentColor"
        d="M8 1.5l1.6 4.4 4.4 1.6-4.4 1.6L8 13.5 6.4 9.1 2 7.5l4.4-1.6L8 1.5zm5 8l.7 2 2 .7-2 .7L13 14.9l-.7-2-2-.7 2-.7L13 9.5z"
      />
    </Box>
  );
}

function MicIcon({ size = 16, color = COLORS.text.subtle }: { size?: number; color?: string }) {
  return (
    <Box component="svg" viewBox="0 0 24 24" sx={{ width: size, height: size, color, flex: 'none' }}>
      <path
        fill="currentColor"
        d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z"
      />
    </Box>
  );
}

function CheckIcon() {
  return (
    <Box component="svg" viewBox="0 0 16 16" sx={{ width: 12, height: 12, color: COLORS.accent.successText, flex: 'none' }}>
      <path fill="currentColor" d="M6.2 11.3 3 8.1l1.1-1.1 2.1 2.1 5.6-5.6L13 4.6z" />
    </Box>
  );
}
