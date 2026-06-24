'use client';

/**
 * "Meet your planner" — the voice-forward centerpiece, sits right after the
 * Hero and before the FeatureStepper. The hero promises "chat or voice"; this
 * section proves the VOICE half: the real VoiceOrb cycles idle → listening →
 * thinking → speaking while a scripted transcript shows the planner updating
 * real wedding data as the couple talks. Reuses VoiceOrb, SectionHeader, and
 * the landing `section`/`container` rails so it matches the rest of the page.
 */

import { useEffect, useState } from 'react';
import MicRoundedIcon from '@mui/icons-material/MicRounded';
import { ActionButton } from '@/components/admin/ActionButton';
import { COLORS, RADII, SHADOWS } from '@/lib/theme/tokens';
import { VoiceOrb, type OrbState } from '@/components/agent/VoiceOrb';
import { SectionHeader } from './design-primitives';

type Step = { state: OrbState; caption: string; lines: number; chips: number; dur: number };

// One ~14.6s loop. `lines`/`chips` are how much of the transcript is revealed at
// each beat (bubbles fade in/out by opacity so the loop restart is smooth).
const SEQUENCE: Step[] = [
  { state: 'idle', caption: 'Ready when you are', lines: 0, chips: 0, dur: 1300 },
  { state: 'listening', caption: 'Listening…', lines: 1, chips: 0, dur: 2300 },
  { state: 'thinking', caption: 'Thinking…', lines: 1, chips: 0, dur: 1100 },
  { state: 'speaking', caption: 'Speaking…', lines: 2, chips: 1, dur: 2700 },
  { state: 'listening', caption: 'Listening…', lines: 3, chips: 1, dur: 2300 },
  { state: 'thinking', caption: 'Thinking…', lines: 3, chips: 1, dur: 1100 },
  { state: 'speaking', caption: 'Speaking…', lines: 4, chips: 2, dur: 2700 },
  { state: 'idle', caption: 'All set', lines: 4, chips: 2, dur: 1100 },
];

type Turn = { role: 'you' | 'planner'; text: string; chip?: string };

const TRANSCRIPT: Turn[] = [
  { role: 'you', text: 'We booked the Leela in Udaipur — April 12–14, about 250 guests.' },
  { role: 'planner', text: "Gorgeous pick. Dates and venue are in — starting your room blocks now.", chip: 'Venue + dates' },
  { role: 'you', text: 'My brother and his wife land Wednesday — add them to the shuttle.' },
  { role: 'planner', text: "Done. When do they land, and from where? I'll set their pickup.", chip: 'Shuttle · +2 guests' },
];

const BULLETS = [
  'Voice or chat — whichever feels natural in the moment',
  'Updates your real data live: guests, RSVPs, rooms, vendors, schedule',
  'Proactive — spots gaps and confirms before any big change',
];

