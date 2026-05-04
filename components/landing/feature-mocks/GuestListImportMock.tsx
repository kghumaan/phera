'use client';

/**
 * FeatureStepper Step 01 mock — "Bring your guest list. We take it from there."
 *
 * Loop (~13s):
 *   t=0       file card slides in
 *   t=0.7s    progress bar fills (1.5s)
 *   t=2.2s    "✓ 147 guests imported"
 *   t=2.5s    table rows cascade in (12 rows, 125ms apart)
 *   t=4.0s    tag cascade — tags fade onto rows in groups, mimicking
 *             copy-paste-across-selection
 *   t=6.6s    "Request RSVPs" button appears top-right of the card
 *   t=7.3s    button auto-presses (scale tap)
 *   t=7.5s    button fades out, RSVP column animates in from 0→60px
 *   t=7.8s    RSVP statuses cascade onto rows (12 rows, 130ms apart)
 *   t=10.0s   full state held
 *   t=13.0s   restart
 *
 * Three columns: Guest (fixed 220px), Tags (flex 1, left-aligned), Party
 * (36px). RSVP (60px) slides in between Tags and Party once the button
 * is pressed.
 */

import { useEffect, useMemo, useState } from 'react';
import { Box, Stack } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { COLORS, FONTS } from '@/lib/theme/tokens';

interface Guest {
  initials: string;
  name: string;
  plusOne?: string;
  party: number;
  rsvp: 'yes' | 'maybe' | 'no';
}

const GUESTS: Guest[] = [
  { initials: 'AS', name: 'Aarav Sharma',     plusOne: 'Priya',     party: 2, rsvp: 'yes' },
  { initials: 'KP', name: 'Kavya Patel',                            party: 1, rsvp: 'yes' },
  { initials: 'RM', name: 'Rohan Mehta',      plusOne: '3 more',    party: 4, rsvp: 'maybe' },
  { initials: 'DI', name: 'Diya Iyer',        plusOne: 'Aryan',     party: 2, rsvp: 'yes' },
  { initials: 'VK', name: 'Vihaan Kapoor',    plusOne: '2 more',    party: 3, rsvp: 'yes' },
  { initials: 'SR', name: 'Saanvi Reddy',     plusOne: 'Aman',      party: 2, rsvp: 'yes' },
  { initials: 'AN', name: 'Aditya Nair',                            party: 1, rsvp: 'no' },
  { initials: 'AS', name: 'Anaya Shah',       plusOne: '4 more',    party: 5, rsvp: 'yes' },
  { initials: 'IS', name: 'Ishaan Singh',     plusOne: 'Riya',      party: 2, rsvp: 'maybe' },
  { initials: 'MB', name: 'Myra Bose',                              party: 1, rsvp: 'yes' },
  { initials: 'KJ', name: 'Karan Joshi',      plusOne: '2 more',    party: 3, rsvp: 'yes' },
  { initials: 'RB', name: 'Riya Banerjee',    plusOne: 'Aman',      party: 2, rsvp: 'yes' },
];

interface Tag { name: string; color: string }
const TAGS: Tag[] = [
  { name: 'Bride Family',      color: '#DE3F5E' },
  { name: 'Groom Family',      color: '#3b82f6' },
  { name: 'College Friends',   color: '#6C5CE7' },
  { name: 'Bridal Party',      color: '#D4AF37' },
  { name: 'Cousins',           color: '#20C997' },
  { name: 'Work',              color: '#6a6a6a' },
  { name: 'Childhood Friends', color: '#E07A1F' },
];

const TAG_SEQUENCE: Array<{ at: number; rowIdx: number; tagIdx: number }> = [
  { at:    0, rowIdx:  0, tagIdx: 0 },
  { at:  180, rowIdx:  3, tagIdx: 0 },
  { at:  330, rowIdx:  7, tagIdx: 0 },
  { at:  480, rowIdx:  9, tagIdx: 0 },
  { at:  780, rowIdx:  2, tagIdx: 1 },
  { at:  920, rowIdx:  4, tagIdx: 1 },
  { at: 1060, rowIdx:  8, tagIdx: 1 },
  { at: 1380, rowIdx:  1, tagIdx: 2 },
  { at: 1520, rowIdx:  5, tagIdx: 2 },
  { at: 1660, rowIdx:  8, tagIdx: 2 },
  { at: 1980, rowIdx:  5, tagIdx: 3 },
  { at: 2120, rowIdx: 10, tagIdx: 3 },
  { at: 2400, rowIdx:  4, tagIdx: 4 },
  { at: 2620, rowIdx:  6, tagIdx: 5 },
  { at: 2820, rowIdx: 11, tagIdx: 6 },
];

