'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ReplayIcon from '@mui/icons-material/Replay';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import Link from 'next/link';
import { COLORS, RADII, FONTS, TEXT, SHADOWS } from '@/lib/theme/tokens';
import { CHAT_DEMOS, type DemoTurn } from './chat-demos';

/** How long each turn dwells before the next one lands. Assistant turns run
 *  a beat longer because they show tool chips first. */
const USER_DELAY = 900;
const ASSISTANT_DELAY = 1700;

interface ChatDemoProps {
  /** Key into CHAT_DEMOS. */
  id: keyof typeof CHAT_DEMOS | string;
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

/** Small ⚙-style pill naming a real tool the agent called. */
function ToolChip({ name }: { name: string }) {
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        px: 1,
        py: 0.25,
        mr: 0.5,
        mb: 0.5,
        borderRadius: RADII.pill,
        bgcolor: COLORS.brand.primarySubtle,
        border: `1px solid ${COLORS.brand.primaryBorder}`,
        color: COLORS.brand.primary,
        fontFamily: FONTS.body,
        fontSize: TEXT.sm,
        fontWeight: 500,
        whiteSpace: 'nowrap',
      }}
    >
      {name}
    </Box>
  );
}

function TypingDots() {
  return (
    <Box sx={{ display: 'flex', gap: 0.5, py: 1, px: 0.5 }} aria-label="Planner is typing">
      {[0, 1, 2].map((i) => (
        <Box
          key={i}
          sx={{
            width: 6,
            height: 6,
            borderRadius: RADII.pill,
            bgcolor: COLORS.text.faint,
            animation: 'pheraBlink 1.2s infinite ease-in-out',
            animationDelay: `${i * 0.16}s`,
            '@keyframes pheraBlink': {
              '0%, 80%, 100%': { opacity: 0.25, transform: 'translateY(0)' },
              '40%': { opacity: 1, transform: 'translateY(-2px)' },
            },
          }}
        />
      ))}
    </Box>
  );
}

const fadeUp = {
  animation: 'pheraFadeUp 380ms ease-out both',
  '@keyframes pheraFadeUp': {
    from: { opacity: 0, transform: 'translateY(6px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
  },
} as const;

function UserBubble({ text }: { text: string }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, ...fadeUp }}>
      <Box
        sx={{
          maxWidth: '85%',
          px: 2,
          py: 1.25,
          borderRadius: RADII.lg,
          borderBottomRightRadius: RADII.sm,
          bgcolor: COLORS.brand.primary,
          color: COLORS.text.inverse,
          fontFamily: FONTS.body,
          fontSize: TEXT.base,
          lineHeight: 1.55,
        }}
      >
        {text}
      </Box>
    </Box>
  );
}

function AssistantBlock({
  text,
  tools,
  children,
}: {
  text: string;
  tools?: string[];
  children?: React.ReactNode;
}) {
  return (
    <Box sx={{ display: 'flex', gap: 1.25, mb: 2, ...fadeUp }}>
      <Box
        sx={{
          flexShrink: 0,
          width: 28,
          height: 28,
          borderRadius: RADII.pill,
          bgcolor: COLORS.brand.primarySubtle,
          display: 'grid',
          placeItems: 'center',
          mt: 0.25,
        }}
      >
        <AutoAwesomeIcon sx={{ fontSize: 15, color: COLORS.brand.primary }} />
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        {tools && tools.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', mb: 0.75 }}>
            {tools.map((t, i) => (
              <ToolChip key={`${t}-${i}`} name={t} />
            ))}
          </Box>
        )}
        <Typography
          sx={{
            fontFamily: FONTS.body,
            fontSize: TEXT.base,
            color: COLORS.text.strong,
            lineHeight: 1.6,
          }}
        >
          {text}
        </Typography>
        {children}
      </Box>
    </Box>
  );
}

/** Mirrors the real in-chat ConfirmActionCard: gated tools never fire until
 *  the human taps Confirm. */
