'use client';

/**
 * PlannerShowcase — THE features section (replaces the 6-step FeatureStepper).
 *
 * cdata.com-style pattern: centered heading, then two columns —
 * LEFT: a vertical stack of 6 selectable use-case cards;
 * RIGHT: a pixel-faithful mock of Phera's real Planner chat
 * (components/agent/AgentChatPanel.tsx) replaying the selected use case.
 *
 * Clicking a card switches the conversation (fade/slide via framer-motion);
 * cards auto-advance every 7s until the user clicks one, which pauses the
 * rotation permanently. On mobile (<900px) the card stack collapses into a
 * horizontally scrollable chip row above the full-width mock.
 *
 * The chat mock intentionally mirrors the REAL AgentChatPanel styling —
 * user bubble, borderless assistant text, muted tool receipts, the gated
 * ConfirmActionCard, the working spinner, and the composer — so visitors
 * see exactly the product. All decorative controls are non-interactive
 * spans (no dead buttons for keyboard users).
 */

import { useEffect, useRef, useState } from 'react';
import { Box, CircularProgress, Stack, Typography } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import AttachFileRoundedIcon from '@mui/icons-material/AttachFileRounded';
import MicRoundedIcon from '@mui/icons-material/MicRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import GridOnRoundedIcon from '@mui/icons-material/GridOnRounded';
import PictureAsPdfRoundedIcon from '@mui/icons-material/PictureAsPdfRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import { Reveal, SectionHeader } from './design-primitives';
import { PheraChip } from '@/components/shared/Chip';
import { COLORS, FONTS, RADII, SHADOWS } from '@/lib/theme/tokens';

// ─── Script data ─────────────────────────────────────────────────────

type ChatItem =
  | { kind: 'user'; text: string }
  | { kind: 'working'; text: string }
  | { kind: 'upload'; fileName: string; fileSize: string; fileKind?: 'sheet' | 'pdf' }
  | { kind: 'receipt'; label: string; summary: string; undo?: boolean }
  | { kind: 'assistant'; text: string }
  | { kind: 'confirm'; label: string; summary: string; reason: string }
  /** The collapsed state a Confirm card resolves into (real-panel behavior). */
  | { kind: 'chip'; text: string }
  /** A vendor-directory match, as the right-pane listing card renders it. */
  | {
      kind: 'vendor';
      name: string;
      category: string;
      city: string;
      rating: number;
      reviews: number;
      price: string;
      badge: string;
    };

interface Scenario {
  category: string;
  title: string;
  tier: 'Free' | 'Base';
  script: ChatItem[];
}