const TOTAL_GUESTS = 147;
const LOOP_MS = 13000;

type Phase = 'idle' | 'file' | 'importing' | 'done' | 'table' | 'tagging' | 'awaiting-rsvp' | 'rsvp';

export default function GuestListImportMock() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [progress, setProgress] = useState(0);
  const [counter, setCounter] = useState(0);
  const [tagStep, setTagStep] = useState(0);
  const [buttonPressed, setButtonPressed] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const timeouts = new Set<ReturnType<typeof setTimeout>>();
    const intervals = new Set<ReturnType<typeof setInterval>>();
    const clearAll = () => {
      timeouts.forEach(clearTimeout);
      intervals.forEach(clearInterval);
      timeouts.clear();
      intervals.clear();
    };
    const after = (ms: number, fn: () => void) => {
      const t = setTimeout(() => {
        timeouts.delete(t);
        if (!cancelled) fn();
      }, ms);
      timeouts.add(t);
    };
    const tween = (ms: number, onTick: (t: number) => void) => {
      const start = Date.now();
      const i = setInterval(() => {
        const t = Math.min(1, (Date.now() - start) / ms);
        if (cancelled) {
          clearInterval(i);
          intervals.delete(i);
          return;
        }
        onTick(t);
        if (t >= 1) {
          clearInterval(i);
          intervals.delete(i);
        }
      }, 30);
      intervals.add(i);
    };

    const cycle = () => {
      if (cancelled) return;
      clearAll();
      setProgress(0);
      setCounter(0);
      setTagStep(0);
      setButtonPressed(false);
      setPhase('idle');
      setTick((t) => t + 1);

      after(50,    () => setPhase('file'));
      after(700,   () => {
        setPhase('importing');
        tween(1500, (t) => setProgress(Math.round(t * 100)));
      });
      after(2200,  () => setPhase('done'));
      after(2500,  () => {
        setPhase('table');
        tween(2200, (t) => setCounter(Math.round(TOTAL_GUESTS * t)));
      });
      after(4000,  () => setPhase('tagging'));
      TAG_SEQUENCE.forEach((s, idx) => after(4000 + s.at, () => setTagStep(idx + 1)));
      // Button appears, then auto-presses, then RSVP column reveals.
      after(6600,  () => setPhase('awaiting-rsvp'));
      after(7300,  () => setButtonPressed(true));
      after(7500,  () => setPhase('rsvp'));
      after(LOOP_MS, cycle);
    };

    cycle();
    return () => {
      cancelled = true;
      clearAll();
    };
  }, []);

  const appliedTagsByRow = useMemo(() => {
    const out: number[][] = GUESTS.map(() => []);
    for (let i = 0; i < tagStep; i++) {
      const { rowIdx, tagIdx } = TAG_SEQUENCE[i];
      if (!out[rowIdx].includes(tagIdx)) out[rowIdx].push(tagIdx);
    }
    return out;
  }, [tagStep]);

  const showButton = phase === 'awaiting-rsvp';
  const rsvpVisible = phase === 'rsvp';
  const tableActive = phase === 'table' || phase === 'tagging' || phase === 'awaiting-rsvp' || phase === 'rsvp';

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        bgcolor: 'white',
        borderRadius: '14px',
        border: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 24px 60px rgba(0,0,0,0.08)',
        p: { xs: 2.5, md: 3 },
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        overflow: 'hidden',
        fontFamily: FONTS.body,
        position: 'relative',
      }}
    >
      <FileRow phase={phase} progress={progress} counter={counter} />
      <Divider />
      <TableHeader visible={tableActive} rsvpVisible={rsvpVisible} />
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5, minHeight: 0 }}>
        <AnimatePresence mode="popLayout">
          {tableActive && (
            <motion.div key={`rows-${tick}`} style={{ display: 'contents' }}>
              {GUESTS.map((g, i) => (
                <motion.div
                  key={`${tick}-${i}`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.28, delay: i * 0.12, ease: 'easeOut' }}
                >
                  <Row
                    guest={g}
                    tags={appliedTagsByRow[i]}
                    rsvpVisible={rsvpVisible}
                    rsvpDelayMs={i * 130}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </Box>

      {/* Floating "Request RSVPs" button */}
      <AnimatePresence>
        {showButton && (
          <motion.button
            type="button"
            initial={{ opacity: 0, y: -6, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: buttonPressed ? 0.96 : 1 }}
            exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.2 } }}
            transition={{ duration: 0.32, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              background: COLORS.brand.primary,
              color: 'white',
              border: 0,
              borderRadius: 999,
              padding: '8px 14px',
              fontFamily: 'inherit',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: buttonPressed
                ? '0 2px 6px rgba(222,63,94,0.18)'
                : '0 8px 18px rgba(222,63,94,0.25)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              zIndex: 5,
            }}
          >
            Request RSVPs
            <span style={{ display: 'inline-block', fontSize: '0.85em' }}>→</span>
          </motion.button>
        )}
      </AnimatePresence>
    </Box>
  );
}

