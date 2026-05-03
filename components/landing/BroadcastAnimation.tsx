'use client';

import { Avatar, Box, Stack, Typography, Button } from '@mui/material';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded';
import VerifiedIcon from '@mui/icons-material/Verified';
import StreamlineIcon, { type StreamlineIconName } from '@/components/ui/StreamlineIcon';
import { generateAvatar } from '@/lib/utils/avatar-generator';
import { COLORS, FONTS, RADII } from '@/lib/theme/tokens';

const WHATSAPP_BG = '/images/backgrounds/whatsapp-chat-doodles.webp';
const WHATSAPP_HEADER_BG = '#202C33';
const WHATSAPP_BUBBLE_BG = '#FFFFFF';
const WHATSAPP_AUTO_BUBBLE_BG = '#F3F0EA';

/**
 * BroadcastAnimation
 * --------------------------------------------------------------
 * Multi-phase landing-page scene. Admin sends broadcasts, guests
 * reply with structured data - RSVP → Dietary → Travel.
 *
 * Phase timeline (seconds):
 *   P0 RSVP     0.0 → 4.7   (cursor + press, green + purple packets)
 *   P1 Dietary  5.0 → 8.7   (auto-fire, title morphs, new packets)
 *   P2 Travel   9.0 → 12.7  (auto-fire, title morphs, new packets)
 *   Rest       12.7+        (replay active)
 */

const VIEWBOX_W = 1000;
const VIEWBOX_H = 700;

const ADMIN_ANCHOR = { x: 368, y: 350 }; // right edge of admin panel mid-height
const CARD_ANCHOR_X = 628; // left edge of card column

// Card layout in viewBox space - cards are absolutely positioned at cardY(i)
// (their vertical centers) so the SVG curve endpoints line up exactly.
const CARD_TOP_Y = 60;
const CARD_BOTTOM_Y = 640;

// ─── Types ──────────────────────────────────────────────────────────

type Rsvp = 'attending' | 'declined';
type Diet = 'Veg' | 'Jain' | 'Non-veg' | 'Vegan';
type Travel =
  | { mode: 'flight';  label: string }
  | { mode: 'arrival'; label: string }
  | { mode: 'local';   label: string };

interface Guest {
  name: string;
  side: 'bride' | 'groom' | 'both';
  rsvp: Rsvp;
  diet?: Diet;
  travel?: Travel;
}

type PhaseKey = 'rsvp' | 'diet' | 'travel';

interface Pill {
  label: string;
  bg: string;
  color: string;
  border: string;
  icon?: StreamlineIconName;
}

// ─── Data ───────────────────────────────────────────────────────────

const GUESTS: Guest[] = [
  { name: 'Priya Mehta',  side: 'bride', rsvp: 'attending', diet: 'Jain',    travel: { mode: 'flight', label: 'DEL → UDR · Mar 7' } },
  { name: 'Arjun Kapoor', side: 'groom', rsvp: 'attending', diet: 'Non-veg', travel: { mode: 'flight', label: 'BOM → UDR · Mar 7' } },
  { name: 'Rohan Sharma', side: 'groom', rsvp: 'declined' },
  { name: 'Kavita Reddy', side: 'bride', rsvp: 'attending', diet: 'Veg',     travel: { mode: 'arrival', label: 'Arriving 6 Mar · 4:20 PM' } },
  { name: 'Aditya Gupta', side: 'both',  rsvp: 'attending', diet: 'Vegan',   travel: { mode: 'flight', label: 'JFK → DEL · Mar 5' } },
  { name: 'Meera Nair',   side: 'bride', rsvp: 'attending', diet: 'Veg',     travel: { mode: 'local', label: 'Local · already here' } },
];

// Phase config (timing is computed, not stored - see scheduler below)
const PHASES: {
  key: PhaseKey;
  title: string;
  body: string;
  chips: string[];
  icon: StreamlineIconName;
}[] = [
  {
    key: 'rsvp',
    title: 'Sangeet - Save the Date',
    body: 'Hi {first_name} 👋 Priya & Rahul are getting married! Sangeet is Fri 7 Mar in Udaipur. View the website or tap below to RSVP.',
    chips: ['Attending', 'Maybe', 'Can’t make it'],
    icon: 'megaphone',
  },
  {
    key: 'diet',
    title: 'Dietary preferences',
    body: 'Quick one - any dietary needs for the Sangeet dinner? Tap what applies.',
    chips: ['Veg', 'Jain', 'Non-veg', 'Vegan'],
    icon: 'chef-hat',
  },
  {
    key: 'travel',
    title: 'Travel details',
    body: 'Share your arrival - flight, arrival time, or already in town - so we can arrange pickup.',
    chips: ['Flight', 'Arrival time', 'Local'],
    icon: 'buildings',
  },
];

// ─── Timing (seconds) ───────────────────────────────────────────────

const T = {
  trigger: 0.9,            // cursor glide + press (only phase 0)
  outStagger: 0.18,
  packet: 0.9,
  replyStart: 1.4,         // relative to each phase start
  replyStagger: 0.25,
  phaseGap: 0.5,           // quiet beat between phases
  phaseFlip: 0.3,          // title morph
};

const phaseStartTimes = (() => {
  const starts: number[] = [];
  let t = 0;
  for (let p = 0; p < PHASES.length; p++) {
    starts.push(t);
    // phase 0 has the cursor; later phases skip the trigger beat
    const trigger = p === 0 ? T.trigger : 0.2;
    const scene =
      trigger +
      T.replyStart +
      (GUESTS.length - 1) * T.replyStagger +
      T.packet;
    t += scene + T.phaseGap;
  }
  return starts;
})();

// ─── Geometry ───────────────────────────────────────────────────────