function ConfirmCard({
  confirmLabel = 'Confirm',
  declineLabel = 'Decline',
  resolved,
  onResolve,
  state,
}: {
  confirmLabel?: string;
  declineLabel?: string;
  resolved: string;
  onResolve: () => void;
  state: 'pending' | 'done';
}) {
  if (state === 'done') {
    return (
      <Box
        sx={{
          mt: 1.5,
          px: 2,
          py: 1.25,
          borderRadius: RADII.md,
          bgcolor: COLORS.accent.successBg,
          border: `1px solid ${COLORS.accent.success}33`,
          fontFamily: FONTS.body,
          fontSize: TEXT.sm,
          color: COLORS.accent.successText,
          ...fadeUp,
        }}
      >
        {resolved}
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 1.5, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
      <Button
        onClick={onResolve}
        variant="contained"
        disableElevation
        sx={{
          bgcolor: COLORS.brand.primary,
          color: COLORS.text.inverse,
          textTransform: 'none',
          borderRadius: RADII.md,
          fontFamily: FONTS.body,
          fontSize: TEXT.sm,
          fontWeight: 500,
          px: 2.5,
          '&:hover': { bgcolor: COLORS.brand.primaryHover },
        }}
      >
        {confirmLabel}
      </Button>
      <Button
        onClick={onResolve}
        variant="outlined"
        sx={{
          color: COLORS.text.muted,
          borderColor: COLORS.border.default,
          textTransform: 'none',
          borderRadius: RADII.md,
          fontFamily: FONTS.body,
          fontSize: TEXT.sm,
          fontWeight: 500,
          px: 2.5,
          '&:hover': { borderColor: COLORS.text.muted, bgcolor: 'transparent' },
        }}
      >
        {declineLabel}
      </Button>
    </Box>
  );
}

/** Stand-in for the real right-hand DataPanel (guest tables, schedules,
 *  vendor cards, broadcast drafts). */
function DataPanel({ title, rows }: { title: string; rows: string[] }) {
  return (
    <Box
      sx={{
        mb: 2,
        ml: { xs: 0, sm: 5 },
        borderRadius: RADII.md,
        border: `1px solid ${COLORS.border.light}`,
        bgcolor: COLORS.bg.subtle,
        overflow: 'hidden',
        ...fadeUp,
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1,
          borderBottom: `1px solid ${COLORS.border.faint}`,
          bgcolor: COLORS.bg.white,
        }}
      >
        <Typography
          sx={{
            fontFamily: FONTS.body,
            fontSize: TEXT.sm,
            fontWeight: 600,
            color: COLORS.text.muted,
          }}
        >
          {title}
        </Typography>
      </Box>
      <Box sx={{ px: 2, py: 1.25 }}>
        {rows.map((r, i) => (
          <Typography
            key={i}
            sx={{
              fontFamily: FONTS.body,
              fontSize: TEXT.sm,
              color: r ? COLORS.text.muted : 'transparent',
              lineHeight: 1.7,
              minHeight: r ? 'auto' : '0.6em',
            }}
          >
            {r || ' '}
          </Typography>
        ))}
      </Box>
    </Box>
  );
}

export default function ChatDemo({ id }: ChatDemoProps) {
  const demo = CHAT_DEMOS[id];
  const reducedMotion = usePrefersReducedMotion();

  const total = demo?.turns.length ?? 0;
  const [visible, setVisible] = useState(0);
  const [started, setStarted] = useState(false);
  const [typing, setTyping] = useState(false);
  const [confirmed, setConfirmed] = useState<Record<number, boolean>>({});
  const rootRef = useRef<HTMLDivElement | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  /* Reduced motion: skip the choreography, show the whole transcript. */
  useEffect(() => {
    if (reducedMotion && total > 0) {
      setStarted(true);
      setVisible(total);
    }
  }, [reducedMotion, total]);

  /* Autoplay once the demo scrolls into view. */
  useEffect(() => {
    if (started || reducedMotion || total === 0) return;
    const el = rootRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setStarted(true);
          io.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [started, reducedMotion, total]);

  /* Reveal turns one at a time. */
  useEffect(() => {
    if (!started || reducedMotion || visible >= total) return;

    const next = demo.turns[visible];
    const isAgent = next.kind !== 'user';
    const delay = isAgent ? ASSISTANT_DELAY : USER_DELAY;

    if (isAgent) setTyping(true);

    const t = setTimeout(() => {
      setTyping(false);
      setVisible((v) => v + 1);
    }, delay);
    timers.current.push(t);

    return () => clearTimeout(t);
  }, [started, visible, total, reducedMotion, demo]);

  useEffect(() => clearTimers, [clearTimers]);

  const replay = () => {
    clearTimers();
    setConfirmed({});
    setTyping(false);
    setVisible(0);
    setStarted(true);
  };

  if (!demo) return null;

  const done = visible >= total;

  const renderTurn = (turn: DemoTurn, i: number) => {
    switch (turn.kind) {
      case 'user':
        return <UserBubble key={i} text={turn.text} />;
      case 'assistant':
        return <AssistantBlock key={i} text={turn.text} tools={turn.tools} />;
      case 'panel':
        return <DataPanel key={i} title={turn.title} rows={turn.rows} />;
      case 'confirm':
        return (
          <AssistantBlock key={i} text={turn.text} tools={turn.tools}>
            <ConfirmCard
              confirmLabel={turn.confirmLabel}
              declineLabel={turn.declineLabel}
              resolved={turn.resolved}
              state={confirmed[i] ? 'done' : 'pending'}
              onResolve={() => setConfirmed((c) => ({ ...c, [i]: true }))}
            />
          </AssistantBlock>
        );
    }
  };

  return (
    <Box
      ref={rootRef}
      sx={{
        my: 6,
        borderRadius: RADII.xl,
        border: `1px solid ${COLORS.border.light}`,
        bgcolor: COLORS.bg.white,
        boxShadow: SHADOWS.popover,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          px: 2.5,
          py: 1.5,
          borderBottom: `1px solid ${COLORS.border.faint}`,
          bgcolor: COLORS.bg.muted,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
          <AutoAwesomeIcon sx={{ fontSize: 16, color: COLORS.brand.primary }} />
          <Typography
            sx={{
              fontFamily: FONTS.body,
              fontSize: TEXT.sm,
              fontWeight: 600,
              color: COLORS.text.strong,
              whiteSpace: 'nowrap',
            }}
          >
            Planner
          </Typography>
          <Typography
            sx={{
              fontFamily: FONTS.body,
              fontSize: TEXT.sm,
              color: COLORS.text.faint,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            · {demo.caption}
          </Typography>
        </Box>
        <Button
          onClick={replay}
          size="small"
          startIcon={<ReplayIcon sx={{ fontSize: 15 }} />}
          sx={{
            flexShrink: 0,
            color: COLORS.text.subtle,
            textTransform: 'none',
            fontFamily: FONTS.body,
            fontSize: TEXT.sm,
            borderRadius: RADII.md,
            '&:hover': { color: COLORS.brand.primary, bgcolor: 'transparent' },
          }}
        >
          Replay
        </Button>
      </Box>

      {/* Transcript */}
      <Box sx={{ px: { xs: 2, sm: 3 }, py: 3, minHeight: 180 }}>
        {demo.turns.slice(0, visible).map(renderTurn)}
        {typing && (
          <Box sx={{ display: 'flex', gap: 1.25 }}>
            <Box
              sx={{
                flexShrink: 0,
                width: 28,
                height: 28,
                borderRadius: RADII.pill,
                bgcolor: COLORS.brand.primarySubtle,
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <AutoAwesomeIcon sx={{ fontSize: 15, color: COLORS.brand.primary }} />
            </Box>
            <TypingDots />
          </Box>
        )}
      </Box>

      {/* Footer CTA — only once the scene has played out */}
      {done && (
        <Box
          sx={{
            px: { xs: 2, sm: 3 },
            py: 2,
            borderTop: `1px solid ${COLORS.border.faint}`,
            bgcolor: COLORS.brand.primaryWash,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            flexWrap: 'wrap',
            ...fadeUp,
          }}
        >
          <Typography
            sx={{ fontFamily: FONTS.body, fontSize: TEXT.sm, color: COLORS.text.muted }}
          >
            This is the real Planner. Yours starts empty.
          </Typography>
          <Link href="/auth/login" className="no-underline">
            <Button
              variant="contained"
              disableElevation
              endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
              sx={{
                bgcolor: COLORS.brand.primary,
                color: COLORS.text.inverse,
                textTransform: 'none',
                borderRadius: RADII.cta,
                fontFamily: FONTS.body,
                fontSize: TEXT.sm,
                fontWeight: 500,
                px: 2.5,
                '&:hover': { bgcolor: COLORS.brand.primaryHover },
              }}
            >
              Try this yourself
            </Button>
          </Link>
        </Box>
      )}
    </Box>
  );
}