/* ──────────────── pieces ──────────────── */

function FileRow({ phase, progress, counter }: { phase: Phase; progress: number; counter: number }) {
  const visible = phase !== 'idle';
  const showProgress = phase === 'importing';
  const isDone = phase !== 'idle' && phase !== 'file' && phase !== 'importing';
  const display = phase === 'table' ? counter : isDone ? TOTAL_GUESTS : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : -8 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center">
        <ExcelIcon />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
            <Box sx={{ fontSize: '0.875rem', fontWeight: 600, color: COLORS.text.strong }}>
              guests.xlsx
            </Box>
            <Box sx={{ fontSize: '0.75rem', color: COLORS.text.faint, fontFamily: 'var(--mono), monospace' }}>
              ·  142 KB
            </Box>
          </Stack>
          {showProgress ? (
            <ProgressBar value={progress} />
          ) : isDone ? (
            <Stack direction="row" spacing={0.75} alignItems="center">
              <CheckBadge />
              <Box sx={{ fontSize: '0.8rem', color: COLORS.accent.successText, fontWeight: 600 }}>
                {display} guests imported
              </Box>
            </Stack>
          ) : (
            <Box sx={{ fontSize: '0.8rem', color: COLORS.text.subtle }}>
              Drop a spreadsheet to import.
            </Box>
          )}
        </Box>
      </Stack>
    </motion.div>
  );
}

function ExcelIcon() {
  return (
    <Box
      sx={{
        width: 40,
        height: 48,
        borderRadius: '6px',
        bgcolor: '#1B7A45',
        position: 'relative',
        flex: 'none',
        boxShadow: '0 2px 6px rgba(27,122,69,0.25)',
      }}
    >
      <Box sx={{ position: 'absolute', top: 0, right: 0, width: 12, height: 12, bgcolor: '#0E5C32', clipPath: 'polygon(0 0, 100% 100%, 100% 0)' }} />
      <Box sx={{ position: 'absolute', inset: '20% 14% 14% 14%', display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: 'repeat(3, 1fr)', gap: '1px' }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Box key={i} sx={{ bgcolor: 'rgba(255,255,255,0.85)', borderRadius: '1px' }} />
        ))}
      </Box>
      <Box sx={{ position: 'absolute', bottom: 4, left: 0, right: 0, textAlign: 'center', color: 'white', fontFamily: 'var(--mono), monospace', fontSize: '7px', fontWeight: 700, letterSpacing: '0.05em' }}>
        XLSX
      </Box>
    </Box>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box sx={{ flex: 1, height: 4, bgcolor: 'rgba(0,0,0,0.06)', borderRadius: 999, overflow: 'hidden' }}>
        <Box sx={{ height: '100%', width: `${value}%`, bgcolor: COLORS.brand.primary, transition: 'width 0.05s linear' }} />
      </Box>
      <Box sx={{ width: 36, textAlign: 'right', fontFamily: 'var(--mono), monospace', fontSize: '0.7rem', color: COLORS.text.subtle, fontVariantNumeric: 'tabular-nums' }}>
        {value}%
      </Box>
    </Box>
  );
}