const SCENARIOS: Scenario[] = [
  {
    category: 'Guest list',
    title: 'Import 200 guests from a spreadsheet',
    tier: 'Free',
    script: [
      { kind: 'user', text: 'I have my guest list in a spreadsheet — can you take it from here?' },
      { kind: 'assistant', text: "Absolutely — drop it here and I'll take care of the rest." },
      { kind: 'upload', fileName: 'guest_list.csv', fileSize: '42 KB' },
      { kind: 'working', text: 'Importing guests…' },
      { kind: 'receipt', label: 'Guest list imported', summary: '214 guests · 96 households', undo: true },
      {
        kind: 'assistant',
        text: "Done — everyone's in, tagged by side and family. 38 are flying in from abroad, so I'd suggest we sort travel and rooms early.",
      },
      { kind: 'user', text: "How many are on the bride's side?" },
      { kind: 'working', text: 'Checking guest list…' },
      {
        kind: 'assistant',
        text: '117 bride-side, 97 groom-side — and 12 still need a plus-one decision. Want me to start RSVPs?',
      },
    ],
  },
  {
    category: 'RSVPs',
    title: 'Chase every pending RSVP on WhatsApp',
    tier: 'Free',
    script: [
      { kind: 'user', text: "Can you chase everyone who hasn't RSVPed yet?" },
      { kind: 'working', text: 'Checking RSVPs…' },
      { kind: 'receipt', label: 'Checked RSVPs', summary: '61 of 214 still pending' },
      {
        kind: 'confirm',
        label: 'Send WhatsApp reminders',
        summary: "A friendly nudge to the 61 guests who haven't replied — sent from your wedding's WhatsApp number.",
        reason: 'Your RSVP deadline is in 12 days.',
      },
      { kind: 'chip', text: 'Confirmed ✓' },
      { kind: 'working', text: 'Sending reminders…' },
      { kind: 'receipt', label: 'Reminders sent', summary: '61 guests nudged on WhatsApp' },
      {
        kind: 'assistant',
        text: "Done. I'll chase the stragglers again on Thursday, and hand you the final few to call personally.",
      },
    ],
  },
  {
    category: 'Wedding website',
    title: 'A beautiful site, built in chat',
    tier: 'Free',
    script: [
      { kind: 'user', text: 'I need a wedding website built' },
      { kind: 'working', text: 'Drafting your website…' },
      { kind: 'receipt', label: 'Website drafted', summary: 'home, events, travel, RSVP & FAQs' },
      {
        kind: 'assistant',
        text: "Using everything we've gathered — your names, dates, venue and dress codes — I've built your website and it's live in draft. Tell me what to change, or publish when you're happy.",
      },
      { kind: 'user', text: 'Can the design feel more royal?' },
      { kind: 'working', text: 'Updating the design…' },
      { kind: 'receipt', label: 'Theme updated', summary: 'deep maroon & gold', undo: true },
      { kind: 'assistant', text: 'Regal it is. Want a photo of you two on the home page? Just send it here.' },
    ],
  },
  {
    category: 'Rooms',
    title: 'Sleep 200 guests without a spreadsheet',
    tier: 'Base',
    script: [
      { kind: 'user', text: 'The hotel sent over their floor plan — can you sort our rooms from it?' },
      { kind: 'assistant', text: "Send it across and I'll read it — then tell me who you want near you." },
      { kind: 'upload', fileName: 'floor_plan.pdf', fileSize: '1.8 MB', fileKind: 'pdf' },
      { kind: 'working', text: 'Reading floor plan…' },
      { kind: 'receipt', label: 'Floor plan read', summary: '84 rooms across 4 floors' },
      { kind: 'user', text: 'Keep both families close to us.' },
      { kind: 'working', text: 'Assigning rooms…' },
      {
        kind: 'assistant',
        text: 'Assigned 178 guests: both families on your floor, grandparents near the lifts, and college friends safely down the hall.',
      },
      { kind: 'user', text: 'Move cousin Arjun closer to the groomsmen.' },
      { kind: 'working', text: 'Updating rooms…' },
      { kind: 'receipt', label: 'Room updated', summary: 'Arjun Mehta → room 412', undo: true },
      {
        kind: 'assistant',
        text: "Done — Arjun's in 412, across the hall from the groomsmen. Every change is one message, and undoable.",
      },
    ],
  },
  {
    category: 'Shuttles & travel',
    title: 'Airport pickups that plan themselves',
    tier: 'Base',
    script: [
      { kind: 'user', text: '12 people land on Friday — set up their pickups.' },
      { kind: 'working', text: 'Matching flights…' },
      { kind: 'receipt', label: 'Flights matched', summary: '12 arrivals · 3 shuttle runs drafted' },
      {
        kind: 'confirm',
        label: 'Shuttle schedule',
        summary: '3 airport runs on Friday (11:40, 15:05, 21:30) covering all 12 arrivals.',
        reason: 'Landings within 90 minutes share a car.',
      },
      { kind: 'chip', text: 'Confirmed ✓' },
      {
        kind: 'assistant',
        text: "Booked. Every guest gets their pickup time and the driver's number on WhatsApp the day before they fly.",
      },
    ],
  },
  {
    category: 'Vendors',
    title: 'Find vendors who get Indian weddings',
    tier: 'Base',
    script: [
      { kind: 'user', text: 'Find me photographers in Goa under ₹3L' },
      { kind: 'working', text: 'Searching the vendor directory…' },
      { kind: 'receipt', label: 'Searched the directory', summary: '4 matches in Goa' },
      {
        kind: 'vendor',
        name: 'Golden Hour Studios',
        category: 'Photographer',
        city: 'Goa',
        rating: 4.9,
        reviews: 128,
        price: '₹1.8L–₹2.6L',
        badge: 'NRI experienced',
      },
      {
        kind: 'assistant',
        text: 'Here are your 4 matches — all in budget and free on your dates. Tap one to see their work, or I can request quotes from your top two.',
      },
    ],
  },
];