export default function MeetYourPlannerSection() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Honor reduced-motion: hold the final, fully-revealed state and don't cycle.
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setStep(SEQUENCE.length - 1);
      return;
    }
    let i = 0;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      setStep(i);
      const dur = SEQUENCE[i].dur;
      i = (i + 1) % SEQUENCE.length;
      timer = setTimeout(tick, dur);
    };
    tick();
    return () => clearTimeout(timer);
  }, []);

  const cur = SEQUENCE[step];
  // Pure ordinal for each chip-bearing turn (1st chip = 1, 2nd = 2…) — computed
  // per item so nothing mutates during render.
  const chipOrdinalAt = (i: number) => TRANSCRIPT.slice(0, i + 1).filter((t) => t.chip).length;

  return (
    <section id="meet-planner" className="section" style={{ background: 'var(--white)' }}>
      <div className="container">
        <SectionHeader
          align="center"
          eyebrow="Meet your planner"
          title="Say it out loud."
          kicker="One AI wedding planner you run by voice or chat. Wherever you are — newly engaged or down to the final week — just say what's happening and watch your whole wedding update in real time."
        />

        <div className="myp-stage">
          <div className="myp-orb" aria-hidden>
            <VoiceOrb state={cur.state} size={300} />
          </div>

          <p className="myp-caption" role="status" aria-live="polite">
            {cur.caption}
          </p>

          {/* Scripted proof — desktop only (hidden under 960px to stay minimal). */}
          <div className="myp-transcript" aria-hidden>
            {TRANSCRIPT.map((t, i) => {
              const visible = i < cur.lines;
              const isPlanner = t.role === 'planner';
              const chipVisible = !!t.chip && visible && cur.chips >= chipOrdinalAt(i);
              return (
                <div
                  key={i}
                  className="myp-row"
                  style={{
                    alignItems: isPlanner ? 'flex-start' : 'flex-end',
                    opacity: visible ? 1 : 0,
                    transform: visible ? 'translateY(0)' : 'translateY(6px)',
                  }}
                >
                  <div
                    className="myp-bubble"
                    style={{
                      alignSelf: isPlanner ? 'flex-start' : 'flex-end',
                      background: isPlanner ? COLORS.bg.white : COLORS.brand.primaryWash,
                      border: `1px solid ${isPlanner ? COLORS.border.faint : COLORS.brand.primaryBorder}`,
                      color: COLORS.text.strong,
                      boxShadow: SHADOWS.card,
                    }}
                  >
                    {!isPlanner && (
                      <MicRoundedIcon sx={{ fontSize: 15, color: COLORS.brand.primary, mr: 0.75, verticalAlign: '-2px' }} />
                    )}
                    {t.text}
                  </div>
                  {t.chip && (
                    <span
                      className="myp-chip"
                      style={{
                        background: COLORS.accent.successBg,
                        color: COLORS.accent.successText,
                        opacity: chipVisible ? 1 : 0,
                        transform: chipVisible ? 'scale(1)' : 'scale(0.85)',
                      }}
                    >
                      ✓ Updated · {t.chip}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <ul className="myp-points">
            {BULLETS.map((b) => (
              <li key={b}>
                <span className="myp-check" aria-hidden>
                  ✓
                </span>
                {b}
              </li>
            ))}
          </ul>

          <div className="myp-ctas">
            <ActionButton
              href="/auth/login"
              variant="contained"
              className="btn btn-primary"
              sx={{
                fontSize: { xs: 15, sm: 16 },
                padding: { xs: '13px 22px', sm: '16px 28px' },
                borderRadius: RADII.pill,
                textTransform: 'none',
                fontWeight: 600,
                bgcolor: 'var(--accent)',
                color: COLORS.text.inverse,
                '&:hover': { bgcolor: 'var(--accent-hover)' },
              }}
              endIcon={
                <span className="btn-arrow" style={{ display: 'inline-block' }}>
                  →
                </span>
              }
            >
              Start a conversation
            </ActionButton>
            <ActionButton
              href="/demo"
              variant="outlined"
              className="btn btn-ghost"
              spinnerColor={COLORS.brand.primary}
              sx={{
                fontSize: { xs: 15, sm: 16 },
                padding: { xs: '13px 22px', sm: '16px 28px' },
                borderRadius: RADII.pill,
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              Watch the demo
            </ActionButton>
          </div>
        </div>
      </div>

      <style>{`
        .myp-stage {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          margin-top: 40px;
        }
        .myp-orb { transform: scale(1); transform-origin: center; transition: transform 0.3s ease; }
        .myp-caption {
          margin: 18px 0 0;
          font-family: var(--mono);
          font-size: 14px;
          letter-spacing: 0.04em;
          color: var(--text-subtle);
          min-height: 1.2em;
          transition: opacity 0.2s ease;
        }
        .myp-transcript {
          width: 100%;
          max-width: 460px;
          margin: 28px auto 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
          text-align: left;
        }
        .myp-row {
          display: flex;
          flex-direction: column;
          gap: 6px;
          transition: opacity 0.4s ease, transform 0.4s ease;
        }
        .myp-bubble {
          max-width: 88%;
          padding: 12px 16px;
          border-radius: ${RADII.lg};
          font-size: 15px;
          line-height: 1.45;
        }
        .myp-chip {
          align-self: flex-start;
          font-family: var(--mono);
          font-size: 0.875rem;
          font-weight: 600;
          letter-spacing: 0.04em;
          padding: 5px 11px;
          border-radius: ${RADII.pill};
          transition: opacity 0.28s ease, transform 0.28s ease;
        }
        .myp-points {
          list-style: none;
          padding: 0;
          margin: 32px auto 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-width: 520px;
          text-align: left;
        }
        .myp-points li {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-size: 15px;
          line-height: 1.5;
          color: var(--text-strong);
        }
        .myp-check { color: var(--accent); font-weight: 700; flex: none; margin-top: 1px; }
        .myp-ctas {
          display: flex;
          gap: 12px;
          margin-top: 36px;
          justify-content: center;
          flex-wrap: wrap;
        }
        @media (max-width: 960px) {
          .myp-transcript { display: none; }
          .myp-orb { transform: scale(0.86); }
        }
        @media (max-width: 600px) {
          .myp-orb { transform: scale(0.66); }
          .myp-points { margin-top: 24px; }
          .myp-ctas { flex-direction: column; width: 100%; max-width: 320px; }
          .myp-ctas > * { width: 100%; }
        }
        @media (prefers-reduced-motion: reduce) {
          .myp-row, .myp-chip, .myp-caption, .myp-orb { transition: none; }
        }
      `}</style>
    </section>
  );
}
