'use client';

/**
 * FeatureStepper Step 04 mock — "Room assignments, without the politics."
 *
 * Mirrors GuestListImportMock's structure (file-card → progress → cascading
 * cards → action button → cascading content) but for the Rooms admin flow:
 *
 * Loop (~13s):
 *   t=0       PDF file card slides in ("hotel-block.pdf")
 *   t=0.7s    progress bar fills (1.5s) — Gemini parsing
 *   t=2.2s    "✓ 84 rooms imported"
 *   t=2.5s    room-card grid cascades in (6 rooms, 180ms apart) — empty slots
 *   t=4.4s    "Auto-assign" button appears top-right of the card
 *   t=5.1s    button auto-presses (scale tap)
 *   t=5.3s    button fades, slot pills cascade-fill with guest names + side
 *             colors (12 slots, 140ms apart)
 *   t=10.0s   full state held
 *   t=13.0s   restart
 *
 * Six rooms are shown in a responsive 2/3-column grid. Each room card has:
 * a room number, a capacity badge ("0/2" → "2/2"), a bed-type subtitle,
 * and capacity slots that flip from dashed-empty to filled with a guest's
 * side-colored pill. The data is a small consistent universe — names match
 * Step 01's GUESTS list so the same wedding feels woven through every step.
 */

import { useEffect, useState } from 'react';
import { Box, Stack } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { COLORS, FONTS } from '@/lib/theme/tokens';

type Side = 'bride' | 'groom' | 'both';

interface Assignment {
  initials: string;
  name: string;
  side: Side;
}

interface Room {
  number: string;
  bedType: string;
  capacity: number;
  /** Length must equal capacity. */
  assignees: Assignment[];
}

// Three rooms per row, capacities ramp 2 → 3 → 4 down the grid so the page
// reads as "different room types" without each row jiggling vertically.
const ROOMS: Room[] = [
  // Row 1 — couples / 2-cap
  {
    number: '305',
    bedType: '1 King',
    capacity: 2,
    assignees: [
      { initials: 'AS', name: 'Aarav Sharma', side: 'bride' },
      { initials: 'PS', name: 'Priya Sharma', side: 'bride' },
    ],
  },
  {
    number: 'PH-2',
    bedType: 'Suite',
    capacity: 2,
    assignees: [
      { initials: 'VK', name: 'Vihaan Kapoor', side: 'groom' },
      { initials: 'SR', name: 'Saanvi Reddy', side: 'bride' },
    ],
  },
  {
    number: '506',
    bedType: 'Suite',
    capacity: 2,
    assignees: [
      { initials: 'RV', name: 'Reyansh Verma', side: 'groom' },
      { initials: 'KM', name: 'Kabir Mehta', side: 'groom' },
    ],
  },
  // Row 2 — 3-cap
  {
    number: '312',
    bedType: '2 Queens',
    capacity: 3,
    assignees: [
      { initials: 'RM', name: 'Rohan Mehta', side: 'groom' },
      { initials: 'VM', name: 'Vikram Mehta', side: 'groom' },
      { initials: 'SR', name: 'Sneha Reddy', side: 'both' },
    ],
  },
  {
    number: '401',
    bedType: '2 Queens',
    capacity: 3,
    assignees: [
      { initials: 'AS', name: 'Anaya Shah', side: 'bride' },
      { initials: 'IS', name: 'Ishaan Singh', side: 'groom' },
      { initials: 'RB', name: 'Riya Banerjee', side: 'bride' },
    ],
  },
  {
    number: '105',
    bedType: 'King + Sofa',
    capacity: 3,
    assignees: [
      { initials: 'KJ', name: 'Karan Joshi', side: 'groom' },
      { initials: 'MB', name: 'Myra Bose', side: 'bride' },
      { initials: 'AK', name: 'Aryan Kumar', side: 'groom' },
    ],
  },
  // Row 3 — family suites / 4-cap
  {
    number: '218',
    bedType: 'Family Suite',
    capacity: 4,
    assignees: [
      { initials: 'DI', name: 'Diya Iyer', side: 'bride' },
      { initials: 'NP', name: 'Nisha Pandey', side: 'bride' },
      { initials: 'DM', name: 'Dev Mehra', side: 'groom' },
      { initials: 'KP', name: 'Kavya Patel', side: 'bride' },
    ],
  },
  {
    number: '612',
    bedType: '2 Queens + Sofa',
    capacity: 4,
    assignees: [
      { initials: 'AG', name: 'Anika Ghosh', side: 'bride' },
      { initials: 'AJ', name: 'Aditi Joshi', side: 'bride' },
      { initials: 'SK', name: 'Sahil Khanna', side: 'groom' },
      { initials: 'MR', name: 'Meera Ramesh', side: 'bride' },
    ],
  },
  {
    number: '720',
    bedType: 'Connecting',
    capacity: 4,
    assignees: [
      { initials: 'TK', name: 'Tanvi Kapoor', side: 'bride' },
      { initials: 'AS', name: 'Arjun Singh', side: 'groom' },
      { initials: 'NB', name: 'Neha Bhatia', side: 'bride' },
      { initials: 'RI', name: 'Rahul Iyer', side: 'groom' },
    ],
  },
];