const cardY = (i: number) =>
  CARD_TOP_Y + (i * (CARD_BOTTOM_Y - CARD_TOP_Y)) / (GUESTS.length - 1);

const pathFor = (i: number) => {
  const cy = cardY(i);
  const midX = (ADMIN_ANCHOR.x + CARD_ANCHOR_X) / 2;
  return `M ${ADMIN_ANCHOR.x} ${ADMIN_ANCHOR.y} C ${midX} ${ADMIN_ANCHOR.y}, ${midX} ${cy}, ${CARD_ANCHOR_X} ${cy}`;
};

// ─── Helpers ────────────────────────────────────────────────────────

const sideColor = (side: Guest['side']) =>
  side === 'bride' ? COLORS.side.bride : side === 'groom' ? COLORS.side.groom : COLORS.side.both;

const pillWaiting: Pill = {
  label: 'Queued',
  bg: COLORS.bg.muted,
  color: COLORS.text.subtle,
  border: COLORS.border.light,
};

const pillDelivered: Pill = {
  label: 'Delivered',
  bg: COLORS.accent.infoBg,
  color: COLORS.accent.infoText,
  border: COLORS.accent.infoBg,
};

function pillForReply(phase: PhaseKey, guest: Guest): Pill {
  if (phase === 'rsvp') {
    return guest.rsvp === 'attending'
      ? {
          label: '✓ Attending',
          bg: COLORS.accent.successBg,
          color: COLORS.accent.successText,
          border: COLORS.accent.successBg,
        }
      : {
          label: 'Declined',
          bg: COLORS.accent.dangerBg,
          color: COLORS.accent.dangerText,
          border: COLORS.accent.dangerBg,
        };
  }
  if (phase === 'diet') {
    return {
      label: guest.diet ?? 'Veg',
      bg: COLORS.brand.primarySubtle,
      color: COLORS.brand.primary,
      border: COLORS.brand.primarySubtle,
      icon: 'chef-hat',
    };
  }
  // travel
  const t = guest.travel!;
  const icon: StreamlineIconName =
    t.mode === 'flight' ? 'plane-takeoff' : t.mode === 'arrival' ? 'calendar-check' : 'map-pin';
  return {
    label: t.label,
    bg: COLORS.accent.infoBg,
    color: COLORS.accent.infoText,
    border: COLORS.accent.infoBg,
    icon,
  };
}

// Declined guests don't get follow-up phases
const participates = (g: Guest, phase: PhaseKey) =>
  phase === 'rsvp' ? true : g.rsvp === 'attending';

// ─── Stats per phase ────────────────────────────────────────────────

interface StatTrio {
  a: { label: string; value: number; color: string };
  b: { label: string; value: number; color: string };
  c: { label: string; value: number; color: string };
}

const STATS_TARGETS: Record<PhaseKey, StatTrio> = {
  rsvp: {
    a: { label: 'Sent',  value: 312, color: COLORS.text.strong },
    b: { label: 'Yes',   value: 287, color: COLORS.accent.success },
    c: { label: 'No',    value: 25,  color: COLORS.accent.danger },
  },
  diet: {
    a: { label: 'Replies', value: 281, color: COLORS.text.strong },
    b: { label: 'Veg',     value: 164, color: COLORS.accent.success },
    c: { label: 'Jain',    value: 32,  color: COLORS.brand.primary },
  },
  travel: {
    a: { label: 'Replies',  value: 275, color: COLORS.text.strong },
    b: { label: 'Flights',  value: 198, color: COLORS.accent.info },
    c: { label: 'Arrivals', value: 77,  color: COLORS.brand.primary },
  },
};

// ─── Component ──────────────────────────────────────────────────────

type CursorPhase = 'hidden' | 'glide' | 'press' | 'gone';