/** How long each item holds the floor before the next appears — tuned so every
 *  scenario breathes like a real conversation (working beats always dwell). */
const DWELL_MS: Record<ChatItem['kind'], number> = {
  user: 800,
  assistant: 1050,
  working: 1150,
  upload: 1600, // the progress bar's fill time + a beat
  receipt: 550,
  confirm: 1500,
  chip: 450,
  vendor: 950,
};
/** Pause on the finished conversation before auto-advancing. */
const ADVANCE_REST_MS = 3200;

function scriptDurationMs(script: ChatItem[]): number {
  return script.reduce((total, item) => total + DWELL_MS[item.kind], 250);
}

// ─── Component ───────────────────────────────────────────────────────

export default function PlannerShowcase() {
  const [active, setActive] = useState(0);
  // How many items of the active script are revealed (working items hide
  // again once the next item lands — like the real panel's busy line).
  const [step, setStep] = useState(0);
  // Once the user clicks any card, auto-advance pauses permanently.
  const pausedRef = useRef(false);

  // Auto-advance once the active conversation has fully played out (plus a
  // rest so the finished thread can be read), until the user takes over.
  useEffect(() => {
    if (pausedRef.current) return;
    const id = setTimeout(() => {
      if (!pausedRef.current) setActive((a) => (a + 1) % SCENARIOS.length);
    }, scriptDurationMs(SCENARIOS[active].script) + ADVANCE_REST_MS);
    return () => clearTimeout(id);
  }, [active]);

  // Beat-by-beat reveal of the active conversation.
  useEffect(() => {
    setStep(0);
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    let at = 250;
    SCENARIOS[active].script.forEach((item, i) => {
      timeouts.push(setTimeout(() => setStep(i + 1), at));
      at += DWELL_MS[item.kind];
    });
    return () => timeouts.forEach(clearTimeout);
  }, [active]);

  const select = (i: number) => {
    pausedRef.current = true;
    setActive(i);
  };

  const scenario = SCENARIOS[active];

  return (
    <section
      id="service"
      className="section bg-textured bg-paper-floral"
      style={{ background: 'var(--paper)' }}
    >
      <div className="container" style={{ maxWidth: 1440 }}>
        <SectionHeader
          align="center"
          eyebrow="How it works"
          title="You ask. It gets done."
          kicker="The same planner you'll use — these are real conversations from real weddings."
          singleLine
        />

        {/* Mobile: use-case chips in a scroll-snap row above the mock. */}
        <div className="pshow-chiprow">
          {SCENARIOS.map((s, i) => (
            <PheraChip
              key={s.category}
              label={s.category}
              tone={active === i ? 'brand' : 'neutral'}
              onClick={() => select(i)}
              sx={{
                flex: 'none',
                scrollSnapAlign: 'start',
                cursor: 'pointer',
                ...(active === i ? {} : { bgcolor: COLORS.bg.white }),
              }}
            />
          ))}
        </div>

        <Reveal delay={3}>
          <div
            className="pshow-grid"
            style={{
              marginTop: 'clamp(48px, 6vw, 72px)',
              display: 'grid',
              gridTemplateColumns: 'minmax(340px, 0.9fr) 1.3fr',
              gap: 'clamp(32px, 4.5vw, 64px)',
              alignItems: 'start',
            }}
          >
            {/* LEFT: selectable use-case cards */}
            <div
              className="pshow-cards"
              style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
            >
              {SCENARIOS.map((s, i) => {
                const isActive = active === i;
                return (
                  <button
                    key={s.category}
                    type="button"
                    className={`pshow-card${isActive ? ' is-active' : ''}`}
                    aria-pressed={isActive}
                    onClick={() => select(i)}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '18px 22px',
                      background: isActive ? 'white' : 'transparent',
                      border: 'none',
                      borderLeft: `3px solid ${isActive ? 'var(--accent)' : 'transparent'}`,
                      borderRadius: RADII.md,
                      boxShadow: isActive ? SHADOWS.card : 'none',
                      opacity: isActive ? 1 : 0.72,
                      fontFamily: 'var(--sans)',
                    }}
                  >
                    <div
                      className="mono"
                      style={{
                        fontSize: 12,
                        fontWeight: 500,
                        letterSpacing: '0.16em',
                        textTransform: 'uppercase',
                        color: isActive ? 'var(--accent)' : 'var(--text-subtle)',
                      }}
                    >
                      {s.category}
                    </div>
                    <div
                      style={{
                        marginTop: 8,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 10,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 19,
                          fontWeight: 600,
                          lineHeight: 1.35,
                          color: 'var(--text-strong)',
                        }}
                      >
                        {s.title}
                      </span>
                      {/* Free/Base tag — same pill the FeatureStepper used. */}
                      <span
                        style={{
                          padding: '3px 9px',
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: '0.08em',
                          color: s.tier === 'Free' ? 'var(--text-subtle)' : 'white',
                          background: s.tier === 'Free' ? 'rgba(0,0,0,0.06)' : 'var(--accent)',
                          flex: 'none',
                        }}
                      >
                        {s.tier}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* RIGHT: the Planner chat mock */}
            <Box
              className="pshow-mock"
              sx={{
                bgcolor: COLORS.bg.subtle,
                border: `1px solid ${COLORS.border.light}`,
                borderRadius: RADII.lg,
                p: { xs: 3, md: 4 },
                minHeight: { xs: 480, md: 640 },
                display: 'flex',
                flexDirection: 'column',
                fontFamily: FONTS.body,
              }}
            >
              <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={active}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
                  >
                    {scenario.script.map((item, i) => {
                      if (i >= step) return null;
                      // A working spinner only lives while it's the latest
                      // item — its result replaces it, like the real panel.
                      // Removal is instant (no exit animation): exit tweens
                      // stall in throttled background tabs and would leave
                      // stale spinners behind when the visitor tabs back.
                      if (item.kind === 'working' && step > i + 1) return null;
                      // A Confirm card followed by its resolved chip collapses
                      // once the chip lands — exactly like the real panel.
                      if (
                        item.kind === 'confirm' &&
                        scenario.script[i + 1]?.kind === 'chip' &&
                        step > i + 1
                      ) {
                        return null;
                      }
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.25, ease: 'easeOut' }}
                          style={{
                            display: 'flex',
                            justifyContent: item.kind === 'user' ? 'flex-end' : 'flex-start',
                          }}
                        >
                          <ChatItemView item={item} />
                        </motion.div>
                      );
                    })}
                  </motion.div>
                </AnimatePresence>
              </Box>

              {/* Composer — decorative, pinned at the mock's bottom. */}
              <Box
                sx={{
                  mt: 2.5,
                  flex: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.25,
                  bgcolor: COLORS.bg.white,
                  border: `1px solid ${COLORS.border.default}`,
                  borderRadius: RADII.lg,
                  boxShadow: SHADOWS.card,
                  px: 2,
                  py: 1.5,
                }}
              >
                <Typography
                  noWrap
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    fontFamily: FONTS.body,
                    fontSize: '0.9375rem',
                    color: COLORS.text.faint,
                  }}
                >
                  Tell me what’s happening — Enter to send
                </Typography>
                <AttachFileRoundedIcon sx={{ fontSize: 20, color: COLORS.text.subtle, flex: 'none' }} />
                <MicRoundedIcon sx={{ fontSize: 20, color: COLORS.text.subtle, flex: 'none' }} />
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    bgcolor: COLORS.brand.primarySubtle,
                    color: COLORS.brand.primary,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flex: 'none',
                  }}
                >
                  <SendRoundedIcon sx={{ fontSize: 20 }} />
                </Box>
              </Box>
            </Box>
          </div>
        </Reveal>
      </div>

      <style>{`
        .pshow-chiprow { display: none; }
        .pshow-progress { width: 0%; animation: pshow-fill 1.15s ease-out 0.15s forwards; }
        @keyframes pshow-fill { to { width: 100%; } }
        .pshow-card {
          cursor: pointer;
          transition: background 0.2s ease, box-shadow 0.2s ease,
                      transform 0.2s ease, opacity 0.2s ease;
        }
        .pshow-card:not(.is-active):hover {
          background: rgba(255,255,255,0.65) !important;
          opacity: 1 !important;
          transform: translateY(-1px);
        }
        .pshow-card:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 2px;
        }
        @media (max-width: 899.95px) {
          .pshow-cards { display: none !important; }
          .pshow-grid {
            grid-template-columns: minmax(0, 1fr) !important;
            margin-top: 16px !important;
          }
          .pshow-chiprow {
            display: flex;
            gap: 8px;
            margin-top: 40px;
            padding: 4px 2px 14px;
            overflow-x: auto;
            overscroll-behavior-x: contain;
            scroll-snap-type: x proximity;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }
          .pshow-chiprow::-webkit-scrollbar { display: none; }
        }
      `}</style>
    </section>
  );
}

