'use client';

/**
 * FeatureStepper Step 06 mock — "We sit in your vendor chats."
 *
 * Faithful depiction of Phera's actual Coordinator feature:
 * - Phera sits inside vendor WhatsApp groups (here: Mehul Catering).
 * - It reads every message that comes through.
 * - The AI extractor (lib/vendors/ai-extractor.ts) classifies content
 *   into FIVE typed insights — summary, action_item, price_quote,
 *   decision, deadline — each with a priority (low / medium / high /
 *   urgent) and an optional due_date.
 * - The admin sees the extracted insights grouped by type in the vendor
 *   detail page; that's what the right panel mirrors.
 *
 * Visual narrative (~13s):
 *   t=0       header strip + breadcrumb fade in
 *   t=0.5s    message thread cascades in left column (vendor + admin
 *             messages, timestamped)
 *   t=2.4s    "extracting" sparkle pulses on the right panel header
 *   t=2.9s    Summary card lands
 *   t=3.6s    Decision row
 *   t=4.3s    Price Quote row
 *   t=5.0s    Action Item — urgent (brand pink chip)
 *   t=5.7s    Action Item — high (warning chip)
 *   t=6.4s    Deadline row
 *   t=7.5s    Footer counter ticks: "5 insights · 2 urgent · 280 guests"
 *   t=9.0s    held
 *   t=13.0s   restart
 *
 * Visually distinct from the other mocks: not a cascading table (Steps
 * 01/04), not a phone (03), not an SVG constellation (05), not the
 * Lovable-style split (02). This is a "one-vendor-zoom-in": the actual
 * vendor detail view that the admin lives in.
 */

import { useEffect, useState } from 'react';
import { Box, Stack } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { COLORS, FONTS, RADII } from '@/lib/theme/tokens';

interface ThreadMessage {
  sender: string;
  /** 'vendor' tints messages from the vendor side; 'admin' from the
   *  couple/planner. The real feature also has 'coordinator' (Phera). */
  role: 'vendor' | 'admin' | 'coordinator';
  text: string;
  time: string;
}

const THREAD: ThreadMessage[] = [
  { sender: 'Mehul Catering', role: 'vendor', text: 'Final menu approved! 280 guests confirmed.', time: '10:14' },
  { sender: 'Priya Sharma',   role: 'admin',  text: 'What\'s the deposit + per-plate?',          time: '10:18' },
  { sender: 'Mehul Catering', role: 'vendor', text: '$500 by March 15. ₹1,200 per plate, setup included.', time: '10:22' },
  { sender: 'Priya Sharma',   role: 'admin',  text: 'Can we add 30 Jain plates?',                time: '10:24' },
  { sender: 'Mehul Catering', role: 'vendor', text: 'Yes — pure veg, no upcharge. Need final headcount Fri 5 PM.', time: '10:26' },
];

type InsightType = 'summary' | 'decision' | 'price_quote' | 'action_item' | 'deadline';
type Priority = 'low' | 'medium' | 'high' | 'urgent';

interface Insight {
  type: InsightType;
  text: string;
  meta: string;
  priority?: Priority;
}

const INSIGHTS: Insight[] = [
  {
    type: 'summary',
    text: 'North Indian + Jain catering for 280 guests. Booked Mar 8. Awaiting deposit.',
    meta: 'Mehul Catering · 47 msgs',
  },
  {
    type: 'decision',
    text: 'Catering booked: Mehul Catering, 280 guests',
    meta: 'Decided · Mar 8',
  },
  {
    type: 'price_quote',
    text: '₹1,200 per plate · setup included · 280 guests',
    meta: 'Mehul Catering',
  },
  {
    type: 'action_item',
    text: 'Send $500 deposit to Mehul Catering',
    meta: 'Due Mar 15',
    priority: 'urgent',
  },
  {
    type: 'action_item',
    text: 'Confirm 30 Jain plates',
    meta: 'Due Wed',
    priority: 'high',
  },
  {
    type: 'deadline',
    text: 'Final headcount',
    meta: 'Fri · 5 PM',
  },
];

/* ─────────────── design tokens for insight types ─────────────── */

interface TypeStyle {
  label: string;
  fg: string;
  bg: string;
  border: string;
  icon: React.ReactNode;
}