export default function BroadcastAnimation() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inView = useInView(containerRef, { once: true, amount: 0.4 });
  const [runId, setRunId] = useState(0);

  const [activePhaseIdx, setActivePhaseIdx] = useState(0);
  const [pills, setPills] = useState<Pill[]>(() => GUESTS.map(() => pillWaiting));
  const [stats, setStats] = useState<StatTrio>(STATS_TARGETS.rsvp);
  const [animatedStats, setAnimatedStats] = useState({ a: 0, b: 0, c: 0 });
  const [cursor, setCursor] = useState<CursorPhase>('hidden');
  const [bump, setBump] = useState<Record<number, boolean>>({});
  const [broadcastFired, setBroadcastFired] = useState(false);
  // Track which phase+guest packet pair is live so they only mount during their window
  const [liveWindow, setLiveWindow] = useState<{ phaseIdx: number; show: boolean }[]>(
    PHASES.map((_, i) => ({ phaseIdx: i, show: false }))
  );

  // Precompute deterministic DiceBear `shapes` avatars per guest (seeded by name).
  const avatars = useMemo(
    () => GUESTS.map((g) => generateAvatar({ seed: g.name, style: 'shapes', size: 64 }).dataUri),
    []
  );

  useEffect(() => {
    if (!inView) return;

    const timers: ReturnType<typeof setTimeout>[] = [];
    const schedule = (ms: number, fn: () => void) => {
      timers.push(setTimeout(fn, ms));
    };

    // Reset
    setActivePhaseIdx(0);
    setPills(GUESTS.map(() => pillWaiting));
    setStats(STATS_TARGETS.rsvp);
    setAnimatedStats({ a: 0, b: 0, c: 0 });
    setCursor('hidden');
    setBump({});
    setBroadcastFired(false);
    setLiveWindow(PHASES.map((_, i) => ({ phaseIdx: i, show: false })));

    PHASES.forEach((phase, pIdx) => {
      const phaseStart = phaseStartTimes[pIdx] * 1000;
      const trigger = pIdx === 0 ? T.trigger : 0.2;

      // Title flip
      schedule(phaseStart, () => {
        setActivePhaseIdx(pIdx);
        setStats(STATS_TARGETS[phase.key]);
        setAnimatedStats({ a: 0, b: 0, c: 0 });
      });

      // Reset pills for this phase. Declined guests keep their declined pill.
      if (pIdx > 0) {
        schedule(phaseStart + T.phaseFlip * 1000, () => {
          setPills((prev) =>
            prev.map((p, i) => (GUESTS[i].rsvp === 'declined' ? p : pillWaiting))
          );
        });
      }

      // Mount packets for this phase window
      schedule(phaseStart + trigger * 1000 - 50, () => {
        setLiveWindow((prev) => prev.map((w, i) => (i === pIdx ? { ...w, show: true } : w)));
      });

      // Cursor only phase 0
      if (pIdx === 0) {
        schedule(phaseStart + 60, () => setCursor('glide'));
        schedule(phaseStart + 700, () => setCursor('press'));
        schedule(phaseStart + T.trigger * 1000, () => {
          setCursor('gone');
          setBroadcastFired(true);
        });
      }

      // Stats tick - animate each stat from 0 → target
      const statsAnimStart = phaseStart + (trigger + 0.05) * 1000;
      const statsDur = 2200;
      const tickMs = 40;
      const steps = Math.floor(statsDur / tickMs);
      for (let s = 1; s <= steps; s++) {
        schedule(statsAnimStart + s * tickMs, () => {
          setAnimatedStats({
            a: Math.round((s / steps) * STATS_TARGETS[phase.key].a.value),
            b: Math.round((s / steps) * STATS_TARGETS[phase.key].b.value),
            c: Math.round((s / steps) * STATS_TARGETS[phase.key].c.value),
          });
        });
      }

      // Outgoing packet arrivals → pill = delivered + bump
      const participants = GUESTS.map((_, i) => i).filter((i) => participates(GUESTS[i], phase.key));
      participants.forEach((guestIdx, order) => {
        const arriveMs =
          phaseStart + (trigger + order * T.outStagger + T.packet) * 1000;
        schedule(arriveMs, () => {
          setPills((prev) => {
            const next = [...prev];
            next[guestIdx] = pillDelivered;
            return next;
          });
          setBump((prev) => ({ ...prev, [guestIdx]: true }));
          schedule(250, () => setBump((prev) => ({ ...prev, [guestIdx]: false })));
        });
      });

      // Reply packet arrivals → pill = phase-specific answer
      participants.forEach((guestIdx, order) => {
        const arriveMs =
          phaseStart + (trigger + T.replyStart + order * T.replyStagger + T.packet) * 1000;
        schedule(arriveMs, () => {
          setPills((prev) => {
            const next = [...prev];
            next[guestIdx] = pillForReply(phase.key, GUESTS[guestIdx]);
            return next;
          });
        });
      });
    });

    return () => timers.forEach(clearTimeout);
  }, [inView, runId]);

  const handleReplay = () => setRunId((r) => r + 1);

  const activePhase = PHASES[activePhaseIdx];

  return (
    <Box ref={containerRef} sx={{ width: '100%' }}>
      {/* ─── Desktop (≥ md) ───────────────────────────────────────── */}
      <Box
        sx={{
          display: { xs: 'none', md: 'block' },
          position: 'relative',
          width: '100%',
          borderRadius: RADII.xl,
          bgcolor: COLORS.bg.subtle,
          border: `1px solid ${COLORS.border.light}`,
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.05)',
        }}
      >
      <Box sx={{ position: 'relative', width: '100%', aspectRatio: `${VIEWBOX_W} / ${VIEWBOX_H}` }}>
        {/* SVG layer - curves + packets */}
        <svg
          viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          aria-hidden
        >
          {/* Dotted paths */}
          {GUESTS.map((_, i) => (
            <motion.path
              key={`path-${i}`}
              d={pathFor(i)}
              fill="none"
              stroke={COLORS.border.default}
              strokeWidth={1.5}
              strokeDasharray="3 5"
              strokeLinecap="round"
              initial={{ opacity: 0 }}
              animate={{ opacity: inView ? 0.55 : 0 }}
              transition={{ duration: 0.4, delay: T.trigger }}
            />
          ))}

          {/* Packets per phase */}
          {inView &&
            PHASES.map((phase, pIdx) => {
              if (!liveWindow[pIdx]?.show) return null;
              const phaseStart = phaseStartTimes[pIdx];
              const trigger = pIdx === 0 ? T.trigger : 0.2;
              const participants = GUESTS
                .map((g, i) => ({ g, i }))
                .filter(({ g }) => participates(g, phase.key));

              return (
                <g key={`phase-${pIdx}-${runId}`}>
                  {participants.map(({ i }, order) => (
                    <motion.circle
                      key={`out-${pIdx}-${runId}-${i}`}
                      r={5}
                      fill={COLORS.accent.success}
                      style={{ offsetPath: `path("${pathFor(i)}")`, offsetRotate: '0deg' }}
                      initial={{ offsetDistance: '0%', opacity: 0 }}
                      animate={{
                        offsetDistance: ['0%', '100%'],
                        opacity: [0, 1, 1, 0],
                      }}
                      transition={{
                        duration: T.packet,
                        delay: phaseStart + trigger + order * T.outStagger,
                        ease: 'easeInOut',
                        times: [0, 0.1, 0.9, 1],
                      }}
                    />
                  ))}
                  {participants.map(({ i }, order) => (
                    <motion.circle
                      key={`rep-${pIdx}-${runId}-${i}`}
                      r={5}
                      fill={COLORS.cultural.purple}
                      style={{ offsetPath: `path("${pathFor(i)}")`, offsetRotate: '0deg' }}
                      initial={{ offsetDistance: '100%', opacity: 0 }}
                      animate={{
                        offsetDistance: ['100%', '0%'],
                        opacity: [0, 1, 1, 0],
                      }}
                      transition={{
                        duration: T.packet,
                        delay: phaseStart + trigger + T.replyStart + order * T.replyStagger,
                        ease: 'easeInOut',
                        times: [0, 0.1, 0.9, 1],
                      }}
                    />
                  ))}
                </g>
              );
            })}
        </svg>

        {/* Chat panel (left) - styled like a WhatsApp conversation. */}
        <Box
          sx={{
            position: 'absolute',
            top: '5%',
            left: '2.4%',
            width: '34.5%',
            height: '90%',
            bgcolor: COLORS.bg.white,
            borderRadius: RADII.lg,
            border: `1px solid ${COLORS.border.light}`,
            boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* WhatsApp-style header */}
          <Box
            sx={{
              bgcolor: WHATSAPP_HEADER_BG,
              color: 'white',
              px: { xs: 1, md: 1.5 },
              py: { xs: 0.85, md: 1.1 },
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              flexShrink: 0,
            }}
          >
            <Avatar
              src="/Phera Logomark.jpg"
              alt="Phera"
              sx={{ width: { xs: 28, md: 34 }, height: { xs: 28, md: 34 } }}
            />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Typography
                  sx={{
                    fontFamily: FONTS.body,
                    fontWeight: 600,
                    fontSize: { xs: '0.78rem', md: '0.9rem' },
                    color: 'white',
                    lineHeight: 1.2,
                  }}
                >
                  Phera
                </Typography>
                <VerifiedIcon
                  sx={{ fontSize: { xs: 12, md: 14 }, color: '#2979FF' }}
                />
              </Stack>
              <Typography
                sx={{
                  fontFamily: FONTS.body,
                  fontSize: { xs: '0.6rem', md: '0.68rem' },
                  color: 'rgba(255,255,255,0.7)',
                  lineHeight: 1.2,
                }}
              >
                broadcast bot · online
              </Typography>
            </Box>
          </Box>

          {/* Chat body - WhatsApp doodle background */}
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              bgcolor: '#EFE7DE',
              backgroundImage: `url("${WHATSAPP_BG}")`,
              backgroundSize: 'cover',
              backgroundRepeat: 'repeat',
              p: { xs: 1.25, md: 1.75 },
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Phase chip - small, sits above the bubble like a date separator */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`head-${activePhaseIdx}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: T.phaseFlip }}
                style={{ alignSelf: 'center', marginBottom: 8 }}
              >
                <Stack
                  direction="row"
                  spacing={0.6}
                  alignItems="center"
                  sx={{
                    px: 1,
                    py: 0.3,
                    borderRadius: RADII.pill,
                    bgcolor: 'rgba(255,255,255,0.85)',
                    border: `1px solid ${COLORS.border.faint}`,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                  }}
                >
                  <StreamlineIcon
                    name={activePhase.icon}
                    sx={{
                      color: COLORS.brand.primary,
                      width: { xs: 11, md: 13 },
                      height: { xs: 11, md: 13 },
                    }}
                  />
                  <Typography
                    sx={{
                      fontFamily: FONTS.body,
                      fontWeight: 600,
                      fontSize: { xs: '0.6rem', md: '0.7rem' },
                      color: COLORS.text.strong,
                      letterSpacing: '0.02em',
                    }}
                  >
                    {activePhase.title}
                  </Typography>
                </Stack>
              </motion.div>
            </AnimatePresence>

            <AnimatePresence mode="wait">
              <motion.div
                key={`body-${activePhaseIdx}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: T.phaseFlip }}
              >
                {activePhaseIdx > 0 && <AutoReplyBadge />}

                <ChatBubble isAuto={activePhaseIdx > 0}>
                  <Typography
                    sx={{
                      fontFamily: FONTS.body,
                      color: COLORS.text.strong,
                      fontSize: { xs: '0.72rem', md: '0.82rem' },
                      lineHeight: 1.55,
                    }}
                  >
                    {activePhase.body}
                  </Typography>

                  {activePhaseIdx === 0 && <WebsitePreviewCard />}

                  <Stack
                    direction="row"
                    spacing={0.75}
                    sx={{ mt: 1.25, flexWrap: 'wrap', gap: 0.75 }}
                  >
                    {activePhase.chips.map((t) => (
                      <Box
                        key={t}
                        sx={{
                          px: 1,
                          py: 0.25,
                          borderRadius: RADII.pill,
                          bgcolor: 'rgba(0, 0, 0, 0.04)',
                          border: `1px solid ${COLORS.border.faint}`,
                          fontFamily: FONTS.body,
                          fontSize: { xs: '0.6rem', md: '0.7rem' },
                          color: COLORS.text.strong,
                        }}
                      >
                        {t}
                      </Box>
                    ))}
                  </Stack>
                </ChatBubble>
              </motion.div>
            </AnimatePresence>
          </Box>

          {/* Stats + button - admin controls below the chat preview. */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              p: { xs: 1.25, md: 1.5 },
              bgcolor: COLORS.bg.white,
              borderTop: `1px solid ${COLORS.border.faint}`,
              flexShrink: 0,
            }}
          >
            <Stack
              direction="row"
              spacing={1}
              sx={{
                flex: broadcastFired ? 1 : '0 0 auto',
                alignItems: 'stretch',
              }}
            >
              <StatPill
                label={stats.a.label}
                value={animatedStats.a}
                color={stats.a.color}
                expanded={broadcastFired}
              />
              <StatPill
                label={stats.b.label}
                value={animatedStats.b}
                color={stats.b.color}
                expanded={broadcastFired}
              />
              <StatPill
                label={stats.c.label}
                value={animatedStats.c}
                color={stats.c.color}
                expanded={broadcastFired}
              />
            </Stack>

            {/* Send button - removed entirely after fire so stats absorb the space. */}
            <Box sx={{ position: 'relative' }}>
              <AnimatePresence mode="wait">
                {!broadcastFired && (
                  <motion.div
                    key="broadcast-btn"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.92 }}
                    transition={{ duration: 0.35, ease: 'easeInOut' }}
                    style={{ display: 'block' }}
                  >
                    <motion.div
                      animate={{ scale: cursor === 'press' ? 0.96 : 1 }}
                      transition={{ duration: 0.14 }}
                    >
                      <Box
                        sx={{
                          width: '100%',
                          py: { xs: 0.9, md: 1.2 },
                          borderRadius: RADII.md,
                          bgcolor:
                            cursor === 'press'
                              ? COLORS.brand.primaryHover
                              : COLORS.brand.primary,
                          color: COLORS.text.inverse,
                          fontFamily: FONTS.body,
                          fontWeight: 600,
                          fontSize: { xs: '0.78rem', md: '0.9rem' },
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 0.75,
                          transition: 'background-color 140ms ease',
                        }}
                      >
                        <StreamlineIcon
                          name="check-circle"
                          sx={{
                            width: { xs: 14, md: 16 },
                            height: { xs: 14, md: 16 },
                            color: 'inherit',
                          }}
                        />
                        Broadcast to 312 guests
                      </Box>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
              {cursor !== 'hidden' && cursor !== 'gone' && (
                <motion.div
                  key={`cursor-${runId}`}
                  initial={{ top: -70, left: -70, opacity: 0 }}
                  animate={{
                    top: cursor === 'glide' || cursor === 'press' ? '50%' : -70,
                    left: cursor === 'glide' || cursor === 'press' ? '50%' : -70,
                    opacity: 1,
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.7, ease: 'easeInOut' }}
                  style={{
                    position: 'absolute',
                    width: 22,
                    height: 22,
                    transform: 'translate(-50%, -50%)',
                    pointerEvents: 'none',
                  }}
                >
                  <svg viewBox="0 0 24 24" width={22} height={22}>
                    <path
                      d="M4 2 L4 18 L8.5 13.5 L11 20 L14 18.5 L11.5 12 L18 12 Z"
                      fill={COLORS.text.strong}
                      stroke={COLORS.bg.white}
                      strokeWidth={1.2}
                      strokeLinejoin="round"
                    />
                  </svg>
                </motion.div>
              )}
            </AnimatePresence>
            </Box>
          </Box>
        </Box>

        {/* Guest cards overlay (right). Each card is absolutely positioned at
            its cardY(i) so the SVG curve endpoints from the chat panel land
            exactly on the card center. */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            right: '2.4%',
            width: '35%',
            height: '100%',
          }}
        >
          {GUESTS.map((g, i) => (
            <Box
              key={`card-${i}`}
              sx={{
                position: 'absolute',
                top: `${(cardY(i) / VIEWBOX_H) * 100}%`,
                left: 0,
                right: 0,
                transform: 'translateY(-50%)',
              }}
            >
              <GuestCardRow
                guest={g}
                pill={pills[i]}
                bumped={!!bump[i]}
                avatarUri={avatars[i]}
              />
            </Box>
          ))}
        </Box>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          px: { xs: 2, md: 3 },
          py: { xs: 1.25, md: 1.75 },
          borderTop: `1px solid ${COLORS.border.faint}`,
          bgcolor: COLORS.bg.white,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
        }}
      >
        <Typography
          variant="caption"
          sx={{ color: COLORS.text.subtle, fontFamily: FONTS.body, fontSize: { xs: '0.7rem', md: '0.78rem' } }}
        >
          RSVP · dietary · travel - collected and structured, automatically.
        </Typography>
        <Button
          onClick={handleReplay}
          size="small"
          startIcon={<ReplayRoundedIcon sx={{ fontSize: 16 }} />}
          sx={{
            textTransform: 'none',
            fontFamily: FONTS.body,
            fontWeight: 600,
            color: COLORS.brand.primary,
            borderRadius: RADII.md,
            fontSize: { xs: '0.75rem', md: '0.85rem' },
            '&:hover': { bgcolor: COLORS.brand.primarySubtle },
          }}
        >
          Replay
        </Button>
      </Box>
      </Box>

      {/* ─── Mobile (< md) ────────────────────────────────────────── */}
      <Box
        sx={{
          display: { xs: 'flex', md: 'none' },
          flexDirection: 'column',
          width: '100%',
          borderRadius: RADII.lg,
          bgcolor: COLORS.bg.subtle,
          border: `1px solid ${COLORS.border.light}`,
          overflow: 'hidden',
          boxShadow: '0 12px 32px rgba(0,0,0,0.08)',
        }}
      >
        {/* Admin broadcast card */}
        <Box sx={{ bgcolor: COLORS.bg.white, p: 2, borderBottom: `1px solid ${COLORS.border.light}` }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.25 }}>
            <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: COLORS.accent.danger }} />
            <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: COLORS.accent.warning }} />
            <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: COLORS.accent.success }} />
            <Typography
              sx={{
                ml: 'auto',
                fontFamily: FONTS.body,
                color: COLORS.text.subtle,
                fontSize: '0.72rem',
              }}
            >
              admin · broadcasts
            </Typography>
          </Stack>

          {/* Title + body morph per phase */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`m-head-${activePhaseIdx}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: T.phaseFlip }}
            >
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.25 }}>
                <Box
                  sx={{
                    p: 0.85,
                    borderRadius: RADII.sm,
                    bgcolor: COLORS.brand.primarySubtle,
                    display: 'flex',
                  }}
                >
                  <StreamlineIcon
                    name={activePhase.icon}
                    sx={{ color: COLORS.brand.primary, width: 18, height: 18 }}
                  />
                </Box>
                <Typography
                  sx={{
                    fontFamily: FONTS.body,
                    fontWeight: 700,
                    color: COLORS.text.strong,
                    fontSize: '0.95rem',
                  }}
                >
                  {activePhase.title}
                </Typography>
              </Stack>

              <Box
                sx={{
                  p: 1.25,
                  borderRadius: RADII.md,
                  bgcolor: COLORS.bg.subtle,
                  border: `1px solid ${COLORS.border.faint}`,
                  mb: 1.5,
                }}
              >
                {activePhaseIdx > 0 && <AutoReplyBadge />}

                <ChatBubble isAuto={activePhaseIdx > 0}>
                  <Typography
                    sx={{
                      fontFamily: FONTS.body,
                      color: COLORS.text.muted,
                      fontSize: '0.82rem',
                      lineHeight: 1.55,
                    }}
                  >
                    {activePhase.body}
                  </Typography>

                  {activePhaseIdx === 0 && <WebsitePreviewCard />}

                  <Stack
                    direction="row"
                    spacing={0.75}
                    sx={{ mt: 1.25, flexWrap: 'wrap', gap: 0.75 }}
                  >
                    {activePhase.chips.map((t) => (
                      <Box
                        key={t}
                        sx={{
                          px: 1,
                          py: 0.3,
                          borderRadius: RADII.pill,
                          bgcolor: COLORS.bg.subtle,
                          border: `1px solid ${COLORS.border.light}`,
                          fontFamily: FONTS.body,
                          fontSize: '0.72rem',
                          color: COLORS.text.muted,
                        }}
                      >
                        {t}
                      </Box>
                    ))}
                  </Stack>
                </ChatBubble>
              </Box>
            </motion.div>
          </AnimatePresence>

          {/* Stats + button slot - stats grows to absorb button space after fire. */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
              minHeight: 96,
            }}
          >
            <Stack
              direction="row"
              spacing={1}
              sx={{
                flex: broadcastFired ? 1 : '0 0 auto',
                alignItems: 'stretch',
              }}
            >
              <StatPill
                label={stats.a.label}
                value={animatedStats.a}
                color={stats.a.color}
                expanded={broadcastFired}
              />
              <StatPill
                label={stats.b.label}
                value={animatedStats.b}
                color={stats.b.color}
                expanded={broadcastFired}
              />
              <StatPill
                label={stats.c.label}
                value={animatedStats.c}
                color={stats.c.color}
                expanded={broadcastFired}
              />
            </Stack>

            <Box sx={{ position: 'relative' }}>
              <AnimatePresence mode="wait">
                {!broadcastFired && (
                  <motion.div
                    key="m-broadcast-btn"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.92 }}
                    transition={{ duration: 0.35, ease: 'easeInOut' }}
                  >
                    <motion.div
                      animate={{ scale: cursor === 'press' ? 0.96 : 1 }}
                      transition={{ duration: 0.14 }}
                    >
                      <Box
                        sx={{
                          width: '100%',
                          py: 1.1,
                          borderRadius: RADII.md,
                          bgcolor:
                            cursor === 'press'
                              ? COLORS.brand.primaryHover
                              : COLORS.brand.primary,
                          color: COLORS.text.inverse,
                          fontFamily: FONTS.body,
                          fontWeight: 600,
                          fontSize: '0.88rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 0.75,
                          transition: 'background-color 140ms ease',
                        }}
                      >
                        <StreamlineIcon
                          name="check-circle"
                          sx={{ width: 16, height: 16, color: 'inherit' }}
                        />
                        Broadcast to 312 guests
                      </Box>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
              {cursor !== 'hidden' && cursor !== 'gone' && (
                <motion.div
                  key={`m-cursor-${runId}`}
                  initial={{ top: -60, left: -60, opacity: 0 }}
                  animate={{
                    top: cursor === 'glide' || cursor === 'press' ? '50%' : -60,
                    left: cursor === 'glide' || cursor === 'press' ? '50%' : -60,
                    opacity: 1,
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.7, ease: 'easeInOut' }}
                  style={{
                    position: 'absolute',
                    width: 20,
                    height: 20,
                    transform: 'translate(-50%, -50%)',
                    pointerEvents: 'none',
                  }}
                >
                  <svg viewBox="0 0 24 24" width={20} height={20}>
                    <path
                      d="M4 2 L4 18 L8.5 13.5 L11 20 L14 18.5 L11.5 12 L18 12 Z"
                      fill={COLORS.text.strong}
                      stroke={COLORS.bg.white}
                      strokeWidth={1.2}
                      strokeLinejoin="round"
                    />
                  </svg>
                </motion.div>
              )}
            </AnimatePresence>
            </Box>
          </Box>
        </Box>

        {/* Flow indicator - SVG fan of 4 curved strands, packets fly fast each way */}
        <Box sx={{ position: 'relative', height: 110, bgcolor: COLORS.bg.subtle }}>
          {(() => {
            // viewBox 300x100 w/ default preserveAspectRatio (xMidYMid meet) keeps
            // circles perfectly round on any container width (no horizontal stretch).
            // Fan from (150,0) → spread across width at y=100.
            const endXs = [36, 114, 186, 264];
            const paths = endXs.map(
              (ex) => `M 150 0 C 150 55, ${ex} 45, ${ex} 100`
            );
            const packetDur = 0.55;
            const strandStagger = 0.1;

            return (
              <svg
                viewBox="0 0 300 100"
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                }}
                aria-hidden
              >
                {/* Dotted strand paths */}
                {paths.map((d, i) => (
                  <path
                    key={`m-strand-${i}`}
                    d={d}
                    fill="none"
                    stroke={COLORS.border.default}
                    strokeWidth={1}
                    strokeDasharray="2 3"
                    strokeLinecap="round"
                    opacity={0.55}
                  />
                ))}

                {/* Packets per phase × strand - outgoing (green) then reply (purple) */}
                {PHASES.map((_, pIdx) => {
                  const trigger = pIdx === 0 ? T.trigger : 0.2;
                  const phaseStart = phaseStartTimes[pIdx];
                  return (
                    <g key={`m-packets-${pIdx}-${runId}`}>
                      {paths.map((d, sIdx) => (
                        <motion.circle
                          key={`m-out-${pIdx}-${sIdx}-${runId}`}
                          r={3.2}
                          fill={COLORS.accent.success}
                          style={{
                            offsetPath: `path("${d}")`,
                            offsetRotate: '0deg',
                          }}
                          initial={{ offsetDistance: '0%', opacity: 0 }}
                          animate={{
                            offsetDistance: ['0%', '100%'],
                            opacity: [0, 1, 1, 0],
                          }}
                          transition={{
                            duration: packetDur,
                            delay: phaseStart + trigger + sIdx * strandStagger,
                            ease: 'easeInOut',
                            times: [0, 0.12, 0.88, 1],
                          }}
                        />
                      ))}
                      {paths.map((d, sIdx) => (
                        <motion.circle
                          key={`m-rep-${pIdx}-${sIdx}-${runId}`}
                          r={3.2}
                          fill={COLORS.cultural.purple}
                          style={{
                            offsetPath: `path("${d}")`,
                            offsetRotate: '0deg',
                          }}
                          initial={{ offsetDistance: '100%', opacity: 0 }}
                          animate={{
                            offsetDistance: ['100%', '0%'],
                            opacity: [0, 1, 1, 0],
                          }}
                          transition={{
                            duration: packetDur,
                            delay:
                              phaseStart +
                              trigger +
                              T.replyStart +
                              sIdx * strandStagger,
                            ease: 'easeInOut',
                            times: [0, 0.12, 0.88, 1],
                          }}
                        />
                      ))}
                    </g>
                  );
                })}
              </svg>
            );
          })()}
        </Box>

        {/* Guest list - 2×2 grid, cards stacked (pill under name) to use space better */}
        <Box sx={{ bgcolor: COLORS.bg.white, p: 1.25 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 0.75,
            }}
          >
            {GUESTS.slice(0, 4).map((g, i) => (
              <GuestCardRow
                key={`m-card-${i}`}
                guest={g}
                pill={pills[i]}
                bumped={!!bump[i]}
                avatarUri={avatars[i]}
                dense
                stacked
              />
            ))}
          </Box>
        </Box>

        {/* Footer */}
        <Box
          sx={{
            px: 2,
            py: 1.25,
            borderTop: `1px solid ${COLORS.border.faint}`,
            bgcolor: COLORS.bg.white,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
          }}
        >
          <Typography
            variant="caption"
            sx={{ color: COLORS.text.subtle, fontFamily: FONTS.body, fontSize: '0.72rem' }}
          >
            RSVP · dietary · travel - structured automatically.
          </Typography>
          <Button
            onClick={handleReplay}
            size="small"
            startIcon={<ReplayRoundedIcon sx={{ fontSize: 16 }} />}
            sx={{
              textTransform: 'none',
              fontFamily: FONTS.body,
              fontWeight: 600,
              color: COLORS.brand.primary,
              borderRadius: RADII.md,
              fontSize: '0.78rem',
              '&:hover': { bgcolor: COLORS.brand.primarySubtle },
            }}
          >
            Replay
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────

function StatPill({
  label,
  value,
  color,
  expanded = false,
}: {
  label: string;
  value: number;
  color: string;
  expanded?: boolean;
}) {
  return (
    <Box
      sx={{
        flex: 1,
        px: 1,
        py: 0.5,
        borderRadius: RADII.sm,
        bgcolor: COLORS.bg.muted,
        border: `1px solid ${COLORS.border.faint}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: expanded ? 'center' : 'flex-start',
        lineHeight: 1,
        overflow: 'hidden',
        transition: 'padding 300ms ease, font-size 300ms ease',
      }}
    >
      <Typography
        sx={{
          fontFamily: FONTS.body,
          fontSize: { xs: '0.55rem', md: '0.62rem' },
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: COLORS.text.subtle,
          fontWeight: 600,
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontFamily: FONTS.body,
          fontSize: expanded
            ? { xs: '1.15rem', md: '1.55rem' }
            : { xs: '0.85rem', md: '1.1rem' },
          fontWeight: 700,
          color,
          mt: 0.25,
          transition: 'font-size 300ms ease',
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

function GuestCardRow({
  guest,
  pill,
  bumped,
  avatarUri,
  dense = false,
  stacked = false,
}: {
  guest: Guest;
  pill: Pill;
  bumped: boolean;
  avatarUri: string;
  dense?: boolean;
  stacked?: boolean;
}) {
  return (
    <motion.div
      animate={{ x: bumped ? -2 : 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      style={{ width: '100%' }}
    >
      <Box
        sx={{
          height: dense ? 'auto' : '14%',
          minHeight: stacked ? 0 : dense ? 44 : 58,
          px: dense ? 0.85 : { xs: 1, md: 1.5 },
          py: dense ? 0.6 : { xs: 0.75, md: 1 },
          borderRadius: RADII.md,
          bgcolor: COLORS.bg.white,
          border: `1px solid ${pill.border}`,
          boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
          display: 'flex',
          alignItems: 'center',
          gap: dense ? 0.75 : { xs: 1, md: 1.25 },
          transition: 'border-color 240ms ease',
          opacity: guest.rsvp === 'declined' && pill.label === 'Declined' ? 0.7 : 1,
        }}
      >
        <Box
          sx={{
            flexShrink: 0,
            width: dense ? 26 : { xs: 32, md: 38 },
            height: dense ? 26 : { xs: 32, md: 38 },
            borderRadius: '50%',
            bgcolor: COLORS.bg.white,
            border: `2px solid ${sideColor(guest.side)}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            p: dense ? 0.3 : 0.4,
          }}
        >
          <Box
            component="img"
            src={avatarUri}
            alt=""
            aria-hidden
            sx={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
          />
        </Box>
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: stacked ? 'column' : 'row',
            alignItems: stacked ? 'flex-start' : 'center',
            gap: stacked ? 0.35 : { xs: 1, md: 1.25 },
          }}
        >
          <Box sx={{ minWidth: 0, flex: stacked ? 'none' : 1 }}>
            <Typography
              sx={{
                fontFamily: FONTS.body,
                fontWeight: 600,
                color: COLORS.text.strong,
                fontSize: dense ? '0.75rem' : { xs: '0.78rem', md: '0.9rem' },
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {guest.name.split(' ')[0]}
            </Typography>
            <Typography
              sx={{
                fontFamily: FONTS.body,
                color: COLORS.text.subtle,
                fontSize: dense ? '0.58rem' : { xs: '0.62rem', md: '0.72rem' },
                mt: 0.1,
              }}
            >
              {guest.side === 'both' ? 'Shared guest' : `${guest.side} side`}
            </Typography>
          </Box>
          <AnimatePresence mode="wait">
            <motion.div
              key={`${pill.label}`}
              initial={{ opacity: 0, y: 4, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.22 }}
            >
              <Stack
                direction="row"
                spacing={0.5}
                alignItems="center"
                sx={{
                  px: dense ? 0.7 : { xs: 0.85, md: 1.1 },
                  py: dense ? 0.2 : 0.3,
                  borderRadius: RADII.pill,
                  bgcolor: pill.bg,
                  color: pill.color,
                  fontFamily: FONTS.body,
                  fontSize: dense ? '0.56rem' : { xs: '0.6rem', md: '0.7rem' },
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  border: `1px solid ${pill.border}`,
                  maxWidth: stacked
                    ? '100%'
                    : dense
                    ? 120
                    : { xs: 140, md: 180 },
                  overflow: 'hidden',
                }}
              >
                {pill.icon && (
                  <StreamlineIcon
                    name={pill.icon}
                    sx={{
                      width: dense ? 9 : { xs: 10, md: 12 },
                      height: dense ? 9 : { xs: 10, md: 12 },
                      color: pill.color,
                  }}
                />
              )}
              <Box
                component="span"
                sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >
                {pill.label}
              </Box>
            </Stack>
          </motion.div>
        </AnimatePresence>
        </Box>
      </Box>
    </motion.div>
  );
}

// WhatsApp-style chat bubble w/ asymmetric top-left corner + subtle tail.
// Incoming bubbles on WhatsApp are white; auto-sent ones get a slight tint
// so the eye distinguishes them from the manual broadcast at a glance.
function ChatBubble({
  children,
  isAuto,
}: {
  children: ReactNode;
  isAuto: boolean;
}) {
  const bg = isAuto ? WHATSAPP_AUTO_BUBBLE_BG : WHATSAPP_BUBBLE_BG;
  return (
    <Box
      sx={{
        position: 'relative',
        px: { xs: 1.1, md: 1.25 },
        py: { xs: 0.9, md: 1 },
        borderRadius: '3px 14px 14px 14px',
        bgcolor: bg,
        boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
        // Tail notch pointing left (bubble arrives from sender on left).
        '&::before': {
          content: '""',
          position: 'absolute',
          left: -6,
          top: 0,
          width: 0,
          height: 0,
          borderTop: `6px solid ${bg}`,
          borderLeft: '6px solid transparent',
        },
      }}
    >
      {children}
    </Box>
  );
}

// Small badge above auto-sent phases (dietary, travel) indicating Phera sent it automatically.
function AutoReplyBadge() {
  return (
    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 0.6, pl: 0.25 }}>
      <StreamlineIcon
        name="sparkles"
        sx={{ width: 10, height: 10, color: COLORS.brand.primary }}
      />
      <Typography
        sx={{
          fontFamily: FONTS.body,
          fontSize: '0.58rem',
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: COLORS.text.subtle,
        }}
      >
        Phera · auto-sent
      </Typography>
    </Stack>
  );
}

// WhatsApp-style rich link preview card embedded inside the first bubble.
function WebsitePreviewCard() {
  return (
    <Box
      sx={{
        mt: 1,
        display: 'flex',
        alignItems: 'stretch',
        borderRadius: RADII.sm,
        overflow: 'hidden',
        border: `1px solid ${COLORS.border.light}`,
        bgcolor: COLORS.bg.subtle,
      }}
    >
      <Box
        sx={{
          width: { xs: 36, md: 44 },
          flexShrink: 0,
          bgcolor: COLORS.brand.primarySubtle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <StreamlineIcon
          name="globe"
          sx={{
            width: { xs: 16, md: 20 },
            height: { xs: 16, md: 20 },
            color: COLORS.brand.primary,
          }}
        />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0, px: 0.9, py: 0.65 }}>
        <Typography
          sx={{
            fontFamily: FONTS.body,
            fontWeight: 700,
            color: COLORS.text.strong,
            fontSize: { xs: '0.66rem', md: '0.74rem' },
            lineHeight: 1.25,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          Priya &amp; Rahul · 7 Mar, Udaipur
        </Typography>
        <Typography
          sx={{
            fontFamily: FONTS.body,
            color: COLORS.text.subtle,
            fontSize: { xs: '0.58rem', md: '0.64rem' },
            lineHeight: 1.25,
            mt: 0.2,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          phera.io/priya-rahul
        </Typography>
      </Box>
    </Box>
  );
}