function CheckBadge() {
  return (
    <Box sx={{ width: 18, height: 18, borderRadius: '50%', bgcolor: COLORS.accent.success, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
      <Box component="svg" viewBox="0 0 16 16" sx={{ width: 11, height: 11 }}>
        <path d="M3 8.5l3 3 7-7" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </Box>
    </Box>
  );
}

function Divider() {
  return <Box sx={{ height: '1px', bgcolor: 'rgba(0,0,0,0.06)', flex: 'none' }} />;
}

const COL = {
  guest: '0 0 220px',
  tags: '1 1 auto',
  rsvp: '0 0 60px',
  party: '0 0 36px',
} as const;

function TableHeader({ visible, rsvpVisible }: { visible: boolean; rsvpVisible: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.3 }}
    >
      <Stack
        direction="row"
        sx={{
          fontFamily: 'var(--mono), monospace',
          fontSize: '0.65rem',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: COLORS.text.faint,
          py: 0.75,
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Box sx={{ flex: COL.guest }}>Guest</Box>
        <Box sx={{ flex: COL.tags, minWidth: 0 }}>Tags</Box>
        <RsvpHeaderCell visible={rsvpVisible} />
        <Box sx={{ flex: COL.party, textAlign: 'right' }}>Party</Box>
      </Stack>
    </motion.div>
  );
}

function RsvpHeaderCell({ visible }: { visible: boolean }) {
  return (
    <motion.div
      initial={false}
      animate={{ width: visible ? 60 : 0, opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      style={{ overflow: 'hidden', flex: 'none' }}
    >
      <Box sx={{ width: 60 }}>RSVP</Box>
    </motion.div>
  );
}

function Row({
  guest,
  tags,
  rsvpVisible,
  rsvpDelayMs,
}: {
  guest: Guest;
  tags: number[];
  rsvpVisible: boolean;
  rsvpDelayMs: number;
}) {
  return (
    <Stack
      direction="row"
      sx={{
        alignItems: 'center',
        py: 0.75,
        borderBottom: '1px solid rgba(0,0,0,0.04)',
        fontSize: '0.8rem',
        gap: 1.5,
      }}
    >
      {/* Guest name + plus-one — fixed-width column so tags column starts
          at the same x across every row. */}
      <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: COL.guest, minWidth: 0 }}>
        <Box
          sx={{
            width: 26,
            height: 26,
            borderRadius: '50%',
            bgcolor: 'rgba(222,63,94,0.1)',
            color: COLORS.brand.primary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.625rem',
            fontWeight: 700,
            flex: 'none',
          }}
        >
          {guest.initials}
        </Box>
        <Box sx={{ minWidth: 0, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
          <Box component="span" sx={{ color: COLORS.text.strong, fontWeight: 500 }}>
            {guest.name}
          </Box>
          {guest.plusOne && (
            <Box
              component="span"
              sx={{
                color: COLORS.text.faint,
                fontWeight: 400,
                ml: 0.5,
                fontSize: '0.75rem',
              }}
            >
              + {guest.plusOne}
            </Box>
          )}
        </Box>
      </Stack>

      {/* Tags — flex column, left-aligned within its cell. */}
      <Box
        sx={{
          flex: COL.tags,
          minWidth: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          gap: 0.5,
          flexWrap: 'wrap',
          rowGap: 0.5,
          minHeight: 22,
        }}
      >
        <AnimatePresence>
          {tags.map((tagIdx) => (
            <motion.span
              key={tagIdx}
              initial={{ opacity: 0, scale: 0.7, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              style={{ display: 'inline-flex' }}
            >
              <TagPill tag={TAGS[tagIdx]} />
            </motion.span>
          ))}
        </AnimatePresence>
      </Box>

      {/* RSVP — width animates 0→60 when phase becomes 'rsvp', content
          fades in with per-row stagger via rsvpDelayMs. */}
      <RsvpCell rsvp={guest.rsvp} visible={rsvpVisible} delayMs={rsvpDelayMs} />

      {/* Party */}
      <Box
        sx={{
          flex: COL.party,
          textAlign: 'right',
          fontFamily: 'var(--mono), monospace',
          fontSize: '0.7rem',
          color: COLORS.text.subtle,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {guest.party}
      </Box>
    </Stack>
  );
}

function RsvpCell({
  rsvp,
  visible,
  delayMs,
}: {
  rsvp: 'yes' | 'maybe' | 'no';
  visible: boolean;
  delayMs: number;
}) {
  const tone =
    rsvp === 'yes'
      ? { dot: COLORS.accent.success, fg: COLORS.accent.successText, label: 'Yes' }
      : rsvp === 'maybe'
        ? { dot: COLORS.accent.warning, fg: COLORS.accent.warningText, label: 'Maybe' }
        : { dot: COLORS.accent.danger, fg: COLORS.accent.dangerText, label: 'No' };

  return (
    <motion.div
      initial={false}
      animate={{ width: visible ? 60 : 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      style={{ overflow: 'hidden', flex: 'none' }}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: visible ? 1 : 0 }}
        transition={{
          duration: 0.3,
          delay: visible ? 0.3 + delayMs / 1000 : 0,
          ease: 'easeOut',
        }}
        style={{ width: 60 }}
      >
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: tone.dot, flex: 'none' }} />
          <Box sx={{ fontSize: '0.7rem', color: tone.fg, fontWeight: 600 }}>
            {tone.label}
          </Box>
        </Stack>
      </motion.div>
    </motion.div>
  );
}

function TagPill({ tag }: { tag: Tag }) {
  return (
    <Box
      sx={{
        bgcolor: `${tag.color}1f`,
        color: tag.color,
        fontSize: '0.625rem',
        fontWeight: 600,
        px: 0.85,
        py: 0.25,
        borderRadius: 999,
        whiteSpace: 'nowrap',
        lineHeight: 1.4,
      }}
    >
      {tag.name}
    </Box>
  );
}