const TYPE_STYLES: Record<InsightType, TypeStyle> = {
  summary: {
    label: 'Summary',
    fg: COLORS.text.strong,
    bg: 'rgba(0,0,0,0.025)',
    border: 'rgba(0,0,0,0.06)',
    icon: <SummaryIcon />,
  },
  decision: {
    label: 'Decision',
    fg: '#5347B5',
    bg: 'rgba(108,92,231,0.10)',
    border: 'rgba(108,92,231,0.22)',
    icon: <DecisionIcon />,
  },
  price_quote: {
    label: 'Price Quote',
    fg: '#0E7C5B',
    bg: 'rgba(32,201,151,0.10)',
    border: 'rgba(32,201,151,0.22)',
    icon: <PriceIcon />,
  },
  action_item: {
    label: 'Action',
    fg: '#9D4F0E',
    bg: 'rgba(255,153,51,0.12)',
    border: 'rgba(255,153,51,0.28)',
    icon: <ActionIcon />,
  },
  deadline: {
    label: 'Deadline',
    fg: '#1E5BB8',
    bg: 'rgba(59,130,246,0.10)',
    border: 'rgba(59,130,246,0.22)',
    icon: <DeadlineIcon />,
  },
};

const PRIORITY_STYLES: Record<Priority, { fg: string; bg: string; label: string }> = {
  urgent: { fg: 'white', bg: COLORS.brand.primary, label: 'urgent' },
  high:   { fg: '#9D4F0E', bg: 'rgba(255,153,51,0.18)', label: 'high' },
  medium: { fg: COLORS.text.muted, bg: 'rgba(0,0,0,0.05)', label: 'medium' },
  low:    { fg: COLORS.text.faint, bg: 'rgba(0,0,0,0.03)', label: 'low' },
};

/* ─────────────── timing ─────────────── */

const LOOP_MS = 13000;

type Phase =
  | 'idle'
  | 'header'
  | 'thread'
  | 'extracting'
  | 'insights'
  | 'summary';