// ─── Chat mock pieces (mirror components/agent/AgentChatPanel.tsx) ───

function ChatItemView({ item }: { item: ChatItem }) {
  switch (item.kind) {
    case 'user':
      return (
        <Box
          sx={{
            maxWidth: '85%',
            px: 2,
            py: 1.25,
            borderRadius: RADII.lg,
            bgcolor: COLORS.brand.primarySubtle,
            border: `1px solid ${COLORS.brand.primaryBorder}`,
          }}
        >
          <Typography
            sx={{
              fontFamily: FONTS.body,
              fontSize: '0.9375rem',
              lineHeight: 1.5,
              color: COLORS.text.strong,
            }}
          >
            {item.text}
          </Typography>
        </Box>
      );

    case 'assistant':
      // Borderless plain text directly on the grey panel — no bubble, no avatar.
      return (
        <Typography
          sx={{
            fontFamily: FONTS.body,
            fontSize: '0.9375rem',
            lineHeight: 1.6,
            color: COLORS.text.strong,
          }}
        >
          {item.text}
        </Typography>
      );

    case 'working':
      return (
        <Stack direction="row" spacing={1} alignItems="center">
          <CircularProgress size={14} sx={{ color: COLORS.brand.primary }} />
          <Typography
            sx={{ fontFamily: FONTS.body, fontSize: '0.9375rem', color: COLORS.text.subtle }}
          >
            {item.text}
          </Typography>
        </Stack>
      );

    case 'receipt':
      return (
        <Stack direction="row" alignItems="center" spacing={0.75}>
          <Typography
            sx={{ fontFamily: FONTS.body, fontSize: '0.9375rem', color: COLORS.text.subtle }}
          >
            ✓ {item.label} — {item.summary}
          </Typography>
          {item.undo && (
            <Typography
              component="span"
              sx={{ fontFamily: FONTS.body, fontSize: '0.9375rem', color: COLORS.brand.primary }}
            >
              Undo
            </Typography>
          )}
        </Stack>
      );

    case 'upload': {
      // The real import flow's file card: name + size, a glyph matching the file
      // type, and a progress bar that fills once on mount (see pshow-progress CSS).
      const isPdf = item.fileKind === 'pdf';
      return (
        <Box
          sx={{
            width: '100%',
            maxWidth: 340,
            bgcolor: COLORS.bg.white,
            border: `1px solid ${COLORS.border.light}`,
            borderRadius: RADII.lg,
            px: 1.75,
            py: 1.25,
          }}
        >
          <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 1 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: RADII.sm,
                bgcolor: isPdf ? COLORS.brand.primarySubtle : COLORS.accent.successBg,
                color: isPdf ? COLORS.brand.primary : COLORS.accent.successText,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 'none',
              }}
            >
              {isPdf ? (
                <PictureAsPdfRoundedIcon sx={{ fontSize: 18 }} />
              ) : (
                <GridOnRoundedIcon sx={{ fontSize: 18 }} />
              )}
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                noWrap
                sx={{ fontFamily: FONTS.body, fontSize: '0.9375rem', fontWeight: 600, color: COLORS.text.strong }}
              >
                {item.fileName}
              </Typography>
              <Typography sx={{ fontFamily: FONTS.body, fontSize: '0.9375rem', color: COLORS.text.subtle, lineHeight: 1.2 }}>
                {item.fileSize}
              </Typography>
            </Box>
          </Stack>
          <Box sx={{ height: 6, borderRadius: 3, bgcolor: COLORS.border.faint, overflow: 'hidden' }}>
            <Box
              className="pshow-progress"
              sx={{ height: '100%', borderRadius: 3, bgcolor: COLORS.brand.primary }}
            />
          </Box>
        </Box>
      );
    }

    case 'chip':
      // The collapsed state of a resolved Confirm card.
      return <PheraChip tone="success" size="small" label={item.text} />;

    case 'vendor':
      // A vendor-directory match, echoing the right-pane listing cards.
      return (
        <Box
          sx={{
            width: '100%',
            maxWidth: 360,
            bgcolor: COLORS.bg.white,
            border: `1px solid ${COLORS.border.light}`,
            borderRadius: RADII.lg,
            boxShadow: SHADOWS.card,
            px: 1.75,
            py: 1.5,
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                bgcolor: COLORS.brand.primarySubtle,
                color: COLORS.brand.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: FONTS.body,
                fontSize: '1.1rem',
                fontWeight: 700,
                flex: 'none',
              }}
            >
              {item.name[0]}
            </Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                noWrap
                sx={{ fontFamily: FONTS.body, fontSize: '0.9375rem', fontWeight: 700, color: COLORS.text.strong }}
              >
                {item.name}
              </Typography>
              <Typography
                noWrap
                sx={{ fontFamily: FONTS.body, fontSize: '0.9375rem', color: COLORS.text.muted, lineHeight: 1.3 }}
              >
                {item.category} · {item.city}
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1.25, flexWrap: 'wrap', rowGap: 0.5 }}>
            <Stack direction="row" alignItems="center" spacing={0.25}>
              <StarRoundedIcon sx={{ fontSize: 16, color: COLORS.cultural.gold }} />
              <Typography sx={{ fontFamily: FONTS.body, fontSize: '0.9375rem', fontWeight: 600, color: COLORS.text.strong }}>
                {item.rating}
              </Typography>
              <Typography sx={{ fontFamily: FONTS.body, fontSize: '0.9375rem', color: COLORS.text.subtle }}>
                ({item.reviews})
              </Typography>
            </Stack>
            <Typography sx={{ fontFamily: FONTS.body, fontSize: '0.9375rem', color: COLORS.text.muted }}>
              {item.price}
            </Typography>
            <PheraChip size="small" tone="brand" label={item.badge} />
          </Stack>
          <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
            <MockButton primary>Choose</MockButton>
            <MockButton>See their work</MockButton>
          </Stack>
        </Box>
      );

    case 'confirm':
      return (
        <Box
          sx={{
            maxWidth: '85%',
            border: `1px solid ${COLORS.brand.primaryBorder}`,
            bgcolor: COLORS.brand.primaryWash,
            borderRadius: RADII.lg,
            px: 2,
            py: 1.5,
          }}
        >
          <Typography
            sx={{
              fontFamily: FONTS.body,
              fontSize: '0.9375rem',
              fontWeight: 600,
              color: COLORS.text.strong,
              mb: 1,
            }}
          >
            Confirm: {item.label}
          </Typography>
          <Typography
            sx={{
              fontFamily: FONTS.body,
              fontSize: '0.9375rem',
              lineHeight: 1.5,
              color: COLORS.text.muted,
              mb: 1,
            }}
          >
            {item.summary}
          </Typography>
          <Typography
            sx={{ fontFamily: FONTS.body, fontSize: '0.9375rem', color: COLORS.text.subtle, mb: 1.25 }}
          >
            Why: {item.reason}
          </Typography>
          <Stack direction="row" spacing={1}>
            <MockButton primary>Confirm</MockButton>
            <MockButton>Edit…</MockButton>
            <MockButton>Decline</MockButton>
          </Stack>
        </Box>
      );
  }
}

/**
 * Decorative stand-in for PrimaryActionButton / SecondaryActionButton
 * (small) — spans, not buttons, so keyboard users never tab into dead
 * controls. Styling mirrors PRIMARY_BUTTON_SX / SECONDARY_BUTTON_SX.
 */
function MockButton({ primary, children }: { primary?: boolean; children: React.ReactNode }) {
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 1.5,
        py: 0.5,
        borderRadius: RADII.md,
        fontFamily: FONTS.body,
        fontSize: '0.9375rem',
        fontWeight: 600,
        lineHeight: 1.6,
        userSelect: 'none',
        ...(primary
          ? { bgcolor: COLORS.brand.primary, color: COLORS.text.inverse }
          : {
              bgcolor: COLORS.bg.white,
              color: COLORS.text.strong,
              border: `1px solid ${COLORS.text.strong}`,
            }),
      }}
    >
      {children}
    </Box>
  );
}