const SIDE_TONE: Record<Side, { bg: string; fg: string; dot: string }> = {
  bride: { bg: 'rgba(222,63,94,0.10)', fg: '#B33053', dot: '#DE3F5E' },
  groom: { bg: 'rgba(59,130,246,0.10)', fg: '#1E5BB8', dot: '#3B82F6' },
  both: { bg: 'rgba(108,92,231,0.10)', fg: '#5347B5', dot: '#6C5CE7' },
};

const TOTAL_ROOMS = 84;
const TOTAL_GUESTS = 147;
const PLACED_GUESTS = 138;
const LOOP_MS = 14500;

/** Flat list of (roomIdx, slotIdx) tuples in cascade-fill order. */
const ASSIGN_SEQUENCE: Array<{ roomIdx: number; slotIdx: number }> = ROOMS.flatMap(
  (r, roomIdx) => r.assignees.map((_, slotIdx) => ({ roomIdx, slotIdx })),
);

type Phase =
  | 'idle'
  | 'file'
  | 'importing'
  | 'done'
  | 'rooms'
  | 'awaiting-assign'
  | 'assigning'
  | 'placed';

export default function RoomAssignmentsMock() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [progress, setProgress] = useState(0);
  const [counter, setCounter] = useState(0);
  const [assignStep, setAssignStep] = useState(0);
  const [buttonPressed, setButtonPressed] = useState(false);
  const [placedProgress, setPlacedProgress] = useState(0);
  const [placedCount, setPlacedCount] = useState(0);
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
      setAssignStep(0);
      setButtonPressed(false);
      setPlacedProgress(0);
      setPlacedCount(0);
      setPhase('idle');
      setTick((t) => t + 1);

      after(50, () => setPhase('file'));
      after(700, () => {
        setPhase('importing');
        tween(1500, (t) => setProgress(Math.round(t * 100)));
      });
      after(2200, () => {
        setPhase('done');
        tween(900, (t) => setCounter(Math.round(TOTAL_ROOMS * t)));
      });
      after(2500, () => setPhase('rooms'));
      after(4400, () => setPhase('awaiting-assign'));
      after(5100, () => setButtonPressed(true));
      after(5300, () => setPhase('assigning'));
      ASSIGN_SEQUENCE.forEach((_, idx) => {
        after(5300 + idx * 100, () => setAssignStep(idx + 1));
      });
      // Last slot lands at 5300 + (N-1)*100 ≈ 7100ms. Small breath, then
      // the placement summary donut fades in and animates to its target.
      const cascadeEndsAt = 5300 + ASSIGN_SEQUENCE.length * 100;
      after(cascadeEndsAt + 200, () => {
        setPhase('placed');
        tween(1400, (t) => {
          setPlacedProgress(t * (PLACED_GUESTS / TOTAL_GUESTS));
          setPlacedCount(Math.round(t * PLACED_GUESTS));
        });
      });
      after(LOOP_MS, cycle);
    };

    cycle();
    return () => {
      cancelled = true;
      clearAll();
    };
  }, []);

  const roomsActive =
    phase === 'rooms' ||
    phase === 'awaiting-assign' ||
    phase === 'assigning' ||
    phase === 'placed';
  const showButton = phase === 'awaiting-assign';
  const showPlacement = phase === 'placed';

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
      <FileRow
        phase={phase}
        progress={progress}
        counter={counter}
        showButton={showButton}
        showPlacement={showPlacement}
        buttonPressed={buttonPressed}
        placedProgress={placedProgress}
        placedCount={placedCount}
      />
      <Divider />

      <Box sx={{ flex: 1, minHeight: 0 }}>
        <AnimatePresence mode="popLayout">
          {roomsActive && (
            <motion.div
              key={`grid-${tick}`}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                // Row heights ramp with slot count so 4-cap rooms get the
                // most vertical real estate; 2-cap stays compact. The
                // total fills the available card area.
                gridTemplateRows: '2fr 3fr 4fr',
                gap: 8,
                height: '100%',
              }}
            >
              {ROOMS.map((room, i) => {
                const filled = ASSIGN_SEQUENCE.slice(0, assignStep).filter(
                  (a) => a.roomIdx === i,
                ).length;
                return (
                  <motion.div
                    key={`${tick}-${i}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.32, delay: i * 0.1, ease: 'easeOut' }}
                    style={{ minHeight: 0 }}
                  >
                    <RoomCard
                      room={room}
                      filled={filled}
                      assignedSlotIdx={(slotIdx) =>
                        ASSIGN_SEQUENCE.findIndex(
                          (a) => a.roomIdx === i && a.slotIdx === slotIdx,
                        ) < assignStep
                      }
                    />
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </Box>
    </Box>
  );
}

/* ──────────────── pieces ──────────────── */

function FileRow({
  phase,
  progress,
  counter,
  showButton,
  showPlacement,
  buttonPressed,
  placedProgress,
  placedCount,
}: {
  phase: Phase;
  progress: number;
  counter: number;
  showButton: boolean;
  showPlacement: boolean;
  buttonPressed: boolean;
  placedProgress: number;
  placedCount: number;
}) {
  const visible = phase !== 'idle';
  const showProgress = phase === 'importing';
  const isDone =
    phase === 'done' ||
    phase === 'rooms' ||
    phase === 'awaiting-assign' ||
    phase === 'assigning' ||
    phase === 'placed';
  const display = phase === 'done' ? counter : isDone ? TOTAL_ROOMS : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : -8 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center">
        <PdfIcon />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
            <Box sx={{ fontSize: '0.875rem', fontWeight: 600, color: COLORS.text.strong }}>
              hotel-block.pdf
            </Box>
            <Box
              sx={{
                fontSize: '0.75rem',
                color: COLORS.text.faint,
                fontFamily: 'var(--mono), monospace',
              }}
            >
              ·  286 KB
            </Box>
          </Stack>
          {showProgress ? (
            <ProgressBar value={progress} />
          ) : isDone ? (
            <Stack direction="row" spacing={0.75} alignItems="center">
              <CheckBadge />
              <Box sx={{ fontSize: '0.8rem', color: COLORS.accent.successText, fontWeight: 600 }}>
                {display} rooms imported
              </Box>
            </Stack>
          ) : (
            <Box sx={{ fontSize: '0.8rem', color: COLORS.text.subtle }}>
              Drop a PDF or floor plan to import.
            </Box>
          )}
        </Box>

        {/* Action area — vertically centered with the PDF icon. Holds the
            "Auto-assign" CTA, then swaps to the placement-progress donut
            once assignments are done. */}
        <Box sx={{ flex: 'none', display: 'flex', alignItems: 'center', minHeight: 48 }}>
          <AnimatePresence mode="wait">
            {showButton ? (
              <motion.button
                key="btn"
                type="button"
                initial={{ opacity: 0, y: -4, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: buttonPressed ? 0.96 : 1 }}
                exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.2 } }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                style={{
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
                }}
              >
                Auto-assign guests
                <span style={{ display: 'inline-block', fontSize: '0.85em' }}>→</span>
              </motion.button>
            ) : showPlacement ? (
              <motion.div
                key="donut"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.32, ease: 'easeOut' }}
              >
                <PlacementSummary
                  progress={placedProgress}
                  placed={placedCount}
                  total={TOTAL_GUESTS}
                />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </Box>
      </Stack>
    </motion.div>
  );
}

function PdfIcon() {
  return (
    <Box
      sx={{
        width: 40,
        height: 48,
        borderRadius: '6px',
        bgcolor: '#C73552',
        position: 'relative',
        flex: 'none',
        boxShadow: '0 2px 6px rgba(199,53,82,0.25)',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: 12,
          height: 12,
          bgcolor: '#9D2742',
          clipPath: 'polygon(0 0, 100% 100%, 100% 0)',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          inset: '20% 14% 38% 14%',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
        }}
      >
        {[0.85, 0.6, 0.75].map((w, i) => (
          <Box
            key={i}
            sx={{ height: 2, width: `${w * 100}%`, bgcolor: 'rgba(255,255,255,0.85)', borderRadius: '1px' }}
          />
        ))}
      </Box>
      <Box
        sx={{
          position: 'absolute',
          bottom: 4,
          left: 0,
          right: 0,
          textAlign: 'center',
          color: 'white',
          fontFamily: 'var(--mono), monospace',
          fontSize: '7px',
          fontWeight: 700,
          letterSpacing: '0.05em',
        }}
      >
        PDF
      </Box>
    </Box>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box sx={{ flex: 1, height: 4, bgcolor: 'rgba(0,0,0,0.06)', borderRadius: 999, overflow: 'hidden' }}>
        <Box
          sx={{
            height: '100%',
            width: `${value}%`,
            bgcolor: COLORS.brand.primary,
            transition: 'width 0.05s linear',
          }}
        />
      </Box>
      <Box
        sx={{
          width: 36,
          textAlign: 'right',
          fontFamily: 'var(--mono), monospace',
          fontSize: '0.7rem',
          color: COLORS.text.subtle,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}%
      </Box>
    </Box>
  );
}

function CheckBadge() {
  return (
    <Box
      sx={{
        width: 18,
        height: 18,
        borderRadius: '50%',
        bgcolor: COLORS.accent.success,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 'none',
      }}
    >
      <Box component="svg" viewBox="0 0 16 16" sx={{ width: 11, height: 11 }}>
        <path d="M3 8.5l3 3 7-7" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </Box>
    </Box>
  );
}

function Divider() {
  return <Box sx={{ height: '1px', bgcolor: 'rgba(0,0,0,0.06)', flex: 'none' }} />;
}

function RoomCard({
  room,
  filled,
  assignedSlotIdx,
}: {
  room: Room;
  filled: number;
  assignedSlotIdx: (slotIdx: number) => boolean;
}) {
  return (
    <Box
      sx={{
        bgcolor: 'white',
        border: '1px solid rgba(0,0,0,0.07)',
        borderRadius: '10px',
        p: 1.25,
        display: 'flex',
        flexDirection: 'column',
        gap: 0.6,
        height: '100%',
        minHeight: 0,
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ flex: 'none' }}>
        <Stack direction="row" alignItems="baseline" spacing={0.75} sx={{ minWidth: 0 }}>
          <Box
            sx={{
              fontSize: '0.85rem',
              fontWeight: 700,
              color: COLORS.text.strong,
              letterSpacing: '-0.01em',
            }}
          >
            {room.number}
          </Box>
          <Box
            sx={{
              fontSize: '0.625rem',
              color: COLORS.text.faint,
              fontWeight: 500,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              minWidth: 0,
            }}
          >
            {room.bedType}
          </Box>
        </Stack>
        <Box
          sx={{
            fontSize: '0.625rem',
            fontFamily: 'var(--mono), monospace',
            color: filled === room.capacity ? COLORS.accent.successText : COLORS.text.faint,
            fontVariantNumeric: 'tabular-nums',
            fontWeight: 600,
            transition: 'color 0.3s ease',
            flex: 'none',
          }}
        >
          {filled}/{room.capacity}
        </Box>
      </Stack>

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5,
        }}
      >
        {room.assignees.map((a, slotIdx) => (
          <Slot key={slotIdx} assignment={a} filled={assignedSlotIdx(slotIdx)} />
        ))}
      </Box>
    </Box>
  );
}

function Slot({ assignment, filled }: { assignment: Assignment; filled: boolean }) {
  const tone = SIDE_TONE[assignment.side];

  if (!filled) {
    return (
      <Box
        sx={{
          flex: 1,
          minHeight: 22,
          borderRadius: '5px',
          border: '1px dashed rgba(0,0,0,0.12)',
          bgcolor: 'rgba(0,0,0,0.015)',
        }}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      style={{ flex: 1, minHeight: 22, display: 'flex' }}
    >
      <Stack
        direction="row"
        spacing={0.6}
        alignItems="center"
        sx={{
          flex: 1,
          minWidth: 0,
          borderRadius: '5px',
          bgcolor: tone.bg,
          px: 0.75,
        }}
      >
        <Box
          sx={{
            width: 5,
            height: 5,
            borderRadius: '50%',
            bgcolor: tone.dot,
            flex: 'none',
          }}
        />
        <Box
          sx={{
            fontSize: '0.685rem',
            color: tone.fg,
            fontWeight: 600,
            minWidth: 0,
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
          }}
        >
          {assignment.name}
        </Box>
      </Stack>
    </motion.div>
  );
}

function PlacementSummary({
  progress,
  placed,
  total,
}: {
  progress: number;
  placed: number;
  total: number;
}) {
  const radius = 18;
  const stroke = 4;
  const c = 2 * Math.PI * radius;
  const pct = Math.round(progress * 100);
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Box sx={{ position: 'relative', width: 44, height: 44, flex: 'none' }}>
        <Box
          component="svg"
          viewBox="0 0 44 44"
          sx={{ width: 44, height: 44, transform: 'rotate(-90deg)' }}
        >
          <circle cx={22} cy={22} r={radius} fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth={stroke} />
          <circle
            cx={22}
            cy={22}
            r={radius}
            fill="none"
            stroke={COLORS.brand.primary}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - progress)}
            style={{ transition: 'stroke-dashoffset 0.06s linear' }}
          />
        </Box>
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.6rem',
            fontWeight: 700,
            color: COLORS.text.strong,
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '-0.01em',
          }}
        >
          {pct}%
        </Box>
      </Box>
      <Box>
        <Box
          sx={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: COLORS.text.strong,
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1.15,
          }}
        >
          {placed} / {total}
        </Box>
        <Box sx={{ fontSize: '0.625rem', color: COLORS.text.subtle, lineHeight: 1.2 }}>
          guests placed
        </Box>
      </Box>
    </Stack>
  );
}