export default function VendorAgentMock() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [threadStep, setThreadStep] = useState(0);
  const [insightStep, setInsightStep] = useState(0);
  const [summaryProgress, setSummaryProgress] = useState(0);
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
      setThreadStep(0);
      setInsightStep(0);
      setSummaryProgress(0);
      setPhase('idle');
      setTick((t) => t + 1);

      after(50,   () => setPhase('header'));
      after(500,  () => setPhase('thread'));
      THREAD.forEach((_, i) => after(500 + i * 320, () => setThreadStep(i + 1)));
      after(2400, () => setPhase('extracting'));
      after(2900, () => setPhase('insights'));
      INSIGHTS.forEach((_, i) => after(2900 + i * 700, () => setInsightStep(i + 1)));
      after(7500, () => {
        setPhase('summary');
        tween(900, (t) => setSummaryProgress(t));
      });
      after(LOOP_MS, cycle);
    };

    cycle();
    return () => {
      cancelled = true;
      clearAll();
    };
  }, []);

  const headerVisible = phase !== 'idle';
  const showExtractingPulse = phase === 'extracting';

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
        position: 'relative',
      }}
    >
      <Header
        visible={headerVisible}
        summaryProgress={summaryProgress}
        showSummary={phase === 'summary'}
      />
      <Box sx={{ height: '1px', bgcolor: 'rgba(0,0,0,0.06)', flex: 'none' }} />

      <Box sx={{ flex: 1, display: 'flex', minHeight: 0, gap: 1.25 }}>
        {/* LEFT — conversation thread (what Phera read) */}
        <Box
          sx={{
            flex: '0 0 42%',
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 0.5,
          }}
        >
          <SectionLabel>Conversation</SectionLabel>
          <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 0.4 }}>
            <AnimatePresence initial={false}>
              {THREAD.map((m, i) =>
                i < threadStep ? (
                  <motion.div
                    key={`${tick}-m-${i}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.28, ease: 'easeOut' }}
                  >
                    <ThreadRow message={m} />
                  </motion.div>
                ) : null,
              )}
            </AnimatePresence>
          </Box>
        </Box>

        {/* RIGHT — AI-extracted insights (what Phera produced) */}
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 0.5,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <SectionLabel>
              <Stack direction="row" spacing={0.4} alignItems="center">
                <SparkleIcon size={13} />
                <Box component="span">AI Insights</Box>
              </Stack>
            </SectionLabel>
            {showExtractingPulse && (
              <Box
                sx={{
                  fontSize: '0.65rem',
                  color: COLORS.brand.primary,
                  fontFamily: 'var(--mono), monospace',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  animation: 'va-blink 1.1s ease-in-out infinite',
                }}
              >
                · extracting
              </Box>
            )}
          </Stack>

          <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <AnimatePresence initial={false}>
              {INSIGHTS.map((item, i) =>
                i < insightStep ? (
                  <motion.div
                    key={`${tick}-i-${i}`}
                    initial={{ opacity: 0, x: 8, scale: 0.97 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    transition={{ duration: 0.32, ease: 'easeOut' }}
                  >
                    <InsightCard insight={item} />
                  </motion.div>
                ) : null,
              )}
            </AnimatePresence>
          </Box>
        </Box>
      </Box>

      <style>{`
        @keyframes va-blink { 0%,100% { opacity: 0.4 } 50% { opacity: 1 } }
        @keyframes va-pulse-dot {
          0%, 100% { transform: scale(1);   opacity: 1; }
          50%      { transform: scale(1.4); opacity: 0.4; }
        }
      `}</style>
    </Box>
  );
}

/* ─────────────── header ─────────────── */

function Header({
  visible,
  summaryProgress,
  showSummary,
}: {
  visible: boolean;
  summaryProgress: number;
  showSummary: boolean;
}) {
  const insights = Math.round(summaryProgress * 5);
  const urgent = Math.round(summaryProgress * 2);
  return (
    <Stack
      direction="row"
      spacing={1.25}
      alignItems="center"
      sx={{ flex: 'none', opacity: visible ? 1 : 0, transition: 'opacity 0.4s ease' }}
    >
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
        <Stack direction="row" spacing={0.7} alignItems="baseline">
          <Box
            sx={{
              fontSize: '1rem',
              fontWeight: 600,
              color: COLORS.text.strong,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            Mehul Catering
          </Box>
          <Box
            sx={{
              fontSize: '0.72rem',
              fontFamily: 'var(--mono), monospace',
              color: COLORS.text.faint,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              flex: 'none',
            }}
          >
            caterer
          </Box>
        </Stack>
        <Box
          sx={{
            fontSize: '0.78rem',
            color: COLORS.text.subtle,
            fontFamily: 'var(--mono), monospace',
          }}
        >
          @phera reading · vendor group
        </Box>
      </Box>
      <AnimatePresence>
        {showSummary && (
          <motion.div
            initial={{ opacity: 0, x: 4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.32 }}
          >
            <Stack direction="row" spacing={1.25} alignItems="center" sx={{ flex: 'none' }}>
              <SummaryStat label="insights" value={insights} fg={COLORS.text.subtle} />
              <SummaryStat label="urgent" value={urgent} fg={COLORS.brand.primary} />
            </Stack>
          </motion.div>
        )}
      </AnimatePresence>
    </Stack>
  );
}

function SummaryStat({ label, value, fg }: { label: string; value: number; fg: string }) {
  return (
    <Box sx={{ textAlign: 'right', lineHeight: 1.05 }}>
      <Box
        sx={{
          fontSize: '1.2rem',
          fontWeight: 700,
          color: fg,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </Box>
      <Box
        sx={{
          fontSize: '0.65rem',
          color: COLORS.text.faint,
          fontFamily: 'var(--mono), monospace',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Box>
    </Box>
  );
}

/* ─────────────── thread row ─────────────── */

function ThreadRow({ message }: { message: ThreadMessage }) {
  const isVendor = message.role === 'vendor';
  const accent = isVendor ? COLORS.brand.primary : '#3B82F6';
  return (
    <Box
      sx={{
        display: 'flex',
        gap: 0.6,
        alignItems: 'flex-start',
        py: 0.4,
      }}
    >
      <Box
        sx={{
          width: 3,
          alignSelf: 'stretch',
          borderRadius: 2,
          bgcolor: accent,
          opacity: 0.8,
          flex: 'none',
          mt: 0.4,
        }}
      />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="row" spacing={0.6} alignItems="baseline" sx={{ mb: 0.15 }}>
          <Box
            sx={{
              fontSize: '0.8rem',
              fontWeight: 600,
              color: COLORS.text.strong,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              minWidth: 0,
            }}
          >
            {message.sender}
          </Box>
          <Box
            sx={{
              fontSize: '0.68rem',
              fontFamily: 'var(--mono), monospace',
              color: COLORS.text.faint,
              flex: 'none',
            }}
          >
            {message.time}
          </Box>
        </Stack>
        <Box
          sx={{
            fontSize: '0.8rem',
            color: COLORS.text.muted,
            lineHeight: 1.4,
          }}
        >
          {message.text}
        </Box>
      </Box>
    </Box>
  );
}

/* ─────────────── insight card ─────────────── */

function InsightCard({ insight }: { insight: Insight }) {
  const t = TYPE_STYLES[insight.type];
  const isSummary = insight.type === 'summary';
  return (
    <Box
      sx={{
        bgcolor: t.bg,
        border: `1px solid ${t.border}`,
        borderRadius: RADII.sm,
        px: 1,
        py: 0.75,
        display: 'flex',
        gap: 0.75,
        alignItems: 'flex-start',
      }}
    >
      <Box
        sx={{
          width: 22,
          height: 22,
          borderRadius: '6px',
          bgcolor: t.fg,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 'none',
          mt: 0.15,
        }}
      >
        {t.icon}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 0.2 }}>
          <Box
            sx={{
              fontSize: '0.7rem',
              fontFamily: 'var(--mono), monospace',
              fontWeight: 700,
              color: t.fg,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              flex: 'none',
            }}
          >
            {t.label}
          </Box>
          {insight.priority && <PriorityChip priority={insight.priority} />}
        </Stack>
        <Box
          sx={{
            fontSize: isSummary ? '0.8rem' : '0.85rem',
            fontWeight: isSummary ? 400 : 500,
            color: isSummary ? COLORS.text.muted : COLORS.text.strong,
            lineHeight: 1.4,
            mb: 0.15,
          }}
        >
          {insight.text}
        </Box>
        <Box
          sx={{
            fontSize: '0.68rem',
            color: COLORS.text.subtle,
            fontFamily: 'var(--mono), monospace',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {insight.meta}
        </Box>
      </Box>
    </Box>
  );
}

function PriorityChip({ priority }: { priority: Priority }) {
  const p = PRIORITY_STYLES[priority];
  return (
    <Box
      sx={{
        fontSize: '0.65rem',
        fontFamily: 'var(--mono), monospace',
        fontWeight: 700,
        color: p.fg,
        bgcolor: p.bg,
        borderRadius: '999px',
        px: 0.75,
        py: 0.1,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        flex: 'none',
      }}
    >
      {p.label}
    </Box>
  );
}

/* ─────────────── small bits ─────────────── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        fontSize: '0.72rem',
        fontFamily: 'var(--mono), monospace',
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: COLORS.text.faint,
        flex: 'none',
        py: 0.4,
      }}
    >
      {children}
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

function SummaryIcon() {
  return (
    <Box component="svg" viewBox="0 0 16 16" sx={{ width: 12, height: 12, color: 'white' }}>
      <path d="M3 4h10v1H3zM3 7.5h10v1H3zM3 11h7v1H3z" fill="currentColor" />
    </Box>
  );
}

function DecisionIcon() {
  return (
    <Box component="svg" viewBox="0 0 16 16" sx={{ width: 12, height: 12, color: 'white' }}>
      <path
        fill="currentColor"
        d="M3 12.5l3 3 7-7-1.4-1.4L6 12.7 4.4 11.1zM10.5 4l3-3 1.5 1.5-3 3z"
      />
    </Box>
  );
}

function PriceIcon() {
  return (
    <Box component="svg" viewBox="0 0 16 16" sx={{ width: 12, height: 12, color: 'white' }}>
      <path
        fill="currentColor"
        d="M8 1c.6 0 1 .4 1 1v.2c1.7.3 3 1.5 3 3 0 .6-.4 1-1 1s-1-.4-1-1c0-.5-.7-1-2-1S6 4.7 6 5s.5.7 1.6.9c1.6.4 4.4.9 4.4 3.1 0 1.5-1.3 2.7-3 3v.2c0 .6-.4 1-1 1s-1-.4-1-1V12c-1.7-.3-3-1.5-3-3 0-.6.4-1 1-1s1 .4 1 1c0 .5.7 1 2 1s2-.4 2-1c0-.5-.6-.7-1.7-.9C6.6 7.7 4 7.2 4 5c0-1.5 1.3-2.7 3-3v-.2C7 1.4 7.4 1 8 1z"
      />
    </Box>
  );
}

function ActionIcon() {
  return (
    <Box component="svg" viewBox="0 0 16 16" sx={{ width: 12, height: 12, color: 'white' }}>
      <path
        fill="currentColor"
        d="M8 1.5l1 1.5h4v8H3v-8h4zM5 6v1h6V6zm0 2.5v1h6v-1zm0 2.5v1h4v-1z"
      />
    </Box>
  );
}

function DeadlineIcon() {
  return (
    <Box component="svg" viewBox="0 0 16 16" sx={{ width: 12, height: 12, color: 'white' }}>
      <path
        fill="currentColor"
        d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM8 3.5c.4 0 .75.35.75.75V8l3 1.75c.35.2.45.65.25 1s-.65.45-1 .25l-3.4-2c-.2-.1-.35-.35-.35-.6V4.25c0-.4.35-.75.75-.75z"
      />
    </Box>
  );
}
