'use client';

/**
 * FeatureStepper Step 05 mock — "Shuttles, airport pickups, venue transfers."
 *
 * Deliberately formatted differently from Steps 01 & 04 (which are both
 * cascading-table layouts). This is a constellation: a Phera/WhatsApp hub
 * on the left with curved comms lines reaching out to a column of guest
 * nodes on the right, and a bottom strip of shuttle "stops". Animated
 * dashed strokes show the communication direction (outbound asks → inbound
 * replies → outbound dispatch). Once dispatch completes each guest's avatar
 * tints to its shuttle color and the bottom strip animates the per-shuttle
 * counts in.
 *
 * Loop (~13s):
 *   t=0       Phera node + 6 guest nodes fade in (no flight info yet)
 *   t=0.3s    OUTREACH — dashed lines flow Phera → guests, "What's your
 *             flight?" chip pulses near Phera
 *   t=2.0s    REPLIES — dash flow reverses; per-guest flight chips
 *             cascade in alongside their avatar
 *   t=4.4s    DISPATCH — Phera pulses again, lines morph to shuttle colors
 *             and re-flow Phera → guests
 *   t=5.6s    CONFIRMED — guest avatars gain a shuttle-color ring; bottom
 *             strip of 4 shuttle "stops" cascades in with counts tweening
 *   t=7.5s    full state held
 *   t=13.0s   restart
 */

import { useEffect, useState } from 'react';
import { Box, Stack } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { COLORS, FONTS } from '@/lib/theme/tokens';

type ShuttleId = 'A' | 'B' | 'C' | 'D';

interface Guest {
  initials: string;
  name: string;
  flight: string;
  shuttleId: ShuttleId;
}

const GUESTS: Guest[] = [
  { initials: 'AS', name: 'Aarav Sharma',  flight: 'UA 234 · 11:23 PM', shuttleId: 'A' },
  { initials: 'PS', name: 'Priya Sharma',  flight: 'UA 234 · 11:23 PM', shuttleId: 'A' },
  { initials: 'RM', name: 'Rohan Mehta',   flight: 'EK 504 · 10:50 PM', shuttleId: 'B' },
  { initials: 'DI', name: 'Diya Iyer',     flight: 'AI 142 · 8:30 PM',  shuttleId: 'C' },
  { initials: 'VK', name: 'Vihaan Kapoor', flight: 'BA 117 · 6:15 PM',  shuttleId: 'C' },
  { initials: 'AS', name: 'Anaya Shah',    flight: 'AA 51 · 5:40 PM',   shuttleId: 'D' },
];

interface Shuttle {
  id: ShuttleId;
  label: string;
  time: string;
  count: number;
  bg: string;
  fg: string;
  dot: string;
}

const SHUTTLES: Shuttle[] = [
  { id: 'D', label: 'Shuttle D', time: '6:00 PM',  count: 1, bg: 'rgba(212,175,55,0.16)', fg: '#8E6E15', dot: '#D4AF37' },
  { id: 'C', label: 'Shuttle C', time: '8:50 PM',  count: 2, bg: 'rgba(108,92,231,0.10)', fg: '#5347B5', dot: '#6C5CE7' },
  { id: 'B', label: 'Shuttle B', time: '11:15 PM', count: 1, bg: 'rgba(59,130,246,0.10)', fg: '#1E5BB8', dot: '#3B82F6' },
  { id: 'A', label: 'Shuttle A', time: '11:45 PM', count: 2, bg: 'rgba(222,63,94,0.10)',  fg: '#B33053', dot: '#DE3F5E' },
];

const SHUTTLE_BY_ID: Record<ShuttleId, Shuttle> = SHUTTLES.reduce(
  (acc, s) => ({ ...acc, [s.id]: s }),
  {} as Record<ShuttleId, Shuttle>,
);

const TOTAL_GUESTS = 28;
const LOOP_MS = 13000;

/** SVG canvas dimensions. Mock fills 100% so we use viewBox-based scaling.
 *  The SVG only covers the graph half — the chat bubbles live in HTML on
 *  the left and the lines visually originate from the chat-area's right
 *  edge (which is the SVG's left edge, x=0). */
const VB = { w: 360, h: 380 };
const PHERA = { x: 0, y: VB.h / 2 };
/** Right-column x for guest nodes. */
const GUEST_X = 260;

/** Guest y-positions evenly spread within the canvas. */
function guestY(i: number) {
  const top = 36;
  const bottom = VB.h - 36;
  const step = (bottom - top) / (GUESTS.length - 1);
  return top + step * i;
}

/** Curved bezier path from Phera to a guest node. */
function pathToGuest(i: number) {
  const y = guestY(i);
  const cx = (PHERA.x + GUEST_X) / 2;
  // gentle outward bow biased toward the canvas centerline
  const cy = (PHERA.y + y) / 2 - (y < PHERA.y ? -40 : 40);
  return `M ${PHERA.x} ${PHERA.y} Q ${cx} ${cy} ${GUEST_X - 16} ${y}`;
}

type Phase = 'idle' | 'init' | 'outreach' | 'replies' | 'dispatch' | 'confirmed';

export default function TransportationMock() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [replyStep, setReplyStep] = useState(0);
  const [shuttleStep, setShuttleStep] = useState(0);
  const [guestCounter, setGuestCounter] = useState(0);
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
      setReplyStep(0);
      setShuttleStep(0);
      setGuestCounter(0);
      setPhase('idle');
      setTick((t) => t + 1);

      after(50,   () => setPhase('init'));
      after(300,  () => setPhase('outreach'));
      after(2000, () => {
        setPhase('replies');
        tween(2000, (t) => setGuestCounter(Math.round(TOTAL_GUESTS * t)));
      });
      // Reply cascade — flight chip per guest fades in.
      GUESTS.forEach((_, i) => after(2000 + i * 220, () => setReplyStep(i + 1)));
      after(4400, () => setPhase('dispatch'));
      after(5600, () => setPhase('confirmed'));
      // Shuttle stops cascade in at the bottom.
      SHUTTLES.forEach((_, i) => after(5800 + i * 220, () => setShuttleStep(i + 1)));
      after(LOOP_MS, cycle);
    };

    cycle();
    return () => {
      cancelled = true;
      clearAll();
    };
  }, []);

  const linesActive =
    phase === 'outreach' ||
    phase === 'replies' ||
    phase === 'dispatch' ||
    phase === 'confirmed';
  const flowDirection: 'out' | 'in' | 'dispatch' | 'static' =
    phase === 'outreach'
      ? 'out'
      : phase === 'replies'
        ? 'in'
        : phase === 'dispatch'
          ? 'dispatch'
          : 'static';
  const lineKey = `lines-${tick}-${flowDirection}`;

  const ringedAvatars = phase === 'confirmed';

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
        gap: 1.75,
        overflow: 'hidden',
        fontFamily: FONTS.body,
        position: 'relative',
      }}
    >
      <Header
        guestCounter={guestCounter}
        phase={phase}
      />
      <Box sx={{ height: '1px', bgcolor: 'rgba(0,0,0,0.06)', flex: 'none' }} />

      {/* Main: WhatsApp chat (left) + constellation graph (right) */}
      <Box sx={{ flex: 1, display: 'flex', minHeight: 0, gap: 0 }}>
        <ChatColumn phase={phase} />
        <Box sx={{ flex: 1, position: 'relative', minHeight: 0 }}>
          <Box
            component="svg"
            viewBox={`0 0 ${VB.w} ${VB.h}`}
            preserveAspectRatio="xMidYMid meet"
            sx={{
              width: '100%',
              height: '100%',
              display: 'block',
            }}
          >
            {/* Curved comms lines */}
            {linesActive && (
              <g key={lineKey}>
                {GUESTS.map((g, i) => {
                  const tone = SHUTTLE_BY_ID[g.shuttleId];
                  const isShuttleColored = phase === 'dispatch' || phase === 'confirmed';
                  const stroke = isShuttleColored ? tone.dot : '#9aa1a8';
                  const animClass =
                    flowDirection === 'out'
                      ? 'tx-flow-out'
                      : flowDirection === 'in'
                        ? 'tx-flow-in'
                        : flowDirection === 'dispatch'
                          ? 'tx-flow-out'
                          : 'tx-static';
                  return (
                    <path
                      key={i}
                      d={pathToGuest(i)}
                      fill="none"
                      stroke={stroke}
                      strokeWidth={1.5}
                      strokeDasharray="3 6"
                      strokeOpacity={phase === 'confirmed' ? 0.35 : 0.85}
                      strokeLinecap="round"
                      className={animClass}
                    />
                  );
                })}
              </g>
            )}

            {/* Guest nodes */}
            {GUESTS.map((g, i) => {
              const tone = SHUTTLE_BY_ID[g.shuttleId];
              return (
                <GuestNode
                  key={i}
                  guest={g}
                  x={GUEST_X}
                  y={guestY(i)}
                  ring={ringedAvatars ? tone.dot : null}
                  showFlight={i < replyStep}
                  flightTone={
                    phase === 'dispatch' || phase === 'confirmed' ? tone : null
                  }
                />
              );
            })}
          </Box>
        </Box>
      </Box>

      {/* Bottom shuttle stops */}
      <Box
        sx={{
          flex: 'none',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 1,
          minHeight: 60,
        }}
      >
        <AnimatePresence mode="popLayout">
          {SHUTTLES.map((s, i) => {
            const visible = i < shuttleStep;
            return visible ? (
              <motion.div
                key={`${tick}-${s.id}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.32, ease: 'easeOut' }}
              >
                <ShuttleStop shuttle={s} />
              </motion.div>
            ) : (
              <Box key={`${tick}-${s.id}-empty`} />
            );
          })}
        </AnimatePresence>
      </Box>

      {/* Animation keyframes — flowing dashes for comms lines + typing dots. */}
      <style>{`
        @keyframes tx-flow-out  { to { stroke-dashoffset: -36; } }
        @keyframes tx-flow-in   { to { stroke-dashoffset:  36; } }
        .tx-flow-out  { animation: tx-flow-out  0.9s linear infinite; }
        .tx-flow-in   { animation: tx-flow-in   0.9s linear infinite; }
        .tx-static    { stroke-dashoffset: 0; }
        @keyframes tx-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50%      { transform: scale(1.4); opacity: 0.4; }
        }
        @keyframes tx-typing-dot {
          0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
          30%           { opacity: 1;   transform: translateY(-2px); }
        }
      `}</style>
    </Box>
  );
}

/* ──────────────── header ──────────────── */

function Header({ guestCounter, phase }: { guestCounter: number; phase: Phase }) {
  const status =
    phase === 'idle' || phase === 'init'
      ? 'Reaching out via WhatsApp...'
      : phase === 'outreach'
        ? 'Asking 28 guests for flight info'
        : phase === 'replies'
          ? `${guestCounter} of 28 replies in`
          : phase === 'dispatch'
            ? 'Dispatching shuttles...'
            : '5 shuttles dispatched · 28 guests confirmed';

  const isDone = phase === 'confirmed';
  return (
    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 'none' }}>
      <WhatsAppIcon />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
          <Box sx={{ fontSize: '0.875rem', fontWeight: 600, color: COLORS.text.strong }}>
            travel-coordination
          </Box>
          <Box
            sx={{
              fontSize: '0.75rem',
              color: COLORS.text.faint,
              fontFamily: 'var(--mono), monospace',
            }}
          >
            ·  28 guests
          </Box>
        </Stack>
        <Stack direction="row" spacing={0.75} alignItems="center">
          {isDone ? (
            <CheckBadge />
          ) : (
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                bgcolor: COLORS.brand.primary,
                flex: 'none',
                animation: 'tx-pulse 1.2s ease-in-out infinite',
              }}
            />
          )}
          <Box
            sx={{
              fontSize: '0.8rem',
              color: isDone ? COLORS.accent.successText : COLORS.text.muted,
              fontWeight: isDone ? 600 : 500,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {status}
          </Box>
        </Stack>
      </Box>
    </Stack>
  );
}

function WhatsAppIcon() {
  return (
    <Box
      sx={{
        width: 40,
        height: 48,
        borderRadius: '6px',
        bgcolor: '#25D366',
        position: 'relative',
        flex: 'none',
        boxShadow: '0 2px 6px rgba(37,211,102,0.28)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: 12,
          height: 12,
          bgcolor: '#1FA851',
          clipPath: 'polygon(0 0, 100% 100%, 100% 0)',
        }}
      />
      <Box
        component="svg"
        viewBox="0 0 24 24"
        sx={{ width: 22, height: 22, color: 'white', mt: '-4px' }}
      >
        <path
          fill="currentColor"
          d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.93.55 3.74 1.51 5.27L2 22l4.96-1.62c1.45.79 3.11 1.24 4.88 1.24 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.86 9.86 0 0 0 12.04 2zm5.79 14.13c-.24.69-1.4 1.32-1.96 1.4-.5.07-1.13.1-1.83-.12-.42-.13-.96-.31-1.66-.61-2.92-1.26-4.83-4.21-4.97-4.4-.15-.19-1.19-1.59-1.19-3.04 0-1.45.76-2.16 1.03-2.46.27-.3.59-.37.79-.37l.57.01c.18.01.43-.07.66.5.24.59.84 2.04.91 2.18.07.14.12.31.02.51-.1.19-.15.31-.3.48-.15.17-.31.37-.45.5-.15.15-.3.31-.13.61.17.3.76 1.25 1.62 2.02 1.11.99 2.04 1.29 2.34 1.44.3.15.47.13.65-.07.18-.21.74-.86.94-1.16.2-.3.4-.25.66-.15.27.1 1.69.8 1.98.94.29.15.49.22.56.34.07.13.07.74-.17 1.43z"
        />
      </Box>
    </Box>
  );
}

function CheckBadge() {
  return (
    <Box
      sx={{
        width: 16,
        height: 16,
        borderRadius: '50%',
        bgcolor: COLORS.accent.success,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 'none',
      }}
    >
      <Box component="svg" viewBox="0 0 16 16" sx={{ width: 10, height: 10 }}>
        <path d="M3 8.5l3 3 7-7" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </Box>
    </Box>
  );
}

/* ──────────────── SVG nodes ──────────────── */

/* ──────────────── chat column ──────────────── */

const OUTREACH_TEXT = "Hi! What's your flight info coming in for Priya & Aarav's wedding? ✈️";
const REPLY_TEXT = 'UA 234 — lands 11:23 PM at JFK';
const DISPATCH_TEXT = "You're on Shuttle A · 11:45 PM 🚐";

function ChatColumn({ phase }: { phase: Phase }) {
  const showOutreach = phase !== 'idle' && phase !== 'init';
  const showReply = phase === 'replies' || phase === 'dispatch' || phase === 'confirmed';
  const isDispatch = phase === 'dispatch' || phase === 'confirmed';
  const showDispatchMsg = isDispatch;
  const showTyping = phase === 'outreach';

  return (
    <Box
      sx={{
        flex: '0 0 38%',
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 0.75,
        pr: 1.5,
      }}
    >
      <AnimatePresence initial={false}>
        {showOutreach && (
          <motion.div
            key="outreach"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.32, ease: 'easeOut' }}
          >
            <OutgoingBubble text={OUTREACH_TEXT} time="10:42 AM" />
          </motion.div>
        )}
        {showReply && (
          <motion.div
            key="reply"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.32, delay: 0.12, ease: 'easeOut' }}
          >
            <IncomingBubble text={REPLY_TEXT} time="10:43 AM" />
          </motion.div>
        )}
        {showDispatchMsg && (
          <motion.div
            key="dispatch"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.32, ease: 'easeOut' }}
          >
            <OutgoingBubble text={DISPATCH_TEXT} time="11:02 AM" />
          </motion.div>
        )}
        {showTyping && (
          <motion.div
            key="typing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ alignSelf: 'flex-start' }}
          >
            <TypingBubble />
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
}

function OutgoingBubble({ text, time }: { text: string; time: string }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
      <Box
        sx={{
          position: 'relative',
          maxWidth: '92%',
          bgcolor: '#DCF8C6',
          color: '#1a1a1a',
          borderRadius: '8px',
          borderTopRightRadius: '2px',
          px: 1,
          py: 0.6,
          fontSize: '0.7rem',
          lineHeight: 1.35,
          boxShadow: '0 1px 1px rgba(0,0,0,0.06)',
        }}
      >
        {text}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 0.4,
            mt: 0.25,
            fontSize: '0.55rem',
            color: 'rgba(0,0,0,0.45)',
          }}
        >
          {time}
          <Box
            component="svg"
            viewBox="0 0 16 11"
            sx={{ width: 12, height: 9, color: '#34B7F1' }}
          >
            <path
              fill="currentColor"
              d="M11.07.61L4.66 7.02 1.94 4.3l-.71.7L4.66 8.43 11.78 1.32zM15.07.61L8.66 7.02 7.4 5.76l-.71.71 1.97 1.97L15.78 1.32z"
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

function IncomingBubble({ text, time }: { text: string; time: string }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
      <Box
        sx={{
          position: 'relative',
          maxWidth: '92%',
          bgcolor: 'white',
          color: '#1a1a1a',
          borderRadius: '8px',
          borderTopLeftRadius: '2px',
          border: '1px solid rgba(0,0,0,0.06)',
          px: 1,
          py: 0.6,
          fontSize: '0.7rem',
          lineHeight: 1.35,
          boxShadow: '0 1px 1px rgba(0,0,0,0.06)',
        }}
      >
        {text}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            mt: 0.25,
            fontSize: '0.55rem',
            color: 'rgba(0,0,0,0.45)',
          }}
        >
          {time}
        </Box>
      </Box>
    </Box>
  );
}

function TypingBubble() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
      <Box
        sx={{
          bgcolor: 'white',
          border: '1px solid rgba(0,0,0,0.06)',
          borderRadius: '8px',
          borderTopLeftRadius: '2px',
          px: 1,
          py: 0.5,
          display: 'flex',
          gap: 0.4,
          alignItems: 'center',
          boxShadow: '0 1px 1px rgba(0,0,0,0.06)',
        }}
      >
        {[0, 1, 2].map((i) => (
          <Box
            key={i}
            sx={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              bgcolor: '#90949c',
              animation: `tx-typing-dot 1.2s ${i * 0.18}s ease-in-out infinite`,
            }}
          />
        ))}
      </Box>
    </Box>
  );
}

function GuestNode({
  guest,
  x,
  y,
  ring,
  showFlight,
  flightTone,
}: {
  guest: Guest;
  x: number;
  y: number;
  ring: string | null;
  showFlight: boolean;
  flightTone: Shuttle | null;
}) {
  const r = 14;
  return (
    <g>
      {/* Ring (set when confirmed) */}
      {ring && (
        <circle cx={x} cy={y} r={r + 3} fill="none" stroke={ring} strokeWidth={2} />
      )}
      {/* Avatar */}
      <circle cx={x} cy={y} r={r} fill="rgba(222,63,94,0.10)" stroke="rgba(0,0,0,0.05)" strokeWidth={1} />
      <text
        x={x}
        y={y + 3.5}
        textAnchor="middle"
        fontSize={9}
        fontWeight={700}
        fill={COLORS.brand.primary}
      >
        {guest.initials}
      </text>
      {/* Name + flight chip to the right of avatar */}
      <text
        x={x + r + 7}
        y={y - 2}
        fontSize={11}
        fontWeight={500}
        fill={COLORS.text.strong}
      >
        {guest.name}
      </text>
      {showFlight && (
        <FlightChip
          x={x + r + 7}
          y={y + 5}
          text={guest.flight}
          tone={flightTone}
        />
      )}
    </g>
  );
}

function FlightChip({
  x,
  y,
  text,
  tone,
}: {
  x: number;
  y: number;
  text: string;
  tone: Shuttle | null;
}) {
  const fg = tone ? tone.fg : COLORS.text.muted;
  return (
    <text
      x={x}
      y={y + 7}
      fontSize={9.5}
      fill={fg}
      fontFamily="var(--mono), monospace"
      style={{ fontVariantNumeric: 'tabular-nums' }}
    >
      {text}
    </text>
  );
}

/* ──────────────── bottom shuttle stops ──────────────── */

function ShuttleStop({ shuttle }: { shuttle: Shuttle }) {
  return (
    <Box
      sx={{
        bgcolor: shuttle.bg,
        border: `1px solid ${shuttle.dot}33`,
        borderRadius: '8px',
        px: 1,
        py: 0.75,
        display: 'flex',
        flexDirection: 'column',
        gap: 0.25,
        minHeight: 48,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={0.5}>
        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: shuttle.dot }} />
        <Box sx={{ fontSize: '0.7rem', fontWeight: 700, color: shuttle.fg, letterSpacing: '0.04em' }}>
          {shuttle.label}
        </Box>
      </Stack>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Box sx={{ fontSize: '0.65rem', color: shuttle.fg, opacity: 0.85, fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--mono), monospace' }}>
          {shuttle.time}
        </Box>
        <Box sx={{ fontSize: '0.65rem', color: shuttle.fg, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
          {shuttle.count} guests
        </Box>
      </Box>
    </Box>
  );
}
